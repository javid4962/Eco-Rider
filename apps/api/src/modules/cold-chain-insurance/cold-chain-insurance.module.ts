import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColdChainExcursionClaim } from '../../database/entities/cold-chain-excursion-claim.entity';
import { ColdChainInsuranceService } from './cold-chain-insurance.service';
import { ColdChainInsuranceController } from './cold-chain-insurance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ColdChainExcursionClaim])],
  controllers: [ColdChainInsuranceController],
  providers: [ColdChainInsuranceService],
  exports: [ColdChainInsuranceService],
})
export class ColdChainInsuranceModule {}
