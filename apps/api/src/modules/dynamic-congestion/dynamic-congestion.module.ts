import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongestionZone } from '../../database/entities/congestion-zone.entity';
import { DynamicCongestionService } from './dynamic-congestion.service';
import { DynamicCongestionController } from './dynamic-congestion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CongestionZone])],
  controllers: [DynamicCongestionController],
  providers: [DynamicCongestionService],
  exports: [DynamicCongestionService],
})
export class DynamicCongestionModule {}

