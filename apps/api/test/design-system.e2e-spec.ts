import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DesignSystemController } from '../src/modules/design-system/design-system.controller';
import { DesignSystemService } from '../src/modules/design-system/design-system.service';

describe('Design System Integration (e2e)', () => {
  let app: INestApplication;
  let controller: DesignSystemController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DesignSystemController],
      providers: [DesignSystemService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get<DesignSystemController>(DesignSystemController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /design-system/tokens returns complete design tokens', () => {
    const res = controller.getTokens();
    expect(res).toHaveProperty('tokens');
    expect(res.tokens.colors.primaryElectric).toBe('#059669');
    expect(res.tokens.buttons.minTouchTargetDp).toBe(48);
  });

  it('GET /design-system/screens returns all 5 core screen specifications', () => {
    const res = controller.getScreenInventory();
    expect(res).toHaveProperty('screens');
    expect(res.screens).toHaveLength(5);
  });

  it('GET /design-system/screens/:id returns specific screen wireframe', () => {
    const res = controller.getScreenById('SCR_RIDER_HOME');
    expect(res).toHaveProperty('screen');
    expect(res.screen.screenId).toBe('SCR_RIDER_HOME');
    expect(res.screen.asciiWireframe.length).toBeGreaterThan(50);
  });

  it('GET /design-system/localization returns Telugu bundle', () => {
    const res = controller.getLocalization('te');
    expect(res).toHaveProperty('localization');
    expect(res.localization.app_name).toContain('ఎకోరైడ్');
  });

  it('GET /design-system/accessibility-audit confirms WCAG 2.1 AA/AAA compliance', () => {
    const res = controller.getAccessibilityAudit();
    expect(res.passed).toBe(true);
    expect(res.complianceLevel).toBe('WCAG_2.1_AA_AAA');
    expect(res.auditedPairs).toBeGreaterThanOrEqual(6);
  });

  it('GET /design-system/screens/:id throws 400 for unknown screen ID', () => {
    expect(() => controller.getScreenById('INVALID_SCREEN')).toThrow();
  });
});
