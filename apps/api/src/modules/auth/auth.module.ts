import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Role,
  RiderProfile,
  DriverProfile,
  Session,
  AuditEvent,
} from '../../database/entities';
import { IdentityModule } from '../identity/identity.module';
import { ProvidersModule } from '../providers/providers.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, RiderProfile, DriverProfile, Session, AuditEvent]),
    IdentityModule,
    ProvidersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
