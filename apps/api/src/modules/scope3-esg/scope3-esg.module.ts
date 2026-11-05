import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateScope3Report } from '../../database/entities/corporate-scope3-report.entity';
import { Scope3EsgService } from './scope3-esg.service';
import { Scope3EsgController } from './scope3-esg.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateScope3Report])],
  controllers: [Scope3EsgController],
  providers: [Scope3EsgService],
  exports: [Scope3EsgService],
})
export class Scope3EsgModule {}

