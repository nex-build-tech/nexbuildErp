import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { SalesHeadGuard } from '../../auth/guards/sales-head.guard';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentTenant, CurrentUser } from '../../auth/decorators/auth.decorators';
import { TenantContext } from '../../common/middleware/tenant.middleware';
import { RealtyInventoryService } from './realty-inventory.service';

@ApiTags('realty-inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireModuleGuard, PermissionsGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/inventory')
export class RealtyInventoryController {
  constructor(private readonly inventoryService: RealtyInventoryService) {}

  // ── 1. INVENTORY GRID & ELEVATION ───────────────────────────────────────────

  @Get('grid')
  @Permissions('realty.inventory.view')
  @ApiOperation({ summary: 'Get visual elevation grid of units for a site/wing' })
  async getGrid(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('wingId') wingId?: string,
    @Query('unitTypeId') unitTypeId?: string,
    @Query('status') status?: string,
    @Query('facing') facing?: string
  ) {
    const sId = Number(siteId) || 1;
    return this.inventoryService.getInventoryGrid(tenant.id, sId, {
      wingId: wingId ? Number(wingId) : undefined,
      unitTypeId: unitTypeId ? Number(unitTypeId) : undefined,
      status: status || undefined,
      facing: facing || undefined,
    });
  }

  // ── 2. UNIT HOLD / BLOCK / RELEASE ACTIONS ───────────────────────────────────

  @Post('units/:id/hold')
  @Permissions('realty.inventory.manage')
  @ApiOperation({ summary: 'Put unit on temporary hold for a prospect lead' })
  async holdUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { leadId?: number; holdHours?: number; remarks?: string }
  ) {
    return this.inventoryService.holdUnit(tenant.id, id, user.id, {
      leadId: dto.leadId !== undefined ? Number(dto.leadId) : undefined,
      holdHours: dto.holdHours !== undefined ? Number(dto.holdHours) : undefined,
      remarks: dto.remarks,
    });
  }

  @Post('units/:id/block')
  @Permissions('realty.inventory.manage')
  @ApiOperation({ summary: 'Block unit for management / investor reservation' })
  async blockUnit(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason?: string; isInvestor?: boolean }
  ) {
    return this.inventoryService.blockUnit(tenant.id, id, {
      reason: dto.reason,
      isInvestor: dto.isInvestor !== undefined ? Boolean(dto.isInvestor) : undefined,
    });
  }

  @Post('units/:id/release')
  @Permissions('realty.inventory.manage')
  @ApiOperation({ summary: 'Release unit back to available status' })
  async releaseUnit(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.inventoryService.releaseUnit(tenant.id, id);
  }

  @Post('cron/release-expired-holds')
  @Permissions('realty.inventory.manage')
  @ApiOperation({ summary: 'Cron: scan and release all expired held units' })
  async releaseExpiredHolds() {
    return this.inventoryService.releaseExpiredHolds();
  }

  // ── 3. PARKING VIEW ────────────────────────────────────────────────────────

  @Get('parking-grid')
  @Permissions('realty.inventory.view')
  @ApiOperation({ summary: 'Get all parking bays and status breakdown' })
  async getParkingGrid(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    const sId = Number(siteId) || 1;
    return this.inventoryService.getParkingGrid(tenant.id, sId);
  }

  // ── 4. COST SHEETS & PRICING ENGINE ────────────────────────────────────────

  @Post('cost-sheets/calculate')
  @Permissions('realty.inventory.view')
  @ApiOperation({ summary: 'Transient cost sheet calculation preview' })
  async calculatePreview(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    dto: {
      siteId: number;
      unitId: number;
      schemeId?: number;
      discountPct?: number;
      flatDiscountAmt?: number;
      parkingSlotId?: number;
    }
  ) {
    return this.inventoryService.previewCostSheetCalculation(tenant.id, {
      siteId: Number(dto.siteId),
      unitId: Number(dto.unitId),
      schemeId: dto.schemeId !== undefined ? Number(dto.schemeId) : undefined,
      discountPct: dto.discountPct !== undefined ? Number(dto.discountPct) : undefined,
      flatDiscountAmt: dto.flatDiscountAmt !== undefined ? Number(dto.flatDiscountAmt) : undefined,
      parkingSlotId: dto.parkingSlotId !== undefined ? Number(dto.parkingSlotId) : undefined,
    });
  }

  @Post('cost-sheets')
  @Permissions('realty.costsheet.create')
  @ApiOperation({ summary: 'Generate and persist a quotation cost sheet' })
  async createCostSheet(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    dto: {
      siteId: number;
      leadId?: number;
      unitId: number;
      schemeId?: number;
      discountPct?: number;
      flatDiscountAmt?: number;
      parkingSlotId?: number;
      validDays?: number;
      remarks?: string;
    }
  ) {
    return this.inventoryService.createCostSheet(tenant.id, user.id, {
      siteId: Number(dto.siteId),
      unitId: Number(dto.unitId),
      leadId: dto.leadId !== undefined ? Number(dto.leadId) : undefined,
      schemeId: dto.schemeId !== undefined ? Number(dto.schemeId) : undefined,
      discountPct: dto.discountPct !== undefined ? Number(dto.discountPct) : undefined,
      flatDiscountAmt: dto.flatDiscountAmt !== undefined ? Number(dto.flatDiscountAmt) : undefined,
      parkingSlotId: dto.parkingSlotId !== undefined ? Number(dto.parkingSlotId) : undefined,
      validDays: dto.validDays !== undefined ? Number(dto.validDays) : undefined,
      remarks: dto.remarks,
    });
  }

  @Get('cost-sheets')
  @Permissions('realty.inventory.view')
  @ApiOperation({ summary: 'List generated cost sheets with filters' })
  async listCostSheets(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('leadId') leadId?: string,
    @Query('unitId') unitId?: string
  ) {
    return this.inventoryService.listCostSheets(tenant.id, {
      siteId: siteId ? Number(siteId) : undefined,
      status: status || undefined,
      leadId: leadId ? Number(leadId) : undefined,
      unitId: unitId ? Number(unitId) : undefined,
    });
  }

  @Get('cost-sheets/:id')
  @Permissions('realty.inventory.view')
  @ApiOperation({ summary: 'Get full cost sheet details and payment milestones' })
  async getCostSheetById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.inventoryService.getCostSheetById(tenant.id, id);
  }

  @Post('cost-sheets/:id/request-approval')
  @Permissions('realty.costsheet.create')
  @ApiOperation({ summary: 'Submit cost sheet for discount approval' })
  async requestApproval(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks?: string }
  ) {
    return this.inventoryService.requestCostSheetApproval(
      tenant.id,
      id,
      body?.remarks
    );
  }

  @Post('cost-sheets/:id/approve')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.costsheet.approve')
  @ApiOperation({ summary: 'Approve cost sheet discount (Sales Head only)' })
  async approveCostSheet(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks: string }
  ) {
    return this.inventoryService.approveCostSheet(
      tenant.id,
      id,
      user.id,
      body.remarks
    );
  }

  @Post('cost-sheets/:id/reject')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.costsheet.approve')
  @ApiOperation({ summary: 'Reject cost sheet discount (Sales Head only)' })
  async rejectCostSheet(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks: string }
  ) {
    return this.inventoryService.rejectCostSheet(
      tenant.id,
      id,
      user.id,
      body.remarks
    );
  }
}
