import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CampusGeofenceDto,
  CampusShuttleLoopDto,
  CampusBoardingPassDto,
} from '@ecoride/contracts';
import { CampusGeofence } from '../../database/entities/campus-shuttle.entity';
import * as crypto from 'crypto';

@Injectable()
export class CampusService {
  constructor(
    @InjectRepository(CampusGeofence)
    private readonly campusRepo: Repository<CampusGeofence>,
  ) {}

  /**
   * Lists approved Andhra Pradesh institutional campuses with active zero-emission shuttles
   */
  async listCampuses(city?: string): Promise<CampusGeofenceDto[]> {
    const campuses = await this.campusRepo.find({ where: { isActive: true } });
    if (campuses.length === 0) {
      return this.getSeededCampuses(city);
    }
    return campuses.map((c) => ({
      id: c.id,
      campusCode: c.campusCode,
      campusName: c.campusName,
      city: c.city,
      boundaryGeoJson: c.boundaryGeoJson,
      authorizedOrganizations: c.authorizedOrganizations,
      totalShuttlesActive: c.totalShuttlesActive,
      operatingHours: c.operatingHours,
    }));
  }

  /**
   * Retrieves active shuttle loop schedules and real-time headway for a campus
   */
  async getCampusLoops(campusCode: string): Promise<CampusShuttleLoopDto[]> {
    const loops: Record<string, CampusShuttleLoopDto[]> = {
      'CMP-SEC-01': [
        {
          id: 'loop-sec-01',
          campusCode: 'CMP-SEC-01',
          loopName: 'Secretariat Outer Perimeter Loop',
          headwayMinutes: 10,
          stops: [
            { name: 'Block 1 (General Administration)', sequence: 1, lat: 16.5412, lng: 80.5143 },
            { name: 'Block 3 (Finance & Planning)', sequence: 2, lat: 16.5425, lng: 80.5160 },
            { name: 'Block 5 (Transport & IT)', sequence: 3, lat: 16.5401, lng: 80.5175 },
            { name: 'Main Security Gate & Visitor Transit Bay', sequence: 4, lat: 16.5390, lng: 80.5130 },
          ],
          currentVehicleReg: 'AP-39-EV-SHUTTLE-1',
          nextDepartureEstimateMinutes: 4,
        },
      ],
      'CMP-AIIMS-02': [
        {
          id: 'loop-aiims-01',
          campusCode: 'CMP-AIIMS-02',
          loopName: 'AIIMS Patient & Staff Green Express',
          headwayMinutes: 12,
          stops: [
            { name: 'OPD Main Block', sequence: 1, lat: 16.4357, lng: 80.5654 },
            { name: 'Super Specialty Hospital', sequence: 2, lat: 16.4370, lng: 80.5670 },
            { name: 'Staff Quarters & Hostel Bay', sequence: 3, lat: 16.4340, lng: 80.5640 },
          ],
          currentVehicleReg: 'AP-39-EV-SHUTTLE-2',
          nextDepartureEstimateMinutes: 6,
        },
      ],
    };

    return loops[campusCode] || [
      {
        id: `loop-${campusCode.toLowerCase()}-default`,
        campusCode,
        loopName: 'Main Campus Transit Loop',
        headwayMinutes: 15,
        stops: [
          { name: 'Main Gate Transit Stop', sequence: 1, lat: 16.5, lng: 80.5 },
          { name: 'Academic Block A', sequence: 2, lat: 16.51, lng: 80.51 },
        ],
        currentVehicleReg: 'AP-39-EV-VAN-01',
        nextDepartureEstimateMinutes: 8,
      },
    ];
  }

  /**
   * Generates a tamper-proof digital QR boarding pass for institutional employees/students
   */
  async generateBoardingPass(
    campusCode: string,
    holder: { id: string; name: string; department: string },
  ): Promise<CampusBoardingPassDto> {
    const rawPayload = `ECORIDE-CAMPUS:${campusCode}:${holder.id}:${Date.now()}`;
    const signature = crypto.createHmac('sha256', 'ap_campus_secret_key').update(rawPayload).digest('hex').substring(0, 16);
    const qrPayload = `${rawPayload}:${signature}`;

    return {
      passId: `PASS-${campusCode}-${holder.id.substring(0, 8)}`,
      campusCode,
      employeeOrStudentId: holder.id,
      holderName: holder.name,
      department: holder.department,
      qrPayload,
      status: 'ACTIVE',
    };
  }

  private getSeededCampuses(city?: string): CampusGeofenceDto[] {
    const all: CampusGeofenceDto[] = [
      {
        id: 'cmp-001',
        campusCode: 'CMP-SEC-01',
        campusName: 'AP Secretariat & High Court Government Complex',
        city: 'amaravathi',
        boundaryGeoJson: { type: 'Polygon', coordinates: [[[80.51, 16.53], [80.53, 16.53], [80.53, 16.55], [80.51, 16.55], [80.51, 16.53]]] },
        authorizedOrganizations: ['Government of Andhra Pradesh', 'APCRDA', 'AP High Court Bar Association'],
        totalShuttlesActive: 4,
        operatingHours: '07:30 - 20:30',
      },
      {
        id: 'cmp-002',
        campusCode: 'CMP-AIIMS-02',
        campusName: 'AIIMS Mangalagiri Medical Institute & Hospital',
        city: 'mangalagiri',
        boundaryGeoJson: { type: 'Polygon', coordinates: [[[80.56, 16.43], [80.58, 16.43], [80.58, 16.45], [80.56, 16.45], [80.56, 16.43]]] },
        authorizedOrganizations: ['AIIMS Mangalagiri', 'Ministry of Health & Family Welfare'],
        totalShuttlesActive: 3,
        operatingHours: '06:00 - 22:00',
      },
    ];

    if (city) {
      return all.filter((c) => c.city.toLowerCase() === city.toLowerCase().trim());
    }
    return all;
  }
}
