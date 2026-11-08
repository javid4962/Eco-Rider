import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterySecondLifeListingEntity } from '../../database/entities/battery-second-life-listing.entity';
import { BatterySecondLifeAuctionService } from './battery-second-life-auction.service';
import { BatterySecondLifeAuctionController } from './battery-second-life-auction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BatterySecondLifeListingEntity])],
  controllers: [BatterySecondLifeAuctionController],
  providers: [BatterySecondLifeAuctionService],
  exports: [BatterySecondLifeAuctionService],
})
export class BatterySecondLifeAuctionModule {}

