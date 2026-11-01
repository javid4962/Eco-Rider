import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LocalizationService } from './localization.service';

@ApiTags('Localization')
@Controller('localization')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('messages')
  @ApiOperation({
    summary: 'Get all localized message resources with fallback',
    description:
      'Returns the full bilingual string dictionary for Telugu (te) or English (en) with automatic fallback for missing translations.',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['te', 'en', 'hi'],
    description: 'Target language code',
  })
  @ApiResponse({ status: 200, description: 'Localized message dictionary' })
  getAllMessages(@Query('locale') locale?: string) {
    return {
      locale: this.localizationService.normalizeLocale(locale),
      messages: this.localizationService.getAllMessages(locale),
    };
  }

  @Get('messages/:key')
  @ApiOperation({
    summary: 'Resolve single message identifier',
    description:
      'Resolves a specific backend message key (e.g. error.booking.activeRideExists) into target language.',
  })
  @ApiQuery({ name: 'locale', required: false, enum: ['te', 'en', 'hi'] })
  @ApiResponse({ status: 200, description: 'Resolved localized message' })
  getMessage(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.localizationService.getLocalizedResponse(key, locale);
  }
}
