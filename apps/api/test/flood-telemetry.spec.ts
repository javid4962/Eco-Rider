import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloodTelemetryService } from '../src/modules/flood-telemetry/flood-telemetry.service';
import { FloodDepthAssessment } from '../src/database/entities/flood-depth-assessment.entity';
import { FloodRiskSeverity, VehicleClearanceClass } from '@ecoride/contracts';

describe('FloodTelemetryService (M101)', () => {
  let service: FloodTelemetryService;
  let repo: Partial<Record<keyof Repository<FloodDepthAssessment>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-flood-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FloodTelemetryService,
        {
          provide: getRepositoryToken(FloodDepthAssessment),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<FloodTelemetryService>(FloodTelemetryService);
  });

  it('should confirm dry roadway safety under 100mm water depth', async () => {
    const result = await service.ingestFloodDepth({
      corridorSegmentId: 'CORRIDOR-KRISHNA-DELTA-01',
      sensorLocation: 'Prakasam Barrage North Bank, Vijayawada',
      waterDepthMm: 45,
      latitude: 16.5085,
      longitude: 80.6052,
      recordedAt: new Date().toISOString(),
    });

    expect(result.severity).toBe(FloodRiskSeverity.SAFE_DRY);
    expect(result.isCorridorClosed).toBe(false);
    expect(result.prohibitedClasses).toHaveLength(0);
    expect(result.recommendedDetour).toBeNull();
    expect(repo.save).toHaveBeenCalled();
  });

  it('should restrict low-clearance electric sedans/hatchbacks when water exceeds 150mm (AIS-038 limit)', async () => {
    const result = await service.ingestFloodDepth({
      corridorSegmentId: 'CORRIDOR-GUNTUR-CANAL-02',
      sensorLocation: 'Karakatta Embankment Road, Vijayawada',
      waterDepthMm: 175,
      latitude: 16.4950,
      longitude: 80.6120,
      recordedAt: new Date().toISOString(),
    });

    expect(result.severity).toBe(FloodRiskSeverity.LOW_WATER_CAUTION);
    expect(result.isCorridorClosed).toBe(false);
    expect(result.prohibitedClasses).toContain(VehicleClearanceClass.SEDAN_HATCHBACK_4W);
    expect(result.recommendedDetour).toContain('Bypass low-lying culvert');
  });

  it('should trigger full corridor closure when flood depth exceeds 250mm', async () => {
    const result = await service.ingestFloodDepth({
      corridorSegmentId: 'CORRIDOR-BHAVANIPURAM-03',
      sensorLocation: 'Bhavanipuram Lowlands Culvert, Vijayawada',
      waterDepthMm: 310,
      latitude: 16.5200,
      longitude: 80.5900,
      recordedAt: new Date().toISOString(),
    });

    expect(result.severity).toBe(FloodRiskSeverity.CRITICAL_SUBMERSION_RISK);
    expect(result.isCorridorClosed).toBe(true);
    expect(result.prohibitedClasses).toContain(VehicleClearanceClass.SUV_PREMIUM_4W);
    expect(result.recommendedDetour).toContain('Mandatory diversion via Amaravathi Inner Ring Flyover');
  });
});

