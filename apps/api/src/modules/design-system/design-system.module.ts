import { Module } from '@nestjs/common';
import { DesignSystemController } from './design-system.controller';
import { DesignSystemService } from './design-system.service';

@Module({
  controllers: [DesignSystemController],
  providers: [DesignSystemService],
  exports: [DesignSystemService],
})
export class DesignSystemModule {}

