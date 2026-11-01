import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainApplication } from '../../database/entities/captain-application.entity';
import { CaptainApplicationReview } from '../../database/entities/captain-application-review.entity';
import { User } from '../../database/entities/user.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Document } from '../../database/entities/document.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { CaptainApplicationsService } from './captain-applications.service';
import { CaptainApplicationsController } from './captain-applications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CaptainApplication,
      CaptainApplicationReview,
      User,
      DriverProfile,
      Vehicle,
      Document,
      AuditEvent,
    ]),
    AuthModule,
  ],
  controllers: [CaptainApplicationsController],
  providers: [CaptainApplicationsService],
  exports: [CaptainApplicationsService],
})
export class CaptainApplicationsModule {}
