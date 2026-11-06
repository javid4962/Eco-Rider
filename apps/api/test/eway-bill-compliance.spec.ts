import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { EwayBillService } from '../src/modules/eway-bill/eway-bill.service';
import { EwayBillRecord } from '../src/database/entities/eway-bill-record.entity';
import { EwayBillStatus } from '@ecoride/contracts';

describe('EwayBillService (M82)', () => {
  let service: EwayBillService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'eway-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (r) => ({ ...r })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EwayBillService,
        {
          provide: getRepositoryToken(EwayBillRecord),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<EwayBillService>(EwayBillService);
  });

  it('should reject non-12-digit statutory e-way bill formats', async () => {
    await expect(
      service.verifyAndClearCheckpost({
        ewayBillNumber: '12345', // invalid length
        vehicleRegistrationNumber: 'AP 16 EV 9090',
        consignorGstin: '37AAAAA0000A1Z5',
        consigneeGstin: '37BBBBB0000B1Z6',
        grossWeightKg: 800,
        vehicleMaxGvwKg: 1000,
        checkpostName: 'Garikapadu Border Checkpost',
        declaredGoodsValuePaise: 5000000,
        validUntil: '2026-11-08T00:00:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject overweight commercial EV cargo and generate overweight infraction report', async () => {
    const result = await service.verifyAndClearCheckpost({
      ewayBillNumber: '112233445566',
      vehicleRegistrationNumber: 'AP 16 EV 9090',
      consignorGstin: '37AAAAA0000A1Z5',
      consigneeGstin: '37BBBBB0000B1Z6',
      grossWeightKg: 1400, // Exceeds 1000 kg capacity
      vehicleMaxGvwKg: 1000,
      checkpostName: 'Garikapadu Border Checkpost',
      declaredGoodsValuePaise: 5000000,
      validUntil: '2026-11-08T00:00:00Z',
    });

    expect(result.status).toBe(EwayBillStatus.OVERWEIGHT_REJECTED);
    expect(result.isCleared).toBe(false);
    expect(result.weightMarginKg).toBe(-400);
  });

  it('should grant clear checkpost passage when valid and within GVW limits', async () => {
    const result = await service.verifyAndClearCheckpost({
      ewayBillNumber: '998877665544',
      vehicleRegistrationNumber: 'AP 16 EV 9090',
      consignorGstin: '37AAAAA0000A1Z5',
      consigneeGstin: '37BBBBB0000B1Z6',
      grossWeightKg: 750,
      vehicleMaxGvwKg: 1000,
      checkpostName: 'Pottipadu Toll Checkpost',
      declaredGoodsValuePaise: 8500000,
      validUntil: '2026-11-08T00:00:00Z',
    });

    expect(result.status).toBe(EwayBillStatus.CLEARED_AT_CHECKPOST);
    expect(result.isCleared).toBe(true);
    expect(result.clearanceReference).toMatch(/^AP-CTD-POTTIPADU/);
    expect(result.weightMarginKg).toBe(250);
  });
});
