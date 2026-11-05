import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { HubSpokeFreightService } from '../src/modules/hub-spoke/hub-spoke-freight.service';
import { HubSpokeFreightController } from '../src/modules/hub-spoke/hub-spoke-freight.controller';
import { FreightManifest } from '../src/database/entities/freight-manifest.entity';
import { FreightManifestStatus } from '@ecoride/contracts';

describe('HubSpokeFreightService (M45)', () => {
  let service: HubSpokeFreightService;
  let mockManifestRepo: any;

  beforeEach(async () => {
    mockManifestRepo = {
      create: jest.fn((e) => ({ ...e, id: 'mnf-123' })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubSpokeFreightController],
      providers: [
        HubSpokeFreightService,
        { provide: getRepositoryToken(FreightManifest), useValue: mockManifestRepo },
      ],
    }).compile();

    service = module.get<HubSpokeFreightService>(HubSpokeFreightService);
  });

  it('should generate freight manifest within vehicle payload rating', async () => {
    const manifest = await service.createManifest({
      originHubCode: 'VJA_AUTONAGAR',
      destinationHubCode: 'GNT_MIRCHI_YARD',
      vehicleRegistrationNumber: 'AP16EV5555',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      payloadCapacityKg: 1000.0,
      consignments: [
        {
          consignmentNumber: 'CN-001',
          senderName: 'Amaravathi Spices',
          receiverName: 'Guntur Exporters',
          weightKg: 400.0,
          volumeCubicFeet: 60.0,
          declaredValuePaise: 5000000,
          destinationHubId: 'hub-gnt',
        },
        {
          consignmentNumber: 'CN-002',
          senderName: 'Krishna Textiles',
          receiverName: 'Brodipet Retailers',
          weightKg: 350.0,
          volumeCubicFeet: 50.0,
          declaredValuePaise: 3000000,
          destinationHubId: 'hub-gnt',
        },
      ],
    });

    expect(manifest.manifestNumber).toContain('MNF-VJA_AUTONAGAR-GNT_MIRCHI_YARD-');
    expect(manifest.grossWeightKg).toBe(750.0);
    expect(manifest.status).toBe(FreightManifestStatus.PLANNED);
  });

  it('should reject manifest creation when aggregate weight exceeds certified payload capacity', async () => {
    await expect(
      service.createManifest({
        originHubCode: 'VJA_AUTONAGAR',
        destinationHubCode: 'GNT_MIRCHI_YARD',
        vehicleRegistrationNumber: 'AP16EV5555',
        captainId: 'c0000000-0000-4000-8000-000000000001',
        payloadCapacityKg: 500.0, // Only 500kg
        consignments: [
          {
            consignmentNumber: 'CN-001',
            senderName: 'Heavy Machinery Co',
            receiverName: 'Guntur Industrial Hub',
            weightKg: 850.0, // Exceeds 500kg
            volumeCubicFeet: 80.0,
            declaredValuePaise: 8000000,
            destinationHubId: 'hub-gnt',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should verify tare and gross weighbridge check and advance status to IN_TRANSIT', async () => {
    mockManifestRepo.findOne.mockResolvedValueOnce({
      id: 'mnf-123',
      manifestNumber: 'MNF-TEST-01',
      payloadCapacityKg: 1000.0,
      status: FreightManifestStatus.PLANNED,
    });

    const updated = await service.recordWeighbridgeCheck('MNF-TEST-01', 1200.0, 2100.0); // 900kg net payload (<= 1000kg)
    expect(updated.status).toBe(FreightManifestStatus.IN_TRANSIT);
    expect(updated.weighbridgeTareWeightKg).toBe(1200.0);
    expect(updated.weighbridgeGrossWeightKg).toBe(2100.0);
  });
});

