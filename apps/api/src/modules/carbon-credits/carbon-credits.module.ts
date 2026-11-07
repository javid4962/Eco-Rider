import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarbonCreditBatch } from '../../database/entities/carbon-credit-batch.entity';
import { CarbonCreditsService } from './carbon-credits.service';
import { CarbonCreditsController } from './carbon-credits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CarbonCreditBatch])],
  controllers: [CarbonCreditsController],
  providers: [CarbonCreditsService],
  exports: [CarbonCreditsService],
})
export class CarbonCreditsModule {}

