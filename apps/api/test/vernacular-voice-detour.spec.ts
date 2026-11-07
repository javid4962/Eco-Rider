import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VernacularVoiceDetourService } from '../src/modules/vernacular-voice-detour/vernacular-voice-detour.service';
import { VernacularVoiceDetourController } from '../src/modules/vernacular-voice-detour/vernacular-voice-detour.controller';
import { VernacularNavigationPromptEntity } from '../src/database/entities/vernacular-navigation-prompt.entity';

describe('VernacularVoiceDetourModule', () => {
  let service: VernacularVoiceDetourService;
  let controller: VernacularVoiceDetourController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-voice-uuid',
      generatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VernacularVoiceDetourController],
      providers: [
        VernacularVoiceDetourService,
        {
          provide: getRepositoryToken(VernacularNavigationPromptEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<VernacularVoiceDetourService>(VernacularVoiceDetourService);
    controller = module.get<VernacularVoiceDetourController>(VernacularVoiceDetourController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should generate localized Telugu voice prompt directing captain to battery swap hub when SoC <= 10%', async () => {
    const result = await controller.generateDetourPrompt({
      captainId: 'CAP-AP-9901',
      vehicleId: 'EV-AUTO-AP37-0099',
      currentSocPct: 8,
      currentLat: 16.502,
      currentLng: 80.645,
      remainingRangeKm: 7.5,
    });

    expect(result.suggestedFacilityType).toBe('SWAP_STATION');
    expect(result.promptTextTelugu).toContain('హెచ్చరిక');
    expect(result.promptTextTelugu).toContain('బెంజ్ సర్కిల్');
    expect(result.detourDistanceMeters).toBeGreaterThan(0);
    expect(result.audioFileUrl).toBeDefined();
  });

  it('should suggest DC fast charger if battery SoC is between 11% and 15%', async () => {
    const result = await controller.generateDetourPrompt({
      captainId: 'CAP-AP-9902',
      vehicleId: 'EV-CAB-AP37-0055',
      currentSocPct: 14,
      currentLat: 16.3,
      currentLng: 80.45,
      remainingRangeKm: 16.0,
    });

    expect(result.suggestedFacilityType).toBe('FAST_CHARGER');
    expect(result.promptTextEnglish).toContain('Fast Charger');
  });
});

