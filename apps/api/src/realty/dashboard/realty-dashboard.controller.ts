import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentTenant } from '../../auth/decorators/auth.decorators';
import { TenantContext } from '../../common/middleware/tenant.middleware';
import { RealtyDashboardService } from './realty-dashboard.service';

@ApiTags('realty-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireModuleGuard, PermissionsGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/dashboard')
export class RealtyDashboardController {
  constructor(private readonly dashboardService: RealtyDashboardService) {}

  @Get('post-sales')
  @Permissions('realty.booking.view')
  @ApiOperation({ summary: 'Get reconciled Post-Sales executive dashboard metrics' })
  async getPostSalesDashboard(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.dashboardService.getPostSalesDashboard(
      tenant.id,
      siteId ? Number(siteId) : undefined
    );
  }
}
