import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CampusLoopService } from './campus-loop.service';
import {
  CampusShuttleScheduleDto,
  CampusLoopBookingDto,
  CampusLoopBookingResult,
} from '@ecoride/contracts';
import { CampusShuttleSchedule } from '../../database/entities/campus-shuttle-schedule.entity';

@Controller('campus-loop')
export class CampusLoopController {
  constructor(private readonly campusService: CampusLoopService) {}

  @Post('schedules')
  async createSchedule(
    @Body() dto: CampusShuttleScheduleDto,
  ): Promise<CampusShuttleSchedule> {
    return await this.campusService.createSchedule(dto);
  }

  @Post('book')
  async bookRide(
    @Body() dto: CampusLoopBookingDto,
  ): Promise<CampusLoopBookingResult> {
    return await this.campusService.bookRide(dto);
  }

  @Get('campuses/:code/schedules')
  async getSchedules(@Param('code') code: string): Promise<CampusShuttleSchedule[]> {
    return await this.campusService.getSchedulesByCampus(code);
  }
}

