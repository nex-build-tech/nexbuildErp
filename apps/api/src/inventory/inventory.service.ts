import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  goodsReceiptNotes,
  grnItems,
  stockLedger,
  stockBalances,
  materialIssues,
  materialIssueItems,
  purchaseOrders,
  poItems,
  documentSeries,
  vendors,
  sites,
  warehouses,
  items,
  units,
  categories,
  users,
} from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  // ── 1. GOODS RECEIPT NOTES (GRN) ──────────────────────────────────────────
  async getGrns(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(goodsReceiptNotes.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(goodsReceiptNotes.siteId, siteId));
    }

    const rows = await this.databaseService.db
      .select({
        id: goodsReceiptNotes.id,
        uuid: goodsReceiptNotes.uuid,
        grnNumber: goodsReceiptNotes.grnNumber,
        poId: goodsReceiptNotes.poId,
        poNumber: purchaseOrders.poNumber,
        vendorId: goodsReceiptNotes.vendorId,
        vendorName: vendors.name,
        siteId: goodsReceiptNotes.siteId,
        siteName: sites.name,
        warehouseId: goodsReceiptNotes.warehouseId,
        warehouseName: warehouses.name,
        challanNo: goodsReceiptNotes.challanNo,
        invoiceNo: goodsReceiptNotes.invoiceNo,
        vehicleNo: goodsReceiptNotes.vehicleNo,
        receivedDate: goodsReceiptNotes.receivedDate,
        status: goodsReceiptNotes.status,
        createdAt: goodsReceiptNotes.createdAt,
      })
      .from(goodsReceiptNotes)
      .leftJoin(purchaseOrders, eq(goodsReceiptNotes.poId, purchaseOrders.id))
      .leftJoin(vendors, eq(goodsReceiptNotes.vendorId, vendors.id))
      .leftJoin(sites, eq(goodsReceiptNotes.siteId, sites.id))
      .leftJoin(warehouses, eq(goodsReceiptNotes.warehouseId, warehouses.id))
      .where(and(...conditions))
      .orderBy(desc(goodsReceiptNotes.createdAt));

    // Get item counts
    const counts = await this.databaseService.db
      .select({
        grnId: grnItems.grnId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(grnItems)
      .groupBy(grnItems.grnId);

    const countMap = new Map(counts.map((c) => [c.grnId, Number(c.count)]));

    return rows.map((r) => ({
      ...r,
      itemCount: countMap.get(r.id) || 0,
    }));
  }

  async getGrnById(tenant: TenantContext, id: number) {
    const [grn] = await this.databaseService.db
      .select({
        id: goodsReceiptNotes.id,
        uuid: goodsReceiptNotes.uuid,
        grnNumber: goodsReceiptNotes.grnNumber,
        poId: goodsReceiptNotes.poId,
        poNumber: purchaseOrders.poNumber,
        vendorId: goodsReceiptNotes.vendorId,
        vendorName: vendors.name,
        vendorGstin: vendors.gstin,
        siteId: goodsReceiptNotes.siteId,
        siteName: sites.name,
        warehouseId: goodsReceiptNotes.warehouseId,
        warehouseName: warehouses.name,
        challanNo: goodsReceiptNotes.challanNo,
        challanDate: goodsReceiptNotes.challanDate,
        invoiceNo: goodsReceiptNotes.invoiceNo,
        invoiceDate: goodsReceiptNotes.invoiceDate,
        vehicleNo: goodsReceiptNotes.vehicleNo,
        receivedDate: goodsReceiptNotes.receivedDate,
        status: goodsReceiptNotes.status,
        gatePassNo: goodsReceiptNotes.gatePassNo,
        inspectionRemarks: goodsReceiptNotes.inspectionRemarks,
        receivedByName: users.fullName,
        createdAt: goodsReceiptNotes.createdAt,
      })
      .from(goodsReceiptNotes)
      .leftJoin(purchaseOrders, eq(goodsReceiptNotes.poId, purchaseOrders.id))
      .leftJoin(vendors, eq(goodsReceiptNotes.vendorId, vendors.id))
      .leftJoin(sites, eq(goodsReceiptNotes.siteId, sites.id))
      .leftJoin(warehouses, eq(goodsReceiptNotes.warehouseId, warehouses.id))
      .leftJoin(users, eq(goodsReceiptNotes.receivedById, users.id))
      .where(and(eq(goodsReceiptNotes.tenantId, tenant.id), eq(goodsReceiptNotes.id, id)))
      .limit(1);

    if (!grn) {
      throw new NotFoundException(`GRN #${id} not found`);
    }

    const lines = await this.databaseService.db
      .select({
        id: grnItems.id,
        poItemId: grnItems.poItemId,
        itemId: grnItems.itemId,
        itemCode: items.code,
        itemName: items.name,
        hsnCode: items.hsnCode,
        orderedQty: grnItems.orderedQty,
        receivedQty: grnItems.receivedQty,
        acceptedQty: grnItems.acceptedQty,
        rejectedQty: grnItems.rejectedQty,
        unitId: grnItems.unitId,
        unitCode: units.code,
        unitRate: grnItems.unitRate,
        totalValue: grnItems.totalValue,
        rejectionReason: grnItems.rejectionReason,
        batchNo: grnItems.batchNo,
      })
      .from(grnItems)
      .leftJoin(items, eq(grnItems.itemId, items.id))
      .leftJoin(units, eq(grnItems.unitId, units.id))
      .where(eq(grnItems.grnId, id));

    return {
      ...grn,
      items: lines,
    };
  }

  async createGrn(tenant: TenantContext, user: any, data: any) {
    // 1. Fetch PO
    const [po] = await this.databaseService.db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.tenantId, tenant.id), eq(purchaseOrders.id, data.poId)))
      .limit(1);

    if (!po) {
      throw new BadRequestException('Selected Purchase Order does not exist');
    }

    const grnNumber = await this.getNextDocumentNumber(tenant.id, 'GRN', 'KB/GRN');
    const uuid = uuidv4();

    // 2. Insert GRN header
    await this.databaseService.db.insert(goodsReceiptNotes).values({
      uuid,
      tenantId: tenant.id,
      grnNumber,
      poId: po.id,
      vendorId: po.vendorId,
      siteId: data.siteId || po.siteId,
      warehouseId: data.warehouseId || po.warehouseId || 1,
      challanNo: data.challanNo || null,
      challanDate: data.challanDate ? new Date(data.challanDate) : null,
      invoiceNo: data.invoiceNo || null,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      vehicleNo: data.vehicleNo || null,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      status: 'verified',
      gatePassNo: data.gatePassNo || null,
      inspectionRemarks: data.inspectionRemarks || 'Store inward inspected and accepted',
      receivedById: user.id,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(goodsReceiptNotes)
      .where(and(eq(goodsReceiptNotes.tenantId, tenant.id), eq(goodsReceiptNotes.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create Goods Receipt Note');
    }

    // 3. Process each line
    for (const line of data.items || []) {
      const acceptedQty = Number(line.acceptedQty) || 0;
      const rejectedQty = Number(line.rejectedQty) || 0;
      const receivedQty = Number(line.receivedQty) || (acceptedQty + rejectedQty);
      const rate = Number(line.unitRate) || 0;
      const lineVal = (acceptedQty * rate).toFixed(2);

      // Insert GRN Item
      await this.databaseService.db.insert(grnItems).values({
        grnId: created.id,
        poItemId: line.poItemId,
        itemId: line.itemId,
        orderedQty: Number(line.orderedQty || acceptedQty).toFixed(3),
        receivedQty: receivedQty.toFixed(3),
        acceptedQty: acceptedQty.toFixed(3),
        rejectedQty: rejectedQty.toFixed(3),
        unitId: line.unitId,
        unitRate: rate.toFixed(2),
        totalValue: lineVal,
        rejectionReason: line.rejectionReason || null,
        batchNo: line.batchNo || null,
      });

      // Update PO item received quantity
      if (line.poItemId) {
        await this.databaseService.db
          .update(poItems)
          .set({
            receivedQuantity: sql`${poItems.receivedQuantity} + ${acceptedQty.toFixed(3)}`,
          })
          .where(eq(poItems.id, line.poItemId));
      }

      // Stock Ledger Entry (Inward movement)
      if (acceptedQty > 0) {
        // Fetch current balance for running balance calculation
        const [currBalance] = await this.databaseService.db
          .select()
          .from(stockBalances)
          .where(
            and(
              eq(stockBalances.warehouseId, created.warehouseId),
              eq(stockBalances.itemId, line.itemId)
            )
          )
          .limit(1);

        const prevQty = Number(currBalance?.quantity) || 0;
        const newQty = prevQty + acceptedQty;

        await this.databaseService.db.insert(stockLedger).values({
          tenantId: tenant.id,
          warehouseId: created.warehouseId,
          siteId: created.siteId,
          itemId: line.itemId,
          movementType: 'grn_inward',
          referenceType: 'GRN',
          referenceId: created.id,
          referenceNumber: grnNumber,
          quantity: acceptedQty.toFixed(3),
          balanceAfter: newQty.toFixed(3),
          unitRate: rate.toFixed(2),
          totalValue: lineVal,
          performedById: user.id,
          notes: `Store inward against PO ${po.poNumber}`,
        });

        // Update or insert Stock Balance cache
        if (currBalance) {
          const prevVal = Number(currBalance.totalValue) || 0;
          const newVal = prevVal + (acceptedQty * rate);
          const weightedAvg = newQty > 0 ? newVal / newQty : rate;

          await this.databaseService.db
            .update(stockBalances)
            .set({
              quantity: newQty.toFixed(3),
              weightedAvgRate: weightedAvg.toFixed(2),
              totalValue: newVal.toFixed(2),
              lastMovementAt: new Date(),
            })
            .where(eq(stockBalances.id, currBalance.id));
        } else {
          await this.databaseService.db.insert(stockBalances).values({
            tenantId: tenant.id,
            warehouseId: created.warehouseId,
            siteId: created.siteId,
            itemId: line.itemId,
            quantity: newQty.toFixed(3),
            weightedAvgRate: rate.toFixed(2),
            totalValue: lineVal,
            lastMovementAt: new Date(),
          });
        }
      }
    }

    // 4. Update PO Status
    const allPoLines = await this.databaseService.db
      .select()
      .from(poItems)
      .where(eq(poItems.poId, po.id));

    const isFullyReceived = allPoLines.every(
      (l) => Number(l.receivedQuantity) >= Number(l.quantity)
    );

    await this.databaseService.db
      .update(purchaseOrders)
      .set({ status: isFullyReceived ? 'completed' : 'partially_received' })
      .where(eq(purchaseOrders.id, po.id));

    // Trigger GRN Done Notification
    try {
      await this.notificationsService.notifyGrnDone(tenant.id, {
        id: created.id,
        grnNumber: created.grnNumber,
        poNumber: po.poNumber,
        vendorName: 'Approved Supplier',
      });
    } catch {
      // Non-blocking
    }

    return this.getGrnById(tenant, created.id);
  }

  // ── 2. STOCK SUMMARY & VALUATION ──────────────────────────────────────────
  async getStockSummary(tenant: TenantContext, warehouseId?: number, siteId?: number) {
    const conditions = [eq(stockBalances.tenantId, tenant.id)];
    if (warehouseId) {
      conditions.push(eq(stockBalances.warehouseId, warehouseId));
    }
    if (siteId) {
      conditions.push(eq(stockBalances.siteId, siteId));
    }

    const rows = await this.databaseService.db
      .select({
        id: stockBalances.id,
        warehouseId: stockBalances.warehouseId,
        warehouseName: warehouses.name,
        siteId: stockBalances.siteId,
        siteName: sites.name,
        itemId: stockBalances.itemId,
        itemCode: items.code,
        itemName: items.name,
        categoryName: categories.name,
        unitCode: units.code,
        reorderLevel: items.reorderLevel,
        quantity: stockBalances.quantity,
        weightedAvgRate: stockBalances.weightedAvgRate,
        totalValue: stockBalances.totalValue,
        lastMovementAt: stockBalances.lastMovementAt,
      })
      .from(stockBalances)
      .leftJoin(warehouses, eq(stockBalances.warehouseId, warehouses.id))
      .leftJoin(sites, eq(stockBalances.siteId, sites.id))
      .leftJoin(items, eq(stockBalances.itemId, items.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(units, eq(items.unitId, units.id))
      .where(and(...conditions))
      .orderBy(desc(stockBalances.totalValue));

    // Compute total valuation
    const totalValuation = rows.reduce((sum, r) => sum + Number(r.totalValue || 0), 0);
    const lowStockCount = rows.filter((r) => Number(r.quantity) <= Number(r.reorderLevel || 0)).length;

    return {
      totalValuation: totalValuation.toFixed(2),
      itemCount: rows.length,
      lowStockCount,
      items: rows.map((r) => ({
        ...r,
        isLowStock: Number(r.quantity) <= Number(r.reorderLevel || 0),
      })),
    };
  }

  // ── 3. STOCK LEDGER (MOVEMENT HISTORY) ────────────────────────────────────
  async getStockLedger(tenant: TenantContext, itemId?: number, warehouseId?: number) {
    const conditions = [eq(stockLedger.tenantId, tenant.id)];
    if (itemId) {
      conditions.push(eq(stockLedger.itemId, itemId));
    }
    if (warehouseId) {
      conditions.push(eq(stockLedger.warehouseId, warehouseId));
    }

    return this.databaseService.db
      .select({
        id: stockLedger.id,
        movementType: stockLedger.movementType,
        referenceType: stockLedger.referenceType,
        referenceNumber: stockLedger.referenceNumber,
        warehouseId: stockLedger.warehouseId,
        warehouseName: warehouses.name,
        siteId: stockLedger.siteId,
        siteName: sites.name,
        itemId: stockLedger.itemId,
        itemCode: items.code,
        itemName: items.name,
        unitCode: units.code,
        quantity: stockLedger.quantity,
        balanceAfter: stockLedger.balanceAfter,
        unitRate: stockLedger.unitRate,
        totalValue: stockLedger.totalValue,
        performedByName: users.fullName,
        notes: stockLedger.notes,
        createdAt: stockLedger.createdAt,
      })
      .from(stockLedger)
      .leftJoin(warehouses, eq(stockLedger.warehouseId, warehouses.id))
      .leftJoin(sites, eq(stockLedger.siteId, sites.id))
      .leftJoin(items, eq(stockLedger.itemId, items.id))
      .leftJoin(units, eq(items.unitId, units.id))
      .leftJoin(users, eq(stockLedger.performedById, users.id))
      .where(and(...conditions))
      .orderBy(desc(stockLedger.createdAt));
  }

  // ── 4. MATERIAL ISSUES (SITE CONSUMPTION / DISPATCH) ───────────────────────
  async getMaterialIssues(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(materialIssues.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(materialIssues.siteId, siteId));
    }

    return this.databaseService.db
      .select({
        id: materialIssues.id,
        uuid: materialIssues.uuid,
        issueNumber: materialIssues.issueNumber,
        siteId: materialIssues.siteId,
        siteName: sites.name,
        warehouseId: materialIssues.warehouseId,
        warehouseName: warehouses.name,
        issuedToName: materialIssues.issuedToName,
        purpose: materialIssues.purpose,
        totalValue: materialIssues.totalValue,
        status: materialIssues.status,
        issuedByName: users.fullName,
        issueDate: materialIssues.issueDate,
        createdAt: materialIssues.createdAt,
      })
      .from(materialIssues)
      .leftJoin(sites, eq(materialIssues.siteId, sites.id))
      .leftJoin(warehouses, eq(materialIssues.warehouseId, warehouses.id))
      .leftJoin(users, eq(materialIssues.issuedById, users.id))
      .where(and(...conditions))
      .orderBy(desc(materialIssues.createdAt));
  }

  async getMaterialIssueById(tenant: TenantContext, id: number) {
    const [issue] = await this.databaseService.db
      .select({
        id: materialIssues.id,
        uuid: materialIssues.uuid,
        issueNumber: materialIssues.issueNumber,
        siteId: materialIssues.siteId,
        siteName: sites.name,
        warehouseId: materialIssues.warehouseId,
        warehouseName: warehouses.name,
        contractorId: materialIssues.contractorId,
        issuedToName: materialIssues.issuedToName,
        purpose: materialIssues.purpose,
        totalValue: materialIssues.totalValue,
        status: materialIssues.status,
        issuedByName: users.fullName,
        issueDate: materialIssues.issueDate,
        createdAt: materialIssues.createdAt,
      })
      .from(materialIssues)
      .leftJoin(sites, eq(materialIssues.siteId, sites.id))
      .leftJoin(warehouses, eq(materialIssues.warehouseId, warehouses.id))
      .leftJoin(users, eq(materialIssues.issuedById, users.id))
      .where(and(eq(materialIssues.tenantId, tenant.id), eq(materialIssues.id, id)))
      .limit(1);

    if (!issue) {
      throw new NotFoundException(`Material Issue #${id} not found`);
    }

    const lines = await this.databaseService.db
      .select({
        id: materialIssueItems.id,
        itemId: materialIssueItems.itemId,
        itemCode: items.code,
        itemName: items.name,
        quantity: materialIssueItems.quantity,
        unitId: materialIssueItems.unitId,
        unitCode: units.code,
        unitRate: materialIssueItems.unitRate,
        totalValue: materialIssueItems.totalValue,
        remarks: materialIssueItems.remarks,
      })
      .from(materialIssueItems)
      .leftJoin(items, eq(materialIssueItems.itemId, items.id))
      .leftJoin(units, eq(materialIssueItems.unitId, units.id))
      .where(eq(materialIssueItems.issueId, id));

    return {
      ...issue,
      items: lines,
    };
  }

  async createMaterialIssue(tenant: TenantContext, user: any, data: any) {
    // 1. Guardrail against negative stock
    for (const line of data.items || []) {
      const requestedQty = Number(line.quantity) || 0;
      const [balance] = await this.databaseService.db
        .select()
        .from(stockBalances)
        .where(
          and(
            eq(stockBalances.warehouseId, data.warehouseId),
            eq(stockBalances.itemId, line.itemId)
          )
        )
        .limit(1);

      const availableQty = Number(balance?.quantity) || 0;
      if (requestedQty > availableQty) {
        const [it] = await this.databaseService.db
          .select()
          .from(items)
          .where(eq(items.id, line.itemId))
          .limit(1);
        throw new BadRequestException(
          `Insufficient stock for "${it?.name || 'Item'}". Available: ${availableQty.toFixed(2)}, Requested: ${requestedQty.toFixed(2)}`
        );
      }
    }

    const issueNumber = await this.getNextDocumentNumber(tenant.id, 'ISSUE', 'KB/ISS');
    const uuid = uuidv4();

    let totalIssueValue = 0;
    for (const l of data.items || []) {
      totalIssueValue += (Number(l.quantity) || 0) * (Number(l.unitRate) || 0);
    }

    // 2. Insert Issue Header
    await this.databaseService.db.insert(materialIssues).values({
      uuid,
      tenantId: tenant.id,
      issueNumber,
      siteId: data.siteId,
      warehouseId: data.warehouseId,
      contractorId: data.contractorId || null,
      issuedToName: data.issuedToName,
      purpose: data.purpose,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      status: 'issued',
      totalValue: totalIssueValue.toFixed(2),
      issuedById: user.id,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(materialIssues)
      .where(and(eq(materialIssues.tenantId, tenant.id), eq(materialIssues.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create material issue');
    }

    // 3. Process each line: insert items, deduct stock, record in ledger
    for (const line of data.items || []) {
      const qty = Number(line.quantity) || 0;
      const rate = Number(line.unitRate) || 0;
      const lineVal = (qty * rate).toFixed(2);

      await this.databaseService.db.insert(materialIssueItems).values({
        issueId: created.id,
        itemId: line.itemId,
        quantity: qty.toFixed(3),
        unitId: line.unitId,
        unitRate: rate.toFixed(2),
        totalValue: lineVal,
        remarks: line.remarks || null,
      });

      const [balance] = await this.databaseService.db
        .select()
        .from(stockBalances)
        .where(
          and(
            eq(stockBalances.warehouseId, data.warehouseId),
            eq(stockBalances.itemId, line.itemId)
          )
        )
        .limit(1);

      const prevQty = Number(balance?.quantity) || 0;
      const newQty = prevQty - qty;

      // Record negative movement in stock ledger
      await this.databaseService.db.insert(stockLedger).values({
        tenantId: tenant.id,
        warehouseId: data.warehouseId,
        siteId: data.siteId,
        itemId: line.itemId,
        movementType: 'site_issue',
        referenceType: 'ISSUE',
        referenceId: created.id,
        referenceNumber: issueNumber,
        quantity: (-qty).toFixed(3),
        balanceAfter: newQty.toFixed(3),
        unitRate: rate.toFixed(2),
        totalValue: lineVal,
        performedById: user.id,
        notes: `Material issue to ${data.issuedToName} for ${data.purpose}`,
      });

      // Update Stock Balance
      if (balance) {
        await this.databaseService.db
          .update(stockBalances)
          .set({
            quantity: newQty.toFixed(3),
            totalValue: (newQty * Number(balance.weightedAvgRate)).toFixed(2),
            lastMovementAt: new Date(),
          })
          .where(eq(stockBalances.id, balance.id));

        // Check low stock reorder threshold
        try {
          const [itemRec] = await this.databaseService.db
            .select({
              id: items.id,
              code: items.code,
              name: items.name,
              reorderLevel: items.reorderLevel,
              unitCode: units.code,
            })
            .from(items)
            .leftJoin(units, eq(items.unitId, units.id))
            .where(eq(items.id, line.itemId))
            .limit(1);

          if (itemRec && Number(newQty) <= Number(itemRec.reorderLevel || 0)) {
            await this.notificationsService.notifyLowStock(tenant.id, {
              id: itemRec.id,
              code: itemRec.code,
              name: itemRec.name,
              currentQty: newQty.toFixed(2),
              reorderLevel: Number(itemRec.reorderLevel) || 0,
              unitCode: itemRec.unitCode || 'Units',
            });
          }
        } catch {
          // Non-blocking
        }
      }
    }

    return this.getMaterialIssueById(tenant, created.id);
  }
}
