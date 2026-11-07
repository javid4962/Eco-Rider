import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoboticSwapSessionEntity } from '../../database/entities/robotic-swap-session.entity';
import { RoboticSwapProtocolService } from './robotic-swap-protocol.service';
import { RoboticSwapProtocolController } from './robotic-swap-protocol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoboticSwapSessionEntity])],
  controllers: [RoboticSwapProtocolController],
  providers: [RoboticSwapProtocolService],
  exports: [RoboticSwapProtocolService],
})
export class RoboticSwapProtocolModule {}

