import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutstationRoute } from '../../database/entities/outstation-route.entity';
import { OutstationTrip } from '../../database/entities/outstation-trip.entity';
import { OutstationService } from './outstation.service';
import { OutstationController } from './outstation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OutstationRoute, OutstationTrip])],
  controllers: [OutstationController],
  providers: [OutstationService],
  exports: [OutstationService],
})
export class OutstationModule {}

