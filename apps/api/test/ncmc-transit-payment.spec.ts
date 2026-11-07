import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NcmcTransitPaymentService } from '../src/modules/ncmc-transit-payment/ncmc-transit-payment.service';
import { NcmcTransitPaymentController } from '../src/modules/ncmc-transit-payment/ncmc-transit-payment.controller';
import { NcmcTransitTransactionEntity } from '../src/database/entities/ncmc-transit-transaction.entity';

describe('NcmcTransitPaymentModule', () => {
  let service: NcmcTransitPaymentService;
  let controller: NcmcTransitPaymentController;

  const mockTx: Partial<NcmcTransitTransactionEntity> = {
    id: 'mock-tx-uuid',
    transactionId: 'NCMC-TX-12345678-ABC',
    bookingId: 'BK-NCMC-001',
    riderId: 'RIDER-NCMC-01',
    cardIdentifierHash: 'e'.repeat(64),
    cardType: 'RUPAY_CONTACTLESS',
    farePaise: 4500, // ₹45.00
    clearinghouseBatchId: 'AP-NCMC-CLEARING-20261107-BZA',
    status: 'SETTLED',
    authorizedAt: new Date(),
    settledAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-tx-uuid',
      authorizedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { transactionId } }) => {
      if (transactionId === 'NCMC-TX-12345678-ABC') {
        return mockTx;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NcmcTransitPaymentController],
      providers: [
        NcmcTransitPaymentService,
        {
          provide: getRepositoryToken(NcmcTransitTransactionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<NcmcTransitPaymentService>(NcmcTransitPaymentService);
    controller = module.get<NcmcTransitPaymentController>(NcmcTransitPaymentController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should process and settle contactless NCMC transit card fare in paise', async () => {
    const payment = await controller.processPayment({
      bookingId: 'BK-NCMC-001',
      riderId: 'RIDER-NCMC-01',
      cardIdentifierHash: 'e'.repeat(64),
      cardType: 'RUPAY_CONTACTLESS',
      farePaise: 4500,
      terminalId: 'POS-BZA-01',
      posLocationCode: 'BZA_PNBS_01',
    });

    expect(payment.status).toBe('SETTLED');
    expect(payment.farePaise).toBe(4500);
    expect(payment.clearinghouseBatchId).toContain('CLEARING');
  });

  it('should fetch transaction details by transaction ID', async () => {
    const tx = await controller.getTransaction('NCMC-TX-12345678-ABC');
    expect(tx.bookingId).toBe('BK-NCMC-001');
    expect(tx.farePaise).toBe(4500);
  });
});
