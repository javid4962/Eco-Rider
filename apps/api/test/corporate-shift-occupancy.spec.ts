import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CorporateShiftOccupancyService } from '../src/modules/corporate-shift-occupancy/corporate-shift-occupancy.service';
import { CorporateShiftOccupancyController } from '../src/modules/corporate-shift-occupancy/corporate-shift-occupancy.controller';
import { CorporateShiftReconciliationEntity } from '../src/database/entities/corporate-shift-reconciliation.entity';

describe('CorporateShiftOccupancyModule', () => {
  let service: CorporateShiftOccupancyService;
  let controller: CorporateShiftOccupancyController;

  const mockRecord: Partial<CorporateShiftReconciliationEntity> = {
    id: 'mock-recon-uuid',
    manifestId: 'MNF-MEDHA-MORNING-01',
    routeId: 'ROUTE-BENZ-MEDHA-SHUTTLE',
    totalScheduled: 14,
    totalBoarded: 12,
    totalAbsent: 2,
    vehicleCapacity: 14,
    occupancyRatePct: 85.7,
    skippedStopsCount: 1,
    reconciledAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-recon-uuid',
      reconciledAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { manifestId } }) => {
      if (manifestId === 'MNF-MEDHA-MORNING-01') {
        return mockRecord;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateShiftOccupancyController],
      providers: [
        CorporateShiftOccupancyService,
        {
          provide: getRepositoryToken(CorporateShiftReconciliationEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CorporateShiftOccupancyService>(CorporateShiftOccupancyService);
    controller = module.get<CorporateShiftOccupancyController>(CorporateShiftOccupancyController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should reconcile manifest boardings, calculate load factor and skipped stops', async () => {
    const result = await controller.reconcileManifest({
      manifestId: 'MNF-MEDHA-MORNING-01',
      routeId: 'ROUTE-BENZ-MEDHA-SHUTTLE',
      vehicleCapacity: 14,
      actualBoardings: [
        { employeeId: 'EMP-01', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-02', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-03', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-04', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-05', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-06', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-07', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-08', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-09', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-10', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-11', boardedAt: new Date().toISOString() },
        { employeeId: 'EMP-12', boardedAt: new Date().toISOString() },
      ],
    });

    expect(result.totalBoarded).toBe(12);
    expect(result.occupancyRatePct).toBe(85.7);
    expect(result.totalAbsent).toBe(2);
  });

  it('should fetch occupancy summary for existing manifest', async () => {
    const summary = await controller.getOccupancySummary('MNF-MEDHA-MORNING-01');
    expect(summary.manifestId).toBe('MNF-MEDHA-MORNING-01');
    expect(summary.occupancyRatePct).toBe(85.7);
  });
});
