import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainShiftErgonomics } from '../../database/entities/captain-shift-ergonomics.entity';
import { CaptainShiftErgonomicsService } from './captain-shift-ergonomics.service';
import { CaptainShiftErgonomicsController } from './captain-shift-ergonomics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainShiftErgonomics])],
  controllers: [CaptainShiftErgonomicsController],
  providers: [CaptainShiftErgonomicsService],
  exports: [CaptainShiftErgonomicsService],
})
export class CaptainShiftErgonomicsModule {}
