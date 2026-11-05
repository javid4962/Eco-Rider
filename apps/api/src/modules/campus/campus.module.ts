import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusGeofence } from '../../database/entities/campus-shuttle.entity';
import { CampusService } from './campus.service';
import { CampusController } from './campus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CampusGeofence])],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}

