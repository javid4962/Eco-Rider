import { VehiclesService } from '../src/modules/vehicles/vehicles.service';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { AuditEvent } from '../src/database/entities/audit-event.entity';
import { User } from '../src/database/entities/user.entity';
import { Repository } from 'typeorm';
import {
  PropulsionType,
  VehicleCategory,
  VehicleVerificationStatus,
  RangeTelemetrySource,
  PlatformRole,
} from '@ecoride/contracts';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Verified EV Vehicle Records & Electric-Only Enforcement (EV-023 Unit Tests)', () => {
  let service: VehiclesService;
  let mockVehicleRepo: Partial<Repository<Vehicle>>;
  let mockAuditRepo: Partial<Repository<AuditEvent>>;
  let mockUserRepo: Partial<Repository<User>>;

  const driverActor: CurrentActorPayload = {
    id: 'd1000000-0000-0000-0000-000000000001',
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self', 'shift:manage:self'],
  };

  const otherDriverActor: CurrentActorPayload = {
    id: 'd2000000-0000-0000-0000-000000000002',
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self'],
  };

  const operatorActor: CurrentActorPayload = {
    id: 'o3000000-0000-0000-0000-000000000003',
    role: PlatformRole.OPERATOR,
    scopes: ['vehicle:verify', 'fleet:manage'],
  };

  const superAdminActor: CurrentActorPayload = {
    id: 'a4000000-0000-0000-0000-000000000004',
    role: PlatformRole.SUPER_ADMIN,
    scopes: ['*'],
  };

  let vehiclesStore: Map<string, Vehicle>;
  let auditStore: AuditEvent[];

  beforeEach(() => {
    vehiclesStore = new Map();
    auditStore = [];

    mockVehicleRepo = {
      create: jest.fn().mockImplementation((dto) => {
        const vehicle = new Vehicle();
        vehicle.id = 'veh-' + Math.random().toString(36).substring(2, 9);
        vehicle.createdAt = new Date();
        vehicle.updatedAt = new Date();
        vehicle.isActive = true;
        Object.assign(vehicle, dto);
        return vehicle;
      }),
      save: jest.fn().mockImplementation(async (entity: Vehicle) => {
        vehiclesStore.set(entity.id, entity);
        return entity;
      }),
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        for (const v of vehiclesStore.values()) {
          if (opts.where.id && v.id === opts.where.id) return v;
          if (
            opts.where.registrationNumber &&
            v.registrationNumber === opts.where.registrationNumber
          )
            return v;
        }
        return null;
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockImplementation(async () => {
          const all = Array.from(vehiclesStore.values());
          return [all, all.length];
        }),
      }),
    };

    mockAuditRepo = {
      create: jest.fn().mockImplementation((dto) => {
        const ev = new AuditEvent();
        Object.assign(ev, dto);
        return ev;
      }),
      save: jest.fn().mockImplementation(async (ev) => {
        auditStore.push(ev);
        return ev;
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        if (opts.where.id === driverActor.id) {
          const user = new User();
          user.id = driverActor.id;
          return user;
        }
        return null;
      }),
    };

    service = new VehiclesService(
      mockVehicleRepo as Repository<Vehicle>,
      mockAuditRepo as Repository<AuditEvent>,
      mockUserRepo as Repository<User>,
    );
  });

  describe('1. Authoritative Server-Side Electric-Only Propulsion Enforcement', () => {
    it('should successfully permit BATTERY_ELECTRIC propulsion', async () => {
      expect(() => service.assertElectricPropulsion(PropulsionType.BATTERY_ELECTRIC)).not.toThrow();
    });

    it('should default undefined propulsion to permitted (entity/DTO handles default)', () => {
      expect(() => service.assertElectricPropulsion(undefined)).not.toThrow();
    });

    it('should reject PETROL propulsion with HTTP 400 Bad Request', () => {
      expect(() => service.assertElectricPropulsion('PETROL')).toThrow(BadRequestException);
      expect(() => service.assertElectricPropulsion('PETROL')).toThrow(/Non-electric propulsion/);
    });

    it('should reject DIESEL propulsion with HTTP 400 Bad Request', () => {
      expect(() => service.assertElectricPropulsion('DIESEL')).toThrow(BadRequestException);
      expect(() => service.assertElectricPropulsion('DIESEL')).toThrow(/Non-electric propulsion/);
    });

    it('should reject CNG propulsion with HTTP 400 Bad Request', () => {
      expect(() => service.assertElectricPropulsion('CNG')).toThrow(BadRequestException);
      expect(() => service.assertElectricPropulsion('CNG')).toThrow(/Non-electric propulsion/);
    });

    it('should reject HYBRID and PLUGIN_HYBRID propulsion with HTTP 400 Bad Request', () => {
      expect(() => service.assertElectricPropulsion('HYBRID')).toThrow(BadRequestException);
      expect(() => service.assertElectricPropulsion('PLUGIN_HYBRID')).toThrow(BadRequestException);
    });

    it('should reject INTERNAL_COMBUSTION propulsion with HTTP 400 Bad Request', () => {
      expect(() => service.assertElectricPropulsion('INTERNAL_COMBUSTION')).toThrow(
        BadRequestException,
      );
    });

    it('should reject arbitrary non-electric propulsion string (e.g. HYDROGEN_ICE, ETHANOL)', () => {
      expect(() => service.assertElectricPropulsion('HYDROGEN_ICE')).toThrow(BadRequestException);
      expect(() => service.assertElectricPropulsion('ETHANOL')).toThrow(BadRequestException);
    });

    it('should prevent bypassing electric check when creating a vehicle', async () => {
      await expect(
        service.createVehicle(driverActor, {
          registrationNumber: 'AP39EV1001',
          propulsionType: 'DIESEL',
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Bajaj',
          model: 'Pulsar',
          yearOfManufacture: 2023,
          approvedPassengerSeating: 1,
          batteryCapacityKwh: 3.5,
          ratedRangeKm: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent updating vehicle propulsion to non-electric', async () => {
      const created = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV1002',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        ratedRangeKm: 110,
      });

      await expect(
        service.updateVehicle(driverActor, created.id, {
          propulsionType: 'PETROL',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Seating Capacity Limits by Category', () => {
    it('should allow valid passenger seating capacity for 2W (1 passenger)', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV2001',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        ratedRangeKm: 110,
      });
      expect(v.approvedPassengerSeating).toBe(1);
    });

    it('should reject 2W with > 1 approved passenger seating', async () => {
      await expect(
        service.createVehicle(driverActor, {
          registrationNumber: 'AP39EV2002',
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Ather',
          model: '450X',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 2, // Exceeds 2W limit
          batteryCapacityKwh: 3.7,
          ratedRangeKm: 110,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow up to 3 passenger seating for 3W auto and reject 4', async () => {
      const auto = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV3001',
        vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
        make: 'Mahindra',
        model: 'Treo',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 3,
        batteryCapacityKwh: 7.37,
        ratedRangeKm: 130,
      });
      expect(auto.approvedPassengerSeating).toBe(3);

      await expect(
        service.createVehicle(driverActor, {
          registrationNumber: 'AP39EV3002',
          vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
          make: 'Mahindra',
          model: 'Treo',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 4, // Exceeds 3W limit
          batteryCapacityKwh: 7.37,
          ratedRangeKm: 130,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow up to 4 passenger seating for 4W cab and reject 5', async () => {
      const cab = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV4001',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Tigor EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 26.0,
        ratedRangeKm: 250,
      });
      expect(cab.approvedPassengerSeating).toBe(4);

      await expect(
        service.createVehicle(driverActor, {
          registrationNumber: 'AP39EV4002',
          vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
          make: 'Tata Motors',
          model: 'Tigor EV',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 5, // Exceeds 4W cab limit
          batteryCapacityKwh: 26.0,
          ratedRangeKm: 250,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Registration Uniqueness and Duplicate Prevention', () => {
    it('should reject registration of a vehicle with an existing registration number', async () => {
      await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV5001',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ola Electric',
        model: 'S1 Pro',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 4.0,
        ratedRangeKm: 180,
      });

      await expect(
        service.createVehicle(driverActor, {
          registrationNumber: 'AP39EV5001', // Duplicate
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          make: 'Ola Electric',
          model: 'S1 Pro',
          yearOfManufacture: 2024,
          approvedPassengerSeating: 1,
          batteryCapacityKwh: 4.0,
          ratedRangeKm: 180,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('4. Ownership and Role-Based Management Permissions', () => {
    it('should allow owner to update their own vehicle record', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV6001',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        ratedRangeKm: 110,
      });

      const updated = await service.updateVehicle(driverActor, v.id, {
        model: '450 Apex',
      });
      expect(updated.model).toBe('450 Apex');
    });

    it('should forbid other drivers from modifying a vehicle they do not own', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV6002',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        ratedRangeKm: 110,
      });

      await expect(
        service.updateVehicle(otherDriverActor, v.id, {
          model: 'Tampered Model',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Super Admin and Operator to update any vehicle record', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV6003',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        ratedRangeKm: 110,
      });

      const updatedByOperator = await service.updateVehicle(operatorActor, v.id, {
        isActive: false,
      });
      expect(updatedByOperator.isActive).toBe(false);

      const updatedBySuperAdmin = await service.updateVehicle(superAdminActor, v.id, {
        isActive: true,
      });
      expect(updatedBySuperAdmin.isActive).toBe(true);
    });

    it('should throw NotFoundException when updating or querying a nonexistent vehicle ID', async () => {
      await expect(
        service.updateVehicle(superAdminActor, '00000000-0000-0000-0000-000000000000', {
          make: 'Tesla',
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(service.getVehicle('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('5. Operator Verification and Regulatory Green Plates', () => {
    it('should allow operator to verify a vehicle and mark AP green plates verified', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV7001',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Nexon EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 40.5,
        ratedRangeKm: 465,
      });

      const verified = await service.verifyVehicle(operatorActor, v.id, {
        status: VehicleVerificationStatus.VERIFIED,
        greenPlateVerified: true,
      });

      expect(verified.verificationStatus).toBe(VehicleVerificationStatus.VERIFIED);
      expect(verified.greenPlateVerified).toBe(true);
    });

    it('should forbid regular driver from verifying their own vehicle', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV7002',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Nexon EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 40.5,
        ratedRangeKm: 465,
      });

      await expect(
        service.verifyVehicle(driverActor, v.id, {
          status: VehicleVerificationStatus.VERIFIED,
          greenPlateVerified: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('6. Battery SoC, Range Calculation, and Telemetry Updates', () => {
    it('should accurately calculate estimated range from SoC percentage and rated range', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV8001',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Nexon EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 40.5,
        currentSocPercent: 50.0,
        ratedRangeKm: 400,
      });

      // 50% SoC on 400km rated range = 200km
      expect(v.estimatedRangeKm).toBe(200);
    });

    it('should update battery SoC and record telemetry timestamp on ping', async () => {
      const v = await service.createVehicle(driverActor, {
        registrationNumber: 'AP39EV8002',
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        make: 'Ather',
        model: '450X',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 1,
        batteryCapacityKwh: 3.7,
        currentSocPercent: 100.0,
        ratedRangeKm: 100,
      });

      const updated = await service.updateTelemetry(v.id, {
        currentSocPercent: 75.0,
        rangeTelemetrySource: RangeTelemetrySource.BMS_IOT_GATEWAY,
        telemetryDeviceId: 'IOT-BMS-99881',
      });

      expect(updated.currentSocPercent).toBe(75.0);
      expect(updated.estimatedRangeKm).toBe(75);
      expect(updated.telemetryDeviceId).toBe('IOT-BMS-99881');
      expect(updated.telemetryLastPingAt).toBeDefined();
    });
  });

  describe('7. Real-Time Regulatory Compliance and Expiry Inspections', () => {
    it('should report fully compliant status when all permits and certificates are valid', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const v = await service.createVehicle(operatorActor, {
        registrationNumber: 'AP39EV9001',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Tigor EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 26.0,
        ratedRangeKm: 250,
        greenPlateVerified: true,
        insurancePolicyNumber: 'POL-VALID-123',
        insuranceExpiryDate: futureDate,
        fitnessCertificateNumber: 'FIT-VALID-456',
        fitnessExpiryDate: futureDate,
        commercialPermitNumber: 'PERMIT-VALID-789',
        commercialPermitExpiry: futureDate,
      });

      const compliance = await service.getCompliance(v.id);
      expect(compliance.isCompliant).toBe(true);
      expect(compliance.insuranceValid).toBe(true);
      expect(compliance.fitnessValid).toBe(true);
      expect(compliance.commercialPermitValid).toBe(true);
      expect(compliance.greenPlateVerified).toBe(true);
      expect(compliance.propulsionValid).toBe(true);
      expect(compliance.issues).toHaveLength(0);
    });

    it('should report non-compliant when insurance or permits are expired', async () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const v = await service.createVehicle(operatorActor, {
        registrationNumber: 'AP39EV9002',
        vehicleCategory: VehicleCategory.CAB_PRIVATE_4W,
        make: 'Tata Motors',
        model: 'Tigor EV',
        yearOfManufacture: 2024,
        approvedPassengerSeating: 4,
        batteryCapacityKwh: 26.0,
        ratedRangeKm: 250,
        greenPlateVerified: true,
        insurancePolicyNumber: 'POL-EXPIRED-123',
        insuranceExpiryDate: pastDate, // Expired
        fitnessCertificateNumber: 'FIT-VALID-456',
        fitnessExpiryDate: futureDate,
        commercialPermitNumber: 'PERMIT-VALID-789',
        commercialPermitExpiry: futureDate,
      });

      const compliance = await service.getCompliance(v.id);
      expect(compliance.isCompliant).toBe(false);
      expect(compliance.insuranceValid).toBe(false);
      expect(
        compliance.issues.some((issue) => issue.includes('Commercial insurance expired')),
      ).toBe(true);
    });
  });
});
