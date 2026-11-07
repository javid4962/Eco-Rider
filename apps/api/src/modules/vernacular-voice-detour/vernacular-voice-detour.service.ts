import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VernacularNavigationPromptEntity } from '../../database/entities/vernacular-navigation-prompt.entity';
import { LowBatteryDetourAlert, TeluguVoicePromptResult } from '@ecoride/contracts';

@Injectable()
export class VernacularVoiceDetourService {
  constructor(
    @InjectRepository(VernacularNavigationPromptEntity)
    private readonly promptRepo: Repository<VernacularNavigationPromptEntity>,
  ) {}

  async generateDetourPrompt(alert: LowBatteryDetourAlert): Promise<TeluguVoicePromptResult> {
    if (!alert.captainId || !alert.vehicleId) {
      throw new BadRequestException('captainId and vehicleId are required');
    }

    const facilityType = alert.currentSocPct <= 10 ? 'SWAP_STATION' : 'FAST_CHARGER';
    const facilityName =
      facilityType === 'SWAP_STATION'
        ? 'Benz Circle Battery Swap Hub, Vijayawada'
        : 'Auto Nagar DC Fast Charger Bay, Guntur';
    const facilityNameTelugu =
      facilityType === 'SWAP_STATION'
        ? 'బెంజ్ సర్కిల్ బ్యాటరీ మార్పిడి కేంద్రం, విజయవాడ'
        : 'ఆటో నగర్ ఫాస్ట్ ఛార్జర్ కేంద్రం, గుంటూరు';
    const facilityId = facilityType === 'SWAP_STATION' ? 'SWAP-BZA-BENZ-01' : 'FAST-GNT-AUTONAGAR-02';
    const detourDistanceMeters = 650;

    const promptTextTelugu = `హెచ్చరిక: మీ బ్యాటరీ ఛార్జ్ ${alert.currentSocPct}% మాత్రమే ఉంది. దయచేసి ${detourDistanceMeters} మీటర్ల దూరంలో ఉన్న ${facilityNameTelugu} కు మళ్ళించండి.`;
    const promptTextEnglish = `Warning: Battery level is ${alert.currentSocPct}%. Please detour ${detourDistanceMeters}m to ${facilityName}.`;
    const audioFileUrl = `https://storage.ecoride.ap.gov.in/voice/te/detour-${alert.vehicleId}-${Date.now()}.mp3`;

    const prompt = this.promptRepo.create({
      captainId: alert.captainId,
      vehicleId: alert.vehicleId,
      promptTextTelugu,
      promptTextEnglish,
      suggestedFacilityType: facilityType,
      targetFacilityId: facilityId,
      targetFacilityName: facilityName,
      detourDistanceMeters,
      audioFileUrl,
    });

    const saved = await this.promptRepo.save(prompt);

    return {
      id: saved.id,
      captainId: saved.captainId,
      vehicleId: saved.vehicleId,
      promptTextTelugu: saved.promptTextTelugu,
      promptTextEnglish: saved.promptTextEnglish,
      suggestedFacilityType: saved.suggestedFacilityType as 'SWAP_STATION' | 'FAST_CHARGER',
      targetFacilityId: saved.targetFacilityId,
      targetFacilityName: saved.targetFacilityName,
      detourDistanceMeters: saved.detourDistanceMeters,
      audioFileUrl: saved.audioFileUrl,
      generatedAt: saved.generatedAt ? saved.generatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getCaptainPrompts(captainId: string): Promise<VernacularNavigationPromptEntity[]> {
    return this.promptRepo.find({
      where: { captainId },
      order: { generatedAt: 'DESC' },
      take: 20,
    });
  }
}
