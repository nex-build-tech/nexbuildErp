import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';
import { PERMISSIONS } from '@builderp/shared';
import { eq, and } from 'drizzle-orm';

async function seed() {
  const connectionUrl = process.env['DATABASE_URL'] || 'mysql://root:@localhost:3307/builderp';
  console.log(`🌱 Seeding database at ${connectionUrl.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = mysql.createPool({ uri: connectionUrl });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // ── 1. SEED PERMISSIONS ─────────────────────────────────────────────
    console.log('📌 Seeding permissions...');
    const allPermKeys = Object.values(PERMISSIONS);
    for (const code of allPermKeys) {
      const [module, action] = code.split('.');
      const existing = await db.query.permissions.findFirst({
        where: eq(schema.permissions.code, code),
      });
      if (!existing) {
        await db.insert(schema.permissions).values({
          code,
          module: module || 'core',
          action: action || 'all',
          description: `Permission for ${code}`,
        });
      }
    }
    const dbPermissions = await db.select().from(schema.permissions);
    console.log(`✅ ${dbPermissions.length} permissions verified.`);

    // ── 2. SEED TENANT: KINGS BUILDERS & DEVELOPERS ─────────────────────
    console.log('📌 Seeding tenant: Kings Builders & Developers...');
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

    // ── 3. SEED ROLES FOR KINGS BUILDERS ────────────────────────────────
    console.log('📌 Seeding roles...');
    const roleDefinitions = [
      {
        code: 'super_admin',
        name: 'Platform Super Administrator',
        description: 'Complete SaaS platform control over all tenants, organizations, subscriptions, and palettes',
        isSystem: true,
      },
      {
        code: 'boss',
        name: 'Owner / Boss',
        description: 'Complete executive control, final approvals, audit and all reports',
        isSystem: true,
      },
      {
        code: 'admin',
        name: 'Administrator',
        description: 'Tenant management, users, roles, masters, and configuration',
        isSystem: true,
      },
      {
        code: 'store',
        name: 'Store Keeper',
        description: 'GRN inspection, inventory management, material issues and transfers',
        isSystem: true,
      },
      {
        code: 'purchase',
        name: 'Purchase Officer',
        description: 'Indents, RFQs, vendor quotations, and Purchase Orders',
        isSystem: true,
      },
      {
        code: 'sitemgr',
        name: 'Site Manager',
        description: 'Site indents, material receipt at site, site-level consumption',
        isSystem: true,
      },
    ];

    const seededRoles: Record<string, typeof schema.roles.$inferSelect> = {};

    for (const r of roleDefinitions) {
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

    // ── 4. ASSIGN ROLE PERMISSIONS ──────────────────────────────────────
    console.log('📌 Mapping role permissions...');
    for (const p of dbPermissions) {
      const superAdminRole = seededRoles['super_admin'];
      if (superAdminRole) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, superAdminRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: superAdminRole.id, permissionId: p.id });
      }

      const bossRole = seededRoles['boss'];
      if (bossRole) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, bossRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: bossRole.id, permissionId: p.id });
      }

      const adminRole = seededRoles['admin'];
      if (adminRole) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, adminRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: adminRole.id, permissionId: p.id });
      }

      const storeRole = seededRoles['store'];
      if (storeRole && (p.module === 'grn' || p.module === 'stock' || p.module === 'warehouse' || p.module === 'item')) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, storeRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: storeRole.id, permissionId: p.id });
      }

      const purchaseRole = seededRoles['purchase'];
      if (purchaseRole && (p.module === 'po' || p.module === 'supplier' || p.module === 'item' || p.code === 'report.view')) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, purchaseRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: purchaseRole.id, permissionId: p.id });
      }

      const sitemgrRole = seededRoles['sitemgr'];
      if (sitemgrRole && (p.code === 'po.view' || p.code === 'grn.view' || p.code === 'stock.view' || p.code === 'stock.issue')) {
        const has = await db.query.rolePermissions.findFirst({
          where: and(eq(schema.rolePermissions.roleId, sitemgrRole.id), eq(schema.rolePermissions.permissionId, p.id)),
        });
        if (!has) await db.insert(schema.rolePermissions).values({ roleId: sitemgrRole.id, permissionId: p.id });
      }
    }

    // ── 5. SEED USERS FOR KINGS BUILDERS ────────────────────────────────
    console.log('📌 Seeding demo users...');
    const userDefinitions = [
      { username: 'superadmin', password: 'superadmin123', fullName: 'SaaS Platform Super Administrator', email: 'superadmin@builderp.in', phone: '+91 99999 00000', roleCode: 'super_admin' },
      { username: 'boss', password: 'boss123', fullName: 'Vikram Singh', email: 'vikram.singh@kingsbuilders.in', phone: '+91 98200 11111', roleCode: 'boss' },
      { username: 'admin', password: 'admin123', fullName: 'Rajesh Sharma', email: 'rajesh.sharma@kingsbuilders.in', phone: '+91 98200 22222', roleCode: 'admin' },
      { username: 'store', password: 'store123', fullName: 'Suresh Patel', email: 'suresh.patel@kingsbuilders.in', phone: '+91 98200 33333', roleCode: 'store' },
      { username: 'purchase', password: 'pur123', fullName: 'Priya Verma', email: 'priya.verma@kingsbuilders.in', phone: '+91 98200 44444', roleCode: 'purchase' },
      { username: 'sitemgr', password: 'site123', fullName: 'Amit Kumar', email: 'amit.kumar@kingsbuilders.in', phone: '+91 98200 55555', roleCode: 'sitemgr' },
    ];

    for (const u of userDefinitions) {
      const existing = await db.query.users.findFirst({
        where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, u.username)),
      });

      const role = seededRoles[u.roleCode]!;
      const passwordHash = await bcrypt.hash(u.password, 10);

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
        await db.update(schema.users).set({ passwordHash, roleId: role.id }).where(eq(schema.users.id, existing.id));
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 6. SEED MASTERS FOR KINGS BUILDERS (PHASE P2)
    // ═════════════════════════════════════════════════════════════════════

    // A. UNITS
    console.log('📌 Seeding Units of Measure...');
    const unitDefs = [
      { code: 'BAG', name: 'Bags', symbol: 'bag' },
      { code: 'MT', name: 'Metric Ton', symbol: 'mt' },
      { code: 'KG', name: 'Kilograms', symbol: 'kg' },
      { code: 'LTR', name: 'Litres', symbol: 'ltr' },
      { code: 'PCS', name: 'Pieces', symbol: 'pcs' },
      { code: 'SQFT', name: 'Square Feet', symbol: 'sq.ft' },
      { code: 'RFT', name: 'Running Feet', symbol: 'rft' },
      { code: 'TRIP', name: 'Brass / Trip', symbol: 'brass' },
    ];
    const seededUnits: Record<string, number> = {};
    for (const u of unitDefs) {
      let unit = await db.query.units.findFirst({
        where: and(eq(schema.units.tenantId, tenant.id), eq(schema.units.code, u.code)),
      });
      if (!unit) {
        await db.insert(schema.units).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: u.code,
          name: u.name,
          symbol: u.symbol,
        });
        unit = (await db.query.units.findFirst({
          where: and(eq(schema.units.tenantId, tenant.id), eq(schema.units.code, u.code)),
        }))!;
      }
      seededUnits[u.code] = unit.id;
    }
    console.log(`✅ Seeded ${Object.keys(seededUnits).length} units.`);

    // B. CATEGORIES
    console.log('📌 Seeding Categories...');
    const catDefs = [
      { code: 'CAT-CIVIL', name: 'Civil & Structural Materials', desc: 'Cement, Sand, Aggregates, Red Bricks, AAC Blocks' },
      { code: 'CAT-STEEL', name: 'Steel & Reinforcements', desc: 'TMT bars, Binding wires, structural beams' },
      { code: 'CAT-PLUMB', name: 'Plumbing & Sanitary', desc: 'PVC pipes, CPVC, GI fittings, sanitary fixtures' },
      { code: 'CAT-ELEC', name: 'Electrical & Lighting', desc: 'Wires, conduits, switches, distribution boards' },
      { code: 'CAT-FINISH', name: 'Finishing & Paints', desc: 'Paints, primers, tiles, marble, granite' },
      { code: 'CAT-HOUSE', name: 'Housekeeping & Cleaning Materials', desc: 'Housekeeping supplies, chemicals, brushes, dusters (GCS quotation)' },
    ];
    const seededCategories: Record<string, number> = {};
    for (const c of catDefs) {
      let cat = await db.query.categories.findFirst({
        where: and(eq(schema.categories.tenantId, tenant.id), eq(schema.categories.code, c.code)),
      });
      if (!cat) {
        await db.insert(schema.categories).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: c.code,
          name: c.name,
          description: c.desc,
        });
        cat = (await db.query.categories.findFirst({
          where: and(eq(schema.categories.tenantId, tenant.id), eq(schema.categories.code, c.code)),
        }))!;
      }
      seededCategories[c.code] = cat.id;
    }
    console.log(`✅ Seeded ${Object.keys(seededCategories).length} categories.`);

    // C. SITES (5 Construction Projects)
    console.log('📌 Seeding Sites (Construction Projects)...');
    const siteDefs = [
      { code: 'SITE-KH', name: 'Kings Heights Tower A & B', client: 'Kings Real Estate LLP', address: 'Plot 42, Lokhandwala Complex, Andheri West', city: 'Mumbai', pincode: '400053' },
      { code: 'SITE-RP', name: 'Royal Palm Luxury Residences', client: 'Kings Developers Ltd', address: 'Near Gokuldham, Goregaon East', city: 'Mumbai', pincode: '400063' },
      { code: 'SITE-KC', name: 'Kings Crown Villa Estate', client: 'Private HNI Clients', address: 'Tungarli Hills, Old Mumbai-Pune Road', city: 'Lonavala', pincode: '410401' },
      { code: 'SITE-PR', name: 'Palm Residency Heights', client: 'Kings Infratech', address: 'Ghopdeo Road, Majiwada Junction', city: 'Thane West', pincode: '400601' },
      { code: 'SITE-CH', name: 'Kings Commercial Hub', client: 'Kings Corporate Park', address: 'G Block, Bandra Kurla Complex (BKC)', city: 'Mumbai', pincode: '400051' },
    ];
    const seededSites: Record<string, number> = {};
    for (const s of siteDefs) {
      let site = await db.query.sites.findFirst({
        where: and(eq(schema.sites.tenantId, tenant.id), eq(schema.sites.code, s.code)),
      });
      if (!site) {
        await db.insert(schema.sites).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: s.code,
          name: s.name,
          clientName: s.client,
          address: s.address,
          city: s.city,
          stateCode: '27',
          pincode: s.pincode,
          status: 'active',
        });
        site = (await db.query.sites.findFirst({
          where: and(eq(schema.sites.tenantId, tenant.id), eq(schema.sites.code, s.code)),
        }))!;
      }
      seededSites[s.code] = site.id;
    }
    console.log(`✅ Seeded ${Object.keys(seededSites).length} sites.`);

    // Link Site Manager user to Sites
    const siteMgrUser = await db.query.users.findFirst({
      where: and(eq(schema.users.tenantId, tenant.id), eq(schema.users.username, 'sitemgr')),
    });
    if (siteMgrUser) {
      for (const siteId of Object.values(seededSites)) {
        const hasSite = await db.query.userSites.findFirst({
          where: and(eq(schema.userSites.userId, siteMgrUser.id), eq(schema.userSites.siteId, siteId)),
        });
        if (!hasSite) {
          await db.insert(schema.userSites).values({ userId: siteMgrUser.id, siteId });
        }
      }
    }

    // D. WAREHOUSES
    console.log('📌 Seeding Warehouses & Stores...');
    const whDefs = [
      { code: 'WH-CENTRAL', name: 'Central Warehouse & Logistics Hub', siteId: null, isCentral: true, address: 'Plot 18, MIDC Industrial Area, Andheri East, Mumbai' },
      { code: 'WH-KH', name: 'Kings Heights Site Store', siteId: seededSites['SITE-KH'], isCentral: false, address: 'Kings Heights Site Basement 1, Andheri West' },
      { code: 'WH-RP', name: 'Royal Palm Site Store', siteId: seededSites['SITE-RP'], isCentral: false, address: 'Royal Palm Compound, Goregaon East' },
      { code: 'WH-KC', name: 'Kings Crown Villa Store', siteId: seededSites['SITE-KC'], isCentral: false, address: 'Villa Site Gate No. 2, Lonavala' },
      { code: 'WH-PR', name: 'Palm Residency Site Store', siteId: seededSites['SITE-PR'], isCentral: false, address: 'Palm Residency Gate 1, Majiwada Thane' },
      { code: 'WH-CH', name: 'Commercial Hub Store', siteId: seededSites['SITE-CH'], isCentral: false, address: 'Commercial Hub Basement 2, BKC Mumbai' },
    ];
    for (const w of whDefs) {
      let wh = await db.query.warehouses.findFirst({
        where: and(eq(schema.warehouses.tenantId, tenant.id), eq(schema.warehouses.code, w.code)),
      });
      if (!wh) {
        await db.insert(schema.warehouses).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          siteId: w.siteId,
          code: w.code,
          name: w.name,
          address: w.address,
          isCentral: w.isCentral,
          status: 'active',
        });
      }
    }
    console.log('✅ Seeded Central and Site Warehouses.');

    // E. VENDORS (Suppliers)
    console.log('📌 Seeding Vendors...');
    const vendorDefs = [
      {
        code: 'VEN-KHETESHWAR',
        name: 'KHETESHWAR TRADING',
        contact: 'Mr. Kheteshwar',
        phone: '9967641843',
        email: 'kheteshwertrading1008@gmail.com',
        gstin: '27ADWPR7846J1ZF',
        pan: 'ADWPR7846J',
        stateCode: '27',
        address: 'Plot NO. A - 21, Janta Market Sector - 23, Turbhe Navi Mumbai 400 705',
        bank: 'G.P.PARSIK BANK LTD (BRANCH: SANPADA)',
        account: '013013600000022',
        ifsc: 'PJSB0000014',
      },
      {
        code: 'VEN-ULTRATECH',
        name: 'UltraTech Cement Limited',
        contact: 'Karan Mehra',
        phone: '+91 98201 55501',
        email: 'sales.mumbai@ultratechcement.com',
        gstin: '27AAACU3456K1Z9',
        pan: 'AAACU3456K',
        stateCode: '27',
        address: 'Ahura Centre, Mahakali Caves Road, Andheri East, Mumbai 400093',
        bank: 'HDFC Bank Ltd',
        account: '50200011223344',
        ifsc: 'HDFC0000123',
      },
      {
        code: 'VEN-TATATISCON',
        name: 'Tata Tiscon Steel Distributors',
        contact: 'Ramesh Gupta',
        phone: '+91 98202 66602',
        email: 'orders@tatasurajsteel.com',
        gstin: '27AABCT2345H1Z3',
        pan: 'AABCT2345H',
        stateCode: '27',
        address: 'Steel Market Yard, Kalamboli, Navi Mumbai 410218',
        bank: 'State Bank of India',
        account: '30998877665',
        ifsc: 'SBIN0004567',
      },
      {
        code: 'VEN-MAHALAXMI',
        name: 'Mahalaxmi Sand & Aggregate Suppliers',
        contact: 'Mahesh Jadhav',
        phone: '+91 98203 77703',
        email: 'mahalaxmi.aggregates@gmail.com',
        gstin: '27AAHPM9876C1Z1',
        pan: 'AAHPM9876C',
        stateCode: '27',
        address: 'Old Panvel Naka, Panvel, Navi Mumbai 410206',
        bank: 'Bank of Baroda',
        account: '04560100012345',
        ifsc: 'BARB0PANVEL',
      },
      {
        code: 'VEN-SUPREME',
        name: 'Supreme Industries Plumbing Division',
        contact: 'Sunil Shinde',
        phone: '+91 98204 88804',
        email: 'pipes.west@supreme.co.in',
        gstin: '27AAACS1234D1Z8',
        pan: 'AAACS1234D',
        stateCode: '27',
        address: '1161 Solitaire Corporate Park, Andheri-Ghatkopar Link Road, Mumbai',
        bank: 'ICICI Bank',
        account: '001105012345',
        ifsc: 'ICIC0000011',
      },
      {
        code: 'VEN-POLYCAB',
        name: 'Polycab Electricals & Cables Ltd',
        contact: 'Deepak Shah',
        phone: '+91 98205 99905',
        email: 'commercial@polycabcables.com',
        gstin: '27AAACP5678B1Z6',
        pan: 'AAACP5678B',
        stateCode: '27',
        address: 'Polycab House, 771 Mogul Lane, Mahim, Mumbai 400016',
        bank: 'Axis Bank',
        account: '912020034567890',
        ifsc: 'UTIB0000045',
      },
      {
        code: 'VEN-ASIANPAINTS',
        name: 'Asian Paints Commercial Projects',
        contact: 'Sameer Kulkarni',
        phone: '+91 98206 11106',
        email: 'mumbai.projectsales@asianpaints.com',
        gstin: '27AAACA1111A1Z2',
        pan: 'AAACA1111A',
        stateCode: '27',
        address: '6A Shantinagar, Santacruz East, Mumbai 400055',
        bank: 'Kotak Mahindra Bank',
        account: '09876543210',
        ifsc: 'KKBK0000123',
      },
      {
        code: 'VEN-INTERSTATE-STEEL',
        name: 'Jindal Steel & Power Ltd (Inter-State)',
        contact: 'Pradeep Goyal',
        phone: '+91 98207 22207',
        email: 'gujarat.sales@jindalsteel.com',
        gstin: '24AAACJ5678Q1Z4', // 24 = Gujarat
        pan: 'AAACJ5678Q',
        stateCode: '24',
        address: 'GIDC Industrial Estate, Vadodara, Gujarat 390010',
        bank: 'Punjab National Bank',
        account: '1234002100054321',
        ifsc: 'PUNB0123400',
      },
    ];

    for (const v of vendorDefs) {
      let ven = await db.query.vendors.findFirst({
        where: and(eq(schema.vendors.tenantId, tenant.id), eq(schema.vendors.code, v.code)),
      });
      if (!ven) {
        await db.insert(schema.vendors).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: v.code,
          name: v.name,
          contactPerson: v.contact,
          phone: v.phone,
          email: v.email,
          gstin: v.gstin,
          pan: v.pan,
          stateCode: v.stateCode,
          address: v.address,
          city: 'Mumbai',
          bankName: v.bank,
          bankAccountNo: v.account,
          bankIfsc: v.ifsc,
          paymentTerms: '30 Days Credit',
          rating: '4.80',
          status: 'active',
        });
      }
    }
    console.log('✅ Seeded 8 Vendors (including Kheteshwar Trading from GCS.pdf and Inter-State Jindal).');

    // F. CONTRACTORS
    console.log('📌 Seeding Contractors...');
    const contractorDefs = [
      { code: 'CONT-CIVIL', name: 'Sharma Civil Construction & RCC Works', contact: 'Omprakash Sharma', phone: '+91 98190 12345', trade: 'Civil & RCC Structure', pan: 'ABOPS1234C' },
      { code: 'CONT-ELEC', name: 'Apex Electrical & MEP Contractors', contact: 'Vijay Nair', phone: '+91 98190 23456', trade: 'Electrical & MEP', pan: 'ACDVN2345D' },
      { code: 'CONT-PLUMB', name: 'Super Flow Plumbing & Sanitary Contractors', contact: 'Irfan Khan', phone: '+91 98190 34567', trade: 'Plumbing & Drainage', pan: 'ADVIK3456E' },
      { code: 'CONT-PAINT', name: 'Rainbow Painters & Waterproofers', contact: 'Santosh Sawant', phone: '+91 98190 45678', trade: 'Painting & Waterproofing', pan: 'AEEPS4567F' },
      { code: 'CONT-LABOUR', name: 'Maharashtra Labour Supply Syndicate', contact: 'Baburao Shinde', phone: '+91 98190 56789', trade: 'Masonry & Manual Labour', pan: 'AFBBS5678G' },
    ];
    for (const c of contractorDefs) {
      let cont = await db.query.contractors.findFirst({
        where: and(eq(schema.contractors.tenantId, tenant.id), eq(schema.contractors.code, c.code)),
      });
      if (!cont) {
        await db.insert(schema.contractors).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          code: c.code,
          name: c.name,
          contactPerson: c.contact,
          phone: c.phone,
          trade: c.trade,
          pan: c.pan,
          status: 'active',
        });
      }
    }
    console.log('✅ Seeded 5 Contractors.');

    // G. DOCUMENT NUMBER SERIES
    console.log('📌 Seeding Document Number Series...');
    const seriesDefs = [
      { type: 'PO', prefix: 'KB/PO', fy: '26-27', next: 1, pad: 4 },
      { type: 'GRN', prefix: 'KB/GRN', fy: '26-27', next: 1, pad: 4 },
      { type: 'REQ', prefix: 'KB/REQ', fy: '26-27', next: 1, pad: 4 },
      { type: 'ISSUE', prefix: 'KB/ISS', fy: '26-27', next: 1, pad: 4 },
    ];
    for (const s of seriesDefs) {
      let ds = await db.query.documentSeries.findFirst({
        where: and(
          eq(schema.documentSeries.tenantId, tenant.id),
          eq(schema.documentSeries.documentType, s.type),
          eq(schema.documentSeries.financialYear, s.fy)
        ),
      });
      if (!ds) {
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
    console.log('✅ Seeded Document Number Series (KB/PO/26-27/0001, etc.).');

    // H. ITEMS (~50 Items: Civil Materials + GCS.pdf Housekeeping items)
    console.log('📌 Seeding Items (~50 Items)...');
    const itemDefs = [
      // 1. Civil Materials
      { code: 'MAT-CEM-53', name: 'UltraTech OPC 53 Grade Cement', cat: 'CAT-CIVIL', unit: 'BAG', hsn: '252329', gst: '28', rate: '385.0000', brand: 'UltraTech', reorder: '500.000' },
      { code: 'MAT-CEM-PPC', name: 'Ambuja PPC Pozzolana Cement', cat: 'CAT-CIVIL', unit: 'BAG', hsn: '252329', gst: '28', rate: '365.0000', brand: 'Ambuja', reorder: '300.000' },
      { code: 'MAT-STL-12', name: 'Tata Tiscon TMT Fe 550D Rebar 12mm', cat: 'CAT-STEEL', unit: 'MT', hsn: '721420', gst: '18', rate: '58500.0000', brand: 'Tata Tiscon', reorder: '15.000' },
      { code: 'MAT-STL-16', name: 'Tata Tiscon TMT Fe 550D Rebar 16mm', cat: 'CAT-STEEL', unit: 'MT', hsn: '721420', gst: '18', rate: '58500.0000', brand: 'Tata Tiscon', reorder: '20.000' },
      { code: 'MAT-STL-08', name: 'JSW Neosteel TMT Rebar 8mm', cat: 'CAT-STEEL', unit: 'MT', hsn: '721420', gst: '18', rate: '60200.0000', brand: 'JSW', reorder: '10.000' },
      { code: 'MAT-SAND-RIV', name: 'Natural River Sand (Screened)', cat: 'CAT-CIVIL', unit: 'TRIP', hsn: '250510', gst: '5', rate: '6500.0000', brand: 'Mahalaxmi', reorder: '10.000' },
      { code: 'MAT-SAND-M', name: 'Manufactured Concrete M-Sand', cat: 'CAT-CIVIL', unit: 'TRIP', hsn: '250590', gst: '5', rate: '4200.0000', brand: 'Mahalaxmi', reorder: '15.000' },
      { code: 'MAT-AGG-20', name: 'Crushed Blue Metal Aggregate 20mm', cat: 'CAT-CIVIL', unit: 'TRIP', hsn: '251710', gst: '5', rate: '3800.0000', brand: 'Mahalaxmi', reorder: '15.000' },
      { code: 'MAT-AGG-10', name: 'Crushed Stone Aggregate 10mm', cat: 'CAT-CIVIL', unit: 'TRIP', hsn: '251710', gst: '5', rate: '4100.0000', brand: 'Mahalaxmi', reorder: '10.000' },
      { code: 'MAT-BRK-RED', name: 'Kiln Baked Red Clay Bricks (Standard)', cat: 'CAT-CIVIL', unit: 'PCS', hsn: '690100', gst: '12', rate: '9.5000', brand: 'Standard', reorder: '10000.000' },
      { code: 'MAT-BRK-AAC', name: 'Siporex AAC Lightweight Blocks 600x200x150mm', cat: 'CAT-CIVIL', unit: 'PCS', hsn: '681011', gst: '18', rate: '62.0000', brand: 'Siporex', reorder: '2000.000' },
      { code: 'MAT-PLB-PVC110', name: 'Supreme PVC Drainage Pipe 110mm 4kg/cm2 (6m)', cat: 'CAT-PLUMB', unit: 'PCS', hsn: '391723', gst: '18', rate: '620.0000', brand: 'Supreme', reorder: '50.000' },
      { code: 'MAT-PLB-CPVC', name: 'Astral CPVC Cold/Hot Water Pipe 1 inch (3m)', cat: 'CAT-PLUMB', unit: 'PCS', hsn: '391723', gst: '18', rate: '340.0000', brand: 'Astral', reorder: '60.000' },
      { code: 'MAT-ELC-WIRE25', name: 'Polycab FR 2.5 sq mm Copper Wire Red (90m coil)', cat: 'CAT-ELEC', unit: 'PCS', hsn: '854449', gst: '18', rate: '2450.0000', brand: 'Polycab', reorder: '30.000' },
      { code: 'MAT-ELC-WIRE15', name: 'Polycab FR 1.5 sq mm Copper Wire Blue (90m coil)', cat: 'CAT-ELEC', unit: 'PCS', hsn: '854449', gst: '18', rate: '1580.0000', brand: 'Polycab', reorder: '30.000' },
      { code: 'MAT-CHM-WP', name: 'Dr. Fixit Pidiproof LW+ Integral Waterproofing 5L', cat: 'CAT-CIVIL', unit: 'LTR', hsn: '382440', gst: '18', rate: '165.0000', brand: 'Dr. Fixit', reorder: '20.000' },
      { code: 'MAT-PNT-EXT', name: 'Asian Paints Apex Ultima Exterior Emulsion 20L', cat: 'CAT-FINISH', unit: 'LTR', hsn: '320910', gst: '18', rate: '4850.0000', brand: 'Asian Paints', reorder: '10.000' },
      { code: 'MAT-PNT-PRM', name: 'Asian Paints Decoprime Wall Primer 20L', cat: 'CAT-FINISH', unit: 'LTR', hsn: '320910', gst: '18', rate: '2100.0000', brand: 'Asian Paints', reorder: '15.000' },

      // 2. Housekeeping & Maintenance Items (Exact from GCS.pdf)
      { code: 'HK-01-BATH', name: 'BATHROOM CLEANER 5LTR', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '340290', gst: '18', rate: '650.0000', brand: 'Kheteshwar', reorder: '5.000' },
      { code: 'HK-02-SURF', name: 'HARD SURFACE CLEANER 5 LTR', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '340111', gst: '18', rate: '650.0000', brand: 'Kheteshwar', reorder: '5.000' },
      { code: 'HK-03-GLASS', name: 'GLASS CLEANER 5LTR (BS)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '34021190', gst: '18', rate: '120.0000', brand: 'Kheteshwar', reorder: '10.000' },
      { code: 'HK-04-TOILET', name: 'TOILET CLEANER 5 LTR', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '38089400', gst: '18', rate: '180.0000', brand: 'Kheteshwar', reorder: '10.000' },
      { code: 'HK-05-SONA', name: 'SONA GREEN 5L', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '090962', gst: '18', rate: '400.0000', brand: 'Sona', reorder: '5.000' },
      { code: 'HK-06-DUST', name: 'CHECKED DUSTER', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '630710', gst: '5', rate: '10.0000', brand: 'Generic', reorder: '50.000' },
      { code: 'HK-07-GARB', name: 'GARBAGE BAGS 29 * 39', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '39232100', gst: '18', rate: '80.0000', brand: 'Generic', reorder: '20.000' },
      { code: 'HK-08-MOP', name: 'WET MOP (HEAVY DUTY)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '39249090', gst: '18', rate: '145.0000', brand: 'Generic', reorder: '30.000' },
      { code: 'HK-09-SBROOM', name: 'SOFT BROOM (PHOOL JHARU)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '96031000', gst: 'Exempt', rate: '130.0000', brand: 'Natural', reorder: '25.000' },
      { code: 'HK-10-HBROOM', name: 'HARD BROOM (NARIYAL JHARU)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '96031000', gst: 'Exempt', rate: '50.0000', brand: 'Natural', reorder: '25.000' },
      { code: 'HK-11-TBRUSH', name: 'TOILET BRUSH ROUND', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '96039000', gst: '18', rate: '75.0000', brand: 'Parmar', reorder: '20.000' },
      { code: 'HK-12-FEATHER', name: '(C-538) FEATHER DUSTER (M) YELLOW', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '96032900', gst: '18', rate: '120.0000', brand: 'C-538', reorder: '15.000' },
      { code: 'HK-13-DUSTPAN', name: 'DUST PAN BIG (V) PARMAR', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '3924', gst: '18', rate: '50.0000', brand: 'Parmar', reorder: '15.000' },
      { code: 'HK-14-KATHA', name: 'KATHA CLEANING SCRUB', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '392690', gst: '18', rate: '10.0000', brand: 'Generic', reorder: '50.000' },
      { code: 'HK-15-GWIPER', name: 'GLASS WIPER (PROFESSIONAL)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '392690', gst: '18', rate: '280.0000', brand: 'Generic', reorder: '10.000' },
      { code: 'HK-16-PKATA', name: 'PLASTIC KATA SCRUBBER', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '392690', gst: '18', rate: '10.0000', brand: 'Generic', reorder: '30.000' },
      { code: 'HK-17-WIPERBIG', name: 'FLOOR WIPER BIG', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '96039000', gst: '18', rate: '120.0000', brand: 'Generic', reorder: '20.000' },
      { code: 'HK-18-ACID', name: 'CLEANING ACID 5LTR', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '280800', gst: '18', rate: '120.0000', brand: 'Generic', reorder: '10.000' },
      { code: 'HK-19-PATRA', name: 'PALTI PATRA (SCRAPER)', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '84602990', gst: '18', rate: '20.0000', brand: 'Generic', reorder: '25.000' },
      { code: 'HK-20-GLOVES', name: 'SAFETY RUBBER HAND GLOVES', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '40159099', gst: '18', rate: '55.0000', brand: 'SafeHand', reorder: '30.000' },
      { code: 'HK-21-MASK', name: 'PROTECTIVE DUST MASKS', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '100810', gst: '18', rate: '12.0000', brand: 'SafeBreathe', reorder: '50.000' },
      { code: 'HK-22-MICROFIBER', name: 'MICROFIBER DUSTER - RED', cat: 'CAT-HOUSE', unit: 'PCS', hsn: '630710', gst: '5', rate: '15.0000', brand: 'MicroShine', reorder: '30.000' },
    ];

    let itemCount = 0;
    for (const it of itemDefs) {
      let item = await db.query.items.findFirst({
        where: and(eq(schema.items.tenantId, tenant.id), eq(schema.items.code, it.code)),
      });
      const catId = seededCategories[it.cat]!;
      const unitId = seededUnits[it.unit]!;

      if (!item) {
        await db.insert(schema.items).values({
          uuid: uuidv4(),
          tenantId: tenant.id,
          categoryId: catId,
          unitId: unitId,
          code: it.code,
          name: it.name,
          description: it.name,
          hsnCode: it.hsn,
          gstRate: it.gst,
          defaultRate: it.rate,
          reorderLevel: it.reorder,
          brand: it.brand,
          status: 'active',
        });
        itemCount++;
      }
    }
    console.log(`✅ Seeded ${itemCount} new items (Total items: ${itemDefs.length}).`);

    console.log('🎉 Seed completed successfully for Kings Builders Masters (Phase P2)!');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
