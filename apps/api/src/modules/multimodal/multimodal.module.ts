import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransitHub } from '../../database/entities/transit-hub.entity';
import { MultiModalTicket } from '../../database/entities/multi-modal-ticket.entity';
import { MultimodalService } from './multimodal.service';
import { MultimodalController } from './multimodal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransitHub,
      MultiModalTicket,
    ]),
  ],
  controllers: [MultimodalController],
  providers: [MultimodalService],
  exports: [MultimodalService],
})
export class MultimodalModule {}

