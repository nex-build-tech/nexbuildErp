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

// ════════════════════════════════════════════════════════════════════════════
// REALTY SALES & CRM MODULE — Database Schema
// All tables use prefix re_
// Standard columns: id, uuid, tenant_id, created_by, created_at, updated_at, deleted_at
// ════════════════════════════════════════════════════════════════════════════

// ── TENANT MODULES ───────────────────────────────────────────────────────────
export const tenantModules = mysqlTable(
  'tenant_modules',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    moduleCode: varchar('module_code', { length: 50 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('tm_tenant_idx').on(table.tenantId),
    uniqueIndex('tm_tenant_module_idx').on(table.tenantId, table.moduleCode),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT SETUP TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_project_settings ───────────────────────────────────────────────────────
export const reProjectSettings = mysqlTable(
  're_project_settings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    siteId: bigint('site_id', { mode: 'number' }).notNull().unique(),
    reraNo: varchar('rera_no', { length: 50 }),
    launchDate: timestamp('launch_date'),
    possessionDate: timestamp('possession_date'),
    stampDutyPct: decimal('stamp_duty_pct', { precision: 7, scale: 4 }).default('6.0000'),
    metroCessPct: decimal('metro_cess_pct', { precision: 7, scale: 4 }).default('0.0000'),
    registrationPct: decimal('registration_pct', { precision: 7, scale: 4 }).default('1.0000'),
    registrationCap: decimal('registration_cap', { precision: 15, scale: 2 }).default('30000.00'),
    interestRatePa: decimal('interest_rate_pa', { precision: 7, scale: 4 }),
    interestGraceDays: int('interest_grace_days').default(10),
    gstRateUnderConstruction: decimal('gst_rate_under_construction', { precision: 7, scale: 4 }).default('5.0000'),
    holdHoursDefault: int('hold_hours_default').default(48),
    cpTagValidityDays: int('cp_tag_validity_days').default(60),
    letterheadHtml: text('letterhead_html'),
    bankDetailsText: text('bank_details_text'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex('re_project_settings_site_idx').on(table.siteId),
  ]
);

// ── re_phases ─────────────────────────────────────────────────────────────────
export const rePhases = mysqlTable(
  're_phases',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_phases_tenant_idx').on(table.tenantId),
  ]
);

// ── re_wings ──────────────────────────────────────────────────────────────────
export const reWings = mysqlTable(
  're_wings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    phaseId: bigint('phase_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    totalFloors: int('total_floors').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_wings_tenant_idx').on(table.tenantId),
  ]
);

// ── re_floors ─────────────────────────────────────────────────────────────────
export const reFloors = mysqlTable(
  're_floors',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    wingId: bigint('wing_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    levelNo: int('level_no').notNull().default(0), // Ground = 0
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_floors_tenant_idx').on(table.tenantId),
  ]
);

// ── re_unit_types ─────────────────────────────────────────────────────────────
export const reUnitTypes = mysqlTable(
  're_unit_types',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    category: mysqlEnum('category', ['RES', 'COM']).notNull(),
    defaultCarpetArea: decimal('default_carpet_area', { precision: 10, scale: 2 }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_unit_types_tenant_idx').on(table.tenantId),
    uniqueIndex('re_unit_types_tenant_code_idx').on(table.tenantId, table.code),
  ]
);

// ── re_units ──────────────────────────────────────────────────────────────────
export const reUnits = mysqlTable(
  're_units',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    wingId: bigint('wing_id', { mode: 'number' }).notNull(),
    floorId: bigint('floor_id', { mode: 'number' }).notNull(),
    unitNo: varchar('unit_no', { length: 20 }).notNull(),
    unitTypeId: bigint('unit_type_id', { mode: 'number' }).notNull(),
    carpetArea: decimal('carpet_area', { precision: 10, scale: 2 }),
    balconyArea: decimal('balcony_area', { precision: 10, scale: 2 }),
    terraceArea: decimal('terrace_area', { precision: 10, scale: 2 }),
    saleableArea: decimal('saleable_area', { precision: 10, scale: 2 }),
    facing: varchar('facing', { length: 30 }),
    baseRate: decimal('base_rate', { precision: 15, scale: 2 }),
    floorRiseRate: decimal('floor_rise_rate', { precision: 15, scale: 2 }),
    plcAmount: decimal('plc_amount', { precision: 15, scale: 2 }),
    status: mysqlEnum('status', [
      'available', 'hold', 'blocked', 'booked', 'agreement',
      'registered', 'possession', 'cancelled', 'not_for_sale',
    ]).default('available').notNull(),
    holdBy: bigint('hold_by', { mode: 'number' }),
    holdTill: timestamp('hold_till'),
    isInvestor: boolean('is_investor').default(false).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_units_tenant_idx').on(table.tenantId),
    uniqueIndex('re_units_tenant_wing_unitno_idx').on(table.tenantId, table.wingId, table.unitNo),
  ]
);

