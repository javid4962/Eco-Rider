import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterStatePermitPassEntity } from '../../database/entities/inter-state-permit-pass.entity';
import { InterStatePermitService } from './inter-state-permit.service';
import { InterStatePermitController } from './inter-state-permit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterStatePermitPassEntity])],
  controllers: [InterStatePermitController],
  providers: [InterStatePermitService],
  exports: [InterStatePermitService],
})
export class InterStatePermitModule {}

