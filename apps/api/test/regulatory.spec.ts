import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegulatoryService } from '../src/modules/regulatory/regulatory.service';
import { RegulatoryController } from '../src/modules/regulatory/regulatory.controller';
import { RegulatoryAuditLog } from '../src/database/entities/regulatory-audit-log.entity';

describe('RegulatoryService (M39)', () => {
  let service: RegulatoryService;
  let mockAuditRepo: any;

  beforeEach(async () => {
    mockAuditRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((e) => ({ ...e, id: 'reg-123', generatedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'reg-123' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulatoryController],
      providers: [
        RegulatoryService,
        { provide: getRepositoryToken(RegulatoryAuditLog), useValue: mockAuditRepo },
      ],
    }).compile();

    service = module.get<RegulatoryService>(RegulatoryService);
  });

  it('should generate official AP-STA open mobility compliance manifest with SHA-256 signature', async () => {
    const manifest = await service.getComplianceSummary();

    expect(manifest.stateTransportAuthority).toBe('AP_STA');
    expect(manifest.stateCode).toBe('37');
    expect(manifest.totalActiveCommercialEvs).toBe(64);
    expect(manifest.iceVehiclesExcludedCount).toBe(14); // 100% BEV rule enforcement
    expect(manifest.digitalSignatureSha256.length).toBe(64); // SHA-256 hex string
    expect(mockAuditRepo.save).toHaveBeenCalled();
  });
});