// ── re_parking_slots ──────────────────────────────────────────────────────────
export const reParkingSlots = mysqlTable(
  're_parking_slots',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    wingId: bigint('wing_id', { mode: 'number' }),
    type: mysqlEnum('type', ['open', 'stilt', 'podium', 'basement']).notNull(),
    slotNo: varchar('slot_no', { length: 20 }).notNull(),
    price: decimal('price', { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum('status', ['available', 'hold', 'booked']).default('available').notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_parking_slots_tenant_idx').on(table.tenantId),
  ]
);

// ── re_charge_heads ───────────────────────────────────────────────────────────
export const reChargeHeads = mysqlTable(
  're_charge_heads',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    calcType: mysqlEnum('calc_type', ['fixed', 'per_sqft', 'pct_of_agreement', 'per_month']).notNull(),
    defaultValue: decimal('default_value', { precision: 15, scale: 2 }),
    gstApplicable: boolean('gst_applicable').default(false).notNull(),
    gstRate: decimal('gst_rate', { precision: 7, scale: 4 }),
    sequence: int('sequence').default(0).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_charge_heads_tenant_idx').on(table.tenantId),
    uniqueIndex('re_charge_heads_tenant_code_idx').on(table.tenantId, table.code),
  ]
);

// ── re_pay_stages ─────────────────────────────────────────────────────────────
export const rePayStages = mysqlTable(
  're_pay_stages',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    code: varchar('code', { length: 5 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    defaultPct: decimal('default_pct', { precision: 7, scale: 4 }),
    sequence: int('sequence').default(0).notNull(),
    isConstructionLinked: boolean('is_construction_linked').default(false).notNull(),
    status: mysqlEnum('status', ['pending', 'completed']).default('pending').notNull(),
    completedOn: timestamp('completed_on'),
    certificateFile: text('certificate_file'),
    linkedBoqItemId: bigint('linked_boq_item_id', { mode: 'number' }),
    linkedDprId: bigint('linked_dpr_id', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_pay_stages_tenant_idx').on(table.tenantId),
    uniqueIndex('re_pay_stages_tenant_site_code_idx').on(table.tenantId, table.siteId, table.code),
  ]
);

// ── re_schemes ────────────────────────────────────────────────────────────────
export const reSchemes = mysqlTable(
  're_schemes',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    gstMode: mysqlEnum('gst_mode', ['with', 'without']).notNull(),
    unitTypeIds: json('unit_type_ids'),
    floorFrom: int('floor_from'),
    floorTo: int('floor_to'),
    stampByBuilder: boolean('stamp_by_builder').default(false).notNull(),
    registrationByBuilder: boolean('registration_by_builder').default(false).notNull(),
    maxDiscountPct: decimal('max_discount_pct', { precision: 7, scale: 4 }),
    active: boolean('active').default(true).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_schemes_tenant_idx').on(table.tenantId),
  ]
);

// ── re_scheme_stages (child / join table — no standard columns) ───────────────
export const reSchemeStages = mysqlTable(
  're_scheme_stages',
  {
    schemeId: bigint('scheme_id', { mode: 'number' }).notNull(),
    payStageId: bigint('pay_stage_id', { mode: 'number' }).notNull(),
    pct: decimal('pct', { precision: 7, scale: 4 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.schemeId, table.payStageId] }),
    index('re_scheme_stages_scheme_idx').on(table.schemeId),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// CRM TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_lead_sources ───────────────────────────────────────────────────────────
export const reLeadSources = mysqlTable(
  're_lead_sources',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    active: boolean('active').default(true).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_lead_sources_tenant_idx').on(table.tenantId),
    uniqueIndex('re_lead_sources_tenant_code_idx').on(table.tenantId, table.code),
  ]
);

// ── re_campaigns ──────────────────────────────────────────────────────────────
export const reCampaigns = mysqlTable(
  're_campaigns',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    sourceId: bigint('source_id', { mode: 'number' }),
    siteId: bigint('site_id', { mode: 'number' }),
    budget: decimal('budget', { precision: 15, scale: 2 }),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_campaigns_tenant_idx').on(table.tenantId),
  ]
);

