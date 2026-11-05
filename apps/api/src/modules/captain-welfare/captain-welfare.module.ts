import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainWelfareLedger } from '../../database/entities/captain-welfare-ledger.entity';
import { MedicalClaim } from '../../database/entities/medical-claim.entity';
import { CaptainWelfareService } from './captain-welfare.service';
import { CaptainWelfareController } from './captain-welfare.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainWelfareLedger, MedicalClaim])],
  controllers: [CaptainWelfareController],
  providers: [CaptainWelfareService],
  exports: [CaptainWelfareService],
})
export class CaptainWelfareModule {}

