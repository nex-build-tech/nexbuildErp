import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, desc, asc, inArray, sql, gte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { randomUUID } from 'crypto';

export interface RegisterCpDto {
  firmName: string;
  contactPerson?: string | undefined;
  mobile: string;
  email?: string | undefined;
  reraNo?: string | undefined;
  pan?: string | undefined;
  gstin?: string | undefined;
  bankDetails?: {
    accountNo?: string | undefined;
    ifsc?: string | undefined;
    bankName?: string | undefined;
    branch?: string | undefined;
    accountHolder?: string | undefined;
  } | undefined;
  agreementAccepted?: boolean | undefined;
}

export interface TagLeadDto {
  cpId: number;
  name: string;
  mobile: string;
  email?: string | undefined;
  siteId?: number | undefined;
  configPref?: string | undefined;
  budgetMax?: number | undefined;
  notes?: string | undefined;
  evidence?: string | undefined;
}

export interface CreateSlabDto {
  siteId: number;
  tier: 'silver' | 'gold' | 'platinum';
  fromCount: number;
  toCount?: number | undefined;
  pct: number;
}

@Injectable()
export class ChannelPartnersService {
  constructor(private readonly db: DatabaseService) {}

  // ════════════════════════════════════════════════════════════════════════════
  // 1. PUBLIC REGISTRATION & CP PROFILE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  async registerPublicCp(tenantId: number, dto: RegisterCpDto, ipAddress?: string) {
    if (!dto.firmName || !dto.mobile) {
      throw new BadRequestException('Firm name and mobile number are mandatory');
    }

    const existing = await this.db.db.query.reChannelPartners.findFirst({
      where: and(
        eq(schema.reChannelPartners.tenantId, tenantId),
        eq(schema.reChannelPartners.mobile, dto.mobile),
      ),
    });

    if (existing) {
      throw new ConflictException('A Channel Partner is already registered with this mobile number');
    }

    const uuid = randomUUID();
    const [result] = await this.db.db.insert(schema.reChannelPartners).values({
      uuid,
      tenantId,
      firmName: dto.firmName,
      contactPerson: dto.contactPerson ?? null,
      mobile: dto.mobile,
      email: dto.email ?? null,
      reraNo: dto.reraNo ?? null,
      pan: dto.pan ? dto.pan.toUpperCase() : null,
      gstin: dto.gstin ? dto.gstin.toUpperCase() : null,
      bankDetails: dto.bankDetails ? (dto.bankDetails as any) : null,
      status: 'pending_kyc',
      tier: 'silver',
      agreementAcceptedAt: dto.agreementAccepted ? new Date() : null,
      agreementIp: ipAddress ?? null,
    });

    const cpId = (result as any).insertId;

    const site = await this.db.db.query.sites.findFirst({
      where: and(eq(schema.sites.tenantId, tenantId), eq(schema.sites.code, 'SITE-KH')),
    });
    if (site) {
      await this.db.db.insert(schema.reCpProjectAccess).values({
        cpId,
        siteId: site.id,
      });
    }

