import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonsoonTractionEvent } from '../../database/entities/monsoon-traction-event.entity';
import { MonsoonTractionService } from './monsoon-traction.service';
import { MonsoonTractionController } from './monsoon-traction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MonsoonTractionEvent])],
  controllers: [MonsoonTractionController],
  providers: [MonsoonTractionService],
  exports: [MonsoonTractionService],
})
export class MonsoonTractionModule {}

