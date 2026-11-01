import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JourneysController } from '../src/modules/journeys/journeys.controller';
import { JourneysService } from '../src/modules/journeys/journeys.service';
import { UserRole, JourneyType } from '@ecoride/contracts';

describe('Journeys Integration (e2e)', () => {
  let app: INestApplication;
  let controller: JourneysController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [JourneysController],
      providers: [JourneysService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get<JourneysController>(JourneysController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /journeys/stories returns user stories across all roles', () => {
    const res = controller.getUserStories();
    expect(res).toHaveProperty('stories');
    expect(res.stories.length).toBeGreaterThanOrEqual(7);
  });

  it('GET /journeys/stories?role=captain returns filtered captain stories', () => {
    const res = controller.getUserStories('captain');
    expect(res).toHaveProperty('stories');
    expect(res.stories.every((s) => s.role === UserRole.CAPTAIN)).toBe(true);
  });

  it('GET /journeys/flows returns all 5 state-oriented journeys', () => {
    const res = controller.getAllFlows();
    expect(res).toHaveProperty('flows');
    expect(res.flows).toHaveLength(5);
  });

  it('GET /journeys/flows/emergency returns emergency SOS flow', () => {
    const res = controller.getFlowByType('emergency');
    expect(res).toHaveProperty('flow');
    expect(res.flow.type).toBe(JourneyType.EMERGENCY);
    expect(res.flow.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /journeys/graph-validation confirms graph connectivity with ZERO orphaned screens', () => {
    const res = controller.validateGraph();
    expect(res.valid).toBe(true);
    expect(res.orphanedScreens).toEqual([]);
    expect(res.totalScreens).toBeGreaterThanOrEqual(30);
  });

  it('POST /journeys/validate-transition allows valid state advance by authorized actor', () => {
    const res = controller.validateTransition({
      type: 'private_ride',
      fromState: 'ARRIVED',
      toState: 'IN_TRANSIT',
      actor: 'captain',
    });

    expect(res.valid).toBe(true);
  });

  it('POST /journeys/validate-transition rejects unauthorized actor', () => {
    const res = controller.validateTransition({
      type: 'private_ride',
      fromState: 'ARRIVED',
      toState: 'IN_TRANSIT',
      actor: 'rider',
    });

    expect(res.valid).toBe(false);
    expect(res.reason).toContain('not authorized');
  });

  it('POST /journeys/validate-transition throws 400 when required fields are missing', () => {
    expect(() =>
      controller.validateTransition({
        type: '',
        fromState: '',
        toState: '',
        actor: '',
      })
    ).toThrow();
  });
});

