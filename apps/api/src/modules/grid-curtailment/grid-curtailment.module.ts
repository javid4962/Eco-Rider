import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GridCurtailmentEvent } from '../../database/entities/grid-curtailment-event.entity';
import { GridCurtailmentService } from './grid-curtailment.service';
import { GridCurtailmentController } from './grid-curtailment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GridCurtailmentEvent])],
  controllers: [GridCurtailmentController],
  providers: [GridCurtailmentService],
  exports: [GridCurtailmentService],
})
export class GridCurtailmentModule {}
