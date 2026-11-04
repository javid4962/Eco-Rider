import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SafetyService } from '../src/modules/safety/safety.service';
import { SafetyController } from '../src/modules/safety/safety.controller';
import { RideIncident } from '../src/database/entities/ride-incident.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { User } from '../src/database/entities/user.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';
import {
  IncidentSeverity,
  IncidentStatus,
  RideStatus,
} from '@ecoride/contracts';

describe('Milestone M20: DevSecOps, Privacy & 24/7 Safety Console (EV-129 – EV-131)', () => {
  let safetyService: SafetyService;
  let safetyController: SafetyController;

  const mockIncidents: RideIncident[] = [];
  const mockBookings: Booking[] = [];
  const mockUsers: User[] = [];
  const mockVehicles: Vehicle[] = [];

  const riderActor: CurrentActorPayload = {
    id: 'rider-user-001',
    role: 'RIDER',
    scopes: ['rides:write'],
  };

  const outsiderActor: CurrentActorPayload = {
    id: 'stranger-user-999',
    role: 'RIDER',
    scopes: ['rides:write'],
  };

  const safetyOfficerActor: CurrentActorPayload = {
    id: 'safety-officer-01',
    role: 'SAFETY_OFFICER',
    scopes: ['safety:read', 'safety:write'],
  };

  beforeEach(async () => {
    mockIncidents.length = 0;
    mockBookings.length = 0;
    mockUsers.length = 0;
    mockVehicles.length = 0;

    const booking: Partial<Booking> = {
      id: 'booking-test-sos-001',
      bookingCode: 'ECO-VZ-20261104-SOS1',
      riderId: 'rider-user-001',
      captainId: 'captain-user-001',
      vehicleId: 'vehicle-bev-001',
      status: RideStatus.IN_PROGRESS,
    };
    mockBookings.push(booking as Booking);

    const captainUser: Partial<User> = {
      id: 'captain-user-001',
      name: 'Ramesh Kumar',
      phone: '+919876543210',
      role: 'CAPTAIN',
    };
    mockUsers.push(captainUser as User);

    const vehicle: Partial<Vehicle> = {
      id: 'vehicle-bev-001',
      registrationNumber: 'AP 16 EV 5566',
      make: 'Tata Motors',
      model: 'Nexon EV',
    };
    mockVehicles.push(vehicle as Vehicle);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SafetyController],
      providers: [
        SafetyService,
        {
          provide: getRepositoryToken(RideIncident),
          useValue: {
            create: jest.fn().mockImplementation((data: Partial<RideIncident>) => ({
              id: `inc-${Date.now()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            })),
            save: jest.fn().mockImplementation(async (inc: RideIncident) => {
              const idx = mockIncidents.findIndex((i) => i.id === inc.id);
              if (idx >= 0) mockIncidents[idx] = inc;
              else mockIncidents.push(inc);
              return inc;
            }),
            find: jest.fn().mockImplementation(async () => mockIncidents),
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockIncidents.find((i) => i.id === options.where.id) || null;
            }),
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockBookings.find((b) => b.id === options.where.id) || null;
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockUsers.find((u) => u.id === options.where.id) || null;
            }),
          },
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockVehicles.find((v) => v.id === options.where.id) || null;
            }),
          },
        },
      ],
    }).compile();

    safetyService = module.get<SafetyService>(SafetyService);
    safetyController = module.get<SafetyController>(SafetyController);
  });

  describe('EV-129: Emergency SOS Alert Escalation & AP Police 112 Dispatch', () => {
    it('should trigger emergency SOS, generate AP Police 112 reference, and create tokenized tracking link', async () => {
      const sosResponse = await safetyService.triggerSos(riderActor, {
        bookingId: 'booking-test-sos-001',
        latitude: 16.508,
        longitude: 80.65,
        reason: 'Suspicious vehicle following / unsafe situation',
        audioRecordingConsent: true,
      });

      expect(sosResponse.incidentId).toBeDefined();
      expect(sosResponse.incidentCode).toMatch(/^INC-SOS-\d{8}-[A-F0-9]{4}$/);
      expect(sosResponse.severity).toBe(IncidentSeverity.CRITICAL);
      expect(sosResponse.status).toBe(IncidentStatus.ESCALATED_POLICE);
      expect(sosResponse.apPolice112Dispatched).toBe(true);
      expect(sosResponse.apPoliceReferenceId).toMatch(/^AP112-VJA-\d+$/);
      expect(sosResponse.liveTrackingToken).toHaveLength(32);
      expect(sosResponse.liveTrackingUrl).toContain(sosResponse.liveTrackingToken);
      expect(sosResponse.audioRecordingActive).toBe(true);

      // Verify incident stored in repository
      expect(mockIncidents.length).toBe(1);
      expect(mockIncidents[0].severity).toBe(IncidentSeverity.CRITICAL);
      expect(mockIncidents[0].metadata.audioRecordingActive).toBe(true);
    });

    it('should reject SOS trigger attempt from unauthorized third-party user', async () => {
      await expect(
        safetyService.triggerSos(outsiderActor, {
          bookingId: 'booking-test-sos-001',
          latitude: 16.508,
          longitude: 80.65,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('EV-130: Live Trip Share & Emergency Contact Tracking', () => {
    let liveTrackingToken: string;

    beforeEach(async () => {
      const sos = await safetyService.triggerSos(riderActor, {
        bookingId: 'booking-test-sos-001',
        latitude: 16.508,
        longitude: 80.65,
        audioRecordingConsent: false,
      });
      liveTrackingToken = sos.liveTrackingToken;
    });

    it('should return live trip tracking details with masked captain phone and no rider PII', async () => {
      const tracking = await safetyService.getLiveTrackingByToken(liveTrackingToken);

      expect(tracking.trackingToken).toBe(liveTrackingToken);
      expect(tracking.bookingCode).toBe('ECO-VZ-20261104-SOS1');
      expect(tracking.captainName).toBe('Ramesh Kumar');
      expect(tracking.captainPhoneMasked).toBe('+9198*** **10'); // Masked for privacy
      expect(tracking.vehiclePlate).toBe('AP 16 EV 5566');
      expect(tracking.vehicleModel).toBe('Tata Motors Nexon EV');
      expect(tracking.isSosActive).toBe(true);
      expect(tracking.captainLatitude).toBe(16.508);
      expect(tracking.captainLongitude).toBe(80.65);
    });

    it('should reject invalid or non-existent tracking token', async () => {
      await expect(
        safetyService.getLiveTrackingByToken('invalid-non-existent-token-12345'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('EV-131: Safety Console & Incident Resolution', () => {
    let incidentId: string;

    beforeEach(async () => {
      const sos = await safetyService.triggerSos(riderActor, {
        bookingId: 'booking-test-sos-001',
        latitude: 16.508,
        longitude: 80.65,
        reason: 'Accidental trigger test',
      });
      incidentId = sos.incidentId;
    });

    it('should list open safety incidents for operations safety console', async () => {
      const list = await safetyService.listIncidents(IncidentStatus.ESCALATED_POLICE);

      expect(list.length).toBe(1);
      expect(list[0].id).toBe(incidentId);
      expect(list[0].severity).toBe(IncidentSeverity.CRITICAL);
      expect(list[0].apPoliceDispatched).toBe(true);
    });

    it('should resolve safety incident with resolution notes and status FALSE_ALARM', async () => {
      const resolved = await safetyService.resolveIncident(incidentId, safetyOfficerActor, {
        status: IncidentStatus.FALSE_ALARM,
        resolutionNotes: 'Rider confirmed accidental button press. All parties safe.',
        actionTaken: 'Cancelled AP Police dispatch and notified rider contacts.',
      });

      expect(resolved.status).toBe(IncidentStatus.FALSE_ALARM);
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolutionNotes).toContain('accidental button press');
    });

    it('should expose endpoints via SafetyController', async () => {
      const tracking = await safetyController.getLiveTracking(mockIncidents[0].metadata.liveTrackingToken as string);
      expect(tracking.bookingCode).toBe('ECO-VZ-20261104-SOS1');

      const incidents = await safetyController.listIncidents();
      expect(incidents.length).toBeGreaterThan(0);
    });
  });
});
