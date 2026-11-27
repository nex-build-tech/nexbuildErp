import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';
import { numberToIndianWords } from '@builderp/shared';

async function main() {
  console.log('🌱 Starting BuildERP Phase P5 Contractor Billing Seeding...');

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
  const bossUser = allUsers.find((u) => u.username === 'boss') ?? allUsers[0]!;
  const siteUser = allUsers.find((u) => u.username === 'sitemgr') ?? allUsers[0]!;

  // 3. Fetch Sites
  const allSites = await db.select().from(schema.sites).where(eq(schema.sites.tenantId, tenant.id));
  const siteRP = allSites.find((s) => s.code === 'SITE-RP') ?? allSites[0]!;

  // 4. Fetch Contractors
  const allContractors = await db.select().from(schema.contractors).where(eq(schema.contractors.tenantId, tenant.id));
  const civilContractor = allContractors.find((c) => c.code === 'CONT-CIVIL') ?? allContractors[0]!;

  // Ensure Series for WO and RA exist
  const seriesDefs = [
    { type: 'WO', prefix: 'KB/WO', fy: '26-27', next: 2, pad: 4 },
    { type: 'RA', prefix: 'KB/RA', fy: '26-27', next: 2, pad: 4 },
  ];
  for (const s of seriesDefs) {
    const [existing] = await db
      .select()
      .from(schema.documentSeries)
      .where(
        and(
          eq(schema.documentSeries.tenantId, tenant.id),
          eq(schema.documentSeries.documentType, s.type),
          eq(schema.documentSeries.financialYear, s.fy)
        )
      );
    if (!existing) {
      await db.insert(schema.documentSeries).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        documentType: s.type,
        prefix: s.prefix,
        financialYear: s.fy,
        nextNumber: s.next,
        padding: s.pad,
      });
    }
  }

  // Clean old billing seed data
  await db.delete(schema.measurementSheets);
  await db.delete(schema.raBills);
  await db.delete(schema.woItems);
  await db.delete(schema.workOrders);

  // ── SEED WORK ORDER #1 ───────────────────────────────────────────────────
  console.log('📌 Seeding Subcontract Work Order KB/WO/26-27/0001...');
  const woNumber = 'KB/WO/26-27/0001';

  await db.insert(schema.workOrders).values({
    uuid: uuidv4(),
    tenantId: tenant.id,
    woNumber,
    contractorId: civilContractor.id,
    siteId: siteRP.id,
    title: 'RCC Structure & Framing Package for Tower B (G+18 Floors)',
    contractType: 'item_rate',
    startDate: new Date(),
    completionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    contractValue: '4500000.00',
    retentionPercent: '5.00',
    tdsPercent: '1.00',
    status: 'active',
    scopeOfWork: 'Complete civil RCC framework execution including column casting, shuttering, rebar fabrication and concrete placement.',
    terms: '1. Retention 5% deductible from all RA bills and released 6 months after snagging.\n2. TDS 1% deducted under Section 194C.\n3. Steel & Cement supplied free of cost by developer with 2% permissible wastage.\n4. Bi-weekly RA bill cycle.',
    createdById: bossUser.id,
  });

  const [wo] = await db
    .select()
    .from(schema.workOrders)
    .where(and(eq(schema.workOrders.tenantId, tenant.id), eq(schema.workOrders.woNumber, woNumber)))
    .limit(1);

  // BOQ Items
  await db.insert(schema.woItems).values([
    {
      woId: wo!.id,
      itemCode: 'RCC-M25-SLAB',
      description: 'M25 grade machine mixed concrete placement in slab & beams',
      unitCode: 'CUM',
      estimatedQty: '1200.000',
      executedQty: '80.000',
      rate: '1500.00',
      totalAmount: '1800000.00',
    },
    {
      woId: wo!.id,
      itemCode: 'SHUTTERING-PLY',
      description: 'Plywood shuttering & staging with steel props for slab & columns',
      unitCode: 'SQFT',
      estimatedQty: '15000.000',
      executedQty: '1000.000',
      rate: '120.00',
      totalAmount: '1800000.00',
    },
    {
      woId: wo!.id,
      itemCode: 'STEEL-BINDING',
      description: 'Cutting, bending, shifting & tying of Fe 550D TMT rebar',
      unitCode: 'MT',
      estimatedQty: '150.000',
      executedQty: '7.000',
      rate: '6000.00',
      totalAmount: '900000.00',
    },
  ]);

  const allWoItems = await db.select().from(schema.woItems).where(eq(schema.woItems.woId, wo!.id));
  const rccBoq = allWoItems.find((b) => b.itemCode === 'RCC-M25-SLAB')!;
  const shutBoq = allWoItems.find((b) => b.itemCode === 'SHUTTERING-PLY')!;
  const steelBoq = allWoItems.find((b) => b.itemCode === 'STEEL-BINDING')!;

  // ── SEED RA BILL #1 ───────────────────────────────────────────────────────
  console.log('📌 Seeding RA Bill #1 KB/RA/26-27/0001 with verified measurements...');
  const billNumber = 'KB/RA/26-27/0001';
  const grossAmount = 282000.00; // 80 CUM @ 1500 + 1000 SQFT @ 120 + 7 MT @ 6000
  const retentionAmount = 14100.00; // 5%
  const tdsAmount = 2820.00; // 1%
  const materialDeduction = 15000.00; // Material recovery
  const netPayable = grossAmount - retentionAmount - tdsAmount - materialDeduction; // 250080.00

  const words = numberToIndianWords(netPayable);

  await db.insert(schema.raBills).values({
    uuid: uuidv4(),
    tenantId: tenant.id,
    billNumber,
    raNumber: 1,
    woId: wo!.id,
    contractorId: civilContractor.id,
    siteId: siteRP.id,
    billDate: new Date(),
    periodStart: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(),
    grossAmount: grossAmount.toFixed(2),
    retentionAmount: retentionAmount.toFixed(2),
    tdsAmount: tdsAmount.toFixed(2),
    materialDeduction: materialDeduction.toFixed(2),
    otherDeductions: '0.00',
    netPayable: netPayable.toFixed(2),
    amountInWords: words,
    status: 'approved',
    certifiedById: siteUser.id,
    approvedById: bossUser.id,
    remarks: 'Measurements cross-verified on site by Project Engineer. Rebar consumption reconciled against GRN inward.',
  });

  const [ra] = await db
    .select()
    .from(schema.raBills)
    .where(and(eq(schema.raBills.tenantId, tenant.id), eq(schema.raBills.billNumber, billNumber)))
    .limit(1);

  // Measurement Sheet Entries (MB Book lines)
  await db.insert(schema.measurementSheets).values([
    {
      raBillId: ra!.id,
      woItemId: rccBoq.id,
      locationRef: 'Royal Palm Tower B, 5th Floor Slab Grid A1-D6',
      description: 'RCC M25 concrete casting in suspended slab and secondary beams',
      numberOfUnits: '1.00',
      length: '20.000',
      breadth: '8.000',
      depth: '0.500',
      totalQty: '80.000',
      rate: '1500.00',
      amount: '120000.00',
    },
    {
      raBillId: ra!.id,
      woItemId: shutBoq.id,
      locationRef: 'Royal Palm Tower B, 5th Floor Formwork',
      description: 'Shuttering plywood with steel props and acrow spans',
      numberOfUnits: '1.00',
      length: '100.000',
      breadth: '10.000',
      depth: '1.000',
      totalQty: '1000.000',
      rate: '120.00',
      amount: '120000.00',
    },
    {
      raBillId: ra!.id,
      woItemId: steelBoq.id,
      locationRef: 'Royal Palm Tower B, 5th Floor Rebar Tying',
      description: 'Fabrication & binding of 12mm & 16mm Fe 550D bars in column & beam grid',
      numberOfUnits: '1.00',
      length: '7.000',
      breadth: '1.000',
      depth: '1.000',
      totalQty: '7.000',
      rate: '6000.00',
      amount: '42000.00',
    },
  ]);

  console.log(`✅ Seeded Work Order ${woNumber} (₹45,00,000.00) and RA Bill #1 ${billNumber} (Net: ₹${netPayable.toFixed(2)}).`);
  console.log('🎉 Phase P5 Contractor Billing Seeding completed successfully!');
  await connection.end();
}

main().catch((err) => {
  console.error('Fatal error during contractor billing seeding:', err);
  process.exit(1);
});
