import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CampusService } from './campus.service';
import { CampusGeofenceDto, CampusShuttleLoopDto, CampusBoardingPassDto } from '@ecoride/contracts';

@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listCampuses(@Query('city') city?: string): Promise<CampusGeofenceDto[]> {
    return this.campusService.listCampuses(city);
  }

  @Get(':campusCode/loops')
  @HttpCode(HttpStatus.OK)
  getLoops(@Param('campusCode') campusCode: string): Promise<CampusShuttleLoopDto[]> {
    return this.campusService.getCampusLoops(campusCode);
  }

  @Post(':campusCode/passes')
  @HttpCode(HttpStatus.CREATED)
  createBoardingPass(
    @Param('campusCode') campusCode: string,
    @Body() body: { id: string; name: string; department: string },
  ): Promise<CampusBoardingPassDto> {
    return this.campusService.generateBoardingPass(campusCode, body);
  }
}

