import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentTenant, CurrentUser } from '../../auth/decorators/auth.decorators';
import { TenantContext } from '../../common/middleware/tenant.middleware';
import { PERMISSIONS } from '@builderp/shared';

@ApiTags('realty-setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireModuleGuard, PermissionsGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  // ── 1. PROJECT SETTINGS ──────────────────────────────────────────────────
  @Get('project-settings')
  @ApiOperation({ summary: 'Get RERA, financial and tax parameters for site' })
  getProjectSettings(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
  ) {
    const sId = siteId ? parseInt(siteId, 10) : 1;
    return this.setupService.getProjectSettings(tenant.id, sId);
  }

  @Post('project-settings')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Configure or update RERA, tax and grace period parameters' })
  upsertProjectSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { siteId: number; [key: string]: any },
  ) {
    const { siteId, ...data } = body;
    return this.setupService.upsertProjectSettings(tenant.id, siteId, data);
  }

  // ── 2. PHASES, WINGS & FLOORS ───────────────────────────────────────────
  @Get('phases')
  @ApiOperation({ summary: 'List phases for site' })
  getPhases(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
  ) {
    return this.setupService.getPhases(tenant.id, siteId ? parseInt(siteId, 10) : undefined);
  }

  @Post('phases')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create project phase' })
  createPhase(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() body: { siteId: number; name: string },
  ) {
    return this.setupService.createPhase(tenant.id, body, user?.id);
  }

  @Get('wings')
  @ApiOperation({ summary: 'List wings in phase' })
  getWings(
    @CurrentTenant() tenant: TenantContext,
    @Query('phaseId') phaseId?: string,
  ) {
    return this.setupService.getWings(tenant.id, phaseId ? parseInt(phaseId, 10) : undefined);
  }

  @Post('wings')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create wing with optional floor generation' })
  createWing(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      phaseId: number;
      name: string;
      totalFloors: number;
      generateFloors?: boolean;
      groundFloor?: boolean;
    },
  ) {
    return this.setupService.createWing(tenant.id, body, user?.id);
  }

  @Get('floors')
  @ApiOperation({ summary: 'List floors in wing' })
  getFloors(
    @CurrentTenant() tenant: TenantContext,
    @Query('wingId') wingId?: string,
  ) {
    return this.setupService.getFloors(tenant.id, wingId ? parseInt(wingId, 10) : undefined);
  }

  @Post('bulk-structure')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create phase, wing and auto-generate floors in one call' })
  createBulkStructure(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      siteId: number;
      phaseName: string;
      wingName: string;
      totalFloors: number;
      groundFloor?: boolean;
    },
  ) {
    return this.setupService.createBulkStructure(tenant.id, body, user?.id);
  }

  // ── 3. UNIT TYPES ────────────────────────────────────────────────────────
  @Get('unit-types')
  @ApiOperation({ summary: 'List unit configurations (1BHK, 2BHK, Shop, etc.)' })
  getUnitTypes(@CurrentTenant() tenant: TenantContext) {
    return this.setupService.getUnitTypes(tenant.id);
  }

  @Post('unit-types')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create unit type configuration' })
  createUnitType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      code: string;
      name: string;
      category: 'RES' | 'COM';
      defaultCarpetArea?: number;
    },
  ) {
    return this.setupService.createUnitType(tenant.id, body, user?.id);
  }

  @Patch('unit-types/:id')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Update unit type' })
  updateUnitType(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updateUnitType(tenant.id, id, body);
  }

  // ── 4. UNITS & BULK GENERATOR ───────────────────────────────────────────
  @Get('units')
  @ApiOperation({ summary: 'List inventory units with filters' })
  getUnits(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('wingId') wingId?: string,
    @Query('floorId') floorId?: string,
    @Query('status') status?: string,
  ) {
    return this.setupService.getUnits(tenant.id, {
      siteId: siteId ? parseInt(siteId, 10) : undefined,
      wingId: wingId ? parseInt(wingId, 10) : undefined,
      floorId: floorId ? parseInt(floorId, 10) : undefined,
      status,
    });
  }

  @Post('units')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create single inventory unit' })
  createUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.setupService.createUnit(tenant.id, body, user?.id);
  }

  @Post('bulk-generate-units')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Bulk generate inventory units for a wing' })
  bulkGenerateUnits(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      siteId: number;
      wingId: number;
      units: any[];
    },
  ) {
    return this.setupService.bulkGenerateUnits(tenant.id, body, user?.id);
  }

  // ── 5. PARKING SLOTS ─────────────────────────────────────────────────────
  @Get('parking-slots')
  @ApiOperation({ summary: 'List parking bays and availability' })
  getParkingSlots(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('wingId') wingId?: string,
    @Query('status') status?: string,
  ) {
    return this.setupService.getParkingSlots(tenant.id, {
      siteId: siteId ? parseInt(siteId, 10) : undefined,
      wingId: wingId ? parseInt(wingId, 10) : undefined,
      status,
    });
  }

  @Post('parking-slots')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create individual parking slot' })
  createParkingSlot(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      siteId: number;
      wingId?: number;
      type: 'open' | 'stilt' | 'podium' | 'basement';
      slotNo: string;
      price: number;
    },
  ) {
    return this.setupService.createParkingSlot(tenant.id, body, user?.id);
  }

  @Post('bulk-parking-slots')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Batch generate numbered parking slots' })
  bulkGenerateParkingSlots(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      siteId: number;
      wingId?: number;
      type: 'open' | 'stilt' | 'podium' | 'basement';
      prefix: string;
      from: number;
      to: number;
      price: number;
    },
  ) {
    return this.setupService.bulkGenerateParkingSlots(tenant.id, body, user?.id);
  }

  // ── 6. CHARGE HEADS & PRICE LIST ─────────────────────────────────────────
  @Get('charge-heads')
  @ApiOperation({ summary: 'List standard other-charge heads' })
  getChargeHeads(@CurrentTenant() tenant: TenantContext) {
    return this.setupService.getChargeHeads(tenant.id);
  }

  @Post('charge-heads')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create charge head with GST applicability' })
  createChargeHead(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      code: string;
      name: string;
      calcType: 'fixed' | 'per_sqft' | 'pct_of_agreement' | 'per_month';
      defaultValue?: number;
      gstApplicable?: boolean;
      gstRate?: number;
      sequence?: number;
    },
  ) {
    return this.setupService.createChargeHead(tenant.id, body, user?.id);
  }

  @Patch('charge-heads/:id')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Update charge head' })
  updateChargeHead(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updateChargeHead(tenant.id, id, body);
  }

  @Delete('charge-heads/:id')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Delete charge head' })
  deleteChargeHead(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.setupService.deleteChargeHead(tenant.id, id);
  }

  // ── 7. PAY STAGES & SCHEMES ──────────────────────────────────────────────
  @Get('pay-stages')
  @ApiOperation({ summary: 'List construction/call milestone stages' })
  getPayStages(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
  ) {
    return this.setupService.getPayStages(tenant.id, siteId ? parseInt(siteId, 10) : undefined);
  }

  @Post('pay-stages')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create milestone pay stage' })
  createPayStage(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.setupService.createPayStage(tenant.id, body, user?.id);
  }

  @Patch('pay-stages/:id')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Update pay stage status or DPR linkage' })
  updatePayStage(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updatePayStage(tenant.id, id, body);
  }

  @Get('schemes')
  @ApiOperation({ summary: 'List payment schemes' })
  getSchemes(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
  ) {
    return this.setupService.getSchemes(tenant.id, siteId ? parseInt(siteId, 10) : undefined);
  }

  @Get('schemes/:id')
  @ApiOperation({ summary: 'Get single scheme with stage breakdown' })
  getSchemeById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.setupService.getSchemeById(tenant.id, id);
  }

  @Post('schemes')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Create scheme (validates stages sum to 100%)' })
  createScheme(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body()
    body: {
      siteId: number;
      name: string;
      gstMode: 'with' | 'without';
      unitTypeIds?: number[];
      floorFrom?: number;
      floorTo?: number;
      stampByBuilder?: boolean;
      registrationByBuilder?: boolean;
      maxDiscountPct?: number;
      stages: any[];
    },
  ) {
    return this.setupService.createScheme(tenant.id, body, user?.id);
  }

  @Post('schemes/:id/copy')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Duplicate an existing scheme and its stages' })
  copyScheme(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('name') newName: string,
  ) {
    return this.setupService.copyScheme(tenant.id, id, newName, user?.id);
  }

  @Patch('schemes/:id')
  @Permissions(PERMISSIONS.REALTY_PLAN_MANAGE)
  @ApiOperation({ summary: 'Update scheme (re-validates 100% total if stages change)' })
  updateScheme(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updateScheme(tenant.id, id, body);
  }

  // ── 8. SALES DROPDOWN MASTERS ───────────────────────────────────────────
  @Get('sales-masters')
  @ApiOperation({ summary: 'List sales dropdown masters by category or all' })
  getSalesMasters(
    @CurrentTenant() tenant: TenantContext,
    @Query('category') category?: string,
  ) {
    return this.setupService.getSalesMasters(tenant.id, category);
  }

  @Post('sales-masters')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Create new sales dropdown master option' })
  createSalesMaster(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any,
  ) {
    return this.setupService.createSalesMaster(tenant.id, body);
  }

  @Patch('sales-masters/:id')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update sales dropdown master option' })
  updateSalesMaster(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updateSalesMaster(tenant.id, id, body);
  }

  @Delete('sales-masters/:id')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Delete sales dropdown master option' })
  deleteSalesMaster(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.setupService.deleteSalesMaster(tenant.id, id);
  }

  // ── 11. COMPANIES (Tenant Legal Entities / Subsidiaries) ──────────────────
  @Get('companies')
  @ApiOperation({ summary: 'List all companies under the current tenant with linked projects' })
  getCompanies(@CurrentTenant() tenant: TenantContext) {
    return this.setupService.getCompanies(tenant.id);
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get details of a company' })
  getCompanyById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.setupService.getCompanyById(tenant.id, id);
  }

  @Post('companies')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Create new company under tenant' })
  createCompany(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any,
  ) {
    return this.setupService.createCompany(tenant.id, body);
  }

  @Patch('companies/:id')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update company details' })
  updateCompany(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.setupService.updateCompany(tenant.id, id, body);
  }

  @Delete('companies/:id')
  @Permissions(PERMISSIONS.REALTY_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Delete or deactivate company' })
  deleteCompany(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.setupService.deleteCompany(tenant.id, id);
  }
}
