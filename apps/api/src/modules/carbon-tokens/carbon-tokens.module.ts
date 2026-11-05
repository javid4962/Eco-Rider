import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarbonTokenWallet } from '../../database/entities/carbon-token-wallet.entity';
import { CarbonRewardRedemption } from '../../database/entities/carbon-reward-redemption.entity';
import { CarbonTokensService } from './carbon-tokens.service';
import { CarbonTokensController } from './carbon-tokens.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CarbonTokenWallet, CarbonRewardRedemption])],
  controllers: [CarbonTokensController],
  providers: [CarbonTokensService],
  exports: [CarbonTokensService],
})
export class CarbonTokensModule {}

