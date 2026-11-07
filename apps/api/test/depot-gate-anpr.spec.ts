import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepotGateAnprService } from '../src/modules/depot-gate-anpr/depot-gate-anpr.service';
import { DepotGateAnprController } from '../src/modules/depot-gate-anpr/depot-gate-anpr.controller';
import { DepotGateAccessLogEntity } from '../src/database/entities/depot-gate-access-log.entity';

describe('DepotGateAnprModule', () => {
  let service: DepotGateAnprService;
  let controller: DepotGateAnprController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-gate-log-uuid',
      scannedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepotGateAnprController],
      providers: [
        DepotGateAnprService,
        {
          provide: getRepositoryToken(DepotGateAccessLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DepotGateAnprService>(DepotGateAnprService);
    controller = module.get<DepotGateAnprController>(DepotGateAnprController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should grant gate access and open barrier for verified green-plate EV', async () => {
    const result = await controller.scanVehicle({
      depotId: 'DEPOT-BENZ-CIRCLE',
      gateId: 'GATE-NORTH-INGRESS',
      gateType: 'INGRESS',
      scannedPlateNumber: 'AP 37 EV 9901',
      rfidTagId: 'RFID-HEX-A1B2C3',
    });

    expect(result.decision).toBe('GRANTED');
    expect(result.barrierOpened).toBe(true);
    expect(result.plateNumber).toBe('AP37EV9901');
  });

  it('should deny egress and lock boom-barrier for vehicle with active manufacturer recall', async () => {
    const result = await controller.scanVehicle({
      depotId: 'DEPOT-BENZ-CIRCLE',
      gateId: 'GATE-SOUTH-EGRESS',
      gateType: 'EGRESS',
      scannedPlateNumber: 'AP 37 RECALL 01',
      rfidTagId: 'RFID-HEX-FAIL01',
    });

    expect(result.decision).toBe('DENIED_PENDING_RECALL');
    expect(result.barrierOpened).toBe(false);
    expect(result.reason).toContain('pending safety recall');
  });
});
