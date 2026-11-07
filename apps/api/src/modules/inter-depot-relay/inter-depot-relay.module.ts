import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterDepotParcelRelay } from '../../database/entities/inter-depot-parcel-relay.entity';
import { InterDepotRelayService } from './inter-depot-relay.service';
import { InterDepotRelayController } from './inter-depot-relay.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterDepotParcelRelay])],
  controllers: [InterDepotRelayController],
  providers: [InterDepotRelayService],
  exports: [InterDepotRelayService],
})
export class InterDepotRelayModule {}

