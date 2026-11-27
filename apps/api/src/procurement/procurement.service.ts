import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  materialIndents,
  indentItems,
  rfqs,
  rfqItems,
  rfqQuotations,
  purchaseOrders,
  poItems,
  documentSeries,
  vendors,
  sites,
  items,
  units,
  users,
} from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { calculateGst, GstLineItemInput } from '@builderp/shared';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── HELPER: NEXT DOCUMENT NUMBER ──────────────────────────────────────────
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

    // Increment counter
    await this.databaseService.db
      .update(documentSeries)
      .set({ nextNumber: series.nextNumber + 1 })
      .where(eq(documentSeries.id, series.id));

    return docNumber;
  }

  // ── 1. MATERIAL INDENTS ───────────────────────────────────────────────────
  async getIndents(tenant: TenantContext, siteId?: number) {
    const conditions = [eq(materialIndents.tenantId, tenant.id)];
    if (siteId) {
      conditions.push(eq(materialIndents.siteId, siteId));
    }

    const rows = await this.databaseService.db
      .select({
        id: materialIndents.id,
        uuid: materialIndents.uuid,
        indentNumber: materialIndents.indentNumber,
        siteId: materialIndents.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        requestedById: materialIndents.requestedById,
        requestedByName: users.fullName,
        priority: materialIndents.priority,
        status: materialIndents.status,
        purpose: materialIndents.purpose,
        remarks: materialIndents.remarks,
        requiredDate: materialIndents.requiredDate,
        createdAt: materialIndents.createdAt,
        approvedAt: materialIndents.approvedAt,
      })
      .from(materialIndents)
      .leftJoin(sites, eq(materialIndents.siteId, sites.id))
      .leftJoin(users, eq(materialIndents.requestedById, users.id))
      .where(and(...conditions))
      .orderBy(desc(materialIndents.createdAt));

    // Get item counts
    const counts = await this.databaseService.db
      .select({
        indentId: indentItems.indentId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(indentItems)
      .groupBy(indentItems.indentId);

    const countMap = new Map(counts.map((c) => [c.indentId, Number(c.count)]));

    return rows.map((r) => ({
      ...r,
      itemCount: countMap.get(r.id) || 0,
    }));
  }

  async getIndentById(tenant: TenantContext, id: number) {
    const [indent] = await this.databaseService.db
      .select({
        id: materialIndents.id,
        uuid: materialIndents.uuid,
        indentNumber: materialIndents.indentNumber,
        siteId: materialIndents.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        requestedById: materialIndents.requestedById,
        requestedByName: users.fullName,
        priority: materialIndents.priority,
        status: materialIndents.status,
        purpose: materialIndents.purpose,
        remarks: materialIndents.remarks,
        requiredDate: materialIndents.requiredDate,
        createdAt: materialIndents.createdAt,
        approvedAt: materialIndents.approvedAt,
      })
      .from(materialIndents)
      .leftJoin(sites, eq(materialIndents.siteId, sites.id))
      .leftJoin(users, eq(materialIndents.requestedById, users.id))
      .where(and(eq(materialIndents.tenantId, tenant.id), eq(materialIndents.id, id)))
      .limit(1);

    if (!indent) {
      throw new NotFoundException(`Material Indent #${id} not found`);
    }

    const lines = await this.databaseService.db
      .select({
        id: indentItems.id,
        itemId: indentItems.itemId,
        itemCode: items.code,
        itemName: items.name,
        hsnCode: items.hsnCode,
        quantity: indentItems.quantity,
        unitId: indentItems.unitId,
        unitCode: units.code,
        estimatedRate: indentItems.estimatedRate,
        estimatedAmount: indentItems.estimatedAmount,
        remarks: indentItems.remarks,
      })
      .from(indentItems)
      .leftJoin(items, eq(indentItems.itemId, items.id))
      .leftJoin(units, eq(indentItems.unitId, units.id))
      .where(eq(indentItems.indentId, id));

    return {
      ...indent,
      items: lines,
    };
  }

  async createIndent(tenant: TenantContext, user: any, data: any) {
    const indentNumber = await this.getNextDocumentNumber(tenant.id, 'REQ', 'KB/REQ');
    const uuid = uuidv4();

    await this.databaseService.db.insert(materialIndents).values({
      uuid,
      tenantId: tenant.id,
      indentNumber,
      siteId: data.siteId,
      requestedById: user.id,
      priority: data.priority || 'medium',
      status: 'submitted',
      purpose: data.purpose || 'Site Material Indent',
      remarks: data.remarks || null,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(materialIndents)
      .where(and(eq(materialIndents.tenantId, tenant.id), eq(materialIndents.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create material indent');
    }

    if (data.items && Array.isArray(data.items)) {
      for (const it of data.items) {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.estimatedRate) || 0;
        await this.databaseService.db.insert(indentItems).values({
          indentId: created.id,
          itemId: it.itemId,
          quantity: qty.toFixed(3),
          unitId: it.unitId,
          estimatedRate: rate.toFixed(2),
          estimatedAmount: (qty * rate).toFixed(2),
          remarks: it.remarks || null,
        });
      }
    }

    return this.getIndentById(tenant, created.id);
  }

  async updateIndentStatus(tenant: TenantContext, user: any, id: number, status: 'approved' | 'rejected' | 'submitted' | 'cancelled') {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
    }

    await this.databaseService.db
      .update(materialIndents)
      .set(updateData)
      .where(and(eq(materialIndents.tenantId, tenant.id), eq(materialIndents.id, id)));

    return this.getIndentById(tenant, id);
  }

  // ── 2. RFQ & COMPARATIVE STATEMENT ────────────────────────────────────────
  async getRfqs(tenant: TenantContext) {
    const rows = await this.databaseService.db
      .select({
        id: rfqs.id,
        uuid: rfqs.uuid,
        rfqNumber: rfqs.rfqNumber,
        title: rfqs.title,
        siteId: rfqs.siteId,
        siteName: sites.name,
        status: rfqs.status,
        deadlineDate: rfqs.deadlineDate,
        createdAt: rfqs.createdAt,
      })
      .from(rfqs)
      .leftJoin(sites, eq(rfqs.siteId, sites.id))
      .where(eq(rfqs.tenantId, tenant.id))
      .orderBy(desc(rfqs.createdAt));

    const quoteCounts = await this.databaseService.db
      .select({
        rfqId: rfqQuotations.rfqId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(rfqQuotations)
      .groupBy(rfqQuotations.rfqId);

    const countMap = new Map(quoteCounts.map((q) => [q.rfqId, Number(q.count)]));

    return rows.map((r) => ({
      ...r,
      quotationCount: countMap.get(r.id) || 0,
    }));
  }

  async getRfqById(tenant: TenantContext, id: number) {
    const [rfq] = await this.databaseService.db
      .select({
        id: rfqs.id,
        uuid: rfqs.uuid,
        rfqNumber: rfqs.rfqNumber,
        title: rfqs.title,
        indentId: rfqs.indentId,
        siteId: rfqs.siteId,
        siteName: sites.name,
        status: rfqs.status,
        notes: rfqs.notes,
        deadlineDate: rfqs.deadlineDate,
        createdAt: rfqs.createdAt,
      })
      .from(rfqs)
      .leftJoin(sites, eq(rfqs.siteId, sites.id))
      .where(and(eq(rfqs.tenantId, tenant.id), eq(rfqs.id, id)))
      .limit(1);

    if (!rfq) {
      throw new NotFoundException(`RFQ #${id} not found`);
    }

    const rfqLineItems = await this.databaseService.db
      .select({
        id: rfqItems.id,
        itemId: rfqItems.itemId,
        itemCode: items.code,
        itemName: items.name,
        hsnCode: items.hsnCode,
        quantity: rfqItems.quantity,
        unitId: rfqItems.unitId,
        unitCode: units.code,
        targetRate: rfqItems.targetRate,
      })
      .from(rfqItems)
      .leftJoin(items, eq(rfqItems.itemId, items.id))
      .leftJoin(units, eq(rfqItems.unitId, units.id))
      .where(eq(rfqItems.rfqId, id));

    const quotations = await this.databaseService.db
      .select({
        id: rfqQuotations.id,
        uuid: rfqQuotations.uuid,
        vendorId: rfqQuotations.vendorId,
        vendorCode: vendors.code,
        vendorName: vendors.name,
        vendorGstin: vendors.gstin,
        vendorStateCode: vendors.stateCode,
        quotationRef: rfqQuotations.quotationRef,
        quotationDate: rfqQuotations.quotationDate,
        subtotal: rfqQuotations.subtotal,
        taxAmount: rfqQuotations.taxAmount,
        totalAmount: rfqQuotations.totalAmount,
        paymentTerms: rfqQuotations.paymentTerms,
        deliveryLeadTimeDays: rfqQuotations.deliveryLeadTimeDays,
        isLowest: rfqQuotations.isLowest,
        isAwarded: rfqQuotations.isAwarded,
        status: rfqQuotations.status,
        remarks: rfqQuotations.remarks,
      })
      .from(rfqQuotations)
      .leftJoin(vendors, eq(rfqQuotations.vendorId, vendors.id))
      .where(eq(rfqQuotations.rfqId, id));

    return {
      ...rfq,
      items: rfqLineItems,
      quotations,
    };
  }

  async createRfq(tenant: TenantContext, data: any) {
    const rfqNumber = await this.getNextDocumentNumber(tenant.id, 'RFQ', 'KB/RFQ');
    const uuid = uuidv4();

    await this.databaseService.db.insert(rfqs).values({
      uuid,
      tenantId: tenant.id,
      rfqNumber,
      indentId: data.indentId || null,
      siteId: data.siteId,
      title: data.title,
      status: 'draft',
      notes: data.notes || null,
      deadlineDate: data.deadlineDate ? new Date(data.deadlineDate) : null,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(rfqs)
      .where(and(eq(rfqs.tenantId, tenant.id), eq(rfqs.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create RFQ');
    }

    if (data.items && Array.isArray(data.items)) {
      for (const it of data.items) {
        await this.databaseService.db.insert(rfqItems).values({
          rfqId: created.id,
          itemId: it.itemId,
          quantity: Number(it.quantity).toFixed(3),
          unitId: it.unitId,
          targetRate: it.targetRate ? Number(it.targetRate).toFixed(2) : null,
        });
      }
    }

    return this.getRfqById(tenant, created.id);
  }

  // ── 3. PURCHASE ORDERS ────────────────────────────────────────────────────
  async getPurchaseOrders(tenant: TenantContext, status?: string) {
    const conditions = [eq(purchaseOrders.tenantId, tenant.id)];
    if (status) {
      conditions.push(eq(purchaseOrders.status, status as any));
    }

    return this.databaseService.db
      .select({
        id: purchaseOrders.id,
        uuid: purchaseOrders.uuid,
        poNumber: purchaseOrders.poNumber,
        poDate: purchaseOrders.poDate,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        vendorCode: vendors.code,
        vendorGstin: vendors.gstin,
        siteId: purchaseOrders.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        status: purchaseOrders.status,
        isInterState: purchaseOrders.isInterState,
        taxableAmount: purchaseOrders.taxableAmount,
        cgstAmount: purchaseOrders.cgstAmount,
        sgstAmount: purchaseOrders.sgstAmount,
        igstAmount: purchaseOrders.igstAmount,
        totalAmount: purchaseOrders.totalAmount,
        paymentTerms: purchaseOrders.paymentTerms,
        deliveryDate: purchaseOrders.deliveryDate,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .leftJoin(sites, eq(purchaseOrders.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrderById(tenant: TenantContext, id: number) {
    const [po] = await this.databaseService.db
      .select({
        id: purchaseOrders.id,
        uuid: purchaseOrders.uuid,
        poNumber: purchaseOrders.poNumber,
        poDate: purchaseOrders.poDate,
        deliveryDate: purchaseOrders.deliveryDate,
        paymentTerms: purchaseOrders.paymentTerms,
        status: purchaseOrders.status,
        isInterState: purchaseOrders.isInterState,
        subtotal: purchaseOrders.subtotal,
        discountAmount: purchaseOrders.discountAmount,
        taxableAmount: purchaseOrders.taxableAmount,
        cgstAmount: purchaseOrders.cgstAmount,
        sgstAmount: purchaseOrders.sgstAmount,
        igstAmount: purchaseOrders.igstAmount,
        roundOff: purchaseOrders.roundOff,
        totalAmount: purchaseOrders.totalAmount,
        amountInWords: purchaseOrders.amountInWords,
        billingAddress: purchaseOrders.billingAddress,
        shippingAddress: purchaseOrders.shippingAddress,
        termsAndConditions: purchaseOrders.termsAndConditions,
        idempotencyKey: purchaseOrders.idempotencyKey,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        vendorCode: vendors.code,
        vendorGstin: vendors.gstin,
        vendorPan: vendors.pan,
        vendorPhone: vendors.phone,
        vendorStateCode: vendors.stateCode,
        vendorAddress: vendors.address,
        vendorBankName: vendors.bankName,
        vendorBankAcc: vendors.bankAccountNo,
        vendorBankIfsc: vendors.bankIfsc,
        siteId: purchaseOrders.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        siteAddress: sites.address,
        siteCity: sites.city,
        sitePincode: sites.pincode,
        createdById: purchaseOrders.createdById,
        createdByName: users.fullName,
        approvedAt: purchaseOrders.approvedAt,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .leftJoin(sites, eq(purchaseOrders.siteId, sites.id))
      .leftJoin(users, eq(purchaseOrders.createdById, users.id))
      .where(and(eq(purchaseOrders.tenantId, tenant.id), eq(purchaseOrders.id, id)))
      .limit(1);

    if (!po) {
      throw new NotFoundException(`Purchase Order #${id} not found`);
    }

    const lines = await this.databaseService.db
      .select({
        id: poItems.id,
        itemId: poItems.itemId,
        itemCode: items.code,
        itemName: items.name,
        hsnCode: items.hsnCode,
        quantity: poItems.quantity,
        unitId: poItems.unitId,
        unitCode: units.code,
        unitRate: poItems.unitRate,
        discountPercent: poItems.discountPercent,
        taxableAmount: poItems.taxableAmount,
        gstRate: poItems.gstRate,
        cgstAmount: poItems.cgstAmount,
        sgstAmount: poItems.sgstAmount,
        igstAmount: poItems.igstAmount,
        totalAmount: poItems.totalAmount,
        receivedQuantity: poItems.receivedQuantity,
        remarks: poItems.remarks,
      })
      .from(poItems)
      .leftJoin(items, eq(poItems.itemId, items.id))
      .leftJoin(units, eq(poItems.unitId, units.id))
      .where(eq(poItems.poId, id));

    return {
      ...po,
      items: lines,
    };
  }

  async createPurchaseOrder(tenant: TenantContext, user: any, data: any) {
    // 1. Check idempotency
    if (data.idempotencyKey) {
      const [existing] = await this.databaseService.db
        .select()
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.tenantId, tenant.id),
            eq(purchaseOrders.idempotencyKey, data.idempotencyKey)
          )
        )
        .limit(1);
      if (existing) {
        return this.getPurchaseOrderById(tenant, existing.id);
      }
    }

    // 2. Fetch Vendor & Site
    const [vendor] = await this.databaseService.db
      .select()
      .from(vendors)
      .where(and(eq(vendors.tenantId, tenant.id), eq(vendors.id, data.vendorId)))
      .limit(1);
    if (!vendor) {
      throw new BadRequestException('Selected vendor does not exist');
    }

    const [site] = await this.databaseService.db
      .select()
      .from(sites)
      .where(and(eq(sites.tenantId, tenant.id), eq(sites.id, data.siteId)))
      .limit(1);
    if (!site) {
      throw new BadRequestException('Selected site does not exist');
    }

    // 3. Calculate GST using pure engine
    const gstInputs: GstLineItemInput[] = (data.items || []).map((it: any) => ({
      hsnCode: it.hsnCode || '999999',
      qty: Number(it.quantity) || 1,
      rate: Number(it.unitRate) || 0,
      discountPercent: Number(it.discountPercent) || 0,
      gstRate: (it.gstRate === 'Exempt' ? 'Exempt' : Number(it.gstRate)) as any,
    }));

    const isInterState = (vendor.stateCode ?? '27') !== (tenant.stateCode ?? '27');
    const gstResult = calculateGst(
      gstInputs,
      tenant.stateCode ?? '27',
      vendor.stateCode ?? '27'
    );

    // 4. Generate PO Number
    const poNumber = await this.getNextDocumentNumber(tenant.id, 'PO', 'KB/PO');
    const uuid = uuidv4();

    await this.databaseService.db.insert(purchaseOrders).values({
      uuid,
      tenantId: tenant.id,
      poNumber,
      indentId: data.indentId || null,
      rfqId: data.rfqId || null,
      quotationId: data.quotationId || null,
      vendorId: vendor.id,
      siteId: site.id,
      warehouseId: data.warehouseId || null,
      poDate: data.poDate ? new Date(data.poDate) : new Date(),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      paymentTerms: data.paymentTerms || vendor.paymentTerms || '30 Days Net',
      status: 'pending_approval',
      isInterState,
      subtotal: gstResult.subTotal.toFixed(2),
      discountAmount: '0.00',
      taxableAmount: gstResult.taxableTotal.toFixed(2),
      cgstAmount: gstResult.cgstTotal.toFixed(2),
      sgstAmount: gstResult.sgstTotal.toFixed(2),
      igstAmount: gstResult.igstTotal.toFixed(2),
      roundOff: gstResult.roundOff.toFixed(2),
      totalAmount: gstResult.grandTotal.toFixed(2),
      amountInWords: gstResult.amountInWords,
      billingAddress: data.billingAddress || `${tenant.name}, ${tenant.address || 'Mumbai, Maharashtra'}`,
      shippingAddress: data.shippingAddress || `${site.name}, ${site.address}, ${site.city} - ${site.pincode}`,
      termsAndConditions: data.termsAndConditions || '1. Material must match specification and ISI/BIS standards.\n2. Invoices must quote PO Number.\n3. Goods inspected and verified upon arrival before GRN sign-off.',
      idempotencyKey: data.idempotencyKey || null,
      createdById: user.id,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.tenantId, tenant.id), eq(purchaseOrders.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create purchase order');
    }

    // 5. Insert PO Items
    for (let i = 0; i < gstResult.items.length; i++) {
      const line = gstResult.items[i];
      const it = data.items[i];
      if (!line || !it) continue;

      await this.databaseService.db.insert(poItems).values({
        poId: created.id,
        itemId: it.itemId,
        quantity: Number(it.quantity).toFixed(3),
        unitId: it.unitId,
        unitRate: Number(it.unitRate).toFixed(2),
        discountPercent: (Number(it.discountPercent) || 0).toFixed(2),
        taxableAmount: line.taxableAmount.toFixed(2),
        gstRate: String(it.gstRate || '18'),
        cgstAmount: line.cgstAmount.toFixed(2),
        sgstAmount: line.sgstAmount.toFixed(2),
        igstAmount: line.igstAmount.toFixed(2),
        totalAmount: line.totalAmount.toFixed(2),
        receivedQuantity: '0.000',
        remarks: it.remarks || null,
      });
    }

    // Trigger Notification for PO Approval Required
    try {
      await this.notificationsService.notifyPoApprovalRequired(tenant.id, {
        id: created.id,
        poNumber: created.poNumber,
        totalAmount: created.totalAmount,
        vendorName: vendor.name,
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return this.getPurchaseOrderById(tenant, created.id);
  }

  async updatePurchaseOrderStatus(
    tenant: TenantContext,
    user: any,
    id: number,
    status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'cancelled'
  ) {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
    }

    await this.databaseService.db
      .update(purchaseOrders)
      .set(updateData)
      .where(and(eq(purchaseOrders.tenantId, tenant.id), eq(purchaseOrders.id, id)));

    const updated = await this.getPurchaseOrderById(tenant, id);

    // Trigger Notification if Approved/Sent
    if (status === 'approved' || status === 'issued') {
      try {
        await this.notificationsService.notifyPoSent(tenant.id, {
          id: updated.id,
          poNumber: updated.poNumber,
          vendorName: updated.vendorName || 'Vendor',
        });
      } catch {
        // Non-blocking
      }
    }

    return updated;
  }

  async sharePoWhatsApp(tenant: TenantContext, id: number, customPhone?: string) {
    const po = await this.getPurchaseOrderById(tenant, id);
    const targetPhone = customPhone || po.vendorPhone || '+91 98200 44444';

    const result = await this.notificationsService.sharePoViaWhatsApp({
      poNumber: po.poNumber,
      vendorName: po.vendorName || 'Vendor',
      to: targetPhone,
      totalAmount: po.totalAmount,
    });

    return {
      success: true,
      poNumber: po.poNumber,
      recipient: targetPhone,
      result,
    };
  }

  async requestApprovalWhatsApp(tenant: TenantContext, id: number, approverPhone?: string) {
    const po = await this.getPurchaseOrderById(tenant, id);
    const targetPhone = approverPhone || '+91 98200 11111'; // Owner/Boss default

    const result = await this.notificationsService.sendInteractivePoApproval({
      poNumber: po.poNumber,
      to: targetPhone,
      amount: po.totalAmount,
      vendorName: po.vendorName || 'Vendor',
      siteName: po.siteName || 'Project Site',
    });

    return {
      success: true,
      poNumber: po.poNumber,
      recipient: targetPhone,
      result,
    };
  }
}
