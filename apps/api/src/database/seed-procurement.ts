import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';
import { calculateGst, GstLineItemInput } from '@builderp/shared';

async function main() {
  console.log('🌱 Starting BuildERP Phase P3 Procurement Seeding...');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT) || 3307,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'builderp',
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  // 1. Fetch Tenant (Kings Builders)
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, 'kings')).limit(1);
  if (!tenant) {
    console.error('❌ Tenant "kings" not found. Please run base seed first.');
    process.exit(1);
  }
  console.log(`🏢 Tenant: ${tenant.name} (State: ${tenant.stateCode})`);

  // 2. Fetch Users
  const allUsers = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenant.id));
  const bossUser = allUsers.find((u) => u.username === 'boss') ?? allUsers[0];
  const purchaseUser = allUsers.find((u) => u.username === 'purchase') ?? allUsers[0];
  const siteUser = allUsers.find((u) => u.username === 'sitemgr') ?? allUsers[0];

  // 3. Fetch Sites
  const allSites = await db.select().from(schema.sites).where(eq(schema.sites.tenantId, tenant.id));
  const siteKH = allSites.find((s) => s.code === 'SITE-KH') ?? allSites[0];
  const siteRP = allSites.find((s) => s.code === 'SITE-RP') ?? allSites[1] ?? allSites[0];

  // 4. Fetch Warehouses
  const allWarehouses = await db.select().from(schema.warehouses).where(eq(schema.warehouses.tenantId, tenant.id));
  const whKH = allWarehouses.find((w) => w.siteId === siteKH.id) ?? allWarehouses[0];
  const whRP = allWarehouses.find((w) => w.siteId === siteRP.id) ?? allWarehouses[0];

  // 5. Fetch Vendors
  const allVendors = await db.select().from(schema.vendors).where(eq(schema.vendors.tenantId, tenant.id));
  const vendorKheteshwar = allVendors.find((v) => v.code === 'VEN-KHETESHWAR') ?? allVendors[0];
  const vendorJindal = allVendors.find((v) => v.code === 'VEN-STEEL-JINDAL' || v.stateCode !== '27') ?? allVendors[1];
  const vendorAmbuja = allVendors.find((v) => v.code === 'VEN-AMBUJA') ?? allVendors[2];

  // 6. Fetch Items
  const allItems = await db.select().from(schema.items).where(eq(schema.items.tenantId, tenant.id));

  // Ensure RFQ series exists
  const [rfqSeries] = await db
    .select()
    .from(schema.documentSeries)
    .where(
      and(
        eq(schema.documentSeries.tenantId, tenant.id),
        eq(schema.documentSeries.documentType, 'RFQ'),
        eq(schema.documentSeries.financialYear, '26-27')
      )
    );
  if (!rfqSeries) {
    await db.insert(schema.documentSeries).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      documentType: 'RFQ',
      prefix: 'KB/RFQ',
      financialYear: '26-27',
      nextNumber: 2,
      padding: 4,
    });
  }

  // ── SEED MATERIAL INDENT ──────────────────────────────────────────────────
  console.log('📌 Seeding Material Indent (Site Requisition)...');
  const indentNumber = 'KB/REQ/26-27/0001';
  let [indent] = await db
    .select()
    .from(schema.materialIndents)
    .where(
      and(
        eq(schema.materialIndents.tenantId, tenant.id),
        eq(schema.materialIndents.indentNumber, indentNumber)
      )
    );

  if (!indent) {
    await db.insert(schema.materialIndents).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      indentNumber,
      siteId: siteKH.id,
      requestedById: siteUser.id,
      priority: 'urgent',
      status: 'approved',
      purpose: 'Structural RCC Column casting for 14th floor slab at Kings Heights',
      remarks: 'Delivery required before weekend casting schedule',
      approvedById: bossUser.id,
      approvedAt: new Date(),
    });

    [indent] = await db
      .select()
      .from(schema.materialIndents)
      .where(
        and(
          eq(schema.materialIndents.tenantId, tenant.id),
          eq(schema.materialIndents.indentNumber, indentNumber)
        )
      );

    const cementItem = allItems.find((i) => i.code === 'MAT-CEM-53') ?? allItems[0];
    const steel12Item = allItems.find((i) => i.code === 'MAT-STL-12') ?? allItems[1];
    const sandItem = allItems.find((i) => i.code === 'MAT-SAND') ?? allItems[2];

    await db.insert(schema.indentItems).values([
      {
        indentId: indent.id,
        itemId: cementItem.id,
        quantity: '200.000',
        unitId: cementItem.unitId,
        estimatedRate: '385.00',
        estimatedAmount: '77000.00',
        remarks: 'UltraTech OPC 53 Grade',
      },
      {
        indentId: indent.id,
        itemId: steel12Item.id,
        quantity: '5.000',
        unitId: steel12Item.unitId,
        estimatedRate: '58500.00',
        estimatedAmount: '292500.00',
        remarks: 'Tata Tiscon Fe550D 12mm',
      },
      {
        indentId: indent.id,
        itemId: sandItem.id,
        quantity: '10.000',
        unitId: sandItem.unitId,
        estimatedRate: '7500.00',
        estimatedAmount: '75000.00',
        remarks: 'Zone II River Sand for structural concrete',
      },
    ]);
    console.log(`✅ Seeded Indent ${indentNumber} with 3 items.`);
  }

  // ── SEED RFQ & COMPARATIVE QUOTATIONS ────────────────────────────────────
  console.log('📌 Seeding RFQ & Vendor Quotations...');
  const rfqNumber = 'KB/RFQ/26-27/0001';
  let [rfq] = await db
    .select()
    .from(schema.rfqs)
    .where(
      and(
        eq(schema.rfqs.tenantId, tenant.id),
        eq(schema.rfqs.rfqNumber, rfqNumber)
      )
    );

  if (!rfq) {
    await db.insert(schema.rfqs).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      rfqNumber,
      indentId: indent.id,
      siteId: siteKH.id,
      title: 'RFQ for OPC 53 Grade Cement & TMT Rebar Fe550D - Kings Heights',
      status: 'evaluated',
      notes: 'Payment terms 30 days credit. Lowest rate (L1) with verified BIS certification will be awarded.',
    });

    [rfq] = await db
      .select()
      .from(schema.rfqs)
      .where(
        and(
          eq(schema.rfqs.tenantId, tenant.id),
          eq(schema.rfqs.rfqNumber, rfqNumber)
        )
      );

    const cementItem = allItems.find((i) => i.code === 'MAT-CEM-53') ?? allItems[0];
    const steel12Item = allItems.find((i) => i.code === 'MAT-STL-12') ?? allItems[1];

    await db.insert(schema.rfqItems).values([
      {
        rfqId: rfq.id,
        itemId: cementItem.id,
        quantity: '200.000',
        unitId: cementItem.unitId,
        targetRate: '380.00',
      },
      {
        rfqId: rfq.id,
        itemId: steel12Item.id,
        quantity: '5.000',
        unitId: steel12Item.unitId,
        targetRate: '58000.00',
      },
    ]);

    // Quotation 1: Kheteshwar Trading (Intra-state Maharashtra) - L1 Winner
    await db.insert(schema.rfqQuotations).values({
      uuid: uuidv4(),
      rfqId: rfq.id,
      vendorId: vendorKheteshwar.id,
      quotationRef: 'KT/QTN/2026/0442',
      quotationDate: new Date(),
      subtotal: '364500.00',
      taxAmount: '73710.00',
      totalAmount: '438210.00',
      paymentTerms: '30 Days Net',
      deliveryLeadTimeDays: 2,
      isLowest: true,
      isAwarded: true,
      status: 'accepted',
      remarks: 'L1 Lowest bidder. Verified BIS batch test certificates attached.',
    });

    // Quotation 2: Ambuja Direct Distributor
    await db.insert(schema.rfqQuotations).values({
      uuid: uuidv4(),
      rfqId: rfq.id,
      vendorId: vendorAmbuja.id,
      quotationRef: 'AMB/MUM/8821',
      quotationDate: new Date(),
      subtotal: '372000.00',
      taxAmount: '75480.00',
      totalAmount: '447480.00',
      paymentTerms: '15 Days Net',
      deliveryLeadTimeDays: 4,
      isLowest: false,
      isAwarded: false,
      status: 'received',
      remarks: 'Higher quote by ₹9,270.00.',
    });

    console.log(`✅ Seeded RFQ ${rfqNumber} with comparative quotes & L1 winner.`);
  }

  // ── SEED PURCHASE ORDERS ─────────────────────────────────────────────────
  console.log('📌 Seeding Purchase Orders with exact GST math...');

  // Reset POs to seed fresh exact calculations
  await db.delete(schema.poItems);
  await db.delete(schema.purchaseOrders);

  const gcsQuantities: Record<string, number> = {
    'HK-01-BATH': 5,
    'HK-02-SURF': 5,
    'HK-03-GLASS': 5,
    'HK-04-TOILET': 5,
    'HK-05-SONA': 5,
    'HK-06-DUST': 20,
    'HK-07-GARB': 10,
    'HK-08-MOP': 5,
    'HK-09-SBROOM': 5,
    'HK-10-HBROOM': 5,
    'HK-11-TBRUSH': 10,
    'HK-12-FEATHER': 5,
    'HK-13-DUSTPAN': 5,
    'HK-14-KATHA': 10,
    'HK-15-GWIPER': 5,
    'HK-16-PKATA': 10,
    'HK-17-WIPERBIG': 5,
    'HK-18-ACID': 10,
    'HK-19-PATRA': 5,
    'HK-20-GLOVES': 10,
    'HK-21-MASK': 100,
    'HK-22-MICROFIBER': 34,
  };

  // PO #1: Kings Heights Housekeeping & Consumables PO (GCS.pdf exact match!)
  const po1Number = 'KB/PO/26-27/0001';
  let [po1] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(
      and(
        eq(schema.purchaseOrders.tenantId, tenant.id),
        eq(schema.purchaseOrders.poNumber, po1Number)
      )
    );

  if (!po1) {
    const gcsItems = allItems.filter((i) => i.code.startsWith('HK-'));
    const isInterState = (vendorKheteshwar.stateCode ?? '27') !== (tenant.stateCode ?? '27');

    const gstInputs: GstLineItemInput[] = gcsItems.map((item) => ({
      hsnCode: item.hsnCode ?? '340290',
      qty: gcsQuantities[item.code] ?? (Number(item.reorderLevel) || 1),
      rate: Number(item.defaultRate),
      discountPercent: 0,
      gstRate: (item.gstRate === 'Exempt' ? 'Exempt' : Number(item.gstRate)) as any,
    }));

    const gstResult = calculateGst(
      gstInputs,
      tenant.stateCode ?? '27',
      vendorKheteshwar.stateCode ?? '27'
    );

    await db.insert(schema.purchaseOrders).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      poNumber: po1Number,
      indentId: null,
      rfqId: null,
      quotationId: null,
      vendorId: vendorKheteshwar.id,
      siteId: siteKH.id,
      warehouseId: whKH ? whKH.id : null,
      poDate: new Date(),
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      paymentTerms: '30 Days Net from date of GRN inspection',
      status: 'approved',
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
      billingAddress: `${tenant.name}, ${tenant.address || 'Andheri West, Mumbai, Maharashtra 400053'}`,
      shippingAddress: `${siteKH.name}, ${siteKH.address}, ${siteKH.city} - ${siteKH.pincode}`,
      termsAndConditions: '1. Materials must be supplied in genuine manufacturer sealed packings.\n2. Invoices must quote PO Number and Site Delivery Address.\n3. Defective or expired batches will be rejected at supplier cost.\n4. Payment will be released within 30 days upon Store Inward GRN approval.',
      createdById: purchaseUser.id,
      approvedById: bossUser.id,
      approvedAt: new Date(),
    });

    [po1] = await db
      .select()
      .from(schema.purchaseOrders)
      .where(
        and(
          eq(schema.purchaseOrders.tenantId, tenant.id),
          eq(schema.purchaseOrders.poNumber, po1Number)
        )
      );

    // Insert PO Lines
    for (let i = 0; i < gstResult.items.length; i++) {
      const line = gstResult.items[i];
      const origItem = gcsItems[i];
      const input = gstInputs[i];
      await db.insert(schema.poItems).values({
        poId: po1.id,
        itemId: origItem.id,
        quantity: input.qty.toFixed(3),
        unitId: origItem.unitId,
        unitRate: input.rate.toFixed(2),
        discountPercent: '0.00',
        taxableAmount: line.taxableAmount.toFixed(2),
        gstRate: String(origItem.gstRate),
        cgstAmount: line.cgstAmount.toFixed(2),
        sgstAmount: line.sgstAmount.toFixed(2),
        igstAmount: line.igstAmount.toFixed(2),
        totalAmount: line.totalAmount.toFixed(2),
        receivedQuantity: '0.000',
        remarks: 'As per GCS.pdf standard price list',
      });
    }

    console.log(`✅ Seeded PO ${po1Number} (GCS.pdf) Total: ₹${gstResult.grandTotal.toFixed(2)} (${gstResult.amountInWords})`);
  }

  // PO #2: Inter-State Heavy Steel Rebar PO (Jindal Steel & Power Ltd, Gujarat 24 -> Maharashtra 27 IGST 18%)
  const po2Number = 'KB/PO/26-27/0002';
  let [po2] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(
      and(
        eq(schema.purchaseOrders.tenantId, tenant.id),
        eq(schema.purchaseOrders.poNumber, po2Number)
      )
    );

  if (!po2) {
    const steel12 = allItems.find((i) => i.code === 'MAT-STL-12') ?? allItems[0];
    const steel16 = allItems.find((i) => i.code === 'MAT-STL-16') ?? allItems[1];

    const steelInputs: GstLineItemInput[] = [
      {
        hsnCode: steel12.hsnCode ?? '721420',
        qty: 10,
        rate: 58500,
        discountPercent: 0,
        gstRate: 18,
      },
      {
        hsnCode: steel16.hsnCode ?? '721420',
        qty: 10,
        rate: 58500,
        discountPercent: 0,
        gstRate: 18,
      },
    ];

    const isInterState = (vendorJindal.stateCode ?? '24') !== (tenant.stateCode ?? '27');
    const steelGst = calculateGst(
      steelInputs,
      tenant.stateCode ?? '27',
      vendorJindal.stateCode ?? '24'
    );

    await db.insert(schema.purchaseOrders).values({
      uuid: uuidv4(),
      tenantId: tenant.id,
      poNumber: po2Number,
      indentId: null,
      rfqId: null,
      quotationId: null,
      vendorId: vendorJindal.id,
      siteId: siteRP.id,
      warehouseId: whRP ? whRP.id : null,
      poDate: new Date(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paymentTerms: '45 Days LC / Bank Guarantee',
      status: 'issued',
      isInterState,
      subtotal: steelGst.subTotal.toFixed(2),
      discountAmount: '0.00',
      taxableAmount: steelGst.taxableTotal.toFixed(2),
      cgstAmount: steelGst.cgstTotal.toFixed(2),
      sgstAmount: steelGst.sgstTotal.toFixed(2),
      igstAmount: steelGst.igstTotal.toFixed(2),
      roundOff: steelGst.roundOff.toFixed(2),
      totalAmount: steelGst.grandTotal.toFixed(2),
      amountInWords: steelGst.amountInWords,
      billingAddress: `${tenant.name}, ${tenant.address || 'Andheri West, Mumbai, Maharashtra 400053'}`,
      shippingAddress: `${siteRP.name}, ${siteRP.address}, ${siteRP.city} - ${siteRP.pincode}`,
      termsAndConditions: '1. Test certificates (MTC) for Fe 550D must accompany vehicle dispatch.\n2. Weighbridge receipt at Site and Mill weight will be reconciled.\n3. Interstate E-Way bill must be generated by supplier before truck transit.\n4. Unloading at site by buyer crane.',
      createdById: purchaseUser.id,
      approvedById: bossUser.id,
      approvedAt: new Date(),
    });

    [po2] = await db
      .select()
      .from(schema.purchaseOrders)
      .where(
        and(
          eq(schema.purchaseOrders.tenantId, tenant.id),
          eq(schema.purchaseOrders.poNumber, po2Number)
        )
      );

    const steelItems = [steel12, steel16];
    for (let i = 0; i < steelGst.items.length; i++) {
      const line = steelGst.items[i];
      const origItem = steelItems[i];
      const input = steelInputs[i];
      await db.insert(schema.poItems).values({
        poId: po2.id,
        itemId: origItem.id,
        quantity: input.qty.toFixed(3),
        unitId: origItem.unitId,
        unitRate: input.rate.toFixed(2),
        discountPercent: '0.00',
        taxableAmount: line.taxableAmount.toFixed(2),
        gstRate: '18',
        cgstAmount: line.cgstAmount.toFixed(2),
        sgstAmount: line.sgstAmount.toFixed(2),
        igstAmount: line.igstAmount.toFixed(2),
        totalAmount: line.totalAmount.toFixed(2),
        receivedQuantity: '0.000',
        remarks: 'Direct dispatch from Vadodara plant',
      });
    }

    console.log(`✅ Seeded Inter-State PO ${po2Number} (Total: ₹${steelGst.grandTotal.toFixed(2)}, IGST: ₹${steelGst.igstTotal.toFixed(2)})`);
  }

  // Update PO document series next_number to 3
  await db
    .update(schema.documentSeries)
    .set({ nextNumber: 3 })
    .where(
      and(
        eq(schema.documentSeries.tenantId, tenant.id),
        eq(schema.documentSeries.documentType, 'PO'),
        eq(schema.documentSeries.financialYear, '26-27')
      )
    );

  await connection.end();
  console.log('🎉 Phase P3 Procurement Seeding completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error during procurement seeding:', err);
  process.exit(1);
});
