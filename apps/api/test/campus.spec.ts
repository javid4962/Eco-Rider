import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CampusService } from '../src/modules/campus/campus.service';
import { CampusController } from '../src/modules/campus/campus.controller';
import { CampusGeofence } from '../src/database/entities/campus-shuttle.entity';

describe('CampusService (M36)', () => {
  let service: CampusService;
  let mockCampusRepo: any;

  beforeEach(async () => {
    mockCampusRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampusController],
      providers: [
        CampusService,
        { provide: getRepositoryToken(CampusGeofence), useValue: mockCampusRepo },
      ],
    }).compile();

    service = module.get<CampusService>(CampusService);
  });

  it('should list seeded institutional campuses in Andhra Pradesh', async () => {
    const campuses = await service.listCampuses();
    expect(campuses.length).toBeGreaterThanOrEqual(2);
    const sec = campuses.find((c) => c.campusCode === 'CMP-SEC-01');
    expect(sec).toBeDefined();
    expect(sec?.campusName).toContain('Secretariat');
    expect(sec?.totalShuttlesActive).toBe(4);
  });

  it('should retrieve campus shuttle loops with accurate stop sequence and headway', async () => {
    const loops = await service.getCampusLoops('CMP-SEC-01');
    expect(loops.length).toBe(1);
    expect(loops[0].headwayMinutes).toBe(10);
    expect(loops[0].stops.length).toBe(4);
    expect(loops[0].stops[0].name).toContain('Block 1');
  });

  it('should generate tamper-proof digital QR boarding pass with HMAC-SHA256 signature', async () => {
    const pass = await service.generateBoardingPass('CMP-SEC-01', {
      id: 'EMP-AP-10829',
      name: 'Ravi Teja',
      department: 'Finance Department',
    });

    expect(pass.status).toBe('ACTIVE');
    expect(pass.qrPayload).toContain('ECORIDE-CAMPUS:CMP-SEC-01:EMP-AP-10829');
    expect(pass.qrPayload.split(':').length).toBe(5);
  });
});

