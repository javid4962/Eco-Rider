import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepotGateAccessLogEntity } from '../../database/entities/depot-gate-access-log.entity';
import { DepotGateAnprService } from './depot-gate-anpr.service';
import { DepotGateAnprController } from './depot-gate-anpr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DepotGateAccessLogEntity])],
  controllers: [DepotGateAnprController],
  providers: [DepotGateAnprService],
  exports: [DepotGateAnprService],
})
export class DepotGateAnprModule {}
