import {
  mysqlTable,
  bigint,
  varchar,
  text,
  mysqlEnum,
  boolean,
  timestamp,
  int,
  decimal,
  json,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';

export * from './realty';
import { relations } from 'drizzle-orm';

// ── 1. TENANTS ─────────────────────────────────────────────────────────────
export const tenants = mysqlTable(
  'tenants',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    status: mysqlEnum('status', ['trial', 'active', 'suspended', 'cancelled']).default('active').notNull(),
    plan: varchar('plan', { length: 50 }).default('enterprise').notNull(),
    gstin: varchar('gstin', { length: 15 }),
    pan: varchar('pan', { length: 10 }),
    stateCode: varchar('state_code', { length: 2 }).default('27'), // 27 = Maharashtra
    address: text('address'),
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 20 }).default('#c5a04e'), // Kings gold
    tagline: varchar('tagline', { length: 255 }).default('Builders & Developers'),
    mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
    branding: text('branding'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('slug_idx').on(table.slug),
    uniqueIndex('uuid_idx').on(table.uuid),
  ]
);

// ── 1B. COMPANIES (Legal Entities / Subsidiaries under Tenant) ───────────────
export const companies = mysqlTable(
  'companies',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    legalName: varchar('legal_name', { length: 255 }),
    cin: varchar('cin', { length: 25 }),
    gstin: varchar('gstin', { length: 15 }),
    pan: varchar('pan', { length: 10 }),
    address: text('address'),
    city: varchar('city', { length: 100 }).default('Mumbai'),
    stateCode: varchar('state_code', { length: 2 }).default('27'),
    pincode: varchar('pincode', { length: 10 }),
    email: varchar('email', { length: 150 }),
    phone: varchar('phone', { length: 20 }),
    bankName: varchar('bank_name', { length: 100 }),
    bankAccountNo: varchar('bank_account_no', { length: 50 }),
    bankIfsc: varchar('bank_ifsc', { length: 20 }),
    bankBranch: varchar('bank_branch', { length: 100 }),
    logoUrl: text('logo_url'),
    status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('company_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_company_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 2. ROLES ───────────────────────────────────────────────────────────────
export const roles = mysqlTable(
  'roles',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('role_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_role_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 3. PERMISSIONS ─────────────────────────────────────────────────────────
export const permissions = mysqlTable(
  'permissions',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    module: varchar('module', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: text('description'),
  },
  (table) => [
    uniqueIndex('perm_code_idx').on(table.code),
  ]
);

// ── 4. ROLE PERMISSIONS ───────────────────────────────────────────────────
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    permissionId: bigint('permission_id', { mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ]
);

// ── 5. USERS ───────────────────────────────────────────────────────────────
export const users = mysqlTable(
  'users',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }),
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    status: mysqlEnum('status', ['active', 'inactive', 'locked']).default('active').notNull(),
    avatarUrl: text('avatar_url'),
    totpSecret: varchar('totp_secret', { length: 128 }),
    totpEnabled: boolean('totp_enabled').default(false).notNull(),
    backupCodes: text('backup_codes'),
    failedLoginAttempts: int('failed_login_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until'),
    lastLoginAt: timestamp('last_login_at'),
    profileCompleted: boolean('profile_completed').default(false).notNull(),
    profileCompletedAt: timestamp('profile_completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('user_uuid_idx').on(table.uuid),
    uniqueIndex('tenant_username_idx').on(table.tenantId, table.username),
    uniqueIndex('tenant_email_idx').on(table.tenantId, table.email),
    index('user_tenant_idx').on(table.tenantId),
  ]
);

// ── 6. USER SITES ──────────────────────────────────────────────────────────
export const userSites = mysqlTable(
  'user_sites',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.siteId] }),
  ]
);

// ── 7. REFRESH TOKENS ──────────────────────────────────────────────────────
export const refreshTokens = mysqlTable(
  'refresh_tokens',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('refresh_user_idx').on(table.userId),
  ]
);

