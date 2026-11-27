import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

async function seedAllModules() {
  const connectionUrl = process.env['DATABASE_URL'] || 'mysql://root:@localhost:3307/builderp';
  console.log(`🌱 Seeding ALL modules at ${connectionUrl.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = mysql.createPool({ uri: connectionUrl });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // 1. Fetch Tenant 'kings'
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.slug, 'kings'),
    });
    if (!tenant) throw new Error('Tenant kings not found');

    const tenantId = tenant.id;

    // 2. Fetch Users
    const allUsers = await db.query.users.findMany({
      where: eq(schema.users.tenantId, tenantId),
    });
    const userMap = new Map(allUsers.map((u) => [u.username, u]));
    const bossUser = userMap.get('boss') || allUsers[0]!;
    const adminUser = userMap.get('admin') || allUsers[0]!;
    const salesheadUser = userMap.get('saleshead') || allUsers[0]!;
    const presalesUser = userMap.get('presales') || allUsers[0]!;
    const crmUser = userMap.get('crm') || allUsers[0]!;
    const collUser = userMap.get('collections') || allUsers[0]!;
    const siteUser = userMap.get('sitemgr') || allUsers[0]!;
    const purUser = userMap.get('purchase') || allUsers[0]!;
    const storeUser = userMap.get('store') || allUsers[0]!;

    // 3. Fetch Sites & Warehouses
    const allSites = await db.query.sites.findMany({
      where: eq(schema.sites.tenantId, tenantId),
    });
    const siteKH = allSites.find((s) => s.code === 'SITE-KH') || allSites[0]!;
    const siteRP = allSites.find((s) => s.code === 'SITE-RP') || allSites[0]!;

    const allWarehouses = await db.query.warehouses.findMany({
      where: eq(schema.warehouses.tenantId, tenantId),
    });
    const whSiteKH = allWarehouses.find((w) => w.siteId === siteKH.id) || allWarehouses[0]!;
    const whCentral = allWarehouses.find((w) => w.type === 'central') || allWarehouses[0]!;

    // 4. Fetch Vendors & Contractors & Items
    const allVendors = await db.query.vendors.findMany({
      where: eq(schema.vendors.tenantId, tenantId),
    });
    const allContractors = await db.query.contractors.findMany({
      where: eq(schema.contractors.tenantId, tenantId),
    });
    const allItems = await db.query.items.findMany({
      where: eq(schema.items.tenantId, tenantId),
    });

    const itemCement = allItems.find((i) => i.itemCode === 'MAT-CEM-53') || allItems[0]!;
    const itemSteel12 = allItems.find((i) => i.itemCode === 'MAT-STL-12') || allItems[1]!;
    const itemSteel16 = allItems.find((i) => i.itemCode === 'MAT-STL-16') || allItems[2]!;
    const itemSand = allItems.find((i) => i.itemCode === 'MAT-SND-01') || allItems[3]!;
    const itemAggregate = allItems.find((i) => i.itemCode === 'MAT-AGG-20') || allItems[4]!;
    const itemTiles = allItems.find((i) => i.itemCode === 'MAT-TIL-01') || allItems[5] || allItems[0]!;

    console.log('✅ Base reference entities verified.');

    // =========================================================================
    // SECTION A: REALTY POST-SALES (DEMANDS, RECEIPTS, LEDGER, COST SHEETS, LETTERS)
    // =========================================================================
    console.log('📌 Seeding Realty Demands, Receipts, Allocations & Customer Ledger...');

    // Fetch Bookings & Payment Schedules
    const bookings = await db.query.reBookings.findMany({
      where: eq(schema.reBookings.tenantId, tenantId),
    });
    const payStages = await db.query.rePayStages.findMany({
      where: eq(schema.rePayStages.tenantId, tenantId),
    });
    const stageMapByCode = new Map(payStages.map((s) => [s.code, s]));

    if (bookings.length > 0) {
      // Clear prior demands/receipts for idempotency
      await pool.execute('DELETE FROM `re_receipt_allocations`');
      await pool.execute('DELETE FROM `re_ledger_entries` WHERE `tenant_id` = ?', [tenantId]);
      await pool.execute('DELETE FROM `re_receipts` WHERE `tenant_id` = ?', [tenantId]);
      await pool.execute('DELETE FROM `re_demands` WHERE `tenant_id` = ?', [tenantId]);

      let demandCounter = 1;
      let receiptCounter = 1;

      for (const booking of bookings) {
        const agreementVal = parseFloat(booking.agreementValue || '7500000');
        const gstVal = parseFloat(booking.gstAmt || '375000');

        // Stage A Demand (Call Money - 13%)
        const stageA = stageMapByCode.get('A');
        const stageAPrincipal = (agreementVal * 0.13).toFixed(2);
        const stageAGst = (gstVal * 0.13).toFixed(2);
        const stageATotal = (parseFloat(stageAPrincipal) + parseFloat(stageAGst)).toFixed(2);

        const [demARes] = await db.insert(schema.reDemands).values({
          uuid: uuidv4(),
          tenantId,
          demandNo: `KB/DEM/26-27/${String(demandCounter++).padStart(4, '0')}`,
          bookingId: booking.id,
          payStageId: stageA?.id || 1,
          demandDate: new Date('2026-05-15'),
          dueDate: new Date('2026-05-30'),
          principal: stageAPrincipal,
          gst: stageAGst,
          interestCarried: '0.00',
          total: stageATotal,
          pdfUrl: `/documents/demands/DEM_${booking.bookingNo}_StageA.pdf`,
          status: 'paid',
          sentVia: 'email_whatsapp',
          sentAt: new Date('2026-05-16'),
          createdBy: crmUser.id,
        });
        const demAId = (demARes as any).insertId;

        // Stage A Receipt (Settled via NEFT / RTGS with 1% 194-IA TDS)
        const tdsA = (parseFloat(stageAPrincipal) * 0.01).toFixed(2);
        const netCashA = (parseFloat(stageATotal) - parseFloat(tdsA)).toFixed(2);

        const [recARes] = await db.insert(schema.reReceipts).values({
          uuid: uuidv4(),
          tenantId,
          receiptNo: `KB/RC/26-27/${String(receiptCounter++).padStart(4, '0')}`,
          bookingId: booking.id,
          receiptDate: new Date('2026-05-25'),
          against: 'demand',
          payStageId: stageA?.id || 1,
          mode: 'neft',
          instrumentNo: `HDFC-NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
          instrumentDate: new Date('2026-05-25'),
          drawnOnBank: 'HDFC Bank Ltd',
          depositBankId: 1,
          amount: netCashA,
          tdsApplicable: true,
          tdsPct: '1.0000',
          tdsAmount: tdsA,
          gstComponent: stageAGst,
          status: 'passed',
          realisedOn: new Date('2026-05-26'),
          narration: `Payment received via NEFT for Stage A Call Money (Demand #${demAId})`,
          tallySynced: true,
          createdBy: collUser.id,
        });
        const recAId = (recARes as any).insertId;

        // Receipt Allocation for Stage A
        await db.insert(schema.reReceiptAllocations).values({
          receiptId: recAId,
          scheduleId: null,
          chargeType: 'principal',
          amount: stageAPrincipal,
        });

        // Stage B Demand (On Registration - 10%)
        const stageB = stageMapByCode.get('B');
        const stageBPrincipal = (agreementVal * 0.10).toFixed(2);
        const stageBGst = (gstVal * 0.10).toFixed(2);
        const stageBTotal = (parseFloat(stageBPrincipal) + parseFloat(stageBGst)).toFixed(2);

        const [demBRes] = await db.insert(schema.reDemands).values({
          uuid: uuidv4(),
          tenantId,
          demandNo: `KB/DEM/26-27/${String(demandCounter++).padStart(4, '0')}`,
          bookingId: booking.id,
          payStageId: stageB?.id || 2,
          demandDate: new Date('2026-06-15'),
          dueDate: new Date('2026-06-30'),
          principal: stageBPrincipal,
          gst: stageBGst,
          interestCarried: '0.00',
          total: stageBTotal,
          pdfUrl: `/documents/demands/DEM_${booking.bookingNo}_StageB.pdf`,
          status: 'paid',
          sentVia: 'email_whatsapp',
          sentAt: new Date('2026-06-16'),
          createdBy: crmUser.id,
        });
        const demBId = (demBRes as any).insertId;

        // Stage B Receipt
        const tdsB = (parseFloat(stageBPrincipal) * 0.01).toFixed(2);
        const netCashB = (parseFloat(stageBTotal) - parseFloat(tdsB)).toFixed(2);

        const [recBRes] = await db.insert(schema.reReceipts).values({
          uuid: uuidv4(),
          tenantId,
          receiptNo: `KB/RC/26-27/${String(receiptCounter++).padStart(4, '0')}`,
          bookingId: booking.id,
          receiptDate: new Date('2026-06-28'),
          against: 'demand',
          payStageId: stageB?.id || 2,
          mode: 'rtgs',
          instrumentNo: `ICIC-RTGS-${Math.floor(100000 + Math.random() * 900000)}`,
          instrumentDate: new Date('2026-06-28'),
          drawnOnBank: 'ICICI Bank Ltd',
          depositBankId: 1,
          amount: netCashB,
          tdsApplicable: true,
          tdsPct: '1.0000',
          tdsAmount: tdsB,
          gstComponent: stageBGst,
          status: 'passed',
          realisedOn: new Date('2026-06-29'),
          narration: `Payment received via RTGS for Stage B Registration (Demand #${demBId})`,
          tallySynced: true,
          createdBy: collUser.id,
        });
        const recBId = (recBRes as any).insertId;

        await db.insert(schema.reReceiptAllocations).values({
          receiptId: recBId,
          scheduleId: null,
          chargeType: 'principal',
          amount: stageBPrincipal,
        });

        // Stage C Demand (Plinth - 17%) - Current Demanded / Sent
        const stageC = stageMapByCode.get('C');
        const stageCPrincipal = (agreementVal * 0.17).toFixed(2);
        const stageCGst = (gstVal * 0.17).toFixed(2);
        const stageCTotal = (parseFloat(stageCPrincipal) + parseFloat(stageCGst)).toFixed(2);

        const [demCRes] = await db.insert(schema.reDemands).values({
          uuid: uuidv4(),
          tenantId,
          demandNo: `KB/DEM/26-27/${String(demandCounter++).padStart(4, '0')}`,
          bookingId: booking.id,
          payStageId: stageC?.id || 3,
          demandDate: new Date('2026-11-01'),
          dueDate: new Date('2026-11-25'),
          principal: stageCPrincipal,
          gst: stageCGst,
          interestCarried: '0.00',
          total: stageCTotal,
          pdfUrl: `/documents/demands/DEM_${booking.bookingNo}_StageC.pdf`,
          status: 'sent',
          sentVia: 'email_whatsapp',
          sentAt: new Date('2026-11-02'),
          createdBy: crmUser.id,
        });
        const demCId = (demCRes as any).insertId;

        // Customer Ledger Entries
        await db.insert(schema.reLedgerEntries).values([
          {
            tenantId,
            bookingId: booking.id,
            entryDate: new Date('2026-05-15'),
            docType: 'DEMAND',
            docId: demAId,
            debit: stageATotal,
            credit: '0.00',
            narration: `Milestone Demand Stage A (Call Money 13%) for Booking ${booking.bookingNo}`,
          },
          {
            tenantId,
            bookingId: booking.id,
            entryDate: new Date('2026-05-25'),
            docType: 'RECEIPT',
            docId: recAId,
            debit: '0.00',
            credit: stageATotal,
            narration: `Payment received via NEFT towards Stage A Demand (Net: ₹${netCashA}, 194-IA TDS: ₹${tdsA})`,
          },
          {
            tenantId,
            bookingId: booking.id,
            entryDate: new Date('2026-06-15'),
            docType: 'DEMAND',
            docId: demBId,
            debit: stageBTotal,
            credit: '0.00',
            narration: `Milestone Demand Stage B (On Registration 10%) for Booking ${booking.bookingNo}`,
          },
          {
            tenantId,
            bookingId: booking.id,
            entryDate: new Date('2026-06-28'),
            docType: 'RECEIPT',
            docId: recBId,
            debit: '0.00',
            credit: stageBTotal,
            narration: `Payment received via RTGS towards Stage B Demand (Net: ₹${netCashB}, 194-IA TDS: ₹${tdsB})`,
          },
          {
            tenantId,
            bookingId: booking.id,
            entryDate: new Date('2026-11-01'),
            docType: 'DEMAND',
            docId: demCId,
            debit: stageCTotal,
            credit: '0.00',
            narration: `Milestone Demand Stage C (Plinth Completion 17%) for Booking ${booking.bookingNo} - Payment Due 25-Nov`,
          },
        ]);
      }
      console.log(`✅ Seeded ${demandCounter - 1} demands, ${receiptCounter - 1} receipts and double-entry ledger.`);
    }

    // ── 5. SEED COST SHEETS ──────────────────────────────────────────────────
    console.log('📌 Seeding Pre-Sales Cost Sheets...');
    await pool.execute('DELETE FROM `re_cost_sheets` WHERE `tenant_id` = ?', [tenantId]);

    const leads = await db.query.reLeads.findMany({
      where: eq(schema.reLeads.tenantId, tenantId),
      limit: 6,
    });
    const units = await db.query.reUnits.findMany({
      where: eq(schema.reUnits.tenantId, tenantId),
      limit: 6,
    });
    const schemes = await db.query.reSchemes.findMany({
      where: eq(schema.reSchemes.tenantId, tenantId),
      limit: 2,
    });

    const demoCostSheets = [
      { unit: units[0], lead: leads[0], status: 'approved' as const, discount: '0.00', rate: '26250.00' },
      { unit: units[1], lead: leads[1], status: 'shared' as const, discount: '2.00', rate: '26500.00' },
      { unit: units[2], lead: leads[2], status: 'pending_approval' as const, discount: '5.00', rate: '27000.00' },
      { unit: units[3], lead: leads[3], status: 'draft' as const, discount: '0.00', rate: '26250.00' },
      { unit: units[4], lead: leads[4], status: 'approved' as const, discount: '1.50', rate: '26800.00' },
      { unit: units[5], lead: leads[5], status: 'shared' as const, discount: '3.00', rate: '26400.00' },
    ];

    for (const cs of demoCostSheets) {
      if (!cs.unit) continue;
      const carpet = parseFloat(cs.unit.carpetArea || '650');
      const baseCost = carpet * parseFloat(cs.rate);
      const floorRise = 50 * carpet * (cs.unit.floorNo || 5);
      const agreementVal = baseCost + floorRise;
      const gst = agreementVal * 0.05;
      const stamp = agreementVal * 0.06;
      const reg = 30000;
      const grandTotal = agreementVal + gst + stamp + reg + 350000;

      await db.insert(schema.reCostSheets).values({
        uuid: uuidv4(),
        tenantId,
        leadId: cs.lead?.id || null,
        unitId: cs.unit.id,
        schemeId: schemes[0]?.id || 1,
        rate: cs.rate,
        discountPct: cs.discount,
        lines: {
          carpetArea: carpet,
          baseRate: parseFloat(cs.rate),
          baseCost,
          floorRise,
          agreementValue: agreementVal,
          clubhouse: 150000,
          developmentCharges: 200000,
          stampDuty: stamp,
          registration: reg,
          gst,
        },
        totals: {
          agreementValue: agreementVal,
          taxes: gst + stamp + reg,
          otherCharges: 350000,
          grandTotal,
        },
        validTill: new Date('2026-12-31'),
        status: cs.status,
        approvedBy: cs.status === 'approved' ? salesheadUser.id : null,
      });
    }
    console.log(`✅ Seeded ${demoCostSheets.length} cost sheets.`);

    // ── 6. SEED LETTER TEMPLATES & ISSUED LETTERS ────────────────────────────
    console.log('📌 Seeding RERA Letter Templates & Letters Issued...');
    await pool.execute('DELETE FROM `re_letters_issued` WHERE `tenant_id` = ?', [tenantId]);
    await pool.execute('DELETE FROM `re_letter_templates` WHERE `tenant_id` = ?', [tenantId]);

    const letterTemplatesData = [
      {
        type: 'demand' as const,
        name: 'Standard Milestone Demand Letter',
        bodyHtml: '<p>Dear {{customerName}}, your milestone demand for stage {{stageName}} of Unit {{unitNo}} is due on {{dueDate}}.</p>',
      },
      {
        type: 'allotment' as const,
        name: 'Official RERA Allotment Letter',
        bodyHtml: '<p>Congratulations! Unit {{unitNo}} in Kings Heights Tower B has been allotted to {{customerName}}.</p>',
      },
      {
        type: 'welcome' as const,
        name: 'Homebuyer Welcome & Onboarding Kit',
        bodyHtml: '<p>Welcome to the Kings Builders family! Find enclosed your payment schedule and RERA credentials.</p>',
      },
      {
        type: 'possession' as const,
        name: 'Offer of Possession & Key Handover Notice',
        bodyHtml: '<p>Dear {{customerName}}, Kings Heights Tower B has received the Occupancy Certificate (OC). Please clear dues for handover.</p>',
      },
      {
        type: 'noc' as const,
        name: 'Tripartite Bank NOC for Housing Loan',
        bodyHtml: '<p>NOC issued in favor of {{bankName}} for sanctioning loan on Unit {{unitNo}}.</p>',
      },
      {
        type: 'reminder' as const,
        name: 'Demand Overdue 1st Reminder',
        bodyHtml: '<p>Kindly note that payment of ₹{{amount}} for Stage {{stageName}} was due on {{dueDate}}.</p>',
      },
    ];

    const seededTemplates: any[] = [];
    for (const tpl of letterTemplatesData) {
      const [res] = await db.insert(schema.reLetterTemplates).values({
        uuid: uuidv4(),
        tenantId,
        type: tpl.type,
        name: tpl.name,
        bodyHtml: tpl.bodyHtml,
        createdBy: crmUser.id,
      });
      seededTemplates.push({ id: (res as any).insertId, type: tpl.type });
    }

    if (bookings.length > 0 && seededTemplates.length > 0) {
      for (let i = 0; i < bookings.length; i++) {
        const b = bookings[i]!;
        await db.insert(schema.reLettersIssued).values({
          tenantId,
          bookingId: b.id,
          templateId: seededTemplates[1].id,
          issuedAt: new Date('2026-05-12'),
          sentVia: 'email',
          sentAt: new Date('2026-05-12'),
          pdfUrl: `/documents/letters/Allotment_${b.bookingNo}.pdf`,
        });
        await db.insert(schema.reLettersIssued).values({
          tenantId,
          bookingId: b.id,
          templateId: seededTemplates[2].id,
          issuedAt: new Date('2026-05-14'),
          sentVia: 'whatsapp_email',
          sentAt: new Date('2026-05-14'),
          pdfUrl: `/documents/letters/Welcome_${b.bookingNo}.pdf`,
        });
      }
    }
    console.log(`✅ Seeded ${letterTemplatesData.length} letter templates and ${bookings.length * 2} issued letters.`);

    // ── 7. SEED CANCELLATION & TRANSFER ──────────────────────────────────────
    console.log('📌 Seeding Cancellations & Transfers...');
    await pool.execute('DELETE FROM `re_cancellations` WHERE `tenant_id` = ?', [tenantId]);
    await pool.execute('DELETE FROM `re_transfers` WHERE `tenant_id` = ?', [tenantId]);

    if (bookings.length > 0) {
      const b3 = bookings[2] || bookings[0]!;
      await db.insert(schema.reCancellations).values({
        uuid: uuidv4(),
        tenantId,
        bookingId: b3.id,
        cancellationNo: 'CN-KH-26-27-0001',
        receivedTillDate: new Date('2026-10-15'),
        cancellationCharges: '150000.00',
        tds: '15000.00',
        gstReversal: '37500.00',
        refundAmount: '1350000.00',
        refundStatus: 'pending',
        createdBy: crmUser.id,
      });

      const b1 = bookings[0]!;
      const b2 = bookings[1] || bookings[0]!;
      await db.insert(schema.reTransfers).values({
        uuid: uuidv4(),
        tenantId,
        oldBookingId: b1.id,
        newBookingId: b2.id,
        transferDate: new Date('2026-09-20'),
        reason: 'Internal apartment upgrade from 1BHK to 2BHK on higher floor',
        status: 'completed',
        createdBy: crmUser.id,
      });
    }
    console.log('✅ Seeded demo cancellation and transfer.');

    // ── 8. SEED CP LEAD TAGS & FEATURE INTEREST ──────────────────────────────
    console.log('📌 Seeding CP Lead Tags & Feature Interest...');
    await pool.execute('DELETE FROM `re_cp_lead_tags` WHERE `tenant_id` = ?', [tenantId]);

    const cps = await db.query.reChannelPartners.findMany({
      where: eq(schema.reChannelPartners.tenantId, tenantId),
      limit: 6,
    });

    if (cps.length > 0 && leads.length > 0) {
      for (let i = 0; i < Math.min(cps.length, leads.length); i++) {
        await db.insert(schema.reCpLeadTags).values({
          tenantId,
          cpId: cps[i]!.id,
          leadId: leads[i]!.id,
          taggedAt: new Date(Date.now() - (i * 5) * 86400000),
          validTill: new Date(Date.now() + (60 - (i * 5)) * 86400000),
          status: 'active',
          evidence: `Verified WhatsApp client introduction sheet submitted by ${cps[i]!.firmName}`,
          createdBy: salesheadUser.id,
        });
      }
    }

    // Seed Feature Interest
    await pool.execute('DELETE FROM `re_feature_interest` WHERE `tenant_id` = ?', [tenantId]);
    await db.insert(schema.reFeatureInterest).values([
      { tenantId, moduleCode: 'REALTY_CUSTOMER_HUB', userId: crmUser.id, note: 'Need buyer portal for Q1 handover' },
      { tenantId, moduleCode: 'REALTY_COMMUNICATION_HUB', userId: presalesUser.id, note: 'WhatsApp API integration priority' },
      { tenantId, moduleCode: 'REALTY_AI_INTELLIGENCE', userId: salesheadUser.id, note: 'Interested in predictive lead scoring' },
      { tenantId, moduleCode: 'REALTY_ANALYTICS', userId: bossUser.id, note: 'Executive P&L dashboard for boardroom' },
      { tenantId, moduleCode: 'REALTY_INTEGRATIONS', userId: adminUser.id, note: 'Tally 2-way sync & Leegality e-Sign' },
    ]);
    console.log('✅ Seeded CP lead tags and feature interest registrations.');

    // =========================================================================
    // SECTION B: CONSTRUCTION, PROCUREMENT & SITE OPERATIONS
    // =========================================================================
    console.log('📌 Seeding Construction POs, GRNs, Material Issues & Work Orders...');

    // 1. Purchase Orders & PO Items (Seed PO #3 to PO #7)
    const existingPOs = await db.query.purchaseOrders.findMany({
      where: eq(schema.purchaseOrders.tenantId, tenantId),
    });

    const vendorAcc = allVendors.find((v) => v.name.includes('Kheteshwar') || v.id === 1) || allVendors[0]!;
    const vendorJindal = allVendors.find((v) => v.id === 2) || allVendors[0]!;
    const vendorUltratech = allVendors.find((v) => v.id === 3) || allVendors[0]!;

    const extraPOs = [
      {
        poNumber: 'KB/PO/26-27/0003',
        vendor: vendorUltratech,
        site: siteKH,
        warehouse: whSiteKH,
        item: itemCement,
        qty: '1200.000',
        rate: '385.00',
        status: 'approved' as const,
        terms: '30 Days Net Banking',
      },
      {
        poNumber: 'KB/PO/26-27/0004',
        vendor: vendorJindal,
        site: siteKH,
        warehouse: whSiteKH,
        item: itemSteel16,
        qty: '45.000',
        rate: '59200.00',
        status: 'issued' as const,
        terms: '15 Days PDC',
      },
      {
        poNumber: 'KB/PO/26-27/0005',
        vendor: vendorAcc,
        site: siteRP,
        warehouse: whCentral,
        item: itemSand,
        qty: '800.000',
        rate: '1850.00',
        status: 'completed' as const,
        terms: 'Immediate on Delivery',
      },
      {
        poNumber: 'KB/PO/26-27/0006',
        vendor: vendorUltratech,
        site: siteKH,
        warehouse: whSiteKH,
        item: itemAggregate,
        qty: '600.000',
        rate: '1420.00',
        status: 'draft' as const,
        terms: 'Advance 20%, Balance on Dispatch',
      },
      {
        poNumber: 'KB/PO/26-27/0007',
        vendor: vendorAcc,
        site: siteKH,
        warehouse: whSiteKH,
        item: itemTiles,
        qty: '3500.000',
        rate: '680.00',
        status: 'approved' as const,
        terms: '30 Days Net Banking',
      },
    ];

    for (const p of extraPOs) {
      const already = existingPOs.find((x) => x.poNumber === p.poNumber);
      if (already) continue;

      const qty = parseFloat(p.qty);
      const rate = parseFloat(p.rate);
      const subtotal = qty * rate;
      const cgst = subtotal * 0.09;
      const sgst = subtotal * 0.09;
      const total = subtotal + cgst + sgst;

      const [poRes] = await db.insert(schema.purchaseOrders).values({
        uuid: uuidv4(),
        tenantId,
        poNumber: p.poNumber,
        vendorId: p.vendor.id,
        siteId: p.site.id,
        warehouseId: p.warehouse.id,
        poDate: new Date('2026-10-10'),
        deliveryDate: new Date('2026-10-25'),
        paymentTerms: p.terms,
        status: p.status,
        isInterState: false,
        subtotal: subtotal.toFixed(2),
        discountAmount: '0.00',
        taxableAmount: subtotal.toFixed(2),
        cgstAmount: cgst.toFixed(2),
        sgstAmount: sgst.toFixed(2),
        igstAmount: '0.00',
        roundOff: '0.00',
        totalAmount: total.toFixed(2),
      });

      const poId = (poRes as any).insertId;

      const [poItemRes] = await db.insert(schema.poItems).values({
        poId,
        itemId: p.item.id,
        quantity: p.qty,
        unitId: p.item.uomId || 1,
        unitRate: p.rate,
        discountPercent: '0.00',
        taxableAmount: subtotal.toFixed(2),
        gstRate: '18%',
        cgstAmount: cgst.toFixed(2),
        sgstAmount: sgst.toFixed(2),
        igstAmount: '0.00',
        totalAmount: total.toFixed(2),
        receivedQuantity: p.status === 'completed' ? p.qty : '0.000',
        remarks: `Standard procurement for site ${p.site.code}`,
      });
      const poItemId = (poItemRes as any).insertId;

      // If completed, create Goods Receipt Note (GRN)
      if (p.status === 'completed') {
        const [grnRes] = await db.insert(schema.goodsReceiptNotes).values({
          uuid: uuidv4(),
          tenantId,
          grnNumber: `KB/GRN/26-27/${p.poNumber.slice(-4)}`,
          poId,
          vendorId: p.vendor.id,
          siteId: p.site.id,
          warehouseId: p.warehouse.id,
          challanNo: `CH-${Math.floor(10000 + Math.random() * 90000)}`,
          challanDate: new Date('2026-10-18'),
          invoiceNo: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
          invoiceDate: new Date('2026-10-18'),
          vehicleNo: 'MH-04-AZ-8812',
          receivedDate: new Date('2026-10-18'),
          status: 'verified',
          gatePassNo: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
          inspectionRemarks: 'Quality passed after slump and cube lab tests.',
          receivedById: storeUser.id,
          verifiedById: siteUser.id,
        });

        const grnId = (grnRes as any).insertId;

        await db.insert(schema.grnItems).values({
          grnId,
          poItemId,
          itemId: p.item.id,
          orderedQty: p.qty,
          receivedQty: p.qty,
          acceptedQty: p.qty,
          rejectedQty: '0.000',
          unitId: p.item.uomId || 1,
          unitRate: p.rate,
          totalValue: subtotal.toFixed(2),
          batchNo: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        });
      }
    }
    console.log('✅ Seeded extra Purchase Orders and GRNs.');

    // 2. Extra Material Issues
    const existingIssues = await db.query.materialIssues.findMany({
      where: eq(schema.materialIssues.tenantId, tenantId),
    });

    const contractorCivil = allContractors[0] || { id: 1 };
    const contractorMep = allContractors[1] || allContractors[0] || { id: 1 };

    const extraIssues = [
      {
        num: 'KB/ISS/26-27/0002',
        contractor: contractorCivil,
        site: siteKH,
        item: itemCement,
        qty: '350.000',
        val: '134750.00',
        purpose: '12th Floor Slab Casting concrete mix',
      },
      {
        num: 'KB/ISS/26-27/0003',
        contractor: contractorCivil,
        site: siteKH,
        item: itemSteel12,
        qty: '12.500',
        val: '731250.00',
        purpose: '12th Slab beam reinforcement rebar',
      },
      {
        num: 'KB/ISS/26-27/0004',
        contractor: contractorMep,
        site: siteKH,
        item: itemSand,
        qty: '80.000',
        val: '148000.00',
        purpose: '8th Floor masonry plastering & chasing',
      },
    ];

    for (const iss of extraIssues) {
      if (existingIssues.some((x) => x.issueNumber === iss.num)) continue;

      const [issRes] = await db.insert(schema.materialIssues).values({
        uuid: uuidv4(),
        tenantId,
        issueNumber: iss.num,
        siteId: iss.site.id,
        warehouseId: whSiteKH.id,
        contractorId: iss.contractor.id,
        issuedToName: 'Ramesh Sawant (Site Supervisor)',
        purpose: iss.purpose,
        issueDate: new Date('2026-11-05'),
        status: 'issued',
        totalValue: iss.val,
        issuedById: storeUser.id,
      });

      const issueId = (issRes as any).insertId;

      await db.insert(schema.materialIssueItems).values({
        issueId,
        itemId: iss.item.id,
        quantity: iss.qty,
        unitId: iss.item.uomId || 1,
        unitRate: (parseFloat(iss.val) / parseFloat(iss.qty)).toFixed(2),
        totalValue: iss.val,
      });
    }
    console.log('✅ Seeded extra Material Issues to subcontractors.');

    // 3. Extra Work Orders & RA Bills
    const existingWOs = await db.query.workOrders.findMany({
      where: eq(schema.workOrders.tenantId, tenantId),
    });

    const extraWOs = [
      {
        woNumber: 'KB/WO/26-27/0002',
        contractor: allContractors[1] || allContractors[0]!,
        site: siteKH,
        scope: 'Structural Steel Railings, Balcony Grills & Staircase Handrails',
        amount: '2800000.00',
        status: 'approved' as const,
      },
      {
        woNumber: 'KB/WO/26-27/0003',
        contractor: allContractors[2] || allContractors[0]!,
        site: siteKH,
        scope: 'Internal Plumbing, Drainage Piping & CP Sanitary Fixtures Rough-in',
        amount: '1850000.00',
        status: 'approved' as const,
      },
      {
        woNumber: 'KB/WO/26-27/0004',
        contractor: allContractors[3] || allContractors[0]!,
        site: siteRP,
        scope: 'Internal Gypsum Plastering & POP Ceiling Work',
        amount: '1420000.00',
        status: 'draft' as const,
      },
    ];

    for (const w of extraWOs) {
      if (existingWOs.some((x) => x.woNumber === w.woNumber)) continue;

      const amt = parseFloat(w.amount);
      const [woRes] = await db.insert(schema.workOrders).values({
        uuid: uuidv4(),
        tenantId,
        woNumber: w.woNumber,
        contractorId: w.contractor.id,
        siteId: w.site.id,
        title: w.scope,
        scopeOfWork: w.scope,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-03-31'),
        status: w.status,
        contractValue: w.amount,
        retentionPercent: '5.00',
        tdsPercent: '2.00',
        gstRate: '18.00',
        subtotal: amt.toFixed(2),
        gstAmount: (amt * 0.18).toFixed(2),
        totalAmount: (amt * 1.18).toFixed(2),
        totalAmountWords: 'Rupees Twenty Eight Lakhs Only',
        createdById: siteUser.id,
        approvedById: bossUser.id,
      });

      const woId = (woRes as any).insertId;

      await db.insert(schema.woItems).values({
        woId,
        itemDescription: w.scope,
        quantity: '1.000',
        uom: 'JOB',
        rate: w.amount,
        amount: w.amount,
      });

      // Seed an RA Bill for WO #2
      if (w.woNumber === 'KB/WO/26-27/0002') {
        const raGross = 450000;
        const raRetention = raGross * 0.05;
        const raTds = raGross * 0.02;
        const raGst = raGross * 0.18;
        const raNet = raGross + raGst - raRetention - raTds;

        await db.insert(schema.raBills).values({
          uuid: uuidv4(),
          tenantId,
          billNumber: 'KB/RA/26-27/0002',
          workOrderId: woId,
          contractorId: w.contractor.id,
          siteId: w.site.id,
          billPeriodStart: new Date('2026-10-01'),
          billPeriodEnd: new Date('2026-10-31'),
          billDate: new Date('2026-11-02'),
          grossAmount: raGross.toFixed(2),
          retentionAmount: raRetention.toFixed(2),
          tdsAmount: raTds.toFixed(2),
          gstAmount: raGst.toFixed(2),
          netPayableAmount: raNet.toFixed(2),
          status: 'certified',
          createdById: siteUser.id,
          certifiedById: bossUser.id,
        });
      }
    }
    console.log('✅ Seeded extra Work Orders and Running Account (RA) bills.');

    // 4. Extra Daily Progress Reports (DPR)
    const existingDPRs = await db.query.dailyProgressReports.findMany({
      where: eq(schema.dailyProgressReports.tenantId, tenantId),
    });

    const extraDPRs = [
      {
        num: 'KB/DPR/26-27/0002',
        date: new Date('2026-11-14'),
        weather: 'Sunny / Dry',
        temp: '31°C',
        shift: 'Day Shift (8 AM - 6 PM)',
        progress: '12th Floor Slab reinforcement bar bending completed (95%). Shuttering inspection approved by structural consultant.',
        delays: 'Minor 1 hour tower crane motor calibration delay in morning.',
        safety: 'Zero safety incidents. All 48 workers equipped with PPE, harnesses, and safety boots.',
        status: 'approved',
      },
      {
        num: 'KB/DPR/26-27/0003',
        date: new Date('2026-11-15'),
        weather: 'Clear Sky',
        temp: '32°C',
        shift: 'Day Shift (8 AM - 7 PM)',
        progress: 'Conducted 12th Floor Slab casting. Total 180 cum RMC poured. 10th Floor brickwork masonry ongoing.',
        delays: 'None. Smooth concrete pump operation.',
        safety: 'Edge protection railings and debris safety nets checked.',
        status: 'approved',
      },
      {
        num: 'KB/DPR/26-27/0004',
        date: new Date('2026-11-16'),
        weather: 'Sunny',
        temp: '30°C',
        shift: 'Day Shift',
        progress: 'Continuous pond curing on 12th floor slab. Internal electrical conduits laying on 8th and 9th floors.',
        delays: 'None.',
        safety: 'Electrical testing tool inspections conducted.',
        status: 'submitted',
      },
      {
        num: 'KB/DPR/26-27/0005',
        date: new Date('2026-11-17'),
        weather: 'Clear',
        temp: '33°C',
        shift: 'Day Shift',
        progress: '13th Floor column rebar tying commenced. West facade external plastering underway.',
        delays: 'None.',
        safety: 'Full external scaffolding safety audit passed.',
        status: 'approved',
      },
    ];

    for (const d of extraDPRs) {
      if (existingDPRs.some((x) => x.reportNumber === d.num)) continue;

      const [dprRes] = await db.insert(schema.dailyProgressReports).values({
        uuid: uuidv4(),
        tenantId,
        siteId: siteKH.id,
        reportNumber: d.num,
        reportDate: d.date,
        weather: d.weather,
        temperature: d.temp,
        shift: d.shift,
        generalProgress: d.progress,
        delaysIssues: d.delays,
        safetyNotes: d.safety,
        status: d.status,
        createdById: siteUser.id,
        approvedById: bossUser.id,
      });

      const dprId = (dprRes as any).insertId;

      await db.insert(schema.dprWorkItems).values({
        dprId,
        description: d.progress,
        location: 'Tower B (Floors 8-13)',
        plannedQty: '100.00',
        actualQty: '95.00',
        uom: '%',
      });

      await db.insert(schema.dprPhotos).values([
        {
          dprId,
          photoUrl: `/photos/dpr/DPR_${d.num.slice(-4)}_1.jpg`,
          caption: '12th Floor RCC Slab casting progress & rebar verification',
          activityTag: 'RCC Structure',
        },
        {
          dprId,
          photoUrl: `/photos/dpr/DPR_${d.num.slice(-4)}_2.jpg`,
          caption: 'External facade plastering and safety netting inspection',
          activityTag: 'Finishing & Plaster',
        },
      ]);

      await db.insert(schema.labourAttendance).values({
        uuid: uuidv4(),
        tenantId,
        siteId: siteKH.id,
        contractorId: contractorCivil.id,
        attendanceDate: d.date,
        shift: 'Day',
        tradeCategory: 'RCC & Masonry',
        skilledMale: 22,
        skilledFemale: 0,
        semiSkilledMale: 15,
        semiSkilledFemale: 0,
        unskilledMale: 30,
        unskilledFemale: 4,
        supervisors: 4,
        totalWorkers: 75,
        workLocation: 'Tower B (12th Floor)',
        remarks: 'Full turnout for slab casting and bar bending',
        recordedById: siteUser.id,
      });
    }
    console.log('✅ Seeded extra Daily Progress Reports, Photos & Labour Attendance.');

    // 5. In-App Notifications
    const notifs = [
      { role: 'boss', type: 'PO_APPROVAL', title: 'PO Pending Approval', msg: 'Purchase Order KB/PO/26-27/0004 for Jindal Steel awaits your authorization.' },
      { role: 'sales_head', type: 'LEAD_HOT', title: 'High Intent Lead Alert', msg: 'Rajesh Singhal completed 2nd site visit with family (Score: 96).' },
      { role: 'crm', type: 'DEMAND_DUE', title: 'Demands Dispatched', msg: 'Stage C Plinth completion demands sent to 4 buyers via WhatsApp & Email.' },
      { role: 'collections', type: 'RECEIPT_POSTED', title: 'Receipt Vouchers Reconciled', msg: 'Tally export batch sync completed with 4 approved receipts.' },
      { role: 'sitemgr', type: 'DPR_APPROVED', title: 'DPR #0004 Approved', msg: 'Managing Director approved daily progress log for Kings Heights Tower B.' },
      { role: 'store', type: 'GRN_VERIFIED', title: 'Store Inward Verified', msg: 'Cement delivery 1200 Bags received and stored in Site Warehouse B.' },
    ];

    for (const n of notifs) {
      await db.insert(schema.notifications).values({
        uuid: uuidv4(),
        tenantId,
        roleCode: n.role,
        type: n.type,
        title: n.title,
        message: n.msg,
        channel: 'IN_APP',
        isRead: false,
      });
    }
    console.log('✅ Seeded in-app notifications across roles.');

    console.log('\n🎉 ALL MODULES SUCCESSFULLY SEEDED WITH RICH ENTERPRISE DATA!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding all modules:', err);
    await pool.end();
    process.exit(1);
  }
}

seedAllModules();
