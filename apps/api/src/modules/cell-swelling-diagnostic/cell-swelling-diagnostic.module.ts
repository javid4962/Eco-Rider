import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellDiagnosticGateLogEntity } from '../../database/entities/cell-diagnostic-gate-log.entity';
import { CellSwellingDiagnosticService } from './cell-swelling-diagnostic.service';
import { CellSwellingDiagnosticController } from './cell-swelling-diagnostic.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CellDiagnosticGateLogEntity])],
  controllers: [CellSwellingDiagnosticController],
  providers: [CellSwellingDiagnosticService],
  exports: [CellSwellingDiagnosticService],
})
export class CellSwellingDiagnosticModule {}

