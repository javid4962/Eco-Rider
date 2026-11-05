import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SmartLockersService } from '../src/modules/smart-lockers/smart-lockers.service';
import { SmartLockerCompartment } from '../src/database/entities/smart-locker-compartment.entity';
import { LockerAccessLog } from '../src/database/entities/locker-access-log.entity';
import { LockerCompartmentSize, LockerCompartmentStatus } from '@ecoride/contracts';

describe('SmartLockersService (Milestone M62)', () => {
  let service: SmartLockersService;

  const mockCompartments: any[] = [];
  const mockLogs: any[] = [];

  const mockCompartmentRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockCompartments.find((c) => {
        if (where.lockerHubId && c.lockerHubId !== where.lockerHubId) return false;
        if (where.size && c.size !== where.size) return false;
        if (where.status && c.status !== where.status) return false;
        if (where.compartmentNumber && c.compartmentNumber !== where.compartmentNumber) return false;
        return true;
      });
      return Promise.resolve(match || null);
    }),
    save: jest.fn().mockImplementation((c) => {
      const idx = mockCompartments.findIndex((item) => item.id === c.id);
      if (idx >= 0) {
        mockCompartments[idx] = c;
      } else {
        mockCompartments.push(c);
      }
      return Promise.resolve(c);
    }),
  };

  const mockLogRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `log-${Date.now()}`,
      ...dto,
      loggedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((log) => {
      mockLogs.push(log);
      return Promise.resolve(log);
    }),
  };

  beforeEach(async () => {
    mockCompartments.length = 0;
    mockLogs.length = 0;
    jest.clearAllMocks();

    mockCompartments.push({
      id: 'comp-01',
      lockerHubId: 'HUB-BZA-PNBS',
      compartmentNumber: 'A-12',
      size: LockerCompartmentSize.MEDIUM,
      status: LockerCompartmentStatus.AVAILABLE,
      currentConsignmentId: null,
      releaseOtpHash: null,
      expiresAt: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartLockersService,
        { provide: getRepositoryToken(SmartLockerCompartment), useValue: mockCompartmentRepo },
        { provide: getRepositoryToken(LockerAccessLog), useValue: mockLogRepo },
      ],
    }).compile();

    service = module.get<SmartLockersService>(SmartLockersService);
  });

  it('should deposit parcel into available compartment and unlock door', async () => {
    const res = await service.depositParcel({
      lockerHubId: 'HUB-BZA-PNBS',
      consignmentId: 'CSG-AMW-999',
      size: LockerCompartmentSize.MEDIUM,
      riderPhone: '+919123456780',
    });

    expect(res.success).toBe(true);
    expect(res.compartmentNumber).toBe('A-12');
    expect(res.doorUnlocked).toBe(true);
    expect(mockCompartments[0].status).toBe(LockerCompartmentStatus.OCCUPIED);
    expect(mockCompartments[0].currentConsignmentId).toBe('CSG-AMW-999');
    expect(mockLogs.length).toBe(1);
    expect(mockLogs[0].action).toBe('DEPOSIT');
  });

  it('should retrieve parcel with correct release OTP', async () => {
    const validOtp = '556677';
    mockCompartments[0].status = LockerCompartmentStatus.OCCUPIED;
    mockCompartments[0].currentConsignmentId = 'CSG-GNT-444';
    mockCompartments[0].releaseOtpHash = crypto.createHash('sha256').update(validOtp).digest('hex');

    const res = await service.retrieveParcel({
      lockerHubId: 'HUB-BZA-PNBS',
      compartmentNumber: 'A-12',
      releaseOtp: validOtp,
    });

    expect(res.success).toBe(true);
    expect(res.doorUnlocked).toBe(true);
    expect(mockCompartments[0].status).toBe(LockerCompartmentStatus.AVAILABLE);
    expect(mockCompartments[0].currentConsignmentId).toBeNull();
  });

  it('should reject retrieval with wrong release OTP and log failure', async () => {
    mockCompartments[0].status = LockerCompartmentStatus.OCCUPIED;
    mockCompartments[0].currentConsignmentId = 'CSG-GNT-444';
    mockCompartments[0].releaseOtpHash = crypto.createHash('sha256').update('112233').digest('hex');

    await expect(
      service.retrieveParcel({
        lockerHubId: 'HUB-BZA-PNBS',
        compartmentNumber: 'A-12',
        releaseOtp: '999999',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockLogs.length).toBe(1);
    expect(mockLogs[0].action).toBe('RETRIEVE_FAILED');
  });

  it('should throw NotFoundException when no compartment of requested size is available', async () => {
    mockCompartments[0].status = LockerCompartmentStatus.OCCUPIED;

    await expect(
      service.depositParcel({
        lockerHubId: 'HUB-BZA-PNBS',
        consignmentId: 'CSG-FAIL',
        size: LockerCompartmentSize.MEDIUM,
        riderPhone: '+919123456780',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
