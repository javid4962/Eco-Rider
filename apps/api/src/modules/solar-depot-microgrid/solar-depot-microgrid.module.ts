import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarDepotMicrogridEventEntity } from '../../database/entities/solar-depot-microgrid-event.entity';
import { SolarDepotMicrogridService } from './solar-depot-microgrid.service';
import { SolarDepotMicrogridController } from './solar-depot-microgrid.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SolarDepotMicrogridEventEntity])],
  controllers: [SolarDepotMicrogridController],
  providers: [SolarDepotMicrogridService],
  exports: [SolarDepotMicrogridService],
})
export class SolarDepotMicrogridModule {}

