"use strict";
// Shared enumerations for BuildERP
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.PoType = exports.PaymentStatus = exports.PaymentMode = exports.StockMovementType = exports.UnitOfMeasure = exports.GstRate = exports.DocumentStatus = exports.PlanType = exports.TenantStatus = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["INACTIVE"] = "INACTIVE";
    TenantStatus["TRIAL"] = "TRIAL";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["CHURNED"] = "CHURNED";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var PlanType;
(function (PlanType) {
    PlanType["FREE"] = "FREE";
    PlanType["STARTER"] = "STARTER";
    PlanType["PROFESSIONAL"] = "PROFESSIONAL";
    PlanType["ENTERPRISE"] = "ENTERPRISE";
})(PlanType || (exports.PlanType = PlanType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["DRAFT"] = "DRAFT";
    DocumentStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["CANCELLED"] = "CANCELLED";
    DocumentStatus["CLOSED"] = "CLOSED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
/** GST tax rate buckets used in India */
var GstRate;
(function (GstRate) {
    GstRate[GstRate["ZERO"] = 0] = "ZERO";
    GstRate[GstRate["FIVE"] = 5] = "FIVE";
    GstRate[GstRate["TWELVE"] = 12] = "TWELVE";
    GstRate[GstRate["EIGHTEEN"] = 18] = "EIGHTEEN";
    GstRate[GstRate["TWENTY_EIGHT"] = 28] = "TWENTY_EIGHT";
})(GstRate || (exports.GstRate = GstRate = {}));
var UnitOfMeasure;
(function (UnitOfMeasure) {
    UnitOfMeasure["PIECE"] = "PCS";
    UnitOfMeasure["KG"] = "KG";
    UnitOfMeasure["GRAM"] = "GRM";
    UnitOfMeasure["LITRE"] = "LTR";
    UnitOfMeasure["MILLILITRE"] = "ML";
    UnitOfMeasure["METRE"] = "MTR";
    UnitOfMeasure["CENTIMETRE"] = "CM";
    UnitOfMeasure["BOX"] = "BOX";
    UnitOfMeasure["PACK"] = "PCK";
    UnitOfMeasure["DOZEN"] = "DZN";
    UnitOfMeasure["SET"] = "SET";
    UnitOfMeasure["BAG"] = "BAG";
    UnitOfMeasure["ROLL"] = "ROL";
    UnitOfMeasure["TONNE"] = "TON";
})(UnitOfMeasure || (exports.UnitOfMeasure = UnitOfMeasure = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PURCHASE_RECEIPT"] = "PURCHASE_RECEIPT";
    StockMovementType["SALE_DISPATCH"] = "SALE_DISPATCH";
    StockMovementType["STOCK_ADJUSTMENT"] = "STOCK_ADJUSTMENT";
    StockMovementType["TRANSFER_IN"] = "TRANSFER_IN";
    StockMovementType["TRANSFER_OUT"] = "TRANSFER_OUT";
    StockMovementType["RETURN_INWARD"] = "RETURN_INWARD";
    StockMovementType["RETURN_OUTWARD"] = "RETURN_OUTWARD";
    StockMovementType["OPENING_BALANCE"] = "OPENING_BALANCE";
    StockMovementType["DAMAGE_WRITE_OFF"] = "DAMAGE_WRITE_OFF";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "CASH";
    PaymentMode["CHEQUE"] = "CHEQUE";
    PaymentMode["NEFT"] = "NEFT";
    PaymentMode["RTGS"] = "RTGS";
    PaymentMode["UPI"] = "UPI";
    PaymentMode["CREDIT_NOTE"] = "CREDIT_NOTE";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "UNPAID";
    PaymentStatus["PARTIAL"] = "PARTIAL";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["OVERDUE"] = "OVERDUE";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PoType;
(function (PoType) {
    PoType["STANDARD"] = "STANDARD";
    PoType["BLANKET"] = "BLANKET";
    PoType["CONTRACT"] = "CONTRACT";
    PoType["EMERGENCY"] = "EMERGENCY";
})(PoType || (exports.PoType = PoType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["PO_CREATED"] = "PO_CREATED";
    NotificationType["PO_APPROVED"] = "PO_APPROVED";
    NotificationType["PO_REJECTED"] = "PO_REJECTED";
    NotificationType["GRN_CREATED"] = "GRN_CREATED";
    NotificationType["INVOICE_RECEIVED"] = "INVOICE_RECEIVED";
    NotificationType["PAYMENT_DUE"] = "PAYMENT_DUE";
    NotificationType["STOCK_LOW"] = "STOCK_LOW";
    NotificationType["STOCK_OUT"] = "STOCK_OUT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map