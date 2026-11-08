import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VernacularVoicePromptLogEntity } from '../../database/entities/vernacular-voice-prompt-log.entity';
import {
  GenerateVoicePromptDto,
  VernacularDialect,
  VoicePromptCategory,
} from '@ecoride/contracts';

@Injectable()
export class VernacularVoicePromptService {
  constructor(
    @InjectRepository(VernacularVoicePromptLogEntity)
    private readonly logRepo: Repository<VernacularVoicePromptLogEntity>,
  ) {}

  async generatePrompt(dto: GenerateVoicePromptDto): Promise<VernacularVoicePromptLogEntity> {
    let spokenScriptText = 'EcoRide Captain Voice Alert.';
    let hapticPattern = 'SHORT_PULSE';
    let estimatedAudioDurationSeconds = 4;

    const val = dto.parameterValue ?? '';

    switch (dto.category) {
      case VoicePromptCategory.PICKUP_ARRIVAL:
        if (dto.dialect === VernacularDialect.TELUGU_COASTAL_ANDHRA) {
          spokenScriptText = 'మీరు పికప్ స్థానానికి చేరుకున్నారు. దయచేసి ప్రయాణికుడి ఓటీపీ ని అడగండి.';
        } else if (dto.dialect === VernacularDialect.TELUGU_RAYALASEEMA) {
          spokenScriptText = 'పికప్ పాయింట్ కు చేరినారు స్వామి. పాసెంజర్ ఓటీపీ అడగండి.';
        } else if (dto.dialect === VernacularDialect.URDU_DECCANI) {
          spokenScriptText = 'Aap pickup jagah pahunch gaye. Rider se OTP puchiye.';
        } else {
          spokenScriptText = 'You have reached the pickup location. Please request the rider OTP.';
        }
        hapticPattern = 'DOUBLE_PULSE';
        estimatedAudioDurationSeconds = 4;
        break;

      case VoicePromptCategory.BATTERY_LOW_REROUTE:
        if (dto.dialect === VernacularDialect.TELUGU_COASTAL_ANDHRA) {
          spokenScriptText = `బ్యాటరీ ${val} కు తగ్గింది. సమీపంలోని చార్జింగ్ డిపోకు రీరూట్ చేయబడింది.`;
        } else {
          spokenScriptText = `Battery dropped to ${val}. Auto-rerouted to nearest depot.`;
        }
        hapticPattern = 'LONG_ALERT_PULSE';
        estimatedAudioDurationSeconds = 5;
        break;

      case VoicePromptCategory.TRIP_COMPLETED_FARE:
        if (dto.dialect === VernacularDialect.TELUGU_COASTAL_ANDHRA) {
          spokenScriptText = `ట్రిప్ పూర్తయింది. నగదు సేకరణ మొత్తం ${val}. ధన్యవాదాలు.`;
        } else {
          spokenScriptText = `Trip completed. Collect fare ${val}. Thank you.`;
        }
        hapticPattern = 'SUCCESS_CHIME_PULSE';
        estimatedAudioDurationSeconds = 4;
        break;

      default:
        spokenScriptText = 'రైడ్ మార్గం అప్డేట్ అయింది. జాగ్రత్తగా నడపండి.';
        hapticPattern = 'SINGLE_PULSE';
        estimatedAudioDurationSeconds = 3;
        break;
    }

    const record = this.logRepo.create({
      captainId: dto.captainId,
      dialect: dto.dialect,
      category: dto.category,
      spokenScriptText,
      hapticPattern,
      estimatedAudioDurationSeconds,
      generatedAt: new Date(),
    });

    return this.logRepo.save(record);
  }

  async getPrompt(id: string): Promise<VernacularVoicePromptLogEntity> {
    const record = await this.logRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Vernacular voice prompt ${id} not found`);
    }
    return record;
  }
}
