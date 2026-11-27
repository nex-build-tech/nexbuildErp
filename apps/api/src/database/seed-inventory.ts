import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';

async function main() {
  console.log('🌱 Starting BuildERP Phase P4 Inventory & GRN Seeding...');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT) || 3307,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'builderp',
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  // 1. Fetch Tenant
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, 'kings')).limit(1);
  if (!tenant) {
    console.error('❌ Tenant "kings" not found.');
    process.exit(1);
  }

  // 2. Fetch Users
  const allUsers = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenant.id));
  const storeUser = allUsers.find((u) => u.username === 'store') ?? allUsers[0]!;
  const siteUser = allUsers.find((u) => u.username === 'sitemgr') ?? allUsers[0]!;

  // 3. Fetch Sites & Warehouses
  const allSites = await db.select().from(schema.sites).where(eq(schema.sites.tenantId, tenant.id));
  const siteKH = allSites.find((s) => s.code === 'SITE-KH') ?? allSites[0]!;
  const siteRP = allSites.find((s) => s.code === 'SITE-RP') ?? allSites[1] ?? allSites[0]!;

  const allWarehouses = await db.select().from(schema.warehouses).where(eq(schema.warehouses.tenantId, tenant.id));
  const whKH = allWarehouses.find((w) => w.siteId === siteKH.id) ?? allWarehouses[0]!;
  const whRP = allWarehouses.find((w) => w.siteId === siteRP.id) ?? allWarehouses[0]!;

  // 4. Fetch Contractors
  const allContractors = await db.select().from(schema.contractors).where(eq(schema.contractors.tenantId, tenant.id));
  const civilContractor = allContractors.find((c) => c.code === 'CONT-CIVIL') ?? allContractors[0]!;

  // Clean old GRN & Issue seed data to run freshly
  await db.delete(schema.grnItems);
  await db.delete(schema.goodsReceiptNotes);
  await db.delete(schema.materialIssueItems);
  await db.delete(schema.materialIssues);
  await db.delete(schema.stockLedger);
  await db.delete(schema.stockBalances);

  // ── SEED GRN #1 (Against PO #1: Kheteshwar Housekeeping at Kings Heights) ───
  console.log('📌 Seeding GRN #1 (Store Inward for PO KB/PO/26-27/0001)...');
  const [po1] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.tenantId, tenant.id), eq(schema.purchaseOrders.poNumber, 'KB/PO/26-27/0001')))
    .limit(1);

  if (po1) {
    const po1Lines = await db.select().from(schema.poItems).where(eq(schema.poItems.poId, po1.id));
    const grn1Number = 'KB/GRN/26-27/0001';

    await db.insert(schema.goodsReceiptNotes).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      grnNumber: grn1Number,
      poId: po1.id,
      vendorId: po1.vendorId,
      siteId: siteKH.id,
      warehouseId: whKH.id,
      challanNo: 'CH-KT-2026-9041',
      challanDate: new Date(),
      invoiceNo: 'INV-KT-2026-4412',
      invoiceDate: new Date(),
      vehicleNo: 'MH-02-CW-4921 (Tata Ace)',
      receivedDate: new Date(),
      status: 'verified',
      gatePassNo: 'GP/KH/089',
      inspectionRemarks: 'All 22 housekeeping packs received in sealed condition. Batch verified with zero damage.',
      receivedById: storeUser.id,
      verifiedById: siteUser.id,
    });

    const [grn1] = await db
      .select()
      .from(schema.goodsReceiptNotes)
      .where(and(eq(schema.goodsReceiptNotes.tenantId, tenant.id), eq(schema.goodsReceiptNotes.grnNumber, grn1Number)))
      .limit(1);

    for (const line of po1Lines) {
      const qty = Number(line.quantity);
      const rate = Number(line.unitRate);
      const val = (qty * rate).toFixed(2);

      // 1. Insert GRN Item
      await db.insert(schema.grnItems).values({
        grnId: grn1!.id,
        poItemId: line.id,
        itemId: line.itemId,
        orderedQty: line.quantity,
        receivedQty: line.quantity,
        acceptedQty: line.quantity,
        rejectedQty: '0.000',
        unitId: line.unitId,
        unitRate: line.unitRate,
        totalValue: val,
        batchNo: 'BATCH-2026-A1',
      });

      // 2. Update PO item received quantity
      await db
        .update(schema.poItems)
        .set({ receivedQuantity: line.quantity })
        .where(eq(schema.poItems.id, line.id));

      // 3. Stock Ledger Entry (Inward)
      await db.insert(schema.stockLedger).values({
        tenantId: tenant.id,
        warehouseId: whKH.id,
        siteId: siteKH.id,
        itemId: line.itemId,
        movementType: 'grn_inward',
        referenceType: 'GRN',
        referenceId: grn1!.id,
        referenceNumber: grn1Number,
        quantity: line.quantity,
        balanceAfter: line.quantity,
        unitRate: line.unitRate,
        totalValue: val,
        performedById: storeUser.id,
        notes: `Store inward against PO ${po1.poNumber} & Challan CH-KT-2026-9041`,
      });

      // 4. Stock Balance Entry
      await db.insert(schema.stockBalances).values({
        tenantId: tenant.id,
        warehouseId: whKH.id,
        siteId: siteKH.id,
        itemId: line.itemId,
        quantity: line.quantity,
        weightedAvgRate: line.unitRate,
        totalValue: val,
      });
    }

    // Mark PO #1 as completed
    await db
      .update(schema.purchaseOrders)
      .set({ status: 'completed' })
      .where(eq(schema.purchaseOrders.id, po1.id));

    console.log(`✅ GRN ${grn1Number} completed with ${po1Lines.length} items. PO ${po1.poNumber} marked completed.`);
  }

  // ── SEED GRN #2 (Against PO #2: Jindal Steel at Royal Palm) ────────────────
  console.log('📌 Seeding GRN #2 (Store Inward for Steel Rebar PO KB/PO/26-27/0002)...');
  const [po2] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.tenantId, tenant.id), eq(schema.purchaseOrders.poNumber, 'KB/PO/26-27/0002')))
    .limit(1);

  if (po2) {
    const po2Lines = await db.select().from(schema.poItems).where(eq(schema.poItems.poId, po2.id));
    const grn2Number = 'KB/GRN/26-27/0002';

    await db.insert(schema.goodsReceiptNotes).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      grnNumber: grn2Number,
      poId: po2.id,
      vendorId: po2.vendorId,
      siteId: siteRP.id,
      warehouseId: whRP.id,
      challanNo: 'CH-JSPL-2026-10294',
      challanDate: new Date(),
      invoiceNo: 'INV-JSPL-2026-08812',
      invoiceDate: new Date(),
      vehicleNo: 'GJ-06-AX-8912 (10-wheeler)',
      receivedDate: new Date(),
      status: 'verified',
      gatePassNo: 'GP/RP/104',
      inspectionRemarks: 'Mill Test Certificate (MTC) Fe 550D verified. Weighbridge net weight matches delivery invoice 20.00 MT.',
      receivedById: storeUser.id,
      verifiedById: siteUser.id,
    });

    const [grn2] = await db
      .select()
      .from(schema.goodsReceiptNotes)
      .where(and(eq(schema.goodsReceiptNotes.tenantId, tenant.id), eq(schema.goodsReceiptNotes.grnNumber, grn2Number)))
      .limit(1);

    for (const line of po2Lines) {
      const qty = Number(line.quantity);
      const rate = Number(line.unitRate);
      const val = (qty * rate).toFixed(2);

      await db.insert(schema.grnItems).values({
        grnId: grn2!.id,
        poItemId: line.id,
        itemId: line.itemId,
        orderedQty: line.quantity,
        receivedQty: line.quantity,
        acceptedQty: line.quantity,
        rejectedQty: '0.000',
        unitId: line.unitId,
        unitRate: line.unitRate,
        totalValue: val,
        batchNo: 'JINDAL-HEAT-7712',
      });

      await db
        .update(schema.poItems)
        .set({ receivedQuantity: line.quantity })
        .where(eq(schema.poItems.id, line.id));

      await db.insert(schema.stockLedger).values({
        tenantId: tenant.id,
        warehouseId: whRP.id,
        siteId: siteRP.id,
        itemId: line.itemId,
        movementType: 'grn_inward',
        referenceType: 'GRN',
        referenceId: grn2!.id,
        referenceNumber: grn2Number,
        quantity: line.quantity,
        balanceAfter: line.quantity,
        unitRate: line.unitRate,
        totalValue: val,
        performedById: storeUser.id,
        notes: `TMT Rebar delivery against PO ${po2.poNumber} & Truck GJ-06-AX-8912`,
      });

      await db.insert(schema.stockBalances).values({
        tenantId: tenant.id,
        warehouseId: whRP.id,
        siteId: siteRP.id,
        itemId: line.itemId,
        quantity: line.quantity,
        weightedAvgRate: line.unitRate,
        totalValue: val,
      });
    }

    await db
      .update(schema.purchaseOrders)
      .set({ status: 'completed' })
      .where(eq(schema.purchaseOrders.id, po2.id));

    console.log(`✅ GRN ${grn2Number} completed with Steel Rebar. PO ${po2.poNumber} marked completed.`);
  }

  // ── SEED MATERIAL ISSUE #1 (Issue Steel Rebar to Civil Contractor at Royal Palm)
  console.log('📌 Seeding Material Issue #1 (Site Issue to Contractor)...');
  const issue1Number = 'KB/ISS/26-27/0001';

  await db.insert(schema.materialIssues).values({
    uuid: uuidv4(),
    tenantId: tenant.id,
    issueNumber: issue1Number,
    siteId: siteRP.id,
    warehouseId: whRP.id,
    contractorId: civilContractor.id,
    issuedToName: 'Omprakash Sharma (RCC Contractor Foreman)',
    purpose: 'Column & Beam Rebar fabrication for B-Wing 5th floor slab casting',
    issueDate: new Date(),
    status: 'issued',
    totalValue: '409500.00',
    issuedById: storeUser.id,
  });

  const [issue1] = await db
    .select()
    .from(schema.materialIssues)
    .where(and(eq(schema.materialIssues.tenantId, tenant.id), eq(schema.materialIssues.issueNumber, issue1Number)))
    .limit(1);

  // Issue 3 MT of 12mm Rebar & 4 MT of 16mm Rebar
  const steel12Item = (await db.select().from(schema.items).where(eq(schema.items.code, 'MAT-STL-12')).limit(1))[0]!;
  const steel16Item = (await db.select().from(schema.items).where(eq(schema.items.code, 'MAT-STL-16')).limit(1))[0]!;

  const issueLines = [
    { item: steel12Item, qty: 3, rate: 58500 },
    { item: steel16Item, qty: 4, rate: 58500 },
  ];

  for (const il of issueLines) {
    const totalVal = (il.qty * il.rate).toFixed(2);
    await db.insert(schema.materialIssueItems).values({
      issueId: issue1!.id,
      itemId: il.item.id,
      quantity: il.qty.toFixed(3),
      unitId: il.item.unitId,
      unitRate: il.rate.toFixed(2),
      totalValue: totalVal,
      remarks: 'Cutting & bending bar yard dispatch',
    });

    // Fetch previous balance
    const [balance] = await db
      .select()
      .from(schema.stockBalances)
      .where(and(eq(schema.stockBalances.warehouseId, whRP.id), eq(schema.stockBalances.itemId, il.item.id)))
      .limit(1);

    const prevQty = Number(balance?.quantity) || 10;
    const newQty = prevQty - il.qty;

    // Insert Stock Ledger (Outward: negative quantity)
    await db.insert(schema.stockLedger).values({
      tenantId: tenant.id,
      warehouseId: whRP.id,
      siteId: siteRP.id,
      itemId: il.item.id,
      movementType: 'site_issue',
      referenceType: 'ISSUE',
      referenceId: issue1!.id,
      referenceNumber: issue1Number,
      quantity: (-il.qty).toFixed(3),
      balanceAfter: newQty.toFixed(3),
      unitRate: il.rate.toFixed(2),
      totalValue: totalVal,
      performedById: storeUser.id,
      notes: `Issued to ${civilContractor.name} for 5th floor slab`,
    });

    // Update Stock Balance
    await db
      .update(schema.stockBalances)
      .set({
        quantity: newQty.toFixed(3),
        totalValue: (newQty * il.rate).toFixed(2),
      })
      .where(eq(schema.stockBalances.id, balance!.id));
  }

  console.log(`✅ Material Issue ${issue1Number} recorded. Rebar balance updated cleanly.`);
  console.log('🎉 Phase P4 Inventory & GRN Seeding completed successfully!');
  await connection.end();
}

main().catch((err) => {
  console.error('Fatal error during inventory seeding:', err);
  process.exit(1);
});
