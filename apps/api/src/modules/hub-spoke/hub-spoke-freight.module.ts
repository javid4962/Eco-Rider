import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreightManifest } from '../../database/entities/freight-manifest.entity';
import { HubSpokeFreightService } from './hub-spoke-freight.service';
import { HubSpokeFreightController } from './hub-spoke-freight.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FreightManifest])],
  controllers: [HubSpokeFreightController],
  providers: [HubSpokeFreightService],
  exports: [HubSpokeFreightService],
})
export class HubSpokeFreightModule {}

