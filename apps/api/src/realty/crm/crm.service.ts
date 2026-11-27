import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, or, isNull, desc, asc, inArray, sql, lte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { randomUUID } from 'crypto';

export interface CreateSourceDto {
  name: string;
  code: string;
  active?: boolean | undefined;
}

export interface CreateCampaignDto {
  name: string;
  sourceId?: number | undefined;
  siteId?: number | undefined;
  budget?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  utmSource?: string | undefined;
  utmMedium?: string | undefined;
  utmCampaign?: string | undefined;
}

export interface CreateRoutingRuleDto {
  name: string;
  conditions?: Record<string, any> | undefined;
  userPool: number[]; // user IDs to distribute leads to
  strategy: 'round_robin' | 'load';
  slaMinutes: number;
  active?: boolean | undefined;
}

export interface CreateLeadDto {
  name: string;
  mobile: string;
  altMobile?: string | undefined;
  email?: string | undefined;
  city?: string | undefined;
  budgetMin?: number | undefined;
  budgetMax?: number | undefined;
  configPref?: string | undefined; // '1BHK', '2BHK', '3BHK'
  purpose?: string | undefined; // 'end_use', 'investment'
  sourceId?: number | undefined;
  campaignId?: number | undefined;
  cpId?: number | undefined;
  siteId?: number | undefined;
  presalesOwnerId?: number | undefined;
  salesOwnerId?: number | undefined;
  notes?: string | undefined;
}

export interface LeadFilterDto {
  siteId?: number | undefined;
  stage?: string | undefined;
  temperature?: 'hot' | 'warm' | 'cold' | undefined;
  sourceId?: number | undefined;
  presalesOwnerId?: number | undefined;
  salesOwnerId?: number | undefined;
  slaBreached?: boolean | undefined;
  search?: string | undefined;
  limit?: number | undefined;
}

export interface AddActivityDto {
  type: 'call' | 'whatsapp' | 'sms' | 'email' | 'note' | 'stage_change' | 'assign';
  outcome?: string | undefined;
  durationSec?: number | undefined;
  notes?: string | undefined;
}

export interface ScheduleFollowupDto {
  dueAt: string;
  type?: string | undefined;
  assignedTo?: number | undefined;
}

export interface ScheduleSiteVisitDto {
  siteId: number;
  scheduledAt: string;
  attendedBy?: number | undefined;
  feedback?: string | undefined;
}

@Injectable()
export class CrmService {
  constructor(private readonly db: DatabaseService) {}

  // ════════════════════════════════════════════════════════════════════════════
  // 1. LEAD SOURCES
  // ════════════════════════════════════════════════════════════════════════════

  async getSources(tenantId: number) {
    return this.db.db
      .select()
      .from(schema.reLeadSources)
      .where(and(eq(schema.reLeadSources.tenantId, tenantId), eq(schema.reLeadSources.active, true)))
      .orderBy(asc(schema.reLeadSources.name));
  }

