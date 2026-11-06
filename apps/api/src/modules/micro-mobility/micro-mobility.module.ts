import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroMobilitySession } from '../../database/entities/micro-mobility-session.entity';
import { MicroMobilityService } from './micro-mobility.service';
import { MicroMobilityController } from './micro-mobility.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MicroMobilitySession])],
  controllers: [MicroMobilityController],
  providers: [MicroMobilityService],
  exports: [MicroMobilityService],
})
export class MicroMobilityModule {}
