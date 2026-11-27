import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractorsBillingService } from './contractors-billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@ApiTags('contractors-billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contractors-billing')
export class ContractorsBillingController {
  constructor(private readonly billingService: ContractorsBillingService) {}

  // ── WORK ORDERS ───────────────────────────────────────────────────────────
  @Get('work-orders')
  @ApiOperation({ summary: 'List subcontract work orders' })
  getWorkOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.billingService.getWorkOrders(
      tenant,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  @Get('work-orders/:id')
  @ApiOperation({ summary: 'Get work order details with BOQ items' })
  getWorkOrderById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.billingService.getWorkOrderById(tenant, id);
  }

  @Post('work-orders')
  @ApiOperation({ summary: 'Create new subcontract work order' })
  createWorkOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.billingService.createWorkOrder(tenant, user, data);
  }

  // ── RA BILLS & MEASUREMENT SHEETS ─────────────────────────────────────────
  @Get('ra-bills')
  @ApiOperation({ summary: 'List contractor Running Account (RA) bills' })
  getRaBills(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.billingService.getRaBills(
      tenant,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  @Get('ra-bills/:id')
  @ApiOperation({ summary: 'Get RA Bill details with Measurement Book (MB) lines' })
  getRaBillById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.billingService.getRaBillById(tenant, id);
  }

  @Post('ra-bills')
  @ApiOperation({ summary: 'Create RA bill with measurements, 5% retention & 1% TDS' })
  createRaBill(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.billingService.createRaBill(tenant, user, data);
  }

  @Patch('ra-bills/:id/status')
  @ApiOperation({ summary: 'Update RA bill certification & approval status' })
  updateRaBillStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'certified' | 'approved' | 'paid'
  ) {
    return this.billingService.updateRaBillStatus(tenant, user, id, status);
  }
}
