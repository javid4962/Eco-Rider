import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiStopTspRouteEntity } from '../../database/entities/multi-stop-tsp-route.entity';
import { MultiStopTspRoutingService } from './multi-stop-tsp-routing.service';
import { MultiStopTspRoutingController } from './multi-stop-tsp-routing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MultiStopTspRouteEntity])],
  controllers: [MultiStopTspRoutingController],
  providers: [MultiStopTspRoutingService],
  exports: [MultiStopTspRoutingService],
})
export class MultiStopTspRoutingModule {}
