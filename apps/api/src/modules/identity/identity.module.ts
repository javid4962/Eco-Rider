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
  SavedLocation,
} from '../../database/entities';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { RidersController } from './riders.controller';

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
      SavedLocation,
    ]),
  ],
  controllers: [IdentityController, RidersController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
