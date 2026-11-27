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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import {
  CrmService,
  CreateSourceDto,
  CreateCampaignDto,
  CreateRoutingRuleDto,
  CreateLeadDto,
  LeadFilterDto,
  AddActivityDto,
  ScheduleFollowupDto,
  ScheduleSiteVisitDto,
} from './crm.service';

interface AuthenticatedRequest {
  user: {
    tenantId: number;
    userId: number;
    email: string;
    roles?: string[];
  };
}

@ApiTags('realty-crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RequireModuleGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // 1. Sources
  @Get('sources')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'Get lead acquisition sources' })
  async getSources(@Req() req: AuthenticatedRequest) {
    return this.crmService.getSources(req.user.tenantId);
  }

  @Post('sources')
  @Permissions('realty.settings.manage')
  @ApiOperation({ summary: 'Create new lead source' })
  async createSource(@Req() req: AuthenticatedRequest, @Body() dto: CreateSourceDto) {
    return this.crmService.createSource(req.user.tenantId, req.user.userId, dto);
  }

  // 2. Campaigns
  @Get('campaigns')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'Get marketing campaigns' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getCampaigns(@Req() req: AuthenticatedRequest, @Query('siteId') siteId?: number) {
    return this.crmService.getCampaigns(req.user.tenantId, siteId ? Number(siteId) : undefined);
  }

  @Post('campaigns')
  @Permissions('realty.settings.manage')
  @ApiOperation({ summary: 'Create marketing campaign' })
  async createCampaign(@Req() req: AuthenticatedRequest, @Body() dto: CreateCampaignDto) {
    return this.crmService.createCampaign(req.user.tenantId, req.user.userId, dto);
  }

  // 3. Routing Rules
  @Get('routing-rules')
  @Permissions('realty.settings.manage')
  @ApiOperation({ summary: 'Get routing rules' })
  async getRoutingRules(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRoutingRules(req.user.tenantId);
  }

  @Post('routing-rules')
  @Permissions('realty.settings.manage')
  @ApiOperation({ summary: 'Create routing rule' })
  async createRoutingRule(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoutingRuleDto) {
    return this.crmService.createRoutingRule(req.user.tenantId, req.user.userId, dto);
  }

  // 4. Leads CRUD
  @Get('leads')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'List leads with filters and saved views' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  @ApiQuery({ name: 'stage', required: false, type: String })
  @ApiQuery({ name: 'temperature', required: false, type: String })
  @ApiQuery({ name: 'sourceId', required: false, type: Number })
  @ApiQuery({ name: 'presalesOwnerId', required: false, type: Number })
  @ApiQuery({ name: 'salesOwnerId', required: false, type: Number })
  @ApiQuery({ name: 'slaBreached', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getLeads(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: number,
    @Query('stage') stage?: string,
    @Query('temperature') temperature?: 'hot' | 'warm' | 'cold',
    @Query('sourceId') sourceId?: number,
    @Query('presalesOwnerId') presalesOwnerId?: number,
    @Query('salesOwnerId') salesOwnerId?: number,
    @Query('slaBreached') slaBreached?: string,
    @Query('search') search?: string,
  ) {
    const filters: LeadFilterDto = {
      siteId: siteId ? Number(siteId) : undefined,
      stage,
      temperature,
      sourceId: sourceId ? Number(sourceId) : undefined,
      presalesOwnerId: presalesOwnerId ? Number(presalesOwnerId) : undefined,
      salesOwnerId: salesOwnerId ? Number(salesOwnerId) : undefined,
      slaBreached: slaBreached !== undefined ? slaBreached === 'true' : undefined,
      search,
    };
    return this.crmService.getLeads(req.user.tenantId, filters);
  }

  @Post('leads')
  @Permissions('realty.lead.create')
  @ApiOperation({ summary: 'Create single lead with dedupe and scoring' })
  async createLead(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeadDto) {
    return this.crmService.createLead(req.user.tenantId, req.user.userId, dto);
  }

  @Get('leads/:id')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'Get Lead 360 details' })
  async getLeadDetail(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.crmService.getLeadDetail(req.user.tenantId, id);
  }

  @Patch('leads/:id/stage')
  @Permissions('realty.lead.edit')
  @ApiOperation({ summary: 'Update lead pipeline stage' })
  async updateLeadStage(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { stage: string; subStage?: string; lostReason?: string }
  ) {
    return this.crmService.updateLeadStage(
      req.user.tenantId,
      id,
      req.user.userId,
      body.stage,
      body.subStage,
      body.lostReason
    );
  }

  @Post('leads/:id/activities')
  @Permissions('realty.lead.edit')
  @ApiOperation({ summary: 'Record call, note, or engagement activity' })
  async addActivity(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddActivityDto
  ) {
    return this.crmService.addActivity(req.user.tenantId, id, req.user.userId, dto);
  }

  @Post('leads/:id/followups')
  @Permissions('realty.lead.edit')
  @ApiOperation({ summary: 'Schedule followup reminder' })
  async scheduleFollowup(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleFollowupDto
  ) {
    return this.crmService.scheduleFollowup(req.user.tenantId, id, req.user.userId, dto);
  }

  @Post('leads/:id/site-visits')
  @Permissions('realty.sitevisit.manage')
  @ApiOperation({ summary: 'Schedule site visit' })
  async scheduleSiteVisit(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleSiteVisitDto
  ) {
    return this.crmService.scheduleSiteVisit(req.user.tenantId, id, req.user.userId, dto);
  }

  // 5. Site Visits & Follow-ups registers
  @Get('site-visits')
  @Permissions('realty.sitevisit.manage')
  @ApiOperation({ summary: 'Get site visits board' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getSiteVisits(@Req() req: AuthenticatedRequest, @Query('siteId') siteId?: number) {
    return this.crmService.getSiteVisits(req.user.tenantId, siteId ? Number(siteId) : undefined);
  }

  @Patch('site-visits/:id/status')
  @Permissions('realty.sitevisit.manage')
  @ApiOperation({ summary: 'Update site visit status' })
  async updateSiteVisitStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'scheduled' | 'confirmed' | 'done' | 'no_show' | 'rescheduled'; feedback?: string }
  ) {
    return this.crmService.updateSiteVisitStatus(
      req.user.tenantId,
      id,
      req.user.userId,
      body.status,
      body.feedback
    );
  }

  @Get('followups')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'Get scheduled follow-ups' })
  async getFollowups(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter?: string,
    @Query('leadId') leadId?: string,
    @Query('all') all?: string
  ) {
    const isGlobal =
      all === 'true' ||
      filter === 'today' ||
      (req.user.roles && req.user.roles.some((r: string) => ['admin', 'super_admin', 'director'].includes(r)));
    return this.crmService.getFollowupsList(
      req.user.tenantId,
      isGlobal ? undefined : req.user.userId,
      filter,
      leadId ? Number(leadId) : undefined
    );
  }

  @Patch('followups/:id/complete')
  @Permissions('realty.lead.edit')
  @ApiOperation({ summary: 'Mark follow-up done with outcome' })
  async completeFollowup(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { outcome: string }
  ) {
    return this.crmService.completeFollowup(req.user.tenantId, id, req.user.userId, body.outcome);
  }

  // 6. CSV Import
  @Post('leads/import-csv')
  @Permissions('realty.lead.create')
  @ApiOperation({ summary: 'Bulk import leads via CSV with dedupe' })
  async importLeadsCsv(@Req() req: AuthenticatedRequest, @Body() body: { leads: CreateLeadDto[] }) {
    return this.crmService.importLeadsCsv(req.user.tenantId, req.user.userId, body.leads);
  }

  // 7. SLA Check / Cron Trigger
  @Post('sla/check')
  @Permissions('realty.settings.manage')
  @ApiOperation({ summary: 'Trigger SLA breach verification job' })
  async checkSla(@Req() req: AuthenticatedRequest) {
    return this.crmService.checkSlaBreaches(req.user.tenantId);
  }

  // 8. Sales Dashboard
  @Get('dashboard')
  @Permissions('realty.lead.view')
  @ApiOperation({ summary: 'Get sales pipeline KPIs and metrics' })
  @ApiQuery({ name: 'siteId', required: false, type: Number })
  async getSalesDashboard(@Req() req: AuthenticatedRequest, @Query('siteId') siteId?: number) {
    return this.crmService.getSalesDashboard(req.user.tenantId, siteId ? Number(siteId) : undefined);
  }
}
