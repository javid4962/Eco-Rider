import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeedGovernorGeofenceLogEntity } from '../../database/entities/speed-governor-geofence-log.entity';
import { SpeedGovernorGeofenceService } from './speed-governor-geofence.service';
import { SpeedGovernorGeofenceController } from './speed-governor-geofence.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SpeedGovernorGeofenceLogEntity])],
  controllers: [SpeedGovernorGeofenceController],
  providers: [SpeedGovernorGeofenceService],
  exports: [SpeedGovernorGeofenceService],
})
export class SpeedGovernorGeofenceModule {}
