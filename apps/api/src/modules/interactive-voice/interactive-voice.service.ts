import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IvrVoiceIntent,
  IvrVoiceSessionDto,
  ProcessVoiceCommandDto,
} from '@ecoride/contracts';
import { IvrVoiceSession } from '../../database/entities/ivr-voice-session.entity';

@Injectable()
export class InteractiveVoiceService {
  constructor(
    @InjectRepository(IvrVoiceSession)
    private readonly voiceRepo: Repository<IvrVoiceSession>,
  ) {}

  async processVoiceCommand(dto: ProcessVoiceCommandDto): Promise<IvrVoiceSessionDto> {
    if (!dto.rawTranscript || dto.rawTranscript.trim().length === 0) {
      throw new BadRequestException('Voice transcript cannot be empty');
    }

    const transcriptLower = dto.rawTranscript.toLowerCase().trim();
    let detectedIntent: IvrVoiceIntent = IvrVoiceIntent.ACCEPT_OFFER;
    let systemActionTaken = 'DISPATCH_ACCEPTED_VIA_VOICE';
    let confidenceScore = 0.95;
    let lang: 'te' | 'en' = dto.language || 'te';

    // Dialect parsing for Telugu and English
    if (
      transcriptLower.includes('రైడ్ అంగీకరించు') ||
      transcriptLower.includes('అంగీకరించు') ||
      transcriptLower.includes('తీసుకో') ||
      transcriptLower.includes('accept')
    ) {
      detectedIntent = IvrVoiceIntent.ACCEPT_OFFER;
      systemActionTaken = 'DISPATCH_ACCEPTED_VIA_VOICE';
      confidenceScore = 0.98;
    } else if (
      transcriptLower.includes('తిరస్కరించు') ||
      transcriptLower.includes('వద్దు') ||
      transcriptLower.includes('reject') ||
      transcriptLower.includes('decline')
    ) {
      detectedIntent = IvrVoiceIntent.REJECT_OFFER;
      systemActionTaken = 'DISPATCH_REJECTED_VIA_VOICE';
      confidenceScore = 0.96;
    } else if (
      transcriptLower.includes('కాల్') ||
      transcriptLower.includes('ఫోన్') ||
      transcriptLower.includes('call rider') ||
      transcriptLower.includes('call')
    ) {
      detectedIntent = IvrVoiceIntent.CALL_RIDER;
      systemActionTaken = 'INITIATE_MASKED_VOIP_CALL';
      confidenceScore = 0.94;
    } else if (
      transcriptLower.includes('ఎమర్జెన్సీ') ||
      transcriptLower.includes('సహాయం') ||
      transcriptLower.includes('ఆపద') ||
      transcriptLower.includes('emergency') ||
      transcriptLower.includes('help')
    ) {
      detectedIntent = IvrVoiceIntent.REPORT_EMERGENCY;
      systemActionTaken = 'TRIGGER_SOS_ALERT_AND_OPS_ESCALATION';
      confidenceScore = 0.99;
    } else if (
      transcriptLower.includes('బ్యాటరీ') ||
      transcriptLower.includes('ఛార్జింగ్') ||
      transcriptLower.includes('battery') ||
      transcriptLower.includes('soc')
    ) {
      detectedIntent = IvrVoiceIntent.BATTERY_STATUS;
      systemActionTaken = 'FETCH_TELEMETRICS_BATTERY_SOC';
      confidenceScore = 0.92;
    } else {
      // Fallback unknown intent
      detectedIntent = IvrVoiceIntent.ACCEPT_OFFER;
      systemActionTaken = 'VOICE_COMMAND_AMBIGUOUS_RETRY_REQUESTED';
      confidenceScore = 0.50;
    }

    // Determine language by regex if not specified
    const hasTeluguChars = /[\u0C00-\u0C7F]/.test(dto.rawTranscript);
    if (hasTeluguChars) {
      lang = 'te';
    } else {
      lang = 'en';
    }

    const sessionId = `VOICE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const session = this.voiceRepo.create({
      sessionId,
      captainId: dto.captainId,
      detectedUtterance: dto.rawTranscript,
      recognizedLanguage: lang,
      parsedIntent: detectedIntent,
      confidenceScore,
      systemActionTaken,
    });

    const saved = await this.voiceRepo.save(session);

    return {
      sessionId: saved.sessionId,
      captainId: saved.captainId,
      detectedUtterance: saved.detectedUtterance,
      recognizedLanguage: saved.recognizedLanguage as 'te' | 'en',
      parsedIntent: saved.parsedIntent as IvrVoiceIntent,
      confidenceScore: Number(saved.confidenceScore),
      systemActionTaken: saved.systemActionTaken,
      processedAt: saved.processedAt ? saved.processedAt.toISOString() : new Date().toISOString(),
    };
  }
}

