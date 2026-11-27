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
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { calculateGst, GstLineItemInput } from '@builderp/shared';

@ApiTags('procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // ── TAX PREVIEW / LIVE CALCULATION ───────────────────────────────────────
  @Post('calculate-gst')
  @ApiOperation({ summary: 'Preview real-time Indian GST breakdown for line items' })
  calculateGstPreview(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    body: {
      vendorStateCode: string;
      lines: GstLineItemInput[];
    }
  ) {
    return calculateGst(
      body.lines || [],
      tenant.stateCode || '27',
      body.vendorStateCode || tenant.stateCode || '27'
    );
  }

  // ── INDENTS ───────────────────────────────────────────────────────────────
  @Get('indents')
  @ApiOperation({ summary: 'List site material indents / requisitions' })
  getIndents(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    return this.procurementService.getIndents(
      tenant,
      siteId ? parseInt(siteId, 10) : undefined
    );
  }

  @Get('indents/:id')
  @ApiOperation({ summary: 'Get material indent details with items' })
  getIndentById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.procurementService.getIndentById(tenant, id);
  }

  @Post('indents')
  @ApiOperation({ summary: 'Create new material indent' })
  createIndent(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.procurementService.createIndent(tenant, user, data);
  }

  @Patch('indents/:id/status')
  @ApiOperation({ summary: 'Update material indent approval status' })
  updateIndentStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'approved' | 'rejected' | 'submitted' | 'cancelled'
  ) {
    return this.procurementService.updateIndentStatus(tenant, user, id, status);
  }

  // ── RFQS ──────────────────────────────────────────────────────────────────
  @Get('rfqs')
  @ApiOperation({ summary: 'List RFQs (Request for Quotations)' })
  getRfqs(@CurrentTenant() tenant: TenantContext) {
    return this.procurementService.getRfqs(tenant);
  }

  @Get('rfqs/:id')
  @ApiOperation({ summary: 'Get RFQ details with vendor comparative statement' })
  getRfqById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.procurementService.getRfqById(tenant, id);
  }

  @Post('rfqs')
  @ApiOperation({ summary: 'Create new RFQ' })
  createRfq(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: any
  ) {
    return this.procurementService.createRfq(tenant, data);
  }

  // ── PURCHASE ORDERS ───────────────────────────────────────────────────────
  @Get('pos')
  @ApiOperation({ summary: 'List purchase orders' })
  getPurchaseOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query('status') status?: string
  ) {
    return this.procurementService.getPurchaseOrders(tenant, status);
  }

  @Get('pos/:id')
  @ApiOperation({ summary: 'Get purchase order details with itemized taxes' })
  getPurchaseOrderById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.procurementService.getPurchaseOrderById(tenant, id);
  }

  @Post('pos')
  @ApiOperation({ summary: 'Create purchase order with automated series and GST' })
  createPurchaseOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.procurementService.createPurchaseOrder(tenant, user, data);
  }

  @Patch('pos/:id/status')
  @ApiOperation({ summary: 'Update purchase order workflow status' })
  updatePurchaseOrderStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'cancelled'
  ) {
    return this.procurementService.updatePurchaseOrderStatus(tenant, user, id, status);
  }

  @Post('pos/:id/share-whatsapp')
  @ApiOperation({ summary: 'Share PO document/details directly via WhatsApp' })
  sharePoWhatsApp(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('phone') phone?: string
  ) {
    return this.procurementService.sharePoWhatsApp(tenant, id, phone);
  }

  @Post('pos/:id/request-approval-whatsapp')
  @ApiOperation({ summary: 'Send interactive WhatsApp approval request with buttons' })
  requestApprovalWhatsApp(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('phone') phone?: string
  ) {
    return this.procurementService.requestApprovalWhatsApp(tenant, id, phone);
  }
}
