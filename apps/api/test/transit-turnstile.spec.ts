import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransitTurnstileService } from '../src/modules/transit-turnstile/transit-turnstile.service';
import { TransitTurnstileAccess } from '../src/database/entities/transit-turnstile-access.entity';
import { TurnstileGateStatus, TurnstileStationCode } from '@ecoride/contracts';

describe('TransitTurnstileService (M92)', () => {
  let service: TransitTurnstileService;
  let repo: Partial<Record<keyof Repository<TransitTurnstileAccess>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-uuid', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransitTurnstileService,
        {
          provide: getRepositoryToken(TransitTurnstileAccess),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<TransitTurnstileService>(TransitTurnstileService);
  });

  it('should generate a verifiable signed transit turnstile QR token with 120s validity', async () => {
    const result = await service.generateTransitQr({
      bookingId: 'BOOK-VJA-PNBS-01',
      riderId: 'RIDER-999',
      stationCode: TurnstileStationCode.PNBS_VIJAYAWADA,
      corridorCode: 'CORRIDOR-VJA-AMV',
    });

    expect(result.token).toBeDefined();
    expect(result.qrPayload).toContain('ECORIDE:');
    expect(result.stationCode).toBe(TurnstileStationCode.PNBS_VIJAYAWADA);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should validate valid turnstile scan and trigger 5000ms gate actuator pulse', async () => {
    const qrResult = await service.generateTransitQr({
      bookingId: 'BOOK-BZA-RAILWAY-02',
      riderId: 'RIDER-888',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      corridorCode: 'CORRIDOR-BZA-GNT',
    });

    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-uuid',
      tokenHash: qrResult.token,
      bookingId: 'BOOK-BZA-RAILWAY-02',
      riderId: 'RIDER-888',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      gateStatus: TurnstileGateStatus.GATE_OPEN,
      expiresAt: new Date(Date.now() + 60000), // unexpired
      scannedAt: null,
    });

    const scanResult = await service.validateTurnstileScan({
      qrPayload: qrResult.qrPayload,
      turnstileId: 'TURNSTILE-GATE-04',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      scannedAt: new Date().toISOString(),
    });

    expect(scanResult.gateStatus).toBe(TurnstileGateStatus.GATE_OPEN);
    expect(scanResult.actuatorSignalMs).toBe(5000);
    expect(scanResult.riderId).toBe('RIDER-888');
  });

  it('should reject replay scan on already used QR token', async () => {
    const qrResult = await service.generateTransitQr({
      bookingId: 'BOOK-BZA-RAILWAY-03',
      riderId: 'RIDER-777',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      corridorCode: 'CORRIDOR-BZA-GNT',
    });

    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-uuid',
      tokenHash: qrResult.token,
      bookingId: 'BOOK-BZA-RAILWAY-03',
      riderId: 'RIDER-777',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      gateStatus: TurnstileGateStatus.GATE_OPEN,
      expiresAt: new Date(Date.now() + 60000),
      scannedAt: new Date(Date.now() - 5000), // already scanned 5s ago
    });

    const scanResult = await service.validateTurnstileScan({
      qrPayload: qrResult.qrPayload,
      turnstileId: 'TURNSTILE-GATE-04',
      stationCode: TurnstileStationCode.BZA_RAILWAY_STATION,
      scannedAt: new Date().toISOString(),
    });

    expect(scanResult.gateStatus).toBe(TurnstileGateStatus.ALREADY_USED);
    expect(scanResult.actuatorSignalMs).toBe(0);
  });
});
