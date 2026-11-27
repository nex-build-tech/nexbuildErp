import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  boqItems,
  items,
  materialIssues,
  materialIssueItems,
  sites,
  goodsReceiptNotes,
  grnItems,
  warehouses,
} from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Injectable()
export class BoqService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getBoqItems(tenant: TenantContext, filter?: { siteId?: number; workPackage?: string }) {
    const conditions = [eq(boqItems.tenantId, tenant.id)];
    if (filter?.siteId) {
      conditions.push(eq(boqItems.siteId, filter.siteId));
    }
    if (filter?.workPackage) {
      conditions.push(eq(boqItems.workPackage, filter.workPackage));
    }

    return this.databaseService.db
      .select({
        id: boqItems.id,
        uuid: boqItems.uuid,
        siteId: boqItems.siteId,
        siteName: sites.name,
        itemCode: boqItems.itemCode,
        description: boqItems.description,
        workPackage: boqItems.workPackage,
        budgetedQty: boqItems.budgetedQty,
        uom: boqItems.uom,
        budgetedRate: boqItems.budgetedRate,
        budgetedAmount: boqItems.budgetedAmount,
        tolerancePercent: boqItems.tolerancePercent,
        createdAt: boqItems.createdAt,
      })
      .from(boqItems)
      .leftJoin(sites, eq(boqItems.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(boqItems.id));
  }

  async createBoqItem(tenant: TenantContext, data: any) {
    const uuid = uuidv4();
    const bQty = Number(data.budgetedQty) || 0;
    const bRate = Number(data.budgetedRate) || 0;
    const bAmount = bQty * bRate;

    await this.databaseService.db.insert(boqItems).values({
      uuid,
      tenantId: tenant.id,
      siteId: Number(data.siteId),
      itemCode: data.itemCode,
      description: data.description || data.itemCode,
      workPackage: data.workPackage || 'Civil Works',
      budgetedQty: bQty.toFixed(3),
      uom: data.uom || 'PCS',
      budgetedRate: bRate.toFixed(2),
      budgetedAmount: bAmount.toFixed(2),
      tolerancePercent: (Number(data.tolerancePercent) || 5.0).toFixed(2),
    });

    const [created] = await this.databaseService.db
      .select()
      .from(boqItems)
      .where(and(eq(boqItems.tenantId, tenant.id), eq(boqItems.uuid, uuid)))
      .limit(1);

    return created;
  }

  async bulkCreateBoqItems(
    tenant: TenantContext,
    siteId: number,
    itemsList: Array<{
      itemCode: string;
      description: string;
      workPackage: string;
      budgetedQty: number;
      uom: string;
      budgetedRate: number;
      tolerancePercent?: number;
    }>
  ) {
    if (!itemsList || itemsList.length === 0) {
      throw new BadRequestException('Items array cannot be empty');
    }

    const inserted = [];
    for (const it of itemsList) {
      const existing = await this.databaseService.db
        .select()
        .from(boqItems)
        .where(
          and(
            eq(boqItems.tenantId, tenant.id),
            eq(boqItems.siteId, siteId),
            eq(boqItems.itemCode, it.itemCode),
            eq(boqItems.workPackage, it.workPackage)
          )
        )
        .limit(1);

      const bQty = Number(it.budgetedQty) || 0;
      const bRate = Number(it.budgetedRate) || 0;
      const bAmount = bQty * bRate;

      if (existing.length > 0) {
        await this.databaseService.db
          .update(boqItems)
          .set({
            budgetedQty: bQty.toFixed(3),
            budgetedRate: bRate.toFixed(2),
            budgetedAmount: bAmount.toFixed(2),
            tolerancePercent: (Number(it.tolerancePercent) || 5.0).toFixed(2),
          })
          .where(eq(boqItems.id, existing[0]!.id));
        inserted.push(existing[0]!.uuid);
      } else {
        const uuid = uuidv4();
        await this.databaseService.db.insert(boqItems).values({
          uuid,
          tenantId: tenant.id,
          siteId,
          itemCode: it.itemCode,
          description: it.description || it.itemCode,
          workPackage: it.workPackage || 'Civil Works',
          budgetedQty: bQty.toFixed(3),
          uom: it.uom || 'PCS',
          budgetedRate: bRate.toFixed(2),
          budgetedAmount: bAmount.toFixed(2),
          tolerancePercent: (Number(it.tolerancePercent) || 5.0).toFixed(2),
        });
        inserted.push(uuid);
      }
    }

    return { success: true, count: inserted.length, siteId };
  }

  async getConsumptionVsBoqComparison(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(boqItems.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(boqItems.siteId, siteId));
    }

    const boqRows = await this.databaseService.db
      .select({
        id: boqItems.id,
        siteId: boqItems.siteId,
        siteName: sites.name,
        itemCode: boqItems.itemCode,
        description: boqItems.description,
        workPackage: boqItems.workPackage,
        budgetedQty: boqItems.budgetedQty,
        uom: boqItems.uom,
        budgetedRate: boqItems.budgetedRate,
        budgetedAmount: boqItems.budgetedAmount,
        tolerancePercent: boqItems.tolerancePercent,
      })
      .from(boqItems)
      .leftJoin(sites, eq(boqItems.siteId, sites.id))
      .where(and(...conditions));

