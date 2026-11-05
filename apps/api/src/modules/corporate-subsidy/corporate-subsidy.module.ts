import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateSubsidyPolicy } from '../../database/entities/corporate-subsidy-policy.entity';
import { EmployeeSubsidyClaim } from '../../database/entities/employee-subsidy-claim.entity';
import { CorporateSubsidyService } from './corporate-subsidy.service';
import { CorporateSubsidyController } from './corporate-subsidy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateSubsidyPolicy, EmployeeSubsidyClaim])],
  controllers: [CorporateSubsidyController],
  providers: [CorporateSubsidyService],
  exports: [CorporateSubsidyService],
})
export class CorporateSubsidyModule {}

