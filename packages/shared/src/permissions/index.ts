// RBAC permission constants for BuildERP
// Keys follow the pattern: <module>.<action>

export const PERMISSIONS = {
  // ── Purchase Orders ──────────────────────────────────────────────
  PO_VIEW: 'po.view',
  PO_CREATE: 'po.create',
  PO_EDIT: 'po.edit',
  PO_DELETE: 'po.delete',
  PO_APPROVE: 'po.approve',
  PO_REJECT: 'po.reject',
  PO_CANCEL: 'po.cancel',
  PO_EXPORT: 'po.export',
  PO_PRINT: 'po.print',

  // ── Goods Receipt Notes ───────────────────────────────────────────
  GRN_VIEW: 'grn.view',
  GRN_CREATE: 'grn.create',
  GRN_EDIT: 'grn.edit',
  GRN_DELETE: 'grn.delete',
  GRN_APPROVE: 'grn.approve',
  GRN_EXPORT: 'grn.export',

  // ── Stock / Inventory ─────────────────────────────────────────────
  STOCK_VIEW: 'stock.view',
  STOCK_ADJUST: 'stock.adjust',
  STOCK_TRANSFER: 'stock.transfer',
  STOCK_EXPORT: 'stock.export',
  STOCK_VALUATION_VIEW: 'stock.valuation.view',

  // ── Products / Items ──────────────────────────────────────────────
  ITEM_VIEW: 'item.view',
  ITEM_CREATE: 'item.create',
  ITEM_EDIT: 'item.edit',
  ITEM_DELETE: 'item.delete',

  // ── Suppliers ─────────────────────────────────────────────────────
  SUPPLIER_VIEW: 'supplier.view',
  SUPPLIER_CREATE: 'supplier.create',
  SUPPLIER_EDIT: 'supplier.edit',
  SUPPLIER_DELETE: 'supplier.delete',

  // ── Invoices ──────────────────────────────────────────────────────
  INVOICE_VIEW: 'invoice.view',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_EDIT: 'invoice.edit',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_APPROVE: 'invoice.approve',
  INVOICE_EXPORT: 'invoice.export',

  // ── Payments ──────────────────────────────────────────────────────
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_APPROVE: 'payment.approve',
  PAYMENT_EXPORT: 'payment.export',

  // ── Warehouses ────────────────────────────────────────────────────
  WAREHOUSE_VIEW: 'warehouse.view',
  WAREHOUSE_CREATE: 'warehouse.create',
  WAREHOUSE_EDIT: 'warehouse.edit',
  WAREHOUSE_DELETE: 'warehouse.delete',

  // ── Reports ───────────────────────────────────────────────────────
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',
  REPORT_PURCHASE_ANALYSIS: 'report.purchase.analysis',
  REPORT_INVENTORY_ANALYSIS: 'report.inventory.analysis',
  REPORT_SUPPLIER_LEDGER: 'report.supplier.ledger',
  REPORT_GST_INPUT: 'report.gst.input',

  // ── Users & Roles (Tenant Admin) ──────────────────────────────────
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_ASSIGN_ROLE: 'user.assign_role',

  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',

  // ── Tenant Settings ───────────────────────────────────────────────
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // ── Audit Log ─────────────────────────────────────────────────────
  AUDIT_LOG_VIEW: 'audit_log.view',
  AUDIT_LOG_EXPORT: 'audit_log.export',
  // ── Realty — Lead ─────────────────────────────────────────────────────
  REALTY_LEAD_VIEW: 'realty.lead.view',
  REALTY_LEAD_CREATE: 'realty.lead.create',
  REALTY_LEAD_EDIT: 'realty.lead.edit',
  REALTY_LEAD_DELETE: 'realty.lead.delete',
  REALTY_LEAD_ASSIGN: 'realty.lead.assign',
  REALTY_LEAD_IMPORT: 'realty.lead.import',
  REALTY_LEAD_EXPORT: 'realty.lead.export',

  // ── Realty — Site Visit ───────────────────────────────────────────────
  REALTY_SITEVISIT_VIEW: 'realty.sitevisit.view',
  REALTY_SITEVISIT_MANAGE: 'realty.sitevisit.manage',

  // ── Realty — Campaign ─────────────────────────────────────────────────
  REALTY_CAMPAIGN_VIEW: 'realty.campaign.view',
  REALTY_CAMPAIGN_MANAGE: 'realty.campaign.manage',

  // ── Realty — Inventory ────────────────────────────────────────────────
  REALTY_INVENTORY_VIEW: 'realty.inventory.view',
  REALTY_INVENTORY_HOLD: 'realty.inventory.hold',
  REALTY_INVENTORY_BLOCK: 'realty.inventory.block',
  REALTY_INVENTORY_RELEASE: 'realty.inventory.release',
  REALTY_INVENTORY_MANAGE: 'realty.inventory.manage',

  // ── Realty — Cost Sheet ───────────────────────────────────────────────
  REALTY_COSTSHEET_CREATE: 'realty.costsheet.create',
  REALTY_COSTSHEET_APPROVE: 'realty.costsheet.approve',

  // ── Realty — Plan ─────────────────────────────────────────────────────
  REALTY_PLAN_MANAGE: 'realty.plan.manage',

  // ── Realty — Channel Partners ─────────────────────────────────────────
  REALTY_CP_VIEW: 'realty.cp.view',
  REALTY_CP_MANAGE: 'realty.cp.manage',
  REALTY_CP_APPROVE: 'realty.cp.approve',

  // ── Realty — Brokerage ────────────────────────────────────────────────
  REALTY_BROKERAGE_VIEW: 'realty.brokerage.view',
  REALTY_BROKERAGE_APPROVE: 'realty.brokerage.approve',
  REALTY_BROKERAGE_PAY: 'realty.brokerage.pay',

  // ── Realty — Booking ──────────────────────────────────────────────────
  REALTY_BOOKING_VIEW: 'realty.booking.view',
  REALTY_BOOKING_CREATE: 'realty.booking.create',
  REALTY_BOOKING_EDIT: 'realty.booking.edit',
  REALTY_BOOKING_APPROVE: 'realty.booking.approve',
  REALTY_BOOKING_CANCEL: 'realty.booking.cancel',
  REALTY_BOOKING_TRANSFER: 'realty.booking.transfer',

  // ── Realty — Demand ───────────────────────────────────────────────────
  REALTY_DEMAND_VIEW: 'realty.demand.view',
  REALTY_DEMAND_GENERATE: 'realty.demand.generate',
  REALTY_DEMAND_SEND: 'realty.demand.send',

  // ── Realty — Receipt ──────────────────────────────────────────────────
  REALTY_RECEIPT_VIEW: 'realty.receipt.view',
  REALTY_RECEIPT_CREATE: 'realty.receipt.create',
  REALTY_RECEIPT_APPROVE: 'realty.receipt.approve',
  REALTY_RECEIPT_BOUNCE: 'realty.receipt.bounce',

  // ── Realty — Ledger ───────────────────────────────────────────────────
  REALTY_LEDGER_VIEW: 'realty.ledger.view',

  // ── Realty — Interest ─────────────────────────────────────────────────
  REALTY_INTEREST_MANAGE: 'realty.interest.manage',
  REALTY_INTEREST_WAIVE: 'realty.interest.waive',

  // ── Realty — Letters ──────────────────────────────────────────────────
  REALTY_LETTER_MANAGE: 'realty.letter.manage',
  REALTY_LETTER_SEND: 'realty.letter.send',

  // ── Realty — Reports ──────────────────────────────────────────────────
  REALTY_REPORT_VIEW: 'realty.report.view',
  REALTY_REPORT_EXPORT: 'realty.report.export',

  // ── Realty — Settings ─────────────────────────────────────────────────
  REALTY_SETTINGS_MANAGE: 'realty.settings.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default permission sets per role */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[],

  TENANT_ADMIN: Object.values(PERMISSIONS).filter(
    (p) => !p.startsWith('audit_log'),
  ) as Permission[],

  PURCHASE_MANAGER: [
    PERMISSIONS.PO_VIEW, PERMISSIONS.PO_CREATE, PERMISSIONS.PO_EDIT,
    PERMISSIONS.PO_APPROVE, PERMISSIONS.PO_REJECT, PERMISSIONS.PO_CANCEL, PERMISSIONS.PO_EXPORT,
    PERMISSIONS.GRN_VIEW, PERMISSIONS.GRN_CREATE, PERMISSIONS.GRN_EDIT, PERMISSIONS.GRN_APPROVE,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.ITEM_VIEW,
    PERMISSIONS.INVOICE_VIEW, PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_VALUATION_VIEW,
    PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_PURCHASE_ANALYSIS,
  ],

  STORE_KEEPER: [
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.GRN_VIEW, PERMISSIONS.GRN_CREATE, PERMISSIONS.GRN_EDIT,
    PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_ADJUST, PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.ITEM_VIEW,
    PERMISSIONS.WAREHOUSE_VIEW,
  ],

  ACCOUNTS_MANAGER: [
    PERMISSIONS.INVOICE_VIEW, PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT, PERMISSIONS.INVOICE_APPROVE, PERMISSIONS.INVOICE_EXPORT,
    PERMISSIONS.PAYMENT_VIEW, PERMISSIONS.PAYMENT_CREATE, PERMISSIONS.PAYMENT_APPROVE,
    PERMISSIONS.PAYMENT_EXPORT,
    PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_SUPPLIER_LEDGER, PERMISSIONS.REPORT_GST_INPUT,
    PERMISSIONS.PO_VIEW, PERMISSIONS.GRN_VIEW,
  ],

  VIEWER: [
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.GRN_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.ITEM_VIEW,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],

  // ── Realty Roles ───────────────────────────────────────────────────
  SALES_HEAD: [
    PERMISSIONS.REALTY_LEAD_VIEW,
    PERMISSIONS.REALTY_LEAD_CREATE,
    PERMISSIONS.REALTY_LEAD_EDIT,
    PERMISSIONS.REALTY_LEAD_DELETE,
    PERMISSIONS.REALTY_LEAD_ASSIGN,
    PERMISSIONS.REALTY_LEAD_IMPORT,
    PERMISSIONS.REALTY_LEAD_EXPORT,
    PERMISSIONS.REALTY_SITEVISIT_VIEW,
    PERMISSIONS.REALTY_SITEVISIT_MANAGE,
    PERMISSIONS.REALTY_CAMPAIGN_VIEW,
    PERMISSIONS.REALTY_CAMPAIGN_MANAGE,
    PERMISSIONS.REALTY_INVENTORY_VIEW,
    PERMISSIONS.REALTY_INVENTORY_HOLD,
    PERMISSIONS.REALTY_INVENTORY_BLOCK,
    PERMISSIONS.REALTY_INVENTORY_RELEASE,
    PERMISSIONS.REALTY_INVENTORY_MANAGE,
    PERMISSIONS.REALTY_COSTSHEET_CREATE,
    PERMISSIONS.REALTY_COSTSHEET_APPROVE,
    PERMISSIONS.REALTY_PLAN_MANAGE,
    PERMISSIONS.REALTY_CP_VIEW,
    PERMISSIONS.REALTY_CP_MANAGE,
    PERMISSIONS.REALTY_CP_APPROVE,
    PERMISSIONS.REALTY_BROKERAGE_VIEW,
    PERMISSIONS.REALTY_BROKERAGE_APPROVE,
    PERMISSIONS.REALTY_BOOKING_VIEW,
    PERMISSIONS.REALTY_BOOKING_CREATE,
    PERMISSIONS.REALTY_BOOKING_EDIT,
    PERMISSIONS.REALTY_BOOKING_APPROVE,
    PERMISSIONS.REALTY_BOOKING_CANCEL,
    PERMISSIONS.REALTY_BOOKING_TRANSFER,
    PERMISSIONS.REALTY_DEMAND_VIEW,
    PERMISSIONS.REALTY_DEMAND_GENERATE,
    PERMISSIONS.REALTY_DEMAND_SEND,
    PERMISSIONS.REALTY_RECEIPT_VIEW,
    PERMISSIONS.REALTY_RECEIPT_CREATE,
    PERMISSIONS.REALTY_LEDGER_VIEW,
    PERMISSIONS.REALTY_INTEREST_MANAGE,
    PERMISSIONS.REALTY_LETTER_MANAGE,
    PERMISSIONS.REALTY_LETTER_SEND,
    PERMISSIONS.REALTY_REPORT_VIEW,
    PERMISSIONS.REALTY_REPORT_EXPORT,
    PERMISSIONS.REALTY_SETTINGS_MANAGE,

    // ERP Masters & Configuration
    PERMISSIONS.ITEM_VIEW,
    PERMISSIONS.ITEM_CREATE,
    PERMISSIONS.ITEM_EDIT,
    PERMISSIONS.ITEM_DELETE,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.SUPPLIER_CREATE,
    PERMISSIONS.SUPPLIER_EDIT,
    PERMISSIONS.SUPPLIER_DELETE,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.WAREHOUSE_CREATE,
    PERMISSIONS.WAREHOUSE_EDIT,
    PERMISSIONS.WAREHOUSE_DELETE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],

  PRESALES: [
    PERMISSIONS.REALTY_LEAD_VIEW,
    PERMISSIONS.REALTY_LEAD_CREATE,
    PERMISSIONS.REALTY_LEAD_EDIT,
    PERMISSIONS.REALTY_SITEVISIT_VIEW,
    PERMISSIONS.REALTY_SITEVISIT_MANAGE,
    PERMISSIONS.REALTY_CAMPAIGN_VIEW,
    PERMISSIONS.REALTY_INVENTORY_VIEW,
  ],

  SALES_EXEC: [
    PERMISSIONS.REALTY_LEAD_VIEW,
    PERMISSIONS.REALTY_LEAD_CREATE,
    PERMISSIONS.REALTY_LEAD_EDIT,
    PERMISSIONS.REALTY_LEAD_ASSIGN,
    PERMISSIONS.REALTY_LEAD_EXPORT,
    PERMISSIONS.REALTY_SITEVISIT_VIEW,
    PERMISSIONS.REALTY_SITEVISIT_MANAGE,
    PERMISSIONS.REALTY_CAMPAIGN_VIEW,
    PERMISSIONS.REALTY_INVENTORY_VIEW,
    PERMISSIONS.REALTY_INVENTORY_HOLD,
    PERMISSIONS.REALTY_INVENTORY_RELEASE,
    PERMISSIONS.REALTY_COSTSHEET_CREATE,
    PERMISSIONS.REALTY_BOOKING_VIEW,
    PERMISSIONS.REALTY_BOOKING_CREATE,
    PERMISSIONS.REALTY_BOOKING_EDIT,
    PERMISSIONS.REALTY_DEMAND_VIEW,
    PERMISSIONS.REALTY_RECEIPT_VIEW,
    PERMISSIONS.REALTY_RECEIPT_CREATE,
    PERMISSIONS.REALTY_LEDGER_VIEW,
    PERMISSIONS.REALTY_REPORT_VIEW,
    PERMISSIONS.REALTY_REPORT_EXPORT,
  ],

  CRM_EXEC: [
    PERMISSIONS.REALTY_BOOKING_VIEW,
    PERMISSIONS.REALTY_BOOKING_EDIT,
    PERMISSIONS.REALTY_DEMAND_VIEW,
    PERMISSIONS.REALTY_DEMAND_GENERATE,
    PERMISSIONS.REALTY_DEMAND_SEND,
    PERMISSIONS.REALTY_RECEIPT_VIEW,
    PERMISSIONS.REALTY_RECEIPT_CREATE,
    PERMISSIONS.REALTY_LEDGER_VIEW,
    PERMISSIONS.REALTY_LETTER_MANAGE,
    PERMISSIONS.REALTY_LETTER_SEND,
    PERMISSIONS.REALTY_REPORT_VIEW,
    PERMISSIONS.REALTY_REPORT_EXPORT,
  ],

  // CRM_ACCOUNTS: receipt operations & ledger only.
  // ⚠ All approval actions (receipt.approve, interest.waive, brokerage.approve)
  //   are reserved exclusively for SALES_HEAD.
  CRM_ACCOUNTS: [
    PERMISSIONS.REALTY_RECEIPT_VIEW,
    PERMISSIONS.REALTY_RECEIPT_CREATE,
    // REALTY_RECEIPT_APPROVE  → Sales Head only
    PERMISSIONS.REALTY_RECEIPT_BOUNCE,
    PERMISSIONS.REALTY_INTEREST_MANAGE,
    // REALTY_INTEREST_WAIVE   → Sales Head only
    PERMISSIONS.REALTY_LEDGER_VIEW,
    PERMISSIONS.REALTY_BROKERAGE_VIEW,
    // REALTY_BROKERAGE_APPROVE → Sales Head only
    PERMISSIONS.REALTY_BROKERAGE_PAY,
    PERMISSIONS.REALTY_REPORT_VIEW,
    PERMISSIONS.REALTY_REPORT_EXPORT,
  ],

  CHANNEL_PARTNER: [
    PERMISSIONS.REALTY_CP_VIEW,
  ],
};
