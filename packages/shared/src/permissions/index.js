"use strict";
// RBAC permission constants for BuildERP
// Keys follow the pattern: <module>.<action>
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
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
};
/** Default permission sets per role */
exports.ROLE_PERMISSIONS = {
    SUPER_ADMIN: Object.values(exports.PERMISSIONS),
    TENANT_ADMIN: Object.values(exports.PERMISSIONS).filter((p) => !p.startsWith('audit_log')),
    PURCHASE_MANAGER: [
        exports.PERMISSIONS.PO_VIEW, exports.PERMISSIONS.PO_CREATE, exports.PERMISSIONS.PO_EDIT,
        exports.PERMISSIONS.PO_APPROVE, exports.PERMISSIONS.PO_REJECT, exports.PERMISSIONS.PO_CANCEL, exports.PERMISSIONS.PO_EXPORT,
        exports.PERMISSIONS.GRN_VIEW, exports.PERMISSIONS.GRN_CREATE, exports.PERMISSIONS.GRN_EDIT, exports.PERMISSIONS.GRN_APPROVE,
        exports.PERMISSIONS.SUPPLIER_VIEW,
        exports.PERMISSIONS.ITEM_VIEW,
        exports.PERMISSIONS.INVOICE_VIEW, exports.PERMISSIONS.INVOICE_APPROVE,
        exports.PERMISSIONS.STOCK_VIEW, exports.PERMISSIONS.STOCK_VALUATION_VIEW,
        exports.PERMISSIONS.REPORT_VIEW, exports.PERMISSIONS.REPORT_PURCHASE_ANALYSIS,
    ],
    STORE_KEEPER: [
        exports.PERMISSIONS.PO_VIEW,
        exports.PERMISSIONS.GRN_VIEW, exports.PERMISSIONS.GRN_CREATE, exports.PERMISSIONS.GRN_EDIT,
        exports.PERMISSIONS.STOCK_VIEW, exports.PERMISSIONS.STOCK_ADJUST, exports.PERMISSIONS.STOCK_TRANSFER,
        exports.PERMISSIONS.ITEM_VIEW,
        exports.PERMISSIONS.WAREHOUSE_VIEW,
    ],
    ACCOUNTS_MANAGER: [
        exports.PERMISSIONS.INVOICE_VIEW, exports.PERMISSIONS.INVOICE_CREATE,
        exports.PERMISSIONS.INVOICE_EDIT, exports.PERMISSIONS.INVOICE_APPROVE, exports.PERMISSIONS.INVOICE_EXPORT,
        exports.PERMISSIONS.PAYMENT_VIEW, exports.PERMISSIONS.PAYMENT_CREATE, exports.PERMISSIONS.PAYMENT_APPROVE,
        exports.PERMISSIONS.PAYMENT_EXPORT,
        exports.PERMISSIONS.REPORT_VIEW, exports.PERMISSIONS.REPORT_SUPPLIER_LEDGER, exports.PERMISSIONS.REPORT_GST_INPUT,
        exports.PERMISSIONS.PO_VIEW, exports.PERMISSIONS.GRN_VIEW,
    ],
    VIEWER: [
        exports.PERMISSIONS.PO_VIEW,
        exports.PERMISSIONS.GRN_VIEW,
        exports.PERMISSIONS.STOCK_VIEW,
        exports.PERMISSIONS.ITEM_VIEW,
        exports.PERMISSIONS.SUPPLIER_VIEW,
        exports.PERMISSIONS.INVOICE_VIEW,
        exports.PERMISSIONS.REPORT_VIEW,
    ],
};
//# sourceMappingURL=index.js.map