// ── re_leads ──────────────────────────────────────────────────────────────────
export const reLeads = mysqlTable(
  're_leads',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    mobile: varchar('mobile', { length: 20 }).notNull(),
    altMobile: varchar('alt_mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    city: varchar('city', { length: 100 }),
    budgetMin: decimal('budget_min', { precision: 15, scale: 2 }),
    budgetMax: decimal('budget_max', { precision: 15, scale: 2 }),
    configPref: varchar('config_pref', { length: 100 }),
    purpose: varchar('purpose', { length: 100 }),
    sourceId: bigint('source_id', { mode: 'number' }),
    campaignId: bigint('campaign_id', { mode: 'number' }),
    cpId: bigint('cp_id', { mode: 'number' }),
    siteId: bigint('site_id', { mode: 'number' }),
    stage: varchar('stage', { length: 50 }).default('new').notNull(),
    subStage: varchar('sub_stage', { length: 50 }),
    lostReason: text('lost_reason'),
    score: int('score').default(0).notNull(),
    temperature: mysqlEnum('temperature', ['hot', 'warm', 'cold']).default('warm').notNull(),
    presalesOwnerId: bigint('presales_owner_id', { mode: 'number' }),
    salesOwnerId: bigint('sales_owner_id', { mode: 'number' }),
    nextFollowupAt: timestamp('next_followup_at'),
    firstResponseAt: timestamp('first_response_at'),
    slaBreached: boolean('sla_breached').default(false).notNull(),
    duplicateOfId: bigint('duplicate_of_id', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_leads_tenant_idx').on(table.tenantId),
    index('re_leads_tenant_mobile_site_idx').on(table.tenantId, table.mobile, table.siteId),
  ]
);

// ── re_lead_activities (id+created_at only) ───────────────────────────────────
export const reLeadActivities = mysqlTable(
  're_lead_activities',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull(),
    type: mysqlEnum('type', ['call', 'whatsapp', 'sms', 'email', 'note', 'stage_change', 'assign']).notNull(),
    outcome: varchar('outcome', { length: 100 }),
    durationSec: int('duration_sec'),
    notes: text('notes'),
    activityAt: timestamp('activity_at').defaultNow().notNull(),
    userId: bigint('user_id', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_lead_activities_tenant_idx').on(table.tenantId),
    index('re_lead_activities_lead_idx').on(table.leadId),
  ]
);

// ── re_followups ──────────────────────────────────────────────────────────────
export const reFollowups = mysqlTable(
  're_followups',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull(),
    dueAt: timestamp('due_at').notNull(),
    type: varchar('type', { length: 50 }),
    assignedTo: bigint('assigned_to', { mode: 'number' }),
    status: mysqlEnum('status', ['pending', 'done', 'cancelled']).default('pending').notNull(),
    doneAt: timestamp('done_at'),
    outcome: text('outcome'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_followups_tenant_idx').on(table.tenantId),
  ]
);

// ── re_site_visits ────────────────────────────────────────────────────────────
export const reSiteVisits = mysqlTable(
  're_site_visits',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    status: mysqlEnum('status', ['scheduled', 'confirmed', 'done', 'no_show', 'rescheduled']).default('scheduled').notNull(),
    attendedBy: bigint('attended_by', { mode: 'number' }),
    feedback: text('feedback'),
    isRevisit: boolean('is_revisit').default(false).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_site_visits_tenant_idx').on(table.tenantId),
  ]
);

