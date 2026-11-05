import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TollPlaza } from '../../database/entities/toll-plaza.entity';
import { TollCrossing } from '../../database/entities/toll-crossing.entity';
import { HighwayTollService } from './highway-toll.service';
import { HighwayTollController } from './highway-toll.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TollPlaza, TollCrossing])],
  controllers: [HighwayTollController],
  providers: [HighwayTollService],
  exports: [HighwayTollService],
})
export class HighwayTollModule {}

