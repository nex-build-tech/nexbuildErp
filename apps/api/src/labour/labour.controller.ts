import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LabourService } from './labour.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Controller('labour')
@UseGuards(JwtAuthGuard)
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @Get('attendance')
  async getAttendance(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('date') date?: string,
    @Query('contractorId') contractorId?: string,
    @Query('shift') shift?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const cId = contractorId ? parseInt(contractorId, 10) : undefined;
    const filter = {
      ...(sId !== undefined && { siteId: sId }),
      ...(cId !== undefined && { contractorId: cId }),
      ...(date && { date }),
      ...(shift && { shift }),
    };
    return this.labourService.getAttendance(tenant, filter);
  }

  @Get('summary')
  async getAttendanceSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const filter = {
      ...(sId !== undefined && { siteId: sId }),
      ...(from && { from }),
      ...(to && { to }),
    };
    return this.labourService.getAttendanceSummary(tenant, filter);
  }

  @Post('attendance/bulk')
  async bulkRecordAttendance(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.labourService.bulkRecordAttendance(tenant, user, body);
  }
}
