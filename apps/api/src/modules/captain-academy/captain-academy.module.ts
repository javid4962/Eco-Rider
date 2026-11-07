import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainTrainingCertification } from '../../database/entities/captain-training-certification.entity';
import { CaptainAcademyService } from './captain-academy.service';
import { CaptainAcademyController } from './captain-academy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainTrainingCertification])],
  controllers: [CaptainAcademyController],
  providers: [CaptainAcademyService],
  exports: [CaptainAcademyService],
})
export class CaptainAcademyModule {}

