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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { SalesHeadGuard } from '../../auth/guards/sales-head.guard';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentTenant, CurrentUser } from '../../auth/decorators/auth.decorators';
import { TenantContext } from '../../common/middleware/tenant.middleware';
import {
  PostSalesService,
  CreateBookingDto,
  BulkGenerateDemandsDto,
  CreateReceiptDto,
  CancelBookingDto,
  TransferBookingDto,
  IssueLetterDto,
} from './post-sales.service';

@ApiTags('realty-post-sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireModuleGuard, PermissionsGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/post-sales')
export class PostSalesController {
  constructor(private readonly postSalesService: PostSalesService) {}

  // ── 1. BOOKINGS ────────────────────────────────────────────────────────────

  @Post('bookings')
  @Permissions('realty.booking.create')
  @ApiOperation({ summary: 'Create new booking through 7-step wizard' })
  async createBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreateBookingDto
  ) {
    return this.postSalesService.createBooking(tenant.id, user.id, dto);
  }

  @Get('bookings')
  @Permissions('realty.booking.view')
  @ApiOperation({ summary: 'List bookings with unit and primary applicant' })
  async listBookings(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.postSalesService.listBookings(tenant.id, {
      siteId: siteId ? Number(siteId) : undefined,
      status: status || undefined,
      search: search || undefined,
    });
  }

  @Get('bookings/:id')
  @Permissions('realty.booking.view')
  @ApiOperation({ summary: 'Get Customer 360 view for a booking' })
  async getBookingCustomer360(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.getBookingCustomer360(tenant.id, id);
  }

  @Post('bookings/:id/approve')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.booking.approve')
  @ApiOperation({ summary: 'Approve pending booking (Sales Head only)' })
  async approveBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks: string }
  ) {
    return this.postSalesService.approveBooking(
      tenant.id,
      id,
      user.id,
      body.remarks
    );
  }

  @Post('bookings/:id/reject')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.booking.approve')
  @ApiOperation({ summary: 'Reject pending booking (Sales Head only)' })
  async rejectBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks: string }
  ) {
    return this.postSalesService.rejectBooking(
      tenant.id,
      id,
      user.id,
      body.remarks
    );
  }

  @Delete('bookings/:id')
  @Permissions('realty.booking.cancel')
  @ApiOperation({ summary: 'Delete unapproved or draft booking and release unit back to inventory' })
  async deleteBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postSalesService.deleteBooking(tenant.id, id, user.id);
  }

  // ── 2. STAGES & DEMANDS ───────────────────────────────────────────────────

  @Post('stages/:id/complete')
  @Permissions('realty.demand.generate')
  @ApiOperation({ summary: 'Mark pay stage completed and check eligible bookings' })
  async completeStage(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) stageId: number,
    @Body() body: { siteId: number; completionDate?: string; certificateNo?: string }
  ) {
    return this.postSalesService.completeStage(tenant.id, user.id, {
      siteId: body.siteId,
      stageId,
      completionDate: body.completionDate,
      certificateNo: body.certificateNo,
    });
  }

  @Get('stages/:id/eligible-bookings')
  @Permissions('realty.demand.view')
  @ApiOperation({ summary: 'Get bookings eligible for demand generation for a stage' })
  async getEligibleBookings(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) stageId: number
  ) {
    return this.postSalesService.getEligibleBookingsForStage(tenant.id, stageId);
  }

  @Post('demands/bulk-generate')
  @Permissions('realty.demand.generate')
  @ApiOperation({ summary: 'Bulk generate milestone demands for eligible bookings' })
  async bulkGenerateDemands(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: BulkGenerateDemandsDto
  ) {
    return this.postSalesService.bulkGenerateDemands(tenant.id, user.id, dto);
  }

  @Get('demands')
  @Permissions('realty.demand.view')
  @ApiOperation({ summary: 'List milestone demands' })
  async listDemands(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.postSalesService.listDemands(tenant.id, {
      siteId: siteId ? Number(siteId) : undefined,
      bookingId: bookingId ? Number(bookingId) : undefined,
      status: status || undefined,
      search: search || undefined,
    });
  }

  @Get('demands/:id')
  @Permissions('realty.demand.view')
  @ApiOperation({ summary: 'Get demand detail with amount in words and breakdown' })
  async getDemandDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.getDemandDetail(tenant.id, id);
  }

  @Post('demands/:id/send')
  @Permissions('realty.demand.send')
  @ApiOperation({ summary: 'Send demand notice via WhatsApp or Email' })
  async sendDemand(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { sentVia: string }
  ) {
    return this.postSalesService.sendDemand(tenant.id, id, body?.sentVia || 'whatsapp');
  }

  // ── 3. RECEIPTS & MAKER-CHECKER ───────────────────────────────────────────

  @Post('receipts')
  @Permissions('realty.receipt.create')
  @ApiOperation({ summary: 'Create new receipt with FIFO allocation preview (Maker)' })
  async createReceipt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreateReceiptDto
  ) {
    return this.postSalesService.createReceipt(tenant.id, user.id, dto);
  }

  @Get('receipts')
  @Permissions('realty.receipt.view')
  @ApiOperation({ summary: 'List receipts' })
  async listReceipts(
    @CurrentTenant() tenant: TenantContext,
    @Query('bookingId') bookingId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.postSalesService.listReceipts(tenant.id, {
      bookingId: bookingId ? Number(bookingId) : undefined,
      status: status || undefined,
      search: search || undefined,
    });
  }

  @Get('receipts/:id')
  @Permissions('realty.receipt.view')
  @ApiOperation({ summary: 'Get receipt detail with two-copy printable structure' })
  async getReceiptDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.getReceiptDetail(tenant.id, id);
  }

  @Post('receipts/:id/approve')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.receipt.approve')
  @ApiOperation({ summary: 'Approve and realize receipt into escrow (Sales Head only)' })
  async approveReceipt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.approveReceipt(tenant.id, id, user.id);
  }

  @Post('receipts/:id/bounce')
  @Permissions('realty.receipt.bounce')
  @ApiOperation({ summary: 'Mark cheque/payment bounced with penalty charge' })
  async bounceReceipt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string; bounceCharges?: number }
  ) {
    return this.postSalesService.bounceReceipt(
      tenant.id,
      id,
      user.id,
      body.reason,
      body.bounceCharges
    );
  }

  @Patch('receipts/:id')
  @Permissions('realty.receipt.create')
  @ApiOperation({ summary: 'Modify / update receipt details before clearance' })
  async updateReceipt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.postSalesService.updateReceipt(tenant.id, id, user.id, body);
  }

  @Delete('receipts/:id')
  @Permissions('realty.receipt.create')
  @ApiOperation({ summary: 'Delete unapproved or erroneous receipt' })
  async deleteReceipt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postSalesService.deleteReceipt(tenant.id, id, user.id);
  }

  @Get('receipts/:id/export-tally')
  @Permissions('realty.receipt.view')
  @ApiOperation({ summary: 'Export receipt voucher as Tally XML' })
  async exportReceiptToTally(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.exportReceiptToTally(tenant.id, id);
  }

  // ── 4. CUSTOMER LEDGER & SOA ──────────────────────────────────────────────

  @Get('bookings/:id/ledger')
  @Permissions('realty.ledger.view')
  @ApiOperation({ summary: 'Get Statement of Account (SOA) with running balances' })
  async getBookingLedger(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postSalesService.getBookingLedger(tenant.id, id);
  }

  // ── 5. INTEREST ACCRUAL & WAIVER ──────────────────────────────────────────

  @Post('interest/accrue-nightly')
  @Permissions('realty.interest.manage')
  @ApiOperation({ summary: 'Nightly overdue interest accrual run' })
  async accrueNightlyInterest(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { asOfDate?: string }
  ) {
    return this.postSalesService.accrueNightlyInterest(tenant.id, body?.asOfDate);
  }

  @Post('interest/:id/waive')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.interest.waive')
  @ApiOperation({ summary: 'Waive overdue interest with concession approval (Sales Head only)' })
  async waiveInterest(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { waivedAmount: number; remarks: string }
  ) {
    return this.postSalesService.waiveInterest(
      tenant.id,
      id,
      user.id,
      body.waivedAmount,
      body.remarks
    );
  }

  // ── 6. LETTERS & NOTICES ──────────────────────────────────────────────────

  @Get('letters/templates')
  @Permissions('realty.letter.manage')
  @ApiOperation({ summary: 'List letter templates' })
  async getLetterTemplates(@CurrentTenant() tenant: TenantContext) {
    return this.postSalesService.getLetterTemplates(tenant.id);
  }

  @Post('letters/issue')
  @Permissions('realty.letter.manage')
  @ApiOperation({ summary: 'Issue letter/notice with merge fields' })
  async issueLetter(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: IssueLetterDto
  ) {
    return this.postSalesService.issueLetter(tenant.id, user.id, dto);
  }

  @Get('letters')
  @Permissions('realty.letter.manage')
  @ApiOperation({ summary: 'List letters issued' })
  async listLetters(
    @CurrentTenant() tenant: TenantContext,
    @Query('bookingId') bookingId?: string
  ) {
    return this.postSalesService.listLettersIssued(
      tenant.id,
      bookingId ? Number(bookingId) : undefined
    );
  }

  // ── 7. CANCELLATION & TRANSFER ────────────────────────────────────────────

  @Post('bookings/:id/cancel')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.booking.cancel')
  @ApiOperation({ summary: 'Cancel booking with forfeiture deduction and unit release (Sales Head only)' })
  async cancelBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto
  ) {
    return this.postSalesService.cancelBooking(tenant.id, id, user.id, dto);
  }

  @Post('bookings/:id/transfer')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.booking.transfer')
  @ApiOperation({ summary: 'Transfer booking to new buyer with administrative transfer fee (Sales Head only)' })
  async transferBooking(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferBookingDto
  ) {
    return this.postSalesService.transferBooking(tenant.id, id, user.id, dto);
  }

  // ── 8. DPR MILESTONE HOOK ─────────────────────────────────────────────────

  @Post('dpr-hook/milestone-completed')
  @Permissions('realty.demand.generate')
  @ApiOperation({ summary: 'DPR milestone completed webhook hook to trigger CRM notice' })
  async dprMilestoneCompleted(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { milestoneName: string; siteId: number }
  ) {
    return this.postSalesService.notifyDprMilestoneCompleted(
      tenant.id,
      body.milestoneName,
      body.siteId
    );
  }
}
