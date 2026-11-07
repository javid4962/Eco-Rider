import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { RuralAgriCargoService } from './rural-agri-cargo.service';
import { AgriConsignmentStatus, CreateAgriConsignmentDto } from '@ecoride/contracts';

@Controller('rural-agri-cargo')
export class RuralAgriCargoController {
  constructor(private readonly service: RuralAgriCargoService) {}

  @Post('consignments')
  async createConsignment(@Body() dto: CreateAgriConsignmentDto) {
    return this.service.createConsignment(dto);
  }

  @Patch('consignments/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AgriConsignmentStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Get('consignments/:id')
  async getById(@Param('id') id: string) {
    return this.service.getConsignment(id);
  }
}
