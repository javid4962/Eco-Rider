import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SustainabilityService } from '../src/modules/sustainability/sustainability.service';
import { SustainabilityController } from '../src/modules/sustainability/sustainability.controller';
import { GreenCertificate } from '../src/database/entities/green-certificate.entity';
import { Booking } from '../src/database/entities/booking.entity';

describe('Carbon Offset & Green Certificates Engine (M27)', () => {
  let service: SustainabilityService;

  const mockCerts: GreenCertificate[] = [];
  const mockBookings: Partial<Booking>[] = [
    { id: 'b1', riderId: 'rider-1', status: 'COMPLETED' },
    { id: 'b2', riderId: 'rider-1', status: 'COMPLETED' },
    { id: 'b3', riderId: 'rider-1', status: 'COMPLETED' },
  ];

  const mockCertRepo = {
    create: jest.fn((dto) => ({
      id: 'cert-uuid-1',
      issuedAt: new Date(),
      ...dto,
    })),
    save: jest.fn((entity) => {
      mockCerts.push(entity);
      return Promise.resolve(entity);
    }),
    findOne: jest.fn(({ where }) => {
      if (where.certificateNumber) {
        return Promise.resolve(
          mockCerts.find((c) => c.certificateNumber === where.certificateNumber) || null,
        );
      }
      if (where.recipientId) {
        return Promise.resolve(
          mockCerts.find((c) => c.recipientId === where.recipientId) || null,
        );
      }
      return Promise.resolve(null);
    }),
  };

  const mockBookingRepo = {
    find: jest.fn().mockResolvedValue(mockBookings),
  };

  beforeEach(async () => {
    mockCerts.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SustainabilityController],
      providers: [
        SustainabilityService,
        { provide: getRepositoryToken(GreenCertificate), useValue: mockCertRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
      ],
    }).compile();

    service = module.get<SustainabilityService>(SustainabilityService);
  });

  describe('Carbon Avoidance Formulas', () => {
    it('should accurately calculate zero BEV emissions and savings vs 2W petrol baseline', () => {
      const result = service.calculateCarbonSavings(10, '2W');

      expect(result.distanceKm).toBe(10);
      expect(result.bevEmissionsGramsPerKm).toBe(0);
      expect(result.iceBaselineGramsPerKm).toBe(45);
      expect(result.co2SavedGrams).toBe(450);
      expect(result.co2SavedKg).toBe(0.45);
      expect(result.treesEquivalent).toBeGreaterThan(0);
    });

    it('should calculate savings for 3W auto rickshaw baseline', () => {
      const result = service.calculateCarbonSavings(20, '3W');

      expect(result.iceBaselineGramsPerKm).toBe(90);
      expect(result.co2SavedGrams).toBe(1800);
      expect(result.co2SavedKg).toBe(1.8);
    });

    it('should calculate savings for 4W electric taxi vs diesel baseline', () => {
      const result = service.calculateCarbonSavings(50, '4W');

      expect(result.iceBaselineGramsPerKm).toBe(160);
      expect(result.co2SavedGrams).toBe(8000);
      expect(result.co2SavedKg).toBe(8.0);
    });
  });

  describe('Verifiable Green Certificates', () => {
    it('should issue a verifiable green certificate with valid verification URL', async () => {
      const cert = await service.issueGreenCertificate(
        'RIDER',
        'rider-1',
        'Ravi Teja',
      );

      expect(cert.certificateNumber).toContain('ECO-CERT-202611-');
      expect(cert.recipientName).toBe('Ravi Teja');
      expect(cert.recipientType).toBe('RIDER');
      expect(cert.totalGreenTrips).toBe(3);
      expect(cert.verificationUrl).toContain('https://verify.ecoride.in/certs/');
      expect(cert.badgeLevel).toBe('SAPLING');
    });

    it('should verify an existing certificate successfully', async () => {
      const issued = await service.issueGreenCertificate('RIDER', 'rider-1', 'Ravi Teja');
      const verified = await service.verifyCertificate(issued.certificateNumber);

      expect(verified.certificateNumber).toBe(issued.certificateNumber);
      expect(verified.recipientName).toBe('Ravi Teja');
    });

    it('should throw NotFoundException for invalid certificate number', async () => {
      await expect(
        service.verifyCertificate('ECO-CERT-INVALID-9999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Corporate ESG Compliance Reporting', () => {
    it('should generate corporate ESG report with SHA-256 certificate hash and fuel displacement', async () => {
      const report = await service.getCorporateEsgReport(
        'corp-uuid-001',
        'Andhra Pradesh Medtech Zone (AMTZ)',
        '2026-Q4',
      );

      expect(report.companyName).toBe('Andhra Pradesh Medtech Zone (AMTZ)');
      expect(report.reportingPeriod).toBe('2026-Q4');
      expect(report.totalTripsCompleted).toBeGreaterThanOrEqual(50);
      expect(report.totalElectricKm).toBeGreaterThan(0);
      expect(report.totalCo2AvoidedKg).toBeGreaterThan(0);
      expect(report.dieselDisplacedLiters).toBeGreaterThan(0);
      expect(report.petrolDisplacedLiters).toBeGreaterThan(0);
      expect(report.esgCertificateHash).toHaveLength(64); // SHA-256 hex string
    });
  });
});

