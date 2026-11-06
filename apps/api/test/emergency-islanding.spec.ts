import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmergencyIslandingService } from '../src/modules/emergency-islanding/emergency-islanding.service';
import { EmergencyPowerMission } from '../src/database/entities/emergency-power-mission.entity';
import { IslandingMissionStatus } from '@ecoride/contracts';

describe('EmergencyIslandingService (Milestone M70)', () => {
  let service: EmergencyIslandingService;

  const mockMissions: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockMissions.find((m) => m.missionId === where.missionId);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `msn-${Date.now()}`,
      ...dto,
      dispatchedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((m) => {
      const idx = mockMissions.findIndex((item) => item.missionId === m.missionId);
      if (idx >= 0) {
        mockMissions[idx] = m;
      } else {
        mockMissions.push(m);
      }
      return Promise.resolve(m);
    }),
  };

  beforeEach(async () => {
    mockMissions.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyIslandingService,
        { provide: getRepositoryToken(EmergencyPowerMission), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<EmergencyIslandingService>(EmergencyIslandingService);
  });

  it('should dispatch emergency power islanding mission to Guntur GGH hospital', async () => {
    const res = await service.dispatchPowerMission({
      targetFacilityName: 'Guntur Government General Hospital (GGH)',
      facilityType: 'HOSPITAL',
      assignedFleetVehicleNumber: 'AP-07-EV-ISL-01',
      inverterCapacityKw: 60,
      batteryReserveKwh: 80,
    });

    expect(res).toBeDefined();
    expect(res.missionId).toMatch(/^MSN-ISL-/);
    expect(res.status).toBe(IslandingMissionStatus.DISPATCHED);
    expect(res.batteryReserveKwh).toBe(80);
    expect(res.inverterCapacityKw).toBe(60);
  });

  it('should complete emergency power mission', async () => {
    const mission = await service.dispatchPowerMission({
      targetFacilityName: 'Vijayawada Flood Relief Cyclone Shelter',
      facilityType: 'CYCLONE_SHELTER',
      assignedFleetVehicleNumber: 'AP-16-EV-ISL-02',
      inverterCapacityKw: 50,
      batteryReserveKwh: 65,
    });

    const completed = await service.completeMission(mission.missionId);
    expect(completed.status).toBe(IslandingMissionStatus.MISSION_COMPLETED);
  });

  it('should reject dispatch if vehicle battery reserve is below minimum 50 kWh', async () => {
    await expect(
      service.dispatchPowerMission({
        targetFacilityName: 'Amaravathi Water Pumping Station',
        facilityType: 'WATER_PUMPING',
        assignedFleetVehicleNumber: 'AP-16-EV-LOW',
        inverterCapacityKw: 50,
        batteryReserveKwh: 35, // Below 50 kWh
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException on completing nonexistent mission', async () => {
    await expect(service.completeMission('MSN-NONEXISTENT')).rejects.toThrow(NotFoundException);
  });
});

