import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ReleaseBoundariesController } from '../src/modules/release-boundaries/release-boundaries.controller';
import { ReleaseBoundariesService } from '../src/modules/release-boundaries/release-boundaries.service';
import { ReleasePhase, PhaseType } from '@ecoride/contracts';

describe('Release Boundaries Integration (e2e)', () => {
  let app: INestApplication;
  let controller: ReleaseBoundariesController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReleaseBoundariesController],
      providers: [ReleaseBoundariesService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get<ReleaseBoundariesController>(ReleaseBoundariesController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /release-boundaries/matrix returns all 4 release boundary scopes', () => {
    const res = controller.getScopeMatrix();
    expect(res).toHaveProperty('scopes');
    expect(res.scopes).toHaveLength(4);

    const pilot = res.scopes.find((s) => s.releasePhase === ReleasePhase.RELEASE_A);
    expect(pilot).toBeDefined();
    expect(pilot?.phaseType).toBe(PhaseType.PILOT);
    expect(pilot?.launchGates.length).toBeGreaterThan(0);
  });

  it('GET /release-boundaries/settings returns city-by-service feature flags', () => {
    const res = controller.getSettings();
    expect(res).toHaveProperty('settings');
    expect(res.settings).toHaveProperty('visakhapatnam');
    expect(res.settings).toHaveProperty('vijayawada');
  });

  it('GET /release-boundaries/check allows pilot private EV in Visakhapatnam', () => {
    const result = controller.checkServiceAccess('visakhapatnam', 'private_ev');
    expect(result.allowed).toBe(true);
    expect(result.releasePhase).toBe(ReleasePhase.RELEASE_A);
    expect(result.phaseType).toBe(PhaseType.PILOT);
  });

  it('GET /release-boundaries/check rejects scheduled sharing in Visakhapatnam pending launch gates', () => {
    const result = controller.checkServiceAccess('visakhapatnam', 'scheduled_sharing');
    expect(result.allowed).toBe(false);
    expect(result.releasePhase).toBe(ReleasePhase.RELEASE_B);
    expect(result.phaseType).toBe(PhaseType.FUTURE);
    expect(result.reason).toContain('Launch Gate Pending');
  });

  it('GET /release-boundaries/check rejects unlaunched cities', () => {
    const result = controller.checkServiceAccess('tirupati', 'private_ev');
    expect(result.allowed).toBe(false);
  });

  it('GET /release-boundaries/check throws 400 for invalid city', () => {
    expect(() => controller.checkServiceAccess('london', 'private_ev')).toThrow();
  });
});