// ── 8. AUDIT LOGS ──────────────────────────────────────────────────────────
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }),
    userId: bigint('user_id', { mode: 'number' }),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    diffJson: json('diff_json'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_tenant_idx').on(table.tenantId),
    index('audit_user_idx').on(table.userId),
  ]
);

// ═══════════════════════════════════════════════════════════════════════════
// MASTERS TABLES (PHASE P2)
// ═══════════════════════════════════════════════════════════════════════════

// ── 9. CATEGORIES (Item Categories Tree) ───────────────────────────────────
export const categories = mysqlTable(
  'categories',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    parentId: bigint('parent_id', { mode: 'number' }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('cat_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_cat_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 10. UNITS (Units of Measure) ───────────────────────────────────────────
export const units = mysqlTable(
  'units',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 50 }).notNull(), // e.g. Bags, Metric Ton, Pieces
    code: varchar('code', { length: 20 }).notNull(), // e.g. BAG, MT, PCS, SQFT
    symbol: varchar('symbol', { length: 10 }), // e.g. bag, mt, pcs
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('unit_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_unit_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 11. ITEMS (Materials & Goods Master) ───────────────────────────────────
export const items = mysqlTable(
  'items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    categoryId: bigint('category_id', { mode: 'number' }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    hsnCode: varchar('hsn_code', { length: 20 }),
    gstRate: varchar('gst_rate', { length: 10 }).default('18').notNull(), // 0, 5, 12, 18, 28, Exempt
    defaultRate: decimal('default_rate', { precision: 14, scale: 4 }).default('0.0000').notNull(),
    reorderLevel: decimal('reorder_level', { precision: 14, scale: 3 }).default('0.000'),
    brand: varchar('brand', { length: 100 }),
    status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('item_tenant_idx').on(table.tenantId),
    index('item_category_idx').on(table.categoryId),
    uniqueIndex('tenant_item_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 12. SITES (Construction Projects / Locations) ─────────────────────────
export const sites = mysqlTable(
  'sites',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    companyId: bigint('company_id', { mode: 'number' }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    clientName: varchar('client_name', { length: 255 }),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).default('Mumbai'),
    stateCode: varchar('state_code', { length: 2 }).default('27'),
    pincode: varchar('pincode', { length: 10 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    geofenceRadius: int('geofence_radius').default(200).notNull(),
    status: mysqlEnum('status', ['planning', 'active', 'inactive', 'on_hold', 'completed']).default('active').notNull(),
    startDate: timestamp('start_date'),
    targetDate: timestamp('target_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('site_tenant_idx').on(table.tenantId),
    index('site_company_idx').on(table.companyId),
    uniqueIndex('tenant_site_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 13. WAREHOUSES (Stores / Locations) ────────────────────────────────────
export const warehouses = mysqlTable(
  'warehouses',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }), // optional: linked to a site
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    address: text('address'),
    isCentral: boolean('is_central').default(false).notNull(),
    status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('wh_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_wh_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 14. VENDORS (Suppliers) ────────────────────────────────────────────────
export const vendors = mysqlTable(
  'vendors',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 150 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    gstin: varchar('gstin', { length: 15 }),
    pan: varchar('pan', { length: 10 }),
    stateCode: varchar('state_code', { length: 2 }).default('27').notNull(),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    bankName: varchar('bank_name', { length: 150 }),
    bankAccountNo: varchar('bank_account_no', { length: 50 }),
    bankIfsc: varchar('bank_ifsc', { length: 20 }),
    paymentTerms: varchar('payment_terms', { length: 100 }).default('30 Days Credit'),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
    status: mysqlEnum('status', ['active', 'inactive', 'blacklisted']).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('vendor_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_vendor_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 15. CONTRACTORS ────────────────────────────────────────────────────────
export const contractors = mysqlTable(
  'contractors',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 150 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    trade: varchar('trade', { length: 100 }), // Civil, Electrical, Plumbing, RCC, Painting
    pan: varchar('pan', { length: 10 }),
    address: text('address'),
    status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('cont_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_cont_code_idx').on(table.tenantId, table.code),
  ]
);

// ── 16. DOCUMENT SERIES ────────────────────────────────────────────────────
export const documentSeries = mysqlTable(
  'document_series',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    documentType: varchar('document_type', { length: 20 }).notNull(), // PO, GRN, REQ, ISSUE
    prefix: varchar('prefix', { length: 20 }).notNull(), // e.g. KB/PO
    financialYear: varchar('financial_year', { length: 10 }).notNull(), // e.g. 26-27
    nextNumber: int('next_number').default(1).notNull(),
    padding: int('padding').default(4).notNull(), // 0001
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex('tenant_doc_series_idx').on(table.tenantId, table.documentType, table.financialYear),
  ]
);

// ── RELATIONS ──────────────────────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  sites: many(sites),
  items: many(items),
  vendors: many(vendors),
  warehouses: many(warehouses),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  tenant: one(tenants, {
    fields: [items.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  unit: one(units, {
    fields: [items.unitId],
    references: [units.id],
  }),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sites.tenantId],
    references: [tenants.id],
  }),
  warehouses: many(warehouses),
}));


// ── 17. MATERIAL INDENTS (SITE REQUISITIONS) ──────────────────────────────
export const materialIndents = mysqlTable(
  'material_indents',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    indentNumber: varchar('indent_number', { length: 50 }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    requestedById: bigint('requested_by_id', { mode: 'number' }).notNull(),
    requiredDate: timestamp('required_date'),
    priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium').notNull(),
    status: mysqlEnum('status', ['draft', 'submitted', 'approved', 'rejected', 'cancelled', 'po_created']).default('draft').notNull(),
    purpose: text('purpose'),
    remarks: text('remarks'),
    approvedById: bigint('approved_by_id', { mode: 'number' }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('ind_tenant_idx').on(table.tenantId),
    index('ind_site_idx').on(table.siteId),
    uniqueIndex('tenant_indent_no_idx').on(table.tenantId, table.indentNumber),
  ]
);

export const indentItems = mysqlTable(
  'indent_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    indentId: bigint('indent_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    estimatedRate: decimal('estimated_rate', { precision: 12, scale: 2 }),
    estimatedAmount: decimal('estimated_amount', { precision: 14, scale: 2 }),
    requiredDate: timestamp('required_date'),
    remarks: text('remarks'),
  },
  (table) => [
    index('ind_item_idx').on(table.indentId),
  ]
);

// ── 18. RFQ (REQUEST FOR QUOTATION) ───────────────────────────────────────
export const rfqs = mysqlTable(
  'rfqs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    rfqNumber: varchar('rfq_number', { length: 50 }).notNull(),
    indentId: bigint('indent_id', { mode: 'number' }),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    deadlineDate: timestamp('deadline_date'),
    status: mysqlEnum('status', ['draft', 'sent', 'quotations_received', 'evaluated', 'po_created', 'closed']).default('draft').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('rfq_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_rfq_no_idx').on(table.tenantId, table.rfqNumber),
  ]
);

export const rfqItems = mysqlTable(
  'rfq_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    rfqId: bigint('rfq_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    targetRate: decimal('target_rate', { precision: 12, scale: 2 }),
  },
  (table) => [
    index('rfq_item_idx').on(table.rfqId),
  ]
);

export const rfqQuotations = mysqlTable(
  'rfq_quotations',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    rfqId: bigint('rfq_id', { mode: 'number' }).notNull(),
    vendorId: bigint('vendor_id', { mode: 'number' }).notNull(),
    quotationRef: varchar('quotation_ref', { length: 100 }),
    quotationDate: timestamp('quotation_date'),
    subtotal: decimal('subtotal', { precision: 14, scale: 2 }).default('0.00').notNull(),
    taxAmount: decimal('tax_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    paymentTerms: varchar('payment_terms', { length: 255 }),
    deliveryLeadTimeDays: int('delivery_lead_time_days'),
    isLowest: boolean('is_lowest').default(false).notNull(),
    isAwarded: boolean('is_awarded').default(false).notNull(),
    status: mysqlEnum('status', ['received', 'accepted', 'rejected']).default('received').notNull(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('rfq_quote_idx').on(table.rfqId),
    index('rfq_quote_vendor_idx').on(table.vendorId),
  ]
);

export const rfqQuotationItems = mysqlTable(
  'rfq_quotation_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    quotationId: bigint('quotation_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitRate: decimal('unit_rate', { precision: 12, scale: 2 }).notNull(),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
    taxableAmount: decimal('taxable_amount', { precision: 14, scale: 2 }).notNull(),
    gstRate: varchar('gst_rate', { length: 10 }).notNull(),
    cgstAmount: decimal('cgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    sgstAmount: decimal('sgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    igstAmount: decimal('igst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  },
  (table) => [
    index('quote_item_idx').on(table.quotationId),
  ]
);

// ── 19. PURCHASE ORDERS ────────────────────────────────────────────────────
export const purchaseOrders = mysqlTable(
  'purchase_orders',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    poNumber: varchar('po_number', { length: 50 }).notNull(),
    indentId: bigint('indent_id', { mode: 'number' }),
    rfqId: bigint('rfq_id', { mode: 'number' }),
    quotationId: bigint('quotation_id', { mode: 'number' }),
    vendorId: bigint('vendor_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number' }),
    poDate: timestamp('po_date').defaultNow().notNull(),
    deliveryDate: timestamp('delivery_date'),
    paymentTerms: varchar('payment_terms', { length: 255 }),
    status: mysqlEnum('status', ['draft', 'pending_approval', 'approved', 'issued', 'partially_received', 'completed', 'cancelled']).default('draft').notNull(),
    isInterState: boolean('is_inter_state').default(false).notNull(),
    subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    taxableAmount: decimal('taxable_amount', { precision: 14, scale: 2 }).notNull(),
    cgstAmount: decimal('cgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    sgstAmount: decimal('sgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    igstAmount: decimal('igst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    roundOff: decimal('round_off', { precision: 6, scale: 2 }).default('0.00').notNull(),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
    amountInWords: text('amount_in_words'),
    billingAddress: text('billing_address'),
    shippingAddress: text('shipping_address'),
    termsAndConditions: text('terms_and_conditions'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    createdById: bigint('created_by_id', { mode: 'number' }).notNull(),
    approvedById: bigint('approved_by_id', { mode: 'number' }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('po_tenant_idx').on(table.tenantId),
    index('po_vendor_idx').on(table.vendorId),
    index('po_site_idx').on(table.siteId),
    uniqueIndex('tenant_po_no_idx').on(table.tenantId, table.poNumber),
  ]
);

export const poItems = mysqlTable(
  'po_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    poId: bigint('po_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    unitRate: decimal('unit_rate', { precision: 12, scale: 2 }).notNull(),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
    taxableAmount: decimal('taxable_amount', { precision: 14, scale: 2 }).notNull(),
    gstRate: varchar('gst_rate', { length: 10 }).notNull(),
    cgstAmount: decimal('cgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    sgstAmount: decimal('sgst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    igstAmount: decimal('igst_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
    receivedQuantity: decimal('received_quantity', { precision: 12, scale: 3 }).default('0.000').notNull(),
    remarks: text('remarks'),
  },
  (table) => [
    index('po_item_idx').on(table.poId),
  ]
);


// ── 20. GOODS RECEIPT NOTES (GRN / STORE INWARD) ───────────────────────────
export const goodsReceiptNotes = mysqlTable(
  'goods_receipt_notes',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    grnNumber: varchar('grn_number', { length: 50 }).notNull(),
    poId: bigint('po_id', { mode: 'number' }).notNull(),
    vendorId: bigint('vendor_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number' }).notNull(),
    challanNo: varchar('challan_no', { length: 50 }),
    challanDate: timestamp('challan_date'),
    invoiceNo: varchar('invoice_no', { length: 50 }),
    invoiceDate: timestamp('invoice_date'),
    vehicleNo: varchar('vehicle_no', { length: 50 }),
    receivedDate: timestamp('received_date').defaultNow().notNull(),
    status: mysqlEnum('status', ['draft', 'inspected', 'verified', 'cancelled']).default('verified').notNull(),
    gatePassNo: varchar('gate_pass_no', { length: 50 }),
    inspectionRemarks: text('inspection_remarks'),
    receivedById: bigint('received_by_id', { mode: 'number' }).notNull(),
    verifiedById: bigint('verified_by_id', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('grn_tenant_idx').on(table.tenantId),
    index('grn_po_idx').on(table.poId),
    index('grn_site_idx').on(table.siteId),
    uniqueIndex('tenant_grn_no_idx').on(table.tenantId, table.grnNumber),
  ]
);

export const grnItems = mysqlTable(
  'grn_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    grnId: bigint('grn_id', { mode: 'number' }).notNull(),
    poItemId: bigint('po_item_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    orderedQty: decimal('ordered_qty', { precision: 12, scale: 3 }).notNull(),
    receivedQty: decimal('received_qty', { precision: 12, scale: 3 }).notNull(),
    acceptedQty: decimal('accepted_qty', { precision: 12, scale: 3 }).notNull(),
    rejectedQty: decimal('rejected_qty', { precision: 12, scale: 3 }).default('0.000').notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    unitRate: decimal('unit_rate', { precision: 12, scale: 2 }).notNull(),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }).notNull(),
    rejectionReason: text('rejection_reason'),
    batchNo: varchar('batch_no', { length: 50 }),
  },
  (table) => [
    index('grn_item_idx').on(table.grnId),
  ]
);

// ── 21. STOCK LEDGER (DOUBLE-ENTRY INVENTORY TRANSACTIONS) ───────────────────
export const stockLedger = mysqlTable(
  'stock_ledger',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    movementType: mysqlEnum('movement_type', ['grn_inward', 'site_issue', 'transfer_out', 'transfer_in', 'return_in', 'scrap_out', 'stock_adjust']).notNull(),
    referenceType: varchar('reference_type', { length: 50 }).notNull(),
    referenceId: bigint('reference_id', { mode: 'number' }).notNull(),
    referenceNumber: varchar('reference_number', { length: 50 }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 12, scale: 3 }).notNull(),
    unitRate: decimal('unit_rate', { precision: 12, scale: 2 }).notNull(),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }).notNull(),
    performedById: bigint('performed_by_id', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('ledger_tenant_idx').on(table.tenantId),
    index('ledger_wh_item_idx').on(table.warehouseId, table.itemId),
    index('ledger_ref_idx').on(table.referenceType, table.referenceId),
  ]
);

// ── 22. STOCK BALANCES (FAST SUMMARY CACHE PER WAREHOUSE/SITE) ─────────────
export const stockBalances = mysqlTable(
  'stock_balances',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).default('0.000').notNull(),
    weightedAvgRate: decimal('weighted_avg_rate', { precision: 12, scale: 2 }).default('0.00').notNull(),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }).default('0.00').notNull(),
    lastMovementAt: timestamp('last_movement_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('stock_tenant_idx').on(table.tenantId),
    uniqueIndex('wh_item_unique_idx').on(table.warehouseId, table.itemId),
  ]
);

// ── 23. MATERIAL ISSUES (SITE STORE DISPATCH) ──────────────────────────────
export const materialIssues = mysqlTable(
  'material_issues',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    issueNumber: varchar('issue_number', { length: 50 }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number' }).notNull(),
    contractorId: bigint('contractor_id', { mode: 'number' }),
    issuedToName: varchar('issued_to_name', { length: 100 }).notNull(),
    purpose: text('purpose').notNull(),
    issueDate: timestamp('issue_date').defaultNow().notNull(),
    status: mysqlEnum('status', ['issued', 'cancelled']).default('issued').notNull(),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }).default('0.00').notNull(),
    issuedById: bigint('issued_by_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('issue_tenant_idx').on(table.tenantId),
    index('issue_site_idx').on(table.siteId),
    uniqueIndex('tenant_issue_no_idx').on(table.tenantId, table.issueNumber),
  ]
);

export const materialIssueItems = mysqlTable(
  'material_issue_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    issueId: bigint('issue_id', { mode: 'number' }).notNull(),
    itemId: bigint('item_id', { mode: 'number' }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    unitRate: decimal('unit_rate', { precision: 12, scale: 2 }).notNull(),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }).notNull(),
    remarks: text('remarks'),
  },
  (table) => [
    index('issue_item_idx').on(table.issueId),
  ]
);


