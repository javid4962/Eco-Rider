import { Injectable } from '@nestjs/common';
import {
  SupportedLocale,
  ResponseMessageKey,
  LocalizedMessageDto,
  LOCALIZED_MESSAGES,
} from '@ecoride/contracts';

@Injectable()
export class LocalizationService {
  private readonly defaultLocale: SupportedLocale = 'te'; // Telugu default for Andhra Pradesh EV platform
  private readonly fallbackLocale: SupportedLocale = 'en'; // Universal English fallback

  /**
   * Translate a message key into the requested locale with fallback.
   * If translation is missing in the target locale (e.g. Telugu), it falls back to English.
   * If missing in English, it falls back to the messageKey itself.
   */
  translate(
    messageKey: string | ResponseMessageKey,
    targetLocale?: string,
    params?: Record<string, string | number>,
  ): string {
    const locale = this.normalizeLocale(targetLocale);

    // 1. Check in target locale dictionary
    let template = LOCALIZED_MESSAGES[locale]?.[messageKey];

    // 2. Fallback to English if missing in target locale
    if (!template && locale !== this.fallbackLocale) {
      template = LOCALIZED_MESSAGES[this.fallbackLocale]?.[messageKey];
    }

    // 3. Fallback to messageKey if absent in all dictionaries
    if (!template) {
      return messageKey;
    }

    // 4. Interpolate parameters: {{key}}
    if (params) {
      return this.interpolate(template, params);
    }

    return template;
  }

  /**
   * Return a structured LocalizedMessageDto containing key, translated text, and resolved locale.
   */
  getLocalizedResponse(
    messageKey: string | ResponseMessageKey,
    targetLocale?: string,
    params?: Record<string, string | number>,
  ): LocalizedMessageDto {
    const resolvedLocale = this.normalizeLocale(targetLocale);
    const message = this.translate(messageKey, resolvedLocale, params);

    return {
      messageKey,
      message,
      locale: resolvedLocale,
      params,
    };
  }

  /**
   * Get all message dictionaries for mobile synchronization or inspection.
   */
  getAllMessages(targetLocale?: string): Record<string, string> {
    const locale = this.normalizeLocale(targetLocale);
    const enMessages = LOCALIZED_MESSAGES[this.fallbackLocale] || {};
    const targetMessages = LOCALIZED_MESSAGES[locale] || {};

    // Merge with English fallback for any missing keys
    return {
      ...enMessages,
      ...targetMessages,
    };
  }

  /**
   * Normalize an incoming locale string or Accept-Language header.
   */
  normalizeLocale(localeHeader?: string): SupportedLocale {
    if (!localeHeader || typeof localeHeader !== 'string') {
      return this.defaultLocale;
    }

    const clean = localeHeader.trim().toLowerCase();

    // Check for primary tags
    if (clean.startsWith('te')) {
      return 'te';
    }
    if (clean.startsWith('hi')) {
      return 'hi';
    }
    if (clean.startsWith('en')) {
      return 'en';
    }

    return this.defaultLocale;
  }

  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });
  }
}
