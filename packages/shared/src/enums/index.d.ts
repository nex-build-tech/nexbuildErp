export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
}
export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    TRIAL = "TRIAL",
    SUSPENDED = "SUSPENDED",
    CHURNED = "CHURNED"
}
export declare enum PlanType {
    FREE = "FREE",
    STARTER = "STARTER",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum DocumentStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    CLOSED = "CLOSED"
}
/** GST tax rate buckets used in India */
export declare enum GstRate {
    ZERO = 0,
    FIVE = 5,
    TWELVE = 12,
    EIGHTEEN = 18,
    TWENTY_EIGHT = 28
}
export declare enum UnitOfMeasure {
    PIECE = "PCS",
    KG = "KG",
    GRAM = "GRM",
    LITRE = "LTR",
    MILLILITRE = "ML",
    METRE = "MTR",
    CENTIMETRE = "CM",
    BOX = "BOX",
    PACK = "PCK",
    DOZEN = "DZN",
    SET = "SET",
    BAG = "BAG",
    ROLL = "ROL",
    TONNE = "TON"
}
export declare enum StockMovementType {
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT",
    SALE_DISPATCH = "SALE_DISPATCH",
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
    TRANSFER_IN = "TRANSFER_IN",
    TRANSFER_OUT = "TRANSFER_OUT",
    RETURN_INWARD = "RETURN_INWARD",
    RETURN_OUTWARD = "RETURN_OUTWARD",
    OPENING_BALANCE = "OPENING_BALANCE",
    DAMAGE_WRITE_OFF = "DAMAGE_WRITE_OFF"
}
export declare enum PaymentMode {
    CASH = "CASH",
    CHEQUE = "CHEQUE",
    NEFT = "NEFT",
    RTGS = "RTGS",
    UPI = "UPI",
    CREDIT_NOTE = "CREDIT_NOTE"
}
export declare enum PaymentStatus {
    UNPAID = "UNPAID",
    PARTIAL = "PARTIAL",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
}
export declare enum PoType {
    STANDARD = "STANDARD",
    BLANKET = "BLANKET",
    CONTRACT = "CONTRACT",
    EMERGENCY = "EMERGENCY"
}
export declare enum NotificationType {
    PO_CREATED = "PO_CREATED",
    PO_APPROVED = "PO_APPROVED",
    PO_REJECTED = "PO_REJECTED",
    GRN_CREATED = "GRN_CREATED",
    INVOICE_RECEIVED = "INVOICE_RECEIVED",
    PAYMENT_DUE = "PAYMENT_DUE",
    STOCK_LOW = "STOCK_LOW",
    STOCK_OUT = "STOCK_OUT"
}
//# sourceMappingURL=index.d.ts.map