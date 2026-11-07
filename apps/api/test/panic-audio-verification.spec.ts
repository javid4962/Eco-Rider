import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PanicAudioService } from '../src/modules/panic-audio/panic-audio.service';
import { PanicAudioIncident } from '../src/database/entities/panic-audio-incident.entity';
import { IncidentSeverityLevel } from '@ecoride/contracts';

describe('PanicAudioService (M88)', () => {
  let service: PanicAudioService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'incident-uuid-1',
        createdAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (i) => ({
        ...i,
        createdAt: i.createdAt || new Date(),
      })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PanicAudioService,
        {
          provide: getRepositoryToken(PanicAudioIncident),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PanicAudioService>(PanicAudioService);
  });

  it('should reject panic audio ingestion with zero duration', async () => {
    await expect(
      service.processPanicStream({
        rideId: 'ride-001',
        captainId: 'capt-01',
        riderId: 'rider-01',
        audioDurationSeconds: 0,
        audioSha256Checksum: 'fake-checksum',
        streamDecibelsMax: 70,
        latitude: 16.5,
        longitude: 80.6,
        sosTriggerSource: 'RIDER_APP',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should escalate to P0_CRITICAL_POLICE_DISPATCH and notify AP Police 112 when audio exceeds 85 dB', async () => {
    const result = await service.processPanicStream({
      rideId: 'ride-distress-01',
      captainId: 'capt-01',
      riderId: 'rider-01',
      audioDurationSeconds: 12,
      audioSha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      streamDecibelsMax: 92.5, // High decibel distress
      latitude: 16.506,
      longitude: 80.648,
      sosTriggerSource: 'RIDER_APP',
    });

    expect(result.severity).toBe(IncidentSeverityLevel.P0_CRITICAL_POLICE_DISPATCH);
    expect(result.police112Notified).toBe(true);
    expect(result.policeDispatchToken).toMatch(/^POLICE-112-AP-/);
    expect(result.audioVerified).toBe(true);
  });

  it('should route to Operations Desk as P1_URGENT_OPERATIONS_CALL for moderate decibel audio', async () => {
    const result = await service.processPanicStream({
      rideId: 'ride-inquiry-02',
      captainId: 'capt-02',
      riderId: 'rider-02',
      audioDurationSeconds: 15,
      audioSha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      streamDecibelsMax: 65.0, // Normal conversation level
      latitude: 16.42,
      longitude: 80.55,
      sosTriggerSource: 'CAPTAIN_APP',
    });

    expect(result.severity).toBe(IncidentSeverityLevel.P1_URGENT_OPERATIONS_CALL);
    expect(result.police112Notified).toBe(false);
    expect(result.policeDispatchToken).toBe('NONE');
  });
});

