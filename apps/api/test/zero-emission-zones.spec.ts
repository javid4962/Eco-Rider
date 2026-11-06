import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ZeroEmissionZonesService } from '../src/modules/zero-emission-zones/zero-emission-zones.service';
import { ZeroEmissionZone } from '../src/database/entities/zero-emission-zone.entity';
import { ZezComplianceRecord } from '../src/database/entities/zez-compliance-record.entity';

describe('ZeroEmissionZonesService (Milestone M69)', () => {
  let service: ZeroEmissionZonesService;

  const mockZones: any[] = [];
  const mockRecords: any[] = [];

  const mockZoneRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockZones.find((z) => z.zoneCode === where.zoneCode);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `zone-${Date.now()}`,
      ...dto,
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation((zone) => {
      const idx = mockZones.findIndex((z) => z.zoneCode === zone.zoneCode);
      if (idx >= 0) {
        mockZones[idx] = zone;
      } else {
        mockZones.push(zone);
      }
      return Promise.resolve(zone);
    }),
  };

  const mockRecordRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `rec-${Date.now()}`,
      ...dto,
      issuedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((rec) => {
      mockRecords.push(rec);
      return Promise.resolve(rec);
    }),
  };

  beforeEach(async () => {
    mockZones.length = 0;
    mockRecords.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZeroEmissionZonesService,
        { provide: getRepositoryToken(ZeroEmissionZone), useValue: mockZoneRepo },
        { provide: getRepositoryToken(ZezComplianceRecord), useValue: mockRecordRepo },
      ],
    }).compile();

    service = module.get<ZeroEmissionZonesService>(ZeroEmissionZonesService);
  });

  it('should register zero emission zone in Amaravathi Government Complex', async () => {
    const zone = await service.registerZone({
      zoneCode: 'ZEZ-AMW-GOV-01',
      zoneName: 'Amaravathi Secretariat Zero Emission Core',
      municipality: 'APCRDA_AMARAVATHI',
      activePenaltyPaiseForIce: 100000, // ₹1,000 statutory penalty
      enforceBevOnly: true,
      totalBevCrossingsToday: 0,
    });

    expect(zone).toBeDefined();
    expect(zone.zoneCode).toBe('ZEZ-AMW-GOV-01');
    expect(zone.enforceBevOnly).toBe(true);
  });

  it('should grant authorized access to electric vehicle with 0 penalty', async () => {
    await service.registerZone({
      zoneCode: 'ZEZ-AMW-GOV-01',
      zoneName: 'Amaravathi Secretariat Zero Emission Core',
      municipality: 'APCRDA_AMARAVATHI',
      activePenaltyPaiseForIce: 100000,
      enforceBevOnly: true,
      totalBevCrossingsToday: 0,
    });

    const cert = await service.checkCompliance({
      vehicleRegistrationNumber: 'AP-16-EV-9999',
      isElectric: true,
      zoneCode: 'ZEZ-AMW-GOV-01',
      enteredAt: new Date().toISOString(),
    });

    expect(cert.authorizedAccess).toBe(true);
    expect(cert.penaltyChargedPaise).toBe(0);
    expect(mockZones[0].totalBevCrossingsToday).toBe(1);
  });

  it('should deny authorized access and charge penalty to non-electric vehicle', async () => {
    await service.registerZone({
      zoneCode: 'ZEZ-AMW-GOV-01',
      zoneName: 'Amaravathi Secretariat Zero Emission Core',
      municipality: 'APCRDA_AMARAVATHI',
      activePenaltyPaiseForIce: 100000,
      enforceBevOnly: true,
      totalBevCrossingsToday: 0,
    });

    const cert = await service.checkCompliance({
      vehicleRegistrationNumber: 'AP-16-PETROL-001',
      isElectric: false,
      zoneCode: 'ZEZ-AMW-GOV-01',
      enteredAt: new Date().toISOString(),
    });

    expect(cert.authorizedAccess).toBe(false);
    expect(cert.penaltyChargedPaise).toBe(100000);
  });

  it('should throw NotFoundException on unknown zone code', async () => {
    await expect(
      service.checkCompliance({
        vehicleRegistrationNumber: 'AP-16-EV-1234',
        isElectric: true,
        zoneCode: 'ZEZ-UNKNOWN',
        enteredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

