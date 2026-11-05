import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { DisasterRecoveryController } from './disaster-recovery.controller';
import { DrReplicationHealth } from '../../database/entities/dr-replication-health.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DrReplicationHealth])],
  controllers: [DisasterRecoveryController],
  providers: [DisasterRecoveryService],
  exports: [DisasterRecoveryService],
})
export class DisasterRecoveryModule {}

