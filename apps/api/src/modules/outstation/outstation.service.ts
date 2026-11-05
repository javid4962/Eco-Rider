import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OutstationRouteDto,
  OutstationBookingRequestDto,
  OutstationTripDto,
} from '@ecoride/contracts';
import { OutstationRoute } from '../../database/entities/outstation-route.entity';
import { OutstationTrip } from '../../database/entities/outstation-trip.entity';

@Injectable()
export class OutstationService {
  constructor(
    @InjectRepository(OutstationRoute)
    private readonly routeRepo: Repository<OutstationRoute>,
    @InjectRepository(OutstationTrip)
    private readonly tripRepo: Repository<OutstationTrip>,
  ) {}

  /**
   * Lists approved outstation inter-city electric corridors
   */
  async listRoutes(): Promise<OutstationRouteDto[]> {
    const routes = await this.routeRepo.find({ where: { isActive: true } });
    if (routes.length === 0) {
      return this.getSeededRoutes();
    }
    return routes.map((r) => ({
      id: r.id,
      routeCode: r.routeCode,
      originCity: r.originCity,
      destinationCity: r.destinationCity,
      distanceKm: Number(r.distanceKm),
      estimatedTransitMinutes: r.estimatedTransitMinutes,
      baseFarePaise: r.baseFarePaise,
      tollEstimatePaise: r.tollEstimatePaise,
      requiredMinSocPercent: Number(r.requiredMinSocPercent),
      mandatoryChargingStopName: r.mandatoryChargingStopName || undefined,
      mandatoryChargingStopKm: r.mandatoryChargingStopKm ? Number(r.mandatoryChargingStopKm) : undefined,
      isActive: r.isActive,
    }));
  }

  /**
   * Books an inter-city outstation EV express journey
   */
  async bookTrip(riderId: string, dto: OutstationBookingRequestDto): Promise<OutstationTripDto> {
    let route = await this.routeRepo.findOne({ where: { id: dto.routeId } });
    if (!route) {
      const seeded = this.getSeededRoutes().find((r) => r.id === dto.routeId || r.routeCode === dto.routeId);
      if (!seeded) {
        throw new NotFoundException(`Outstation route '${dto.routeId}' not found.`);
      }
      route = {
        id: seeded.id,
        routeCode: seeded.routeCode,
        originCity: seeded.originCity,
        destinationCity: seeded.destinationCity,
        distanceKm: seeded.distanceKm,
        estimatedTransitMinutes: seeded.estimatedTransitMinutes,
        baseFarePaise: seeded.baseFarePaise,
        tollEstimatePaise: seeded.tollEstimatePaise,
        requiredMinSocPercent: seeded.requiredMinSocPercent,
        mandatoryChargingStopName: seeded.mandatoryChargingStopName || null,
        mandatoryChargingStopKm: seeded.mandatoryChargingStopKm || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (dto.passengerCount > 6) {
      throw new BadRequestException('Outstation electric journeys are capped at 6 passengers per vehicle.');
    }

    const tollPaise = dto.fastagTollIncluded ? route.tollEstimatePaise : 0;
    const totalFarePaise = route.baseFarePaise + tollPaise;

    const trip = this.tripRepo.create({
      routeId: route.id,
      riderId,
      pickupAddress: dto.pickupAddress,
      dropoffAddress: dto.dropoffAddress,
      departureTime: new Date(dto.departureTime),
      passengerCount: dto.passengerCount,
      farePaise: route.baseFarePaise,
      tollPaise,
      totalFarePaise,
      status: 'REQUESTED',
    });

    const saved = await this.tripRepo.save(trip);

    return {
      bookingId: saved.id,
      routeCode: route.routeCode,
      originCity: route.originCity,
      destinationCity: route.destinationCity,
      totalFarePaise: saved.totalFarePaise,
      tollFeePaise: saved.tollPaise,
      formattedTotalFare: `₹${(saved.totalFarePaise / 100).toFixed(2)}`,
      plannedChargingStop: route.mandatoryChargingStopName || undefined,
      departureTime: saved.departureTime.toISOString(),
      status: 'REQUESTED',
    };
  }

  private getSeededRoutes(): OutstationRouteDto[] {
    return [
      {
        id: 'rt-vja-gnt-01',
        routeCode: 'VJA-GNT-EXPRESS',
        originCity: 'Vijayawada',
        destinationCity: 'Guntur',
        distanceKm: 36.5,
        estimatedTransitMinutes: 45,
        baseFarePaise: 85000, // ₹850.00
        tollEstimatePaise: 11000, // ₹110.00 Kaza Toll Plaza
        requiredMinSocPercent: 50.0,
        isActive: true,
      },
      {
        id: 'rt-vja-mpt-02',
        routeCode: 'VJA-MPT-CORRIDOR',
        originCity: 'Vijayawada',
        destinationCity: 'Machilipatnam',
        distanceKm: 72.0,
        estimatedTransitMinutes: 90,
        baseFarePaise: 165000, // ₹1,650.00
        tollEstimatePaise: 16000, // ₹160.00 Pamarru Toll
        requiredMinSocPercent: 75.0,
        mandatoryChargingStopName: 'Pamarru Highway DC Fast Charger (KM 42)',
        mandatoryChargingStopKm: 42.0,
        isActive: true,
      },
      {
        id: 'rt-vja-amv-03',
        routeCode: 'VJA-AMV-CAPITAL',
        originCity: 'Vijayawada',
        destinationCity: 'Amaravathi Secretariat',
        distanceKm: 28.0,
        estimatedTransitMinutes: 35,
        baseFarePaise: 65000, // ₹650.00
        tollEstimatePaise: 0, // Zero tolls via Prakasam Barrage / Seed Access Road
        requiredMinSocPercent: 40.0,
        isActive: true,
      },
    ];
  }
}

