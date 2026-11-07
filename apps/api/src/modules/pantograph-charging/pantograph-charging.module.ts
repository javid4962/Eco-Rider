import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PantographChargingSessionEntity } from '../../database/entities/pantograph-charging-session.entity';
import { PantographChargingService } from './pantograph-charging.service';
import { PantographChargingController } from './pantograph-charging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PantographChargingSessionEntity])],
  controllers: [PantographChargingController],
  providers: [PantographChargingService],
  exports: [PantographChargingService],
})
export class PantographChargingModule {}