    return {
      id: cpId,
      uuid,
      firmName: dto.firmName,
      status: 'pending_kyc',
      message: 'Registration submitted successfully. Awaiting KYC approval from developer.',
    };
  }

  async getChannelPartners(
    tenantId: number,
    filter?: { status?: string | undefined; tier?: string | undefined; search?: string | undefined },
  ) {
    const conditions = [eq(schema.reChannelPartners.tenantId, tenantId)];

    if (filter?.status) {
      conditions.push(eq(schema.reChannelPartners.status, filter.status as any));
    }
    if (filter?.tier) {
      conditions.push(eq(schema.reChannelPartners.tier, filter.tier as any));
    }

    const partners = await this.db.db
      .select({
        id: schema.reChannelPartners.id,
        uuid: schema.reChannelPartners.uuid,
        firmName: schema.reChannelPartners.firmName,
        contactPerson: schema.reChannelPartners.contactPerson,
        mobile: schema.reChannelPartners.mobile,
        email: schema.reChannelPartners.email,
        reraNo: schema.reChannelPartners.reraNo,
        pan: schema.reChannelPartners.pan,
        gstin: schema.reChannelPartners.gstin,
        status: schema.reChannelPartners.status,
        tier: schema.reChannelPartners.tier,
        createdAt: schema.reChannelPartners.createdAt,
      })
      .from(schema.reChannelPartners)
      .where(and(...conditions))
      .orderBy(desc(schema.reChannelPartners.id));

    return partners;
  }

  async getChannelPartnerDetail(tenantId: number, id: number) {
    const partner = await this.db.db.query.reChannelPartners.findFirst({
      where: and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.id, id)),
    });

    if (!partner) {
      throw new NotFoundException(`Channel Partner #${id} not found`);
    }

    const projectAccess = await this.db.db
      .select({
        siteId: schema.reCpProjectAccess.siteId,
        siteName: schema.sites.name,
      })
      .from(schema.reCpProjectAccess)
      .leftJoin(schema.sites, eq(schema.reCpProjectAccess.siteId, schema.sites.id))
      .where(eq(schema.reCpProjectAccess.cpId, id));

    const taggedLeads = await this.db.db
      .select({
        id: schema.reCpLeadTags.id,
        leadId: schema.reCpLeadTags.leadId,
        taggedAt: schema.reCpLeadTags.taggedAt,
        validTill: schema.reCpLeadTags.validTill,
        status: schema.reCpLeadTags.status,
        name: schema.reLeads.name,
        mobile: schema.reLeads.mobile,
        stage: schema.reLeads.stage,
      })
      .from(schema.reCpLeadTags)
      .leftJoin(schema.reLeads, eq(schema.reCpLeadTags.leadId, schema.reLeads.id))
      .where(and(eq(schema.reCpLeadTags.tenantId, tenantId), eq(schema.reCpLeadTags.cpId, id)))
      .orderBy(desc(schema.reCpLeadTags.taggedAt));

    const brokerageEntries = await this.db.db
      .select({
        id: schema.reBrokerageEntries.id,
        uuid: schema.reBrokerageEntries.uuid,
        bookingId: schema.reBrokerageEntries.bookingId,
        base: schema.reBrokerageEntries.base,
        pct: schema.reBrokerageEntries.pct,
        brokerage: schema.reBrokerageEntries.brokerage,
        gst: schema.reBrokerageEntries.gst,
        tds194h: schema.reBrokerageEntries.tds194h,
        net: schema.reBrokerageEntries.net,
        status: schema.reBrokerageEntries.status,
        createdAt: schema.reBrokerageEntries.createdAt,
      })
      .from(schema.reBrokerageEntries)
      .where(and(eq(schema.reBrokerageEntries.tenantId, tenantId), eq(schema.reBrokerageEntries.cpId, id)))
      .orderBy(desc(schema.reBrokerageEntries.id));

    return {
      partner,
      projectAccess,
      taggedLeads,
      brokerageEntries,
    };
  }

  async updateKycStatus(tenantId: number, id: number, status: 'active' | 'suspended' | 'pending_kyc') {
    const existing = await this.db.db.query.reChannelPartners.findFirst({
      where: and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.id, id)),
    });
    if (!existing) {
      throw new NotFoundException(`Channel Partner #${id} not found`);
    }

    await this.db.db
      .update(schema.reChannelPartners)
      .set({ status })
      .where(eq(schema.reChannelPartners.id, id));

    return { id, status, updated: true };
  }

  async updateTier(tenantId: number, id: number, tier: 'silver' | 'gold' | 'platinum') {
    const existing = await this.db.db.query.reChannelPartners.findFirst({
      where: and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.id, id)),
    });
    if (!existing) {
      throw new NotFoundException(`Channel Partner #${id} not found`);
    }

    await this.db.db
      .update(schema.reChannelPartners)
      .set({ tier })
      .where(eq(schema.reChannelPartners.id, id));

    return { id, tier, updated: true };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. LEAD TAGGING & PROTECTION WINDOW ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  async tagLead(tenantId: number, userId: number, dto: TagLeadDto) {
    const cleanMobile = dto.mobile.replace(/[^0-9]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      throw new BadRequestException('Valid 10-digit mobile number required');
    }

    const cp = await this.db.db.query.reChannelPartners.findFirst({
      where: and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.id, dto.cpId)),
    });
    if (!cp) {
      throw new NotFoundException(`Channel Partner #${dto.cpId} not found`);
    }
    if (cp.status !== 'active') {
      throw new BadRequestException('Channel Partner account is not active (KYC pending or suspended)');
    }

    const now = new Date();

    const existingTags = await this.db.db
      .select({
        id: schema.reCpLeadTags.id,
        cpId: schema.reCpLeadTags.cpId,
        validTill: schema.reCpLeadTags.validTill,
        status: schema.reCpLeadTags.status,
        firmName: schema.reChannelPartners.firmName,
      })
      .from(schema.reCpLeadTags)
      .innerJoin(schema.reLeads, eq(schema.reCpLeadTags.leadId, schema.reLeads.id))
      .leftJoin(schema.reChannelPartners, eq(schema.reCpLeadTags.cpId, schema.reChannelPartners.id))
      .where(
        and(
          eq(schema.reCpLeadTags.tenantId, tenantId),
          eq(schema.reLeads.mobile, cleanMobile),
          eq(schema.reCpLeadTags.status, 'active'),
          gte(schema.reCpLeadTags.validTill, now),
        ),
      );

    if (existingTags.length > 0) {
      const activeTag = existingTags[0]!;
      if (activeTag.cpId === dto.cpId) {
        throw new ConflictException('You have already tagged this lead. Protection window is currently active.');
      } else {
        throw new ConflictException(
          `Lead is already registered and protected by another Channel Partner (${activeTag.firmName}) until ${activeTag.validTill ? new Date(activeTag.validTill).toLocaleDateString() : 'expiry'}.`,
        );
      }
    }

    let lead = await this.db.db.query.reLeads.findFirst({
      where: and(eq(schema.reLeads.tenantId, tenantId), eq(schema.reLeads.mobile, cleanMobile)),
    });

    if (lead) {
      if (lead.stage === 'booked' || lead.stage === 'negotiation') {
        throw new ConflictException(
          `Client is already in direct negotiation or booked with Kings Heights sales office and cannot be tagged.`,
        );
      }
      await this.db.db
        .update(schema.reLeads)
        .set({
          cpId: dto.cpId,
          score: Math.min((lead.score || 20) + 15, 100),
          temperature: 'hot',
        })
        .where(eq(schema.reLeads.id, lead.id));
    } else {
      const [insertLeadRes] = await this.db.db.insert(schema.reLeads).values({
        uuid: randomUUID(),
        tenantId,
        siteId: dto.siteId ?? 1,
        name: dto.name,
        mobile: cleanMobile,
        email: dto.email ?? null,
        cpId: dto.cpId,
        stage: 'new',
        score: 75,
        temperature: 'hot',
        configPref: dto.configPref ?? '2 BHK',
        budgetMax: dto.budgetMax ? dto.budgetMax.toString() : null,
        createdBy: userId,
      });
      const newLeadId = (insertLeadRes as any).insertId;
      lead = { id: newLeadId, name: dto.name, mobile: cleanMobile } as any;
    }

    const validTill = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const [tagRes] = await this.db.db.insert(schema.reCpLeadTags).values({
      tenantId,
      leadId: lead!.id,
      cpId: dto.cpId,
      taggedAt: now,
      validTill,
      status: 'active',
      evidence: dto.evidence ?? 'Registered via CP Partner Desk',
      createdBy: userId,
    });

    return {
      tagId: (tagRes as any).insertId,
      leadId: lead!.id,
      name: (lead as any).name,
      mobile: cleanMobile,
      validTill,
      daysProtected: 60,
      status: 'active',
    };
  }

  async getCpLeads(tenantId: number, cpId: number) {
    const tags = await this.db.db
      .select({
        tagId: schema.reCpLeadTags.id,
        leadId: schema.reCpLeadTags.leadId,
        taggedAt: schema.reCpLeadTags.taggedAt,
        validTill: schema.reCpLeadTags.validTill,
        status: schema.reCpLeadTags.status,
        name: schema.reLeads.name,
        mobile: schema.reLeads.mobile,
        stage: schema.reLeads.stage,
        score: schema.reLeads.score,
        temperature: schema.reLeads.temperature,
        configPref: schema.reLeads.configPref,
        budgetMax: schema.reLeads.budgetMax,
      })
      .from(schema.reCpLeadTags)
      .innerJoin(schema.reLeads, eq(schema.reCpLeadTags.leadId, schema.reLeads.id))
      .where(and(eq(schema.reCpLeadTags.tenantId, tenantId), eq(schema.reCpLeadTags.cpId, cpId)))
      .orderBy(desc(schema.reCpLeadTags.taggedAt));

    const now = Date.now();
    return tags.map((t) => {
      const expiry = t.validTill ? new Date(t.validTill).getTime() : now;
      const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      return {
        ...t,
        daysRemaining,
        isExpired: daysRemaining === 0 && t.status === 'active',
      };
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. BROKERAGE SLABS & STATUTORY 194-H TDS ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  calculateBrokerageCalculation(
    agreementValue: number,
    pct: number,
    hasGstin: boolean = false,
  ) {
    const base = agreementValue;
    const brokerage = Math.round(base * (pct / 100) * 100) / 100;
    const gst = hasGstin ? Math.round(brokerage * 0.18 * 100) / 100 : 0;
    const tds194h = Math.round(brokerage * 0.05 * 100) / 100;
    const net = Math.round((brokerage + gst - tds194h) * 100) / 100;

    return {
      base,
      pct,
      brokerage,
      gst,
      tds194h,
      net,
    };
  }

  async getBrokerageSlabs(tenantId: number, siteId?: number | undefined) {
    const conditions = [eq(schema.reBrokerageSlabs.tenantId, tenantId)];
    if (siteId) {
      conditions.push(eq(schema.reBrokerageSlabs.siteId, siteId));
    }
    return this.db.db
      .select()
      .from(schema.reBrokerageSlabs)
      .where(and(...conditions))
      .orderBy(asc(schema.reBrokerageSlabs.tier), asc(schema.reBrokerageSlabs.fromCount));
  }

  async createBrokerageSlab(tenantId: number, userId: number, dto: CreateSlabDto) {
    const [result] = await this.db.db.insert(schema.reBrokerageSlabs).values({
      uuid: randomUUID(),
      tenantId,
      siteId: dto.siteId,
      tier: dto.tier,
      fromCount: dto.fromCount,
      toCount: dto.toCount ?? null,
      pct: dto.pct.toString(),
      createdBy: userId,
    });
    return { id: (result as any).insertId, ...dto };
  }

  async getBrokerageEntries(
    tenantId: number,
    filter?: { cpId?: number | undefined; status?: string | undefined; bookingId?: number | undefined },
  ) {
    const conditions = [eq(schema.reBrokerageEntries.tenantId, tenantId)];
    if (filter?.cpId) {
      conditions.push(eq(schema.reBrokerageEntries.cpId, filter.cpId));
    }
    if (filter?.status) {
      conditions.push(eq(schema.reBrokerageEntries.status, filter.status as any));
    }
    if (filter?.bookingId) {
      conditions.push(eq(schema.reBrokerageEntries.bookingId, filter.bookingId));
    }

    const entries = await this.db.db
      .select({
        id: schema.reBrokerageEntries.id,
        uuid: schema.reBrokerageEntries.uuid,
        bookingId: schema.reBrokerageEntries.bookingId,
        cpId: schema.reBrokerageEntries.cpId,
        cpFirmName: schema.reChannelPartners.firmName,
        cpTier: schema.reChannelPartners.tier,
        cpGstin: schema.reChannelPartners.gstin,
        bookingNo: schema.reBookings.bookingNo,
        customerName: sql<string>`concat(${schema.reBookingApplicants.firstName}, ' ', coalesce(${schema.reBookingApplicants.lastName}, ''))`,
        base: schema.reBrokerageEntries.base,
        pct: schema.reBrokerageEntries.pct,
        brokerage: schema.reBrokerageEntries.brokerage,
        gst: schema.reBrokerageEntries.gst,
        tds194h: schema.reBrokerageEntries.tds194h,
        net: schema.reBrokerageEntries.net,
        status: schema.reBrokerageEntries.status,
        eligibleRule: schema.reBrokerageEntries.eligibleRule,
        createdAt: schema.reBrokerageEntries.createdAt,
      })
      .from(schema.reBrokerageEntries)
      .leftJoin(schema.reChannelPartners, eq(schema.reBrokerageEntries.cpId, schema.reChannelPartners.id))
      .leftJoin(schema.reBookings, eq(schema.reBrokerageEntries.bookingId, schema.reBookings.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary'),
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reBrokerageEntries.id));

    return entries;
  }

  async approveBrokerageEntry(tenantId: number, entryId: number) {
    const entry = await this.db.db.query.reBrokerageEntries.findFirst({
      where: and(eq(schema.reBrokerageEntries.tenantId, tenantId), eq(schema.reBrokerageEntries.id, entryId)),
    });
    if (!entry) {
      throw new NotFoundException(`Brokerage entry #${entryId} not found`);
    }

    await this.db.db
      .update(schema.reBrokerageEntries)
      .set({ status: 'approved' })
      .where(eq(schema.reBrokerageEntries.id, entryId));

    return { id: entryId, status: 'approved' };
  }

  async disbursePayout(
    tenantId: number,
    userId: number,
    dto: { entryId: number; bankRef?: string | undefined },
  ) {
    const entry = await this.db.db.query.reBrokerageEntries.findFirst({
      where: and(eq(schema.reBrokerageEntries.tenantId, tenantId), eq(schema.reBrokerageEntries.id, dto.entryId)),
    });
    if (!entry) {
      throw new NotFoundException(`Brokerage entry #${dto.entryId} not found`);
    }

    const [payoutRes] = await this.db.db.insert(schema.reCpPayouts).values({
      uuid: randomUUID(),
      tenantId,
      cpId: entry.cpId,
      payoutDate: new Date(),
      amount: entry.brokerage,
      tds: entry.tds194h,
      netPaid: entry.net,
      bankRef: dto.bankRef ?? `NEFT-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'paid',
      createdBy: userId,
    });

    await this.db.db
      .update(schema.reBrokerageEntries)
      .set({ status: 'paid' })
      .where(eq(schema.reBrokerageEntries.id, dto.entryId));

    return {
      payoutId: (payoutRes as any).insertId,
      entryId: dto.entryId,
      netPaid: entry.net,
      status: 'paid',
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. LEADERBOARD & PERFORMANCE RANKING
  // ════════════════════════════════════════════════════════════════════════════

  async getLeaderboard(tenantId: number) {
    const cps = await this.db.db
      .select({
        id: schema.reChannelPartners.id,
        firmName: schema.reChannelPartners.firmName,
        contactPerson: schema.reChannelPartners.contactPerson,
        tier: schema.reChannelPartners.tier,
        status: schema.reChannelPartners.status,
      })
      .from(schema.reChannelPartners)
      .where(and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.status, 'active')));

    const leaderboard = await Promise.all(
      cps.map(async (cp) => {
        const tags = await this.db.db
          .select({ count: sql<number>`count(*)` })
          .from(schema.reCpLeadTags)
          .where(and(eq(schema.reCpLeadTags.tenantId, tenantId), eq(schema.reCpLeadTags.cpId, cp.id)));

        const brokerage = await this.db.db
          .select({
            totalBookings: sql<number>`count(*)`,
            totalValue: sql<number>`coalesce(sum(${schema.reBrokerageEntries.base}), 0)`,
            totalBrokerage: sql<number>`coalesce(sum(${schema.reBrokerageEntries.brokerage}), 0)`,
            paidBrokerage: sql<number>`coalesce(sum(case when ${schema.reBrokerageEntries.status} = 'paid' then ${schema.reBrokerageEntries.net} else 0 end), 0)`,
          })
          .from(schema.reBrokerageEntries)
          .where(and(eq(schema.reBrokerageEntries.tenantId, tenantId), eq(schema.reBrokerageEntries.cpId, cp.id)));

        return {
          cpId: cp.id,
          firmName: cp.firmName,
          contactPerson: cp.contactPerson,
          tier: cp.tier,
          leadsTagged: Number(tags[0]?.count || 0),
          dealsClosed: Number(brokerage[0]?.totalBookings || 0),
          totalSalesValue: Number(brokerage[0]?.totalValue || 0),
          totalBrokerageEarned: Number(brokerage[0]?.totalBrokerage || 0),
          totalBrokeragePaid: Number(brokerage[0]?.paidBrokerage || 0),
        };
      }),
    );

    return leaderboard.sort((a, b) => b.totalSalesValue - a.totalSalesValue);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. CP PORTAL SCOPED INVENTORY & PARTNER DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════

  async getCpDashboardMetrics(tenantId: number, cpId: number) {
    const cp = await this.db.db.query.reChannelPartners.findFirst({
      where: and(eq(schema.reChannelPartners.tenantId, tenantId), eq(schema.reChannelPartners.id, cpId)),
    });
    if (!cp) {
      throw new NotFoundException(`Channel Partner #${cpId} not found`);
    }

    const now = new Date();

    const activeTags = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reCpLeadTags)
      .where(
        and(
          eq(schema.reCpLeadTags.tenantId, tenantId),
          eq(schema.reCpLeadTags.cpId, cpId),
          eq(schema.reCpLeadTags.status, 'active'),
          gte(schema.reCpLeadTags.validTill, now),
        ),
      );

    const brokerageStats = await this.db.db
      .select({
        totalDeals: sql<number>`count(*)`,
        accrued: sql<number>`coalesce(sum(${schema.reBrokerageEntries.net}), 0)`,
        paid: sql<number>`coalesce(sum(case when ${schema.reBrokerageEntries.status} = 'paid' then ${schema.reBrokerageEntries.net} else 0 end), 0)`,
      })
      .from(schema.reBrokerageEntries)
      .where(and(eq(schema.reBrokerageEntries.tenantId, tenantId), eq(schema.reBrokerageEntries.cpId, cpId)));

    return {
      partner: {
        id: cp.id,
        firmName: cp.firmName,
        tier: cp.tier,
        reraNo: cp.reraNo,
        status: cp.status,
      },
      activeLeadsProtected: Number(activeTags[0]?.count || 0),
      dealsClosed: Number(brokerageStats[0]?.totalDeals || 0),
      accruedCommission: Number(brokerageStats[0]?.accrued || 0),
      paidCommission: Number(brokerageStats[0]?.paid || 0),
    };
  }

  async getScopedInventory(tenantId: number, siteId?: number | undefined) {
    const conditions = [
      eq(schema.reUnits.tenantId, tenantId),
      inArray(schema.reUnits.status, ['available', 'hold']),
    ];
    if (siteId) {
      conditions.push(eq(schema.reUnits.siteId, siteId));
    }

    const units = await this.db.db
      .select({
        id: schema.reUnits.id,
        unitNo: schema.reUnits.unitNo,
        carpetArea: schema.reUnits.carpetArea,
        status: schema.reUnits.status,
        unitTypeName: schema.reUnitTypes.name,
        wingName: schema.reWings.name,
      })
      .from(schema.reUnits)
      .leftJoin(schema.reUnitTypes, eq(schema.reUnits.unitTypeId, schema.reUnitTypes.id))
      .leftJoin(schema.reWings, eq(schema.reUnits.wingId, schema.reWings.id))
      .where(and(...conditions))
      .orderBy(asc(schema.reUnits.unitNo))
      .limit(100);

    return units.map((u) => {
      const carpet = Number(u.carpetArea || 650);
      const estPrice = Math.round(carpet * 11500 + 400000);
      return {
        id: u.id,
        unitNo: u.unitNo,
        wing: u.wingName || 'Tower A',
        type: u.unitTypeName || '2 BHK',
        carpetSqFt: carpet,
        indicativePrice: estPrice,
        status: u.status,
      };
    });
  }
}
