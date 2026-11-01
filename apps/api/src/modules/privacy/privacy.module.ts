import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Consent,
  AuditEvent,
  Session,
  SavedLocation,
  Booking,
  DataDeletionRequest,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Consent,
      AuditEvent,
      Session,
      SavedLocation,
      Booking,
      DataDeletionRequest,
    ]),
    AuthModule,
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
