import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VernacularService } from '../src/modules/vernacular/vernacular.service';
import { VernacularController } from '../src/modules/vernacular/vernacular.controller';
import { CaptainVoicePreference } from '../src/database/entities/captain-voice-preference.entity';
import { VoicePromptEvent } from '@ecoride/contracts';

describe('VernacularService (M40)', () => {
  let service: VernacularService;
  let mockPrefRepo: any;

  beforeEach(async () => {
    mockPrefRepo = {
      create: jest.fn((e) => ({ ...e, id: 'pref-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VernacularController],
      providers: [
        VernacularService,
        { provide: getRepositoryToken(CaptainVoicePreference), useValue: mockPrefRepo },
      ],
    }).compile();

    service = module.get<VernacularService>(VernacularService);
  });

  it('should generate localized dispatch offer voice prompt in Telugu by default', async () => {
    const prompt = await service.getVoicePrompt(VoicePromptEvent.DISPATCH_OFFER_RECEIVED, 'te', { amount: '125' });

    expect(prompt.event).toBe(VoicePromptEvent.DISPATCH_OFFER_RECEIVED);
    expect(prompt.language).toBe('te');
    expect(prompt.transcriptText).toContain('కొత్త ఈవీ రైడ్ ఆఫర్ వచ్చింది. చార్జీ ₹125. 15 సెకన్లలో అంగీకరించండి.');
    expect(prompt.audioAssetUrl).toContain('/audio/prompts/te/dispatch_offer_received.mp3');
    expect(prompt.durationSeconds).toBeGreaterThanOrEqual(2);
  });

  it('should generate localized emergency AP 112 SOS alert voice prompt', async () => {
    const prompt = await service.getVoicePrompt(VoicePromptEvent.EMERGENCY_SOS_COUNTDOWN, 'te');

    expect(prompt.event).toBe(VoicePromptEvent.EMERGENCY_SOS_COUNTDOWN);
    expect(prompt.transcriptText).toContain('ఆంధ్రప్రదేశ్ పోలీస్ 112 కంట్రోల్ రూమ్');
    expect(prompt.audioAssetUrl).toContain('/audio/prompts/te/emergency_sos_countdown.mp3');
  });

  it('should retrieve default captain settings and update audio preferences', async () => {
    mockPrefRepo.findOne.mockResolvedValueOnce(null); // No existing preference

    const defaultSettings = await service.getCaptainSettings('c0000000-0000-4000-8000-000000000001');
    expect(defaultSettings.preferredAudioLanguage).toBe('te');
    expect(defaultSettings.voiceAnnouncementsEnabled).toBe(true);

    mockPrefRepo.findOne.mockResolvedValueOnce(null); // For update insert
    const updated = await service.updateCaptainSettings('c0000000-0000-4000-8000-000000000001', {
      preferredAudioLanguage: 'ur',
      slowAudioCadenceEnabled: true,
    });

    expect(updated.preferredAudioLanguage).toBe('ur');
    expect(updated.slowAudioCadenceEnabled).toBe(true);
    expect(mockPrefRepo.save).toHaveBeenCalled();
  });
});

