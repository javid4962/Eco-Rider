import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColdChainShipment } from '../../database/entities/cold-chain-shipment.entity';
import { ColdChainTelemetryLog } from '../../database/entities/cold-chain-telemetry-log.entity';
import { ColdChainService } from './cold-chain.service';
import { ColdChainController } from './cold-chain.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ColdChainShipment, ColdChainTelemetryLog])],
  controllers: [ColdChainController],
  providers: [ColdChainService],
  exports: [ColdChainService],
})
export class ColdChainModule {}

