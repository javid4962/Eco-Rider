import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcpiRoamingSessionEntity } from '../../database/entities/ocpi-roaming-session.entity';
import { OcpiRoamingProtocolService } from './ocpi-roaming-protocol.service';
import { OcpiRoamingProtocolController } from './ocpi-roaming-protocol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OcpiRoamingSessionEntity])],
  controllers: [OcpiRoamingProtocolController],
  providers: [OcpiRoamingProtocolService],
  exports: [OcpiRoamingProtocolService],
})
export class OcpiRoamingProtocolModule {}
