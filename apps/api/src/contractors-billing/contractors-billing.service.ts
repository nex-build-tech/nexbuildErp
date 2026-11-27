import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  workOrders,
  woItems,
  raBills,
  measurementSheets,
  documentSeries,
  contractors,
  sites,
  users,
} from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { numberToIndianWords } from '@builderp/shared';

@Injectable()
export class ContractorsBillingService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ── HELPER: ALLOCATE NEXT DOCUMENT NUMBER ──────────────────────────────────
  private async getNextDocumentNumber(tenantId: number, docType: string, prefixDefault: string): Promise<string> {
    const fy = '26-27';
    let [series] = await this.databaseService.db
      .select()
      .from(documentSeries)
      .where(
        and(
          eq(documentSeries.tenantId, tenantId),
          eq(documentSeries.documentType, docType),
          eq(documentSeries.financialYear, fy)
        )
      )
      .limit(1);

    if (!series) {
      const uuid = uuidv4();
      await this.databaseService.db.insert(documentSeries).values({
        uuid,
        tenantId,
        documentType: docType,
        prefix: prefixDefault,
        financialYear: fy,
        nextNumber: 1,
        padding: 4,
      });
      const [newSeries] = await this.databaseService.db
        .select()
        .from(documentSeries)
        .where(
          and(
            eq(documentSeries.tenantId, tenantId),
            eq(documentSeries.documentType, docType),
            eq(documentSeries.financialYear, fy)
          )
        )
        .limit(1);
      series = newSeries;
    }

    if (!series) {
      throw new BadRequestException(`Could not allocate series for ${docType}`);
    }

    const padLength = series.padding || 4;
    const formattedNum = String(series.nextNumber).padStart(padLength, '0');
    const docNumber = `${series.prefix}/${series.financialYear}/${formattedNum}`;

    await this.databaseService.db
      .update(documentSeries)
      .set({ nextNumber: series.nextNumber + 1 })
      .where(eq(documentSeries.id, series.id));

    return docNumber;
  }

  // ── 1. WORK ORDERS ────────────────────────────────────────────────────────
  async getWorkOrders(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(workOrders.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(workOrders.siteId, siteId));
    }

    const rows = await this.databaseService.db
      .select({
        id: workOrders.id,
        uuid: workOrders.uuid,
        woNumber: workOrders.woNumber,
        contractorId: workOrders.contractorId,
        contractorName: contractors.name,
        contractorCode: contractors.code,
        contractorType: contractors.trade,
        siteId: workOrders.siteId,
        siteName: sites.name,
        title: workOrders.title,
        contractType: workOrders.contractType,
        contractValue: workOrders.contractValue,
        retentionPercent: workOrders.retentionPercent,
        tdsPercent: workOrders.tdsPercent,
        status: workOrders.status,
        startDate: workOrders.startDate,
        completionDate: workOrders.completionDate,
        createdAt: workOrders.createdAt,
      })
      .from(workOrders)
      .leftJoin(contractors, eq(workOrders.contractorId, contractors.id))
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(workOrders.createdAt));

    // Get line counts and billed totals
    const counts = await this.databaseService.db
      .select({
        woId: woItems.woId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(woItems)
      .groupBy(woItems.woId);

    const countMap = new Map(counts.map((c) => [c.woId, Number(c.count)]));

    return rows.map((r) => ({
      ...r,
      itemCount: countMap.get(r.id) || 0,
    }));
  }

  async getWorkOrderById(tenant: TenantContext, id: number) {
    const [wo] = await this.databaseService.db
      .select({
        id: workOrders.id,
        uuid: workOrders.uuid,
        woNumber: workOrders.woNumber,
        contractorId: workOrders.contractorId,
        contractorName: contractors.name,
        contractorCode: contractors.code,
        contractorPan: contractors.pan,
        contractorPhone: contractors.phone,
        siteId: workOrders.siteId,
        siteName: sites.name,
        title: workOrders.title,
        contractType: workOrders.contractType,
        contractValue: workOrders.contractValue,
        retentionPercent: workOrders.retentionPercent,
        tdsPercent: workOrders.tdsPercent,
        status: workOrders.status,
        scopeOfWork: workOrders.scopeOfWork,
        terms: workOrders.terms,
        startDate: workOrders.startDate,
        completionDate: workOrders.completionDate,
        createdAt: workOrders.createdAt,
      })
      .from(workOrders)
      .leftJoin(contractors, eq(workOrders.contractorId, contractors.id))
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .where(and(eq(workOrders.tenantId, tenant.id), eq(workOrders.id, id)))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work Order #${id} not found`);
    }

    const lines = await this.databaseService.db
      .select()
      .from(woItems)
      .where(eq(woItems.woId, id));

    return {
      ...wo,
      items: lines,
    };
  }

  async createWorkOrder(tenant: TenantContext, user: any, data: any) {
    const woNumber = await this.getNextDocumentNumber(tenant.id, 'WO', 'KB/WO');
    const uuid = uuidv4();

    let totalVal = 0;
    for (const l of data.items || []) {
      totalVal += (Number(l.estimatedQty) || 0) * (Number(l.rate) || 0);
    }

    await this.databaseService.db.insert(workOrders).values({
      uuid,
      tenantId: tenant.id,
      woNumber,
      contractorId: data.contractorId,
      siteId: data.siteId,
      title: data.title,
      contractType: data.contractType || 'item_rate',
      contractValue: (data.contractValue ? Number(data.contractValue) : totalVal).toFixed(2),
      retentionPercent: (Number(data.retentionPercent) || 5).toFixed(2),
      tdsPercent: (Number(data.tdsPercent) || 1).toFixed(2),
      status: 'active',
      scopeOfWork: data.scopeOfWork || null,
      terms: data.terms || null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      createdById: user.id,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.tenantId, tenant.id), eq(workOrders.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create Work Order');
    }

    for (const it of data.items || []) {
      const eqty = Number(it.estimatedQty) || 1;
      const rate = Number(it.rate) || 0;
      await this.databaseService.db.insert(woItems).values({
        woId: created.id,
        itemCode: it.itemCode || 'BOQ-ITEM',
        description: it.description || 'Contract Item',
        unitCode: it.unitCode || 'PCS',
        estimatedQty: eqty.toFixed(3),
        executedQty: '0.000',
        rate: rate.toFixed(2),
        totalAmount: (eqty * rate).toFixed(2),
      });
    }

    return this.getWorkOrderById(tenant, created.id);
  }

  // ── 2. RUNNING ACCOUNT (RA) BILLS ─────────────────────────────────────────
  async getRaBills(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(raBills.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(raBills.siteId, siteId));
    }

    return this.databaseService.db
      .select({
        id: raBills.id,
        uuid: raBills.uuid,
        billNumber: raBills.billNumber,
        raNumber: raBills.raNumber,
        woId: raBills.woId,
        woNumber: workOrders.woNumber,
        contractorId: raBills.contractorId,
        contractorName: contractors.name,
        contractorPan: contractors.pan,
        siteId: raBills.siteId,
        siteName: sites.name,
        grossAmount: raBills.grossAmount,
        retentionAmount: raBills.retentionAmount,
        tdsAmount: raBills.tdsAmount,
        materialDeduction: raBills.materialDeduction,
        netPayable: raBills.netPayable,
        status: raBills.status,
        billDate: raBills.billDate,
        createdAt: raBills.createdAt,
      })
      .from(raBills)
      .leftJoin(workOrders, eq(raBills.woId, workOrders.id))
      .leftJoin(contractors, eq(raBills.contractorId, contractors.id))
      .leftJoin(sites, eq(raBills.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(raBills.createdAt));
  }

  async getRaBillById(tenant: TenantContext, id: number) {
    const [ra] = await this.databaseService.db
      .select({
        id: raBills.id,
        uuid: raBills.uuid,
        billNumber: raBills.billNumber,
        raNumber: raBills.raNumber,
        woId: raBills.woId,
        woNumber: workOrders.woNumber,
        woTitle: workOrders.title,
        contractorId: raBills.contractorId,
        contractorName: contractors.name,
        contractorCode: contractors.code,
        contractorPan: contractors.pan,
        siteId: raBills.siteId,
        siteName: sites.name,
        siteAddress: sites.address,
        billDate: raBills.billDate,
        periodStart: raBills.periodStart,
        periodEnd: raBills.periodEnd,
        grossAmount: raBills.grossAmount,
        retentionAmount: raBills.retentionAmount,
        tdsAmount: raBills.tdsAmount,
        materialDeduction: raBills.materialDeduction,
        otherDeductions: raBills.otherDeductions,
        netPayable: raBills.netPayable,
        amountInWords: raBills.amountInWords,
        status: raBills.status,
        certifiedByName: users.fullName,
        remarks: raBills.remarks,
        createdAt: raBills.createdAt,
      })
      .from(raBills)
      .leftJoin(workOrders, eq(raBills.woId, workOrders.id))
      .leftJoin(contractors, eq(raBills.contractorId, contractors.id))
      .leftJoin(sites, eq(raBills.siteId, sites.id))
      .leftJoin(users, eq(raBills.certifiedById, users.id))
      .where(and(eq(raBills.tenantId, tenant.id), eq(raBills.id, id)))
      .limit(1);

    if (!ra) {
      throw new NotFoundException(`RA Bill #${id} not found`);
    }

    const sheets = await this.databaseService.db
      .select()
      .from(measurementSheets)
      .where(eq(measurementSheets.raBillId, id));

    return {
      ...ra,
      measurements: sheets,
    };
  }

  async createRaBill(tenant: TenantContext, user: any, data: any) {
    const [wo] = await this.databaseService.db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.tenantId, tenant.id), eq(workOrders.id, data.woId)))
      .limit(1);

    if (!wo) {
      throw new BadRequestException('Selected Work Order does not exist');
    }

    const billNumber = await this.getNextDocumentNumber(tenant.id, 'RA', 'KB/RA');
    const uuid = uuidv4();

    // Sum gross from measurements
    let gross = 0;
    for (const m of data.measurements || []) {
      gross += Number(m.amount) || 0;
    }

    const retPct = Number(wo.retentionPercent) || 5;
    const tdsPct = Number(wo.tdsPercent) || 1;

    const retentionAmount = (gross * retPct) / 100;
    const tdsAmount = (gross * tdsPct) / 100;
    const materialDeduction = Number(data.materialDeduction) || 0;
    const otherDeductions = Number(data.otherDeductions) || 0;
    const netPayable = gross - retentionAmount - tdsAmount - materialDeduction - otherDeductions;

    const words = numberToIndianWords(netPayable);

    // Get previous RA count for this WO
    const existingBills = await this.databaseService.db
      .select()
      .from(raBills)
      .where(and(eq(raBills.tenantId, tenant.id), eq(raBills.woId, wo.id)));

    const raNumber = existingBills.length + 1;

    await this.databaseService.db.insert(raBills).values({
      uuid,
      tenantId: tenant.id,
      billNumber,
      raNumber,
      woId: wo.id,
      contractorId: wo.contractorId,
      siteId: wo.siteId,
      billDate: data.billDate ? new Date(data.billDate) : new Date(),
      periodStart: data.periodStart ? new Date(data.periodStart) : null,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : new Date(),
      grossAmount: gross.toFixed(2),
      retentionAmount: retentionAmount.toFixed(2),
      tdsAmount: tdsAmount.toFixed(2),
      materialDeduction: materialDeduction.toFixed(2),
      otherDeductions: otherDeductions.toFixed(2),
      netPayable: netPayable.toFixed(2),
      amountInWords: words,
      status: 'certified',
      certifiedById: user.id,
      remarks: data.remarks || 'Site measurements verified in MB Book',
    });

    const [created] = await this.databaseService.db
      .select()
      .from(raBills)
      .where(and(eq(raBills.tenantId, tenant.id), eq(raBills.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create RA Bill');
    }

    for (const m of data.measurements || []) {
      await this.databaseService.db.insert(measurementSheets).values({
        raBillId: created.id,
        woItemId: m.woItemId,
        locationRef: m.locationRef || 'Site Location',
        description: m.description || null,
        numberOfUnits: (Number(m.numberOfUnits) || 1).toFixed(2),
        length: m.length ? Number(m.length).toFixed(3) : null,
        breadth: m.breadth ? Number(m.breadth).toFixed(3) : null,
        depth: m.depth ? Number(m.depth).toFixed(3) : null,
        totalQty: Number(m.totalQty).toFixed(3),
        rate: Number(m.rate).toFixed(2),
        amount: Number(m.amount).toFixed(2),
      });

      // Update executed quantity on WO item
      if (m.woItemId) {
        await this.databaseService.db
          .update(woItems)
          .set({
            executedQty: sql`${woItems.executedQty} + ${Number(m.totalQty).toFixed(3)}`,
          })
          .where(eq(woItems.id, m.woItemId));
      }
    }

    return this.getRaBillById(tenant, created.id);
  }

  async updateRaBillStatus(tenant: TenantContext, user: any, id: number, status: 'certified' | 'approved' | 'paid') {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedById = user.id;
    }

    await this.databaseService.db
      .update(raBills)
      .set(updateData)
      .where(and(eq(raBills.tenantId, tenant.id), eq(raBills.id, id)));

    return this.getRaBillById(tenant, id);
  }
}
