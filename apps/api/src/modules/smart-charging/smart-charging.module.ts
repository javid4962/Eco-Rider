import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartChargingProfile } from '../../database/entities/smart-charging-profile.entity';
import { TransformerStationLoad } from '../../database/entities/transformer-station-load.entity';
import { SmartChargingService } from './smart-charging.service';
import { SmartChargingController } from './smart-charging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SmartChargingProfile, TransformerStationLoad])],
  controllers: [SmartChargingController],
  providers: [SmartChargingService],
  exports: [SmartChargingService],
})
export class SmartChargingModule {}

