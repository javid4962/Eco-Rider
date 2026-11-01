import { Module } from '@nestjs/common';
import { TestMatrixController } from './test-matrix.controller';
import { TestMatrixService } from './test-matrix.service';

@Module({
  controllers: [TestMatrixController],
  providers: [TestMatrixService],
  exports: [TestMatrixService],
})
export class TestMatrixModule {}

