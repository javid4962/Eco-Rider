import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartLockersService } from './smart-lockers.service';
import { SmartLockersController } from './smart-lockers.controller';
import { SmartLockerCompartment } from '../../database/entities/smart-locker-compartment.entity';
import { LockerAccessLog } from '../../database/entities/locker-access-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmartLockerCompartment, LockerAccessLog])],
  controllers: [SmartLockersController],
  providers: [SmartLockersService],
  exports: [SmartLockersService],
})
export class SmartLockersModule {}
