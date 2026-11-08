import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InterStatePermitService } from '../src/modules/inter-state-permit/inter-state-permit.service';
import { InterStatePermitController } from '../src/modules/inter-state-permit/inter-state-permit.controller';
import { InterStatePermitPassEntity } from '../src/database/entities/inter-state-permit-pass.entity';
import { InterStateCorridor, InterStatePermitStatus } from '@ecoride/contracts';

describe('InterStatePermitModule', () => {
  let service: InterStatePermitService;
  let controller: InterStatePermitController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-interstate-uuid',
      issuedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-interstate-uuid') {
        return {
          id: 'mock-interstate-uuid',
          status: InterStatePermitStatus.VALID_RECIPROCAL,
          isClearedForBorderTransit: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterStatePermitController],
      providers: [
        InterStatePermitService,
        {
          provide: getRepositoryToken(InterStatePermitPassEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<InterStatePermitService>(InterStatePermitService);
    controller = module.get<InterStatePermitController>(InterStatePermitController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should validate reciprocal transit permit and deduct FASTag toll for commercial green-plate EV', async () => {
    const pass = await controller.validate({
      vehicleId: 'EV-CAB-AP39-9001',
      corridor: InterStateCorridor.VIJAYAWADA_HYDERABAD_NH65,
      permitNumber: 'AP-STA-STAGE-2026-TG01',
      hasGreenCommercialPlate: true,
      isReciprocalAgreementActive: true,
      fastagBalancePaise: 50000, // ₹500 balance
    });

    expect(pass.status).toBe(InterStatePermitStatus.VALID_RECIPROCAL);
    expect(pass.isClearedForBorderTransit).toBe(true);
    expect(pass.borderTollDeductionPaise).toBe(15000); // ₹150
    expect(pass.fastagDeducted).toBe(true);
    expect(pass.interStateTransitManifestId).toContain('MANIFEST-AP-TG-');
  });

  it('should block border transit if vehicle does not hold green commercial plate registration', async () => {
    const pass = await controller.validate({
      vehicleId: 'ICE-CAB-AP39-9999',
      corridor: InterStateCorridor.VIJAYAWADA_HYDERABAD_NH65,
      permitNumber: 'UNKNOWN',
      hasGreenCommercialPlate: false, // Not green plate!
      isReciprocalAgreementActive: true,
      fastagBalancePaise: 50000,
    });

    expect(pass.status).toBe(InterStatePermitStatus.EXPIRED_BLOCKED);
    expect(pass.isClearedForBorderTransit).toBe(false);
    expect(pass.borderTollDeductionPaise).toBe(0);
    expect(pass.fastagDeducted).toBe(false);
  });
});

