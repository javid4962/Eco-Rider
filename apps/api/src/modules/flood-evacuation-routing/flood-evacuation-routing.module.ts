import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloodEvacuationAlertEntity } from '../../database/entities/flood-evacuation-alert.entity';
import { FloodEvacuationRoutingService } from './flood-evacuation-routing.service';
import { FloodEvacuationRoutingController } from './flood-evacuation-routing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FloodEvacuationAlertEntity])],
  controllers: [FloodEvacuationRoutingController],
  providers: [FloodEvacuationRoutingService],
  exports: [FloodEvacuationRoutingService],
})
export class FloodEvacuationRoutingModule {}

