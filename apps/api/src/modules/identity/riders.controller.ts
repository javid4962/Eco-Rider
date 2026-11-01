import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IdentityService } from './identity.service';
import { CurrentActor, CurrentActorPayload } from './current-actor.decorator';
import {
  UpdateRiderProfileDto,
  CreateSavedLocationDto,
  UpdateSavedLocationDto,
  SavedLocationsQueryDto,
} from './dto';

@Controller('riders')
export class RidersController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('profile')
  async getProfile(@CurrentActor() actor: CurrentActorPayload) {
    return this.identityService.getUserProfile(actor, actor.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: UpdateRiderProfileDto,
  ) {
    return this.identityService.updateRiderProfile(actor, actor.id, dto);
  }

  @Post('saved-locations')
  @HttpCode(HttpStatus.CREATED)
  async createSavedLocation(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CreateSavedLocationDto,
  ) {
    return this.identityService.createSavedLocation(actor, actor.id, dto);
  }

  @Get('saved-locations')
  async getSavedLocations(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: SavedLocationsQueryDto,
  ) {
    return this.identityService.getSavedLocations(actor, actor.id, query);
  }

  @Get('saved-locations/:locationId')
  async getSavedLocationById(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ) {
    return this.identityService.getSavedLocationById(actor, actor.id, locationId);
  }

  @Patch('saved-locations/:locationId')
  async updateSavedLocation(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: UpdateSavedLocationDto,
  ) {
    return this.identityService.updateSavedLocation(actor, actor.id, locationId, dto);
  }

  @Delete('saved-locations/:locationId')
  @HttpCode(HttpStatus.OK)
  async deleteSavedLocation(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ) {
    return this.identityService.deleteSavedLocation(actor, actor.id, locationId);
  }
}
