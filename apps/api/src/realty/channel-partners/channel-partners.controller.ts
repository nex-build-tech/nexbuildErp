import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { SalesHeadGuard } from '../../auth/guards/sales-head.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import {
  ChannelPartnersService,
  TagLeadDto,
  CreateSlabDto,
} from './channel-partners.service';

interface AuthenticatedRequest {
  user: {
    tenantId: number;
    userId: number;
    email: string;
    roles?: string[];
  };
}

@ApiTags('realty-channel-partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RequireModuleGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/channel-partners')
export class ChannelPartnersController {
  constructor(private readonly cpService: ChannelPartnersService) {}

  // 1. Channel Partners Directory & List
  @Get()
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'List all Channel Partners with filters' })
  async getChannelPartners(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('search') search?: string,
  ) {
    const filter: { status?: string | undefined; tier?: string | undefined; search?: string | undefined } = {};
    if (status) filter.status = status;
    if (tier) filter.tier = tier;
    if (search) filter.search = search;

    return this.cpService.getChannelPartners(req.user.tenantId, filter);
  }

  // 2. Performance Leaderboard
  @Get('leaderboard')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Get CP Sales and Brokerage Leaderboard' })
  async getLeaderboard(@Req() req: AuthenticatedRequest) {
    return this.cpService.getLeaderboard(req.user.tenantId);
  }

  // 3. Brokerage Slabs
  @Get('slabs')
  @Permissions('realty.brokerage.view')
  @ApiOperation({ summary: 'Get brokerage slabs configuration' })
  async getBrokerageSlabs(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
  ) {
    return this.cpService.getBrokerageSlabs(
      req.user.tenantId,
      siteId ? Number(siteId) : undefined,
    );
  }

  @Post('slabs')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.brokerage.approve')
  @ApiOperation({ summary: 'Create brokerage slab (Sales Head only)' })
  async createBrokerageSlab(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSlabDto,
  ) {
    return this.cpService.createBrokerageSlab(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  // 4. Brokerage Entries & Ledger
  @Get('brokerage')
  @Permissions('realty.brokerage.view')
  @ApiOperation({ summary: 'Get brokerage entries with Section 194-H TDS breakdown' })
  async getBrokerageEntries(
    @Req() req: AuthenticatedRequest,
    @Query('cpId') cpId?: string,
    @Query('status') status?: string,
    @Query('bookingId') bookingId?: string,
  ) {
    const filter: { cpId?: number | undefined; status?: string | undefined; bookingId?: number | undefined } = {};
    if (cpId) filter.cpId = Number(cpId);
    if (status) filter.status = status;
    if (bookingId) filter.bookingId = Number(bookingId);

    return this.cpService.getBrokerageEntries(req.user.tenantId, filter);
  }

  @Patch('brokerage/:id/approve')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.brokerage.approve')
  @ApiOperation({ summary: 'Approve brokerage entry for payout (Sales Head only)' })
  async approveBrokerageEntry(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cpService.approveBrokerageEntry(req.user.tenantId, id);
  }

  @Post('brokerage/payout')
  @Permissions('realty.brokerage.pay')
  @ApiOperation({ summary: 'Disburse payout for approved brokerage entry' })
  async disbursePayout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { entryId: number; bankRef?: string | undefined },
  ) {
    return this.cpService.disbursePayout(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  // 5. CP Portal Endpoints
  @Get('portal/dashboard')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Get CP Portal Dashboard Metrics' })
  async getCpPortalDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('cpId') cpId?: string,
  ) {
    const targetCpId = cpId ? Number(cpId) : 1;
    return this.cpService.getCpDashboardMetrics(
      req.user.tenantId,
      targetCpId,
    );
  }

  @Get('portal/inventory')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Get CP Scoped Public Inventory' })
  async getScopedInventory(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
  ) {
    return this.cpService.getScopedInventory(
      req.user.tenantId,
      siteId ? Number(siteId) : undefined,
    );
  }

  // 6. Lead Tagging with 60-day Validity Protection
  @Post('leads/tag')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Tag lead to CP with 60-day protection window' })
  async tagLead(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TagLeadDto,
  ) {
    return this.cpService.tagLead(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Get(':id/leads')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Get tagged leads with validity countdown' })
  async getCpLeads(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cpService.getCpLeads(req.user.tenantId, id);
  }

  // 7. CP 360 Detail & KYC
  @Get(':id')
  @Permissions('realty.cp.view')
  @ApiOperation({ summary: 'Get CP 360 Workspace details' })
  async getChannelPartnerDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cpService.getChannelPartnerDetail(req.user.tenantId, id);
  }

  @Patch(':id/kyc')
  @UseGuards(SalesHeadGuard)
  @Permissions('realty.cp.approve')
  @ApiOperation({ summary: 'Update KYC status (Sales Head only)' })
  async updateKycStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'active' | 'suspended' | 'pending_kyc',
  ) {
    return this.cpService.updateKycStatus(req.user.tenantId, id, status);
  }

  @Patch(':id/tier')
  @Permissions('realty.cp.manage')
  @ApiOperation({ summary: 'Update CP Tier (silver/gold/platinum)' })
  async updateTier(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('tier') tier: 'silver' | 'gold' | 'platinum',
  ) {
    return this.cpService.updateTier(req.user.tenantId, id, tier);
  }
}
