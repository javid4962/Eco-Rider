import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { FreightManifestHashService } from '../src/modules/freight-manifest-hash/freight-manifest-hash.service';
import { FreightManifestHashController } from '../src/modules/freight-manifest-hash/freight-manifest-hash.controller';
import { FreightManifestHashRecordEntity } from '../src/database/entities/freight-manifest-hash-record.entity';

describe('FreightManifestHashModule', () => {
  let service: FreightManifestHashService;
  let controller: FreightManifestHashController;

  const mockRecord: Partial<FreightManifestHashRecordEntity> = {
    id: 'mock-freight-uuid',
    manifestId: 'MNF-AP-2026-001',
    consignorGstin: '37AAAAA0000A1Z5',
    consigneeGstin: '37BBBBB1111B2Z6',
    originHub: 'Vijayawada Logistics Park',
    destinationHub: 'Guntur Mirchi Yard',
    vehicleId: 'EV-CARGO-AP37-9901',
    totalWeightKg: 1250,
    itemCount: 2,
    batterySoCStartPct: 92,
    merkleRootHash: 'a'.repeat(64),
    cryptographicSignature: 'b'.repeat(64),
    anchoredAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-freight-uuid',
      anchoredAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { manifestId } }) => {
      if (manifestId === 'MNF-AP-2026-001') {
        return mockRecord;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FreightManifestHashController],
      providers: [
        FreightManifestHashService,
        {
          provide: getRepositoryToken(FreightManifestHashRecordEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FreightManifestHashService>(FreightManifestHashService);
    controller = module.get<FreightManifestHashController>(FreightManifestHashController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should anchor valid EV cargo freight manifest with cryptographic merkle hash', async () => {
    const result = await controller.anchorManifest({
      manifestId: 'MNF-AP-2026-001',
      consignorGstin: '37AAAAA0000A1Z5',
      consigneeGstin: '37BBBBB1111B2Z6',
      originHub: 'Vijayawada Logistics Park',
      destinationHub: 'Guntur Mirchi Yard',
      vehicleId: 'EV-CARGO-AP37-9901',
      propulsionType: 'BATTERY_ELECTRIC',
      items: [
        { sku: 'AGRI-CHILLI-01', description: 'Guntur Dry Red Chillies', quantity: 50, weightKg: 1000 },
        { sku: 'SPICE-TURMERIC-02', description: 'Duggirala Turmeric', quantity: 10, weightKg: 250 },
      ],
      batterySoCStartPct: 92,
      estimatedKwhConsumption: 42.5,
      ewayBillNumber: '371099887766',
    });

    expect(result.merkleRootHash).toBeDefined();
    expect(result.cryptographicSignature).toBeDefined();
    expect(result.totalWeightKg).toBe(1250);
  });

  it('should reject non-electric propulsion with PROPULSION_NON_ELECTRIC error', async () => {
    await expect(
      service.anchorManifest({
        manifestId: 'MNF-DIESEL-FAIL',
        consignorGstin: '37AAAAA0000A1Z5',
        consigneeGstin: '37BBBBB1111B2Z6',
        originHub: 'Vijayawada',
        destinationHub: 'Guntur',
        vehicleId: 'DIESEL-TRUCK-01',
        propulsionType: 'DIESEL' as any,
        items: [{ sku: 'SKU1', description: 'Cargo', quantity: 1, weightKg: 100 }],
        batterySoCStartPct: 0,
        estimatedKwhConsumption: 0,
        ewayBillNumber: '371099887766',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should verify an existing anchored manifest successfully', async () => {
    const res = await controller.verifyManifest('MNF-AP-2026-001');
    expect(res.isValid).toBe(true);
    expect(res.manifestId).toBe('MNF-AP-2026-001');
  });
});