    // Get all material master items to map itemCode -> itemId
    const allItems = await this.databaseService.db
      .select({ id: items.id, code: items.code })
      .from(items)
      .where(eq(items.tenantId, tenant.id));

    const itemIdToCodeMap = new Map(allItems.map((i) => [i.id, i.code]));

    // Aggregate material issues (actual consumption at site)
    // Filter issues by siteId
    const issueConditions = [eq(materialIssues.tenantId, tenant.id)];
    if (siteId) {
      issueConditions.push(eq(materialIssues.siteId, siteId));
    }

    const consumptionByItem = await this.databaseService.db
      .select({
        itemId: materialIssueItems.itemId,
        consumedQty: sql<number>`sum(${materialIssueItems.quantity})`.as('consumedQty'),
        consumedValue: sql<number>`sum(${materialIssueItems.totalValue})`.as('consumedValue'),
      })
      .from(materialIssueItems)
      .innerJoin(materialIssues, eq(materialIssueItems.issueId, materialIssues.id))
      .where(and(...issueConditions))
      .groupBy(materialIssueItems.itemId);

    const consumptionMap = new Map<string, { qty: number; value: number }>();
    for (const c of consumptionByItem) {
      const code = itemIdToCodeMap.get(c.itemId);
      if (code) {
        consumptionMap.set(code, {
          qty: Number(c.consumedQty) || 0,
          value: Number(c.consumedValue) || 0,
        });
      }
    }

    // Also get GRN received quantities for that site
    const grnReceivedByItem = await this.databaseService.db
      .select({
        itemId: grnItems.itemId,
        receivedQty: sql<number>`sum(${grnItems.acceptedQty})`.as('receivedQty'),
      })
      .from(grnItems)
      .innerJoin(goodsReceiptNotes, eq(grnItems.grnId, goodsReceiptNotes.id))
      .innerJoin(warehouses, eq(goodsReceiptNotes.warehouseId, warehouses.id))
      .where(
        and(
          eq(goodsReceiptNotes.tenantId, tenant.id),
          siteId ? eq(warehouses.siteId, siteId) : sql`1=1`
        )
      )
      .groupBy(grnItems.itemId);

    const receivedMap = new Map<string, number>();
    for (const r of grnReceivedByItem) {
      const code = itemIdToCodeMap.get(r.itemId);
      if (code) {
        receivedMap.set(code, Number(r.receivedQty) || 0);
      }
    }

    // Build comparison line items
    let totalBudgetedAmount = 0;
    let totalConsumedAmount = 0;

    const report = boqRows.map((boq) => {
      const budgetedQty = Number(boq.budgetedQty) || 0;
      const budgetedRate = Number(boq.budgetedRate) || 0;
      const budgetedAmount = Number(boq.budgetedAmount) || 0;
      const tolerancePercent = Number(boq.tolerancePercent) || 5;

      const consumption = consumptionMap.get(boq.itemCode) || { qty: 0, value: 0 };
      const consumedQty = consumption.qty;
      const consumedAmount = consumedQty * budgetedRate;
      const receivedQty = receivedMap.get(boq.itemCode) || 0;

      const remainingQty = budgetedQty - consumedQty;
      const utilizationPercent = budgetedQty > 0 ? (consumedQty / budgetedQty) * 100 : 0;
      const variancePercent = utilizationPercent - 100;

      totalBudgetedAmount += budgetedAmount;
      totalConsumedAmount += consumedAmount;

      let status: 'NORMAL' | 'CAUTION' | 'BREACHED' = 'NORMAL';
      if (utilizationPercent > 100 + tolerancePercent) {
        status = 'BREACHED';
      } else if (utilizationPercent >= 85) {
        status = 'CAUTION';
      }

      return {
        id: boq.id,
        siteId: boq.siteId,
        siteName: boq.siteName,
        itemCode: boq.itemCode,
        description: boq.description,
        workPackage: boq.workPackage,
        uom: boq.uom,
        budgetedQty,
        budgetedRate,
        budgetedAmount,
        consumedQty,
        consumedAmount,
        receivedQty,
        remainingQty,
        utilizationPercent: Number(utilizationPercent.toFixed(1)),
        variancePercent: Number(variancePercent.toFixed(1)),
        tolerancePercent,
        status,
      };
    });

    return {
      summary: {
        totalBudgetedAmount: Number(totalBudgetedAmount.toFixed(2)),
        totalConsumedAmount: Number(totalConsumedAmount.toFixed(2)),
        overallUtilizationPercent:
          totalBudgetedAmount > 0
            ? Number(((totalConsumedAmount / totalBudgetedAmount) * 100).toFixed(1))
            : 0,
        itemCount: report.length,
        breachedCount: report.filter((r) => r.status === 'BREACHED').length,
        cautionCount: report.filter((r) => r.status === 'CAUTION').length,
        normalCount: report.filter((r) => r.status === 'NORMAL').length,
      },
      items: report,
    };
  }
}
