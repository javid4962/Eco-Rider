import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OccCommandWallService } from '../src/modules/occ-command-wall/occ-command-wall.service';
import { OccPostureAudit } from '../src/database/entities/occ-posture-audit.entity';
import { OccOperationalPosture } from '@ecoride/contracts';

describe('OccCommandWallService (M100 - Century Milestone)', () => {
  let service: OccCommandWallService;
  let repo: Partial<Record<keyof Repository<OccPostureAudit>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-incident-uuid', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccCommandWallService,
        {
          provide: getRepositoryToken(OccPostureAudit),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<OccCommandWallService>(OccCommandWallService);
  });

  it('should deliver real-time operational posture and fleet health metrics across the unified platform', async () => {
    const health = await service.getOccHealthSummary();

    expect(health.activePassengerVehicles).toBeGreaterThan(0);
    expect(health.activeCargoVans).toBeGreaterThan(0);
    expect(health.activeMicroMobilityUnits).toBeGreaterThan(0);
    expect(health.chargingGunUtilizationPercent).toBeGreaterThan(0);
    expect(health.bessStoredEnergyKwh).toBeGreaterThan(0);
    expect(health.posture).toBe(OccOperationalPosture.NORMAL_CIVIL_OPERATION);
  });

  it('should transition operational posture to CYCLONE_EMERGENCY_MOBILITY and log immutable audit record', async () => {
    const result = await service.switchOperationalPosture(
      {
        incidentCode: 'INC-CYCLONE-AP-2026-01',
        sourceMilestone: 'M80_CYCLONE_RESILIENCE',
        severity: 'CRITICAL',
        description: 'Severe cyclonic storm landfall predicted at Machilipatnam / Krishna delta.',
        targetZone: 'ZONE-KRISHNA-LOWLANDS',
        recommendedPosture: OccOperationalPosture.CYCLONE_EMERGENCY_MOBILITY,
      },
      'INCIDENT_COMMANDER_01',
    );

    expect(result.incidentId).toBeDefined();
    expect(result.previousPosture).toBe(OccOperationalPosture.NORMAL_CIVIL_OPERATION);
    expect(result.newPosture).toBe(OccOperationalPosture.CYCLONE_EMERGENCY_MOBILITY);
    expect(result.affectedVehicleCount).toBe(162);
    expect(result.systemBroadcastSent).toBe(true);
    expect(result.authorizedBy).toBe('INCIDENT_COMMANDER_01');
    expect(repo.save).toHaveBeenCalled();

    // Verify subsequent health check reflects new posture
    const updatedHealth = await service.getOccHealthSummary();
    expect(updatedHealth.posture).toBe(OccOperationalPosture.CYCLONE_EMERGENCY_MOBILITY);
    expect(updatedHealth.activeAlertsCount).toBeGreaterThan(0);
  });
});
