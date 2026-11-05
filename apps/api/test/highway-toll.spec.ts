import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HighwayTollService } from '../src/modules/highway-toll/highway-toll.service';
import { HighwayTollController } from '../src/modules/highway-toll/highway-toll.controller';
import { TollPlaza } from '../src/database/entities/toll-plaza.entity';
import { TollCrossing } from '../src/database/entities/toll-crossing.entity';

describe('HighwayTollService (M46)', () => {
  let service: HighwayTollService;
  let mockPlazaRepo: any;
  let mockCrossingRepo: any;

  beforeEach(async () => {
    mockPlazaRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'plaza-1',
          tollCode: 'AP_NH16_KAZA',
          name: 'Kaza Toll Plaza',
          highwayCode: 'NH-16',
          latitude: 16.425,
          longitude: 80.556,
          geofenceRadiusMeters: 300,
          carJeepVanTollPaise: 9500, // ₹95.00
          lightCommercialTollPaise: 15500,
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      create: jest.fn((e) => ({ ...e, id: 'plaza-new' })),
    };

    mockCrossingRepo = {
      create: jest.fn((e) => ({ ...e, id: 'cross-123', detectedAt: new Date(), reimbursedAt: new Date() })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HighwayTollController],
      providers: [
        HighwayTollService,
        { provide: getRepositoryToken(TollPlaza), useValue: mockPlazaRepo },
        { provide: getRepositoryToken(TollCrossing), useValue: mockCrossingRepo },
      ],
    }).compile();

    service = module.get<HighwayTollService>(HighwayTollService);
  });

  it('should list configured AP NHAI toll plazas with gazetted rates', async () => {
    const plazas = await service.getTollPlazas();
    expect(plazas.length).toBeGreaterThan(0);
    expect(plazas[0].tollCode).toBe('AP_NH16_KAZA');
    expect(plazas[0].carJeepVanTollPaise).toBe(9500); // ₹95.00
  });

  it('should ingest Fastag toll crossing and mark 100% reimbursement to captain', async () => {
    mockCrossingRepo.findOne.mockResolvedValueOnce(null);
    mockPlazaRepo.findOne.mockResolvedValueOnce({
      tollCode: 'AP_NH16_KAZA',
      name: 'Kaza Toll Plaza',
      carJeepVanTollPaise: 9500,
    });

    const crossing = await service.ingestTollCrossing({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP16EV1234',
      tollPlazaCode: 'AP_NH16_KAZA',
      fastagDeductionRef: 'FTG-TXN-987654321',
    });

    expect(crossing.tollAmountPaise).toBe(9500);
    expect(crossing.reimbursementStatus).toBe('REIMBURSED');
    expect(crossing.fastagDeductionRef).toBe('FTG-TXN-987654321');
  });

  it('should be idempotent for duplicate fastag deduction ref', async () => {
    mockCrossingRepo.findOne.mockResolvedValueOnce({
      id: 'cross-123',
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP16EV1234',
      tollPlazaCode: 'AP_NH16_KAZA',
      tollPlazaName: 'Kaza Toll Plaza',
      tollAmountPaise: 9500,
      fastagDeductionRef: 'FTG-TXN-DUPLICATE',
      reimbursementStatus: 'REIMBURSED',
      detectedAt: new Date(),
    });

    const crossing = await service.ingestTollCrossing({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP16EV1234',
      tollPlazaCode: 'AP_NH16_KAZA',
      fastagDeductionRef: 'FTG-TXN-DUPLICATE',
    });

    expect(crossing.fastagDeductionRef).toBe('FTG-TXN-DUPLICATE');
    expect(mockCrossingRepo.save).not.toHaveBeenCalled();
  });
});

