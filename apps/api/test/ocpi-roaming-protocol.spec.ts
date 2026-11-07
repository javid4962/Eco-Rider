import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcpiRoamingProtocolService } from '../src/modules/ocpi-roaming-protocol/ocpi-roaming-protocol.service';
import { OcpiRoamingProtocolController } from '../src/modules/ocpi-roaming-protocol/ocpi-roaming-protocol.controller';
import { OcpiRoamingSessionEntity } from '../src/database/entities/ocpi-roaming-session.entity';

describe('OcpiRoamingProtocolModule', () => {
  let service: OcpiRoamingProtocolService;
  let controller: OcpiRoamingProtocolController;

  const mockSession: Partial<OcpiRoamingSessionEntity> = {
    id: 'mock-ocpi-uuid',
    ocpiSessionId: 'OCPI-AP-TATA-001',
    partnerCpoId: 'IN-TATA-POWER',
    partnerStationId: 'TATA-STATION-BZA-01',
    ecorideVehicleVin: 'VIN-EV-AP37-5588',
    totalKwh: 0,
    roamingTariffPaisePerKwh: 1250,
    totalCostPaise: 0,
    clearinghouseSettlementId: 'PENDING',
    status: 'ACTIVE',
    startedAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-ocpi-uuid',
      startedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { ocpiSessionId } }) => {
      if (ocpiSessionId === 'OCPI-AP-TATA-001') {
        return { ...mockSession };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcpiRoamingProtocolController],
      providers: [
        OcpiRoamingProtocolService,
        {
          provide: getRepositoryToken(OcpiRoamingSessionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<OcpiRoamingProtocolService>(OcpiRoamingProtocolService);
    controller = module.get<OcpiRoamingProtocolController>(OcpiRoamingProtocolController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should initiate interoperable OCPI 2.2.1 roaming charging session with third-party CPO', async () => {
    const session = await controller.startRoamingSession({
      partnerCpoId: 'IN-TATA-POWER',
      partnerStationId: 'TATA-STATION-BZA-01',
      partnerConnectorId: 'CONN-CCS2-01',
      ecorideVehicleVin: 'VIN-EV-AP37-5588',
      rfidTokenUid: 'RFID-ECORIDE-9988',
    });

    expect(session.status).toBe('ACTIVE');
    expect(session.partnerCpoId).toBe('IN-TATA-POWER');
    expect(session.roamingTariffPaisePerKwh).toBe(1250);
  });

  it('should stop OCPI roaming session, compute total cost in paise, and generate clearinghouse settlement ID', async () => {
    const stopped = await controller.stopRoamingSession('OCPI-AP-TATA-001', { totalKwh: 28.5 });

    expect(stopped.status).toBe('COMPLETED');
    expect(stopped.totalKwh).toBe(28.5);
    expect(stopped.totalCostPaise).toBe(Math.round(28.5 * 1250));
    expect(stopped.clearinghouseSettlementId).toContain('AP-OCPI-SETTLE');
  });

  it('should retrieve existing OCPI roaming session details', async () => {
    const session = await controller.getSession('OCPI-AP-TATA-001');
    expect(session.ocpiSessionId).toBe('OCPI-AP-TATA-001');
    expect(session.partnerCpoId).toBe('IN-TATA-POWER');
  });
});

