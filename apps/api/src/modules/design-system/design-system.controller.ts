import { Controller, Get, Param, Query } from '@nestjs/common';
import { DesignSystemService, AccessibilityAuditReport } from './design-system.service';
import { DesignTokens, ScreenInventoryItem } from '@ecoride/contracts';

@Controller('design-system')
export class DesignSystemController {
  constructor(private readonly designSystemService: DesignSystemService) {}

  @Get('tokens')
  getTokens(): { tokens: DesignTokens } {
    return {
      tokens: this.designSystemService.getTokens(),
    };
  }

  @Get('screens')
  getScreenInventory(): { screens: readonly ScreenInventoryItem[] } {
    return {
      screens: this.designSystemService.getScreenInventory(),
    };
  }

  @Get('screens/:id')
  getScreenById(@Param('id') id: string): { screen: ScreenInventoryItem } {
    return {
      screen: this.designSystemService.getScreenById(id),
    };
  }

  @Get('localization')
  getLocalization(@Query('lang') lang?: string): { localization: Record<string, string> } {
    return {
      localization: this.designSystemService.getLocalization(lang),
    };
  }

  @Get('accessibility-audit')
  getAccessibilityAudit(): AccessibilityAuditReport {
    return this.designSystemService.auditAccessibility();
  }
}