// ── 24. WORK ORDERS (SUBCONTRACT AGREEMENTS) ──────────────────────────────
export const workOrders = mysqlTable(
  'work_orders',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    woNumber: varchar('wo_number', { length: 50 }).notNull(),
    contractorId: bigint('contractor_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    contractType: mysqlEnum('contract_type', ['item_rate', 'lump_sum']).default('item_rate').notNull(),
    startDate: timestamp('start_date'),
    completionDate: timestamp('completion_date'),
    contractValue: decimal('contract_value', { precision: 14, scale: 2 }).notNull(),
    retentionPercent: decimal('retention_percent', { precision: 5, scale: 2 }).default('5.00').notNull(),
    tdsPercent: decimal('tds_percent', { precision: 5, scale: 2 }).default('1.00').notNull(),
    status: mysqlEnum('status', ['draft', 'active', 'completed', 'terminated']).default('active').notNull(),
    scopeOfWork: text('scope_of_work'),
    terms: text('terms'),
    createdById: bigint('created_by_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('wo_tenant_idx').on(table.tenantId),
    index('wo_contractor_idx').on(table.contractorId),
    index('wo_site_idx').on(table.siteId),
    uniqueIndex('tenant_wo_no_idx').on(table.tenantId, table.woNumber),
  ]
);

export const woItems = mysqlTable(
  'wo_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    woId: bigint('wo_id', { mode: 'number' }).notNull(),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    description: text('description').notNull(),
    unitCode: varchar('unit_code', { length: 20 }).notNull(),
    estimatedQty: decimal('estimated_qty', { precision: 12, scale: 3 }).notNull(),
    executedQty: decimal('executed_qty', { precision: 12, scale: 3 }).default('0.000').notNull(),
    rate: decimal('rate', { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  },
  (table) => [
    index('wo_item_idx').on(table.woId),
  ]
);

// ── 25. RUNNING ACCOUNT (RA) BILLS ─────────────────────────────────────────
export const raBills = mysqlTable(
  'ra_bills',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    billNumber: varchar('bill_number', { length: 50 }).notNull(),
    raNumber: int('ra_number').notNull(),
    woId: bigint('wo_id', { mode: 'number' }).notNull(),
    contractorId: bigint('contractor_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    billDate: timestamp('bill_date').defaultNow().notNull(),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    grossAmount: decimal('gross_amount', { precision: 14, scale: 2 }).notNull(),
    retentionAmount: decimal('retention_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    tdsAmount: decimal('tds_amount', { precision: 14, scale: 2 }).default('0.00').notNull(),
    materialDeduction: decimal('material_deduction', { precision: 14, scale: 2 }).default('0.00').notNull(),
    otherDeductions: decimal('other_deductions', { precision: 14, scale: 2 }).default('0.00').notNull(),
    netPayable: decimal('net_payable', { precision: 14, scale: 2 }).notNull(),
    amountInWords: text('amount_in_words'),
    status: mysqlEnum('status', ['draft', 'certified', 'approved', 'paid']).default('certified').notNull(),
    certifiedById: bigint('certified_by_id', { mode: 'number' }),
    approvedById: bigint('approved_by_id', { mode: 'number' }),
    remarks: text('remarks'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('ra_tenant_idx').on(table.tenantId),
    index('ra_wo_idx').on(table.woId),
    index('ra_contractor_idx').on(table.contractorId),
    uniqueIndex('tenant_ra_no_idx').on(table.tenantId, table.billNumber),
  ]
);

export const measurementSheets = mysqlTable(
  'measurement_sheets',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    raBillId: bigint('ra_bill_id', { mode: 'number' }).notNull(),
    woItemId: bigint('wo_item_id', { mode: 'number' }).notNull(),
    locationRef: varchar('location_ref', { length: 100 }).notNull(),
    description: text('description'),
    numberOfUnits: decimal('number_of_units', { precision: 10, scale: 2 }).default('1.00').notNull(),
    length: decimal('length', { precision: 10, scale: 3 }),
    breadth: decimal('breadth', { precision: 10, scale: 3 }),
    depth: decimal('depth', { precision: 10, scale: 3 }),
    totalQty: decimal('total_qty', { precision: 12, scale: 3 }).notNull(),
    rate: decimal('rate', { precision: 12, scale: 2 }).notNull(),
    amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  },
  (table) => [
    index('mb_ra_bill_idx').on(table.raBillId),
  ]
);

// ── 34. NOTIFICATIONS ───────────────────────────────────────────────────────
export const notifications = mysqlTable(
  'notifications',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    userId: bigint('user_id', { mode: 'number' }),
    roleCode: varchar('role_code', { length: 50 }),
    type: varchar('type', { length: 50 }).notNull(), // 'PO_APPROVAL', 'PO_SENT', 'GRN_DONE', 'LOW_STOCK', 'RA_BILL_CERTIFIED'
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    data: text('data'),
    channel: varchar('channel', { length: 50 }).default('IN_APP').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notif_tenant_idx').on(table.tenantId),
    index('notif_user_idx').on(table.userId),
    index('notif_tenant_read_idx').on(table.tenantId, table.isRead),
  ]
);

// ── 35. DAILY PROGRESS REPORTS (DPR) ─────────────────────────────────────────
export const dailyProgressReports = mysqlTable(
  'daily_progress_reports',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    reportNumber: varchar('report_number', { length: 64 }).notNull(),
    reportDate: timestamp('report_date').notNull(),
    weather: varchar('weather', { length: 64 }).default('Clear / Sunny').notNull(),
    temperature: varchar('temperature', { length: 32 }).default('32°C'),
    shift: varchar('shift', { length: 32 }).default('Day').notNull(),
    generalProgress: text('general_progress'),
    delaysIssues: text('delays_issues'),
    safetyNotes: text('safety_notes'),
    status: varchar('status', { length: 32 }).default('draft').notNull(), // 'draft', 'submitted', 'approved'
    createdById: bigint('created_by_id', { mode: 'number' }).notNull(),
    approvedById: bigint('approved_by_id', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('dpr_tenant_idx').on(table.tenantId),
    index('dpr_site_date_idx').on(table.siteId, table.reportDate),
    uniqueIndex('dpr_tenant_num_idx').on(table.tenantId, table.reportNumber),
  ]
);

// ── 36. DPR WORK ITEMS ───────────────────────────────────────────────────────
export const dprWorkItems = mysqlTable(
  'dpr_work_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    dprId: bigint('dpr_id', { mode: 'number' }).notNull(),
    activityName: varchar('activity_name', { length: 255 }).notNull(),
    locationRef: varchar('location_ref', { length: 255 }).notNull(),
    uom: varchar('uom', { length: 32 }).default('SQ.M').notNull(),
    plannedQty: decimal('planned_qty', { precision: 12, scale: 3 }).default('0.000').notNull(),
    completedQty: decimal('completed_qty', { precision: 12, scale: 3 }).default('0.000').notNull(),
    remarks: text('remarks'),
  },
  (table) => [
    index('dpr_work_item_dpr_idx').on(table.dprId),
  ]
);

// ── 37. DPR PHOTOS ──────────────────────────────────────────────────────────
export const dprPhotos = mysqlTable(
  'dpr_photos',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    dprId: bigint('dpr_id', { mode: 'number' }).notNull(),
    photoUrl: text('photo_url').notNull(),
    caption: varchar('caption', { length: 255 }),
    activityTag: varchar('activity_tag', { length: 128 }),
    takenAt: timestamp('taken_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('dpr_photo_dpr_idx').on(table.dprId),
  ]
);

// ── 38. DPR EQUIPMENTS ──────────────────────────────────────────────────────
export const dprEquipments = mysqlTable(
  'dpr_equipments',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    dprId: bigint('dpr_id', { mode: 'number' }).notNull(),
    equipmentName: varchar('equipment_name', { length: 128 }).notNull(),
    runningHours: decimal('running_hours', { precision: 6, scale: 2 }).default('0.00').notNull(),
    idleHours: decimal('idle_hours', { precision: 6, scale: 2 }).default('0.00').notNull(),
    breakdownHours: decimal('breakdown_hours', { precision: 6, scale: 2 }).default('0.00').notNull(),
    status: varchar('status', { length: 32 }).default('working').notNull(), // 'working', 'idle', 'breakdown'
    remarks: varchar('remarks', { length: 255 }),
  },
  (table) => [
    index('dpr_equip_dpr_idx').on(table.dprId),
  ]
);

