import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BmsArcFlashService } from '../src/modules/bms-arc-flash/bms-arc-flash.service';
import { BmsArcFlashController } from '../src/modules/bms-arc-flash/bms-arc-flash.controller';
import { BmsArcFlashEventEntity } from '../src/database/entities/bms-arc-flash-event.entity';
import { ArcFlashHazardLevel } from '@ecoride/contracts';

describe('BmsArcFlashModule', () => {
  let service: BmsArcFlashService;
  let controller: BmsArcFlashController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-arc-flash-uuid',
      evaluatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-arc-flash-uuid') {
        return {
          id: 'mock-arc-flash-uuid',
          hazardLevel: ArcFlashHazardLevel.EMERGENCY_ISOLATION_TRIGGERED,
          contactorIsolationCommanded: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BmsArcFlashController],
      providers: [
        BmsArcFlashService,
        {
          provide: getRepositoryToken(BmsArcFlashEventEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BmsArcFlashService>(BmsArcFlashService);
    controller = module.get<BmsArcFlashController>(BmsArcFlashController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should trigger emergency isolation and arm aerosol suppression when severe cell differential and thermal rise detected', async () => {
    const event = await controller.evaluate({
      vehicleId: 'EV-3W-AP39-1122',
      packSerial: 'PACK-LFP-8831',
      packVoltage: 51.2,
      maxCellDifferentialMilliVolts: 185.0, // > 150 mV critical
      internalResistanceMilliOhms: 145.0,
      temperatureRateOfRiseCelsiusPerSec: 2.8, // > 2.0 C/s thermal surge
    });

    expect(event.hazardLevel).toBe(ArcFlashHazardLevel.EMERGENCY_ISOLATION_TRIGGERED);
    expect(event.contactorIsolationCommanded).toBe(true);
    expect(event.aerosolSuppressionArmed).toBe(true);
    expect(event.recommendedDriverAdvisory).toContain('CRITICAL_ARC_FLASH');
  });

  it('should maintain nominal status when pack differential and impedance are normal', async () => {
    const event = await controller.evaluate({
      vehicleId: 'EV-3W-AP39-1122',
      packSerial: 'PACK-LFP-8831',
      packVoltage: 52.8,
      maxCellDifferentialMilliVolts: 12.0, // Well within limits
      internalResistanceMilliOhms: 35.0,
      temperatureRateOfRiseCelsiusPerSec: 0.1,
    });

    expect(event.hazardLevel).toBe(ArcFlashHazardLevel.NOMINAL);
    expect(event.contactorIsolationCommanded).toBe(false);
    expect(event.aerosolSuppressionArmed).toBe(false);
  });
});

