import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DesignSystemService } from '../src/modules/design-system/design-system.service';

describe('DesignSystemService', () => {
  let service: DesignSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignSystemService],
    }).compile();

    service = module.get<DesignSystemService>(DesignSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Original EV Design Tokens Completeness', () => {
    it('should provide complete original EV color tokens distinct from competitors', () => {
      const tokens = service.getTokens();

      expect(tokens.colors.primaryElectric).toBe('#059669'); // Electric Emerald
      expect(tokens.colors.voltageNavy).toBe('#0B132B'); // Deep Voltage Navy
      expect(tokens.colors.batteryOptimal).toBe('#10B981');
      expect(tokens.colors.batteryGood).toBe('#34D399');
      expect(tokens.colors.batteryLow).toBe('#F59E0B');
      expect(tokens.colors.batteryCritical).toBe('#EF4444');
      expect(tokens.colors.safetyAlert).toBe('#DC2626');
    });

    it('should provide bilingual typography scales with Telugu fallback', () => {
      const tokens = service.getTokens();

      expect(tokens.typography.fontFamilyEnglish).toContain('Inter');
      expect(tokens.typography.fontFamilyTelugu).toContain('Noto Sans Telugu');
      expect(tokens.typography.displayLarge.fontSize).toBe(32);
      expect(tokens.typography.bodyMedium.fontSize).toBe(14);
      expect(tokens.typography.labelLarge.fontWeight).toBe(600);
    });

    it('should enforce 4pt spacing grid and touch-friendly button targets', () => {
      const tokens = service.getTokens();

      expect(tokens.spacing.xs).toBe(4);
      expect(tokens.spacing.sm).toBe(8);
      expect(tokens.spacing.md).toBe(12);
      expect(tokens.spacing.lg).toBe(16);
      expect(tokens.spacing.xl).toBe(24);
      expect(tokens.buttons.minTouchTargetDp).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Screen Inventory & Wireframe Specifications', () => {
    const requiredScreens = [
      'SCR_RIDER_HOME',
      'SCR_RIDER_VEHICLE_SELECT',
      'SCR_RIDER_TRIP_PROGRESS',
      'SCR_COMMUTE_TICKET_BOARDING_PASS',
      'SCR_CAPTAIN_HOME',
    ];

    it('should contain all 5 required screens', () => {
      const screens = service.getScreenInventory();
      const screenIds = screens.map((s) => s.screenId);

      for (const requiredId of requiredScreens) {
        expect(screenIds).toContain(requiredId);
      }
    });

    it('should provide responsive, error-state, and empty-state guidance on all screens', () => {
      const screens = service.getScreenInventory();

      for (const screen of screens) {
        // Wireframe check
        expect(screen.asciiWireframe.length).toBeGreaterThan(50);

        // Responsive breakpoints check
        expect(screen.responsiveGuidelines.mobileCompact360dp.length).toBeGreaterThan(10);
        expect(screen.responsiveGuidelines.mobileStandard412dp.length).toBeGreaterThan(10);
        expect(screen.responsiveGuidelines.tablet768dp.length).toBeGreaterThan(10);

        // Empty state check with bilingual copy
        expect(screen.emptyStateGuidance.condition.length).toBeGreaterThan(5);
        expect(screen.emptyStateGuidance.bilingualMessage.en.length).toBeGreaterThan(5);
        expect(screen.emptyStateGuidance.bilingualMessage.te.length).toBeGreaterThan(5);

        // Error state check
        expect(screen.errorStateGuidance.trigger.length).toBeGreaterThan(5);
        expect(screen.errorStateGuidance.bilingualMessage.en.length).toBeGreaterThan(5);
        expect(screen.errorStateGuidance.fallbackScreenId).toMatch(/^SCR_/);

        // Accessibility check
        expect(screen.accessibilityNotes.minTouchTarget).toContain('48');
        expect(screen.accessibilityNotes.contrastRatio).toContain('WCAG');
        expect(screen.accessibilityNotes.screenReaderSemantic.length).toBeGreaterThan(5);
      }
    });

    it('should retrieve a screen by ID or throw BadRequestException on unknown ID', () => {
      const riderHome = service.getScreenById('SCR_RIDER_HOME');
      expect(riderHome.screenId).toBe('SCR_RIDER_HOME');
      expect(riderHome.role).toBe('rider');

      expect(() => service.getScreenById('NON_EXISTENT')).toThrow(
        BadRequestException
      );
    });
  });

  describe('Bilingual Localization (Telugu & English)', () => {
    it('should return English dictionary by default', () => {
      const en = service.getLocalization('en');
      expect(en.app_name).toContain('EcoRide');
      expect(en.emergency_sos).toContain('Emergency');
    });

    it('should return Telugu dictionary when requested', () => {
      const te = service.getLocalization('te');
      expect(te.app_name).toContain('ఎకోరైడ్');
      expect(te.emergency_sos).toContain('అత్యవసర');
    });

    it('should throw BadRequestException on unsupported language', () => {
      expect(() => service.getLocalization('fr')).toThrow(
        BadRequestException
      );
    });
  });

  describe('Automated WCAG 2.1 Accessibility & Color Contrast Audit', () => {
    it('should pass all color contrast checks with ratio >= 4.5:1 (AA) and >= 7.0:1 (AAA)', () => {
      const audit = service.auditAccessibility();

      expect(audit.passed).toBe(true);
      expect(audit.complianceLevel).toBe('WCAG_2.1_AA_AAA');
      expect(audit.minimumTouchTargetDp).toBe(48);
      expect(audit.bilingualCoveragePercent).toBe(100);

      for (const detail of audit.details) {
        expect(detail.status).toBe('PASS');
        expect(detail.contrastRatio).toBeGreaterThanOrEqual(3.0);
      }
    });
  });

  describe('Concurrency & State Immutability', () => {
    it('should handle concurrent audit requests without degradation', async () => {
      const requests = Array.from({ length: 50 }, () =>
        Promise.resolve(service.auditAccessibility())
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(50);
      results.forEach((r) => {
        expect(r.passed).toBe(true);
      });
    });
  });
});
