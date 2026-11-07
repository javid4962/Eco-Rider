import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisasterFleetMobilizationService } from '../src/modules/disaster-fleet-mobilization/disaster-fleet-mobilization.service';
import { DisasterMobilizationLog } from '../src/database/entities/disaster-mobilization-log.entity';
import { DisasterMobilizationStage } from '@ecoride/contracts';

describe('DisasterFleetMobilizationService (M108)', () => {
  let service: DisasterFleetMobilizationService;
  let repo: Partial<Record<keyof Repository<DisasterMobilizationLog>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-disaster-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisasterFleetMobilizationService,
        {
          provide: getRepositoryToken(DisasterMobilizationLog),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<DisasterFleetMobilizationService>(DisasterFleetMobilizationService);
  });

  it('should pause civilian ride bookings and mobilize 80 EVs for APSDMA emergency coastal evacuation', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);

    const result = await service.processMobilizationOrder({
      incidentReference: 'INC-APSDMA-CYCLONE-RELIEF-01',
      commandingAgency: 'APSDMA',
      targetZones: ['ZONE-KRISHNA-COASTAL', 'ZONE-MACHILIPATNAM-CORRIDOR'],
      mobilizationStage: DisasterMobilizationStage.ACTIVE_EVACUATION,
      requisitionFleetTargetCount: 80,
    });

    expect(result.incidentReference).toBe('INC-APSDMA-CYCLONE-RELIEF-01');
    expect(result.mobilizationStage).toBe(DisasterMobilizationStage.ACTIVE_EVACUATION);
    expect(result.civilianBookingPaused).toBe(true);
    expect(result.totalRequisitionedVehicles).toBe(80);
    expect(result.evacuatedCitizensCount).toBe(320); // 80 vehicles * 4 passengers
    expect(repo.save).toHaveBeenCalled();
  });

  it('should resume normal civilian bookings when disaster stage transitions to STAND_DOWN_RECOVERY', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-disaster-id',
      incidentReference: 'INC-APSDMA-CYCLONE-RELIEF-01',
      commandingAgency: 'APSDMA',
      mobilizationStage: DisasterMobilizationStage.ACTIVE_EVACUATION,
      civilianBookingPaused: true,
      totalRequisitionedVehicles: 80,
      evacuatedCitizensCount: 320,
    });

    const result = await service.processMobilizationOrder({
      incidentReference: 'INC-APSDMA-CYCLONE-RELIEF-01',
      commandingAgency: 'APSDMA',
      targetZones: ['ZONE-KRISHNA-COASTAL'],
      mobilizationStage: DisasterMobilizationStage.STAND_DOWN_RECOVERY,
      requisitionFleetTargetCount: 0,
    });

    expect(result.mobilizationStage).toBe(DisasterMobilizationStage.STAND_DOWN_RECOVERY);
    expect(result.civilianBookingPaused).toBe(false);
    expect(result.totalRequisitionedVehicles).toBe(0);
  });
});