// ── re_routing_rules ──────────────────────────────────────────────────────────
export const reRoutingRules = mysqlTable(
  're_routing_rules',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    conditions: json('conditions'),
    userPool: json('user_pool'),
    strategy: mysqlEnum('strategy', ['round_robin', 'load']).notNull(),
    slaMinutes: int('sla_minutes').notNull(),
    active: boolean('active').default(true).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_routing_rules_tenant_idx').on(table.tenantId),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// NEGOTIATION & BOOKING TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_cost_sheets ────────────────────────────────────────────────────────────
export const reCostSheets = mysqlTable(
  're_cost_sheets',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }),
    unitId: bigint('unit_id', { mode: 'number' }),
    schemeId: bigint('scheme_id', { mode: 'number' }),
    rate: decimal('rate', { precision: 15, scale: 2 }),
    discountPct: decimal('discount_pct', { precision: 7, scale: 4 }),
    lines: json('lines'),
    totals: json('totals'),
    validTill: timestamp('valid_till'),
    status: mysqlEnum('status', ['draft', 'pending_approval', 'approved', 'rejected', 'shared']).default('draft').notNull(),
    approvedBy: bigint('approved_by', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_cost_sheets_tenant_idx').on(table.tenantId),
  ]
);

// ── re_approvals ──────────────────────────────────────────────────────────────
export const reApprovals = mysqlTable(
  're_approvals',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: bigint('entity_id', { mode: 'number' }).notNull(),
    level: int('level').notNull(),
    approverRole: varchar('approver_role', { length: 50 }).notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
    remarks: text('remarks'),
    actedBy: bigint('acted_by', { mode: 'number' }),
    actedAt: timestamp('acted_at'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_approvals_tenant_idx').on(table.tenantId),
  ]
);

