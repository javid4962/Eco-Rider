import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VernacularVoicePromptService } from '../src/modules/vernacular-voice-prompt/vernacular-voice-prompt.service';
import { VernacularVoicePromptController } from '../src/modules/vernacular-voice-prompt/vernacular-voice-prompt.controller';
import { VernacularVoicePromptLogEntity } from '../src/database/entities/vernacular-voice-prompt-log.entity';
import { VernacularDialect, VoicePromptCategory } from '@ecoride/contracts';

describe('VernacularVoicePromptModule', () => {
  let service: VernacularVoicePromptService;
  let controller: VernacularVoicePromptController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-voice-prompt-uuid',
      generatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-voice-prompt-uuid') {
        return {
          id: 'mock-voice-prompt-uuid',
          dialect: VernacularDialect.TELUGU_COASTAL_ANDHRA,
          category: VoicePromptCategory.PICKUP_ARRIVAL,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VernacularVoicePromptController],
      providers: [
        VernacularVoicePromptService,
        {
          provide: getRepositoryToken(VernacularVoicePromptLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<VernacularVoicePromptService>(VernacularVoicePromptService);
    controller = module.get<VernacularVoicePromptController>(VernacularVoicePromptController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should generate Coastal Andhra Telugu audio prompt and double haptic pulse upon pickup arrival', async () => {
    const prompt = await controller.generate({
      captainId: 'CAPTAIN-AP-9901',
      dialect: VernacularDialect.TELUGU_COASTAL_ANDHRA,
      category: VoicePromptCategory.PICKUP_ARRIVAL,
    });

    expect(prompt.dialect).toBe(VernacularDialect.TELUGU_COASTAL_ANDHRA);
    expect(prompt.category).toBe(VoicePromptCategory.PICKUP_ARRIVAL);
    expect(prompt.spokenScriptText).toContain('మీరు పికప్ స్థానానికి చేరుకున్నారు');
    expect(prompt.hapticPattern).toBe('DOUBLE_PULSE');
    expect(prompt.estimatedAudioDurationSeconds).toBe(4);
  });

  it('should generate Deccani Urdu dialect audio prompt upon pickup arrival', async () => {
    const prompt = await controller.generate({
      captainId: 'CAPTAIN-AP-9902',
      dialect: VernacularDialect.URDU_DECCANI,
      category: VoicePromptCategory.PICKUP_ARRIVAL,
    });

    expect(prompt.dialect).toBe(VernacularDialect.URDU_DECCANI);
    expect(prompt.spokenScriptText).toContain('Aap pickup jagah pahunch gaye');
  });
});
