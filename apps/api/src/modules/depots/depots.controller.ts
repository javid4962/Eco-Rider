import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DepotsService } from './depots.service';
import {
  FleetDepotDto,
  DepotBayAllocationDto,
  AllocateBayRequestDto,
} from '@ecoride/contracts';

@Controller('depots')
export class DepotsController {
  constructor(private readonly depotsService: DepotsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listDepots(@Query('city') city?: string): Promise<FleetDepotDto[]> {
    return this.depotsService.listDepots(city);
  }

  @Post('allocate')
  @HttpCode(HttpStatus.CREATED)
  allocateBay(@Body() dto: AllocateBayRequestDto): Promise<DepotBayAllocationDto> {
    return this.depotsService.allocateBay(dto);
  }

  @Post('allocations/:id/release')
  @HttpCode(HttpStatus.OK)
  releaseBay(@Param('id', ParseUUIDPipe) id: string): Promise<DepotBayAllocationDto> {
    return this.depotsService.releaseBay(id);
  }
}

