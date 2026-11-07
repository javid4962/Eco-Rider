import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReeferTelematicsService } from '../src/modules/reefer-telematics/reefer-telematics.service';
import { ReeferTelematicsLog } from '../src/database/entities/reefer-telematics-log.entity';
import { ReeferCargoCategory, ReeferCoolingStatus } from '@ecoride/contracts';

describe('ReeferTelematicsService (M96)', () => {
  let service: ReeferTelematicsService;
  let repo: Partial<Record<keyof Repository<ReeferTelematicsLog>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-log-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReeferTelematicsService,
        {
          provide: getRepositoryToken(ReeferTelematicsLog),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<ReeferTelematicsService>(ReeferTelematicsService);
  });

  it('should maintain optimal status when vaccine temperature matches setpoint within 0.5C', async () => {
    const result = await service.processReeferTelemetry({
      vehicleId: 'REEFER-EV-01',
      consignmentId: 'MED-VACCINE-AIIMS-01',
      cargoCategory: ReeferCargoCategory.PHARMACEUTICAL_VACCINE,
      targetTempCelsius: 4.0,
      currentInternalTempCelsius: 4.2,
      ambientTempCelsius: 36.5,
      compressorRpm: 2500,
      batterySocPercent: 65.0,
    });

    expect(result.status).toBe(ReeferCoolingStatus.OPTIMAL);
    expect(result.commandedSetpointCelsius).toBe(4.0);
    expect(result.commandedCompressorRpm).toBe(2500);
    expect(result.requiresImmediateIntervention).toBe(false);
  });

  it('should adjust setpoint and ramp compressor RPM when excursion risk occurs', async () => {
    const result = await service.processReeferTelemetry({
      vehicleId: 'REEFER-EV-02',
      consignmentId: 'MED-VACCINE-AIIMS-02',
      cargoCategory: ReeferCargoCategory.PHARMACEUTICAL_VACCINE,
      targetTempCelsius: 4.0,
      currentInternalTempCelsius: 5.5, // +1.5C excursion
      ambientTempCelsius: 38.0,
      compressorRpm: 2500,
      batterySocPercent: 55.0,
    });

    expect(result.status).toBe(ReeferCoolingStatus.EXCURSION_RISK);
    expect(result.commandedSetpointCelsius).toBe(3.0); // dialed down by 1.0C
    expect(result.commandedCompressorRpm).toBe(3500);  // boosted
    expect(result.requiresImmediateIntervention).toBe(false);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should reject cooling telemetry when reefer battery is critically depleted (< 15% SoC)', async () => {
    await expect(
      service.processReeferTelemetry({
        vehicleId: 'REEFER-EV-03',
        consignmentId: 'FROZEN-FISH-01',
        cargoCategory: ReeferCargoCategory.FROZEN_PERISHABLE,
        targetTempCelsius: -18.0,
        currentInternalTempCelsius: -15.0,
        ambientTempCelsius: 35.0,
        compressorRpm: 2500,
        batterySocPercent: 12.0, // critically low
      }),
    ).rejects.toThrow('Reefer van battery critically low (< 15% SoC)');
  });
});

