import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateRequisition } from '../../database/entities/corporate-requisition.entity';
import { CorporateApprovalsService } from './corporate-approvals.service';
import { CorporateApprovalsController } from './corporate-approvals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateRequisition])],
  controllers: [CorporateApprovalsController],
  providers: [CorporateApprovalsService],
  exports: [CorporateApprovalsService],
})
export class CorporateApprovalsModule {}
