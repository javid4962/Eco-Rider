import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { V2vRescueService } from '../src/modules/v2v-rescue/v2v-rescue.service';
import { V2vRescueMission } from '../src/database/entities/v2v-rescue-mission.entity';
import { V2vRescueStatus } from '@ecoride/contracts';

describe('V2vRescueService (M79)', () => {
  let service: V2vRescueService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'v2v-mission-01', ...dto })),
      save: jest.fn().mockImplementation(async (m) => ({ ...m })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V2vRescueService,
        {
          provide: getRepositoryToken(V2vRescueMission),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<V2vRescueService>(V2vRescueService);
  });

  it('should reject rescue request if SoC is not critically depleted (>=15%)', async () => {
    await expect(
      service.dispatchRescue({
        strandedVehicleId: 'veh-ok-01',
        captainId: 'capt-01',
        latitude: 16.49,
        longitude: 80.65,
        currentSocPercent: 28.0,
        batteryCapacityKwh: 40.0,
        targetKwhRequired: 10.0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should dispatch mobile power bank with base fee and 18% AP GST for critically stranded EV', async () => {
    const result = await service.dispatchRescue({
      strandedVehicleId: 'veh-stranded-01',
      captainId: 'capt-stranded-01',
      latitude: 16.42,
      longitude: 80.55,
      currentSocPercent: 4.0, // Critical
      batteryCapacityKwh: 50.0,
      targetKwhRequired: 12.0,
      highwayOrCorridorName: 'NH-16 Kaza Tollway',
    });

    expect(result.status).toBe(V2vRescueStatus.DISPATCHED);
    expect(result.baseDispatchFeePaise).toBe(35000); // ₹350
    // 12 kWh * ₹12 = ₹144 (14,400 paise). Subtotal = 49,400 paise. GST 18% = 8,892 paise. Total = 58,292 paise
    expect(result.energyFeePaise).toBe(14400);
    expect(result.gstPaise).toBe(8892);
    expect(result.totalCostPaise).toBe(58292);
  });

  it('should finalize billing when rescue charging is completed', async () => {
    const activeMission = {
      id: 'v2v-mission-01',
      rescueVehicleId: 'RESCUE-VAN-AP16-01',
      rescueCaptainId: 'CAPT-RESCUE-LEAD-01',
      strandedVehicleId: 'veh-stranded-01',
      baseDispatchFeePaise: 35000,
      status: V2vRescueStatus.DISPATCHED,
    };
    mockRepo.findOne.mockResolvedValue(activeMission);

    const completed = await service.completeRescue('v2v-mission-01', 10.0);

    expect(completed.status).toBe(V2vRescueStatus.COMPLETED);
    expect(completed.transferredKwh).toBe(10.0);
    // 10 kWh * ₹12 = ₹120 (12,000 paise). Subtotal = 47,000 paise. GST = 8,460 paise. Total = 55,460 paise.
    expect(completed.energyFeePaise).toBe(12000);
    expect(completed.gstPaise).toBe(8460);
    expect(completed.totalCostPaise).toBe(55460);
  });
});
