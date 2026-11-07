import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChargingHostSettlementService } from '../src/modules/charging-host-settlement/charging-host-settlement.service';
import { ChargingHostSettlementController } from '../src/modules/charging-host-settlement/charging-host-settlement.controller';
import { ChargingHostSettlementEntity } from '../src/database/entities/charging-host-settlement.entity';
import { ChargingHostSettlementStatus } from '@ecoride/contracts';

describe('ChargingHostSettlementModule', () => {
  let service: ChargingHostSettlementService;
  let controller: ChargingHostSettlementController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-settlement-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-settlement-uuid') {
        return {
          id: 'mock-settlement-uuid',
          landlordId: 'HOST-MALL-BZA-01',
          grossMarginPaise: '4000000', // ₹40,000 gross margin
          landlordGrossPayoutPaise: '1200000', // 30% share = ₹12,000
          gstAmountPaise: '216000', // 18% GST = ₹2,160
          tdsDeductionPaise: '120000', // 10% TDS = ₹1,200
          netLandlordDisbursalPaise: '1296000', // ₹12,960 net
          status: ChargingHostSettlementStatus.PROCESSED,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargingHostSettlementController],
      providers: [
        ChargingHostSettlementService,
        {
          provide: getRepositoryToken(ChargingHostSettlementEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ChargingHostSettlementService>(ChargingHostSettlementService);
    controller = module.get<ChargingHostSettlementController>(ChargingHostSettlementController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should calculate charging host royalty split with 18% AP GST and 10% TDS deduction', async () => {
    const settlement = await controller.calculate({
      stationId: 'PVP-MALL-HUB-01',
      landlordId: 'HOST-MALL-BZA-01',
      landlordUpiId: 'pvp.infra@hdfc',
      propertyLocation: 'PVP Square Mall, MG Road, Vijayawada',
      billingPeriodStart: '2026-10-01T00:00:00Z',
      billingPeriodEnd: '2026-10-31T23:59:59Z',
      totalEnergyKwh: 10000,
      grossRevenuePaise: 12000000, // ₹1,20,000
      electricityCostPaise: 8000000, // ₹80,000
      landlordShareBps: 3000, // 30%
    });

    expect(settlement.grossMarginPaise).toBe('4000000'); // ₹40,000
    expect(settlement.landlordGrossPayoutPaise).toBe('1200000'); // ₹12,000
    expect(settlement.gstAmountPaise).toBe('216000'); // ₹2,160
    expect(settlement.tdsDeductionPaise).toBe('120000'); // ₹1,200
    expect(settlement.netLandlordDisbursalPaise).toBe('1296000'); // ₹12,960
    expect(settlement.status).toBe(ChargingHostSettlementStatus.PROCESSED);
  });

  it('should disburse settlement to host landlord wallet', async () => {
    const disbursed = await controller.disburse('mock-settlement-uuid');
    expect(disbursed.status).toBe(ChargingHostSettlementStatus.DISBURSED);
    expect(disbursed.disbursedAt).toBeDefined();
  });
});

