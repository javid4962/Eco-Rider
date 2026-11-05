import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VoicePromptEvent,
  VoicePromptDto,
  CaptainVoiceSettingsDto,
} from '@ecoride/contracts';
import { CaptainVoicePreference } from '../../database/entities/captain-voice-preference.entity';

@Injectable()
export class VernacularService {
  constructor(
    @InjectRepository(CaptainVoicePreference)
    private readonly prefRepo: Repository<CaptainVoicePreference>,
  ) {}

  /**
   * Retrieves localized audio prompt metadata for driver accessibility
   */
  async getVoicePrompt(event: VoicePromptEvent, lang = 'te', params?: Record<string, string>): Promise<VoicePromptDto> {
    const language = (['te', 'en', 'ur', 'hi'].includes(lang) ? lang : 'te') as 'te' | 'en' | 'ur' | 'hi';
    const amount = params?.amount ? `₹${params.amount}` : '₹78';

    const catalogs: Record<VoicePromptEvent, Record<string, string>> = {
      [VoicePromptEvent.DISPATCH_OFFER_RECEIVED]: {
        te: `కొత్త ఈవీ రైడ్ ఆఫర్ వచ్చింది. చార్జీ ${amount}. 15 సెకన్లలో అంగీకరించండి.`,
        en: `New EV ride offer received. Fare ${amount}. Please accept within 15 seconds.`,
        ur: `Naya EV ride offer mila hai. Kiraya ${amount}. 15 second mein qubool karein.`,
        hi: `Nayi EV ride offer mili hai. Kiraya ${amount}. 15 second mein sweekar karein.`,
      },
      [VoicePromptEvent.PASSENGER_PICKUP_APPROACHING]: {
        te: 'మీరు పికప్ పాయింట్ కి సమీపిస్తున్నారు. రైడర్ ని ఫోన్ చేయవచ్చు.',
        en: 'You are approaching pickup location. You may call the rider.',
        ur: 'Aap pickup point ke qareeb hain. Rider ko call kar sakte hain.',
        hi: 'Aap pickup point ke paas pahunch rahe hain. Rider ko call kar sakte hain.',
      },
      [VoicePromptEvent.ASK_RIDER_START_OTP]: {
        te: 'దయచేసి రైడర్ వద్ద ఉన్న 4 అంకెల స్టార్ట్ ఓటీపీని అడగండి.',
        en: 'Please ask the rider for the 4-digit ride start OTP.',
        ur: 'Barah-e-karam rider se 4-hindsi start OTP maangein.',
        hi: 'Kripya rider se 4 anko ka start OTP maangein.',
      },
      [VoicePromptEvent.LOW_BATTERY_WARNING]: {
        te: 'హెచ్చరిక: బ్యాటరీ 20% కంటే తగ్గింది. సమీపంలోని బెంజ్ సర్కిల్ స్వాప్ స్టేషన్ కు వెళ్లండి.',
        en: 'Warning: Battery below 20%. Please proceed to the nearest swap station.',
        ur: 'Khabardaar: Battery 20% se kam hai. Qareebi swap station jayein.',
        hi: 'Chetavani: Battery 20% se kam hai. Kripya nikat-tam swap station jayein.',
      },
      [VoicePromptEvent.EMERGENCY_SOS_COUNTDOWN]: {
        te: 'ఎమర్జెన్సీ అలర్ట్: ఆంధ్రప్రదేశ్ పోలీస్ 112 కంట్రోల్ రూమ్ కి సమాచారం పంపబడుతోంది.',
        en: 'Emergency Alert: Escalating to Andhra Pradesh Police 112 Control Room.',
        ur: 'Emergency Alert: Andhra Pradesh Police 112 ko ittele di ja rahi hai.',
        hi: 'Aapaatkaaleen Alert: Andhra Pradesh Police 112 ko soochit kiya ja raha hai.',
      },
      [VoicePromptEvent.TRIP_COMPLETED_FARE_ANNOUNCEMENT]: {
        te: `ట్రిప్ పూర్తయింది. మొత్తం చార్జీ ${amount}. EcoRide తో ప్రయాణించినందుకు ధన్యవాదాలు.`,
        en: `Trip completed. Total fare ${amount}. Thank you for driving with EcoRide.`,
        ur: `Trip mukammal hui. Kul kiraya ${amount}. EcoRide ka shukriya.`,
        hi: `Trip poori hui. Kul kiraya ${amount}. EcoRide chalaane ke liye dhanyavaad.`,
      },
    };

    const transcriptText = catalogs[event]?.[language] || catalogs[event]?.['te'] || 'EcoRide Notification';
    const durationSeconds = Math.max(2, Math.round(transcriptText.length / 15));

    return {
      event,
      language,
      transcriptText,
      audioAssetUrl: `https://cdn.ecoride.in/audio/prompts/${language}/${event.toLowerCase()}.mp3`,
      durationSeconds,
    };
  }

  /**
   * Retrieves or updates captain voice accessibility settings
   */
  async getCaptainSettings(captainId: string): Promise<CaptainVoiceSettingsDto> {
    const pref = await this.prefRepo.findOne({ where: { captainId } });
    if (!pref) {
      return {
        captainId,
        preferredAudioLanguage: 'te', // Telugu default in AP
        voiceAnnouncementsEnabled: true,
        announceFaresAloud: true,
        slowAudioCadenceEnabled: false,
      };
    }

    return {
      captainId: pref.captainId,
      preferredAudioLanguage: pref.preferredAudioLanguage as 'te' | 'en' | 'ur' | 'hi',
      voiceAnnouncementsEnabled: pref.voiceAnnouncementsEnabled,
      announceFaresAloud: pref.announceFaresAloud,
      slowAudioCadenceEnabled: pref.slowAudioCadenceEnabled,
    };
  }

  async updateCaptainSettings(captainId: string, settings: Partial<CaptainVoiceSettingsDto>): Promise<CaptainVoiceSettingsDto> {
    let pref = await this.prefRepo.findOne({ where: { captainId } });
    if (!pref) {
      pref = this.prefRepo.create({
        captainId,
        preferredAudioLanguage: settings.preferredAudioLanguage || 'te',
        voiceAnnouncementsEnabled: settings.voiceAnnouncementsEnabled ?? true,
        announceFaresAloud: settings.announceFaresAloud ?? true,
        slowAudioCadenceEnabled: settings.slowAudioCadenceEnabled ?? false,
      });
    } else {
      if (settings.preferredAudioLanguage) pref.preferredAudioLanguage = settings.preferredAudioLanguage;
      if (settings.voiceAnnouncementsEnabled !== undefined) pref.voiceAnnouncementsEnabled = settings.voiceAnnouncementsEnabled;
      if (settings.announceFaresAloud !== undefined) pref.announceFaresAloud = settings.announceFaresAloud;
      if (settings.slowAudioCadenceEnabled !== undefined) pref.slowAudioCadenceEnabled = settings.slowAudioCadenceEnabled;
    }

    const saved = await this.prefRepo.save(pref);
    return {
      captainId: saved.captainId,
      preferredAudioLanguage: saved.preferredAudioLanguage as 'te' | 'en' | 'ur' | 'hi',
      voiceAnnouncementsEnabled: saved.voiceAnnouncementsEnabled,
      announceFaresAloud: saved.announceFaresAloud,
      slowAudioCadenceEnabled: saved.slowAudioCadenceEnabled,
    };
  }
}