// ── 39. LABOUR ATTENDANCE (COUNT-BASED) ──────────────────────────────────────
export const labourAttendance = mysqlTable(
  'labour_attendance',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    contractorId: bigint('contractor_id', { mode: 'number' }),
    attendanceDate: timestamp('attendance_date').notNull(),
    shift: varchar('shift', { length: 32 }).default('Day').notNull(),
    tradeCategory: varchar('trade_category', { length: 64 }).default('General Civil').notNull(),
    skilledMale: int('skilled_male').default(0).notNull(),
    skilledFemale: int('skilled_female').default(0).notNull(),
    semiSkilledMale: int('semi_skilled_male').default(0).notNull(),
    semiSkilledFemale: int('semi_skilled_female').default(0).notNull(),
    unskilledMale: int('unskilled_male').default(0).notNull(),
    unskilledFemale: int('unskilled_female').default(0).notNull(),
    supervisors: int('supervisors').default(0).notNull(),
    totalWorkers: int('total_workers').default(0).notNull(),
    overtimeHours: decimal('overtime_hours', { precision: 6, scale: 2 }).default('0.00').notNull(),
    workLocation: varchar('work_location', { length: 255 }),
    remarks: text('remarks'),
    recordedById: bigint('recorded_by_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('labour_tenant_site_date_idx').on(table.tenantId, table.siteId, table.attendanceDate),
    index('labour_contractor_idx').on(table.contractorId),
  ]
);

