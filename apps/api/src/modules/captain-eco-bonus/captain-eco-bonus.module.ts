import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainEcoDrivingRecord } from '../../database/entities/captain-eco-driving-record.entity';
import { CaptainEcoBonusService } from './captain-eco-bonus.service';
import { CaptainEcoBonusController } from './captain-eco-bonus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainEcoDrivingRecord])],
  controllers: [CaptainEcoBonusController],
  providers: [CaptainEcoBonusService],
  exports: [CaptainEcoBonusService],
})
export class CaptainEcoBonusModule {}

