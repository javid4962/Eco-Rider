import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { EmergencyRescueService } from '../src/modules/rescue/emergency-rescue.service';
import { EmergencyRescueController } from '../src/modules/rescue/emergency-rescue.controller';
import { RescueRequest } from '../src/database/entities/rescue-request.entity';
import { RescueUnit } from '../src/database/entities/rescue-unit.entity';
import { RescueServiceType, RescueDispatchStatus } from '@ecoride/contracts';

describe('EmergencyRescueService (M41)', () => {
  let service: EmergencyRescueService;
  let mockRequestRepo: any;
  let mockUnitRepo: any;

  beforeEach(async () => {
    mockRequestRepo = {
      create: jest.fn((e) => ({ ...e, id: 'req-123', createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      findOne: jest.fn(),
    };

    mockUnitRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'unit-1',
          unitCode: 'RESCUE-VJA-01',
          operatorName: 'EcoRide Rapid Rescue',
          mobileChargerCapacityKw: 30.0,
          currentBatterySocPercent: 92.0,
          currentLatitude: 16.5062,
          currentLongitude: 80.648,
          isAvailable: true,
          serviceRadiusKm: 25.0,
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyRescueController],
      providers: [
        EmergencyRescueService,
        { provide: getRepositoryToken(RescueRequest), useValue: mockRequestRepo },
        { provide: getRepositoryToken(RescueUnit), useValue: mockUnitRepo },
      ],
    }).compile();

    service = module.get<EmergencyRescueService>(EmergencyRescueService);
  });

  it('should dispatch emergency rescue van with 18% AP GST for stranded EV', async () => {
    const res = await service.requestRescue({
      vehicleId: 'v0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP16EV1234',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      serviceType: RescueServiceType.MOBILE_DC_FAST_BOOST,
      latitude: 16.51,
      longitude: 80.65,
      landmark: 'Prakasam Barrage North Gate',
      currentSocPercent: 4.5,
    });

    expect(res.ticketNumber).toContain('RESCUE-');
    expect(res.status).toBe(RescueDispatchStatus.DISPATCHED);
    expect(res.feePaise).toBe(35000); // ₹350.00
    expect(res.gstPaise).toBe(6300); // 18% GST (SAC 9987)
    expect(res.totalAmountPaise).toBe(41300);
    expect(res.estimatedArrivalMinutes).toBe(18);
  });

  it('should reject rescue request if vehicle battery is not critically depleted (> 35%)', async () => {
    await expect(
      service.requestRescue({
        vehicleId: 'v0000000-0000-4000-8000-000000000001',
        vehicleRegistrationNumber: 'AP16EV1234',
        captainId: 'c0000000-0000-4000-8000-000000000001',
        serviceType: RescueServiceType.MOBILE_DC_FAST_BOOST,
        latitude: 16.51,
        longitude: 80.65,
        landmark: 'Benz Circle',
        currentSocPercent: 48.0, // High SoC
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should complete rescue and release unit back to available pool', async () => {
    mockRequestRepo.findOne.mockResolvedValueOnce({
      id: 'req-123',
      ticketNumber: 'RESCUE-TEST-01',
      assignedRescueUnitId: 'unit-1',
      status: RescueDispatchStatus.DISPATCHED,
      createdAt: new Date(),
      feePaise: 35000,
      gstPaise: 6300,
      totalAmountPaise: 41300,
      latitude: 16.51,
      longitude: 80.65,
    });

    mockUnitRepo.findOne.mockResolvedValueOnce({
      id: 'unit-1',
      isAvailable: false,
    });

    const completed = await service.completeRescue('RESCUE-TEST-01');
    expect(completed.status).toBe(RescueDispatchStatus.COMPLETED);
    expect(mockUnitRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: true }));
  });
});

