import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateAccount } from '../../database/entities/corporate-account.entity';
import { CorporateEmployee } from '../../database/entities/corporate-employee.entity';
import { CorporateShiftManifest } from '../../database/entities/corporate-shift-manifest.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CorporateAccountStatus,
  CorporateAttendanceStatus,
  CorporateAccountDto,
  CreateCorporateAccountDto,
  CorporateEmployeeDto,
  RegisterCorporateEmployeeDto,
  CorporateShiftManifestDto,
  CreateShiftManifestDto,
  CorporateMonthlyInvoiceDto,
  ShiftManifestEmployeeEntryDto,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class CorporateService {
  private readonly logger = new Logger(CorporateService.name);

  constructor(
    @InjectRepository(CorporateAccount)
    private readonly accountRepo: Repository<CorporateAccount>,
    @InjectRepository(CorporateEmployee)
    private readonly employeeRepo: Repository<CorporateEmployee>,
    @InjectRepository(CorporateShiftManifest)
    private readonly manifestRepo: Repository<CorporateShiftManifest>,
  ) {}

  /**
   * EV-110: Register Corporate Employer Account with statutory GSTIN validation.
   */
  async createAccount(dto: CreateCorporateAccountDto): Promise<CorporateAccountDto> {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(dto.gstin)) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Invalid Indian 15-character GSTIN format.',
      });
    }

    const existingGstin = await this.accountRepo.findOne({ where: { gstin: dto.gstin } });
    if (existingGstin) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: `Corporate account with GSTIN '${dto.gstin}' already exists.`,
      });
    }

    const account = this.accountRepo.create({
      companyName: dto.companyName,
      cinOrRegistration: dto.cinOrRegistration,
      gstin: dto.gstin,
      city: dto.city,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      monthlyCreditLimitPaise: dto.monthlyCreditLimitPaise || 5000000, // ₹50,000 credit limit
      currentOutstandingPaise: 0,
      status: CorporateAccountStatus.ACTIVE,
    });

    const saved = await this.accountRepo.save(account);
    this.logger.log(`[CorporateService] Registered corporate account: ${saved.companyName} (${saved.gstin})`);
    return this.toAccountDto(saved);
  }

  /**
   * EV-111: Register corporate employee under employer roster.
   */
  async registerEmployee(dto: RegisterCorporateEmployeeDto): Promise<CorporateEmployeeDto> {
    const account = await this.accountRepo.findOne({ where: { id: dto.corporateAccountId } });
    if (!account) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Corporate account '${dto.corporateAccountId}' not found.`,
      });
    }

    const existing = await this.employeeRepo.findOne({
      where: {
        corporateAccountId: dto.corporateAccountId,
        employeeCode: dto.employeeCode,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: `Employee with code '${dto.employeeCode}' already exists for this employer.`,
      });
    }

    const employee = this.employeeRepo.create({
      corporateAccountId: dto.corporateAccountId,
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      phone: dto.phone,
      department: dto.department,
      workShift: dto.workShift,
      pickupAddress: dto.pickupAddress,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      isActive: true,
    });

    const saved = await this.employeeRepo.save(employee);
    return this.toEmployeeDto(saved);
  }

  /**
   * List employees of a corporate account.
   */
  async listEmployees(accountId: string): Promise<CorporateEmployeeDto[]> {
    const employees = await this.employeeRepo.find({
      where: { corporateAccountId: accountId, isActive: true },
    });
    return employees.map((e) => this.toEmployeeDto(e));
  }

  /**
   * EV-112: Create optimized shift pickup manifest with sequence and boarding OTPs.
   */
  async createShiftManifest(
    actor: CurrentActorPayload | undefined,
    dto: CreateShiftManifestDto,
  ): Promise<CorporateShiftManifestDto> {
    const account = await this.accountRepo.findOne({ where: { id: dto.corporateAccountId } });
    if (!account) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Corporate account '${dto.corporateAccountId}' not found.`,
      });
    }

    if (!dto.employeeIds || dto.employeeIds.length === 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Shift manifest requires at least 1 employee.',
      });
    }

    const employees = await this.employeeRepo.find({
      where: { corporateAccountId: dto.corporateAccountId },
    });

    const selectedEmployees = employees.filter((e) => dto.employeeIds.includes(e.id));
    if (selectedEmployees.length !== dto.employeeIds.length) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Some specified employee IDs do not belong to this corporate account.',
      });
    }

    // Sort employees by pickup latitude to create an optimized directional route
    selectedEmployees.sort((a, b) => a.pickupLatitude - b.pickupLatitude);

    const employeeEntries: ShiftManifestEmployeeEntryDto[] = selectedEmployees.map(
      (emp, idx) => {
        // Generate pseudo-random deterministic 4-digit boarding OTP
        const seed = `${emp.id}_${dto.manifestDate}`;
        const otpNum = Math.abs(this.simpleHash(seed)) % 9000 + 1000;
        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          phone: emp.phone,
          pickupAddress: emp.pickupAddress,
          pickupSequence: idx + 1,
          boardingOtp: otpNum.toString(),
          status: CorporateAttendanceStatus.SCHEDULED,
        };
      },
    );

    const manifest = this.manifestRepo.create({
      corporateAccountId: account.id,
      manifestDate: dto.manifestDate,
      shiftType: dto.shiftType,
      assignedVehicleId: dto.vehicleId,
      assignedCaptainId: dto.captainId,
      employeesData: employeeEntries,
      status: 'SCHEDULED',
    });

    const saved = await this.manifestRepo.save(manifest);
    this.logger.log(
      `[CorporateService] Created shift manifest ${saved.id} for ${account.companyName}: ${employeeEntries.length} employees`,
    );

    return this.toManifestDto(saved, account.companyName);
  }

  /**
   * EV-112: Board employee on corporate shuttle via OTP.
   */
  async boardEmployee(
    manifestId: string,
    employeeId: string,
    boardingOtp: string,
  ): Promise<{ success: boolean; message: string; employeeStatus: CorporateAttendanceStatus }> {
    const manifest = await this.manifestRepo.findOne({ where: { id: manifestId } });
    if (!manifest) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Manifest '${manifestId}' not found.`,
      });
    }

    const entry = manifest.employeesData.find((e) => e.employeeId === employeeId);
    if (!entry) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Employee '${employeeId}' is not rostered on manifest '${manifestId}'.`,
      });
    }

    if (entry.boardingOtp !== boardingOtp.trim()) {
      throw new BadRequestException({
        code: ApiErrorCode.INVALID_START_OTP,
        message: 'Invalid corporate boarding OTP.',
      });
    }

    entry.status = CorporateAttendanceStatus.BOARDED;
    entry.boardedAt = new Date().toISOString();
    manifest.status = 'IN_PROGRESS';

    await this.manifestRepo.save(manifest);

    return {
      success: true,
      message: `Employee ${entry.fullName} boarded successfully.`,
      employeeStatus: CorporateAttendanceStatus.BOARDED,
    };
  }

  /**
   * EV-110: Generate monthly consolidated B2B GST tax invoice for corporate client.
   */
  async generateMonthlyInvoice(
    accountId: string,
    billingMonth: string,
  ): Promise<CorporateMonthlyInvoiceDto> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Corporate account '${accountId}' not found.`,
      });
    }

    const manifests = await this.manifestRepo.find({
      where: { corporateAccountId: accountId },
    });

    let totalTrips = 0;
    for (const m of manifests) {
      totalTrips += m.employeesData.filter((e) => e.status === CorporateAttendanceStatus.BOARDED).length;
    }

    // Rate: ₹150.00 (15000 paise) base corporate seat fare
    const basePerTripPaise = 15000;
    const baseAmountPaise = Math.max(15000, totalTrips * basePerTripPaise);

    // 5% GST (2.5% CGST + 2.5% SGST)
    const totalTaxPaise = Math.round(baseAmountPaise * 0.05);
    const cgstPaise = Math.floor(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    const totalAmountPaise = baseAmountPaise + totalTaxPaise;

    const invoiceNumber = `INV-CORP-AP-${billingMonth}-${account.companyName.substring(0, 4).toUpperCase()}`;

    return {
      invoiceNumber,
      corporateAccountId: account.id,
      companyName: account.companyName,
      corporateGstin: account.gstin,
      billingMonth,
      totalTripsCompleted: totalTrips,
      baseAmountPaise,
      cgstPaise,
      sgstPaise,
      totalTaxPaise,
      totalAmountPaise,
      formattedTotal: `₹${(totalAmountPaise / 100).toFixed(2)}`,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private toAccountDto(account: CorporateAccount): CorporateAccountDto {
    return {
      id: account.id,
      companyName: account.companyName,
      cinOrRegistration: account.cinOrRegistration,
      gstin: account.gstin,
      city: account.city,
      contactEmail: account.contactEmail,
      contactPhone: account.contactPhone,
      monthlyCreditLimitPaise: Number(account.monthlyCreditLimitPaise),
      currentOutstandingPaise: Number(account.currentOutstandingPaise),
      status: account.status as CorporateAccountStatus,
      createdAt: account.createdAt.toISOString(),
    };
  }

  private toEmployeeDto(emp: CorporateEmployee): CorporateEmployeeDto {
    return {
      id: emp.id,
      corporateAccountId: emp.corporateAccountId,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      phone: emp.phone,
      department: emp.department || undefined,
      workShift: emp.workShift as any,
      pickupAddress: emp.pickupAddress,
      pickupLatitude: emp.pickupLatitude,
      pickupLongitude: emp.pickupLongitude,
      isActive: emp.isActive,
    };
  }

  private toManifestDto(
    m: CorporateShiftManifest,
    companyName: string,
  ): CorporateShiftManifestDto {
    const boardedCount = m.employeesData.filter(
      (e) => e.status === CorporateAttendanceStatus.BOARDED,
    ).length;

    return {
      id: m.id,
      corporateAccountId: m.corporateAccountId,
      companyName,
      manifestDate: m.manifestDate,
      shiftType: m.shiftType as any,
      assignedVehicleId: m.assignedVehicleId,
      assignedCaptainId: m.assignedCaptainId,
      totalEmployees: m.employeesData.length,
      boardedCount,
      employees: m.employeesData,
      status: m.status as any,
    };
  }
}

