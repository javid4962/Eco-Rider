import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MunicipalGeofencesService } from '../src/modules/municipal-geofences/municipal-geofences.service';
import { MunicipalGeofencesController } from '../src/modules/municipal-geofences/municipal-geofences.controller';
import { MunicipalMicroGeofence } from '../src/database/entities/municipal-micro-geofence.entity';
import { GeofenceRuleType } from '@ecoride/contracts';

describe('MunicipalGeofencesService (M52)', () => {
  let service: MunicipalGeofencesService;
  let mockGeofenceRepo: any;

  beforeEach(async () => {
    mockGeofenceRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'z-1',
          zoneCode: 'VJA_BENZ_BAY_01',
          name: 'Benz Circle Dedicated EV Staging Bay',
          city: 'Vijayawada',
          authority: 'VMC',
          ruleType: GeofenceRuleType.MANDATORY_STAGING_BAY,
          maxStagingVehicles: 8,
          currentStagingVehicles: 3,
          boundaryCoordinates: [
            [16.506, 80.648],
            [16.508, 80.65],
          ],
          isActive: true,
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      create: jest.fn((e) => ({ ...e, id: 'z-new' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MunicipalGeofencesController],
      providers: [
        MunicipalGeofencesService,
        { provide: getRepositoryToken(MunicipalMicroGeofence), useValue: mockGeofenceRepo },
      ],
    }).compile();

    service = module.get<MunicipalGeofencesService>(MunicipalGeofencesService);
  });

  it('should allocate designated staging bay when capacity is available', async () => {
    mockGeofenceRepo.findOne.mockResolvedValueOnce({
      id: 'z-1',
      zoneCode: 'VJA_BENZ_BAY_01',
      ruleType: GeofenceRuleType.MANDATORY_STAGING_BAY,
      maxStagingVehicles: 8,
      currentStagingVehicles: 3,
    });

    const alloc = await service.allocateStagingBay({
      zoneCode: 'VJA_BENZ_BAY_01',
      vehicleRegistrationNumber: 'AP16EV1234',
      captainId: 'c0000000-0000-4000-8000-000000000001',
    });

    expect(alloc.assignedBayNumber).toBe(4);
    expect(alloc.zoneCode).toBe('VJA_BENZ_BAY_01');
    expect(mockGeofenceRepo.save).toHaveBeenCalled();
  });

  it('should reject staging allocation when bay is at full capacity', async () => {
    mockGeofenceRepo.findOne.mockResolvedValueOnce({
      id: 'z-1',
      zoneCode: 'VJA_BENZ_BAY_01',
      ruleType: GeofenceRuleType.MANDATORY_STAGING_BAY,
      maxStagingVehicles: 8,
      currentStagingVehicles: 8, // Full
    });

    await expect(
      service.allocateStagingBay({
        zoneCode: 'VJA_BENZ_BAY_01',
        vehicleRegistrationNumber: 'AP16EV1234',
        captainId: 'c0000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should strictly prohibit staging inside NO_STOPPING_CONGESTION_ZONE', async () => {
    mockGeofenceRepo.findOne.mockResolvedValueOnce({
      id: 'z-2',
      zoneCode: 'GNT_MIRCHI_RESTRICTED',
      name: 'Guntur Market Yard Peak Congestion Corridor',
      ruleType: GeofenceRuleType.NO_STOPPING_CONGESTION_ZONE,
    });

    await expect(
      service.allocateStagingBay({
        zoneCode: 'GNT_MIRCHI_RESTRICTED',
        vehicleRegistrationNumber: 'AP16EV1234',
        captainId: 'c0000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

