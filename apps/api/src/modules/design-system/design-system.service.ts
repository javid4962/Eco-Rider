import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  DesignTokens,
  ScreenInventoryItem,
  LanguageCode,
} from '@ecoride/contracts';
import {
  AUTHORITATIVE_DESIGN_TOKENS,
  SCREEN_INVENTORY,
  BILINGUAL_DICTIONARY,
} from './design-system.constants';

export interface ContrastAuditDetail {
  pair: string;
  foreground: string;
  background: string;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'FAIL';
  status: 'PASS' | 'FAIL';
}

export interface AccessibilityAuditReport {
  passed: boolean;
  auditedPairs: number;
  complianceLevel: string;
  minimumTouchTargetDp: number;
  bilingualCoveragePercent: number;
  details: ContrastAuditDetail[];
}

@Injectable()
export class DesignSystemService {
  private readonly logger = new Logger(DesignSystemService.name);
  private readonly tokens: DesignTokens = AUTHORITATIVE_DESIGN_TOKENS;
  private readonly screens: readonly ScreenInventoryItem[] = SCREEN_INVENTORY;
  private readonly dictionary: typeof BILINGUAL_DICTIONARY = BILINGUAL_DICTIONARY;

  /**
   * Returns authoritative design tokens (colors, typography, spacing, radii, elevations, mapTheme, buttons).
   */
  getTokens(): DesignTokens {
    return this.tokens;
  }

  /**
   * Returns all screen wireframe inventory items with responsive, error, and accessibility guidance.
   */
  getScreenInventory(): readonly ScreenInventoryItem[] {
    return this.screens;
  }

  /**
   * Returns a specific screen specification by screen ID.
   */
  getScreenById(screenIdRaw: string): ScreenInventoryItem {
    if (!screenIdRaw) {
      throw new BadRequestException('Screen ID parameter is required.');
    }
    const normalized = screenIdRaw.trim().toUpperCase();
    const screen = this.screens.find((s) => s.screenId === normalized);
    if (!screen) {
      throw new BadRequestException(`Screen with ID '${screenIdRaw}' not found in design inventory.`);
    }
    return screen;
  }

  /**
   * Returns bilingual string dictionary for given language code or full dictionary.
   */
  getLocalization(lang?: string): Record<string, string> {
    if (lang) {
      const normalizedLang = lang.trim().toLowerCase();
      if (normalizedLang !== LanguageCode.EN && normalizedLang !== LanguageCode.TE) {
        throw new BadRequestException(`Unsupported language '${lang}'. Supported: 'en', 'te'.`);
      }
      const targetLang = normalizedLang as LanguageCode;
      const localized: Record<string, string> = {};
      for (const [key, val] of Object.entries(this.dictionary)) {
        localized[key] = val[targetLang];
      }
      return localized;
    }

    // Default: Return English bundle
    const englishBundle: Record<string, string> = {};
    for (const [key, val] of Object.entries(this.dictionary)) {
      englishBundle[key] = val.en;
    }
    return englishBundle;
  }

  /**
   * Performs an automated WCAG 2.1 accessibility and color contrast audit on design tokens.
   */
  auditAccessibility(): AccessibilityAuditReport {
    const pairsToTest = [
      {
        name: 'Light Surface Text Primary',
        fg: this.tokens.colors.textPrimaryLight,
        bg: this.tokens.colors.surfaceLight,
        minRatio: 4.5,
      },
      {
        name: 'Dark Surface Text Primary',
        fg: this.tokens.colors.textPrimaryDark,
        bg: this.tokens.colors.surfaceDark,
        minRatio: 4.5,
      },
      {
        name: 'Light Surface Text Secondary',
        fg: this.tokens.colors.textSecondaryLight,
        bg: this.tokens.colors.surfaceLight,
        minRatio: 4.5,
      },
      {
        name: 'Dark Surface Text Secondary',
        fg: this.tokens.colors.textSecondaryDark,
        bg: this.tokens.colors.surfaceDark,
        minRatio: 4.5,
      },
      {
        name: 'Electric Primary Button Text (Large / Bold UI)',
        fg: this.tokens.buttons.variants.primaryElectric.textColor,
        bg: this.tokens.buttons.variants.primaryElectric.background,
        minRatio: 3.0, // WCAG 2.1 SC 1.4.3 / 1.4.11 for bold/large interactive UI components
      },
      {
        name: 'Emergency SOS Button Text',
        fg: this.tokens.buttons.variants.emergencySos.textColor,
        bg: this.tokens.buttons.variants.emergencySos.background,
        minRatio: 3.0,
      },
    ];

    const details: ContrastAuditDetail[] = pairsToTest.map((p) => {
      const ratio = this.calculateContrastRatio(p.fg, p.bg);
      let wcagLevel: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
      let status: 'PASS' | 'FAIL' = 'FAIL';

      if (ratio >= 7.0) {
        wcagLevel = 'AAA';
        status = 'PASS';
      } else if (ratio >= p.minRatio) {
        wcagLevel = 'AA';
        status = 'PASS';
      }

      return {
        pair: p.name,
        foreground: p.fg,
        background: p.bg,
        contrastRatio: parseFloat(ratio.toFixed(2)),
        wcagLevel,
        status,
      };
    });

    const passed = details.every((d) => d.status === 'PASS');
    const touchTargetOk = this.tokens.buttons.minTouchTargetDp >= 48;

    // Check Telugu coverage
    const totalKeys = Object.keys(this.dictionary).length;
    const teluguKeys = Object.values(this.dictionary).filter((v) => Boolean(v.te)).length;
    const bilingualCoveragePercent = (teluguKeys / totalKeys) * 100;

    this.logger.log(`Accessibility audit completed. Contrast passed: ${passed}, Min touch target: ${touchTargetOk}`);

    return {
      passed: passed && touchTargetOk && bilingualCoveragePercent === 100,
      auditedPairs: details.length,
      complianceLevel: 'WCAG_2.1_AA_AAA',
      minimumTouchTargetDp: this.tokens.buttons.minTouchTargetDp,
      bilingualCoveragePercent,
      details,
    };
  }

  private calculateContrastRatio(hex1: string, hex2: string): number {
    const lum1 = this.getRelativeLuminance(hex1);
    const lum2 = this.getRelativeLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private getRelativeLuminance(hex: string): number {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const sRGB = [r, g, b].map((val) => {
      if (val <= 0.03928) {
        return val / 12.92;
      }
      return Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }
}
