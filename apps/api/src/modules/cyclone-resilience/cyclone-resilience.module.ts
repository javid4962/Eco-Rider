import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CycloneRelocationPlan } from '../../database/entities/cyclone-relocation-plan.entity';
import { CycloneResilienceService } from './cyclone-resilience.service';
import { CycloneResilienceController } from './cyclone-resilience.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CycloneRelocationPlan])],
  controllers: [CycloneResilienceController],
  providers: [CycloneResilienceService],
  exports: [CycloneResilienceService],
})
export class CycloneResilienceModule {}

