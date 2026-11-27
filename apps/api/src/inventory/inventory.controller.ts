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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── 1. GOODS RECEIPT NOTES (GRN) ──────────────────────────────────────────
  @Get('grns')
  @ApiOperation({ summary: 'List goods receipt notes (store inwards)' })
  getGrns(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.inventoryService.getGrns(
      tenant,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  @Get('grns/:id')
  @ApiOperation({ summary: 'Get GRN inspection details and received items' })
  getGrnById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.inventoryService.getGrnById(tenant, id);
  }

  @Post('grns')
  @ApiOperation({ summary: 'Create GRN against PO with stock inward' })
  createGrn(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.inventoryService.createGrn(tenant, user, data);
  }

  // ── 2. STOCK SUMMARY & VALUATION ──────────────────────────────────────────
  @Get('stock-summary')
  @ApiOperation({ summary: 'Get current stock summary, valuation, and low-stock alerts' })
  getStockSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('warehouseId') warehouseId?: string,
    @Query('siteId') siteId?: string
  ) {
    return this.inventoryService.getStockSummary(
      tenant,
      warehouseId ? parseInt(warehouseId, 10) : undefined,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  // ── 3. STOCK LEDGER ───────────────────────────────────────────────────────
  @Get('stock-ledger')
  @ApiOperation({ summary: 'Get chronological double-entry stock movement ledger' })
  getStockLedger(
    @CurrentTenant() tenant: TenantContext,
    @Query('itemId') itemId?: string,
    @Query('warehouseId') warehouseId?: string
  ) {
    return this.inventoryService.getStockLedger(
      tenant,
      itemId ? parseInt(itemId, 10) : undefined,
      warehouseId ? parseInt(warehouseId, 10) : undefined
    );
  }

  // ── 4. MATERIAL ISSUES ────────────────────────────────────────────────────
  @Get('issues')
  @ApiOperation({ summary: 'List site store material issues to contractors' })
  getMaterialIssues(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.inventoryService.getMaterialIssues(
      tenant,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  @Get('issues/:id')
  @ApiOperation({ summary: 'Get material issue details with items' })
  getMaterialIssueById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.inventoryService.getMaterialIssueById(tenant, id);
  }

  @Post('issues')
  @ApiOperation({ summary: 'Issue materials to site/contractor with negative-stock guardrail' })
  createMaterialIssue(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.inventoryService.createMaterialIssue(tenant, user, data);
  }
}
