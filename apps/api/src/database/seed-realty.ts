import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@builderp/shared';
import { eq, and } from 'drizzle-orm';
import { encryptAadhaar } from '../realty/common/encryption.util';
import { RealtyPricingService } from '../realty/common/pricing.service';

export async function seedRealty() {
  const connectionUrl = process.env['DATABASE_URL'] || 'mysql://root:@localhost:3307/builderp';
  console.log(`🌱 Seeding Realty module at ${connectionUrl.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = mysql.createPool({ uri: connectionUrl });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // ── 1. SEED REALTY PERMISSIONS ───────────────────────────────────────────
    console.log('📌 Seeding Realty permissions...');
    const realtyPermKeys = Object.values(PERMISSIONS).filter((code) =>
      code.startsWith('realty.'),
    );

    for (const code of realtyPermKeys) {
      const parts = code.split('.');
      const module = parts[1] || 'realty';
      const action = parts.slice(2).join('.') || 'access';

      const existing = await db.query.permissions.findFirst({
        where: eq(schema.permissions.code, code),
      });

      if (!existing) {
        await db.insert(schema.permissions).values({
          code,
          module: `realty_${module}`,
          action,
          description: `Permission for ${code}`,
        });
      }
    }

    const allPermissions = await db.select().from(schema.permissions);
    const permMap = new Map<string, number>();
    for (const p of allPermissions) {
      permMap.set(p.code, p.id);
    }
    console.log(`✅ Verified ${realtyPermKeys.length} Realty permissions.`);

    // ── 2. GET TENANT: KINGS BUILDERS & DEVELOPERS ───────────────────────────
    console.log('📌 Finding tenant kings...');
    let tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.slug, 'kings'),
    });

    if (!tenant) {
      await db.insert(schema.tenants).values({
        uuid: uuidv4(),
        name: 'Kings Builders & Developers',
        slug: 'kings',
        status: 'active',
        plan: 'enterprise',
        gstin: '27AABCK1234F1Z5',
        pan: 'AABCK1234F',
        stateCode: '27',
        address: 'Kings Tower, Off S.V. Road, Andheri West, Mumbai, Maharashtra 400058',
        logoUrl: '/assets/kings-logo.svg',
        primaryColor: '#c5a04e',
      });
      tenant = (await db.query.tenants.findFirst({
        where: eq(schema.tenants.slug, 'kings'),
      }))!;
    }
    console.log(`✅ Tenant ID: ${tenant.id} (${tenant.name})`);

    // ── 3. ENABLE TENANT MODULES ─────────────────────────────────────────────
    console.log('📌 Setting up tenant modules...');
    const modulesToEnable = ['REALTY_SALES', 'REALTY_CP_PORTAL', 'REALTY_CUSTOMER_HUB'];
    for (const moduleCode of modulesToEnable) {
      const existing = await db.query.tenantModules.findFirst({
        where: and(
          eq(schema.tenantModules.tenantId, tenant.id),
          eq(schema.tenantModules.moduleCode, moduleCode),
        ),
      });

      if (!existing) {
        await db.insert(schema.tenantModules).values({
          tenantId: tenant.id,
          moduleCode,
          enabled: true,
        });
      } else if (!existing.enabled) {
        await db
          .update(schema.tenantModules)
          .set({ enabled: true })
          .where(eq(schema.tenantModules.id, existing.id));
      }
    }
    console.log('✅ Tenant modules configured.');

    // ── 4. SEED REALTY ROLES ─────────────────────────────────────────────────
    console.log('📌 Seeding Realty roles...');
    const realtyRoleDefs = [
      {
        code: 'sales_head',
        name: 'Sales Head',
        description: 'Head of Sales and Marketing with full pipeline and approval control',
        isSystem: true,
      },
      {
        code: 'presales',
        name: 'Pre-Sales Executive',
        description: 'Lead generation, inbound qualification, site visit scheduling',
        isSystem: true,
      },
      {
        code: 'sales_exec',
        name: 'Sales Executive',
        description: 'On-site presentations, unit holds, cost sheets, and bookings',
        isSystem: true,
      },
      {
        code: 'crm_exec',
        name: 'CRM / Post-Sales Executive',
        description: 'Post-sales management, demands, collections, and documentation',
        isSystem: true,
      },
      {
        code: 'crm_accounts',
        name: 'Collections Accountant',
        description: 'Receipt verification, bouncing, ledger reconciliation, and Tally export',
        isSystem: true,
      },
      {
        code: 'channel_partner',
        name: 'Channel Partner',
        description: 'External broker portal for lead tagging and brokerage tracking',
        isSystem: true,
      },
    ];

    const seededRoles: Record<string, typeof schema.roles.$inferSelect> = {};
    for (const r of realtyRoleDefs) {
      let role = await db.query.roles.findFirst({
        where: and(eq(schema.roles.tenantId, tenant.id), eq(schema.roles.code, r.code)),
      });

      if (!role) {
        await db.insert(schema.roles).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          name: r.name,
          code: r.code,
          description: r.description,
          isSystem: r.isSystem,
        });
        role = (await db.query.roles.findFirst({
          where: and(eq(schema.roles.tenantId, tenant.id), eq(schema.roles.code, r.code)),
        }))!;
      }
      seededRoles[r.code] = role;
    }
    console.log(`✅ Seeded ${Object.keys(seededRoles).length} Realty roles.`);

    // ── 5. ASSIGN ROLE PERMISSIONS ───────────────────────────────────────────
    console.log('📌 Assigning permissions to roles...');

    // A. Grant all realty permissions to super_admin, boss, admin
    const adminRoles = ['super_admin', 'boss', 'admin'];
    for (const code of adminRoles) {
      const adminRole = await db.query.roles.findFirst({
        where: and(eq(schema.roles.tenantId, tenant.id), eq(schema.roles.code, code)),
      });
      if (adminRole) {
        for (const permKey of realtyPermKeys) {
          const permId = permMap.get(permKey);
          if (permId) {
            const has = await db.query.rolePermissions.findFirst({
              where: and(
                eq(schema.rolePermissions.roleId, adminRole.id),
                eq(schema.rolePermissions.permissionId, permId),
              ),
            });
            if (!has) {
              await db.insert(schema.rolePermissions).values({
                roleId: adminRole.id,
                permissionId: permId,
              });
            }
          }
        }
      }
    }

    // B. Assign specific permissions to Realty roles based on ROLE_PERMISSIONS
    const rolePermissionMapping: Record<string, string[]> = {
      sales_head: ROLE_PERMISSIONS['SALES_HEAD'] || [],
      presales: ROLE_PERMISSIONS['PRESALES'] || [],
      sales_exec: ROLE_PERMISSIONS['SALES_EXEC'] || [],
      crm_exec: ROLE_PERMISSIONS['CRM_EXEC'] || [],
      crm_accounts: ROLE_PERMISSIONS['CRM_ACCOUNTS'] || [],
      channel_partner: ROLE_PERMISSIONS['CHANNEL_PARTNER'] || [],
    };

    for (const [roleCode, perms] of Object.entries(rolePermissionMapping)) {
      const role = seededRoles[roleCode];
      if (!role) continue;

      for (const permCode of perms) {
        const permId = permMap.get(permCode);
        if (permId) {
          const has = await db.query.rolePermissions.findFirst({
            where: and(
              eq(schema.rolePermissions.roleId, role.id),
              eq(schema.rolePermissions.permissionId, permId),
            ),
          });
          if (!has) {
            await db.insert(schema.rolePermissions).values({
              roleId: role.id,
              permissionId: permId,
            });
          }
        }
      }
    }
    console.log('✅ Role permissions mapped.');

    // ── 6. SEED DEMO USERS ───────────────────────────────────────────────────
    console.log('📌 Seeding demo users...');
    const demoUsers = [
      {
        username: 'saleshead',
        password: 'sales123',
        fullName: 'Vikram Malhotra',
        email: 'saleshead@kingsbuilders.com',
        phone: '+91 98201 11222',
        roleCode: 'sales_head',
      },
      {
        username: 'presales',
        password: 'pre123',
        fullName: 'Ananya Sharma',
        email: 'presales@kingsbuilders.com',
        phone: '+91 98202 22333',
        roleCode: 'presales',
      },
      {
        username: 'salesexec',
        password: 'exec123',
        fullName: 'Rahul Deshmukh',
        email: 'salesexec@kingsbuilders.com',
        phone: '+91 98203 33444',
        roleCode: 'sales_exec',
      },
      {
        username: 'crm',
        password: 'crm123',
        fullName: 'Pooja Kulkarni',
        email: 'crm@kingsbuilders.com',
        phone: '+91 98204 44555',
        roleCode: 'crm_exec',
      },
      {
        username: 'collections',
        password: 'acc123',
        fullName: 'Sanjay Mehta',
        email: 'collections@kingsbuilders.com',
        phone: '+91 98205 55666',
        roleCode: 'crm_accounts',
      },
      {
        username: 'cp_demo',
        password: 'cp123',
        fullName: 'Apex Realty Consultants (RERA)',
        email: 'cp_demo@apexrealty.in',
        phone: '+91 98206 66777',
        roleCode: 'channel_partner',
      },
    ];

    for (const u of demoUsers) {
      const role = seededRoles[u.roleCode];
      if (!role) continue;

      const passwordHash = await bcrypt.hash(u.password, 10);
      const existing = await db.query.users.findFirst({
        where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, u.username)),
      });

      if (!existing) {
        await db.insert(schema.users).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          roleId: role.id,
          username: u.username,
          passwordHash,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          status: 'active',
        });
      } else {
        await db
          .update(schema.users)
          .set({ passwordHash, roleId: role.id })
          .where(eq(schema.users.id, existing.id));
      }
    }
    console.log(`✅ Seeded ${demoUsers.length} demo users.`);

    // ── 7. SEED DOCUMENT SERIES FOR REALTY ────────────────────────────────────
    console.log('📌 Seeding Realty document series...');
    const currentFY = '26-27';
    const seriesDefs = [
      { documentType: 'BK', prefix: 'KB/BK' },
      { documentType: 'DM', prefix: 'KB/DM' },
      { documentType: 'RC', prefix: 'KB/RC' },
      { documentType: 'CS', prefix: 'KB/CS' },
      { documentType: 'CN', prefix: 'KB/CN' },
      { documentType: 'CX', prefix: 'KB/CX' },
    ];

    for (const s of seriesDefs) {
      const existing = await db.query.documentSeries.findFirst({
        where: and(
          eq(schema.documentSeries.tenantId, tenant.id),
          eq(schema.documentSeries.documentType, s.documentType),
          eq(schema.documentSeries.financialYear, currentFY),
        ),
      });

      if (!existing) {
        await db.insert(schema.documentSeries).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          documentType: s.documentType,
          prefix: s.prefix,
          financialYear: currentFY,
          nextNumber: 1,
          padding: 4,
        });
      }
    }
    console.log(`✅ Seeded ${seriesDefs.length} document series.`);

    // ═════════════════════════════════════════════════════════════════════════
    // 8. SEED KINGS HEIGHTS REALTY SETUP DATA (PHASE R2)
    // ═════════════════════════════════════════════════════════════════════════
    console.log('📌 Seeding Kings Heights (SITE-KH) setup data...');
    let site = await db.query.sites.findFirst({
      where: and(eq(schema.sites.tenantId, tenant.id), eq(schema.sites.code, 'SITE-KH')),
    });

    if (!site) {
      console.log('Creating SITE-KH site...');
      await db.insert(schema.sites).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        code: 'SITE-KH',
        name: 'Kings Heights Tower A & B',
        clientName: 'Kings Real Estate LLP',
        address: 'Plot 42, Lokhandwala Complex, Andheri West',
        city: 'Mumbai',
        stateCode: '27',
        pincode: '400053',
        status: 'active',
      });
      site = (await db.query.sites.findFirst({
        where: and(eq(schema.sites.tenantId, tenant.id), eq(schema.sites.code, 'SITE-KH')),
      }))!;
    }
    console.log(`✅ Verified site SITE-KH (ID: ${site.id})`);

    // A. Project Settings
    console.log('📌 Seeding Project Settings...');
    const existingSettings = await db.query.reProjectSettings.findFirst({
      where: eq(schema.reProjectSettings.siteId, site.id),
    });

    if (!existingSettings) {
      await db.insert(schema.reProjectSettings).values({
        uuid: uuidv4(),
        siteId: site.id,
        reraNo: 'P51800028471',
        launchDate: new Date('2024-01-15'),
        possessionDate: new Date('2027-12-31'),
        stampDutyPct: '6.0000',
        metroCessPct: '1.0000',
        registrationPct: '1.0000',
        registrationCap: '30000.00',
        interestRatePa: '12.0000',
        interestGraceDays: 10,
        gstRateUnderConstruction: '5.0000',
        holdHoursDefault: 48,
        cpTagValidityDays: 60,
        bankDetailsText: 'Kings Real Estate LLP - HDFC Bank A/C: 50200084729104, IFSC: HDFC0000128, Lokhandwala Branch',
        letterheadHtml: '<div style="text-align:center;"><h2>Kings Builders & Developers</h2><p>Kings Tower, Lokhandwala Complex, Andheri West, Mumbai 400053</p></div>',
      });
    }

    // B. Charge Heads
    console.log('📌 Seeding Charge Heads...');
    const chargeHeadsList = [
      { code: 'DEV', name: 'Development Charges', calcType: 'per_sqft' as const, defaultValue: '500.00', gstApplicable: true, gstRate: '18.0000', sequence: 1 },
      { code: 'LEGAL', name: 'Legal & Documentation', calcType: 'fixed' as const, defaultValue: '25000.00', gstApplicable: true, gstRate: '18.0000', sequence: 2 },
      { code: 'SOC', name: 'Society Formation', calcType: 'fixed' as const, defaultValue: '15000.00', gstApplicable: false, sequence: 3 },
      { code: 'CLUB', name: 'Club House Membership', calcType: 'fixed' as const, defaultValue: '200000.00', gstApplicable: true, gstRate: '18.0000', sequence: 4 },
      { code: 'WATER', name: 'Water Connection Charges', calcType: 'fixed' as const, defaultValue: '35000.00', gstApplicable: false, sequence: 5 },
      { code: 'MSEB', name: 'Electricity / MSEB Meter', calcType: 'fixed' as const, defaultValue: '50000.00', gstApplicable: false, sequence: 6 },
      { code: 'CORPUS', name: 'Corpus Fund', calcType: 'per_sqft' as const, defaultValue: '200.00', gstApplicable: false, sequence: 7 },
      { code: 'MAINT', name: 'Advance Maintenance (12 Months)', calcType: 'per_month' as const, defaultValue: '5000.00', gstApplicable: true, gstRate: '18.0000', sequence: 8 },
      { code: 'SHARE', name: 'Share Money & Application', calcType: 'fixed' as const, defaultValue: '500.00', gstApplicable: false, sequence: 9 },
      { code: 'TAX_DEP', name: 'Municipal Tax Deposit', calcType: 'fixed' as const, defaultValue: '20000.00', gstApplicable: false, sequence: 10 },
      { code: 'MNGL', name: 'MNGL Gas Pipeline', calcType: 'fixed' as const, defaultValue: '15000.00', gstApplicable: true, gstRate: '18.0000', sequence: 11 },
      { code: 'SOLAR', name: 'Solar & Rainwater Cess', calcType: 'fixed' as const, defaultValue: '10000.00', gstApplicable: false, sequence: 12 },
      { code: 'EDC', name: 'EDC / IDC Charges', calcType: 'per_sqft' as const, defaultValue: '150.00', gstApplicable: true, gstRate: '18.0000', sequence: 13 },
      { code: 'IFMS', name: 'Interest Free Maintenance Security', calcType: 'per_sqft' as const, defaultValue: '100.00', gstApplicable: false, sequence: 14 },
      { code: 'PLC', name: 'Prime Location Charges (PLC)', calcType: 'fixed' as const, defaultValue: '100000.00', gstApplicable: true, gstRate: '5.0000', sequence: 15 },
      { code: 'PARK', name: 'Covered Car Parking', calcType: 'fixed' as const, defaultValue: '500000.00', gstApplicable: true, gstRate: '5.0000', sequence: 16 },
    ];

    for (const ch of chargeHeadsList) {
      const existing = await db.query.reChargeHeads.findFirst({
        where: and(eq(schema.reChargeHeads.tenantId, tenant.id), eq(schema.reChargeHeads.code, ch.code)),
      });
      if (!existing) {
        await db.insert(schema.reChargeHeads).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: ch.code,
          name: ch.name,
          calcType: ch.calcType,
          defaultValue: ch.defaultValue,
          gstApplicable: ch.gstApplicable,
          gstRate: ch.gstRate,
          sequence: ch.sequence,
        });
      }
    }
    console.log(`✅ Seeded ${chargeHeadsList.length} charge heads.`);

    // C. Phase, Wing B, Floors (Ground + 1-23)
    console.log('📌 Seeding Building 2 / Wing B / Floors...');
    let phase = await db.query.rePhases.findFirst({
      where: and(eq(schema.rePhases.tenantId, tenant.id), eq(schema.rePhases.siteId, site.id), eq(schema.rePhases.name, 'Building 2')),
    });
    if (!phase) {
      await db.insert(schema.rePhases).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        siteId: site.id,
        name: 'Building 2',
      });
      phase = (await db.query.rePhases.findFirst({
        where: and(eq(schema.rePhases.tenantId, tenant.id), eq(schema.rePhases.siteId, site.id), eq(schema.rePhases.name, 'Building 2')),
      }))!;
    }

    let wing = await db.query.reWings.findFirst({
      where: and(eq(schema.reWings.tenantId, tenant.id), eq(schema.reWings.phaseId, phase.id), eq(schema.reWings.name, 'Wing B')),
    });
    if (!wing) {
      await db.insert(schema.reWings).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        phaseId: phase.id,
        name: 'Wing B',
        totalFloors: 23,
      });
      wing = (await db.query.reWings.findFirst({
        where: and(eq(schema.reWings.tenantId, tenant.id), eq(schema.reWings.phaseId, phase.id), eq(schema.reWings.name, 'Wing B')),
      }))!;
    }

    // Floors: Ground + 1..23
    const floorMap = new Map<number, number>(); // levelNo -> floorId
    for (let lvl = 0; lvl <= 23; lvl++) {
      let floor = await db.query.reFloors.findFirst({
        where: and(eq(schema.reFloors.tenantId, tenant.id), eq(schema.reFloors.wingId, wing.id), eq(schema.reFloors.levelNo, lvl)),
      });
      if (!floor) {
        await db.insert(schema.reFloors).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          wingId: wing.id,
          name: lvl === 0 ? 'Ground Floor' : `Floor ${lvl}`,
          levelNo: lvl,
        });
        floor = (await db.query.reFloors.findFirst({
          where: and(eq(schema.reFloors.tenantId, tenant.id), eq(schema.reFloors.wingId, wing.id), eq(schema.reFloors.levelNo, lvl)),
        }))!;
      }
      floorMap.set(lvl, floor.id);
    }
    console.log(`✅ Seeded Phase: Building 2, Wing: Wing B with 24 floors (Ground + 1-23).`);

    // D. Unit Types
    console.log('📌 Seeding Unit Types...');
    const unitTypeDefs = [
      { code: '1RK-203', name: '1 RK Compact', category: 'RES' as const, defaultCarpetArea: '203.00' },
      { code: '1BHK-288', name: '1 BHK Smart', category: 'RES' as const, defaultCarpetArea: '288.00' },
      { code: '1BHK-301', name: '1 BHK Deluxe', category: 'RES' as const, defaultCarpetArea: '301.00' },
      { code: '1BHK-306', name: '1 BHK Grand', category: 'RES' as const, defaultCarpetArea: '306.00' },
      { code: '1BHK-316', name: '1 BHK Prime', category: 'RES' as const, defaultCarpetArea: '316.00' },
      { code: '1BHK-320', name: '1 BHK Royale', category: 'RES' as const, defaultCarpetArea: '320.00' },
      { code: '1BHK-321', name: '1 BHK Royale Plus', category: 'RES' as const, defaultCarpetArea: '321.00' },
      { code: '1BHK-322', name: '1 BHK Royale Corner', category: 'RES' as const, defaultCarpetArea: '322.00' },
      { code: 'COMM-SHOP', name: 'Retail Commercial Shop', category: 'COM' as const, defaultCarpetArea: '250.00' },
    ];

    const unitTypeMap = new Map<string, number>();
    for (const ut of unitTypeDefs) {
      let row = await db.query.reUnitTypes.findFirst({
        where: and(eq(schema.reUnitTypes.tenantId, tenant.id), eq(schema.reUnitTypes.code, ut.code)),
      });
      if (!row) {
        await db.insert(schema.reUnitTypes).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: ut.code,
          name: ut.name,
          category: ut.category,
          defaultCarpetArea: ut.defaultCarpetArea,
        });
        row = (await db.query.reUnitTypes.findFirst({
          where: and(eq(schema.reUnitTypes.tenantId, tenant.id), eq(schema.reUnitTypes.code, ut.code)),
        }))!;
      }
      unitTypeMap.set(ut.code, row.id);
    }
    console.log(`✅ Seeded ${unitTypeDefs.length} unit types.`);

    // E. Units (~145 units: 7 shops on ground + 138 flats on floors 1-23)
    console.log('📌 Seeding ~145 units (Ground floor shops + residential flats)...');
    const baseRateVal = 26250; // ₹26,250 / sq ft carpet

    // 1. Ground floor shops
    const groundFloorId = floorMap.get(0)!;
    for (let s = 1; s <= 7; s++) {
      const unitNo = `SHOP-${s}`;
      const existing = await db.query.reUnits.findFirst({
        where: and(
          eq(schema.reUnits.tenantId, tenant.id),
          eq(schema.reUnits.wingId, wing.id),
          eq(schema.reUnits.unitNo, unitNo),
        ),
      });
      if (!existing) {
        await db.insert(schema.reUnits).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: site.id,
          wingId: wing.id,
          floorId: groundFloorId,
          unitNo,
          unitTypeId: unitTypeMap.get('COMM-SHOP')!,
          carpetArea: '250.00',
          saleableArea: '375.00',
          facing: 'Road Facing',
          baseRate: '35000.00',
          floorRiseRate: '0.00',
          plcAmount: s <= 2 ? '200000.00' : '0.00',
          status: s === 1 ? 'booked' : s === 2 ? 'hold' : 'available',
        });
      }
    }

    // 2. Residential Flats (Floors 1-23, 6 units per floor: series 01-06)
    const flatConfigs = [
      { series: '01', typeCode: '1BHK-320', carpet: '320.00', saleable: '480.00', facing: 'North-East Garden View', plc: '50000.00' },
      { series: '02', typeCode: '1BHK-321', carpet: '321.00', saleable: '481.50', facing: 'East Sea Breeze View', plc: '75000.00' },
      { series: '03', typeCode: '1RK-203',  carpet: '203.00', saleable: '304.50', facing: 'North City View', plc: '0.00' },
      { series: '04', typeCode: '1BHK-288', carpet: '288.00', saleable: '432.00', facing: 'West Skyline View', plc: '0.00' },
      { series: '05', typeCode: '1BHK-301', carpet: '301.00', saleable: '451.50', facing: 'South Sun Facing', plc: '25000.00' },
      { series: '06', typeCode: '1BHK-322', carpet: '322.00', saleable: '483.00', facing: 'Corner North-West View', plc: '60000.00' },
    ];

    let totalFlatsCreated = 0;
    for (let fl = 1; fl <= 23; fl++) {
      const flFloorId = floorMap.get(fl)!;
      // Floor rise: ₹50 / sq ft per floor for floors above the 4th
      const riseRate = fl > 4 ? (fl - 4) * 50 : 0;

      for (const fc of flatConfigs) {
        const unitNo = `${fl}${fc.series}`;
        const existing = await db.query.reUnits.findFirst({
          where: and(
            eq(schema.reUnits.tenantId, tenant.id),
            eq(schema.reUnits.wingId, wing.id),
            eq(schema.reUnits.unitNo, unitNo),
          ),
        });

        if (!existing) {
          // Status mix for realistic dashboard / inventory views
          let status: any = 'available';
          if (fl <= 8) {
            status = fc.series === '01' || fc.series === '02' ? 'booked' : fc.series === '06' ? 'agreement' : 'available';
          } else if (fl <= 14) {
            status = fc.series === '01' ? 'booked' : fc.series === '02' ? 'hold' : 'available';
          } else if (fl === 23) {
            status = fc.series === '01' ? 'blocked' : 'available';
          }

          await db.insert(schema.reUnits).values({
            uuid: uuidv4(),
            tenantId: tenant.id,
            siteId: site.id,
            wingId: wing.id,
            floorId: flFloorId,
            unitNo,
            unitTypeId: unitTypeMap.get(fc.typeCode)!,
            carpetArea: fc.carpet,
            saleableArea: fc.saleable,
            facing: fc.facing,
            baseRate: String(baseRateVal),
            floorRiseRate: String(riseRate),
            plcAmount: fc.plc,
            status,
          });
          totalFlatsCreated++;
        }
      }
    }
    console.log(`✅ Seeded 7 commercial shops and 138 residential flats.`);

    // F. Parking Slots (20 Stilt slots)
    console.log('📌 Seeding 20 stilt parking slots...');
    for (let p = 1; p <= 20; p++) {
      const slotNo = `P-ST-${String(p).padStart(2, '0')}`;
      const existing = await db.query.reParkingSlots.findFirst({
        where: and(
          eq(schema.reParkingSlots.tenantId, tenant.id),
          eq(schema.reParkingSlots.siteId, site.id),
          eq(schema.reParkingSlots.slotNo, slotNo),
        ),
      });

      if (!existing) {
        await db.insert(schema.reParkingSlots).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: site.id,
          wingId: wing.id,
          type: 'stilt',
          slotNo,
          price: '500000.00',
          status: p <= 8 ? 'booked' : p <= 10 ? 'hold' : 'available',
        });
      }
    }
    console.log(`✅ Seeded 20 stilt parking bays.`);

    // G. Pay Stages (A–U total = 100%)
    console.log('📌 Seeding Pay Stages A–U...');
    const stageDefs = [
      { code: 'A', name: 'Call Money / Token Agreement', pct: '13.0000', seq: 1, linked: false, completed: true },
      { code: 'B', name: 'On Registration of Agreement', pct: '10.0000', seq: 2, linked: false, completed: true },
      { code: 'C', name: 'On Completion of Plinth', pct: '17.0000', seq: 3, linked: true, completed: true },
      { code: 'D', name: 'On Commencement of Slab 1/2', pct: '4.0000', seq: 4, linked: true, completed: true },
      { code: 'E', name: 'On Commencement of Slab 3/4', pct: '4.0000', seq: 5, linked: true, completed: true },
      { code: 'F', name: 'On Commencement of Slab 5/6', pct: '4.0000', seq: 6, linked: true, completed: true },
      { code: 'G', name: 'On Commencement of Slab 7/8', pct: '4.0000', seq: 7, linked: true, completed: true },
      { code: 'H', name: 'On Commencement of Slab 9/10', pct: '4.0000', seq: 8, linked: true, completed: true },
      { code: 'I', name: 'On Commencement of Slab 11/12', pct: '4.0000', seq: 9, linked: true, completed: false },
      { code: 'J', name: 'On Commencement of Slab 13/14', pct: '4.0000', seq: 10, linked: true, completed: false },
      { code: 'K', name: 'On Commencement of Slab 15/16', pct: '4.0000', seq: 11, linked: true, completed: false },
      { code: 'L', name: 'On Commencement of Slab 17/18', pct: '4.0000', seq: 12, linked: true, completed: false },
      { code: 'M', name: 'On Commencement of Slab 19/20', pct: '4.0000', seq: 13, linked: true, completed: false },
      { code: 'N', name: 'On Commencement of Slab 21/22', pct: '4.0000', seq: 14, linked: true, completed: false },
      { code: 'O', name: 'On Commencement of Slab 23 / Terrace', pct: '4.0000', seq: 15, linked: true, completed: false },
      { code: 'P', name: 'On Completion of Internal Masonry', pct: '2.0000', seq: 16, linked: true, completed: false },
      { code: 'Q', name: 'On Completion of External Masonry', pct: '2.0000', seq: 17, linked: true, completed: false },
      { code: 'R', name: 'On Completion of Internal Plaster', pct: '2.0000', seq: 18, linked: true, completed: false },
      { code: 'S', name: 'On Completion of External Plaster', pct: '2.0000', seq: 19, linked: true, completed: false },
      { code: 'T', name: 'On Installation of Lift & Lobby', pct: '2.0000', seq: 20, linked: true, completed: false },
      { code: 'U', name: 'On Intimation of Possession', pct: '2.0000', seq: 21, linked: false, completed: false },
    ];

    const stageMap = new Map<string, number>();
    for (const st of stageDefs) {
      let row = await db.query.rePayStages.findFirst({
        where: and(
          eq(schema.rePayStages.tenantId, tenant.id),
          eq(schema.rePayStages.siteId, site.id),
          eq(schema.rePayStages.code, st.code),
        ),
      });

      if (!row) {
        await db.insert(schema.rePayStages).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: site.id,
          code: st.code,
          name: st.name,
          defaultPct: st.pct,
          sequence: st.seq,
          isConstructionLinked: st.linked,
          status: st.completed ? 'completed' : 'pending',
          completedOn: st.completed ? new Date('2025-06-01') : null,
        });
        row = (await db.query.rePayStages.findFirst({
          where: and(
            eq(schema.rePayStages.tenantId, tenant.id),
            eq(schema.rePayStages.siteId, site.id),
            eq(schema.rePayStages.code, st.code),
          ),
        }))!;
      }
      stageMap.set(st.code, row.id);
    }
    console.log(`✅ Seeded ${stageDefs.length} pay stages A–U.`);

    // H. Schemes & Scheme Stages (100% Rule Validated)
    console.log('📌 Seeding Schemes with 100% stage validation...');
    const schemeDefs = [
      {
        name: 'Standard (Project)',
        gstMode: 'with' as const,
        stampByBuilder: false,
        regByBuilder: false,
        stages: stageDefs.map((s) => ({ code: s.code, pct: s.pct })),
      },
      {
        name: '1 BHK 320-321',
        gstMode: 'with' as const,
        stampByBuilder: false,
        regByBuilder: false,
        stages: stageDefs.map((s) => ({ code: s.code, pct: s.pct })),
      },
      {
        name: '1 BHK 320-321 No GST',
        gstMode: 'without' as const,
        stampByBuilder: true,
        regByBuilder: true,
        stages: stageDefs.map((s) => ({ code: s.code, pct: s.pct })),
      },
      {
        name: 'Upto 14th Floor No GST',
        gstMode: 'without' as const,
        floorFrom: 1,
        floorTo: 14,
        stampByBuilder: true,
        regByBuilder: false,
        stages: [
          { code: 'A', pct: '16.0000' },
          { code: 'B', pct: '10.0000' },
          { code: 'C', pct: '14.0000' },
          ...stageDefs.slice(3, 15).map((s) => ({ code: s.code, pct: '4.0000' })),
          ...stageDefs.slice(15).map((s) => ({ code: s.code, pct: '2.0000' })),
        ], // 16 + 10 + 14 + 48 + 12 = 100%
      },
      {
        name: '15th–23rd Floor With GST',
        gstMode: 'with' as const,
        floorFrom: 15,
        floorTo: 23,
        stampByBuilder: false,
        regByBuilder: false,
        stages: stageDefs.map((s) => ({ code: s.code, pct: s.pct })),
      },
      {
        name: 'SHOP Commercial Scheme',
        gstMode: 'with' as const,
        stampByBuilder: false,
        regByBuilder: false,
        stages: [
          { code: 'A', pct: '20.0000' },
          { code: 'B', pct: '10.0000' },
          { code: 'C', pct: '20.0000' },
          { code: 'D', pct: '10.0000' },
          { code: 'E', pct: '10.0000' },
          { code: 'F', pct: '10.0000' },
          { code: 'G', pct: '10.0000' },
          { code: 'U', pct: '10.0000' },
        ], // 20 + 10 + 20 + 40 + 10 = 100%
      },
    ];

    for (const sc of schemeDefs) {
      let schemeRow = await db.query.reSchemes.findFirst({
        where: and(
          eq(schema.reSchemes.tenantId, tenant.id),
          eq(schema.reSchemes.siteId, site.id),
          eq(schema.reSchemes.name, sc.name),
        ),
      });

      if (!schemeRow) {
        await db.insert(schema.reSchemes).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: site.id,
          name: sc.name,
          gstMode: sc.gstMode,
          floorFrom: sc.floorFrom,
          floorTo: sc.floorTo,
          stampByBuilder: sc.stampByBuilder,
          registrationByBuilder: sc.regByBuilder,
          active: true,
        });

        schemeRow = (await db.query.reSchemes.findFirst({
          where: and(
            eq(schema.reSchemes.tenantId, tenant.id),
            eq(schema.reSchemes.siteId, site.id),
            eq(schema.reSchemes.name, sc.name),
          ),
        }))!;

        // Insert scheme stages
        for (const st of sc.stages) {
          const payStageId = stageMap.get(st.code);
          if (payStageId) {
            await db.insert(schema.reSchemeStages).values({
              schemeId: schemeRow.id,
              payStageId,
              pct: st.pct,
            });
          }
        }
      }
    }
    console.log(`✅ Seeded ${schemeDefs.length} schemes with stages.`);

    // ── 16. SEED DEMO BOOKINGS (PHASE R4) ──────────────────────────────────
    console.log('📌 Seeding Demo Bookings (Phase R4)...');
    const pricingService = new RealtyPricingService();

    const salesExec = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'salesexec1')),
    });
    const salesHead = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'saleshead')),
    });
    const defaultUserId = salesExec?.id || salesHead?.id || 1;

    // Fetch active charge heads for calculation
    const allChargeHeads = await db
      .select()
      .from(schema.reChargeHeads)
      .where(eq(schema.reChargeHeads.tenantId, tenant.id))
      .orderBy(schema.reChargeHeads.sequence);

    // Fetch Schemes
    const clpScheme = await db.query.reSchemes.findFirst({
      where: and(eq(schema.reSchemes.tenantId, tenant.id), eq(schema.reSchemes.siteId, site.id), eq(schema.reSchemes.name, 'Standard (Project)')),
    });
    const dpScheme = await db.query.reSchemes.findFirst({
      where: and(eq(schema.reSchemes.tenantId, tenant.id), eq(schema.reSchemes.siteId, site.id), eq(schema.reSchemes.name, 'Upto 14th Floor No GST')),
    });

    const demoBookingConfigs = [
      {
        bookingNo: 'BK-KH-26-27-0001',
        unitNo: '501',
        parkingSlotNo: 'P-ST-01',
        scheme: clpScheme || dpScheme,
        status: 'booked' as const,
        discountPct: 0,
        bookingDate: new Date('2026-05-10'),
        applicant: {
          title: 'Mr.',
          firstName: 'Rajesh',
          lastName: 'Sharma',
          dob: '1984-06-15',
          gender: 'male' as const,
          occupation: 'IT Director',
          pan: 'ABCPS1234F',
          aadhaar: '543287654321',
          mobile: '9820112233',
          email: 'rajesh.sharma@example.com',
          permanentAddress: 'Flat 402, Sea Green Apts, Prabhadevi',
          city: 'Mumbai',
          stateCode: 'MH',
          pincode: '400025',
        },
        coApplicant: {
          type: 'co1' as const,
          title: 'Mrs.',
          firstName: 'Sunita',
          lastName: 'Sharma',
          pan: 'ABCPS5678G',
          aadhaar: '987654321098',
          mobile: '9820112234',
          email: 'sunita.sharma@example.com',
          relation: 'Spouse',
        },
        // Stage progress
        paidStages: ['A', 'B'],
        demandedStages: ['C'],
      },
      {
        bookingNo: 'BK-KH-26-27-0002',
        unitNo: '1002',
        parkingSlotNo: 'P-ST-02',
        scheme: dpScheme || clpScheme,
        status: 'agreement_done' as const,
        discountPct: 1.0,
        bookingDate: new Date('2026-06-01'),
        applicant: {
          title: 'Ms.',
          firstName: 'Priya',
          lastName: 'Patel',
          dob: '1990-11-20',
          gender: 'female' as const,
          occupation: 'Architect',
          pan: 'BKLPP9876A',
          aadhaar: '876543210987',
          mobile: '9819223344',
          email: 'priya.patel@techinnovations.in',
          permanentAddress: '12A, Harmony Heights, Bandra West',
          city: 'Mumbai',
          stateCode: 'MH',
          pincode: '400050',
        },
        paidStages: ['A'],
        demandedStages: ['B'],
      },
      {
        bookingNo: 'BK-KH-26-27-0003',
        unitNo: '1403',
        parkingSlotNo: 'P-ST-03',
        scheme: clpScheme || dpScheme,
        status: 'booked' as const,
        discountPct: 0.5,
        bookingDate: new Date('2026-06-15'),
        applicant: {
          title: 'Mr.',
          firstName: 'Amit',
          lastName: 'Verma',
          dob: '1982-03-22',
          gender: 'male' as const,
          occupation: 'Chartered Accountant',
          pan: 'AVNPV4567C',
          aadhaar: '765432109876',
          mobile: '9833445566',
          email: 'amit.verma@finconsult.com',
          permanentAddress: 'B-303, Palm Grove, Powai',
          city: 'Mumbai',
          stateCode: 'MH',
          pincode: '400076',
        },
        coApplicant: {
          type: 'co1' as const,
          title: 'Mrs.',
          firstName: 'Neha',
          lastName: 'Verma',
          pan: 'AVNPV7890D',
          aadhaar: '654321098765',
          mobile: '9833445567',
          email: 'neha.verma@finconsult.com',
          relation: 'Spouse',
        },
        paidStages: ['A'],
        demandedStages: [],
      },
      {
        bookingNo: 'BK-KH-26-27-0004',
        unitNo: '804',
        parkingSlotNo: 'P-ST-04',
        scheme: clpScheme || dpScheme,
        status: 'pending_approval' as const,
        discountPct: 4.5, // exceeds 3% scheme max
        bookingDate: new Date('2026-07-02'),
        applicant: {
          title: 'Dr.',
          firstName: 'Sneha',
          lastName: 'Kulkarni',
          dob: '1987-09-14',
          gender: 'female' as const,
          occupation: 'Surgeon',
          pan: 'SKLPK1234H',
          aadhaar: '432109876543',
          mobile: '9820556677',
          email: 'sneha.kulkarni@globalhealth.org',
          permanentAddress: '7, Matoshree Niwas, Dadar West',
          city: 'Mumbai',
          stateCode: 'MH',
          pincode: '400028',
        },
        paidStages: [],
        demandedStages: [],
        approvalNeeded: true,
      },
    ];

    for (const bConfig of demoBookingConfigs) {
      if (!bConfig.scheme) continue;

      const existingBooking = await db.query.reBookings.findFirst({
        where: and(eq(schema.reBookings.tenantId, tenant.id), eq(schema.reBookings.bookingNo, bConfig.bookingNo)),
      });
      if (existingBooking) {
        continue;
      }

      const unit = await db.query.reUnits.findFirst({
        where: and(eq(schema.reUnits.tenantId, tenant.id), eq(schema.reUnits.siteId, site.id), eq(schema.reUnits.unitNo, bConfig.unitNo)),
      });
      if (!unit) continue;

      let floorNo = 0;
      if (unit.floorId) {
        const fl = await db.query.reFloors.findFirst({
          where: eq(schema.reFloors.id, unit.floorId),
        });
        floorNo = fl?.levelNo || 0;
      }

      const slot = await db.query.reParkingSlots.findFirst({
        where: and(eq(schema.reParkingSlots.tenantId, tenant.id), eq(schema.reParkingSlots.siteId, site.id), eq(schema.reParkingSlots.slotNo, bConfig.parkingSlotNo)),
      });

      const parkingPrice = slot ? parseFloat(slot.price) || 0 : 0;

      // Scheme stages
      const stages = await db
        .select({
          payStageId: schema.reSchemeStages.payStageId,
          pct: schema.reSchemeStages.pct,
          code: schema.rePayStages.code,
          name: schema.rePayStages.name,
        })
        .from(schema.reSchemeStages)
        .innerJoin(schema.rePayStages, eq(schema.reSchemeStages.payStageId, schema.rePayStages.id))
        .where(eq(schema.reSchemeStages.schemeId, bConfig.scheme.id))
        .orderBy(schema.rePayStages.sequence);

      const calc = pricingService.calculateCostSheet({
        carpetArea: parseFloat(unit.carpetArea || '0') || 0,
        baseRate: parseFloat(unit.baseRate || '0') || 0,
        floorNo,
        floorRiseRate: parseFloat(unit.floorRiseRate || '0'),
        plcRateOrAmount: parseFloat(unit.plcAmount || '0'),
        isPlcPct: false,
        discountPct: bConfig.discountPct,
        parkingCharges: parkingPrice,
        stampDutyPct: 6.0,
        metroCessPct: 1.0,
        registrationPct: 1.0,
        registrationCap: 30000,
        gstRate: 5.0,
        otherCharges: allChargeHeads.map((ch) => ({
          code: ch.code,
          name: ch.name,
          calcType: ch.calcType,
          value: parseFloat(ch.defaultValue || '0') || 0,
          gstApplicable: ch.gstApplicable,
          gstRate: ch.gstRate ? parseFloat(ch.gstRate) : 18.0,
          months: 12,
        })),
        schemeStages: stages.map((st) => ({
          payStageId: st.payStageId,
          code: st.code,
          name: st.name,
          pct: parseFloat(st.pct) || 0,
        })),
      });

      // Insert Booking
      const [bRes] = await db.insert(schema.reBookings).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        bookingNo: bConfig.bookingNo,
        unitId: unit.id,
        schemeId: bConfig.scheme.id,
        bookingDate: bConfig.bookingDate,
        areaBasis: 'carpet',
        soldRate: calc.baseRate.toFixed(2),
        basicCost: calc.basicCost.toFixed(2),
        floorRiseAmt: calc.floorRiseAmt.toFixed(2),
        plcAmt: calc.plcAmt.toFixed(2),
        discountPct: calc.discountPct.toFixed(4),
        discountAmt: calc.discountAmt.toFixed(2),
        netCost: calc.netAgreementValue.toFixed(2),
        agreementValue: calc.netAgreementValue.toFixed(2),
        gstPct: calc.gstPct.toFixed(4),
        gstAmt: calc.gstAmt.toFixed(2),
        stampDuty: calc.stampDutyAmt.toFixed(2),
        registrationFee: calc.registrationAmt.toFixed(2),
        stampByBuilder: false,
        regByBuilder: false,
        otherChargesTotal: calc.otherChargesGrandTotal.toFixed(2),
        grandTotalInclGst: calc.grandTotalInclGst.toFixed(2),
        grandTotalExclGst: calc.grandTotalExclGst.toFixed(2),
        status: bConfig.status,
        createdBy: defaultUserId,
      });

      const bookingId = bRes.insertId;

      // Update Unit Status
      await db
        .update(schema.reUnits)
        .set({
          status: bConfig.status === 'booked' || bConfig.status === 'agreement' ? 'booked' : 'hold',
          updatedAt: new Date(),
        })
        .where(eq(schema.reUnits.id, unit.id));

      // Parking allocation
      if (slot) {
        await db.insert(schema.reBookingParkings).values({
          bookingId,
          slotId: slot.id,
          price: parkingPrice.toFixed(2),
        });
        await db
          .update(schema.reParkingSlots)
          .set({
            status: 'booked',
            bookingId,
            updatedAt: new Date(),
          })
          .where(eq(schema.reParkingSlots.id, slot.id));
      }

      // Primary Applicant with Encrypted Aadhaar
      await db.insert(schema.reBookingApplicants).values({
        uuid: uuidv4(),
        tenantId: tenant.id,
        bookingId,
        type: 'primary',
        title: bConfig.applicant.title,
        firstName: bConfig.applicant.firstName,
        lastName: bConfig.applicant.lastName,
        dob: new Date(bConfig.applicant.dob),
        gender: bConfig.applicant.gender,
        occupation: bConfig.applicant.occupation,
        pan: bConfig.applicant.pan,
        aadhaarEnc: encryptAadhaar(bConfig.applicant.aadhaar),
        mobile: bConfig.applicant.mobile,
        email: bConfig.applicant.email,
        permanentAddress: bConfig.applicant.permanentAddress,
        city: bConfig.applicant.city,
        stateCode: bConfig.applicant.stateCode,
        pincode: bConfig.applicant.pincode,
        createdBy: defaultUserId,
      });

      // Co-Applicant if any
      if (bConfig.coApplicant) {
        await db.insert(schema.reBookingApplicants).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          bookingId,
          type: bConfig.coApplicant.type,
          title: bConfig.coApplicant.title,
          firstName: bConfig.coApplicant.firstName,
          lastName: bConfig.coApplicant.lastName,
          pan: bConfig.coApplicant.pan,
          aadhaarEnc: encryptAadhaar(bConfig.coApplicant.aadhaar),
          mobile: bConfig.coApplicant.mobile,
          email: bConfig.coApplicant.email,
          relation: bConfig.coApplicant.relation,
          createdBy: defaultUserId,
        });
      }

      // 16 Extra Charges Breakdown
      for (const ch of calc.otherChargesBreakdown) {
        const matchedHead = allChargeHeads.find((h) => h.code === ch.code);
        if (matchedHead) {
          await db.insert(schema.reBookingCharges).values({
            bookingId,
            chargeHeadId: matchedHead.id,
            amount: ch.baseAmount.toFixed(2),
            gstAmt: ch.gstAmount.toFixed(2),
          });
        }
      }

      // 100% Payment Schedule
      for (const st of calc.paymentSchedule) {
        const isPaid = bConfig.paidStages.includes(st.code);
        const isDemanded = bConfig.demandedStages.includes(st.code);
        let scheduleStatus: 'not_due' | 'demanded' | 'partly_paid' | 'paid' | 'overdue' = 'not_due';
        let paidAmt = '0.00';

        if (isPaid) {
          scheduleStatus = 'paid';
          paidAmt = (st.demandedBasicAmount + st.demandedGstAmount).toFixed(2);
        } else if (isDemanded) {
          scheduleStatus = 'demanded';
        }

        await db.insert(schema.rePaymentSchedule).values({
          tenantId: tenant.id,
          bookingId,
          payStageId: st.payStageId,
          pct: st.stagePct.toFixed(4),
          amount: st.demandedBasicAmount.toFixed(2),
          gstAmt: st.demandedGstAmount.toFixed(2),
          paidAmount: paidAmt,
          status: scheduleStatus,
          createdBy: defaultUserId,
        });
      }

      // Approval Task if discount exceeded
      if (bConfig.approvalNeeded) {
        await db.insert(schema.reApprovals).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          entity: 'booking',
          entityId: bookingId,
          level: 1,
          approverRole: 'sales_head',
          status: 'pending',
          remarks: `Booking #${bConfig.bookingNo} requested discount ${bConfig.discountPct}% exceeds scheme allowed max discount.`,
        });
      }
    }
    console.log(`✅ Seeded ${demoBookingConfigs.length} demo bookings for Kings Heights.`);

    // ── 17. SEED CRM (PHASE R6) ──────────────────────────────────────────────
    console.log('📌 Seeding CRM Sources, Campaigns, Routing Rules & Demo Leads (Phase R6)...');

    const presalesExec = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'presales')),
    });

    // 17.1 Sources
    const demoSources = [
      { name: 'Google Ads', code: 'google_ads' },
      { name: 'Meta / Facebook Ads', code: 'meta_ads' },
      { name: 'MagicBricks', code: 'magicbricks' },
      { name: '99acres', code: '99acres' },
      { name: 'Housing.com', code: 'housing' },
      { name: 'Direct Walk-in', code: 'walkin' },
      { name: 'Channel Partner Referral', code: 'cp_referral' },
    ];

    const sourceMap = new Map<string, number>();
    for (const src of demoSources) {
      let existingSrc = await db.query.reLeadSources.findFirst({
        where: and(eq(schema.reLeadSources.tenantId, tenant.id), eq(schema.reLeadSources.code, src.code)),
      });
      if (!existingSrc) {
        const [res] = await db.insert(schema.reLeadSources).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          name: src.name,
          code: src.code,
          active: true,
          createdBy: presalesExec?.id ?? 1,
        });
        sourceMap.set(src.code, (res as any).insertId);
      } else {
        sourceMap.set(src.code, existingSrc.id);
      }
    }

    // 17.2 Campaigns
    const demoCampaigns = [
      {
        name: 'Kings Heights Diwali Fest 2026',
        sourceCode: 'google_ads',
        budget: '500000.00',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'diwali_fest_2026',
      },
      {
        name: 'Kothrud Luxury 2 & 3 BHK Showcase',
        sourceCode: 'meta_ads',
        budget: '350000.00',
        utmSource: 'facebook',
        utmMedium: 'social_paid',
        utmCampaign: 'luxury_showcase',
      },
      {
        name: 'Tower B Pre-Launch Campaign',
        sourceCode: 'magicbricks',
        budget: '200000.00',
        utmSource: 'magicbricks',
        utmMedium: 'banner',
        utmCampaign: 'tower_b_launch',
      },
    ];

    const campaignMap = new Map<string, number>();
    for (const camp of demoCampaigns) {
      let existingCamp = await db.query.reCampaigns.findFirst({
        where: and(eq(schema.reCampaigns.tenantId, tenant.id), eq(schema.reCampaigns.name, camp.name)),
      });
      if (!existingCamp) {
        const [res] = await db.insert(schema.reCampaigns).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          name: camp.name,
          sourceId: sourceMap.get(camp.sourceCode) ?? null,
          siteId: site.id,
          budget: camp.budget,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-10-31'),
          utmSource: camp.utmSource,
          utmMedium: camp.utmMedium,
          utmCampaign: camp.utmCampaign,
          createdBy: presalesExec?.id ?? 1,
        });
        campaignMap.set(camp.name, (res as any).insertId);
      } else {
        campaignMap.set(camp.name, existingCamp.id);
      }
    }

    // 17.3 Routing Rules
    const routingRules = [
      {
        name: 'High Budget HNI Routing (>= ₹80L)',
        conditions: { minBudget: 8000000 },
        userPool: [salesExec?.id ?? 1, presalesExec?.id ?? 1],
        strategy: 'round_robin' as const,
        slaMinutes: 15,
      },
      {
        name: 'Default Round-Robin Pre-sales Routing',
        conditions: {},
        userPool: [presalesExec?.id ?? 1],
        strategy: 'round_robin' as const,
        slaMinutes: 30,
      },
    ];

    for (const rule of routingRules) {
      const existingRule = await db.query.reRoutingRules.findFirst({
        where: and(eq(schema.reRoutingRules.tenantId, tenant.id), eq(schema.reRoutingRules.name, rule.name)),
      });
      if (!existingRule) {
        await db.insert(schema.reRoutingRules).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          name: rule.name,
          conditions: rule.conditions as any,
          userPool: rule.userPool as any,
          strategy: rule.strategy,
          slaMinutes: rule.slaMinutes,
          active: true,
          createdBy: presalesExec?.id ?? 1,
        });
      }
    }

    // 17.4 Seed Demo Leads
    const demoLeads = [
      {
        name: 'Vikram Singhania',
        mobile: '9820011111',
        email: 'vikram.singhania@gmail.com',
        city: 'Pune',
        budgetMin: '8000000.00',
        budgetMax: '9500000.00',
        configPref: '3BHK',
        purpose: 'end_use',
        sourceCode: 'meta_ads',
        campaignName: 'Kothrud Luxury 2 & 3 BHK Showcase',
        stage: 'negotiation',
        score: 85,
        temperature: 'hot' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: salesExec?.id ?? 1,
        slaBreached: false,
      },
      {
        name: 'Ananya Sen',
        mobile: '9820022222',
        email: 'ananya.sen@outlook.com',
        city: 'Mumbai',
        budgetMin: '7000000.00',
        budgetMax: '7500000.00',
        configPref: '2BHK',
        purpose: 'end_use',
        sourceCode: 'google_ads',
        campaignName: 'Kings Heights Diwali Fest 2026',
        stage: 'site_visit_scheduled',
        score: 75,
        temperature: 'hot' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: salesExec?.id ?? 1,
        slaBreached: false,
      },
      {
        name: 'Rohan Mehta',
        mobile: '9820033333',
        email: 'rohan.m@yahoo.com',
        city: 'Pune',
        budgetMin: '6000000.00',
        budgetMax: '6800000.00',
        configPref: '2BHK',
        purpose: 'investment',
        sourceCode: 'magicbricks',
        campaignName: 'Tower B Pre-Launch Campaign',
        stage: 'contacted',
        score: 55,
        temperature: 'warm' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: null,
        slaBreached: false,
      },
      {
        name: 'Dr. Arvind Joshi',
        mobile: '9820044444',
        email: 'dr.joshi@kothrudmed.org',
        city: 'Pune',
        budgetMin: '8500000.00',
        budgetMax: '9000000.00',
        configPref: '3BHK',
        purpose: 'end_use',
        sourceCode: 'walkin',
        campaignName: undefined,
        stage: 'site_visit_done',
        score: 80,
        temperature: 'hot' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: salesExec?.id ?? 1,
        slaBreached: false,
      },
      {
        name: 'Kavita Nair',
        mobile: '9820055555',
        email: 'kavita.nair@tcs.com',
        city: 'Pune',
        budgetMin: '4500000.00',
        budgetMax: '5000000.00',
        configPref: '1BHK',
        purpose: 'end_use',
        sourceCode: '99acres',
        campaignName: undefined,
        stage: 'new',
        score: 45,
        temperature: 'warm' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: null,
        slaBreached: false,
      },
      {
        name: 'Sunil Agarwal',
        mobile: '9820066666',
        email: 'sunil.agarwal@gmail.com',
        city: 'Pune',
        budgetMin: '6500000.00',
        budgetMax: '7000000.00',
        configPref: '2BHK',
        purpose: 'investment',
        sourceCode: 'housing',
        campaignName: undefined,
        stage: 'lost',
        score: 30,
        temperature: 'cold' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: salesExec?.id ?? 1,
        slaBreached: false,
      },
      {
        name: 'Deepak Patil',
        mobile: '9820077777',
        email: 'deepak.patil@rediffmail.com',
        city: 'Kolhapur',
        budgetMin: '8500000.00',
        budgetMax: '9200000.00',
        configPref: '3BHK',
        purpose: 'end_use',
        sourceCode: 'meta_ads',
        campaignName: 'Kothrud Luxury 2 & 3 BHK Showcase',
        stage: 'new',
        score: 70,
        temperature: 'hot' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: null,
        slaBreached: true, // overdue response test
      },
      {
        name: 'Manish Goel',
        mobile: '9820088888',
        email: 'manish.goel@gmail.com',
        city: 'Pune',
        budgetMin: '7000000.00',
        budgetMax: '7400000.00',
        configPref: '2BHK',
        purpose: 'end_use',
        sourceCode: 'cp_referral',
        campaignName: undefined,
        stage: 'booked',
        score: 95,
        temperature: 'hot' as const,
        presalesOwnerId: presalesExec?.id ?? 1,
        salesOwnerId: salesExec?.id ?? 1,
        slaBreached: false,
      },
    ];

    for (const lead of demoLeads) {
      const existingLead = await db.query.reLeads.findFirst({
        where: and(
          eq(schema.reLeads.tenantId, tenant.id),
          eq(schema.reLeads.mobile, lead.mobile),
          eq(schema.reLeads.siteId, site.id)
        ),
      });

      if (!existingLead) {
        const sourceId = sourceMap.get(lead.sourceCode) ?? null;
        const campaignId = lead.campaignName ? (campaignMap.get(lead.campaignName) ?? null) : null;

        const [lRes] = await db.insert(schema.reLeads).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          name: lead.name,
          mobile: lead.mobile,
          email: lead.email,
          city: lead.city,
          budgetMin: lead.budgetMin,
          budgetMax: lead.budgetMax,
          configPref: lead.configPref,
          purpose: lead.purpose,
          sourceId,
          campaignId,
          siteId: site.id,
          stage: lead.stage,
          score: lead.score,
          temperature: lead.temperature,
          presalesOwnerId: lead.presalesOwnerId,
          salesOwnerId: lead.salesOwnerId,
          slaBreached: lead.slaBreached,
          nextFollowupAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          firstResponseAt: lead.slaBreached ? null : new Date(),
          createdBy: presalesExec?.id ?? 1,
        });

        const leadId = (lRes as any).insertId;

        // Activity log
        await db.insert(schema.reLeadActivities).values({
          tenantId: tenant.id,
          leadId,
          type: 'call',
          outcome: 'Interested in project brochure and floor plans',
          notes: `Initial qualification completed. Customer requirement: ${lead.configPref} in Kings Heights Tower A/B.`,
          userId: presalesExec?.id ?? 1,
        });

        // Add follow-up
        await db.insert(schema.reFollowups).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          leadId,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'call',
          assignedTo: lead.presalesOwnerId,
          status: 'pending',
          createdBy: presalesExec?.id ?? 1,
        });

        // If site visit scheduled or done, add site visit record
        if (lead.stage === 'site_visit_scheduled' || lead.stage === 'site_visit_done' || lead.stage === 'negotiation') {
          await db.insert(schema.reSiteVisits).values({
            uuid: uuidv4(),
            tenantId: tenant.id,
            leadId,
            siteId: site.id,
            scheduledAt: new Date(Date.now() + (lead.stage === 'site_visit_scheduled' ? 86400000 : -86400000)),
            status: lead.stage === 'site_visit_scheduled' ? 'confirmed' : 'done',
            attendedBy: salesExec?.id ?? 1,
            feedback: lead.stage === 'site_visit_done' ? 'Customer visited 2BHK sample flat and liked the spacious balcony.' : null,
            createdBy: salesExec?.id ?? 1,
          });
        }
      }
    }

    console.log(`✅ Seeded ${demoLeads.length} demo CRM leads with activities, followups, and site visits.`);

    // ── 18. SEED CHANNEL PARTNERS & BROKERAGE (PHASE R7) ─────────────────────
    console.log('📌 Seeding Channel Partners, Lead Tags, Slabs & Brokerage Entries (Phase R7)...');

    const cpUser = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'cp_demo')),
    });

    const demoCps = [
      {
        firmName: 'Apex Realty Advisory',
        contactPerson: 'Vikram Mehta',
        mobile: '+91 98206 66777',
        email: 'cp_demo@apexrealty.in',
        reraNo: 'A51800019283',
        pan: 'AAACA1234F',
        gstin: '27AAACA1234F1Z1',
        tier: 'platinum' as const,
        status: 'active' as const,
        userId: cpUser?.id ?? null,
      },
      {
        firmName: 'PropTiger Partner Mumbai',
        contactPerson: 'Rajesh Nair',
        mobile: '+91 98207 77888',
        email: 'proptiger.mum@gmail.com',
        reraNo: 'A51800028192',
        pan: 'BBBCA2345G',
        gstin: '27BBBCA2345G1Z2',
        tier: 'gold' as const,
        status: 'active' as const,
        userId: null,
      },
      {
        firmName: 'Square Yards Associate',
        contactPerson: 'Amitabh Sharma',
        mobile: '+91 98208 88999',
        email: 'sqyards.partner@gmail.com',
        reraNo: 'A51800037162',
        pan: 'CCCCA3456H',
        gstin: '27CCCCA3456H1Z3',
        tier: 'gold' as const,
        status: 'active' as const,
        userId: null,
      },
      {
        firmName: 'Kothari Real Estate Consultants',
        contactPerson: 'Sunil Kothari',
        mobile: '+91 98209 99000',
        email: 'kothari.re@yahoo.com',
        reraNo: 'A51800049281',
        pan: 'DDDCA4567J',
        gstin: null,
        tier: 'silver' as const,
        status: 'active' as const,
        userId: null,
      },
      {
        firmName: 'Metro Luxury Homes',
        contactPerson: 'Kunal Singhania',
        mobile: '+91 98201 11000',
        email: 'metro.luxury@singhania.in',
        reraNo: 'A51800051928',
        pan: 'EEECA5678K',
        gstin: null,
        tier: 'silver' as const,
        status: 'pending_kyc' as const,
        userId: null,
      },
      {
        firmName: 'Sai Krupa Properties',
        contactPerson: 'Ganesh More',
        mobile: '+91 98202 22000',
        email: 'saikrupa.prop@gmail.com',
        reraNo: null,
        pan: 'FFFCA6789L',
        gstin: null,
        tier: 'silver' as const,
        status: 'pending_kyc' as const,
        userId: null,
      },
    ];

    const cpMap = new Map<string, number>();
    for (const cp of demoCps) {
      let existingCp = await db.query.reChannelPartners.findFirst({
        where: and(eq(schema.reChannelPartners.tenantId, tenant.id), eq(schema.reChannelPartners.firmName, cp.firmName)),
      });

      if (!existingCp) {
        const [res] = await db.insert(schema.reChannelPartners).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          firmName: cp.firmName,
          contactPerson: cp.contactPerson,
          mobile: cp.mobile,
          email: cp.email,
          reraNo: cp.reraNo,
          pan: cp.pan,
          gstin: cp.gstin,
          bankDetails: {
            bankName: 'HDFC Bank',
            accountNo: '50100234567890',
            ifsc: 'HDFC0000128',
            branch: 'Andheri West',
          },
          status: cp.status,
          tier: cp.tier,
          agreementAcceptedAt: cp.status === 'active' ? new Date() : null,
          agreementIp: '127.0.0.1',
          userId: cp.userId,
          createdBy: defaultUserId,
        });
        const newCpId = (res as any).insertId;
        cpMap.set(cp.firmName, newCpId);

        if (cp.status === 'active') {
          await db.insert(schema.reCpProjectAccess).values({
            cpId: newCpId,
            siteId: site.id,
          });
        }
      } else {
        cpMap.set(cp.firmName, existingCp.id);
      }
    }

    // 18.2 Slabs
    const demoSlabs = [
      { tier: 'platinum' as const, fromCount: 1, toCount: 5, pct: '2.5000' },
      { tier: 'platinum' as const, fromCount: 6, toCount: null, pct: '3.0000' },
      { tier: 'gold' as const, fromCount: 1, toCount: 5, pct: '2.0000' },
      { tier: 'gold' as const, fromCount: 6, toCount: null, pct: '2.5000' },
      { tier: 'silver' as const, fromCount: 1, toCount: null, pct: '1.5000' },
    ];

    for (const slab of demoSlabs) {
      const existingSlab = await db.query.reBrokerageSlabs.findFirst({
        where: and(
          eq(schema.reBrokerageSlabs.tenantId, tenant.id),
          eq(schema.reBrokerageSlabs.siteId, site.id),
          eq(schema.reBrokerageSlabs.tier, slab.tier),
          eq(schema.reBrokerageSlabs.fromCount, slab.fromCount),
        ),
      });
      if (!existingSlab) {
        await db.insert(schema.reBrokerageSlabs).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: site.id,
          tier: slab.tier,
          fromCount: slab.fromCount,
          toCount: slab.toCount,
          pct: slab.pct,
          createdBy: defaultUserId,
        });
      }
    }

    // 18.3 Tagged Leads for Apex Realty
    const apexId = cpMap.get('Apex Realty Advisory') || 1;
    const leadsToTag = await db.query.reLeads.findMany({
      where: and(eq(schema.reLeads.tenantId, tenant.id), eq(schema.reLeads.cpId, apexId)),
    });

    for (const l of leadsToTag) {
      const existingTag = await db.query.reCpLeadTags.findFirst({
        where: and(
          eq(schema.reCpLeadTags.tenantId, tenant.id),
          eq(schema.reCpLeadTags.leadId, l.id),
          eq(schema.reCpLeadTags.cpId, apexId),
        ),
      });
      if (!existingTag) {
        await db.insert(schema.reCpLeadTags).values({
          tenantId: tenant.id,
          leadId: l.id,
          cpId: apexId,
          taggedAt: new Date(Date.now() - 15 * 86400000), // Tagged 15 days ago
          validTill: new Date(Date.now() + 45 * 86400000), // 45 days remaining
          status: 'active',
          evidence: 'Client registration via CP Partner desk',
          createdBy: defaultUserId,
        });
      }
    }

    // 18.4 Brokerage Entries for Bookings
    const existingBookings = await db.query.reBookings.findMany({
      where: eq(schema.reBookings.tenantId, tenant.id),
      limit: 2,
    });

    if (existingBookings.length > 0) {
      const b1 = existingBookings[0]!;
      const baseVal = Number(b1.agreementValue || 8500000);
      const slabPct = 2.5; // Platinum 2.5%
      const gross = Math.round(baseVal * (slabPct / 100));
      const gst = Math.round(gross * 0.18);
      const tds = Math.round(gross * 0.05); // Section 194-H 5% TDS
      const net = gross + gst - tds;

      const existingEntry = await db.query.reBrokerageEntries.findFirst({
        where: and(
          eq(schema.reBrokerageEntries.tenantId, tenant.id),
          eq(schema.reBrokerageEntries.bookingId, b1.id),
        ),
      });

      if (!existingEntry) {
        const [entryRes] = await db.insert(schema.reBrokerageEntries).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          bookingId: b1.id,
          cpId: apexId,
          base: baseVal.toFixed(2),
          pct: slabPct.toFixed(4),
          brokerage: gross.toFixed(2),
          gst: gst.toFixed(2),
          tds194h: tds.toFixed(2),
          net: net.toFixed(2),
          status: 'paid',
          eligibleRule: 'Customer agreement registered, 10% milestone verified',
          createdBy: defaultUserId,
        });

        // Add payout record for entry
        await db.insert(schema.reCpPayouts).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          cpId: apexId,
          payoutDate: new Date(),
          amount: gross.toFixed(2),
          tds: tds.toFixed(2),
          netPaid: net.toFixed(2),
          bankRef: 'NEFT-HDFC-991823712',
          status: 'paid',
          createdBy: defaultUserId,
        });
      }
    }

    console.log(`✅ Seeded ${demoCps.length} Channel Partners, Slabs, Tagged Leads & Brokerage Entries.`);

    console.log('\n🎉 Realty module seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding Realty module:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedRealty()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
