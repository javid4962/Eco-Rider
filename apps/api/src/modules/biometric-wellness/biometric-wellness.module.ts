import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiometricWellnessService } from './biometric-wellness.service';
import { BiometricWellnessController } from './biometric-wellness.controller';
import { CaptainWellnessScreening } from '../../database/entities/captain-wellness-screening.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainWellnessScreening])],
  controllers: [BiometricWellnessController],
  providers: [BiometricWellnessService],
  exports: [BiometricWellnessService],
})
export class BiometricWellnessModule {}
