import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { InteractiveVoiceService } from '../src/modules/interactive-voice/interactive-voice.service';
import { IvrVoiceSession } from '../src/database/entities/ivr-voice-session.entity';
import { IvrVoiceIntent } from '@ecoride/contracts';

describe('InteractiveVoiceService (Milestone M59)', () => {
  let service: InteractiveVoiceService;

  const mockSessions: any[] = [];

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `voice-${Date.now()}`,
      ...dto,
      processedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((session) => {
      mockSessions.push(session);
      return Promise.resolve(session);
    }),
  };

  beforeEach(async () => {
    mockSessions.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractiveVoiceService,
        { provide: getRepositoryToken(IvrVoiceSession), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<InteractiveVoiceService>(InteractiveVoiceService);
  });

  it('should parse Telugu dispatch acceptance utterance', async () => {
    const res = await service.processVoiceCommand({
      captainId: 'captain-ap-01',
      audioDurationSeconds: 2.4,
      rawTranscript: 'రైడ్ అంగీకరించు',
    });

    expect(res).toBeDefined();
    expect(res.recognizedLanguage).toBe('te');
    expect(res.parsedIntent).toBe(IvrVoiceIntent.ACCEPT_OFFER);
    expect(res.systemActionTaken).toBe('DISPATCH_ACCEPTED_VIA_VOICE');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });

  it('should parse emergency distress utterance and trigger SOS escalation', async () => {
    const res = await service.processVoiceCommand({
      captainId: 'captain-ap-02',
      audioDurationSeconds: 1.8,
      rawTranscript: 'ఎమర్జెన్సీ ఆపద సహాయం',
    });

    expect(res.parsedIntent).toBe(IvrVoiceIntent.REPORT_EMERGENCY);
    expect(res.systemActionTaken).toBe('TRIGGER_SOS_ALERT_AND_OPS_ESCALATION');
  });

  it('should parse English rejection utterance', async () => {
    const res = await service.processVoiceCommand({
      captainId: 'captain-ap-03',
      audioDurationSeconds: 1.5,
      rawTranscript: 'reject ride',
    });

    expect(res.recognizedLanguage).toBe('en');
    expect(res.parsedIntent).toBe(IvrVoiceIntent.REJECT_OFFER);
    expect(res.systemActionTaken).toBe('DISPATCH_REJECTED_VIA_VOICE');
  });

  it('should throw BadRequestException if transcript is empty', async () => {
    await expect(
      service.processVoiceCommand({
        captainId: 'captain-ap-04',
        audioDurationSeconds: 0,
        rawTranscript: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

