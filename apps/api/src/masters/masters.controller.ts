import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@ApiTags('masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ── SITES ────────────────────────────────────────────────────────────────
  @Get('sites')
  @ApiOperation({ summary: 'List construction projects / sites' })
  getSites(@CurrentTenant() tenant: TenantContext, @Query('search') search?: string) {
    return this.mastersService.getSites(tenant, search);
  }

  @Post('sites')
  @ApiOperation({ summary: 'Create construction project / site' })
  createSite(@CurrentTenant() tenant: TenantContext, @Body() data: any) {
    return this.mastersService.createSite(tenant, data);
  }

  @Patch('sites/:id')
  @ApiOperation({ summary: 'Update site configuration, company mapping, active status or geofence' })
  updateSite(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.mastersService.updateSite(tenant, id, data);
  }

  @Delete('sites/:id')
  @ApiOperation({ summary: 'Deactivate site' })
  deleteSite(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mastersService.deleteSite(tenant, id);
  }

  // ── ITEMS ────────────────────────────────────────────────────────────────
  @Get('items')
  @ApiOperation({ summary: 'List items, goods, materials with HSN and GST rate' })
  getItems(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.mastersService.getItems(tenant, search, categoryId ? parseInt(categoryId, 10) : undefined);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create item / material' })
  createItem(@CurrentTenant() tenant: TenantContext, @Body() data: any) {
    return this.mastersService.createItem(tenant, data);
  }

  // ── CATEGORIES ───────────────────────────────────────────────────────────
  @Get('categories')
  @ApiOperation({ summary: 'List item categories' })
  getCategories(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getCategories(tenant);
  }

  // ── UNITS ────────────────────────────────────────────────────────────────
  @Get('units')
  @ApiOperation({ summary: 'List units of measure' })
  getUnits(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getUnits(tenant);
  }

  // ── WAREHOUSES ───────────────────────────────────────────────────────────
  @Get('warehouses')
  @ApiOperation({ summary: 'List warehouses and site stores' })
  getWarehouses(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getWarehouses(tenant);
  }

  // ── VENDORS ──────────────────────────────────────────────────────────────
  @Get('vendors')
  @ApiOperation({ summary: 'List vendors & suppliers with GSTIN' })
  getVendors(@CurrentTenant() tenant: TenantContext, @Query('search') search?: string) {
    return this.mastersService.getVendors(tenant, search);
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Create vendor / supplier' })
  createVendor(@CurrentTenant() tenant: TenantContext, @Body() data: any) {
    return this.mastersService.createVendor(tenant, data);
  }

  // ── CONTRACTORS ──────────────────────────────────────────────────────────
  @Get('contractors')
  @ApiOperation({ summary: 'List contractors' })
  getContractors(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getContractors(tenant);
  }

  // ── DOCUMENT SERIES ──────────────────────────────────────────────────────
  @Get('document-series')
  @ApiOperation({ summary: 'Get document number series config' })
  getDocumentSeries(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getDocumentSeries(tenant);
  }

  // ── TENANT BRANDING & 2FA POLICIES ───────────────────────────────────────
  @Get('tenant/branding')
  @ApiOperation({ summary: 'Get tenant branding & visual identity settings' })
  getTenantBranding(@CurrentTenant() tenant: TenantContext) {
    return this.mastersService.getTenantBranding(tenant);
  }

  @Patch('tenant/branding')
  @ApiOperation({ summary: 'Update tenant branding, primary color, logo & 2FA policy' })
  updateTenantBranding(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: any
  ) {
    return this.mastersService.updateTenantBranding(tenant, data);
  }
}
