import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OccPushToTalkService } from '../src/modules/occ-push-to-talk/occ-push-to-talk.service';
import { OccPushToTalkController } from '../src/modules/occ-push-to-talk/occ-push-to-talk.controller';
import { OccPushToTalkChannelEntity } from '../src/database/entities/occ-push-to-talk-channel.entity';

describe('OccPushToTalkModule', () => {
  let service: OccPushToTalkService;
  let controller: OccPushToTalkController;

  const mockChannel: Partial<OccPushToTalkChannelEntity> = {
    id: 'mock-ptt-uuid',
    channelId: 'PTT-CH-AMR-SECURITY',
    channelName: 'Amaravathi Secretariat Security Dispatch',
    district: 'AMARAVATHI',
    activeListenCount: 14,
    lastBroadcastBy: 'OCC_DISPATCHER:DISPATCH-USER-01',
    priority: 'SECURITY',
    lastActiveAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-ptt-uuid',
      lastActiveAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { channelId } }) => {
      if (channelId === 'PTT-CH-AMR-SECURITY') {
        return { ...mockChannel };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OccPushToTalkController],
      providers: [
        OccPushToTalkService,
        {
          provide: getRepositoryToken(OccPushToTalkChannelEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<OccPushToTalkService>(OccPushToTalkService);
    controller = module.get<OccPushToTalkController>(OccPushToTalkController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should create or initialize an OCC push-to-talk audio channel for field dispatch', async () => {
    const channel = await controller.createChannel({
      channelId: 'PTT-CH-AMR-SECURITY',
      channelName: 'Amaravathi Secretariat Security Dispatch',
      district: 'AMARAVATHI',
      priority: 'SECURITY',
    });

    expect(channel.channelId).toBe('PTT-CH-AMR-SECURITY');
    expect(channel.district).toBe('AMARAVATHI');
  });

  it('should process push-to-talk broadcast audio transmission with priority stamping', async () => {
    const broadcast = await controller.broadcastPtt('PTT-CH-AMR-SECURITY', {
      channelId: 'PTT-CH-AMR-SECURITY',
      senderUserId: 'USER-MARSHAL-77',
      senderRole: 'FIELD_MARSHAL',
      priority: 'SOS_EMERGENCY',
      audioPacketBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      durationMs: 3500,
    });

    expect(broadcast.lastBroadcastBy).toBe('FIELD_MARSHAL:USER-MARSHAL-77');
    expect(broadcast.priority).toBe('SOS_EMERGENCY');
  });

  it('should retrieve PTT channel state and listen count', async () => {
    const channel = await controller.getChannel('PTT-CH-AMR-SECURITY');
    expect(channel.channelId).toBe('PTT-CH-AMR-SECURITY');
    expect(channel.activeListenCount).toBeGreaterThan(0);
  });
});

