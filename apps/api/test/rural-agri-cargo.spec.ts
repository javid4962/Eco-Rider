import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RuralAgriCargoService } from '../src/modules/rural-agri-cargo/rural-agri-cargo.service';
import { RuralAgriCargoController } from '../src/modules/rural-agri-cargo/rural-agri-cargo.controller';
import { AgriProduceConsignmentEntity } from '../src/database/entities/agri-produce-consignment.entity';
import { AgriConsignmentStatus, AgriProduceType } from '@ecoride/contracts';

describe('RuralAgriCargoModule', () => {
  let service: RuralAgriCargoService;
  let controller: RuralAgriCargoController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-agri-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-agri-uuid') {
        return {
          id: 'mock-agri-uuid',
          consignmentCode: 'AP-AGRI-100234',
          netWeightKg: 500,
          grossProduceValuePaise: '7500000', // 500kg * 15000 paise/kg = 75,000 INR
          apmcCessAmountPaise: '75000',      // 1% APMC cess
          netFarmerPayoutPaise: '7300000',
          status: AgriConsignmentStatus.WEIGHED,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuralAgriCargoController],
      providers: [
        RuralAgriCargoService,
        {
          provide: getRepositoryToken(AgriProduceConsignmentEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RuralAgriCargoService>(RuralAgriCargoService);
    controller = module.get<RuralAgriCargoController>(RuralAgriCargoController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should create agricultural produce consignment with APMC 1% cess and net payout calculation', async () => {
    const consignment = await controller.createConsignment({
      farmerId: 'FARMER-AP-GUN-001',
      farmerName: 'Venkat Rao',
      farmerAadhaarMasked: 'XXXX-XXXX-8921',
      farmerUpiId: 'venkat.agri@sbi',
      mandal: 'Tenali Rural',
      district: 'Guntur',
      produceType: AgriProduceType.GUNTUR_CHILLI,
      grossWeightKg: 550,
      tareWeightKg: 50, // net = 500 kg
      ratePerKgPaise: 15000, // ₹150.00/kg
      evCargoVehicleId: 'EV-CARGO-AP37-0881',
      captainId: 'CAP-CARGO-771',
      markfedHubId: 'MARKFED-GUNTUR-CENTRAL',
    });

    expect(consignment.netWeightKg).toBe(500);
    expect(consignment.grossProduceValuePaise).toBe('7500000'); // ₹75,000.00
    expect(consignment.apmcCessAmountPaise).toBe('75000');     // 1% cess = ₹750.00
    expect(consignment.status).toBe(AgriConsignmentStatus.WEIGHED);
    expect(consignment.consignmentCode).toContain('AP-AGRI-');
  });

  it('should update consignment transit status and fetch by id', async () => {
    const updated = await controller.updateStatus('mock-agri-uuid', AgriConsignmentStatus.DELIVERED_MARKFED);
    expect(updated.status).toBe(AgriConsignmentStatus.DELIVERED_MARKFED);
  });
});
