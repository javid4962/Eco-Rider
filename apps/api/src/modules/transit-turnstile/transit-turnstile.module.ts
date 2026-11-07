import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransitTurnstileAccess } from '../../database/entities/transit-turnstile-access.entity';
import { TransitTurnstileService } from './transit-turnstile.service';
import { TransitTurnstileController } from './transit-turnstile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransitTurnstileAccess])],
  controllers: [TransitTurnstileController],
  providers: [TransitTurnstileService],
  exports: [TransitTurnstileService],
})
export class TransitTurnstileModule {}
