import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DisasterRecoveryService } from '../src/modules/disaster-recovery/disaster-recovery.service';
import { DrReplicationHealth } from '../src/database/entities/dr-replication-health.entity';
import { ReplicationSyncState } from '@ecoride/contracts';

describe('DisasterRecoveryService (Milestone M60)', () => {
  let service: DisasterRecoveryService;

  const mockRecords: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(() => {
      if (mockRecords.length === 0) return Promise.resolve(null);
      return Promise.resolve(mockRecords[mockRecords.length - 1]);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `dr-${Date.now()}`,
      ...dto,
      recordedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((record) => {
      mockRecords.push(record);
      return Promise.resolve(record);
    }),
  };

  beforeEach(async () => {
    mockRecords.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisasterRecoveryService,
        { provide: getRepositoryToken(DrReplicationHealth), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DisasterRecoveryService>(DisasterRecoveryService);
  });

  it('should return default healthy multi-AZ replication status when no records exist', async () => {
    const health = await service.getReplicationHealth();

    expect(health).toBeDefined();
    expect(health.healthy).toBe(true);
    expect(health.syncState).toBe(ReplicationSyncState.STREAMING_HEALTHY);
    expect(health.regionalDataCenter).toBe('AP-CENTRAL-VIJAYAWADA -> AP-EAST-AMARAVATHI');
    expect(health.replicationLagSeconds).toBeLessThan(1.0);
  });

  it('should record heartbeat and return updated replica status', async () => {
    const status = await service.recordHeartbeat({
      primaryNodeId: 'pg-primary-01',
      standbyNodeId: 'pg-standby-02',
      replicationLagBytes: 1024,
      replicationLagSeconds: 0.12,
    });

    expect(status.primaryNodeId).toBe('pg-primary-01');
    expect(status.replicationLagBytes).toBe(1024);
    expect(mockRecords.length).toBe(1);
  });

  it('should simulate failover drill with sub-second RPO and sub-30s RTO', async () => {
    const drill = await service.simulateFailoverDrill('pg-standby-ap-east-02');

    expect(drill.success).toBe(true);
    expect(drill.promotedStandbyNodeId).toBe('pg-standby-ap-east-02');
    expect(drill.rpoSecondsAchieved).toBeLessThanOrEqual(1.0);
    expect(drill.rtoSecondsAchieved).toBeLessThanOrEqual(30.0);
  });

  it('should throw BadRequestException if standbyNodeId is missing in failover drill', async () => {
    await expect(service.simulateFailoverDrill('')).rejects.toThrow(BadRequestException);
  });
});

