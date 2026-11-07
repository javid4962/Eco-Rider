import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { V2hResidentialSession } from '../../database/entities/v2h-residential-session.entity';
import { V2hResidentialBackupService } from './v2h-residential-backup.service';
import { V2hResidentialBackupController } from './v2h-residential-backup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([V2hResidentialSession])],
  controllers: [V2hResidentialBackupController],
  providers: [V2hResidentialBackupService],
  exports: [V2hResidentialBackupService],
})
export class V2hResidentialBackupModule {}
