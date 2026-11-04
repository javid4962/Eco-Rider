import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ChargingService } from '../src/modules/charging/charging.service';
import { ChargingController } from '../src/modules/charging/charging.controller';
import { ChargingStation } from '../src/database/entities/charging-station.entity';
import { ChargingReservation } from '../src/database/entities/charging-reservation.entity';
import { BatteryTelemetryLog } from '../src/database/entities/battery-telemetry-log.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';
import {
  ChargingConnectorType,
  ChargingReservationStatus,
  PropulsionType,
  AP_CAPITAL_CORRIDOR_CHARGERS,
} from '@ecoride/contracts';

describe('Milestone M17 & M18: EV Charging Aggregator & Fleet Battery SoC (EV-121 – EV-125)', () => {
  let chargingService: ChargingService;
  let chargingController: ChargingController;

  const mockStations: ChargingStation[] = [];
  const mockReservations: ChargingReservation[] = [];
  const mockTelemetryLogs: BatteryTelemetryLog[] = [];
  const mockVehicles: Vehicle[] = [];
  const mockLedgerEntries: LedgerEntry[] = [];

  const mockEntityManager = {
    create: jest.fn().mockImplementation((_entityClass: unknown, data: Record<string, unknown>) => {
      return { id: `mock-${Date.now()}-${Math.random()}`, ...data };
    }),
    save: jest.fn().mockImplementation(async (entityOrEntities: unknown) => {
      if (Array.isArray(entityOrEntities)) {
        for (const item of entityOrEntities) {
          if (item instanceof LedgerEntry || (item as Record<string, unknown>).accountId) {
            mockLedgerEntries.push(item as LedgerEntry);
          }
        }
        return entityOrEntities;
      }
      const item = entityOrEntities as Record<string, unknown>;
      if (!item.id) {
        item.id = `mock-${Date.now()}-${Math.random()}`;
      }
      if (item.code) {
        const idx = mockStations.findIndex((s) => s.id === item.id);
        if (idx >= 0) mockStations[idx] = item as unknown as ChargingStation;
        else mockStations.push(item as unknown as ChargingStation);
      } else if (item.connectorType && item.stationId) {
        const idx = mockReservations.findIndex((r) => r.id === item.id);
        if (idx >= 0) mockReservations[idx] = item as unknown as ChargingReservation;
        else mockReservations.push(item as unknown as ChargingReservation);
      } else if (item.socPercent !== undefined) {
        mockTelemetryLogs.push(item as unknown as BatteryTelemetryLog);
      }
      return item;
    }),
    findOne: jest.fn().mockImplementation(async (_entityClass: unknown, options: { where: Record<string, unknown>; relations?: string[] }) => {
      if (options.where.id) {
        const station = mockStations.find((s) => s.id === options.where.id);
        if (station) return station;

        const res = mockReservations.find((r) => r.id === options.where.id);
        if (res && options.relations?.includes('station')) {
          res.station = mockStations.find((s) => s.id === res.stationId)!;
        }
        if (res) return res;

        const vehicle = mockVehicles.find((v) => v.id === options.where.id);
        if (vehicle) return vehicle;
      }
      return null;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback: (manager: EntityManager) => Promise<unknown>) => {
      return callback(mockEntityManager as unknown as EntityManager);
    }),
  };

  beforeEach(async () => {
    mockStations.length = 0;
    mockReservations.length = 0;
    mockTelemetryLogs.length = 0;
    mockVehicles.length = 0;
    mockLedgerEntries.length = 0;

    // Seed mock stations
    for (const s of AP_CAPITAL_CORRIDOR_CHARGERS) {
      mockStations.push({
        id: s.id,
        name: s.name,
        code: s.code,
        city: s.city,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        operator: s.operator,
        totalGuns: s.totalGuns,
        availableGuns: s.availableGuns,
        supportedConnectors: s.supportedConnectors,
        maxPowerKw: s.maxPowerKw,
        tariffPerKwhPaise: s.tariffPerKwhPaise,
        status: s.status,
        amenities: s.amenities,
        isActive: s.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ChargingStation);
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargingController],
      providers: [
        ChargingService,
        {
          provide: getRepositoryToken(ChargingStation),
          useValue: {
            count: jest.fn().mockResolvedValue(mockStations.length),
            find: jest.fn().mockResolvedValue(mockStations),
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockStations.find((s) => s.id === options.where.id) || null;
            }),
            save: jest.fn().mockImplementation(async (s: ChargingStation) => {
              const idx = mockStations.findIndex((item) => item.id === s.id);
              if (idx >= 0) mockStations[idx] = s;
              else mockStations.push(s);
              return s;
            }),
            create: jest.fn().mockImplementation((data: Partial<ChargingStation>) => data),
          },
        },
        {
          provide: getRepositoryToken(ChargingReservation),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown>; relations?: string[] }) => {
              const res = mockReservations.find((r) => r.id === options.where.id);
              if (res && options.relations?.includes('station')) {
                res.station = mockStations.find((s) => s.id === res.stationId)!;
              }
              return res || null;
            }),
            save: jest.fn().mockImplementation(async (r: ChargingReservation) => {
              const idx = mockReservations.findIndex((item) => item.id === r.id);
              if (idx >= 0) mockReservations[idx] = r;
              else mockReservations.push(r);
              return r;
            }),
            create: jest.fn().mockImplementation((data: Partial<ChargingReservation>) => data),
          },
        },
        {
          provide: getRepositoryToken(BatteryTelemetryLog),
          useValue: {
            save: jest.fn().mockImplementation(async (log: BatteryTelemetryLog) => {
              mockTelemetryLogs.push(log);
              return log;
            }),
            create: jest.fn().mockImplementation((data: Partial<BatteryTelemetryLog>) => data),
          },
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return mockVehicles.find((v) => v.id === options.where.id) || null;
            }),
            save: jest.fn().mockImplementation(async (v: Vehicle) => {
              const idx = mockVehicles.findIndex((item) => item.id === v.id);
              if (idx >= 0) mockVehicles[idx] = v;
              else mockVehicles.push(v);
              return v;
            }),
          },
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: {
            save: jest.fn().mockImplementation(async (entries: LedgerEntry[]) => {
              mockLedgerEntries.push(...entries);
              return entries;
            }),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    chargingService = module.get<ChargingService>(ChargingService);
    chargingController = module.get<ChargingController>(ChargingController);
  });

  describe('EV-121: AP Capital Corridor Charging Station Directory', () => {
    it('should list and calculate distances from captain location (Benz Circle, Vijayawada)', async () => {
      const results = await chargingService.findNearbyStations({
        latitude: 16.5062,
        longitude: 80.648,
        radiusKm: 20,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].code).toBe('VJA-BENZ-01');
      expect(results[0].distanceKm).toBe(0); // Exact match
      expect(results[0].tariffPerKwhPaise).toBe(1800);
      expect(results[0].formattedTariff).toBe('₹18.00/kWh');
    });

    it('should filter charging stations by CCS2 connector and min power 120kW', async () => {
      const results = await chargingService.findNearbyStations({
        connectorType: ChargingConnectorType.CCS2,
        minPowerKw: 120,
      });

      expect(results.length).toBeGreaterThan(0);
      for (const st of results) {
        expect(st.supportedConnectors).toContain(ChargingConnectorType.CCS2);
        expect(st.maxPowerKw).toBeGreaterThanOrEqual(120);
      }
    });
  });

  describe('EV-122: En-Route Charging Slot Reservation', () => {
    it('should reserve an available gun and decrement available count', async () => {
      const station = mockStations[0]; // Benz Circle (availableGuns: 6)
      const initialAvailable = station.availableGuns;

      const reservation = await chargingService.reserveSlot('captain-001', {
        stationId: station.id,
        vehicleId: 'bev-vehicle-001',
        connectorType: ChargingConnectorType.CCS2,
      });

      expect(reservation.id).toBeDefined();
      expect(reservation.status).toBe(ChargingReservationStatus.RESERVED);
      expect(reservation.stationName).toBe(station.name);
      expect(reservation.tariffPerKwhPaise).toBe(Number(station.tariffPerKwhPaise));
      expect(station.availableGuns).toBe(initialAvailable - 1);
    });

    it('should reject reservation when connector type is unsupported', async () => {
      const station = mockStations[2]; // Mangalagiri AIIMS (CCS2, TYPE_2_AC only, NO GB_T)

      await expect(
        chargingService.reserveSlot('captain-001', {
          stationId: station.id,
          vehicleId: 'bev-vehicle-001',
          connectorType: ChargingConnectorType.GB_T,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject reservation when all guns are occupied (availableGuns = 0)', async () => {
      const station = mockStations[0];
      station.availableGuns = 0;

      await expect(
        chargingService.reserveSlot('captain-001', {
          stationId: station.id,
          vehicleId: 'bev-vehicle-001',
          connectorType: ChargingConnectorType.CCS2,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('EV-123 & EV-124: Real-Time Battery Telemetry & Automated Dispatch Lockout', () => {
    let bevVehicleId: string;

    beforeEach(() => {
      const bev: Partial<Vehicle> = {
        id: 'bev-car-101',
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
        ratedRangeKm: 200,
        currentSocPercent: 85,
        estimatedRangeKm: 170,
      };
      mockVehicles.push(bev as Vehicle);
      bevVehicleId = bev.id!;
    });

    it('should allow dispatch when battery SoC is sufficient (e.g. 65%)', async () => {
      const result = await chargingService.reportBatteryTelemetry('captain-001', {
        vehicleId: bevVehicleId,
        socPercent: 65,
        source: 'OBD_TELEMATICS',
      });

      expect(result.isDispatchEligible).toBe(true);
      expect(result.isLockoutActive).toBe(false);
      expect(result.recommendedAction).toBe('DISPATCH_READY');
      expect(result.estimatedRangeKm).toBe(130); // 200km * 65% = 130km
    });

    it('should issue warning when battery SoC is low but above lockout threshold (e.g. 22%)', async () => {
      const result = await chargingService.reportBatteryTelemetry('captain-001', {
        vehicleId: bevVehicleId,
        socPercent: 22,
        source: 'MANUAL_TELEMETRY',
      });

      expect(result.isDispatchEligible).toBe(true);
      expect(result.isLockoutActive).toBe(false);
      expect(result.recommendedAction).toBe('LOW_BATTERY_WARNING_PLAN_CHARGING');
      expect(result.nearestCharger).toBeDefined();
    });

    it('should trigger hard dispatch lockout and recommend nearest charger when SoC < 18% (e.g. 14%)', async () => {
      const result = await chargingService.reportBatteryTelemetry('captain-001', {
        vehicleId: bevVehicleId,
        socPercent: 14,
        source: 'MANUAL_TELEMETRY',
        currentLatitude: 16.5062,
        currentLongitude: 80.648,
      });

      expect(result.isDispatchEligible).toBe(false);
      expect(result.isLockoutActive).toBe(true);
      expect(result.recommendedAction).toBe('DISPATCH_LOCKED_OUT_NAVIGATE_TO_CHARGER');
      expect(result.lockoutReason).toContain('14%');
      expect(result.nearestCharger).toBeDefined();
      expect(result.nearestCharger!.code).toBe('VJA-BENZ-01');

      // Verify telemetry logged
      expect(mockTelemetryLogs.length).toBe(1);
      expect(mockTelemetryLogs[0].isLockoutTriggered).toBe(true);
    });

    it('should reject telemetry reporting for non-EV vehicles', async () => {
      const petrolVehicle: Partial<Vehicle> = {
        id: 'petrol-car-999',
        propulsionType: 'PETROL',
      };
      mockVehicles.push(petrolVehicle as Vehicle);

      await expect(
        chargingService.reportBatteryTelemetry('captain-001', {
          vehicleId: 'petrol-car-999',
          socPercent: 50,
          source: 'MANUAL',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('EV-125: Charging Session Completion & Ledger Settlement', () => {
    it('should calculate kWh tariff with 18% AP GST, update SoC, and post double-entry ledger', async () => {
      const bevVehicle: Partial<Vehicle> = {
        id: 'bev-auto-01',
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
        ratedRangeKm: 150,
        currentSocPercent: 15,
        estimatedRangeKm: 22.5,
      };
      mockVehicles.push(bevVehicle as Vehicle);

      const station = mockStations[0]; // Benz circle (1800 paise/kWh = ₹18.00)
      const res = await chargingService.reserveSlot('captain-77', {
        stationId: station.id,
        vehicleId: 'bev-auto-01',
        connectorType: ChargingConnectorType.CCS2,
      });

      // Complete charging session with 25 kWh consumed, charging up to 95% SoC
      const completed = await chargingService.completeChargingSession('captain-77', {
        reservationId: res.id,
        kwhConsumed: 25.0,
        endSocPercent: 95.0,
      });

      expect(completed.status).toBe(ChargingReservationStatus.COMPLETED);
      expect(completed.kwhConsumed).toBe(25.0);

      // Energy: 25 kWh * 1800 paise = 45000 paise (₹450.00)
      // GST: 18% of 45000 = 8100 paise (₹81.00)
      // Total: 45000 + 8100 = 53100 paise (₹531.00)
      expect(completed.energyFarePaise).toBe(45000);
      expect(completed.gstPaise).toBe(8100);
      expect(completed.totalFarePaise).toBe(53100);
      expect(completed.formattedTotalFare).toBe('₹531.00');

      // Verify double-entry ledger balance
      const debitEntry = mockLedgerEntries.find(
        (e) => e.accountId === 'CAPTAIN_WALLET' && e.entryType === 'DEBIT' && Number(e.amountPaise) === 53100,
      );
      const creditEntry = mockLedgerEntries.find(
        (e) => e.accountId === 'CHARGING_OPERATOR_PAYABLE' && e.entryType === 'CREDIT' && Number(e.amountPaise) === 53100,
      );
      expect(debitEntry).toBeDefined();
      expect(creditEntry).toBeDefined();

      const totalDebits = mockLedgerEntries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);
      const totalCredits = mockLedgerEntries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);
      expect(totalDebits).toBe(totalCredits);

      // Verify vehicle SoC updated to 95%
      const updatedVehicle = mockVehicles.find((v) => v.id === 'bev-auto-01')!;
      expect(updatedVehicle.currentSocPercent).toBe(95.0);
    });
  });

  describe('ChargingController Endpoints', () => {
    it('should query stations via GET /charging/stations', async () => {
      const results = await chargingController.findStations('16.5062', '80.648', '30');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should reserve slot via POST /charging/reservations', async () => {
      const actor: CurrentActorPayload = { id: 'captain-88', role: 'CAPTAIN', scopes: [] };
      const res = await chargingController.reserveSlot(actor, {
        stationId: mockStations[0].id,
        vehicleId: 'bev-001',
        connectorType: ChargingConnectorType.CCS2,
      });
      expect(res.status).toBe(ChargingReservationStatus.RESERVED);
    });
  });
});
