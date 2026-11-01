import { Module } from '@nestjs/common';
import { ReleaseBoundariesController } from './release-boundaries.controller';
import { ReleaseBoundariesService } from './release-boundaries.service';

@Module({
  controllers: [ReleaseBoundariesController],
  providers: [ReleaseBoundariesService],
  exports: [ReleaseBoundariesService],
})
export class ReleaseBoundariesModule {}
