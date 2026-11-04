import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CorporateAccountDto,
  CreateCorporateAccountDto,
  CorporateEmployeeDto,
  RegisterCorporateEmployeeDto,
  CorporateShiftManifestDto,
  CreateShiftManifestDto,
  CorporateMonthlyInvoiceDto,
} from '@ecoride/contracts';

@Controller('corporate')
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateCorporateAccountDto): Promise<CorporateAccountDto> {
    return this.corporateService.createAccount(dto);
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  async registerEmployee(@Body() dto: RegisterCorporateEmployeeDto): Promise<CorporateEmployeeDto> {
    return this.corporateService.registerEmployee(dto);
  }

  @Get('accounts/:id/employees')
  async listEmployees(@Param('id', ParseUUIDPipe) id: string): Promise<CorporateEmployeeDto[]> {
    return this.corporateService.listEmployees(id);
  }

  @Post('manifests')
  @HttpCode(HttpStatus.CREATED)
  async createManifest(
    @Body() dto: CreateShiftManifestDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<CorporateShiftManifestDto> {
    return this.corporateService.createShiftManifest(actor, dto);
  }

  @Post('manifests/:id/board')
  @HttpCode(HttpStatus.OK)
  async boardEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('employeeId') employeeId: string,
    @Body('otp') otp: string,
  ) {
    return this.corporateService.boardEmployee(id, employeeId, otp);
  }

  @Get('accounts/:id/invoices/:month')
  async getMonthlyInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('month') month: string,
  ): Promise<CorporateMonthlyInvoiceDto> {
    return this.corporateService.generateMonthlyInvoice(id, month);
  }
}

