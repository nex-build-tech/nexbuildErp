import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RealtyReportsService, ReportFilterDto } from './realty-reports.service';

interface AuthenticatedRequest {
  user: {
    tenantId: number;
    userId: number;
    email: string;
    roles?: string[];
  };
}

@ApiTags('realty-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RequireModuleGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/reports')
export class RealtyReportsController {
  constructor(private readonly reportsService: RealtyReportsService) {}

  @Get('collection')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Collection Report with mode breakdown and net receipts' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getCollectionReport(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    const filters: ReportFilterDto = {
      siteId: siteId ? Number(siteId) : undefined,
      fromDate,
      toDate,
      status,
    };
    return this.reportsService.getCollectionReport(req.user.tenantId, filters);
  }

  @Get('outstanding-ageing')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Outstanding & Aging Report with 30-60-90+ days aging buckets' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getOutstandingAging(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getOutstandingAgingReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }

  @Get('demand-vs-collection')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Demand vs Collection Report grouped by construction stages' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getDemandVsCollection(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getDemandVsCollectionReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }

  @Get('receipt-register')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Receipt Register audit log' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getReceiptRegister(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getReceiptRegister(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
      fromDate,
      toDate,
      status,
    });
  }

  @Get('flat-status')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Flat Status and unit financial register' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  @ApiQuery({ name: 'wingId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getFlatStatus(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
    @Query('wingId') wingId?: number,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getFlatStatusRegister(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
      wingId: wingId ? Number(wingId) : undefined,
      status,
    });
  }

  @Get('customer-directory')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Customer Directory & contacts' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getCustomerDirectory(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getCustomerDirectory(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }

  @Get('tds-reconciliation')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Section 194-IA TDS reconciliation report for properties >= 50L' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getTdsReconciliation(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getTdsReconciliationReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }

  @Get('gst-summary')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'GST tax summary report' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async getGstSummary(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getGstReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
      fromDate,
      toDate,
    });
  }

  @Get('cancellations')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Cancellations and forfeiture audit report' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getCancellations(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getCancellationsReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }

  @Get('parking-inventory')
  @Permissions('realty.report.view')
  @ApiOperation({ summary: 'Parking inventory and allotment report' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getParkingInventory(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
  ) {
    return this.reportsService.getParkingInventoryReport(req.user.tenantId, {
      siteId: siteId ? Number(siteId) : undefined,
    });
  }
}
