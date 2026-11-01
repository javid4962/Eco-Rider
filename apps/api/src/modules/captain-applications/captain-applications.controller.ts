import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CaptainApplicationsService } from './captain-applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  UpdateCaptainApplicationDraftDto,
  SubmitCaptainApplicationDto,
  ReviewCaptainApplicationDto,
  CaptainApplicationsQueryDto,
} from './dto';

@ApiTags('Captain Onboarding & Document Verification')
@Controller('captain-applications')
export class CaptainApplicationsController {
  constructor(private readonly applicationsService: CaptainApplicationsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get or initialize current captain application draft',
    description:
      'Retrieves the authenticated applicant’s onboarding application or creates a persisted DRAFT if one does not exist.',
  })
  @ApiResponse({ status: 200, description: 'Application draft retrieved' })
  async getMyApplication(@CurrentActor() actor: CurrentActorPayload) {
    return this.applicationsService.getOrCreateDraft(actor);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save/update application draft',
    description:
      'Saves partial onboarding data across driver and vehicle requirements. Persists draft data and allows editing rejected applications without creating duplicates.',
  })
  @ApiResponse({ status: 200, description: 'Application draft saved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify application while under review' })
  async updateMyDraft(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: UpdateCaptainApplicationDraftDto,
  ) {
    return this.applicationsService.updateDraft(actor, dto);
  }

  @Post('me/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit or resubmit application for verification',
    description:
      'Validates all mandatory driver and electric vehicle fields, transitions status to SUBMITTED, and increments submission count without creating duplicate records.',
  })
  @ApiResponse({ status: 200, description: 'Application submitted for review' })
  @ApiResponse({ status: 400, description: 'Validation failed or missing mandatory fields' })
  async submitMyApplication(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto?: SubmitCaptainApplicationDto,
  ) {
    return this.applicationsService.submitApplication(actor, dto);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current captain application review history',
    description:
      'Retrieves chronological review events, requirement decisions, and feedback notes for the current user’s application.',
  })
  @ApiResponse({ status: 200, description: 'Application review history retrieved' })
  async getMyReviewHistory(@CurrentActor() actor: CurrentActorPayload) {
    return this.applicationsService.getApplicationReviewHistory(actor);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List captain applications (Operations / Admin)',
    description:
      'Lists submitted and processed captain onboarding applications with filtering by status and city.',
  })
  @ApiResponse({ status: 200, description: 'Paginated applications list' })
  @ApiResponse({ status: 403, description: 'Forbidden: Operator or Super Admin role required' })
  async listApplications(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: CaptainApplicationsQueryDto,
  ) {
    return this.applicationsService.listApplications(actor, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get application details by ID',
    description:
      'Retrieves the exact submitted data, driver requirements, vehicle requirements, and review history.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-account access denied' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplicationById(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.getApplicationById(actor, id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get application review history by application ID',
    description: 'Retrieves complete review history audit trail for an application.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Review history retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  async getApplicationHistory(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.getApplicationReviewHistory(actor, id);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review captain application (Operations / Admin)',
    description:
      'Performs independent verification of driver and vehicle requirements, records feedback remarks, and activates captain profile upon full approval.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application review processed successfully' })
  @ApiResponse({ status: 400, description: 'Inconsistent approval decision or invalid status' })
  @ApiResponse({ status: 403, description: 'Forbidden: Operator or Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async reviewApplication(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCaptainApplicationDto,
  ) {
    return this.applicationsService.reviewApplication(actor, id, dto);
  }
}
