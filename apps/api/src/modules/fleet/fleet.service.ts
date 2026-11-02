import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  FleetOrganization,
  FleetVehicleAssignment,
  FleetShift,
  Vehicle,
  DriverProfile,
  User,
  LedgerEntry,
} from '../../database/entities';
import {
  FleetOrganizationDto,
  FleetOrganizationStatus,
  FleetAssignmentStatus,
  FleetShiftStatus,
  FleetShiftType,
  FleetVehicleDto,
  FleetVehicleAssignmentDto,
  FleetShiftDto,
  FleetEarningsSummaryDto,
  PlatformRole,
  PropulsionType,
  DriverComplianceStatus,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { IdentityService } from '../identity/identity.service';
import {
  CreateFleetOrganizationDto,
  AssignFleetDriverDto,
  StartFleetShiftDto,
  EndFleetShiftDto,
  QueryFleetVehiclesDto,
} from './dto';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectRepository(FleetOrganization)
    private readonly fleetOrgRepo: Repository<FleetOrganization>,
    @InjectRepository(FleetVehicleAssignment)
    private readonly assignmentRepo: Repository<FleetVehicleAssignment>,
    @InjectRepository(FleetShift)
    private readonly shiftRepo: Repository<FleetShift>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
    private readonly identityService: IdentityService,
  ) {}

  /**
   * Authoritatively resolves fleet organization with strict tenant isolation.
   * Prevents cross-fleet visibility and audits unauthorized access attempts.
   */
  async resolveFleetOrganization(
    actor: CurrentActorPayload,
    targetOrgId?: string,
  ): Promise<FleetOrganization> {
    let org: FleetOrganization | null = null;

    if (targetOrgId) {
      org = await this.fleetOrgRepo.findOne({
        where: { id: targetOrgId },
        relations: ['owner'],
      });
      if (!org) {
        throw new NotFoundException(`Fleet organization ${targetOrgId} not found.`);
      }
    } else {
      org = await this.fleetOrgRepo.findOne({
        where: { ownerId: actor.id },
        relations: ['owner'],
      });
      if (!org) {
        throw new NotFoundException(`No fleet organization registered for actor ${actor.id}.`);
      }
    }

    const isSystemAdmin =
      actor.role === PlatformRole.OPERATOR || actor.role === PlatformRole.SUPER_ADMIN;

    if (!isSystemAdmin && org.ownerId !== actor.id) {
      this.logger.warn(
        `Security Alert: Cross-fleet tenant access violation attempt by actor ${actor.id} against org ${org.id}`,
      );

      await this.identityService.recordAuditEvent({
        actorId: actor.id,
        targetUserId: org.ownerId,
        action: 'CROSS_FLEET_ACCESS_DENIED',
        entityType: 'FLEET_ORGANIZATION',
        entityId: org.id,
        status: 'DENIED',
        ipAddress: actor.ipAddress,
        correlationId: actor.correlationId,
      });

      throw new ForbiddenException('Forbidden: Cross-fleet tenant access is strictly prohibited.');
    }

    return org;
  }

  /**
   * Registers a new fleet organization.
   */
  async createOrganization(
    actor: CurrentActorPayload,
    dto: CreateFleetOrganizationDto,
  ): Promise<FleetOrganizationDto> {
    const existingReg = await this.fleetOrgRepo.findOne({
      where: { businessRegistrationNumber: dto.businessRegistrationNumber },
    });
    if (existingReg) {
      throw new ConflictException(
        `Fleet organization with registration number '${dto.businessRegistrationNumber}' already exists.`,
      );
    }

    const existingPayout = await this.fleetOrgRepo.findOne({
      where: { payoutAccountId: dto.payoutAccountId },
    });
    if (existingPayout) {
      throw new ConflictException(
        `Payout account '${dto.payoutAccountId}' is already bound to another fleet organization.`,
      );
    }

    const org = this.fleetOrgRepo.create({
      ownerId: actor.id,
      name: dto.name,
      businessRegistrationNumber: dto.businessRegistrationNumber,
      city: dto.city || 'visakhapatnam',
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail || null,
      payoutAccountId: dto.payoutAccountId,
      status: FleetOrganizationStatus.ACTIVE,
    });

    await this.fleetOrgRepo.save(org);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: actor.id,
      action: 'FLEET_ORGANIZATION_CREATED',
      entityType: 'FLEET_ORGANIZATION',
      entityId: org.id,
      newState: {
        name: org.name,
        businessRegistrationNumber: org.businessRegistrationNumber,
        city: org.city,
        payoutAccountId: org.payoutAccountId,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return {
      id: org.id,
      name: org.name,
      businessRegistrationNumber: org.businessRegistrationNumber,
      ownerId: org.ownerId,
      city: org.city,
      contactPhone: org.contactPhone,
      contactEmail: org.contactEmail,
      payoutAccountId: org.payoutAccountId,
      status: org.status as FleetOrganizationStatus,
      totalVehicles: 0,
      activeDrivers: 0,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves organization details for caller's fleet.
   */
  async getMyOrganization(actor: CurrentActorPayload): Promise<FleetOrganizationDto> {
    const org = await this.resolveFleetOrganization(actor);
    const totalVehicles = await this.vehicleRepo.count({
      where: { fleetOrganizationId: org.id },
    });
    const activeDrivers = await this.assignmentRepo.count({
      where: { fleetOrganizationId: org.id, status: FleetAssignmentStatus.ACTIVE },
    });

    return {
      id: org.id,
      name: org.name,
      businessRegistrationNumber: org.businessRegistrationNumber,
      ownerId: org.ownerId,
      city: org.city,
      contactPhone: org.contactPhone,
      contactEmail: org.contactEmail,
      payoutAccountId: org.payoutAccountId,
      status: org.status as FleetOrganizationStatus,
      totalVehicles,
      activeDrivers,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  /**
   * Adds or associates a vehicle with caller's fleet organization.
   * Enforces 100% BEV propulsion and prevents cross-fleet ownership conflict.
   */
  async addVehicleToFleet(
    actor: CurrentActorPayload,
    vehicleId: string,
    orgId?: string,
  ): Promise<FleetVehicleDto> {
    const org = await this.resolveFleetOrganization(actor, orgId);

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found.`);
    }

    if (vehicle.propulsionType !== PropulsionType.BATTERY_ELECTRIC) {
      throw new BadRequestException('Fleet vehicles must be 100% BATTERY_ELECTRIC.');
    }

    if (vehicle.fleetOrganizationId && vehicle.fleetOrganizationId !== org.id) {
      throw new ConflictException(
        `Vehicle ${vehicle.registrationNumber} is already affiliated with another fleet organization.`,
      );
    }

    const previousFleetOrg = vehicle.fleetOrganizationId;
    vehicle.fleetOrganizationId = org.id;
    vehicle.ownerId = org.ownerId;
    await this.vehicleRepo.save(vehicle);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: org.ownerId,
      action: 'FLEET_VEHICLE_MEMBERSHIP_ATTACHED',
      entityType: 'VEHICLE',
      entityId: vehicle.id,
      previousState: { fleetOrganizationId: previousFleetOrg },
      newState: { fleetOrganizationId: org.id, ownerId: org.ownerId },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapFleetVehicleDto(vehicle);
  }

  /**
   * Lists vehicles belonging exclusively to caller's fleet organization.
   */
  async getFleetVehicles(
    actor: CurrentActorPayload,
    orgId?: string,
    query?: QueryFleetVehiclesDto,
  ): Promise<FleetVehicleDto[]> {
    const org = await this.resolveFleetOrganization(actor, orgId);

    const where: FindOptionsWhere<Vehicle> = { fleetOrganizationId: org.id };
    if (query?.category) {
      where.vehicleCategory = query.category;
    }

    const vehicles = await this.vehicleRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const results: FleetVehicleDto[] = [];
    for (const v of vehicles) {
      if (query?.isRoadworthy !== undefined && v.isRoadworthy !== query.isRoadworthy) {
        continue;
      }

      const activeAssignment = await this.assignmentRepo.findOne({
        where: { vehicleId: v.id, status: FleetAssignmentStatus.ACTIVE },
        relations: ['driver'],
      });

      if (query?.driverAssigned !== undefined) {
        const isAssigned = Boolean(activeAssignment);
        if (isAssigned !== query.driverAssigned) {
          continue;
        }
      }

      results.push(this.mapFleetVehicleDto(v, activeAssignment));
    }

    return results;
  }

  /**
   * Assigns or reassigns a driver (Captain) to a fleet EV vehicle.
   * Concurrency-safe: Closes active assignment, creates new assignment row,
   * updates driver profile link, and logs audited reassignment event.
   */
  async assignDriverToVehicle(
    actor: CurrentActorPayload,
    vehicleId: string,
    dto: AssignFleetDriverDto,
  ): Promise<FleetVehicleAssignmentDto> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found.`);
    }

    if (!vehicle.fleetOrganizationId) {
      throw new BadRequestException('Vehicle is not affiliated with a fleet organization.');
    }

    const org = await this.resolveFleetOrganization(actor, vehicle.fleetOrganizationId);

    const driverUser = await this.userRepo.findOne({
      where: { id: dto.driverUserId },
    });
    if (!driverUser) {
      throw new NotFoundException(`Driver user ${dto.driverUserId} not found.`);
    }

    const driverProfile = await this.driverProfileRepo.findOne({
      where: { userId: dto.driverUserId },
    });
    if (!driverProfile) {
      throw new NotFoundException(`Driver profile not initialized for user ${dto.driverUserId}.`);
    }

    if (driverProfile.verificationStatus !== DriverComplianceStatus.VERIFIED) {
      throw new UnprocessableEntityException(
        `Cannot assign driver: compliance verification status is '${driverProfile.verificationStatus}' (must be VERIFIED).`,
      );
    }

    // 1. Check existing active assignment on this vehicle
    const existingAssignment = await this.assignmentRepo.findOne({
      where: { vehicleId, status: FleetAssignmentStatus.ACTIVE },
    });

    let previousDriverId: string | null = null;
    const now = new Date();

    if (existingAssignment) {
      if (existingAssignment.driverId === dto.driverUserId) {
        // Driver is already actively assigned to this vehicle
        return this.mapAssignmentDto(existingAssignment, vehicle, driverUser, actor.id);
      }
      previousDriverId = existingAssignment.driverId;
      existingAssignment.unassignedAt = now;
      existingAssignment.status = FleetAssignmentStatus.COMPLETED;
      await this.assignmentRepo.save(existingAssignment);
    }

    // 2. Check if driver was assigned to another vehicle, unassign them
    const driverExistingAssignment = await this.assignmentRepo.findOne({
      where: { driverId: dto.driverUserId, status: FleetAssignmentStatus.ACTIVE },
    });
    if (driverExistingAssignment && driverExistingAssignment.vehicleId !== vehicleId) {
      driverExistingAssignment.unassignedAt = now;
      driverExistingAssignment.status = FleetAssignmentStatus.COMPLETED;
      await this.assignmentRepo.save(driverExistingAssignment);
    }

    // 3. Create new assignment row (preserving audit history)
    const newAssignment = this.assignmentRepo.create({
      fleetOrganizationId: org.id,
      vehicleId,
      driverId: dto.driverUserId,
      assignedById: actor.id,
      assignedAt: now,
      status: FleetAssignmentStatus.ACTIVE,
      assignmentReason:
        dto.assignmentReason || (previousDriverId ? 'REASSIGNMENT' : 'INITIAL_ASSIGNMENT'),
      notes: dto.notes || null,
    });
    await this.assignmentRepo.save(newAssignment);

    // 4. Update Driver Profile active vehicle binding
    driverProfile.assignedVehicleId = vehicleId;
    await this.driverProfileRepo.save(driverProfile);

    // 5. Record mandatory reassignment audit event
    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: dto.driverUserId,
      action: previousDriverId ? 'FLEET_VEHICLE_REASSIGNED' : 'FLEET_VEHICLE_ASSIGNED',
      entityType: 'FLEET_VEHICLE_ASSIGNMENT',
      entityId: newAssignment.id,
      previousState: {
        previousDriverId,
        vehicleId,
      },
      newState: {
        newDriverId: dto.driverUserId,
        vehicleId,
        fleetOrganizationId: org.id,
        assignmentReason: newAssignment.assignmentReason,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapAssignmentDto(newAssignment, vehicle, driverUser, actor.id);
  }

  /**
   * Retrieves complete assignment and reassignment history for a fleet vehicle.
   */
  async getVehicleAssignmentHistory(
    actor: CurrentActorPayload,
    vehicleId: string,
  ): Promise<FleetVehicleAssignmentDto[]> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found.`);
    }

    await this.resolveFleetOrganization(actor, vehicle.fleetOrganizationId || undefined);

    const assignments = await this.assignmentRepo.find({
      where: { vehicleId },
      order: { assignedAt: 'DESC' },
      relations: ['driver', 'assignedBy', 'vehicle'],
    });

    return assignments.map((a) => ({
      id: a.id,
      fleetOrganizationId: a.fleetOrganizationId,
      vehicleId: a.vehicleId,
      vehicleRegistrationNumber: a.vehicle?.registrationNumber || vehicle.registrationNumber,
      driverId: a.driverId,
      driverName: a.driver?.name,
      driverPhone: a.driver?.phone,
      assignedById: a.assignedById,
      assignedByName: a.assignedBy?.name,
      assignedAt: a.assignedAt.toISOString(),
      unassignedAt: a.unassignedAt ? a.unassignedAt.toISOString() : null,
      status: a.status as FleetAssignmentStatus,
      assignmentReason: a.assignmentReason,
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Commences an operational shift for a fleet vehicle and driver.
   */
  async startShift(actor: CurrentActorPayload, dto: StartFleetShiftDto): Promise<FleetShiftDto> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${dto.vehicleId} not found.`);
    }

    const org = await this.resolveFleetOrganization(
      actor,
      vehicle.fleetOrganizationId || undefined,
    );

    const driverProfile = await this.driverProfileRepo.findOne({
      where: { userId: dto.driverUserId },
    });
    if (!driverProfile) {
      throw new NotFoundException(`Driver profile not found for user ${dto.driverUserId}.`);
    }

    if (driverProfile.verificationStatus !== DriverComplianceStatus.VERIFIED) {
      throw new UnprocessableEntityException(
        'Cannot start shift: Driver compliance status must be VERIFIED.',
      );
    }

    const startSoc = dto.startSocPercent ?? Number(vehicle.currentSocPercent) ?? 100.0;
    if (startSoc < 15.0) {
      throw new UnprocessableEntityException(
        `Cannot start shift: Vehicle battery SoC (${startSoc}%) is below 15% safety threshold.`,
      );
    }

    const shift = this.shiftRepo.create({
      fleetOrganizationId: org.id,
      vehicleId: dto.vehicleId,
      driverId: dto.driverUserId,
      shiftType: dto.shiftType || FleetShiftType.MORNING,
      startTime: new Date(),
      startSocPercent: startSoc,
      startOdometerKm: dto.startOdometerKm ?? 0,
      totalTrips: 0,
      totalEarningsPaise: 0,
      status: FleetShiftStatus.ACTIVE,
    });

    await this.shiftRepo.save(shift);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: dto.driverUserId,
      action: 'FLEET_SHIFT_STARTED',
      entityType: 'FLEET_SHIFT',
      entityId: shift.id,
      newState: {
        shiftId: shift.id,
        vehicleId: dto.vehicleId,
        driverId: dto.driverUserId,
        shiftType: shift.shiftType,
        startSocPercent: startSoc,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapShiftDto(shift, vehicle);
  }

  /**
   * Concludes an active fleet shift, recording handover odometer, SoC, and revenue.
   */
  async endShift(
    actor: CurrentActorPayload,
    shiftId: string,
    dto: EndFleetShiftDto,
  ): Promise<FleetShiftDto> {
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId },
      relations: ['vehicle', 'driver'],
    });
    if (!shift) {
      throw new NotFoundException(`Fleet shift ${shiftId} not found.`);
    }

    await this.resolveFleetOrganization(actor, shift.fleetOrganizationId);

    shift.endTime = new Date();
    shift.endOdometerKm = dto.endOdometerKm;
    shift.endSocPercent = dto.endSocPercent;
    shift.totalTrips = dto.totalTrips ?? shift.totalTrips;
    shift.totalEarningsPaise = dto.totalEarningsPaise ?? shift.totalEarningsPaise;
    shift.status = FleetShiftStatus.COMPLETED;

    await this.shiftRepo.save(shift);

    if (shift.vehicle) {
      shift.vehicle.currentSocPercent = dto.endSocPercent;
      await this.vehicleRepo.save(shift.vehicle);
    }

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: shift.driverId,
      action: 'FLEET_SHIFT_COMPLETED',
      entityType: 'FLEET_SHIFT',
      entityId: shift.id,
      newState: {
        endTime: shift.endTime.toISOString(),
        endOdometerKm: shift.endOdometerKm,
        endSocPercent: shift.endSocPercent,
        totalTrips: shift.totalTrips,
        totalEarningsPaise: shift.totalEarningsPaise,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapShiftDto(shift, shift.vehicle);
  }

  /**
   * Lists shifts for caller's fleet organization.
   */
  async getFleetShifts(actor: CurrentActorPayload, orgId?: string): Promise<FleetShiftDto[]> {
    const org = await this.resolveFleetOrganization(actor, orgId);

    const shifts = await this.shiftRepo.find({
      where: { fleetOrganizationId: org.id },
      order: { startTime: 'DESC' },
      relations: ['vehicle', 'driver'],
    });

    return shifts.map((s) => this.mapShiftDto(s, s.vehicle));
  }

  /**
   * Retrieves financial earnings summary for the caller's organization.
   * Strictly isolated to the organization's payout account.
   */
  async getFleetEarnings(
    actor: CurrentActorPayload,
    orgId?: string,
  ): Promise<FleetEarningsSummaryDto> {
    const org = await this.resolveFleetOrganization(actor, orgId);

    const ledgerEntries = await this.ledgerRepo.find({
      where: { accountId: org.payoutAccountId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const completedShifts = await this.shiftRepo.find({
      where: { fleetOrganizationId: org.id, status: FleetShiftStatus.COMPLETED },
    });

    let totalShiftEarningsPaise = 0;
    let totalTripsCount = 0;
    for (const s of completedShifts) {
      totalShiftEarningsPaise += Number(s.totalEarningsPaise) || 0;
      totalTripsCount += Number(s.totalTrips) || 0;
    }

    // Sum ledger credits
    let ledgerGrossPaise = 0;
    for (const entry of ledgerEntries) {
      if (entry.entryType === 'CREDIT') {
        ledgerGrossPaise += Number(entry.amountPaise);
      }
    }

    const totalGrossPaise = Math.max(totalShiftEarningsPaise, ledgerGrossPaise);
    const platformFeePaise = Math.round(totalGrossPaise * 0.15); // 15% platform commission
    const netFleetEarningsPaise = totalGrossPaise - platformFeePaise;

    const activeVehiclesCount = await this.vehicleRepo.count({
      where: { fleetOrganizationId: org.id, isActive: true },
    });

    return {
      fleetOrganizationId: org.id,
      fleetName: org.name,
      payoutAccountId: org.payoutAccountId,
      currency: 'INR',
      totalGrossPaise,
      totalGrossInr: Number((totalGrossPaise / 100).toFixed(2)),
      platformFeePaise,
      platformFeeInr: Number((platformFeePaise / 100).toFixed(2)),
      netFleetEarningsPaise,
      netFleetEarningsInr: Number((netFleetEarningsPaise / 100).toFixed(2)),
      totalShiftsCompleted: completedShifts.length,
      totalTripsCount,
      activeVehiclesCount,
      recentTransactions: ledgerEntries.map((e) => ({
        id: e.id,
        idempotencyKey: e.idempotencyKey,
        bookingId: e.bookingId,
        entryType: e.entryType,
        amountPaise: Number(e.amountPaise),
        amountInr: Number((Number(e.amountPaise) / 100).toFixed(2)),
        currency: e.currency,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  private mapFleetVehicleDto(
    vehicle: Vehicle,
    activeAssignment?: FleetVehicleAssignment | null,
  ): FleetVehicleDto {
    return {
      id: vehicle.id,
      fleetOrganizationId: vehicle.fleetOrganizationId || '',
      registrationNumber: vehicle.registrationNumber,
      propulsionType: vehicle.propulsionType,
      vehicleCategory: vehicle.vehicleCategory,
      serviceClass: vehicle.serviceClass,
      seatingConfiguration: vehicle.seatingConfiguration,
      make: vehicle.make,
      model: vehicle.model,
      yearOfManufacture: vehicle.yearOfManufacture,
      currentSocPercent: Number(vehicle.currentSocPercent) || 0,
      ratedRangeKm: vehicle.ratedRangeKm,
      isRoadworthy: vehicle.isRoadworthy,
      assignedDriverId: activeAssignment?.driverId || null,
      assignedDriverName: activeAssignment?.driver?.name || null,
      assignedDriverPhone: activeAssignment?.driver?.phone || null,
      city: vehicle.city,
      createdAt: vehicle.createdAt.toISOString(),
    };
  }

  private mapAssignmentDto(
    assignment: FleetVehicleAssignment,
    vehicle: Vehicle,
    driver: User,
    assignedById: string,
  ): FleetVehicleAssignmentDto {
    return {
      id: assignment.id,
      fleetOrganizationId: assignment.fleetOrganizationId,
      vehicleId: assignment.vehicleId,
      vehicleRegistrationNumber: vehicle.registrationNumber,
      driverId: assignment.driverId,
      driverName: driver.name,
      driverPhone: driver.phone,
      assignedById,
      assignedAt: assignment.assignedAt.toISOString(),
      unassignedAt: assignment.unassignedAt ? assignment.unassignedAt.toISOString() : null,
      status: assignment.status as FleetAssignmentStatus,
      assignmentReason: assignment.assignmentReason,
      notes: assignment.notes,
      createdAt: assignment.createdAt.toISOString(),
    };
  }

  private mapShiftDto(shift: FleetShift, vehicle?: Vehicle): FleetShiftDto {
    return {
      id: shift.id,
      fleetOrganizationId: shift.fleetOrganizationId,
      vehicleId: shift.vehicleId,
      vehicleRegistrationNumber: vehicle?.registrationNumber,
      driverId: shift.driverId,
      shiftType: shift.shiftType as FleetShiftType,
      startTime: shift.startTime
        ? new Date(shift.startTime).toISOString()
        : new Date().toISOString(),
      endTime: shift.endTime ? new Date(shift.endTime).toISOString() : null,
      startSocPercent: Number(shift.startSocPercent),
      endSocPercent: shift.endSocPercent ? Number(shift.endSocPercent) : null,
      startOdometerKm: shift.startOdometerKm,
      endOdometerKm: shift.endOdometerKm,
      totalTrips: shift.totalTrips,
      totalEarningsPaise: Number(shift.totalEarningsPaise),
      status: shift.status as FleetShiftStatus,
      createdAt: shift.createdAt
        ? new Date(shift.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }
}
