import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BatterySwapService } from '../src/modules/battery-swap/battery-swap.service';
import { BatterySwapController } from '../src/modules/battery-swap/battery-swap.controller';
import { BatterySwapStation } from '../src/database/entities/battery-swap-station.entity';
import { BatterySwapTransaction } from '../src/database/entities/battery-swap-transaction.entity';
import { GridTariffWindow } from '../src/database/entities/grid-tariff-window.entity';
import { BatteryPackModel, SwapStationStatus, GridTariffZone } from '@ecoride/contracts';

describe('BatterySwapService (M31 & M32)', () => {
  let service: BatterySwapService;
  let mockStationRepo: any;
  let mockSwapTxRepo: any;
  let mockTariffRepo: any;

  beforeEach(async () => {
    mockStationRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    mockSwapTxRepo = {
      findOne: jest.fn(),
      create: jest.fn((e) => ({ ...e, id: 'tx-uuid-123', swappedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'tx-uuid-123' })),
    };

    mockTariffRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatterySwapController],
      providers: [
        BatterySwapService,
        { provide: getRepositoryToken(BatterySwapStation), useValue: mockStationRepo },
        { provide: getRepositoryToken(BatterySwapTransaction), useValue: mockSwapTxRepo },
        { provide: getRepositoryToken(GridTariffWindow), useValue: mockTariffRepo },
      ],
    }).compile();

    service = module.get<BatterySwapService>(BatterySwapService);
  });

  it('should list seeded battery swap stations when DB has no rows', async () => {
    const stations = await service.listStations('vijayawada');
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0].city).toBe('vijayawada');
    expect(stations[0].status).toBe(SwapStationStatus.OPERATIONAL);
    expect(stations[0].availableChargedPacks).toBeGreaterThan(0);
  });

  it('should execute an atomic battery swap, apply 18% AP GST (SAC 9987), and dispense pack', async () => {
    mockStationRepo.findOne.mockResolvedValue({
      id: 'stn-001',
      stationCode: 'BSS-VJA-BENZ',
      name: 'Benz Circle Swap Station',
      availableChargedPacks: 5,
      chargingPacks: 2,
      swapFeePaise: 10000, // ₹100.00
    });

    const receipt = await service.executeSwap({
      stationId: 'stn-001',
      vehicleRegistrationNumber: 'AP-39-EV-1234',
      depositedPackSerial: 'DEP-PACK-999',
      depositedPackSocPercent: 15.0,
      requestedModel: BatteryPackModel.LFP_48V_30AH,
    });

    expect(receipt.baseSwapFeePaise).toBe(10000);
    expect(receipt.taxPaise).toBe(1800); // 18% GST = ₹18.00
    expect(receipt.totalAmountPaise).toBe(11800); // ₹118.00
    expect(receipt.dispensedSocPercent).toBe(100.0);
    expect(mockStationRepo.save).toHaveBeenCalled();
  });

  it('should return existing receipt when idempotency key is replayed', async () => {
    mockSwapTxRepo.findOne.mockResolvedValue({
      id: 'tx-existing-1',
      stationCode: 'BSS-VJA-BENZ',
      vehicleRegistrationNumber: 'AP-39-EV-1234',
      depositedPackSerial: 'DEP-PACK-999',
      depositedSocPercent: 15,
      dispensedPackSerial: 'DISP-PACK-100',
      dispensedSocPercent: 100,
      energyReplenishedKwh: 3.6,
      baseSwapFeePaise: 10000,
      taxPaise: 1800,
      totalAmountPaise: 11800,
      swappedAt: new Date(),
    });

    const receipt = await service.executeSwap({
      stationId: 'stn-001',
      vehicleRegistrationNumber: 'AP-39-EV-1234',
      depositedPackSerial: 'DEP-PACK-999',
      depositedPackSocPercent: 15.0,
      requestedModel: BatteryPackModel.LFP_48V_30AH,
      idempotencyKey: 'idemp-swap-001',
    });

    expect(receipt.swapTransactionId).toBe('tx-existing-1');
  });

  it('should reject swap if no charged packs are available', async () => {
    mockStationRepo.findOne.mockResolvedValue({
      id: 'stn-empty',
      availableChargedPacks: 0,
      swapFeePaise: 10000,
    });

    await expect(
      service.executeSwap({
        stationId: 'stn-empty',
        vehicleRegistrationNumber: 'AP-39-EV-1234',
        depositedPackSerial: 'DEP-PACK-999',
        depositedPackSocPercent: 15.0,
        requestedModel: BatteryPackModel.LFP_48V_30AH,
      }),
    ).rejects.toThrow('No fully charged battery packs currently available');
  });

  it('should evaluate Time-of-Day dynamic grid tariffs with Solar Peak discount', async () => {
    const tariffs = await service.getGridTariffWindows();
    expect(tariffs.length).toBe(3);
    const solarPeak = tariffs.find((t) => t.zone === GridTariffZone.SOLAR_PEAK);
    expect(solarPeak).toBeDefined();
    expect(solarPeak?.isGreenEnergyPeak).toBe(true);
    expect(solarPeak?.ratePerKwhPaise).toBe(650); // ₹6.50/kWh
  });

  it('should generate smart charge recommendation saving money during solar peak hours', async () => {
    const rec = await service.getSmartChargeRecommendation('veh-001', 20);
    expect(rec.isOptimizedForSolar).toBe(true);
    expect(rec.estimatedSavingsVsPeakPaise).toBeGreaterThan(0);
    expect(rec.tariffZone).toBe(GridTariffZone.SOLAR_PEAK);
  });
});
