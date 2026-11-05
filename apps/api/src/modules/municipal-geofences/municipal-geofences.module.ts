import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MunicipalMicroGeofence } from '../../database/entities/municipal-micro-geofence.entity';
import { MunicipalGeofencesService } from './municipal-geofences.service';
import { MunicipalGeofencesController } from './municipal-geofences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MunicipalMicroGeofence])],
  controllers: [MunicipalGeofencesController],
  providers: [MunicipalGeofencesService],
  exports: [MunicipalGeofencesService],
})
export class MunicipalGeofencesModule {}

