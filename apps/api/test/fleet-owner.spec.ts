import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetOwnerService } from '../src/modules/fleet-owner/fleet-owner.service';
import { FleetOwnerController } from '../src/modules/fleet-owner/fleet-owner.controller';
import { FleetLeaseContract } from '../src/database/entities/fleet-lease-contract.entity';
import { FleetOwnerSettlement } from '../src/database/entities/fleet-owner-settlement.entity';
import { FleetLeaseModel } from '@ecoride/contracts';

describe('FleetOwnerService (M34)', () => {
  let service: FleetOwnerService;
  let mockContractRepo: any;
  let mockSettlementRepo: any;

  beforeEach(async () => {
    mockContractRepo = {
      create: jest.fn((e) => ({ ...e, id: 'c-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'c-123' })),
      find: jest.fn().mockResolvedValue([]),
    };

    mockSettlementRepo = {
      create: jest.fn((e) => ({ ...e, id: 'set-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'set-123' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetOwnerController],
      providers: [
        FleetOwnerService,
        { provide: getRepositoryToken(FleetLeaseContract), useValue: mockContractRepo },
        { provide: getRepositoryToken(FleetOwnerSettlement), useValue: mockSettlementRepo },
      ],
    }).compile();

    service = module.get<FleetOwnerService>(FleetOwnerService);
  });

  it('should create fixed daily rental lease contract with non-negative integer paise', async () => {
    const contract = await service.createContract({
      fleetOwnerId: 'f0000000-0000-4000-8000-000000000001',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      vehicleId: 'v0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP-39-EV-1001',
      leaseModel: FleetLeaseModel.FIXED_DAILY_RENTAL,
      dailyRentPaise: 50000, // ₹500.00/day
      startDate: '2026-11-01',
    });

    expect(contract.id).toBe('c-123');
    expect(contract.dailyRentPaise).toBe(50000);
    expect(contract.model).toBe(FleetLeaseModel.FIXED_DAILY_RENTAL);
    expect(mockContractRepo.save).toHaveBeenCalled();
  });

  it('should reject percentage split lease if total shares exceed 100%', async () => {
    await expect(
      service.createContract({
        fleetOwnerId: 'f0000000-0000-4000-8000-000000000001',
        captainId: 'c0000000-0000-4000-8000-000000000001',
        vehicleId: 'v0000000-0000-4000-8000-000000000001',
        vehicleRegistrationNumber: 'AP-39-EV-1001',
        leaseModel: FleetLeaseModel.PERCENTAGE_SPLIT,
        ownerSharePercent: 50,
        captainSharePercent: 60, // 110% total
        startDate: '2026-11-01',
      }),
    ).rejects.toThrow('Total share percentage cannot exceed 100%');
  });

  it('should calculate nightly automated P&L settlement with electricity and maintenance deductions', async () => {
    mockContractRepo.find.mockResolvedValue([
      { id: 'c-1', vehicleRegistrationNumber: 'AP-39-EV-1001', isActive: true },
      { id: 'c-2', vehicleRegistrationNumber: 'AP-39-EV-2002', isActive: true },
    ]);

    const summary = await service.calculateSettlementSummary('f0000000-0000-4000-8000-000000000001', '2026-11-05');
    expect(summary.activeVehiclesCount).toBe(2);
    expect(summary.totalTripsCompleted).toBe(16);
    expect(summary.grossFaresCollectedPaise).toBe(400000); // ₹4,000.00
    expect(summary.captainPayoutsPaise).toBe(280000); // 70% = ₹2,800.00
    expect(summary.electricityDeductionsPaise).toBe(40000); // 2 * ₹200 = ₹400.00
    expect(summary.maintenanceReservesPaise).toBe(20000); // 2 * ₹100 = ₹200.00
    expect(summary.netFleetOwnerEarningsPaise).toBe(20000); // ₹200.00
    expect(mockSettlementRepo.save).toHaveBeenCalled();
  });
});

