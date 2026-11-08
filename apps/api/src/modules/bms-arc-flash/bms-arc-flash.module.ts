import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BmsArcFlashEventEntity } from '../../database/entities/bms-arc-flash-event.entity';
import { BmsArcFlashService } from './bms-arc-flash.service';
import { BmsArcFlashController } from './bms-arc-flash.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BmsArcFlashEventEntity])],
  controllers: [BmsArcFlashController],
  providers: [BmsArcFlashService],
  exports: [BmsArcFlashService],
})
export class BmsArcFlashModule {}

