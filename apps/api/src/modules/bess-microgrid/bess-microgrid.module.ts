import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepotBessUnit } from '../../database/entities/depot-bess-unit.entity';
import { BessMicrogridService } from './bess-microgrid.service';
import { BessMicrogridController } from './bess-microgrid.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DepotBessUnit])],
  controllers: [BessMicrogridController],
  providers: [BessMicrogridService],
  exports: [BessMicrogridService],
})
export class BessMicrogridModule {}

