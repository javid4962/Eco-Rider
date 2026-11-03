import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FareRule } from '../../database/entities/fare-rule.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { IdentityModule } from '../identity/identity.module';
import { AuthModule } from '../auth/auth.module';
import { FareRulesService } from './fare-rules.service';
import { FareRulesController } from './fare-rules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FareRule, AuditEvent]), IdentityModule, AuthModule],
  controllers: [FareRulesController],
  providers: [FareRulesService],
  exports: [FareRulesService],
})
export class FareRulesModule {}