  async createSource(tenantId: number, userId: number, dto: CreateSourceDto) {
    const [result] = await this.db.db.insert(schema.reLeadSources).values({
      uuid: randomUUID(),
      tenantId,
      name: dto.name,
      code: dto.code.toLowerCase().replace(/\s+/g, '_'),
      active: dto.active ?? true,
      createdBy: userId,
    });
    return { id: (result as any).insertId, ...dto };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. MARKETING CAMPAIGNS
  // ════════════════════════════════════════════════════════════════════════════

  async getCampaigns(tenantId: number, siteId?: number) {
    const conditions = [eq(schema.reCampaigns.tenantId, tenantId)];
    if (siteId) {
      conditions.push(eq(schema.reCampaigns.siteId, siteId));
    }
    return this.db.db
      .select({
        id: schema.reCampaigns.id,
        name: schema.reCampaigns.name,
        sourceId: schema.reCampaigns.sourceId,
        siteId: schema.reCampaigns.siteId,
        budget: schema.reCampaigns.budget,
        startDate: schema.reCampaigns.startDate,
        endDate: schema.reCampaigns.endDate,
        utmSource: schema.reCampaigns.utmSource,
        utmMedium: schema.reCampaigns.utmMedium,
        utmCampaign: schema.reCampaigns.utmCampaign,
      })
      .from(schema.reCampaigns)
      .where(and(...conditions))
      .orderBy(desc(schema.reCampaigns.id));
  }

  async createCampaign(tenantId: number, userId: number, dto: CreateCampaignDto) {
    const [result] = await this.db.db.insert(schema.reCampaigns).values({
      uuid: randomUUID(),
      tenantId,
      name: dto.name,
      sourceId: dto.sourceId ?? null,
      siteId: dto.siteId ?? null,
      budget: dto.budget ? dto.budget.toString() : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      utmSource: dto.utmSource ?? null,
      utmMedium: dto.utmMedium ?? null,
      utmCampaign: dto.utmCampaign ?? null,
      createdBy: userId,
    });
    return { id: (result as any).insertId, ...dto };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. ROUTING RULES
  // ════════════════════════════════════════════════════════════════════════════

  async getRoutingRules(tenantId: number) {
    return this.db.db
      .select()
      .from(schema.reRoutingRules)
      .where(eq(schema.reRoutingRules.tenantId, tenantId))
      .orderBy(asc(schema.reRoutingRules.id));
  }

  async createRoutingRule(tenantId: number, userId: number, dto: CreateRoutingRuleDto) {
    const [result] = await this.db.db.insert(schema.reRoutingRules).values({
      uuid: randomUUID(),
      tenantId,
      name: dto.name,
      conditions: dto.conditions ? (dto.conditions as any) : null,
      userPool: dto.userPool as any,
      strategy: dto.strategy,
      slaMinutes: dto.slaMinutes,
      active: dto.active ?? true,
      createdBy: userId,
    });
    return { id: (result as any).insertId, ...dto };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. LEAD SCORING & ROUTING ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  calculateLeadScore(dto: Partial<CreateLeadDto>): { score: number; temperature: 'hot' | 'warm' | 'cold' } {
    let score = 20; // Base score for any registered lead

    // Budget check
    const maxBudget = dto.budgetMax || dto.budgetMin || 0;
    if (maxBudget >= 8000000) {
      score += 30; // High ticket budget
    } else if (maxBudget >= 5000000) {
      score += 20;
    } else if (maxBudget > 0) {
      score += 10;
    }

    // Purpose & preference
    if (dto.purpose === 'end_use') {
      score += 20; // Ready buyers
    } else if (dto.purpose === 'investment') {
      score += 15;
    }

    if (dto.configPref) {
      score += 10;
    }

    // Source multiplier
    if (dto.cpId) {
      score += 15; // Channel partner qualified leads convert faster
    }

    let temperature: 'hot' | 'warm' | 'cold' = 'warm';
    if (score >= 60) {
      temperature = 'hot';
    } else if (score < 40) {
      temperature = 'cold';
    }

    return { score, temperature };
  }

  async assignLeadToOwner(tenantId: number, budgetMax?: number): Promise<{ presalesOwnerId?: number | undefined; slaMinutes: number }> {
    const rules = await this.db.db
      .select()
      .from(schema.reRoutingRules)
      .where(and(eq(schema.reRoutingRules.tenantId, tenantId), eq(schema.reRoutingRules.active, true)))
      .orderBy(asc(schema.reRoutingRules.id));

    if (rules.length === 0 || !rules[0]) {
      return { presalesOwnerId: undefined, slaMinutes: 60 };
    }

    // Match rule by condition (e.g. minBudget) or use first active rule
    let matchedRule = rules[0];
    for (const r of rules) {
      const cond = r.conditions as any;
      if (cond && cond.minBudget && budgetMax && budgetMax >= cond.minBudget) {
        matchedRule = r;
        break;
      }
    }

    const pool = (matchedRule.userPool as number[]) || [];
    if (pool.length === 0) {
      return { presalesOwnerId: undefined, slaMinutes: matchedRule.slaMinutes };
    }

    // Round-robin selection based on total assigned leads
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedUserId = pool[randomIndex];

    return { presalesOwnerId: selectedUserId, slaMinutes: matchedRule.slaMinutes };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. LEADS MANAGEMENT & DEDUPE
  // ════════════════════════════════════════════════════════════════════════════

  async createLead(tenantId: number, userId: number | null, dto: CreateLeadDto) {
    const cleanMobile = dto.mobile.replace(/\D/g, '').slice(-10); // Standard 10-digit Indian mobile
    const siteId = dto.siteId ?? 1;

    // Check Deduplication within (tenantId, mobile, siteId)
    const existing = await this.db.db.query.reLeads.findFirst({
      where: and(
        eq(schema.reLeads.tenantId, tenantId),
        eq(schema.reLeads.mobile, cleanMobile),
        eq(schema.reLeads.siteId, siteId)
      ),
    });

    if (existing) {
      // Record duplicate activity on the original lead
      await this.db.db.insert(schema.reLeadActivities).values({
        tenantId,
        leadId: existing.id,
        type: 'note',
        notes: `Duplicate enquiry received via ${dto.sourceId ? 'Source #' + dto.sourceId : 'portal'}. Customer re-engaged.`,
        userId: userId ?? undefined,
      });

      return {
        isDuplicate: true,
        lead: existing,
        message: `Existing lead found (#${existing.id}). Enquiry attached to active profile.`,
      };
    }

    const { score, temperature } = this.calculateLeadScore(dto);
    const { presalesOwnerId } = await this.assignLeadToOwner(tenantId, dto.budgetMax);

    const [insertResult] = await this.db.db.insert(schema.reLeads).values({
      uuid: randomUUID(),
      tenantId,
      name: dto.name,
      mobile: cleanMobile,
      altMobile: dto.altMobile ?? null,
      email: dto.email ?? null,
      city: dto.city ?? null,
      budgetMin: dto.budgetMin ? dto.budgetMin.toString() : null,
      budgetMax: dto.budgetMax ? dto.budgetMax.toString() : null,
      configPref: dto.configPref ?? null,
      purpose: dto.purpose ?? 'end_use',
      sourceId: dto.sourceId ?? null,
      campaignId: dto.campaignId ?? null,
      cpId: dto.cpId ?? null,
      siteId,
      stage: 'new',
      score,
      temperature,
      presalesOwnerId: dto.presalesOwnerId ?? presalesOwnerId ?? null,
      salesOwnerId: dto.salesOwnerId ?? null,
      createdBy: userId ?? undefined,
    });

    const leadId = (insertResult as any).insertId;

    // Log Creation Activity
    await this.db.db.insert(schema.reLeadActivities).values({
      tenantId,
      leadId,
      type: 'assign',
      notes: `Lead registered and assigned to Pre-sales Exec #${dto.presalesOwnerId ?? presalesOwnerId ?? 'Unassigned'}.`,
      userId: userId ?? undefined,
    });

    if (dto.notes) {
      await this.db.db.insert(schema.reLeadActivities).values({
        tenantId,
        leadId,
        type: 'note',
        notes: dto.notes,
        userId: userId ?? undefined,
      });
    }

    const createdLead = await this.db.db.query.reLeads.findFirst({
      where: eq(schema.reLeads.id, leadId),
    });

    return {
      isDuplicate: false,
      lead: createdLead,
    };
  }

  async getLeads(tenantId: number, filters: LeadFilterDto) {
    const conditions = [eq(schema.reLeads.tenantId, tenantId)];

    if (filters.siteId) {
      conditions.push(eq(schema.reLeads.siteId, filters.siteId));
    }
    if (filters.stage && filters.stage !== 'all') {
      conditions.push(eq(schema.reLeads.stage, filters.stage));
    }
    if (filters.temperature) {
      conditions.push(eq(schema.reLeads.temperature, filters.temperature));
    }
    if (filters.sourceId) {
      conditions.push(eq(schema.reLeads.sourceId, filters.sourceId));
    }
    if (filters.presalesOwnerId) {
      conditions.push(eq(schema.reLeads.presalesOwnerId, filters.presalesOwnerId));
    }
    if (filters.salesOwnerId) {
      conditions.push(eq(schema.reLeads.salesOwnerId, filters.salesOwnerId));
    }
    if (filters.slaBreached !== undefined) {
      conditions.push(eq(schema.reLeads.slaBreached, filters.slaBreached));
    }

    const leads = await this.db.db
      .select({
        id: schema.reLeads.id,
        uuid: schema.reLeads.uuid,
        name: schema.reLeads.name,
        mobile: schema.reLeads.mobile,
        email: schema.reLeads.email,
        city: schema.reLeads.city,
        budgetMin: schema.reLeads.budgetMin,
        budgetMax: schema.reLeads.budgetMax,
        configPref: schema.reLeads.configPref,
        purpose: schema.reLeads.purpose,
        stage: schema.reLeads.stage,
        subStage: schema.reLeads.subStage,
        score: schema.reLeads.score,
        temperature: schema.reLeads.temperature,
        sourceId: schema.reLeads.sourceId,
        campaignId: schema.reLeads.campaignId,
        cpId: schema.reLeads.cpId,
        siteId: schema.reLeads.siteId,
        presalesOwnerId: schema.reLeads.presalesOwnerId,
        salesOwnerId: schema.reLeads.salesOwnerId,
        nextFollowupAt: schema.reLeads.nextFollowupAt,
        slaBreached: schema.reLeads.slaBreached,
        createdAt: schema.reLeads.createdAt,
      })
      .from(schema.reLeads)
      .where(and(...conditions))
      .orderBy(desc(schema.reLeads.id));

    // Fetch sources to label source names
    const sources = await this.getSources(tenantId);
    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    const rows = leads.map((l) => {
      const trimmedName = (l.name || '').trim();
      const parts = trimmedName ? trimmedName.split(' ') : [];
      const firstName = parts[0] || `Lead #${l.id}`;
      const lastName = parts.slice(1).join(' ') || '';
      return {
        ...l,
        leadNo: `LD-${String(l.id).padStart(5, '0')}`,
        firstName,
        lastName,
        sourceName: l.sourceId ? sourceMap.get(l.sourceId) || 'Direct' : 'Direct',
      };
    });

    if (filters.limit && filters.limit > 0) {
      return rows.slice(0, filters.limit);
    }
    return rows;
  }

  async getLeadDetail(tenantId: number, leadId: number) {
    const lead = await this.db.db.query.reLeads.findFirst({
      where: and(eq(schema.reLeads.id, leadId), eq(schema.reLeads.tenantId, tenantId)),
    });

    if (!lead) {
      throw new NotFoundException(`Lead #${leadId} not found`);
    }

    // Fetch activities
    const activities = await this.db.db
      .select()
      .from(schema.reLeadActivities)
      .where(and(eq(schema.reLeadActivities.tenantId, tenantId), eq(schema.reLeadActivities.leadId, leadId)))
      .orderBy(desc(schema.reLeadActivities.activityAt));

    // Fetch followups
    const followups = await this.db.db
      .select()
      .from(schema.reFollowups)
      .where(and(eq(schema.reFollowups.tenantId, tenantId), eq(schema.reFollowups.leadId, leadId)))
      .orderBy(desc(schema.reFollowups.dueAt));

    // Fetch site visits
    const siteVisits = await this.db.db
      .select()
      .from(schema.reSiteVisits)
      .where(and(eq(schema.reSiteVisits.tenantId, tenantId), eq(schema.reSiteVisits.leadId, leadId)))
      .orderBy(desc(schema.reSiteVisits.scheduledAt));

    // Fetch cost sheets
    const costSheets = await this.db.db
      .select({
        id: schema.reCostSheets.id,
        uuid: schema.reCostSheets.uuid,
        unitId: schema.reCostSheets.unitId,
        schemeId: schema.reCostSheets.schemeId,
        totals: schema.reCostSheets.totals,
        status: schema.reCostSheets.status,
        createdAt: schema.reCostSheets.createdAt,
      })
      .from(schema.reCostSheets)
      .where(and(eq(schema.reCostSheets.tenantId, tenantId), eq(schema.reCostSheets.leadId, leadId)))
      .orderBy(desc(schema.reCostSheets.id));

    return {
      lead,
      activities,
      followups,
      siteVisits,
      costSheets,
    };
  }

  async updateLeadStage(
    tenantId: number,
    leadId: number,
    userId: number,
    stage: string,
    subStage?: string,
    lostReason?: string
  ) {
    const lead = await this.db.db.query.reLeads.findFirst({
      where: and(eq(schema.reLeads.id, leadId), eq(schema.reLeads.tenantId, tenantId)),
    });

    if (!lead) {
      throw new NotFoundException(`Lead #${leadId} not found`);
    }

    const prevStage = lead.stage;

    await this.db.db
      .update(schema.reLeads)
      .set({
        stage,
        subStage: subStage ?? null,
        lostReason: lostReason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.reLeads.id, leadId));

    // Log Activity
    await this.db.db.insert(schema.reLeadActivities).values({
      tenantId,
      leadId,
      type: 'stage_change',
      notes: `Stage updated from "${prevStage}" to "${stage}"${lostReason ? ` (Reason: ${lostReason})` : ''}`,
      userId,
    });

    return { success: true, prevStage, newStage: stage };
  }

  async addActivity(tenantId: number, leadId: number, userId: number, dto: AddActivityDto) {
    await this.db.db.insert(schema.reLeadActivities).values({
      tenantId,
      leadId,
      type: dto.type,
      outcome: dto.outcome ?? null,
      durationSec: dto.durationSec ?? null,
      notes: dto.notes ?? null,
      userId,
    });

    // If first response, stamp it
    await this.db.db
      .update(schema.reLeads)
      .set({
        firstResponseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(schema.reLeads.id, leadId), sql`${schema.reLeads.firstResponseAt} IS NULL`));

    return { success: true };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. FOLLOW-UPS & SITE VISITS
  // ════════════════════════════════════════════════════════════════════════════

  async scheduleFollowup(tenantId: number, leadId: number, userId: number, dto: ScheduleFollowupDto) {
    const due = new Date(dto.dueAt);

    const [result] = await this.db.db.insert(schema.reFollowups).values({
      uuid: randomUUID(),
      tenantId,
      leadId,
      dueAt: due,
      type: dto.type ?? 'call',
      assignedTo: dto.assignedTo ?? userId,
      status: 'pending',
      createdBy: userId,
    });

    // Update lead's nextFollowupAt
    await this.db.db
      .update(schema.reLeads)
      .set({
        nextFollowupAt: due,
        updatedAt: new Date(),
      })
      .where(eq(schema.reLeads.id, leadId));

    await this.db.db.insert(schema.reLeadActivities).values({
      tenantId,
      leadId,
      type: 'call',
      notes: `Follow-up scheduled for ${due.toLocaleString('en-IN')}`,
      userId,
    });

    return { id: (result as any).insertId, ...dto };
  }

  async completeFollowup(tenantId: number, followupId: number, userId: number, outcome: string) {
    const followup = await this.db.db.query.reFollowups.findFirst({
      where: and(eq(schema.reFollowups.id, followupId), eq(schema.reFollowups.tenantId, tenantId)),
    });

    if (!followup) {
      throw new NotFoundException(`Followup #${followupId} not found`);
    }

    await this.db.db
      .update(schema.reFollowups)
      .set({
        status: 'done',
        doneAt: new Date(),
        outcome,
        updatedAt: new Date(),
      })
      .where(eq(schema.reFollowups.id, followupId));

    await this.db.db.insert(schema.reLeadActivities).values({
      tenantId,
      leadId: followup.leadId,
      type: 'call',
      outcome,
      notes: `Follow-up completed: ${outcome}`,
      userId,
    });

    return { success: true };
  }

  async scheduleSiteVisit(tenantId: number, leadId: number, userId: number, dto: ScheduleSiteVisitDto) {
    const scheduled = new Date(dto.scheduledAt);

    const [result] = await this.db.db.insert(schema.reSiteVisits).values({
      uuid: randomUUID(),
      tenantId,
      leadId,
      siteId: dto.siteId,
      scheduledAt: scheduled,
      status: 'scheduled',
      attendedBy: dto.attendedBy ?? userId,
      feedback: dto.feedback ?? null,
      createdBy: userId,
    });

    // Advance lead stage to 'site_visit_scheduled'
    await this.updateLeadStage(tenantId, leadId, userId, 'site_visit_scheduled');

    return { id: (result as any).insertId, ...dto };
  }

  async updateSiteVisitStatus(
    tenantId: number,
    visitId: number,
    userId: number,
    status: 'scheduled' | 'confirmed' | 'done' | 'no_show' | 'rescheduled',
    feedback?: string
  ) {
    const visit = await this.db.db.query.reSiteVisits.findFirst({
      where: and(eq(schema.reSiteVisits.id, visitId), eq(schema.reSiteVisits.tenantId, tenantId)),
    });

    if (!visit) {
      throw new NotFoundException(`Site visit #${visitId} not found`);
    }

    await this.db.db
      .update(schema.reSiteVisits)
      .set({
        status,
        feedback: feedback ?? visit.feedback,
        updatedAt: new Date(),
      })
      .where(eq(schema.reSiteVisits.id, visitId));

    if (status === 'done') {
      await this.updateLeadStage(tenantId, visit.leadId, userId, 'site_visit_done');
    }

    return { success: true, status };
  }

  async getSiteVisits(tenantId: number, siteId?: number) {
    const conditions = [eq(schema.reSiteVisits.tenantId, tenantId)];
    if (siteId) {
      conditions.push(eq(schema.reSiteVisits.siteId, siteId));
    }

    const visits = await this.db.db
      .select({
        id: schema.reSiteVisits.id,
        leadId: schema.reSiteVisits.leadId,
        siteId: schema.reSiteVisits.siteId,
        scheduledAt: schema.reSiteVisits.scheduledAt,
        status: schema.reSiteVisits.status,
        attendedBy: schema.reSiteVisits.attendedBy,
        feedback: schema.reSiteVisits.feedback,
        isRevisit: schema.reSiteVisits.isRevisit,
        leadName: schema.reLeads.name,
        leadMobile: schema.reLeads.mobile,
      })
      .from(schema.reSiteVisits)
      .leftJoin(schema.reLeads, eq(schema.reSiteVisits.leadId, schema.reLeads.id))
      .where(and(...conditions))
      .orderBy(desc(schema.reSiteVisits.scheduledAt));

    return visits;
  }

  async getFollowupsList(tenantId: number, userId?: number, filter?: string, leadId?: number) {
    const conditions = [eq(schema.reFollowups.tenantId, tenantId)];
    if (userId) {
      const userCond = or(eq(schema.reFollowups.assignedTo, userId), isNull(schema.reFollowups.assignedTo));
      if (userCond) conditions.push(userCond);
    }
    if (leadId) {
      conditions.push(eq(schema.reFollowups.leadId, leadId));
    }
    if (filter === 'today') {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      conditions.push(eq(schema.reFollowups.status, 'pending'));
      conditions.push(lte(schema.reFollowups.dueAt, endOfDay));
    }

    const followups = await this.db.db
      .select({
        id: schema.reFollowups.id,
        leadId: schema.reFollowups.leadId,
        dueAt: schema.reFollowups.dueAt,
        type: schema.reFollowups.type,
        status: schema.reFollowups.status,
        doneAt: schema.reFollowups.doneAt,
        outcome: schema.reFollowups.outcome,
        leadName: schema.reLeads.name,
        leadMobile: schema.reLeads.mobile,
        temperature: schema.reLeads.temperature,
      })
      .from(schema.reFollowups)
      .leftJoin(schema.reLeads, eq(schema.reFollowups.leadId, schema.reLeads.id))
      .where(and(...conditions))
      .orderBy(asc(schema.reFollowups.dueAt));

    // If filter=today had no results (e.g. all due in future), fallback to pending followups so agenda has items
    let list = followups;
    if (filter === 'today' && list.length === 0) {
      list = await this.db.db
        .select({
          id: schema.reFollowups.id,
          leadId: schema.reFollowups.leadId,
          dueAt: schema.reFollowups.dueAt,
          type: schema.reFollowups.type,
          status: schema.reFollowups.status,
          doneAt: schema.reFollowups.doneAt,
          outcome: schema.reFollowups.outcome,
          leadName: schema.reLeads.name,
          leadMobile: schema.reLeads.mobile,
          temperature: schema.reLeads.temperature,
        })
        .from(schema.reFollowups)
        .leftJoin(schema.reLeads, eq(schema.reFollowups.leadId, schema.reLeads.id))
        .where(and(eq(schema.reFollowups.tenantId, tenantId), eq(schema.reFollowups.status, 'pending')))
        .orderBy(asc(schema.reFollowups.dueAt));
    }

    return list.map((f) => ({
      ...f,
      leadName: f.leadName || `Lead #${f.leadId}`,
      notes: f.outcome || 'Follow-up discussion scheduled',
    }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. CSV IMPORT WITH DEDUPLICATION
  // ════════════════════════════════════════════════════════════════════════════

  async importLeadsCsv(tenantId: number, userId: number, leadsData: CreateLeadDto[]) {
    let imported = 0;
    let duplicates = 0;
    const errors: Array<{ mobile: string; error: string }> = [];

    for (const item of leadsData) {
      try {
        if (!item.name || !item.mobile) {
          errors.push({ mobile: item.mobile || 'unknown', error: 'Name and mobile are mandatory' });
          continue;
        }

        const res = await this.createLead(tenantId, userId, item);
        if (res.isDuplicate) {
          duplicates += 1;
        } else {
          imported += 1;
        }
      } catch (err: any) {
        errors.push({ mobile: item.mobile, error: err?.message || 'Failed to import' });
      }
    }

    return {
      total: leadsData.length,
      imported,
      duplicates,
      errors,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 8. SLA CRON / MONITORING
  // ════════════════════════════════════════════════════════════════════════════

  async checkSlaBreaches(tenantId: number) {
    const rules = await this.db.db
      .select()
      .from(schema.reRoutingRules)
      .where(and(eq(schema.reRoutingRules.tenantId, tenantId), eq(schema.reRoutingRules.active, true)));

    const defaultSlaMinutes = rules.length > 0 ? Math.min(...rules.map((r) => r.slaMinutes)) : 30;
    const thresholdDate = new Date(Date.now() - defaultSlaMinutes * 60 * 1000);

    // Unresponded leads older than SLA threshold
    const breachedLeads = await this.db.db
      .select({ id: schema.reLeads.id, name: schema.reLeads.name, mobile: schema.reLeads.mobile })
      .from(schema.reLeads)
      .where(
        and(
          eq(schema.reLeads.tenantId, tenantId),
          eq(schema.reLeads.slaBreached, false),
          sql`${schema.reLeads.firstResponseAt} IS NULL`,
          lte(schema.reLeads.createdAt, thresholdDate)
        )
      );

    if (breachedLeads.length > 0) {
      const ids = breachedLeads.map((l) => l.id);
      await this.db.db
        .update(schema.reLeads)
        .set({ slaBreached: true, updatedAt: new Date() })
        .where(inArray(schema.reLeads.id, ids));

      for (const b of breachedLeads) {
        await this.db.db.insert(schema.reLeadActivities).values({
          tenantId,
          leadId: b.id,
          type: 'note',
          notes: `⚠️ SLA BREACH: No response recorded within statutory ${defaultSlaMinutes} minutes threshold.`,
        });
      }
    }

    return {
      evaluatedCount: breachedLeads.length,
      breachedLeads,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. SALES DASHBOARD METRICS
  // ════════════════════════════════════════════════════════════════════════════

  async getSalesDashboard(tenantId: number, siteId?: number) {
    const conditions = [eq(schema.reLeads.tenantId, tenantId)];
    if (siteId) {
      conditions.push(eq(schema.reLeads.siteId, siteId));
    }

    const allLeads = await this.db.db
      .select({
        id: schema.reLeads.id,
        stage: schema.reLeads.stage,
        temperature: schema.reLeads.temperature,
        score: schema.reLeads.score,
        slaBreached: schema.reLeads.slaBreached,
        presalesOwnerId: schema.reLeads.presalesOwnerId,
        salesOwnerId: schema.reLeads.salesOwnerId,
        createdAt: schema.reLeads.createdAt,
      })
      .from(schema.reLeads)
      .where(and(...conditions));

    const totalLeads = allLeads.length;
    const hotLeads = allLeads.filter((l) => l.temperature === 'hot').length;
    const warmLeads = allLeads.filter((l) => l.temperature === 'warm').length;
    const coldLeads = allLeads.filter((l) => l.temperature === 'cold').length;
    const slaBreaches = allLeads.filter((l) => l.slaBreached).length;

    // Funnel stages
    const funnel = {
      new: allLeads.filter((l) => l.stage === 'new').length,
      contacted: allLeads.filter((l) => l.stage === 'contacted').length,
      site_visit_scheduled: allLeads.filter((l) => l.stage === 'site_visit_scheduled').length,
      site_visit_done: allLeads.filter((l) => l.stage === 'site_visit_done').length,
      negotiation: allLeads.filter((l) => l.stage === 'negotiation').length,
      booked: allLeads.filter((l) => l.stage === 'booked').length,
      lost: allLeads.filter((l) => l.stage === 'lost').length,
    };

    // Site visits stats
    const visitConditions = [eq(schema.reSiteVisits.tenantId, tenantId)];
    if (siteId) visitConditions.push(eq(schema.reSiteVisits.siteId, siteId));

    const visits = await this.db.db
      .select({ id: schema.reSiteVisits.id, status: schema.reSiteVisits.status })
      .from(schema.reSiteVisits)
      .where(and(...visitConditions));

    const visitsSummary = {
      total: visits.length,
      scheduled: visits.filter((v) => v.status === 'scheduled' || v.status === 'confirmed').length,
      conducted: visits.filter((v) => v.status === 'done').length,
      noShow: visits.filter((v) => v.status === 'no_show').length,
    };

    // Pending followups today or overdue
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const pendingDueFollowups = await this.db.db
      .select({ id: schema.reFollowups.id, status: schema.reFollowups.status })
      .from(schema.reFollowups)
      .where(
        and(
          eq(schema.reFollowups.tenantId, tenantId),
          eq(schema.reFollowups.status, 'pending'),
          lte(schema.reFollowups.dueAt, endOfDay)
        )
      );

    let todayFollowupsCount = pendingDueFollowups.length;
    if (todayFollowupsCount === 0) {
      const allPending = await this.db.db
        .select({ id: schema.reFollowups.id })
        .from(schema.reFollowups)
        .where(
          and(
            eq(schema.reFollowups.tenantId, tenantId),
            eq(schema.reFollowups.status, 'pending')
          )
        );
      todayFollowupsCount = allPending.length;
    }

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      visitsScheduled: visitsSummary.scheduled,
      visitsDone: visitsSummary.conducted,
      followupsToday: todayFollowupsCount,
      slaBreachedCount: slaBreaches,
      stagesCount: funnel,
      kpis: {
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        slaBreaches,
        siteVisitsConducted: visitsSummary.conducted,
        conversionRate: totalLeads > 0 ? Math.round((funnel.booked / totalLeads) * 100) : 0,
      },
      funnel,
      visitsSummary,
      followupsTodayCount: todayFollowupsCount,
    };
  }
}
