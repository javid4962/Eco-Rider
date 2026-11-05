import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HubSpokeFreightService } from './hub-spoke-freight.service';
import { FreightManifestDto, CreateFreightManifestDto } from '@ecoride/contracts';

@Controller('freight')
export class HubSpokeFreightController {
  constructor(private readonly freightService: HubSpokeFreightService) {}

  @Post('manifests')
  @HttpCode(HttpStatus.CREATED)
  createManifest(@Body() dto: CreateFreightManifestDto): Promise<FreightManifestDto> {
    return this.freightService.createManifest(dto);
  }

  @Post('manifests/:manifestNumber/weighbridge')
  @HttpCode(HttpStatus.OK)
  recordWeighbridge(
    @Param('manifestNumber') manifestNumber: string,
    @Body() body: { tareWeightKg: number; grossWeightKg: number },
  ): Promise<FreightManifestDto> {
    return this.freightService.recordWeighbridgeCheck(manifestNumber, body.tareWeightKg, body.grossWeightKg);
  }
}