// ── 40. BOQ ITEMS (BILL OF QUANTITIES BASELINE FOR CONSUMPTION TRACKING) ────
export const boqItems = mysqlTable(
  'boq_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    itemCode: varchar('item_code', { length: 64 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    workPackage: varchar('work_package', { length: 128 }).notNull(),
    budgetedQty: decimal('budgeted_qty', { precision: 12, scale: 3 }).notNull(),
    uom: varchar('uom', { length: 32 }).notNull(),
    budgetedRate: decimal('budgeted_rate', { precision: 12, scale: 2 }).notNull(),
    budgetedAmount: decimal('budgeted_amount', { precision: 14, scale: 2 }).notNull(),
    tolerancePercent: decimal('tolerance_percent', { precision: 5, scale: 2 }).default('5.00').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('boq_tenant_site_idx').on(table.tenantId, table.siteId),
    index('boq_item_code_idx').on(table.itemCode),
    uniqueIndex('boq_tenant_site_item_pkg_idx').on(table.tenantId, table.siteId, table.itemCode, table.workPackage),
  ]
);

// ── 41. STAFF ATTENDANCE LOGS (GEOFENCED + WATERMARKED PHOTO) ───────────────
export const staffAttendanceLogs = mysqlTable(
  'staff_attendance_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    punchType: mysqlEnum('punch_type', ['check_in', 'check_out']).default('check_in').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    distanceMeters: decimal('distance_meters', { precision: 10, scale: 2 }).notNull(),
    geofenceRadiusMeters: int('geofence_radius_meters').notNull(),
    geofenceVerified: boolean('geofence_verified').default(true).notNull(),
    photoUrl: varchar('photo_url', { length: 500 }).notNull(),
    remarks: varchar('remarks', { length: 500 }),
    punchedAt: timestamp('punched_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('staff_att_tenant_user_idx').on(table.tenantId, table.userId, table.punchedAt),
    index('staff_att_tenant_site_idx').on(table.tenantId, table.siteId, table.punchedAt),
  ]
);

// ── REALTY TABLES (MODULES 1–5 + TENANT_MODULES) ──────────────────────────
export * from './realty';



