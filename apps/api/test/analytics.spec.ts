import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { AnalyticsController } from '../src/modules/analytics/analytics.controller';
import { Booking } from '../src/database/entities/booking.entity';
import { TaxInvoice } from '../src/database/entities/tax-invoice.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';

describe('Server-Derived Business Analytics & Reporting (M22)', () => {
  let service: AnalyticsService;

  const mockBookings: Partial<Booking>[] = [
    {
      id: 'b1',
      bookingCode: 'ECO-VJA-101',
      riderId: 'rider-1',
      captainId: 'captain-1',
      status: 'COMPLETED',
      fareAmount: 200.0, // ₹200.00 = 20000 paise
    },
    {
      id: 'b2',
      bookingCode: 'ECO-VJA-102',
      riderId: 'rider-2',
      captainId: 'captain-1',
      status: 'COMPLETED',
      fareAmount: 300.0, // ₹300.00 = 30000 paise
    },
    {
      id: 'b3',
      bookingCode: 'ECO-VJA-103',
      riderId: 'rider-3',
      status: 'CANCELLED',
      fareAmount: 150.0,
    },
  ];

  const mockInvoices: Partial<TaxInvoice>[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-202611-001',
      sacCode: '996412',
      baseFarePaise: 40000, // ₹400
      cgstPaise: 1000,     // 2.5% = ₹10
      sgstPaise: 1000,     // 2.5% = ₹10
      totalTaxPaise: 2000, // 5% = ₹20
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-202611-002',
      sacCode: '9965',
      baseFarePaise: 100000, // ₹1000
      cgstPaise: 9000,       // 9% = ₹90
      sgstPaise: 9000,       // 9% = ₹90
      totalTaxPaise: 18000,  // 18% = ₹180
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-202611-003',
      sacCode: '9987',
      baseFarePaise: 50000, // ₹500
      cgstPaise: 4500,      // 9% = ₹45
      sgstPaise: 4500,      // 9% = ₹45
      totalTaxPaise: 9000,  // 18% = ₹90
    },
  ];

  const mockVehicles: Partial<Vehicle>[] = [
    {
      id: 'v1',
      registrationNumber: 'AP 16 EV 0001',
      currentSocPercent: 85,
      isActive: true,
    },
    {
      id: 'v2',
      registrationNumber: 'AP 16 EV 0002',
      currentSocPercent: 60,
      isActive: true,
    },
    {
      id: 'v3',
      registrationNumber: 'AP 16 EV 0003',
      currentSocPercent: 18, // low SoC -> charging
      isActive: true,
    },
    {
      id: 'v4',
      registrationNumber: 'AP 07 EV 0004',
      currentSocPercent: 0,
      isActive: false, // maintenance
    },
  ];

  const mockDrivers: Partial<DriverProfile>[] = [
    { id: 'd1', userId: 'captain-1', dutyStatus: 'ON_DUTY' },
    { id: 'd2', userId: 'captain-2', dutyStatus: 'OFF_DUTY' },
  ];

  const mockBookingRepo = {
    find: jest.fn().mockResolvedValue(mockBookings),
  };

  const mockTaxInvoiceRepo = {
    find: jest.fn().mockResolvedValue(mockInvoices),
  };

  const mockVehicleRepo = {
    find: jest.fn().mockResolvedValue(mockVehicles),
  };

  const mockDriverProfileRepo = {
    find: jest.fn(({ where }: any = {}) => {
      if (where?.dutyStatus) {
        return Promise.resolve(mockDrivers.filter((d) => d.dutyStatus === where.dutyStatus));
      }
      return Promise.resolve(mockDrivers);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(TaxInvoice), useValue: mockTaxInvoiceRepo },
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepo },
        { provide: getRepositoryToken(DriverProfile), useValue: mockDriverProfileRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('Platform KPIs Calculation', () => {
    it('should compute GMV in paise, platform commission, and passenger km', async () => {
      const kpis = await service.getPlatformKpis('2026-11');

      expect(kpis.totalCompletedRides).toBe(2);
      // GMV = 20000 + 30000 = 50000 paise (₹500.00)
      expect(kpis.grossMerchandiseValuePaise).toBe(50000);
      expect(kpis.formattedGmv).toBe('₹500.00');

      // Net platform revenue (20% of GMV) = 10000 paise (₹100.00)
      expect(kpis.netPlatformRevenuePaise).toBe(10000);
      expect(kpis.formattedNetRevenue).toBe('₹100.00');

      // Captain earnings (80% of GMV) = 40000 paise (₹400.00)
      expect(kpis.captainEarningsPaise).toBe(40000);
      expect(kpis.formattedCaptainEarnings).toBe('₹400.00');

      // 2 completed rides * 8.5 km = 17 passenger km
      expect(kpis.totalPassengerKm).toBe(17);

      // EV Energy consumed: 17 km * 0.15 = 2.55 (rounded to 2.6 kWh)
      expect(kpis.totalEvEnergyConsumedKwh).toBeGreaterThan(2);

      // CO2 saved: 17 km * 0.14 = 2.38 kg
      expect(kpis.co2SavedKg).toBe(2.4);

      // Active captains on duty
      expect(kpis.activeCaptainsCount).toBe(1);

      // Completion rate: 2 completed / 3 total = 67%
      expect(kpis.completionRatePercent).toBe(67);
    });
  });

  describe('Statutory Andhra Pradesh GST Report (State Code 37)', () => {
    it('should generate monthly AP GST breakdown across SAC 996412, 9965, 9987', async () => {
      const report = await service.getMonthlyGstReport('2026-11');

      expect(report.stateCode).toBe('37');
      expect(report.gstin).toBe('37AABCE1234F1Z5');
      expect(report.legalEntityName).toBe('EcoRide AP Mobility Solutions Pvt Ltd');
      expect(report.lineItems.length).toBe(3);

      const passengerItem = report.lineItems.find((item) => item.sacCode === '996412')!;
      expect(passengerItem).toBeDefined();
      expect(passengerItem.cgstRatePercent).toBe(2.5);
      expect(passengerItem.sgstRatePercent).toBe(2.5);
      expect(passengerItem.taxableAmountPaise).toBe(40000);
      expect(passengerItem.cgstPaise).toBe(1000);
      expect(passengerItem.sgstPaise).toBe(1000);
      expect(passengerItem.totalTaxPaise).toBe(2000);

      const cargoItem = report.lineItems.find((item) => item.sacCode === '9965')!;
      expect(cargoItem).toBeDefined();
      expect(cargoItem.cgstRatePercent).toBe(9.0);
      expect(cargoItem.sgstRatePercent).toBe(9.0);
      expect(cargoItem.taxableAmountPaise).toBe(100000);
      expect(cargoItem.cgstPaise).toBe(9000);
      expect(cargoItem.sgstPaise).toBe(9000);
      expect(cargoItem.totalTaxPaise).toBe(18000);

      const chargingItem = report.lineItems.find((item) => item.sacCode === '9987')!;
      expect(chargingItem).toBeDefined();
      expect(chargingItem.cgstRatePercent).toBe(9.0);
      expect(chargingItem.sgstRatePercent).toBe(9.0);
      expect(chargingItem.taxableAmountPaise).toBe(50000);
      expect(chargingItem.cgstPaise).toBe(4500);
      expect(chargingItem.sgstPaise).toBe(4500);
      expect(chargingItem.totalTaxPaise).toBe(9000);

      // Verify parity
      expect(report.totalTaxableAmountPaise).toBe(190000);
      expect(report.totalCgstPaise).toBe(14500);
      expect(report.totalSgstPaise).toBe(14500);
      expect(report.totalGstPaise).toBe(29000);
      expect(report.totalCgstPaise + report.totalSgstPaise).toBe(report.totalGstPaise);
      expect(report.formattedTotalGst).toBe('₹290.00');
    });
  });

  describe('Fleet Utilization & Health', () => {
    it('should derive fleet utilization percentage and status distribution', async () => {
      const util = await service.getFleetUtilization();

      expect(util.totalVehicles).toBe(4);
      expect(util.activeOnDutyVehicles).toBe(1);
      expect(util.chargingVehicles).toBe(1);
      expect(util.maintenanceVehicles).toBe(1);
      expect(util.fleetUtilizationPercent).toBe(25); // (1 / 4) * 100
      expect(util.totalDutyHours).toBe(8);
    });
  });

  describe('Demand Heatmap Geofencing', () => {
    it('should return all AP capital corridor demand points', async () => {
      const points = await service.getDemandHeatmap();
      expect(points.length).toBeGreaterThanOrEqual(10);
      expect(points.some((p) => p.areaName.includes('Benz Circle'))).toBe(true);
      expect(points.some((p) => p.areaName.includes('AIIMS Mangalagiri'))).toBe(true);
      expect(points.some((p) => p.areaName.includes('Secretariat'))).toBe(true);
    });

    it('should filter demand points by city', async () => {
      const vjaPoints = await service.getDemandHeatmap('Vijayawada');
      expect(vjaPoints.length).toBe(4);
      expect(vjaPoints.every((p) => p.city === 'Vijayawada')).toBe(true);

      const gunturPoints = await service.getDemandHeatmap('Guntur');
      expect(gunturPoints.length).toBe(2);
      expect(gunturPoints.every((p) => p.city === 'Guntur')).toBe(true);
    });
  });
});
