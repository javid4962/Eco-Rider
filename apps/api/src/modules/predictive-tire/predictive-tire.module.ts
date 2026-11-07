import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictiveTireAssessment } from '../../database/entities/predictive-tire-assessment.entity';
import { PredictiveTireService } from './predictive-tire.service';
import { PredictiveTireController } from './predictive-tire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PredictiveTireAssessment])],
  controllers: [PredictiveTireController],
  providers: [PredictiveTireService],
  exports: [PredictiveTireService],
})
export class PredictiveTireModule {}

