import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import {
  PresignedUploadDto,
  GenerateSignedUrlQueryDto,
  DownloadByTokenQueryDto,
} from './dto/presigned-access.dto';
import { DocumentsPaginationDto } from './dto/pagination-query.dto';

@ApiTags('Documents & KYC')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload KYC or vehicle document',
    description:
      'Uploads a document with binary inspection (magic bytes anti-spoofing), strict 5MB size limit, and malware scan.',
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and metadata persisted successfully',
  })
  @ApiResponse({ status: 400, description: 'Extension or MIME type spoofing detected' })
  @ApiResponse({ status: 413, description: 'File size exceeds maximum allowed limit (5 MB)' })
  @ApiResponse({ status: 422, description: 'Malware or threat detected in uploaded document' })
  async upload(@CurrentActor() actor: CurrentActorPayload, @Body() dto: UploadDocumentDto) {
    return this.documentsService.uploadDocument(actor, dto);
  }

  @Post('presigned-upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request presigned upload ticket',
    description: 'Generates a signed upload ticket and storage key for direct client upload.',
  })
  @ApiResponse({ status: 200, description: 'Presigned upload ticket generated' })
  async createPresignedUpload(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: PresignedUploadDto,
  ) {
    return this.documentsService.createPresignedUpload(actor, dto);
  }

  @Get(':id/signed-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate signed temporary access link for document',
    description:
      'Creates a time-limited HMAC-SHA256 signed access URL for the document owner, operator, or compliance team.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Temporary signed access link created' })
  @ApiResponse({ status: 403, description: 'Cross-account access denied or document expired' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getSignedUrl(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id') id: string,
    @Query() query: GenerateSignedUrlQueryDto,
  ) {
    return this.documentsService.getPresignedAccessUrl(actor, id, query.expiresInSeconds);
  }

  @Get('download')
  @ApiOperation({
    summary: 'Download document via temporary signed token',
    description:
      'Publicly accessible download endpoint verified via cryptographically signed HMAC token. Expired or tampered links fail.',
  })
  @ApiQuery({ name: 'token', description: 'Cryptographic temporary access token' })
  @ApiResponse({ status: 200, description: 'Document binary stream' })
  @ApiResponse({
    status: 403,
    description: 'Signed access link has expired or signature is invalid',
  })
  async downloadBySignedToken(@Query() query: DownloadByTokenQueryDto, @Res() res: Response) {
    const { buffer, mimeType, originalFilename } =
      await this.documentsService.downloadBySignedToken(query.token);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Get(':id/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Direct authenticated document download',
    description:
      'Downloads document with bearer authentication and row-level ownership enforcement.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document binary stream' })
  @ApiResponse({ status: 403, description: 'Cross-account access denied' })
  async downloadDirect(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, originalFilename } = await this.documentsService.downloadDirect(
      actor,
      id,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get document metadata record',
    description: 'Returns document metadata and scan status subject to ownership isolation.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document metadata record' })
  @ApiResponse({ status: 403, description: 'Cross-account access denied' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getMetadata(@CurrentActor() actor: CurrentActorPayload, @Param('id') id: string) {
    return this.documentsService.getDocumentMetadata(actor, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List user documents',
    description: 'Returns paginated documents owned by caller or filtered by admin/operator.',
  })
  @ApiResponse({ status: 200, description: 'Paginated document records' })
  async listDocuments(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: DocumentsPaginationDto,
  ) {
    return this.documentsService.listDocuments(actor, query);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete document',
    description: 'Removes document from private object storage and database with audit logging.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cross-account access denied' })
  async deleteDocument(@CurrentActor() actor: CurrentActorPayload, @Param('id') id: string) {
    await this.documentsService.deleteDocument(actor, id);
    return { success: true, message: 'Document deleted successfully' };
  }

  @Post('retention/evaluate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate retention policies and purge expired documents',
    description: 'Administrative task to purge or mark expired KYC documents.',
  })
  @ApiResponse({ status: 200, description: 'Retention evaluation results' })
  async evaluateRetentionPolicies(@CurrentActor() actor: CurrentActorPayload) {
    return this.documentsService.evaluateRetentionPolicies(actor);
  }
}
