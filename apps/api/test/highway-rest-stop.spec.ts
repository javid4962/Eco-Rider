import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HighwayRestStopService } from '../src/modules/highway-rest-stop/highway-rest-stop.service';
import { HighwayRestStopVoucher } from '../src/database/entities/highway-rest-stop-voucher.entity';
import { RestStopLocation, VoucherStatus } from '@ecoride/contracts';

describe('HighwayRestStopService (M93)', () => {
  let service: HighwayRestStopService;
  let repo: Partial<Record<keyof Repository<HighwayRestStopVoucher>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-voucher-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighwayRestStopService,
        {
          provide: getRepositoryToken(HighwayRestStopVoucher),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<HighwayRestStopService>(HighwayRestStopService);
  });

  it('should issue rest stop voucher for outstation journey with 24hr expiration', async () => {
    const result = await service.issueVoucher({
      bookingId: 'BOOK-OUTSTATION-01',
      riderId: 'RIDER-OUT-101',
      captainId: 'CAPTAIN-OUT-202',
      location: RestStopLocation.NH16_CHILAKALURIPET_PLAZA,
      voucherValuePaise: 25000, // ₹250
    });

    expect(result.voucherId).toBeDefined();
    expect(result.voucherCode).toContain('ECO-REST-');
    expect(result.valuePaise).toBe(25000);
    expect(result.status).toBe(VoucherStatus.ISSUED);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should redeem rest stop voucher at highway partner restaurant and generate settlement reference', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-voucher-id',
      voucherCode: 'ECO-REST-NH16-ABCD',
      bookingId: 'BOOK-OUTSTATION-01',
      riderId: 'RIDER-OUT-101',
      captainId: 'CAPTAIN-OUT-202',
      location: RestStopLocation.NH16_CHILAKALURIPET_PLAZA,
      valuePaise: 25000,
      status: VoucherStatus.ISSUED,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // unexpired
    });

    const redemption = await service.redeemVoucher({
      voucherCode: 'ECO-REST-NH16-ABCD',
      merchantId: 'REST-PLAZA-MERCHANT-01',
      redemptionLocation: RestStopLocation.NH16_CHILAKALURIPET_PLAZA,
    });

    expect(redemption.voucherId).toBe('mock-voucher-id');
    expect(redemption.merchantId).toBe('REST-PLAZA-MERCHANT-01');
    expect(redemption.settledAmountPaise).toBe(25000);
    expect(redemption.ledgerRef).toContain('LEDGER_REST_STOP_SETTLE_');
  });

  it('should reject voucher issuance outside permissible value bounds (< ₹50 or > ₹500)', async () => {
    await expect(
      service.issueVoucher({
        bookingId: 'BOOK-OUTSTATION-02',
        riderId: 'RIDER-OUT-102',
        captainId: 'CAPTAIN-OUT-203',
        location: RestStopLocation.NH16_HANUMAN_JUNCTION,
        voucherValuePaise: 3000, // ₹30 < ₹50 min
      }),
    ).rejects.toThrow('Voucher value must be between ₹50');
  });
});

