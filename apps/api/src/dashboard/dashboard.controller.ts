import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get role-aware executive KPI summary & ApexCharts analytics' })
  getExecutiveSummary(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any
  ) {
    return this.dashboardService.getExecutiveSummary(tenant, user);
  }

  @Get('site-costs')
  @ApiOperation({ summary: 'Get site-wise cost allocation breakdown' })
  getSiteCostAllocation(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getSiteCostAllocation(tenant);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent document activities stream' })
  getRecentActivities(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getRecentActivities(tenant);
  }

  @Get('global-search')
  @ApiOperation({ summary: 'Fast global search (< 100ms) for items, vendors, POs, WOs, contractors' })
  globalSearch(
    @CurrentTenant() tenant: TenantContext,
    @Query('q') query: string
  ) {
    return this.dashboardService.globalSearch(tenant, query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit log viewer with before/after diff for Owner & Admin' })
  getAuditLogs(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getAuditLogs(tenant, query);
  }

  // ── REPORTS ───────────────────────────────────────────────────────────────

  @Get('reports/po-register')
  @ApiOperation({ summary: 'PO Register report with filters & GST amounts' })
  getPoRegister(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getPoRegister(tenant, query);
  }

  @Get('reports/grn-register')
  @ApiOperation({ summary: 'GRN Register with challan, invoice & store values' })
  getGrnRegister(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getGrnRegister(tenant, query);
  }

  @Get('reports/stock-summary')
  @ApiOperation({ summary: 'Stock Summary with on-hand qty, weighted avg rate & valuation' })
  getStockSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getStockSummaryReport(tenant, query);
  }

  @Get('reports/stock-ledger')
  @ApiOperation({ summary: 'Perpetual Stock Ledger with chronological double-entry movements' })
  getStockLedger(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getStockLedgerReport(tenant, query);
  }

  @Get('reports/item-movement')
  @ApiOperation({ summary: 'Item movement velocity analysis (Fast / Medium / Slow)' })
  getItemMovement(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getItemMovementReport(tenant, query);
  }

  @Get('reports/site-consumption')
  @ApiOperation({ summary: 'Site material consumption & contractor issues report' })
  getMaterialConsumptionReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getMaterialConsumptionReport(tenant, query);
  }

  @Get('reports/vendor-purchase')
  @ApiOperation({ summary: 'Vendor-wise purchase spend & GST tax analysis' })
  getVendorPurchase(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getVendorPurchaseReport(tenant, query);
  }

  @Get('reports/gst-input-summary')
  @ApiOperation({ summary: 'GST Input Tax Credit (ITC) rate-wise summary (0, 5, 12, 18, 28%)' })
  getGstInputSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getGstInputSummaryReport(tenant, query);
  }

  @Get('reports/stock-ageing')
  @ApiOperation({ summary: 'Stock Ageing analysis (0-30, 31-60, 61-90, 90+ days)' })
  getStockAgeing(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.dashboardService.getStockAgeingReport(tenant, query);
  }

  @Get('reports/tds-register')
  @ApiOperation({ summary: 'Contractor TDS Register under Section 194C (Form 26Q)' })
  getTdsRegisterReport(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getTdsRegisterReport(tenant);
  }

  @Get('reports/retention-ledger')
  @ApiOperation({ summary: 'Contractor retention money liability ledger' })
  getRetentionLedgerReport(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getRetentionLedgerReport(tenant);
  }
}
