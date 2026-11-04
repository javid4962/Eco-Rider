import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateAccount } from '../../database/entities/corporate-account.entity';
import { CorporateEmployee } from '../../database/entities/corporate-employee.entity';
import { CorporateShiftManifest } from '../../database/entities/corporate-shift-manifest.entity';
import { CorporateService } from './corporate.service';
import { CorporateController } from './corporate.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorporateAccount,
      CorporateEmployee,
      CorporateShiftManifest,
    ]),
  ],
  controllers: [CorporateController],
  providers: [CorporateService],
  exports: [CorporateService],
})
export class CorporateModule {}

