import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CorporateService } from '../src/modules/corporate/corporate.service';
import { CorporateController } from '../src/modules/corporate/corporate.controller';
import { CorporateAccount } from '../src/database/entities/corporate-account.entity';
import { CorporateEmployee } from '../src/database/entities/corporate-employee.entity';
import { CorporateShiftManifest } from '../src/database/entities/corporate-shift-manifest.entity';
import {
  CorporateAccountStatus,
  CorporateAttendanceStatus,
  WorkShiftType,
} from '@ecoride/contracts';

describe('Milestone M14: Corporate & Employee Transport (EV-110 – EV-112)', () => {
  let corporateService: CorporateService;
  let corporateController: CorporateController;

  const storedAccounts: CorporateAccount[] = [];
  const storedEmployees: CorporateEmployee[] = [];
  const storedManifests: CorporateShiftManifest[] = [];

  const mockAccountRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedAccounts.find((a) => {
        for (const k of Object.keys(where)) {
          if ((a as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedAccounts]),
    create: jest.fn().mockImplementation((data: Partial<CorporateAccount>) => {
      return {
        id: 'corp_' + Math.random().toString(36).substring(2, 9),
        status: CorporateAccountStatus.ACTIVE,
        currentOutstandingPaise: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorporateAccount;
    }),
    save: jest.fn().mockImplementation(async (data: CorporateAccount) => {
      const idx = storedAccounts.findIndex((a) => a.id === data.id);
      if (idx >= 0) storedAccounts[idx] = data;
      else storedAccounts.push(data);
      return data;
    }),
  };

  const mockEmployeeRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedEmployees.find((e) => {
        for (const k of Object.keys(where)) {
          if ((e as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedEmployees.filter((e) => {
        for (const k of Object.keys(where)) {
          if ((e as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      });
    }),
    create: jest.fn().mockImplementation((data: Partial<CorporateEmployee>) => {
      return {
        id: 'emp_' + Math.random().toString(36).substring(2, 9),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorporateEmployee;
    }),
    save: jest.fn().mockImplementation(async (data: CorporateEmployee) => {
      const idx = storedEmployees.findIndex((e) => e.id === data.id);
      if (idx >= 0) storedEmployees[idx] = data;
      else storedEmployees.push(data);
      return data;
    }),
  };

  const mockManifestRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedManifests.find((m) => {
        for (const k of Object.keys(where)) {
          if ((m as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedManifests.filter((m) => {
        for (const k of Object.keys(where)) {
          if ((m as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      });
    }),
    create: jest.fn().mockImplementation((data: Partial<CorporateShiftManifest>) => {
      return {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorporateShiftManifest;
    }),
    save: jest.fn().mockImplementation(async (data: CorporateShiftManifest) => {
      const idx = storedManifests.findIndex((m) => m.id === data.id);
      if (idx >= 0) storedManifests[idx] = data;
      else storedManifests.push(data);
      return data;
    }),
  };

  beforeEach(async () => {
    storedAccounts.length = 0;
    storedEmployees.length = 0;
    storedManifests.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateController],
      providers: [
        CorporateService,
        {
          provide: getRepositoryToken(CorporateAccount),
          useValue: mockAccountRepo,
        },
        {
          provide: getRepositoryToken(CorporateEmployee),
          useValue: mockEmployeeRepo,
        },
        {
          provide: getRepositoryToken(CorporateShiftManifest),
          useValue: mockManifestRepo,
        },
      ],
    }).compile();

    corporateService = module.get<CorporateService>(CorporateService);
    corporateController = module.get<CorporateController>(CorporateController);
  });

  describe('EV-110: Corporate Account Registration & GSTIN Validation', () => {
    it('should register a corporate employer account with valid 15-char AP GSTIN', async () => {
      const account = await corporateService.createAccount({
        companyName: 'TechPark Amaravathi Pvt Ltd',
        cinOrRegistration: 'U72200AP2026PTC123456',
        gstin: '37AAAAA1234A1Z5',
        city: 'Amaravathi',
        contactEmail: 'admin@techpark-ap.in',
        contactPhone: '+919123450001',
        monthlyCreditLimitPaise: 5000000,
      });

      expect(account.id).toBeDefined();
      expect(account.companyName).toBe('TechPark Amaravathi Pvt Ltd');
      expect(account.gstin).toBe('37AAAAA1234A1Z5');
      expect(account.status).toBe(CorporateAccountStatus.ACTIVE);
      expect(storedAccounts.length).toBe(1);
    });

    it('should reject registration with invalid GSTIN format', async () => {
      await expect(
        corporateService.createAccount({
          companyName: 'Fake Corp',
          cinOrRegistration: 'U12345',
          gstin: 'INVALID-GSTIN-123',
          city: 'Vijayawada',
          contactEmail: 'test@corp.com',
          contactPhone: '+919123450002',
          monthlyCreditLimitPaise: 1000000,
        }),
      ).rejects.toThrow();
    });
  });

  describe('EV-111 & EV-112: Employee Rostering & Shift Manifest Attendance', () => {
    let accountId: string;
    let employeeId1: string;
    let employeeId2: string;

    beforeEach(async () => {
      const account = await corporateService.createAccount({
        companyName: 'TechPark Amaravathi Pvt Ltd',
        cinOrRegistration: 'U72200AP2026PTC123456',
        gstin: '37AAAAA1234A1Z5',
        city: 'Amaravathi',
        contactEmail: 'admin@techpark-ap.in',
        contactPhone: '+919123450001',
        monthlyCreditLimitPaise: 5000000,
      });
      accountId = account.id;

      const emp1 = await corporateService.registerEmployee({
        corporateAccountId: accountId,
        employeeCode: 'EMP-001',
        fullName: 'Kishore Kumar',
        phone: '+919123400051',
        department: 'Cloud Ops',
        workShift: WorkShiftType.GENERAL_MORNING,
        pickupAddress: 'Benz Circle, Vijayawada',
        pickupLatitude: 16.5033,
        pickupLongitude: 80.6465,
      });
      employeeId1 = emp1.id;

      const emp2 = await corporateService.registerEmployee({
        corporateAccountId: accountId,
        employeeCode: 'EMP-002',
        fullName: 'Lakshmi Devi',
        phone: '+919123400052',
        department: 'Security',
        workShift: WorkShiftType.GENERAL_MORNING,
        pickupAddress: 'Mangalagiri AIIMS Gate 2',
        pickupLatitude: 16.4357,
        pickupLongitude: 80.5654,
      });
      employeeId2 = emp2.id;
    });

    it('should create an optimized shift manifest and board employee via OTP', async () => {
      const manifest = await corporateService.createShiftManifest(undefined, {
        corporateAccountId: accountId,
        manifestDate: '2026-11-06',
        shiftType: WorkShiftType.GENERAL_MORNING,
        employeeIds: [employeeId1, employeeId2],
      });

      expect(manifest.totalEmployees).toBe(2);
      expect(manifest.employees.length).toBe(2);
      expect(manifest.employees[0].boardingOtp).toHaveLength(4);

      // Board employee 1 with valid OTP
      const targetEmployee = manifest.employees.find((e) => e.employeeId === employeeId1)!;
      const boardResult = await corporateService.boardEmployee(
        manifest.id,
        employeeId1,
        targetEmployee.boardingOtp,
      );

      expect(boardResult.success).toBe(true);
      expect(boardResult.employeeStatus).toBe(CorporateAttendanceStatus.BOARDED);

      // Attempting to board with wrong OTP fails
      await expect(
        corporateService.boardEmployee(manifest.id, employeeId2, '0000'),
      ).rejects.toThrow();
    });

    it('should generate monthly consolidated B2B GST tax invoice', async () => {
      const manifest = await corporateService.createShiftManifest(undefined, {
        corporateAccountId: accountId,
        manifestDate: '2026-11-06',
        shiftType: WorkShiftType.GENERAL_MORNING,
        employeeIds: [employeeId1],
      });

      await corporateService.boardEmployee(
        manifest.id,
        employeeId1,
        manifest.employees[0].boardingOtp,
      );

      const invoice = await corporateService.generateMonthlyInvoice(accountId, '2026-11');

      expect(invoice.corporateGstin).toBe('37AAAAA1234A1Z5');
      expect(invoice.totalTripsCompleted).toBe(1);
      expect(invoice.baseAmountPaise).toBe(15000); // ₹150.00
      expect(invoice.cgstPaise).toBe(375); // 2.5%
      expect(invoice.sgstPaise).toBe(375); // 2.5%
      expect(invoice.totalTaxPaise).toBe(750); // 5% = ₹7.50
      expect(invoice.totalAmountPaise).toBe(15750); // ₹157.50
      expect(invoice.formattedTotal).toBe('₹157.50');
    });
  });

  describe('CorporateController Endpoints', () => {
    it('should list employees through CorporateController', async () => {
      const account = await corporateService.createAccount({
        companyName: 'Andhra Motors Corp',
        cinOrRegistration: 'U11111AP2026PTC999999',
        gstin: '37BBBBB5678B1Z9',
        city: 'Guntur',
        contactEmail: 'info@andhramotors.in',
        contactPhone: '+919123400099',
        monthlyCreditLimitPaise: 3000000,
      });

      await corporateService.registerEmployee({
        corporateAccountId: account.id,
        employeeCode: 'EMP-GNT-1',
        fullName: 'Ravi Teja',
        phone: '+919123400088',
        workShift: WorkShiftType.GENERAL_MORNING,
        pickupAddress: 'Lodge Center, Guntur',
        pickupLatitude: 16.305,
        pickupLongitude: 80.442,
      });

      const list = await corporateController.listEmployees(account.id);
      expect(list.length).toBe(1);
      expect(list[0].fullName).toBe('Ravi Teja');
    });
  });
});

