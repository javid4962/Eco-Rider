import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  PlatformRole,
  PropulsionType,
  VehicleCategory,
  VehicleServiceClass,
  VehicleVerificationStatus,
  RangeTelemetrySource,
} from '@ecoride/contracts';
import { ExpandVehiclesTableWithEVCompliance1700000000008 } from '../src/database/migrations/1700000000008-ExpandVehiclesTableWithEVCompliance';
import { AddVehicleSeatingConfigurationAndClassificationControls1700000000011 } from '../src/database/migrations/1700000000011-AddVehicleSeatingConfigurationAndClassificationControls';

describe('Verified EV Records & Electric-Only Enforcement E2E Integration (EV-023)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const captainUser = {
    id: 'e1000000-0000-0000-0000-000000000001',
    phone: '+919876000001',
    role: PlatformRole.CAPTAIN,
    name: 'Suresh Captain (Vizag EV Fleet)',
  };

  const operatorUser = {
    id: 'e2000000-0000-0000-0000-000000000002',
    phone: '+919876000002',
    role: PlatformRole.OPERATOR,
    name: 'Venkatesh Fleet Ops Manager',
  };

  const riderUser = {
    id: 'e3000000-0000-0000-0000-000000000003',
    phone: '+919876000003',
    role: PlatformRole.RIDER,
    name: 'Laxmi Vizag Rider',
  };

  let registeredVehicleId: string;

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
      // Apply migrations if not already applied
      try {
        const migration8 = new ExpandVehiclesTableWithEVCompliance1700000000008();
        await migration8.up(dataSource.createQueryRunner());
      } catch {
        // Migration columns already exist
      }
      try {
        const migration11 =
          new AddVehicleSeatingConfigurationAndClassificationControls1700000000011();
        await migration11.up(dataSource.createQueryRunner());
      } catch {
        // Migration columns already exist
      }

      // Ensure seed users exist
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${captainUser.id}', '${captainUser.phone}', '${captainUser.role}', '${captainUser.name}', true),
          ('${operatorUser.id}', '${operatorUser.phone}', '${operatorUser.role}', '${operatorUser.name}', true),
          ('${riderUser.id}', '${riderUser.phone}', '${riderUser.role}', '${riderUser.name}', true)
        ON CONFLICT ("id") DO UPDATE
        SET "role" = EXCLUDED."role", "name" = EXCLUDED."name";
      `);
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        DELETE FROM "vehicles" WHERE "registration_number" LIKE 'AP31EV%' OR "registration_number" LIKE 'AP39EV%';
      `);
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Server-Side Electric-Only Enforcement (Flutter Tamper Prevention)', () => {
    it('should reject tampered Flutter request JSON attempting to register a PETROL vehicle with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV0099',
          propulsionType: 'PETROL', // Tampered non-electric propulsion
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Bajaj',
          model: 'Pulsar 150',
          yearOfManufacture: 2022,
          approvedPassengerSeating: 1,
          batteryCapacityKwh: 1.0,
          ratedRangeKm: 50,
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'PETROL' is strictly prohibited",
      );
      expect(res.body.error.message).toContain('BATTERY_ELECTRIC');
    });

    it('should reject tampered Flutter request JSON attempting to register a DIESEL vehicle with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV0098',
          propulsionType: 'DIESEL',
          vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
          make: 'Mahindra',
          model: 'Bolero',
          yearOfManufacture: 2023,
          approvedPassengerSeating: 4,
          batteryCapacityKwh: 2.0,
          ratedRangeKm: 80,
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'DIESEL' is strictly prohibited",
      );
    });

    it('should reject tampered Flutter request JSON attempting to register a CNG vehicle with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV0097',
          propulsionType: 'CNG',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Bajaj',
          model: 'Compact CNG',
          yearOfManufacture: 2023,
          approvedPassengerSeating: 3,
          batteryCapacityKwh: 2.0,
          ratedRangeKm: 90,
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'CNG' is strictly prohibited",
      );
    });

    it('should reject tampered Flutter request JSON attempting to register a HYBRID vehicle with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV0096',
          propulsionType: 'HYBRID',
          vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
          make: 'Toyota',
          model: 'Hyryder',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 4,
          batteryCapacityKwh: 1.5,
          ratedRangeKm: 40,
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'HYBRID' is strictly prohibited",
      );
    });

    it('should successfully register a genuine Battery Electric Vehicle (BEV) with 201 Created', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV1001',
          propulsionType: PropulsionType.BATTERY_ELECTRIC,
          vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
          make: 'Tata Motors',
          model: 'Nexon EV Empowered',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 4,
          batteryCapacityKwh: 40.5,
          currentSocPercent: 92.0,
          ratedRangeKm: 465,
          rangeTelemetrySource: RangeTelemetrySource.BMS_IOT_GATEWAY,
          telemetryDeviceId: 'IOT-NEXON-001',
          insurancePolicyNumber: 'POL-TATA-2026-001',
          insuranceExpiryDate: futureDate,
          fitnessCertificateNumber: 'FIT-AP31-2026-001',
          fitnessExpiryDate: futureDate,
          commercialPermitNumber: 'PERMIT-AP-2026-001',
          commercialPermitExpiry: futureDate,
          greenPlateVerified: true,
          city: 'visakhapatnam',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.propulsionType).toBe('BATTERY_ELECTRIC');
      expect(res.body.registrationNumber).toBe('AP31EV1001');
      expect(res.body.approvedPassengerSeating).toBe(4);
      expect(res.body.ratedRangeKm).toBe(465);
      expect(res.body.estimatedRangeKm).toBeGreaterThan(400);
      expect(res.body.ownerId).toBe(captainUser.id);

      registeredVehicleId = res.body.id;
    });

    it('should default propulsion to BATTERY_ELECTRIC when omitted from request JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV1002',
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Ather Energy',
          model: '450X Gen 3',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 1,
          batteryCapacityKwh: 3.7,
          ratedRangeKm: 110,
        })
        .expect(201);

      expect(res.body.propulsionType).toBe('BATTERY_ELECTRIC');
    });

    it('should prevent updating registered vehicle propulsion to non-electric with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/vehicles/${registeredVehicleId}`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          propulsionType: 'PETROL', // Tampering attempt on update
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'PETROL' is strictly prohibited",
      );
    });
  });

  describe('2. Seating Capacity Limits and Category Availability', () => {
    it('should reject approved seating capacity exceeding category maximum with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV1003',
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Ather',
          model: '450X',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 3, // 2W allows max 1 passenger
          batteryCapacityKwh: 3.7,
          ratedRangeKm: 110,
        })
        .expect(400);

      expect(res.body.error.message).toContain('exceeds the maximum allowed limit of 1');
    });
  });

  describe('3. Registration Uniqueness and Duplicate Prevention', () => {
    it('should reject registering duplicate vehicle registration number with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV1001', // Already registered
          vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
          make: 'Tata Motors',
          model: 'Nexon EV',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 4,
          batteryCapacityKwh: 40.5,
          ratedRangeKm: 465,
        })
        .expect(409);

      expect(res.body.error.message).toContain('already registered');
    });
  });

  describe('4. Real-Time Telemetry & Range Ingestion', () => {
    it('should update battery State of Charge and recalculate estimated range', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${registeredVehicleId}/telemetry`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          currentSocPercent: 50.0,
          rangeTelemetrySource: RangeTelemetrySource.BMS_IOT_GATEWAY,
          telemetryDeviceId: 'IOT-NEXON-001',
        })
        .expect(200);

      expect(res.body.currentSocPercent).toBe(50.0);
      // 50% of 465km = 233km
      expect(res.body.estimatedRangeKm).toBe(233);
      expect(res.body.telemetryLastPingAt).toBeDefined();
    });
  });

  describe('5. Real-Time Compliance Breakdown and Operator Verification', () => {
    it('should allow platform operator to verify vehicle status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${registeredVehicleId}/verify`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          status: VehicleVerificationStatus.VERIFIED,
          greenPlateVerified: true,
          rejectionReason: 'Verified with AP RTO Visakhapatnam Green Plate commercial records',
        })
        .expect(200);

      expect(res.body.verificationStatus).toBe(VehicleVerificationStatus.VERIFIED);
      expect(res.body.greenPlateVerified).toBe(true);
      expect(res.body.isRoadworthy).toBe(true);
    });

    it('should retrieve real-time regulatory compliance breakdown once verified', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/vehicles/${registeredVehicleId}/compliance`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .expect(200);

      expect(res.body.vehicleId).toBe(registeredVehicleId);
      expect(res.body.registrationNumber).toBe('AP31EV1001');
      expect(res.body.insuranceValid).toBe(true);
      expect(res.body.fitnessValid).toBe(true);
      expect(res.body.commercialPermitValid).toBe(true);
      expect(res.body.greenPlateVerified).toBe(true);
      expect(res.body.propulsionValid).toBe(true);
      expect(res.body.isCompliant).toBe(true);
    });

    it('should reject unauthorized verification attempts from non-operators with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/v1/vehicles/${registeredVehicleId}/verify`)
        .set('x-actor-user-id', riderUser.id)
        .set('x-actor-role', riderUser.role)
        .send({
          status: VehicleVerificationStatus.VERIFIED,
        })
        .expect(403);
    });
  });

  describe('6. Paginated Vehicle Queries and Filters', () => {
    it('should list vehicles with category and city filtering', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/vehicles?category=CAB_PRIVATE_4W&city=visakhapatnam')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.some((v: { id: string }) => v.id === registeredVehicleId)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. Permitted Seating Capacity, Classification Controls & Operational Readiness (EV-028)', () => {
    let autoVehicleId: string;

    it('should register a 3W EV auto rickshaw with D+3 notation and derive 3 customer seats + 1 driver seat', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV5555',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Bajaj',
          model: 'RE EV',
          yearOfManufacture: 2024,
          batteryCapacityKwh: 8.9,
          ratedRangeKm: 140,
          seatingConfiguration: 'D+3',
          city: 'visakhapatnam',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      autoVehicleId = res.body.id;
      expect(res.body.seatingConfiguration).toBe('D+3');
      expect(res.body.driverSeatCount).toBe(1);
      expect(res.body.legalPassengerCapacity).toBe(3);
      expect(res.body.totalSeatingCapacity).toBe(4);
      expect(res.body.serviceClass).toBe(VehicleServiceClass.ECO_AUTO);
    });

    it('should reject registering an over-capacity vehicle for its category with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV5556',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Bajaj',
          model: 'RE EV',
          yearOfManufacture: 2024,
          batteryCapacityKwh: 8.9,
          ratedRangeKm: 140,
          seatingConfiguration: 'D+4', // 3W max is D+3
          city: 'visakhapatnam',
        })
        .expect(400);

      expect(res.body.error.message).toContain('Over-capacity');
    });

    it('should reject registration when registration plate is blank with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: '   ',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Bajaj',
          model: 'RE EV',
          yearOfManufacture: 2024,
          batteryCapacityKwh: 8.9,
          ratedRangeKm: 140,
          seatingConfiguration: 'D+3',
          city: 'visakhapatnam',
        })
        .expect(400);
    });

    it('should reject registration in unauthorized cities with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/vehicles')
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          registrationNumber: 'AP31EV5557',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Bajaj',
          model: 'RE EV',
          yearOfManufacture: 2024,
          batteryCapacityKwh: 8.9,
          ratedRangeKm: 140,
          seatingConfiguration: 'D+3',
          city: 'vijayawada',
        })
        .expect(400);

      expect(res.body.error.message).toContain('Incompatible service class');
    });

    it('should block operation when requested seats exceed legal passenger capacity', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/validate-operation`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          requestedSeats: 4, // Exceeds D+3 capacity of 3
          serviceClass: VehicleServiceClass.ECO_AUTO,
          city: 'visakhapatnam',
        })
        .expect(200);

      expect(res.body.canOperate).toBe(false);
      expect(res.body.blockers.some((b: string) => b.includes('OVER_CAPACITY'))).toBe(true);
    });

    it('should block operation when requested service class is incompatible with vehicle classification', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/validate-operation`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          requestedSeats: 1,
          serviceClass: VehicleServiceClass.ECO_CAB, // Incompatible with ECO_AUTO
          city: 'visakhapatnam',
        })
        .expect(200);

      expect(res.body.canOperate).toBe(false);
      expect(res.body.blockers.some((b: string) => b.includes('INCOMPATIBLE_SERVICE_CLASS'))).toBe(
        true,
      );
    });

    it('should block operation when operating city is incompatible', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/validate-operation`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          requestedSeats: 1,
          serviceClass: VehicleServiceClass.ECO_AUTO,
          city: 'vijayawada',
        })
        .expect(200);

      expect(res.body.canOperate).toBe(false);
      expect(res.body.blockers.some((b: string) => b.includes('INCOMPATIBLE_CITY'))).toBe(true);
    });

    it('should block operation when green-plate commercial registration is unverified', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/validate-operation`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          requestedSeats: 3,
          serviceClass: VehicleServiceClass.ECO_AUTO,
          city: 'visakhapatnam',
        })
        .expect(200);

      expect(res.body.canOperate).toBe(false);
      expect(res.body.blockers.some((b: string) => b.includes('UNVERIFIED_REGISTRATION'))).toBe(
        true,
      );
    });

    it('should approve operation once verified and capacity, service class, and city match requirements', async () => {
      // 1. Operator verifies the vehicle's AP green plates
      await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/verify`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          status: VehicleVerificationStatus.VERIFIED,
          greenPlateVerified: true,
        })
        .expect(200);

      // 2. Validate operational readiness
      const res = await request(app.getHttpServer())
        .post(`/v1/vehicles/${autoVehicleId}/validate-operation`)
        .set('x-actor-user-id', captainUser.id)
        .set('x-actor-role', captainUser.role)
        .send({
          requestedSeats: 3,
          serviceClass: VehicleServiceClass.ECO_AUTO,
          city: 'visakhapatnam',
        })
        .expect(200);

      expect(res.body.canOperate).toBe(true);
      expect(res.body.blockers).toHaveLength(0);
      expect(res.body.driverSeatCount).toBe(1);
      expect(res.body.legalPassengerCapacity).toBe(3);
      expect(res.body.totalSeatingCapacity).toBe(4);
    });
  });
});
