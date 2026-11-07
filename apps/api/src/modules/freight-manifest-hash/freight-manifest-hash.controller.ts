import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FreightManifestHashService } from './freight-manifest-hash.service';
import {
  FreightManifestHashRequest,
  FreightManifestHashRecord,
  FreightVerificationResult,
} from '@ecoride/contracts';

@Controller('v1/freight-manifests')
export class FreightManifestHashController {
  constructor(private readonly freightHashService: FreightManifestHashService) {}

  @Post('anchor')
  async anchorManifest(@Body() body: FreightManifestHashRequest): Promise<FreightManifestHashRecord> {
    return this.freightHashService.anchorManifest(body);
  }

  @Get('verify/:manifestId')
  async verifyManifest(@Param('manifestId') manifestId: string): Promise<FreightVerificationResult> {
    return this.freightHashService.verifyManifest(manifestId);
  }
}

