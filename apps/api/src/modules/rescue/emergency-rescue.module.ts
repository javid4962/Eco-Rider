import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RescueRequest } from '../../database/entities/rescue-request.entity';
import { RescueUnit } from '../../database/entities/rescue-unit.entity';
import { EmergencyRescueService } from './emergency-rescue.service';
import { EmergencyRescueController } from './emergency-rescue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RescueRequest, RescueUnit])],
  controllers: [EmergencyRescueController],
  providers: [EmergencyRescueService],
  exports: [EmergencyRescueService],
})
export class EmergencyRescueModule {}

