import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FloodEvacuationRoutingService } from '../src/modules/flood-evacuation-routing/flood-evacuation-routing.service';
import { FloodEvacuationRoutingController } from '../src/modules/flood-evacuation-routing/flood-evacuation-routing.controller';
import { FloodEvacuationAlertEntity } from '../src/database/entities/flood-evacuation-alert.entity';
import { FloodEvacuationRiskSeverity } from '@ecoride/contracts';

describe('FloodEvacuationRoutingModule', () => {
  let service: FloodEvacuationRoutingService;
  let controller: FloodEvacuationRoutingController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-flood-alert-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-flood-alert-uuid') {
        return {
          id: 'mock-flood-alert-uuid',
          sensorLocation: 'Ryves Canal Siphon Underpass, Vijayawada',
          severity: FloodEvacuationRiskSeverity.EVACUATION_MANDATORY,
          rerouteActiveTrips: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FloodEvacuationRoutingController],
      providers: [
        FloodEvacuationRoutingService,
        {
          provide: getRepositoryToken(FloodEvacuationAlertEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FloodEvacuationRoutingService>(FloodEvacuationRoutingService);
    controller = module.get<FloodEvacuationRoutingController>(FloodEvacuationRoutingController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should trigger mandatory evacuation routing and high-ground shelter redirection when flood exceeds 400mm', async () => {
    const alert = await controller.ingest({
      sensorLocation: 'Ryves Canal Siphon Underpass, Vijayawada',
      canalOrWaterBody: 'Ryves Canal',
      zone: 'Vijayawada Urban',
      waterDepthMm: 450.0,
      flowVelocityMps: 2.1,
    });

    expect(alert.severity).toBe(FloodEvacuationRiskSeverity.EVACUATION_MANDATORY);
    expect(alert.rerouteActiveTrips).toBe(true);
    expect(alert.evacuationHubName).toContain('Indira Gandhi Municipal Stadium');
    expect(alert.activeVehiclesNotifiedCount).toBe(45);
  });

  it('should maintain normal status when water level is safe below thresholds', async () => {
    const alert = await controller.ingest({
      sensorLocation: 'Prakasam Barrage Spillway Approach',
      canalOrWaterBody: 'Krishna River',
      zone: 'Vijayawada Central',
      waterDepthMm: 80.0,
      flowVelocityMps: 0.8,
    });

    expect(alert.severity).toBe(FloodEvacuationRiskSeverity.NORMAL);
    expect(alert.rerouteActiveTrips).toBe(false);
    expect(alert.activeVehiclesNotifiedCount).toBe(0);
  });
});
