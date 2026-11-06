import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainPensionService } from './captain-pension.service';
import { CaptainPensionController } from './captain-pension.controller';
import { CaptainPensionAccount } from '../../database/entities/captain-pension-account.entity';
import { PensionDeductionRecord } from '../../database/entities/pension-deduction-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainPensionAccount, PensionDeductionRecord])],
  controllers: [CaptainPensionController],
  providers: [CaptainPensionService],
  exports: [CaptainPensionService],
})
export class CaptainPensionModule {}

