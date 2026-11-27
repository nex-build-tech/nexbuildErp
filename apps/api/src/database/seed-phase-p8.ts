import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

async function seedPhaseP8() {
  const connectionUrl = process.env['DATABASE_URL'] || 'mysql://root:@localhost:3307/builderp';
  console.log(`🌱 Seeding Phase P8 data (DPR, Labour, BOQ) at ${connectionUrl.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = mysql.createPool({ uri: connectionUrl });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.slug, 'kings'),
    });
    if (!tenant) throw new Error('Tenant kings not found');

    const siteKH = await db.query.sites.findFirst({
      where: and(eq(schema.sites.tenantId, tenant.id), eq(schema.sites.code, 'SITE-KH')),
    });
    if (!siteKH) throw new Error('Site SITE-KH not found');

    const bossUser = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'boss')),
    });
    const sitemgrUser = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'sitemgr')),
    });

    const contractorCivil = await db.query.contractors.findFirst({
      where: and(eq(schema.contractors.tenantId, tenant.id), eq(schema.contractors.code, 'CONT-CIVIL')),
    });

    // ── 1. SEED BOQ BASELINE ────────────────────────────────────────────────
    console.log('📌 Seeding BOQ baseline for Kings Heritage...');
    const boqData = [
      {
        itemCode: 'MAT-CEM-53',
        description: 'UltraTech OPC 53 Grade Cement',
        workPackage: 'Substructure & RCC Superstructure',
        budgetedQty: '5000.000',
        uom: 'BAG',
        budgetedRate: '385.00',
        budgetedAmount: '1925000.00',
        tolerancePercent: '5.00',
      },
      {
        itemCode: 'MAT-STL-12',
        description: 'Tata Tiscon TMT Fe 550D Rebar 12mm',
        workPackage: 'RCC Superstructure',
        budgetedQty: '60.000',
        uom: 'MT',
        budgetedRate: '58500.00',
        budgetedAmount: '3510000.00',
        tolerancePercent: '3.00',
      },
      {
        itemCode: 'MAT-STL-16',
        description: 'Tata Tiscon TMT Fe 550D Rebar 16mm',
        workPackage: 'RCC Superstructure',
        budgetedQty: '80.000',
        uom: 'MT',
        budgetedRate: '58500.00',
        budgetedAmount: '4680000.00',
        tolerancePercent: '3.00',
      },
      {
        itemCode: 'MAT-SAND-RIV',
        description: 'Natural River Sand (Screened)',
        workPackage: 'Masonry & Plastering',
        budgetedQty: '40.000',
        uom: 'TRIP',
        budgetedRate: '6500.00',
        budgetedAmount: '260000.00',
        tolerancePercent: '5.00',
      },
      {
        itemCode: 'MAT-BRK-RED',
        description: 'Kiln Baked Red Clay Bricks',
        workPackage: 'Masonry Works',
        budgetedQty: '50000.000',
        uom: 'PCS',
        budgetedRate: '9.50',
        budgetedAmount: '475000.00',
        tolerancePercent: '4.00',
      },
      {
        itemCode: 'HK-01-BATH',
        description: 'BATHROOM CLEANER 5LTR (GCS.pdf)',
        workPackage: 'Post-construction Housekeeping',
        budgetedQty: '100.000',
        uom: 'PCS',
        budgetedRate: '650.00',
        budgetedAmount: '65000.00',
        tolerancePercent: '0.00',
      },
    ];

    for (const b of boqData) {
      const existing = await db.query.boqItems.findFirst({
        where: and(
          eq(schema.boqItems.tenantId, tenant.id),
          eq(schema.boqItems.siteId, siteKH.id),
          eq(schema.boqItems.itemCode, b.itemCode)
        ),
      });

      if (!existing) {
        await db.insert(schema.boqItems).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: siteKH.id,
          ...b,
        });
      }
    }
    console.log(`✅ Seeded ${boqData.length} BOQ items.`);

    // ── 2. SEED DAILY PROGRESS REPORTS (DPR) ────────────────────────────────
    console.log('📌 Seeding Daily Progress Reports...');
    let existingDpr = await db.query.dailyProgressReports.findFirst({
      where: and(
        eq(schema.dailyProgressReports.tenantId, tenant.id),
        eq(schema.dailyProgressReports.reportNumber, 'KB/DPR/26-27/0001')
      ),
    });

    if (!existingDpr) {
      const dprUuid = uuidv4();
      await db.insert(schema.dailyProgressReports).values({
        uuid: dprUuid,
        tenantId: tenant.id,
        siteId: siteKH.id,
        reportNumber: 'KB/DPR/26-27/0001',
        reportDate: new Date(),
        weather: 'Clear / Sunny',
        temperature: '31°C',
        shift: 'Day',
        generalProgress:
          'Tower A: 4th floor columns concreting completed (Grid C1 to C6). Bar bending and shuttering for 5th floor slab in full progress. Plumbing drainage lines installed on 2nd floor.',
        delaysIssues: 'Minor 45-minute power interruption from MSEDCL at 14:30. Switched to 125kVA site DG set.',
        safetyNotes: 'Daily morning tool-box talk conducted on edge protection and safety harness compliance. Zero accidents/injuries.',
        status: 'approved',
        createdById: sitemgrUser?.id || 1,
        approvedById: bossUser?.id || 1,
      });

      existingDpr = (await db.query.dailyProgressReports.findFirst({
        where: and(
          eq(schema.dailyProgressReports.tenantId, tenant.id),
          eq(schema.dailyProgressReports.uuid, dprUuid)
        ),
      }))!;

      // Work items
      await db.insert(schema.dprWorkItems).values([
        {
          dprId: existingDpr.id,
          activityName: 'Column Concreting M30 Grade',
          locationRef: 'Tower A - 4th Floor (Columns C1-C6)',
          uom: 'CU.M',
          plannedQty: '25.000',
          completedQty: '24.500',
          remarks: 'Concrete cubes casted for 7-day and 28-day compressive test',
        },
        {
          dprId: existingDpr.id,
          activityName: 'Reinforcement Steel Binding Fe550D',
          locationRef: 'Tower A - 5th Floor Slab Beam Grid',
          uom: 'TONS',
          plannedQty: '7.000',
          completedQty: '6.800',
          remarks: 'Chair bars and cover blocks verified by Site QA/QC',
        },
        {
          dprId: existingDpr.id,
          activityName: 'External AAC Block Masonry',
          locationRef: 'Tower B - 2nd Floor External Walls',
          uom: 'SQ.M',
          plannedQty: '60.000',
          completedQty: '58.000',
          remarks: 'Polymer mortar bond beam installed every 3rd course',
        },
      ]);

      // Equipments
      await db.insert(schema.dprEquipments).values([
        {
          dprId: existingDpr.id,
          equipmentName: 'Tower Crane Liebherr 71K (TC-01)',
          runningHours: '7.50',
          idleHours: '0.50',
          breakdownHours: '0.00',
          status: 'working',
          remarks: 'Used for shifting steel rebar and shuttering plates to 5th floor',
        },
        {
          dprId: existingDpr.id,
          equipmentName: 'Stationary Concrete Pump Putzmeister 1409D',
          runningHours: '4.50',
          idleHours: '3.50',
          breakdownHours: '0.00',
          status: 'working',
          remarks: 'Smooth pumping of 25 cu.m ready-mix concrete',
        },
        {
          dprId: existingDpr.id,
          equipmentName: 'Bar Bending & Cutting Machine Spartan',
          runningHours: '8.00',
          idleHours: '0.00',
          breakdownHours: '0.00',
          status: 'working',
          remarks: 'Cutting 16mm and 12mm rebar coils',
        },
      ]);

      // Photos
      await db.insert(schema.dprPhotos).values([
        {
          dprId: existingDpr.id,
          photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f2?w=800&auto=format&fit=crop&q=80',
          caption: 'Tower A 4th floor columns casting with tremie pipe and needle vibrators',
          activityTag: 'Concreting',
          takenAt: new Date(),
        },
        {
          dprId: existingDpr.id,
          photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
          caption: '5th floor slab shuttering inspection with project manager and safety team',
          activityTag: 'Shuttering QA',
          takenAt: new Date(),
        },
      ]);
      console.log('✅ Seeded DPR KB/DPR/26-27/0001 with items, equipments & photos.');
    }

    // ── 3. SEED LABOUR ATTENDANCE ───────────────────────────────────────────
    console.log('📌 Seeding Labour Attendance...');
    const existingLabour = await db.query.labourAttendance.findFirst({
      where: and(
        eq(schema.labourAttendance.tenantId, tenant.id),
        eq(schema.labourAttendance.siteId, siteKH.id)
      ),
    });

    if (!existingLabour) {
      await db.insert(schema.labourAttendance).values([
        {
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: siteKH.id,
          contractorId: contractorCivil?.id || null,
          attendanceDate: new Date(),
          shift: 'Day',
          tradeCategory: 'RCC / Shuttering & Steel',
          skilledMale: 14,
          skilledFemale: 0,
          semiSkilledMale: 10,
          semiSkilledFemale: 2,
          unskilledMale: 20,
          unskilledFemale: 6,
          supervisors: 2,
          totalWorkers: 54,
          overtimeHours: '24.00',
          workLocation: 'Tower A 4th & 5th Floor Slab',
          remarks: 'Deployment as per weekly pour schedule',
          recordedById: sitemgrUser?.id || 1,
        },
        {
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: siteKH.id,
          contractorId: null, // Departmental / General Civil
          attendanceDate: new Date(),
          shift: 'Day',
          tradeCategory: 'General Civil & Housekeeping',
          skilledMale: 4,
          skilledFemale: 0,
          semiSkilledMale: 4,
          semiSkilledFemale: 0,
          unskilledMale: 12,
          unskilledFemale: 8,
          supervisors: 1,
          totalWorkers: 29,
          overtimeHours: '8.00',
          workLocation: 'Site Internal Roads & Central Store',
          remarks: 'Unloading of river sand trip trucks and site clean-up',
          recordedById: sitemgrUser?.id || 1,
        },
      ]);
      console.log('✅ Seeded 2 Labour Attendance muster rolls (Total 83 workers deployed).');
    }

    console.log('🎉 Phase P8 Seeding completed successfully!');
  } finally {
    await pool.end();
  }
}

seedPhaseP8().catch((err) => {
  console.error('❌ Phase P8 seed failed:', err);
  process.exit(1);
});
