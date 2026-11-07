import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroMobilityBounty } from '../../database/entities/micro-mobility-bounty.entity';
import { MicroMobilityBountyService } from './micro-mobility-bounty.service';
import { MicroMobilityBountyController } from './micro-mobility-bounty.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MicroMobilityBounty])],
  controllers: [MicroMobilityBountyController],
  providers: [MicroMobilityBountyService],
  exports: [MicroMobilityBountyService],
})
export class MicroMobilityBountyModule {}