// ── re_bookings ───────────────────────────────────────────────────────────────
export const reBookings = mysqlTable(
  're_bookings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingNo: varchar('booking_no', { length: 50 }).notNull(),
    unitId: bigint('unit_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }),
    cpId: bigint('cp_id', { mode: 'number' }),
    schemeId: bigint('scheme_id', { mode: 'number' }),
    bookingDate: timestamp('booking_date').notNull(),
    areaBasis: mysqlEnum('area_basis', ['carpet', 'saleable', 'builtup']).default('carpet').notNull(),
    soldRate: decimal('sold_rate', { precision: 15, scale: 2 }),
    basicCost: decimal('basic_cost', { precision: 15, scale: 2 }),
    floorRiseAmt: decimal('floor_rise_amt', { precision: 15, scale: 2 }),
    plcAmt: decimal('plc_amt', { precision: 15, scale: 2 }),
    discountPct: decimal('discount_pct', { precision: 7, scale: 4 }),
    discountAmt: decimal('discount_amt', { precision: 15, scale: 2 }),
    netCost: decimal('net_cost', { precision: 15, scale: 2 }),
    agreementValue: decimal('agreement_value', { precision: 15, scale: 2 }),
    gstPct: decimal('gst_pct', { precision: 7, scale: 4 }),
    gstAmt: decimal('gst_amt', { precision: 15, scale: 2 }),
    stampDuty: decimal('stamp_duty', { precision: 15, scale: 2 }),
    registrationFee: decimal('registration_fee', { precision: 15, scale: 2 }),
    stampByBuilder: boolean('stamp_by_builder').default(false).notNull(),
    regByBuilder: boolean('reg_by_builder').default(false).notNull(),
    otherChargesTotal: decimal('other_charges_total', { precision: 15, scale: 2 }),
    grandTotalInclGst: decimal('grand_total_incl_gst', { precision: 15, scale: 2 }),
    grandTotalExclGst: decimal('grand_total_excl_gst', { precision: 15, scale: 2 }),
    status: mysqlEnum('status', [
      'draft', 'pending_approval', 'booked', 'agreement_done',
      'registered', 'possession', 'cancelled', 'transferred',
    ]).default('draft').notNull(),
    agreementDate: timestamp('agreement_date'),
    registrationDate: timestamp('registration_date'),
    registrationNo: varchar('registration_no', { length: 50 }),
    loanBank: varchar('loan_bank', { length: 150 }),
    loanAmount: decimal('loan_amount', { precision: 15, scale: 2 }),
    possessionDate: timestamp('possession_date'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_bookings_tenant_idx').on(table.tenantId),
    uniqueIndex('re_bookings_tenant_bookingno_idx').on(table.tenantId, table.bookingNo),
  ]
);

// ── re_booking_applicants (no deleted_at) ─────────────────────────────────────
export const reBookingApplicants = mysqlTable(
  're_booking_applicants',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    type: mysqlEnum('type', ['primary', 'co1', 'co2', 'co3']).notNull(),
    title: varchar('title', { length: 10 }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    dob: timestamp('dob'),
    gender: mysqlEnum('gender', ['male', 'female', 'other']),
    occupation: varchar('occupation', { length: 100 }),
    pan: varchar('pan', { length: 10 }),
    aadhaarEnc: varchar('aadhaar_enc', { length: 500 }),
    mobile: varchar('mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    permanentAddress: text('permanent_address'),
    correspondenceAddress: text('correspondence_address'),
    sameAddress: boolean('same_address').default(false).notNull(),
    city: varchar('city', { length: 100 }),
    stateCode: varchar('state_code', { length: 2 }),
    pincode: varchar('pincode', { length: 10 }),
    relation: varchar('relation', { length: 50 }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('re_booking_applicants_tenant_idx').on(table.tenantId),
    index('re_booking_applicants_booking_idx').on(table.bookingId),
  ]
);

// ── re_booking_documents (no uuid/deleted_at) ─────────────────────────────────
export const reBookingDocuments = mysqlTable(
  're_booking_documents',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    type: mysqlEnum('type', ['pan', 'aadhaar', 'photo', 'agreement', 'registration', 'allotment', 'other']).notNull(),
    fileUrl: text('file_url').notNull(),
    isPrivate: boolean('is_private').default(true).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('re_booking_documents_tenant_idx').on(table.tenantId),
    index('re_booking_documents_booking_idx').on(table.bookingId),
  ]
);

// ── re_booking_charges (id PK only) ───────────────────────────────────────────
export const reBookingCharges = mysqlTable(
  're_booking_charges',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    chargeHeadId: bigint('charge_head_id', { mode: 'number' }).notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    gstAmt: decimal('gst_amt', { precision: 15, scale: 2 }).default('0.00').notNull(),
  },
  (table) => [
    index('re_booking_charges_booking_idx').on(table.bookingId),
  ]
);

// ── re_booking_parkings (id PK only) ──────────────────────────────────────────
export const reBookingParkings = mysqlTable(
  're_booking_parkings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    slotId: bigint('slot_id', { mode: 'number' }).notNull(),
    price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [
    index('re_booking_parkings_booking_idx').on(table.bookingId),
  ]
);

// ── re_payment_schedule (no uuid/deleted_at) ──────────────────────────────────
export const rePaymentSchedule = mysqlTable(
  're_payment_schedule',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    payStageId: bigint('pay_stage_id', { mode: 'number' }).notNull(),
    pct: decimal('pct', { precision: 7, scale: 4 }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    gstAmt: decimal('gst_amt', { precision: 15, scale: 2 }).default('0.00').notNull(),
    dueDate: timestamp('due_date'),
    demandId: bigint('demand_id', { mode: 'number' }),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
    status: mysqlEnum('status', ['not_due', 'demanded', 'partly_paid', 'paid', 'overdue']).default('not_due').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('re_payment_schedule_tenant_idx').on(table.tenantId),
    index('re_payment_schedule_booking_idx').on(table.bookingId),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_demands ────────────────────────────────────────────────────────────────
export const reDemands = mysqlTable(
  're_demands',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    demandNo: varchar('demand_no', { length: 50 }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    payStageId: bigint('pay_stage_id', { mode: 'number' }),
    demandDate: timestamp('demand_date').notNull(),
    dueDate: timestamp('due_date'),
    principal: decimal('principal', { precision: 15, scale: 2 }).notNull(),
    gst: decimal('gst', { precision: 15, scale: 2 }).default('0.00').notNull(),
    interestCarried: decimal('interest_carried', { precision: 15, scale: 2 }).default('0.00').notNull(),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),
    pdfUrl: text('pdf_url'),
    sentVia: varchar('sent_via', { length: 50 }),
    sentAt: timestamp('sent_at'),
    status: mysqlEnum('status', ['draft', 'sent', 'paid', 'cancelled']).default('draft').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_demands_tenant_idx').on(table.tenantId),
    uniqueIndex('re_demands_tenant_demandno_idx').on(table.tenantId, table.demandNo),
  ]
);

// ── re_receipts ───────────────────────────────────────────────────────────────
export const reReceipts = mysqlTable(
  're_receipts',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    receiptNo: varchar('receipt_no', { length: 50 }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    receiptDate: timestamp('receipt_date').notNull(),
    against: varchar('against', { length: 50 }),
    payStageId: bigint('pay_stage_id', { mode: 'number' }),
    mode: mysqlEnum('mode', ['cash', 'cheque', 'dd', 'neft', 'rtgs', 'imps', 'upi', 'swift', 'online']).notNull(),
    instrumentNo: varchar('instrument_no', { length: 100 }),
    instrumentDate: timestamp('instrument_date'),
    drawnOnBank: varchar('drawn_on_bank', { length: 150 }),
    depositBankId: bigint('deposit_bank_id', { mode: 'number' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    tdsApplicable: boolean('tds_applicable').default(false).notNull(),
    tdsPct: decimal('tds_pct', { precision: 7, scale: 4 }),
    tdsAmount: decimal('tds_amount', { precision: 15, scale: 2 }),
    gstComponent: decimal('gst_component', { precision: 15, scale: 2 }),
    status: mysqlEnum('status', ['draft', 'pending_approval', 'passed', 'hold', 'bounced', 'cancelled']).default('draft').notNull(),
    realisedOn: timestamp('realised_on'),
    bounceCharges: decimal('bounce_charges', { precision: 15, scale: 2 }),
    narration: text('narration'),
    attachmentUrl: text('attachment_url'),
    tallySynced: boolean('tally_synced').default(false).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_receipts_tenant_idx').on(table.tenantId),
    uniqueIndex('re_receipts_tenant_receiptno_idx').on(table.tenantId, table.receiptNo),
  ]
);

// ── re_receipt_allocations (id PK only) ───────────────────────────────────────
export const reReceiptAllocations = mysqlTable(
  're_receipt_allocations',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    receiptId: bigint('receipt_id', { mode: 'number' }).notNull(),
    scheduleId: bigint('schedule_id', { mode: 'number' }),
    chargeType: varchar('charge_type', { length: 50 }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [
    index('re_receipt_allocations_receipt_idx').on(table.receiptId),
  ]
);

// ── re_ledger_entries (id+created_at only) ────────────────────────────────────
export const reLedgerEntries = mysqlTable(
  're_ledger_entries',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    entryDate: timestamp('entry_date').notNull(),
    docType: varchar('doc_type', { length: 50 }).notNull(),
    docId: bigint('doc_id', { mode: 'number' }),
    debit: decimal('debit', { precision: 15, scale: 2 }).default('0.00').notNull(),
    credit: decimal('credit', { precision: 15, scale: 2 }).default('0.00').notNull(),
    narration: text('narration'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_ledger_entries_tenant_idx').on(table.tenantId),
    index('re_ledger_entries_booking_idx').on(table.bookingId),
  ]
);

// ── re_interest_entries (id+created_at only) ──────────────────────────────────
export const reInterestEntries = mysqlTable(
  're_interest_entries',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    scheduleId: bigint('schedule_id', { mode: 'number' }),
    fromDate: timestamp('from_date').notNull(),
    toDate: timestamp('to_date').notNull(),
    days: int('days').notNull(),
    rate: decimal('rate', { precision: 7, scale: 4 }).notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    waivedAmount: decimal('waived_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
    waiverApprovalId: bigint('waiver_approval_id', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_interest_entries_tenant_idx').on(table.tenantId),
    index('re_interest_entries_booking_idx').on(table.bookingId),
  ]
);

// ── re_credit_notes ───────────────────────────────────────────────────────────
export const reCreditNotes = mysqlTable(
  're_credit_notes',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    creditNo: varchar('credit_no', { length: 50 }).notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    reason: text('reason'),
    status: mysqlEnum('status', ['draft', 'approved', 'cancelled']).default('draft').notNull(),
    approvedBy: bigint('approved_by', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_credit_notes_tenant_idx').on(table.tenantId),
  ]
);

// ── re_cancellations ──────────────────────────────────────────────────────────
export const reCancellations = mysqlTable(
  're_cancellations',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    cancellationNo: varchar('cancellation_no', { length: 50 }).notNull(),
    receivedTillDate: timestamp('received_till_date'),
    cancellationCharges: decimal('cancellation_charges', { precision: 15, scale: 2 }),
    tds: decimal('tds', { precision: 15, scale: 2 }),
    gstReversal: decimal('gst_reversal', { precision: 15, scale: 2 }),
    refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),
    refundStatus: mysqlEnum('refund_status', ['pending', 'processed', 'cancelled']).default('pending').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_cancellations_tenant_idx').on(table.tenantId),
  ]
);

// ── re_transfers ──────────────────────────────────────────────────────────────
export const reTransfers = mysqlTable(
  're_transfers',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    oldBookingId: bigint('old_booking_id', { mode: 'number' }).notNull(),
    newBookingId: bigint('new_booking_id', { mode: 'number' }).notNull(),
    transferDate: timestamp('transfer_date').notNull(),
    reason: text('reason'),
    status: mysqlEnum('status', ['pending', 'completed']).default('pending').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_transfers_tenant_idx').on(table.tenantId),
  ]
);

// ── re_letter_templates ───────────────────────────────────────────────────────
export const reLetterTemplates = mysqlTable(
  're_letter_templates',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    type: mysqlEnum('type', [
      'demand', 'allotment', 'welcome', 'agreement_intimation',
      'possession', 'noc', 'reminder', 'interest', 'cancellation', 'other',
    ]).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    bodyHtml: text('body_html'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_letter_templates_tenant_idx').on(table.tenantId),
  ]
);

// ── re_letters_issued (id+created_at only) ────────────────────────────────────
export const reLettersIssued = mysqlTable(
  're_letters_issued',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    templateId: bigint('template_id', { mode: 'number' }).notNull(),
    issuedAt: timestamp('issued_at').defaultNow().notNull(),
    sentVia: varchar('sent_via', { length: 50 }),
    sentAt: timestamp('sent_at'),
    pdfUrl: text('pdf_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_letters_issued_tenant_idx').on(table.tenantId),
    index('re_letters_issued_booking_idx').on(table.bookingId),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// CHANNEL PARTNER TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_channel_partners ───────────────────────────────────────────────────────
export const reChannelPartners = mysqlTable(
  're_channel_partners',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    firmName: varchar('firm_name', { length: 200 }).notNull(),
    contactPerson: varchar('contact_person', { length: 150 }),
    mobile: varchar('mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    reraNo: varchar('rera_no', { length: 50 }),
    pan: varchar('pan', { length: 10 }),
    gstin: varchar('gstin', { length: 15 }),
    bankDetails: json('bank_details'),
    status: mysqlEnum('status', ['pending_kyc', 'active', 'suspended']).default('pending_kyc').notNull(),
    tier: mysqlEnum('tier', ['silver', 'gold', 'platinum']).default('silver').notNull(),
    agreementAcceptedAt: timestamp('agreement_accepted_at'),
    agreementIp: varchar('agreement_ip', { length: 45 }),
    userId: bigint('user_id', { mode: 'number' }),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_channel_partners_tenant_idx').on(table.tenantId),
  ]
);

// ── re_cp_project_access (cp_id, site_id, id) ─────────────────────────────────
export const reCpProjectAccess = mysqlTable(
  're_cp_project_access',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    cpId: bigint('cp_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('re_cp_project_access_cp_site_idx').on(table.cpId, table.siteId),
  ]
);

// ── re_cp_lead_tags (no uuid/deleted_at) ──────────────────────────────────────
export const reCpLeadTags = mysqlTable(
  're_cp_lead_tags',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull(),
    cpId: bigint('cp_id', { mode: 'number' }).notNull(),
    taggedAt: timestamp('tagged_at').defaultNow().notNull(),
    validTill: timestamp('valid_till'),
    status: mysqlEnum('status', ['active', 'expired', 'rejected_duplicate', 'converted']).default('active').notNull(),
    evidence: text('evidence'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('re_cp_lead_tags_tenant_idx').on(table.tenantId),
  ]
);

// ── re_brokerage_slabs ────────────────────────────────────────────────────────
export const reBrokerageSlabs = mysqlTable(
  're_brokerage_slabs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    siteId: bigint('site_id', { mode: 'number' }).notNull(),
    tier: mysqlEnum('tier', ['silver', 'gold', 'platinum']).notNull(),
    fromCount: int('from_count').notNull(),
    toCount: int('to_count'),
    pct: decimal('pct', { precision: 7, scale: 4 }).notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_brokerage_slabs_tenant_idx').on(table.tenantId),
  ]
);

// ── re_brokerage_entries ──────────────────────────────────────────────────────
export const reBrokerageEntries = mysqlTable(
  're_brokerage_entries',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    bookingId: bigint('booking_id', { mode: 'number' }).notNull(),
    cpId: bigint('cp_id', { mode: 'number' }).notNull(),
    base: decimal('base', { precision: 15, scale: 2 }).notNull(),
    pct: decimal('pct', { precision: 7, scale: 4 }).notNull(),
    brokerage: decimal('brokerage', { precision: 15, scale: 2 }).notNull(),
    gst: decimal('gst', { precision: 15, scale: 2 }).notNull(),
    tds194h: decimal('tds_194h', { precision: 15, scale: 2 }).notNull(),
    net: decimal('net', { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum('status', ['accrued', 'eligible', 'invoiced', 'approved', 'paid']).default('accrued').notNull(),
    eligibleRule: text('eligible_rule'),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_brokerage_entries_tenant_idx').on(table.tenantId),
  ]
);

// ── re_cp_payouts ─────────────────────────────────────────────────────────────
export const reCpPayouts = mysqlTable(
  're_cp_payouts',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    cpId: bigint('cp_id', { mode: 'number' }).notNull(),
    payoutDate: timestamp('payout_date').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    tds: decimal('tds', { precision: 15, scale: 2 }).notNull(),
    netPaid: decimal('net_paid', { precision: 15, scale: 2 }).notNull(),
    bankRef: varchar('bank_ref', { length: 100 }),
    status: mysqlEnum('status', ['pending', 'paid']).default('pending').notNull(),
    createdBy: bigint('created_by', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('re_cp_payouts_tenant_idx').on(table.tenantId),
  ]
);

// ══════════════════════════════════════════════════════════════════════════════
// MISC TABLES
// ══════════════════════════════════════════════════════════════════════════════

// ── re_feature_interest (id PK only) ─────────────────────────────────────────
export const reFeatureInterest = mysqlTable(
  're_feature_interest',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    moduleCode: varchar('module_code', { length: 50 }).notNull(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_feature_interest_tenant_idx').on(table.tenantId),
  ]
);

// ── re_sales_dropdown_masters ────────────────────────────────────────────────
export const reSalesDropdownMasters = mysqlTable(
  're_sales_dropdown_masters',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 30 }).default('primary'),
    sequence: int('sequence').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('re_sales_dm_cat_idx').on(table.tenantId, table.category),
    uniqueIndex('re_sales_dm_uniq_idx').on(table.tenantId, table.category, table.code),
  ]
);

