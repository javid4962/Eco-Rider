import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FleetService } from '../src/modules/fleet/fleet.service';
import {
  FleetOrganization,
  FleetVehicleAssignment,
  FleetShift,
  Vehicle,
  DriverProfile,
  User,
  LedgerEntry,
  AuditEvent,
} from '../src/database/entities';
import { IdentityService } from '../src/modules/identity/identity.service';
import {
  PlatformRole,
  FleetOrganizationStatus,
  FleetAssignmentStatus,
  FleetShiftStatus,
  FleetShiftType,
  PropulsionType,
  VehicleVerificationStatus,
  DriverComplianceStatus,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('FleetService (EV-030)', () => {
  let service: FleetService;
  let fleetOrgRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let assignmentRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let shiftRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let vehicleRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let driverProfileRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
  };
  let ledgerRepo: {
    find: jest.Mock;
  };
  let identityService: {
    recordAuditEvent: jest.Mock;
  };

  const mockFleetOwnerA: CurrentActorPayload = {
    id: 'fo111111-1111-4111-8111-111111111111',
    role: PlatformRole.FLEET_OWNER,
    scopes: ['fleet:read', 'fleet:write', 'vehicle:read'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-fo-a',
  };

  const mockFleetOwnerB: CurrentActorPayload = {
    id: 'fo222222-2222-4222-8222-222222222222',
    role: PlatformRole.FLEET_OWNER,
    scopes: ['fleet:read', 'fleet:write', 'vehicle:read'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-fo-b',
  };

  const mockOperatorActor: CurrentActorPayload = {
    id: 'op999999-9999-4999-8999-999999999999',
    role: PlatformRole.OPERATOR,
    scopes: ['fleet:read', 'fleet:write', '*'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-op',
  };

  const orgAId = 'org-aaaa-4000-8000-000000000001';
  const orgBId = 'org-bbbb-4000-8000-000000000002';
  const vehicleAId = 'veh-aaaa-4000-8000-000000000001';
  const driver1Id = 'dr-1111-4000-8000-000000000001';
  const driver2Id = 'dr-2222-4000-8000-000000000002';

  const createMockOrgA = (): FleetOrganization => {
    const org = new FleetOrganization();
    org.id = orgAId;
    org.ownerId = mockFleetOwnerA.id;
    org.name = 'Vizag Coast Green Cabs Ltd';
    org.businessRegistrationNumber = '37AABCV1234F1Z5';
    org.city = 'visakhapatnam';
    org.contactPhone = '+919876543210';
    org.contactEmail = 'contact@vizagcoast.in';
    org.payoutAccountId = 'acc_fleet_vizag_coast';
    org.status = FleetOrganizationStatus.ACTIVE;
    org.createdAt = new Date('2026-11-01T00:00:00Z');
    org.updatedAt = new Date('2026-11-01T00:00:00Z');
    return org;
  };

  const createMockOrgB = (): FleetOrganization => {
    const org = new FleetOrganization();
    org.id = orgBId;
    org.ownerId = mockFleetOwnerB.id;
    org.name = 'Bayview EV Shuttles LLP';
    org.businessRegistrationNumber = '37BBBCV9876F1Z9';
    org.city = 'visakhapatnam';
    org.contactPhone = '+919876543211';
    org.contactEmail = 'ops@bayview.in';
    org.payoutAccountId = 'acc_fleet_bayview_01';
    org.status = FleetOrganizationStatus.ACTIVE;
    org.createdAt = new Date('2026-11-01T00:00:00Z');
    org.updatedAt = new Date('2026-11-01T00:00:00Z');
    return org;
  };

  const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => {
    const v = new Vehicle();
    v.id = vehicleAId;
    v.registrationNumber = 'AP31EV5555';
    v.propulsionType = PropulsionType.BATTERY_ELECTRIC;
    v.verificationStatus = VehicleVerificationStatus.VERIFIED;
    v.fleetOrganizationId = orgAId;
    v.ownerId = mockFleetOwnerA.id;
    v.currentSocPercent = 88.0;
    v.ratedRangeKm = 120;
    v.city = 'visakhapatnam';
    v.isActive = true;
    v.createdAt = new Date();
    return Object.assign(v, overrides);
  };

  beforeEach(async () => {
    fleetOrgRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'org-new-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest
        .fn()
        .mockImplementation((org) => Promise.resolve({ id: org.id || 'org-new-1', ...org })),
    };

    assignmentRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'asgn-new-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest
        .fn()
        .mockImplementation((a) => Promise.resolve({ id: a.id || 'asgn-new-1', ...a })),
      count: jest.fn().mockResolvedValue(0),
    };

    shiftRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'shift-new-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest
        .fn()
        .mockImplementation((s) => Promise.resolve({ id: s.id || 'shift-new-1', ...s })),
    };

    vehicleRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
      count: jest.fn().mockResolvedValue(0),
    };

    driverProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((dp) => Promise.resolve(dp)),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    ledgerRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    identityService = {
      recordAuditEvent: jest.fn().mockResolvedValue(new AuditEvent()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: getRepositoryToken(FleetOrganization), useValue: fleetOrgRepo },
        { provide: getRepositoryToken(FleetVehicleAssignment), useValue: assignmentRepo },
        { provide: getRepositoryToken(FleetShift), useValue: shiftRepo },
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: getRepositoryToken(DriverProfile), useValue: driverProfileRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(LedgerEntry), useValue: ledgerRepo },
        { provide: IdentityService, useValue: identityService },
      ],
    }).compile();

    service = module.get<FleetService>(FleetService);
  });

  describe('1. Fleet Organization Registration & Ownership', () => {
    it('should register a new fleet organization and record audit event', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(null);

      const res = await service.createOrganization(mockFleetOwnerA, {
        name: 'Vizag Coast Green Cabs Ltd',
        businessRegistrationNumber: '37AABCV1234F1Z5',
        contactPhone: '+919876543210',
        payoutAccountId: 'acc_fleet_vizag_coast',
      });

      expect(res.name).toBe('Vizag Coast Green Cabs Ltd');
      expect(res.businessRegistrationNumber).toBe('37AABCV1234F1Z5');
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLEET_ORGANIZATION_CREATED',
          status: 'SUCCESS',
        }),
      );
    });

    it('should reject duplicate business registration number with ConflictException', async () => {
      fleetOrgRepo.findOne.mockResolvedValueOnce(createMockOrgA());

      await expect(
        service.createOrganization(mockFleetOwnerA, {
          name: 'Duplicate Fleet',
          businessRegistrationNumber: '37AABCV1234F1Z5',
          contactPhone: '+919876543210',
          payoutAccountId: 'acc_new_unique',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Cross-Fleet Tenant Isolation & Access Restrictions', () => {
    it('should allow fleet owner to access their own organization', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      vehicleRepo.count.mockResolvedValue(5);
      assignmentRepo.count.mockResolvedValue(4);

      const res = await service.getMyOrganization(mockFleetOwnerA);
      expect(res.id).toBe(orgAId);
      expect(res.totalVehicles).toBe(5);
      expect(res.activeDrivers).toBe(4);
    });

    it('should strictly reject Fleet Owner A from accessing Fleet Owner B organization with 403 Forbidden', async () => {
      // Mock lookup for org B
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgB());

      await expect(service.resolveFleetOrganization(mockFleetOwnerA, orgBId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CROSS_FLEET_ACCESS_DENIED',
          status: 'DENIED',
        }),
      );
    });

    it('should allow platform operator to inspect any fleet organization', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgB());

      const org = await service.resolveFleetOrganization(mockOperatorActor, orgBId);
      expect(org.id).toBe(orgBId);
    });
  });

  describe('3. Vehicle Membership & 100% BEV Enforcement', () => {
    it('should add electric vehicle to caller fleet organization', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      const v = createMockVehicle({ fleetOrganizationId: null });
      vehicleRepo.findOne.mockResolvedValue(v);

      const res = await service.addVehicleToFleet(mockFleetOwnerA, vehicleAId);

      expect(v.fleetOrganizationId).toBe(orgAId);
      expect(res.fleetOrganizationId).toBe(orgAId);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLEET_VEHICLE_MEMBERSHIP_ATTACHED',
        }),
      );
    });

    it('should reject non-electric vehicle from joining fleet organization', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      const petrolVehicle = createMockVehicle({
        propulsionType: 'INTERNAL_COMBUSTION',
      });
      vehicleRepo.findOne.mockResolvedValue(petrolVehicle);

      await expect(service.addVehicleToFleet(mockFleetOwnerA, vehicleAId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject vehicle already affiliated with another fleet organization', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      const alreadyAffiliated = createMockVehicle({
        fleetOrganizationId: orgBId,
      });
      vehicleRepo.findOne.mockResolvedValue(alreadyAffiliated);

      await expect(service.addVehicleToFleet(mockFleetOwnerA, vehicleAId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('4. Driver Assignment, Reassignment & Audit Trail', () => {
    it('should assign a verified driver to fleet vehicle', async () => {
      const v = createMockVehicle();
      vehicleRepo.findOne.mockResolvedValue(v);
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());

      const driverUser = new User();
      driverUser.id = driver1Id;
      driverUser.name = 'Ramesh Captain';
      driverUser.phone = '+919876200001';
      userRepo.findOne.mockResolvedValue(driverUser);

      const driverProfile = new DriverProfile();
      driverProfile.userId = driver1Id;
      driverProfile.verificationStatus = DriverComplianceStatus.VERIFIED;
      driverProfileRepo.findOne.mockResolvedValue(driverProfile);
      assignmentRepo.findOne.mockResolvedValue(null);

      const asgn = await service.assignDriverToVehicle(mockFleetOwnerA, vehicleAId, {
        driverUserId: driver1Id,
        assignmentReason: 'INITIAL_DISPATCH',
      });

      expect(asgn.driverId).toBe(driver1Id);
      expect(asgn.status).toBe(FleetAssignmentStatus.ACTIVE);
      expect(driverProfile.assignedVehicleId).toBe(vehicleAId);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLEET_VEHICLE_ASSIGNED',
        }),
      );
    });

    it('should reassign vehicle to new driver, close prior assignment, and log audited reassignment event', async () => {
      const v = createMockVehicle();
      vehicleRepo.findOne.mockResolvedValue(v);
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());

      const driver2User = new User();
      driver2User.id = driver2Id;
      driver2User.name = 'Suresh Captain 2';
      driver2User.phone = '+919876200002';
      userRepo.findOne.mockResolvedValue(driver2User);

      const driver2Profile = new DriverProfile();
      driver2Profile.userId = driver2Id;
      driver2Profile.verificationStatus = DriverComplianceStatus.VERIFIED;
      driverProfileRepo.findOne.mockResolvedValue(driver2Profile);

      // Active assignment with driver1 exists
      const oldAssignment = new FleetVehicleAssignment();
      oldAssignment.id = 'asgn-old-1';
      oldAssignment.vehicleId = vehicleAId;
      oldAssignment.driverId = driver1Id;
      oldAssignment.status = FleetAssignmentStatus.ACTIVE;
      assignmentRepo.findOne.mockResolvedValueOnce(oldAssignment).mockResolvedValueOnce(null);

      const res = await service.assignDriverToVehicle(mockFleetOwnerA, vehicleAId, {
        driverUserId: driver2Id,
        assignmentReason: 'ROSTER_ROTATION',
      });

      expect(oldAssignment.status).toBe(FleetAssignmentStatus.COMPLETED);
      expect(oldAssignment.unassignedAt).toBeInstanceOf(Date);
      expect(res.driverId).toBe(driver2Id);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLEET_VEHICLE_REASSIGNED',
          previousState: expect.objectContaining({ previousDriverId: driver1Id }),
          newState: expect.objectContaining({ newDriverId: driver2Id }),
        }),
      );
    });

    it('should reject assigning unverified captain with UnprocessableEntityException', async () => {
      const v = createMockVehicle();
      vehicleRepo.findOne.mockResolvedValue(v);
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      userRepo.findOne.mockResolvedValue(new User());

      const unverifiedProfile = new DriverProfile();
      unverifiedProfile.userId = driver1Id;
      unverifiedProfile.verificationStatus = DriverComplianceStatus.PENDING;
      driverProfileRepo.findOne.mockResolvedValue(unverifiedProfile);

      await expect(
        service.assignDriverToVehicle(mockFleetOwnerA, vehicleAId, {
          driverUserId: driver1Id,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('5. Fleet Shift Operations', () => {
    it('should start a shift for assigned vehicle with adequate battery SoC', async () => {
      const v = createMockVehicle({ currentSocPercent: 90.0 });
      vehicleRepo.findOne.mockResolvedValue(v);
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());

      const driverProfile = new DriverProfile();
      driverProfile.verificationStatus = DriverComplianceStatus.VERIFIED;
      driverProfileRepo.findOne.mockResolvedValue(driverProfile);

      const shift = await service.startShift(mockFleetOwnerA, {
        vehicleId: vehicleAId,
        driverUserId: driver1Id,
        shiftType: FleetShiftType.MORNING,
        startOdometerKm: 15000,
        startSocPercent: 90.0,
      });

      expect(shift.status).toBe(FleetShiftStatus.ACTIVE);
      expect(shift.startSocPercent).toBe(90.0);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLEET_SHIFT_STARTED',
        }),
      );
    });

    it('should reject starting shift when battery SoC is under 15%', async () => {
      const v = createMockVehicle({ currentSocPercent: 12.0 });
      vehicleRepo.findOne.mockResolvedValue(v);
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());

      const driverProfile = new DriverProfile();
      driverProfile.verificationStatus = DriverComplianceStatus.VERIFIED;
      driverProfileRepo.findOne.mockResolvedValue(driverProfile);

      await expect(
        service.startShift(mockFleetOwnerA, {
          vehicleId: vehicleAId,
          driverUserId: driver1Id,
          startSocPercent: 12.0,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should end shift, record handover odometer and SoC, and mark COMPLETED', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      const v = createMockVehicle();
      const activeShift = new FleetShift();
      activeShift.id = 'shift-100';
      activeShift.fleetOrganizationId = orgAId;
      activeShift.vehicleId = vehicleAId;
      activeShift.driverId = driver1Id;
      activeShift.vehicle = v;
      activeShift.shiftType = FleetShiftType.MORNING;
      activeShift.startTime = new Date();
      activeShift.startSocPercent = 90.0;
      activeShift.status = FleetShiftStatus.ACTIVE;
      activeShift.createdAt = new Date();
      shiftRepo.findOne.mockResolvedValue(activeShift);

      const res = await service.endShift(mockFleetOwnerA, 'shift-100', {
        endOdometerKm: 15120,
        endSocPercent: 45.0,
        totalTrips: 8,
        totalEarningsPaise: 180000,
      });

      expect(res.status).toBe(FleetShiftStatus.COMPLETED);
      expect(res.endSocPercent).toBe(45.0);
      expect(res.totalEarningsPaise).toBe(180000);
      expect(v.currentSocPercent).toBe(45.0);
    });
  });

  describe('6. Scoped Fleet Earnings & Financial Segregation', () => {
    it('should compute earnings scoped strictly to organization payout account', async () => {
      fleetOrgRepo.findOne.mockResolvedValue(createMockOrgA());
      vehicleRepo.count.mockResolvedValue(8);

      const entry1 = new LedgerEntry();
      entry1.id = 'le-1';
      entry1.accountId = 'acc_fleet_vizag_coast';
      entry1.entryType = 'CREDIT';
      entry1.amountPaise = 500000; // Rs 5,000
      entry1.currency = 'INR';
      entry1.createdAt = new Date();

      ledgerRepo.find.mockResolvedValue([entry1]);
      shiftRepo.find.mockResolvedValue([]);

      const earnings = await service.getFleetEarnings(mockFleetOwnerA);

      expect(earnings.fleetOrganizationId).toBe(orgAId);
      expect(earnings.payoutAccountId).toBe('acc_fleet_vizag_coast');
      expect(earnings.totalGrossPaise).toBe(500000);
      expect(earnings.totalGrossInr).toBe(5000.0);
      expect(earnings.platformFeePaise).toBe(75000); // 15%
      expect(earnings.netFleetEarningsPaise).toBe(425000); // 85%
      expect(earnings.activeVehiclesCount).toBe(8);
      expect(earnings.recentTransactions).toHaveLength(1);
    });
  });
});
