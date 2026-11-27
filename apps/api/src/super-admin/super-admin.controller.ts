import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService, CreateTenantDto, UpdateBrandingDto } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('super-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'List all onboarded SaaS tenants with statistics and branding' })
  async getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get single tenant dossier' })
  async getTenantById(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getTenantById(id);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Provision new tenant organization with branding, roles and default user' })
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.superAdminService.createTenant(dto);
  }

  @Patch('tenants/:id/branding')
  @ApiOperation({ summary: 'Update tenant color palette, logo, and brand identity' })
  async updateTenantBranding(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.superAdminService.updateTenantBranding(id, dto);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Update tenant account status (active, trial, suspended)' })
  async updateTenantStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'trial' | 'active' | 'suspended' | 'cancelled',
  ) {
    return this.superAdminService.updateTenantStatus(id, status);
  }

  @Post('tenants/:id/impersonate')
  @ApiOperation({ summary: 'Switch context and generate impersonation token for tenant' })
  async impersonateTenant(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.impersonateTenant(id);
  }

  @Get('tenants/:id/modules')
  @ApiOperation({ summary: 'Get enabled modules for tenant' })
  async getTenantModules(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getTenantModules(id);
  }

  @Patch('tenants/:id/modules')
  @ApiOperation({ summary: 'Enable or disable modules for tenant' })
  async updateTenantModules(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { modules: { moduleCode: string; enabled: boolean }[] },
  ) {
    return this.superAdminService.updateTenantModules(id, body.modules || []);
  }
}
