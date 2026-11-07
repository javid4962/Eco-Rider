import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChargingCableThermalSafeguardService } from '../src/modules/charging-cable-thermal-safeguard/charging-cable-thermal-safeguard.service';
import { ChargingCableThermalSafeguardController } from '../src/modules/charging-cable-thermal-safeguard/charging-cable-thermal-safeguard.controller';
import { ChargingCableThermalLogEntity } from '../src/database/entities/charging-cable-thermal-log.entity';

describe('ChargingCableThermalSafeguardModule', () => {
  let service: ChargingCableThermalSafeguardService;
  let controller: ChargingCableThermalSafeguardController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-thermal-uuid',
      recordedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargingCableThermalSafeguardController],
      providers: [
        ChargingCableThermalSafeguardService,
        {
          provide: getRepositoryToken(ChargingCableThermalLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ChargingCableThermalSafeguardService>(ChargingCableThermalSafeguardService);
    controller = module.get<ChargingCableThermalSafeguardController>(ChargingCableThermalSafeguardController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should maintain normal charging when cable temperature is safe (< 70°C)', async () => {
    const result = await controller.evaluateThermalReading({
      chargerBayId: 'BAY-CCS2-01',
      vehicleId: 'EV-AP37-1234',
      cableTemperatureCelsius: 52,
      ambientTemperatureCelsius: 38,
      currentAmps: 150,
      targetAmps: 150,
    });

    expect(result.actionTaken).toBe('NORMAL');
    expect(result.adjustedAmps).toBe(150);
    expect(result.alertLevel).toBe('GREEN');
  });

  it('should throttle current by 40% when cable heats up to 74°C', async () => {
    const result = await controller.evaluateThermalReading({
      chargerBayId: 'BAY-CCS2-01',
      vehicleId: 'EV-AP37-1234',
      cableTemperatureCelsius: 74,
      ambientTemperatureCelsius: 43,
      currentAmps: 150,
      targetAmps: 150,
    });

    expect(result.actionTaken).toBe('THROTTLE_CURRENT');
    expect(result.adjustedAmps).toBe(90); // 150 * 0.6 = 90
    expect(result.alertLevel).toBe('YELLOW');
  });

  it('should trigger emergency galvanic cutoff when cable exceeds 85°C', async () => {
    const result = await controller.evaluateThermalReading({
      chargerBayId: 'BAY-CCS2-01',
      vehicleId: 'EV-AP37-1234',
      cableTemperatureCelsius: 89,
      ambientTemperatureCelsius: 44,
      currentAmps: 150,
      targetAmps: 150,
    });

    expect(result.actionTaken).toBe('EMERGENCY_SHUTDOWN');
    expect(result.adjustedAmps).toBe(0);
    expect(result.alertLevel).toBe('CRITICAL');
  });
});
