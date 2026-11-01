import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Role,
  RiderProfile,
  DriverProfile,
  Session,
  Consent,
  AuditEvent,
  Vehicle,
} from '../../database/entities';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      RiderProfile,
      DriverProfile,
      Session,
      Consent,
      AuditEvent,
      Vehicle,
    ]),
  ],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
