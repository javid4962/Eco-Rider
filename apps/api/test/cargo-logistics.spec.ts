import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CargoService } from '../src/modules/cargo/cargo.service';
import { CargoController } from '../src/modules/cargo/cargo.controller';
import { CargoShipment } from '../src/database/entities/cargo-shipment.entity';
import { CargoStop } from '../src/database/entities/cargo-stop.entity';
import { CargoCodSettlement } from '../src/database/entities/cargo-cod-settlement.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';
import {
  CargoVehicleTier,
  CargoStopType,
  CargoShipmentStatus,
  CodSettlementStatus,
  PropulsionType,
  VehicleCategory,
} from '@ecoride/contracts';

describe('Milestone M15 & M16: EV Cargo Logistics (EV-113 – EV-120)', () => {
  let cargoService: CargoService;
  let cargoController: CargoController;

  const mockShipments: CargoShipment[] = [];
  const mockStops: CargoStop[] = [];
  const mockCodSettlements: CargoCodSettlement[] = [];
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
      if (item.trackingNumber) {
        const idx = mockShipments.findIndex((s) => s.id === item.id);
        if (idx >= 0) mockShipments[idx] = item as unknown as CargoShipment;
        else mockShipments.push(item as unknown as CargoShipment);
      } else if (item.stopType) {
        const idx = mockStops.findIndex((s) => s.id === item.id);
        if (idx >= 0) mockStops[idx] = item as unknown as CargoStop;
        else mockStops.push(item as unknown as CargoStop);
      } else if (item.status && item.amountPaise) {
        mockCodSettlements.push(item as unknown as CargoCodSettlement);
      }
      return item;
    }),
    find: jest.fn().mockImplementation(async (_entityClass: unknown, options?: { where?: Record<string, unknown> }) => {
      if (options?.where?.shipmentId) {
        return mockStops.filter((s) => s.shipmentId === options.where!.shipmentId);
      }
      return [];
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback: (manager: EntityManager) => Promise<unknown>) => {
      return callback(mockEntityManager as unknown as EntityManager);
    }),
  };

  beforeEach(async () => {
    mockShipments.length = 0;
    mockStops.length = 0;
    mockCodSettlements.length = 0;
    mockVehicles.length = 0;
    mockLedgerEntries.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CargoController],
      providers: [
        CargoService,
        {
          provide: getRepositoryToken(CargoShipment),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown>; relations?: string[] }) => {
              const shipment = mockShipments.find((s) => {
                if (options.where.id) return s.id === options.where.id;
                if (options.where.trackingNumber) return s.trackingNumber === options.where.trackingNumber;
                return false;
              });
              if (shipment && options.relations?.includes('stops')) {
                shipment.stops = mockStops.filter((st) => st.shipmentId === shipment.id);
              }
              return shipment || null;
            }),
            save: jest.fn().mockImplementation(async (s: CargoShipment) => {
              const idx = mockShipments.findIndex((item) => item.id === s.id);
              if (idx >= 0) mockShipments[idx] = s;
              else mockShipments.push(s);
              return s;
            }),
          },
        },
        {
          provide: getRepositoryToken(CargoStop),
          useValue: {
            save: jest.fn().mockImplementation(async (st: CargoStop) => {
              const idx = mockStops.findIndex((item) => item.id === st.id);
              if (idx >= 0) mockStops[idx] = st;
              else mockStops.push(st);
              return st;
            }),
            find: jest.fn().mockImplementation(async (options?: { where?: Record<string, unknown> }) => {
              if (options?.where?.shipmentId) {
                return mockStops.filter((st) => st.shipmentId === options.where!.shipmentId);
              }
              return mockStops;
            }),
          },
        },
        {
          provide: getRepositoryToken(CargoCodSettlement),
          useValue: {
            findOne: jest.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
              return (
                mockCodSettlements.find(
                  (c) =>
                    c.shipmentId === options.where.shipmentId &&
                    c.stopId === options.where.stopId,
                ) || null
              );
            }),
            save: jest.fn().mockImplementation(async (c: CargoCodSettlement) => {
              mockCodSettlements.push(c);
              return c;
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

    cargoService = module.get<CargoService>(CargoService);
    cargoController = module.get<CargoController>(CargoController);
  });

  describe('EV-113: Authoritative Cargo Fare Calculation & Tier Enforcement', () => {
    it('should calculate fare correctly for E_CARGO_2W with helper and multi-stop', () => {
      // 3 stops (1 pickup + 2 drops) => 1 extra stop
      const stops = [
        { latitude: 16.5062, longitude: 80.648 }, // Vijayawada Benz Circle
        { latitude: 16.4357, longitude: 80.5654 }, // Mangalagiri AIIMS
        { latitude: 16.3067, longitude: 80.4365 }, // Guntur Lodge Center
      ];

      const pricing = cargoService.calculateCargoFare(
        CargoVehicleTier.E_CARGO_2W,
        15, // 15kg
        stops,
        true, // requires helper
      );

      expect(pricing.tier).toBe(CargoVehicleTier.E_CARGO_2W);
      expect(pricing.packageWeightKg).toBe(15);
      expect(pricing.baseFarePaise).toBe(4000); // ₹40
      expect(pricing.weightFarePaise).toBe(3000); // 15kg * ₹2/kg = ₹30 (3000 paise)
      expect(pricing.helperFarePaise).toBe(15000); // ₹150 (15000 paise)
      expect(pricing.stopsFarePaise).toBe(2500); // 1 extra stop * ₹25 = ₹25 (2500 paise)
      expect(pricing.gstPaise).toBe(Math.round(pricing.subtotalFarePaise * 0.18));
      expect(pricing.totalFarePaise).toBe(pricing.subtotalFarePaise + pricing.gstPaise);
    });

    it('should reject package exceeding tier weight limit (e.g. 25kg on 2W tier)', () => {
      const stops = [
        { latitude: 16.5062, longitude: 80.648 },
        { latitude: 16.5162, longitude: 80.658 },
      ];

      expect(() =>
        cargoService.calculateCargoFare(CargoVehicleTier.E_CARGO_2W, 25, stops),
      ).toThrow(BadRequestException);
    });

    it('should reject calculation with less than 2 stops', () => {
      const stops = [{ latitude: 16.5062, longitude: 80.648 }];

      expect(() =>
        cargoService.calculateCargoFare(CargoVehicleTier.E_CARGO_2W, 5, stops),
      ).toThrow(BadRequestException);
    });
  });

  describe('EV-114 & EV-115: Multi-Stop Cargo Shipment Creation & 4-Digit POD OTP', () => {
    it('should create a multi-stop shipment with 4-digit POD OTPs and COD amount', async () => {
      const senderActor: CurrentActorPayload = { id: 'merchant-user-001', role: 'RIDER', scopes: [] };

      const result = await cargoService.createShipment(senderActor, {
        tier: CargoVehicleTier.E_CARGO_3W,
        packageWeightKg: 120,
        packageDescription: 'Electronics & Spare Parts',
        requiresHelper: false,
        stops: [
          {
            stopType: CargoStopType.PICKUP,
            address: 'Vijayawada Auto Nagar Gate 1',
            latitude: 16.495,
            longitude: 80.665,
            contactName: 'Warehouse Lead',
            contactPhone: '+919123400001',
          },
          {
            stopType: CargoStopType.DROP,
            address: 'Mangalagiri AIIMS Delivery Gate',
            latitude: 16.4357,
            longitude: 80.5654,
            contactName: 'Dr. Rao',
            contactPhone: '+919123400002',
            codPaise: 50000, // ₹500 COD
          },
          {
            stopType: CargoStopType.DROP,
            address: 'Guntur Arundelpet Trade Center',
            latitude: 16.3067,
            longitude: 80.4365,
            contactName: 'Store Manager',
            contactPhone: '+919123400003',
            codPaise: 35000, // ₹350 COD
          },
        ],
      });

      expect(result.id).toBeDefined();
      expect(result.trackingNumber).toMatch(/^ECO-CRG-\d{8}-[A-F0-9]{4}$/);
      expect(result.tier).toBe(CargoVehicleTier.E_CARGO_3W);
      expect(result.status).toBe(CargoShipmentStatus.REQUESTED);
      expect(result.totalCodPaise).toBe(85000); // 50000 + 35000 = ₹850 COD
      expect(result.stops.length).toBe(3);

      // Verify POD OTP generated for DROP stops only
      const pickupStop = result.stops.find((s) => s.stopType === CargoStopType.PICKUP)!;
      expect(pickupStop.podOtp).toBeUndefined();

      const dropStops = result.stops.filter((s) => s.stopType === CargoStopType.DROP);
      expect(dropStops.length).toBe(2);
      for (const drop of dropStops) {
        expect(drop.podOtp).toMatch(/^\d{4}$/);
      }
    });

    it('should reject shipment without pickup or drop stops', async () => {
      const senderActor: CurrentActorPayload = { id: 'merchant-user-001', role: 'RIDER', scopes: [] };

      await expect(
        cargoService.createShipment(senderActor, {
          tier: CargoVehicleTier.E_CARGO_2W,
          packageWeightKg: 5,
          packageDescription: 'Documents',
          stops: [
            {
              stopType: CargoStopType.PICKUP,
              address: 'Benz Circle',
              latitude: 16.5062,
              longitude: 80.648,
              contactName: 'Sender',
              contactPhone: '+919123400001',
            },
            {
              stopType: CargoStopType.PICKUP, // Missing drop stop!
              address: 'Auto Nagar',
              latitude: 16.495,
              longitude: 80.665,
              contactName: 'Sender 2',
              contactPhone: '+919123400002',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('EV-116: BEV Propulsion Enforcement on Dispatch Assignment', () => {
    let shipmentId: string;

    beforeEach(async () => {
      const merchantActor: CurrentActorPayload = { id: 'merchant-1', role: 'RIDER', scopes: [] };
      const created = await cargoService.createShipment(merchantActor, {
        tier: CargoVehicleTier.E_CARGO_3W,
        packageWeightKg: 50,
        packageDescription: 'Medical Supplies',
        stops: [
          {
            stopType: CargoStopType.PICKUP,
            address: 'Vijayawada Old Bus Stand',
            latitude: 16.51,
            longitude: 80.62,
            contactName: 'Sender',
            contactPhone: '+919123400001',
          },
          {
            stopType: CargoStopType.DROP,
            address: 'Guntur Collectorate',
            latitude: 16.3,
            longitude: 80.44,
            contactName: 'Recipient',
            contactPhone: '+919123400002',
          },
        ],
      });
      shipmentId = created.id;
    });

    it('should assign shipment successfully when vehicle is 100% BEV', async () => {
      const bevVehicle: Partial<Vehicle> = {
        id: 'bev-cargo-van-01',
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        registrationNumber: 'AP 16 EV 8899',
      };
      mockVehicles.push(bevVehicle as Vehicle);

      const assigned = await cargoService.assignShipment(
        shipmentId,
        'captain-ev-01',
        'bev-cargo-van-01',
      );

      expect(assigned.assignedCaptainId).toBe('captain-ev-01');
      expect(assigned.assignedVehicleId).toBe('bev-cargo-van-01');
      expect(assigned.status).toBe(CargoShipmentStatus.ASSIGNED);
    });

    it('should reject assignment when vehicle is NOT electric (e.g. DIESEL or PETROL)', async () => {
      const dieselVehicle: Partial<Vehicle> = {
        id: 'diesel-truck-01',
        propulsionType: 'DIESEL',
        registrationNumber: 'AP 16 DL 9999',
      };
      mockVehicles.push(dieselVehicle as Vehicle);

      await expect(
        cargoService.assignShipment(shipmentId, 'captain-diesel', 'diesel-truck-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('EV-117 – EV-120: In-Transit, Geofenced POD OTP & Cash-on-Delivery (COD) Reconciliation', () => {
    let shipmentId: string;
    let pickupStopId: string;
    let dropStopId: string;
    let podOtp: string;
    const captainId = 'captain-ev-99';
    const codPaise = 75000; // ₹750 COD

    beforeEach(async () => {
      const bevVehicle: Partial<Vehicle> = {
        id: 'bev-vehicle-99',
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
      };
      mockVehicles.push(bevVehicle as Vehicle);

      const storeActor: CurrentActorPayload = { id: 'merchant-store', role: 'RIDER', scopes: [] };
      const created = await cargoService.createShipment(storeActor, {
        tier: CargoVehicleTier.E_CARGO_2W,
        packageWeightKg: 10,
        packageDescription: 'Pharmaceuticals',
        stops: [
          {
            stopType: CargoStopType.PICKUP,
            address: 'Vijayawada Apollo Pharmacy',
            latitude: 16.5062,
            longitude: 80.648,
            contactName: 'Pharmacist',
            contactPhone: '+919123400010',
          },
          {
            stopType: CargoStopType.DROP,
            address: 'Mangalagiri NRI Hospital',
            latitude: 16.4357,
            longitude: 80.5654,
            contactName: 'Nurse Station',
            contactPhone: '+919123400020',
            codPaise,
          },
        ],
      });

      shipmentId = created.id;
      pickupStopId = created.stops.find((s) => s.stopType === CargoStopType.PICKUP)!.id;
      const dropStop = created.stops.find((s) => s.stopType === CargoStopType.DROP)!;
      dropStopId = dropStop.id;
      podOtp = dropStop.podOtp!;

      await cargoService.assignShipment(shipmentId, captainId, 'bev-vehicle-99');
    });

    it('should complete pickup and transition shipment status to IN_TRANSIT', async () => {
      const inTransit = await cargoService.completePickup(shipmentId, pickupStopId, captainId);

      expect(inTransit.status).toBe(CargoShipmentStatus.IN_TRANSIT);
      const pickupStop = inTransit.stops.find((s) => s.id === pickupStopId)!;
      expect(pickupStop.isCompleted).toBe(true);
      expect(pickupStop.completedAt).toBeDefined();
    });

    it('should reject delivery if captain is outside 300m geofence radius', async () => {
      await cargoService.completePickup(shipmentId, pickupStopId, captainId);

      // Captain coordinates 5km away from Mangalagiri NRI Hospital (16.4357, 80.5654)
      await expect(
        cargoService.deliverStop(shipmentId, dropStopId, captainId, {
          podOtp,
          recipientName: 'Dr. Satish',
          captainLatitude: 16.5062, // 5+ km away in Vijayawada
          captainLongitude: 80.648,
          cashCollectedPaise: codPaise,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject delivery if POD OTP is wrong', async () => {
      await cargoService.completePickup(shipmentId, pickupStopId, captainId);

      // Right location, wrong OTP
      await expect(
        cargoService.deliverStop(shipmentId, dropStopId, captainId, {
          podOtp: '9999', // Invalid OTP
          recipientName: 'Dr. Satish',
          captainLatitude: 16.4357, // Exact match
          captainLongitude: 80.5654,
          cashCollectedPaise: codPaise,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete delivery, collect COD, and post balanced double-entry ledger entries', async () => {
      await cargoService.completePickup(shipmentId, pickupStopId, captainId);

      const delivered = await cargoService.deliverStop(shipmentId, dropStopId, captainId, {
        podOtp,
        recipientName: 'Dr. Satish',
        signatureHash: 'sha256-signature-mock-hash-1234',
        captainLatitude: 16.4357,
        captainLongitude: 80.5654,
        cashCollectedPaise: codPaise,
      });

      expect(delivered.status).toBe(CargoShipmentStatus.DELIVERED);
      const dropStop = delivered.stops.find((s) => s.id === dropStopId)!;
      expect(dropStop.isCompleted).toBe(true);

      // Verify COD Settlement Record created
      expect(mockCodSettlements.length).toBe(1);
      expect(mockCodSettlements[0].status).toBe(CodSettlementStatus.COLLECTED_BY_CAPTAIN);
      expect(Number(mockCodSettlements[0].amountPaise)).toBe(codPaise);

      // Verify Double-Entry Ledger Parity for COD collection
      const codDebit = mockLedgerEntries.find(
        (e) => e.accountId === 'CAPTAIN_COD_IN_HAND' && e.entryType === 'DEBIT' && Number(e.amountPaise) === codPaise,
      );
      const codCredit = mockLedgerEntries.find(
        (e) => e.accountId === 'MERCHANT_COD_PAYABLE' && e.entryType === 'CREDIT' && Number(e.amountPaise) === codPaise,
      );
      expect(codDebit).toBeDefined();
      expect(codCredit).toBeDefined();

      // Settle collected COD to merchant
      const settled = await cargoService.settleCodToMerchant({
        shipmentId,
        stopId: dropStopId,
        merchantAccountId: 'merchant-store',
        referenceId: 'BANK-UTR-20261104-COD99',
      });

      expect(settled.status).toBe(CodSettlementStatus.SETTLED_TO_MERCHANT);
      expect(settled.settledAt).toBeDefined();

      // Verify Merchant Remittance Ledger Entries
      const remitDebit = mockLedgerEntries.find(
        (e) => e.accountId === 'MERCHANT_COD_PAYABLE' && e.entryType === 'DEBIT' && Number(e.amountPaise) === codPaise,
      );
      const remitCredit = mockLedgerEntries.find(
        (e) => e.accountId === 'BANK_ESCROW_DISBURSAL' && e.entryType === 'CREDIT' && Number(e.amountPaise) === codPaise,
      );
      expect(remitDebit).toBeDefined();
      expect(remitCredit).toBeDefined();

      // Verify Global Double-Entry Invariant: Total Debits === Total Credits
      const totalDebits = mockLedgerEntries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);
      const totalCredits = mockLedgerEntries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);
      expect(totalDebits).toBe(totalCredits);
    });
  });

  describe('CargoController Endpoints', () => {
    it('should compute quote via controller POST /v1/cargo/quote', () => {
      const quote = cargoController.calculateQuote({
        tier: CargoVehicleTier.E_CARGO_4W_VAN,
        packageWeightKg: 800,
        stops: [
          { latitude: 16.5062, longitude: 80.648 },
          { latitude: 16.3067, longitude: 80.4365 },
        ],
        requiresHelper: true,
      });

      expect(quote.tier).toBe(CargoVehicleTier.E_CARGO_4W_VAN);
      expect(quote.totalFarePaise).toBeGreaterThan(35000);
      expect(quote.gstPaise).toBe(Math.round(quote.subtotalFarePaise * 0.18));
    });
  });
});
