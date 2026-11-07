import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoboticSwapProtocolService } from '../src/modules/robotic-swap-protocol/robotic-swap-protocol.service';
import { RoboticSwapProtocolController } from '../src/modules/robotic-swap-protocol/robotic-swap-protocol.controller';
import { RoboticSwapSessionEntity } from '../src/database/entities/robotic-swap-session.entity';
import { RoboticSwapStep } from '@ecoride/contracts';

describe('RoboticSwapProtocolModule', () => {
  let service: RoboticSwapProtocolService;
  let controller: RoboticSwapProtocolController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-robotic-uuid',
      startedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-robotic-uuid') {
        return {
          id: 'mock-robotic-uuid',
          currentStep: RoboticSwapStep.HANDSHAKE_COMPLETED,
          isSuccessful: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoboticSwapProtocolController],
      providers: [
        RoboticSwapProtocolService,
        {
          provide: getRepositoryToken(RoboticSwapSessionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RoboticSwapProtocolService>(RoboticSwapProtocolService);
    controller = module.get<RoboticSwapProtocolController>(RoboticSwapProtocolController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should successfully execute autonomous robotic battery swap with verified torque and CAN-bus handshake', async () => {
    const session = await controller.execute({
      swapStationId: 'ROBO-SWAP-BZA-01',
      bayNumber: 'BAY-ROBO-01',
      vehicleId: 'EV-3W-AP39-2022',
      depletedPackSerial: 'PACK-OLD-8812',
      freshPackSerial: 'PACK-NEW-9931',
      torqueNewtonMetersApplied: 55.0, // Within 40-70 Nm range
      lockingPinsEngagedCount: 4,     // All 4 pins engaged
      canbusHandshakeOk: true,
    });

    expect(session.currentStep).toBe(RoboticSwapStep.HANDSHAKE_COMPLETED);
    expect(session.isSuccessful).toBe(true);
    expect(session.durationSeconds).toBe(95);
    expect(session.faultCode).toBeUndefined();
  });

  it('should abort robotic swap if locking pins fail to seat completely', async () => {
    const session = await controller.execute({
      swapStationId: 'ROBO-SWAP-BZA-01',
      bayNumber: 'BAY-ROBO-01',
      vehicleId: 'EV-3W-AP39-2022',
      depletedPackSerial: 'PACK-OLD-8812',
      freshPackSerial: 'PACK-NEW-9931',
      torqueNewtonMetersApplied: 55.0,
      lockingPinsEngagedCount: 3, // Only 3 pins seated!
      canbusHandshakeOk: true,
    });

    expect(session.currentStep).toBe(RoboticSwapStep.FAULT_ABORTED);
    expect(session.isSuccessful).toBe(false);
    expect(session.faultCode).toBe('ERR_LOCKING_PINS_NOT_SEATED');
  });
});

