import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../../database/entities/document.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrivateDiskStorageAdapter } from './storage/private-disk-storage.adapter';
import { DefaultMalwareScanner } from './scanner/default-malware-scanner';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, AuditEvent]), AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrivateDiskStorageAdapter, DefaultMalwareScanner],
  exports: [DocumentsService, PrivateDiskStorageAdapter, DefaultMalwareScanner],
})
export class DocumentsModule {}
