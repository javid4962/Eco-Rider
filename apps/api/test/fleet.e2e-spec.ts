import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { ExpandVehiclesTableWithEVCompliance1700000000008 } from '../src/database/migrations/1700000000008-ExpandVehiclesTableWithEVCompliance';
import { AddDriverComplianceAndDutyStatus1700000000010 } from '../src/database/migrations/1700000000010-AddDriverComplianceAndDutyStatus';
import { AddVehicleSeatingConfigurationAndClassificationControls1700000000011 } from '../src/database/migrations/1700000000011-AddVehicleSeatingConfigurationAndClassificationControls';
import { CreateFleetOrganizationsAndAssignments1700000000013 } from '../src/database/migrations/1700000000013-CreateFleetOrganizationsAndAssignments';
import {
  PlatformRole,
  DriverComplianceStatus,
  DutyStatus,
  VehicleCategory,
  VehicleVerificationStatus,
  PropulsionType,
  FleetOrganizationStatus,
  FleetAssignmentStatus,
  FleetShiftStatus,
  FleetShiftType,
} from '@ecoride/contracts';

describe('Fleet Owner Relationships, Tenant Restrictions & Assignment Auditing E2E (EV-030)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  // Fleet Owner A and Org A
  const fleetOwnerA = {
    id: 'f0111111-1111-4000-8000-000000000001',
    phone: '+919876300001',
    role: PlatformRole.FLEET_OWNER,
    name: 'Sita Rama Raju (Vizag Green Fleet)',
  };

  const orgA = {
    id: '0a111111-1111-4000-8000-000000000001',
    name: 'Vizag Green Fleet Logistics Pvt Ltd',
    businessRegistrationNumber: 'AP-FLT-2025-001',
    contactEmail: 'admin@vizaggreencabs.in',
    contactPhone: '+919876300001',
    payoutAccountId: 'payout_acc_vizag_green_01',
    city: 'visakhapatnam',
  };

  // Fleet Owner B and Org B (Cross-fleet tenant isolation check)
  const fleetOwnerB = {
    id: 'f0222222-2222-4000-8000-000000000002',
    phone: '+919876300002',
    role: PlatformRole.FLEET_OWNER,
    name: 'Kalyan Ram (Amaravati EV Mobility)',
  };

  const orgB = {
    id: '0b222222-2222-4000-8000-000000000002',
    name: 'Amaravati EV Mobility Pvt Ltd',
    businessRegistrationNumber: 'AP-FLT-2025-002',
    contactEmail: 'ops@amaravatiev.in',
    contactPhone: '+919876300002',
    payoutAccountId: 'payout_acc_amaravati_02',
    city: 'amaravati',
  };

  // Platform Operator (Elevated access)
  const operatorUser = {
    id: 'e0111111-1111-4000-8000-000000000001',
    phone: '+919876300099',
    role: PlatformRole.OPERATOR,
    name: 'Ramesh Operations Controller',
  };

  // Drivers
  const driverA1 = {
    id: 'da111111-1111-4000-8000-000000000001',
    phone: '+919876300011',
    role: PlatformRole.CAPTAIN,
    name: 'Venkat Rao (Verified Captain)',
    licenseNumber: 'AP31 20250009001',
  };

  const driverA2 = {
    id: 'da222222-2222-4000-8000-000000000002',
    phone: '+919876300012',
    role: PlatformRole.CAPTAIN,
    name: 'Krishna Murthy (Reassigned Captain)',
    licenseNumber: 'AP31 20250009002',
  };

  const driverUnverified = {
    id: 'da333333-3333-4000-8000-000000000003',
    phone: '+919876300013',
    role: PlatformRole.CAPTAIN,
    name: 'Praveen Kumar (Unverified Captain)',
    licenseNumber: 'AP31 20250009003',
  };

  // Vehicles (100% BEV)
  const vehicleA1 = {
    id: 'ca111111-1111-4000-8000-000000000001',
    registrationNumber: 'AP31EV3001',
    make: 'Tata Motors',
    model: 'Tigor EV',
    category: VehicleCategory.CAB_PRIVATE_4W,
    soc: 88.0,
    range: 210,
    seatingCapacity: 4,
  };

  const vehicleA2Unattached = {
    id: 'ca222222-2222-4000-8000-000000000002',
    registrationNumber: 'AP31EV3002',
    make: 'Mahindra',
    model: 'XUV400 EV',
    category: VehicleCategory.CAB_PRIVATE_4W,
    soc: 92.0,
    range: 300,
    seatingCapacity: 4,
  };

  const vehicleB1 = {
    id: 'cb222222-2222-4000-8000-000000000001',
    registrationNumber: 'AP16EV3001',
    make: 'BYD',
    model: 'e6 MPV',
    category: VehicleCategory.CAB_PRIVATE_4W,
    soc: 75.0,
    range: 400,
    seatingCapacity: 5,
  };

  const futureYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  async function cleanupTestData() {
    if (!dataSource || !dataSource.isInitialized) return;

    await dataSource.query(`
      DELETE FROM "fleet_shifts" WHERE "vehicle_id" IN ('${vehicleA1.id}', '${vehicleA2Unattached.id}', '${vehicleB1.id}');
      DELETE FROM "fleet_vehicle_assignments" WHERE "vehicle_id" IN ('${vehicleA1.id}', '${vehicleA2Unattached.id}', '${vehicleB1.id}');
      UPDATE "driver_profiles" SET "assigned_vehicle_id" = NULL WHERE "user_id" IN ('${driverA1.id}', '${driverA2.id}', '${driverUnverified.id}');
      DELETE FROM "driver_profiles" WHERE "user_id" IN ('${driverA1.id}', '${driverA2.id}', '${driverUnverified.id}')
        OR "license_number" IN ('${driverA1.licenseNumber}', '${driverA2.licenseNumber}', '${driverUnverified.licenseNumber}');
      DELETE FROM "vehicles" WHERE "id" IN ('${vehicleA1.id}', '${vehicleA2Unattached.id}', '${vehicleB1.id}')
        OR "registration_number" IN ('${vehicleA1.registrationNumber}', '${vehicleA2Unattached.registrationNumber}', '${vehicleB1.registrationNumber}');
      DELETE FROM "fleet_organizations" WHERE "id" IN ('${orgA.id}', '${orgB.id}')
        OR "business_registration_number" IN ('${orgA.businessRegistrationNumber}', '${orgB.businessRegistrationNumber}', 'AP-FLT-NEW-999');
      DELETE FROM "ledger_entries" WHERE "account_id" IN ('${orgA.payoutAccountId}', '${orgB.payoutAccountId}');
      DELETE FROM "audit_events" WHERE "actor_id" IN ('${fleetOwnerA.id}', '${fleetOwnerB.id}', '${operatorUser.id}', '${driverA1.id}', '${driverA2.id}');
      DELETE FROM "users" WHERE "id" IN ('${fleetOwnerA.id}', '${fleetOwnerB.id}', '${operatorUser.id}', '${driverA1.id}', '${driverA2.id}', '${driverUnverified.id}')
        OR "phone" IN ('${fleetOwnerA.phone}', '${fleetOwnerB.phone}', '${operatorUser.phone}', '${driverA1.phone}', '${driverA2.phone}', '${driverUnverified.phone}');
    `);
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/(.*)', 'metrics'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);

    if (dataSource.isInitialized) {
      try {
        await new ExpandVehiclesTableWithEVCompliance1700000000008().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }
      try {
        await new AddDriverComplianceAndDutyStatus1700000000010().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }
      try {
        await new AddVehicleSeatingConfigurationAndClassificationControls1700000000011().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }
      try {
        await new CreateFleetOrganizationsAndAssignments1700000000013().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }

      await cleanupTestData();

      // Seed Users
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${fleetOwnerA.id}', '${fleetOwnerA.phone}', '${fleetOwnerA.role}', '${fleetOwnerA.name}', true),
          ('${fleetOwnerB.id}', '${fleetOwnerB.phone}', '${fleetOwnerB.role}', '${fleetOwnerB.name}', true),
          ('${operatorUser.id}', '${operatorUser.phone}', '${operatorUser.role}', '${operatorUser.name}', true),
          ('${driverA1.id}', '${driverA1.phone}', '${driverA1.role}', '${driverA1.name}', true),
          ('${driverA2.id}', '${driverA2.phone}', '${driverA2.role}', '${driverA2.name}', true),
          ('${driverUnverified.id}', '${driverUnverified.phone}', '${driverUnverified.role}', '${driverUnverified.name}', true);
      `);

      // Seed Fleet Organizations
      await dataSource.query(`
        INSERT INTO "fleet_organizations" (
          "id", "owner_id", "name", "business_registration_number",
          "contact_email", "contact_phone", "payout_account_id", "city", "status"
        ) VALUES
          ('${orgA.id}', '${fleetOwnerA.id}', '${orgA.name}', '${orgA.businessRegistrationNumber}', '${orgA.contactEmail}', '${orgA.contactPhone}', '${orgA.payoutAccountId}', '${orgA.city}', '${FleetOrganizationStatus.ACTIVE}'),
          ('${orgB.id}', '${fleetOwnerB.id}', '${orgB.name}', '${orgB.businessRegistrationNumber}', '${orgB.contactEmail}', '${orgB.contactPhone}', '${orgB.payoutAccountId}', '${orgB.city}', '${FleetOrganizationStatus.ACTIVE}');
      `);

      // Seed Vehicles
      await dataSource.query(`
        INSERT INTO "vehicles" (
          "id", "fleet_organization_id", "registration_number", "propulsion_type", "vehicle_category", "make", "model",
          "battery_capacity_kwh", "current_soc_percent", "rated_range_km", "seating_configuration", "approved_passenger_seating", "total_seating_capacity", "green_plate_verified",
          "verification_status", "city", "is_active", "insurance_expiry_date", "fitness_expiry_date", "commercial_permit_expiry"
        ) VALUES
          ('${vehicleA1.id}', '${orgA.id}', '${vehicleA1.registrationNumber}', '${PropulsionType.BATTERY_ELECTRIC}', '${vehicleA1.category}', '${vehicleA1.make}', '${vehicleA1.model}', 26.0, ${vehicleA1.soc}, ${vehicleA1.range}, 'D+4', 4, 5, true, '${VehicleVerificationStatus.VERIFIED}', 'visakhapatnam', true, '${futureYear}', '${futureYear}', '${futureYear}'),
          ('${vehicleA2Unattached.id}', NULL, '${vehicleA2Unattached.registrationNumber}', '${PropulsionType.BATTERY_ELECTRIC}', '${vehicleA2Unattached.category}', '${vehicleA2Unattached.make}', '${vehicleA2Unattached.model}', 39.4, ${vehicleA2Unattached.soc}, ${vehicleA2Unattached.range}, 'D+4', 4, 5, true, '${VehicleVerificationStatus.VERIFIED}', 'visakhapatnam', true, '${futureYear}', '${futureYear}', '${futureYear}'),
          ('${vehicleB1.id}', '${orgB.id}', '${vehicleB1.registrationNumber}', '${PropulsionType.BATTERY_ELECTRIC}', '${vehicleB1.category}', '${vehicleB1.make}', '${vehicleB1.model}', 71.7, ${vehicleB1.soc}, ${vehicleB1.range}, 'D+4', 4, 5, true, '${VehicleVerificationStatus.VERIFIED}', 'amaravati', true, '${futureYear}', '${futureYear}', '${futureYear}');
      `);

      // Seed Driver Profiles
      await dataSource.query(`
        INSERT INTO "driver_profiles" (
          "user_id", "license_number", "verification_status", "duty_status",
          "license_expiry_date", "green_plate_permit_verified", "safety_training_completed",
          "city", "assigned_vehicle_id"
        ) VALUES
          ('${driverA1.id}', '${driverA1.licenseNumber}', '${DriverComplianceStatus.VERIFIED}', '${DutyStatus.OFFLINE}', '${futureYear}', true, true, 'visakhapatnam', NULL),
          ('${driverA2.id}', '${driverA2.licenseNumber}', '${DriverComplianceStatus.VERIFIED}', '${DutyStatus.OFFLINE}', '${futureYear}', true, true, 'visakhapatnam', NULL),
          ('${driverUnverified.id}', '${driverUnverified.licenseNumber}', '${DriverComplianceStatus.PENDING}', '${DutyStatus.OFFLINE}', '${futureYear}', false, false, 'visakhapatnam', NULL);
      `);

      // Seed Financial Ledger Entries for Org A and Org B
      await dataSource.query(`
        INSERT INTO "ledger_entries" ("idempotency_key", "account_id", "entry_type", "amount_paise", "currency", "description", "created_at")
        VALUES
          ('idemp-org-a-fare-001', '${orgA.payoutAccountId}', 'CREDIT', 120000, 'INR', 'Airport EV Transit Trip Fare', NOW()),
          ('idemp-org-a-fare-002', '${orgA.payoutAccountId}', 'CREDIT', 80000, 'INR', 'City Commute Trip Fare', NOW()),
          ('idemp-org-a-deduct-001', '${orgA.payoutAccountId}', 'DEBIT', 20000, 'INR', 'Fast Charging Reimbursement Offset', NOW()),
          ('idemp-org-b-fare-001', '${orgB.payoutAccountId}', 'CREDIT', 500000, 'INR', 'Amaravati Intercity EV Trip Fare', NOW());
      `);
    }
  }, 35000);

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
  }, 35000);

  describe('1. Fleet Organization Profile & Registration', () => {
    it('should retrieve caller organization with total vehicles and active drivers summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/fleet/organization')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(res.body.id).toBe(orgA.id);
      expect(res.body.name).toBe(orgA.name);
      expect(res.body.businessRegistrationNumber).toBe(orgA.businessRegistrationNumber);
      expect(res.body.city).toBe('visakhapatnam');
      expect(res.body.totalVehicles).toBeGreaterThanOrEqual(1);
    });

    it('should reject duplicate registration number when registering organization', async () => {
      await request(app.getHttpServer())
        .post('/v1/fleet/organizations')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          name: 'Duplicate Fleet Registration Ltd',
          businessRegistrationNumber: orgA.businessRegistrationNumber, // duplicate
          contactEmail: 'dup@test.in',
          contactPhone: '+919876300098',
          payoutAccountId: 'payout_acc_dup_unique',
          city: 'visakhapatnam',
        })
        .expect(409);
    });
  });

  describe('2. Vehicle Membership Attachment', () => {
    it('should attach unassigned 100% BEV electric vehicle to caller organization', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/vehicles/${vehicleA2Unattached.id}/membership`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(res.body.id).toBe(vehicleA2Unattached.id);
      expect(res.body.fleetOrganizationId).toBe(orgA.id);
      expect(res.body.propulsionType).toBe(PropulsionType.BATTERY_ELECTRIC);
    });

    it('should reject attaching a vehicle that already belongs to another fleet organization (409 Conflict)', async () => {
      // Vehicle B1 belongs to Org B. Fleet Owner A attempts to claim it.
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/vehicles/${vehicleB1.id}/membership`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(409);

      expect(res.body.error.message).toContain(
        'already affiliated with another fleet organization',
      );
    });
  });

  describe('3. Driver Assignment, Reassignment & Audit Trail', () => {
    it('should reject assigning an unverified driver (422 Unprocessable Entity)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/vehicles/${vehicleA1.id}/assign-driver`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          driverUserId: driverUnverified.id,
          assignmentReason: 'ROSTER_ROTATION',
          notes: 'Attempting unverified driver assignment',
        })
        .expect(422);

      expect(res.body.error.message).toContain('must be VERIFIED');
    });

    it('should assign verified driver A1 to vehicle A1 with active status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/vehicles/${vehicleA1.id}/assign-driver`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          driverUserId: driverA1.id,
          assignmentReason: 'INITIAL_ASSIGNMENT',
          notes: 'Initial morning shift driver assignment',
        })
        .expect(200);

      expect(res.body.vehicleId).toBe(vehicleA1.id);
      expect(res.body.driverId).toBe(driverA1.id);
      expect(res.body.status).toBe(FleetAssignmentStatus.ACTIVE);
      expect(res.body.unassignedAt).toBeNull();
    });

    it('should reassign vehicle A1 to driver A2, closing previous assignment with audit history', async () => {
      // Reassign to Driver A2
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/vehicles/${vehicleA1.id}/assign-driver`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          driverUserId: driverA2.id,
          assignmentReason: 'SHIFT_HANDOVER',
          notes: 'Handover to evening shift driver',
        })
        .expect(200);

      expect(res.body.driverId).toBe(driverA2.id);
      expect(res.body.status).toBe(FleetAssignmentStatus.ACTIVE);

      // Verify assignment history endpoint
      const historyRes = await request(app.getHttpServer())
        .get(`/v1/fleet/vehicles/${vehicleA1.id}/assignment-history`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(Array.isArray(historyRes.body)).toBe(true);
      expect(historyRes.body.length).toBeGreaterThanOrEqual(2);

      // Verify the previous assignment for Driver A1 was closed
      const prevAssignment = historyRes.body.find(
        (a: { driverId: string }) => a.driverId === driverA1.id,
      );
      expect(prevAssignment).toBeDefined();
      expect(prevAssignment.status).toBe(FleetAssignmentStatus.COMPLETED);
      expect(prevAssignment.unassignedAt).not.toBeNull();

      // Verify current assignment for Driver A2 is active
      const currentAssignment = historyRes.body.find(
        (a: { driverId: string }) => a.driverId === driverA2.id,
      );
      expect(currentAssignment).toBeDefined();
      expect(currentAssignment.status).toBe(FleetAssignmentStatus.ACTIVE);

      // Verify security audit events logged in DB
      const auditRows = await dataSource.query(`
        SELECT "action", "actor_id" FROM "audit_events"
        WHERE "action" = 'FLEET_VEHICLE_REASSIGNED'
        AND "actor_id" = '${fleetOwnerA.id}';
      `);
      expect(auditRows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Shift Lifecycle Management', () => {
    let createdShiftId: string;

    it('should start an operational shift for assigned vehicle and driver', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/fleet/shifts/start')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          vehicleId: vehicleA1.id,
          driverUserId: driverA2.id,
          shiftType: FleetShiftType.EVENING,
          startOdometerKm: 14200,
          startSocPercent: 88.0,
        })
        .expect(201);

      expect(res.body.vehicleId).toBe(vehicleA1.id);
      expect(res.body.driverId).toBe(driverA2.id);
      expect(res.body.status).toBe(FleetShiftStatus.ACTIVE);
      expect(res.body.startSocPercent).toBe(88.0);

      createdShiftId = res.body.id;
    });

    it('should end the active shift with return telemetry and fare revenue', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/fleet/shifts/${createdShiftId}/end`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .send({
          endOdometerKm: 14320,
          endSocPercent: 42.0,
          totalTrips: 8,
          totalEarningsPaise: 165000,
        })
        .expect(200);

      expect(res.body.id).toBe(createdShiftId);
      expect(res.body.status).toBe(FleetShiftStatus.COMPLETED);
      expect(res.body.totalTrips).toBe(8);
      expect(res.body.totalEarningsPaise).toBe(165000);
      expect(res.body.endTime).not.toBeNull();
    });

    it('should list operational shifts scoped to caller organization', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/fleet/shifts')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((s: { id: string }) => s.id === createdShiftId);
      expect(found).toBeDefined();
    });
  });

  describe('5. Acceptance: Cross-Fleet Tenant Restrictions & Scoped Earnings', () => {
    it('should strictly return only Org A earnings to Fleet Owner A', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/fleet/earnings')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(res.body.fleetOrganizationId).toBe(orgA.id);
      expect(res.body.payoutAccountId).toBe(orgA.payoutAccountId);
      expect(res.body.totalGrossInr).toBeGreaterThanOrEqual(2000);
      expect(res.body.platformFeeInr).toBeGreaterThanOrEqual(300);
      expect(res.body.netFleetEarningsInr).toBeGreaterThanOrEqual(1700);

      // Does not contain Org B's Amaravati trip
      const orgBItem = res.body.recentTransactions.find((item: { description: string }) =>
        item.description?.includes('Amaravati'),
      );
      expect(orgBItem).toBeUndefined();
    });

    it('should block Fleet Owner A from accessing Fleet Owner B organization directly (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/fleet/organizations/${orgB.id}`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(403);

      expect(res.body.error.message).toContain('Forbidden');

      // Verify CROSS_FLEET_ACCESS_DENIED security audit log was written
      const auditRows = await dataSource.query(`
        SELECT "action", "actor_id" FROM "audit_events"
        WHERE "action" = 'CROSS_FLEET_ACCESS_DENIED'
        AND "actor_id" = '${fleetOwnerA.id}';
      `);
      expect(auditRows.length).toBeGreaterThanOrEqual(1);
    });

    it('should block Fleet Owner A from accessing Fleet Owner B earnings (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/fleet/organizations/${orgB.id}/earnings`)
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(403);
    });

    it('should prevent cross-fleet vehicle leakage: Fleet Owner A sees only Org A vehicles', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/fleet/vehicles')
        .set('x-actor-user-id', fleetOwnerA.id)
        .set('x-actor-role', fleetOwnerA.role)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const vehicleIds = res.body.map((v: { id: string }) => v.id);
      expect(vehicleIds).toContain(vehicleA1.id);
      expect(vehicleIds).toContain(vehicleA2Unattached.id);
      expect(vehicleIds).not.toContain(vehicleB1.id); // Org B vehicle is hidden
    });

    it('should allow Platform Operator to inspect Fleet B earnings and organization without 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/fleet/organizations/${orgB.id}/earnings`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .expect(200);

      expect(res.body.fleetOrganizationId).toBe(orgB.id);
      expect(res.body.totalGrossInr).toBe(5000);
      expect(res.body.netFleetEarningsInr).toBe(4250);
    });
  });
});
