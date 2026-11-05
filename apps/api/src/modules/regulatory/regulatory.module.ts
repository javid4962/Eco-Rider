import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryAuditLog } from '../../database/entities/regulatory-audit-log.entity';
import { RegulatoryService } from './regulatory.service';
import { RegulatoryController } from './regulatory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegulatoryAuditLog])],
  controllers: [RegulatoryController],
  providers: [RegulatoryService],
  exports: [RegulatoryService],
})
export class RegulatoryModule {}

