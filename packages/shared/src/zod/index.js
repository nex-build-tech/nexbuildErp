"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panSchema = exports.gstinSchema = exports.phoneSchema = exports.moneySchema = exports.slugSchema = exports.uuidParamSchema = exports.dateRangeSchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
const app_1 = require("../constants/app");
// ── Pagination ────────────────────────────────────────────────────────────────
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1))
        .pipe(zod_1.z.number().min(1)),
    pageSize: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : app_1.DEFAULT_PAGE_SIZE))
        .pipe(zod_1.z.number().min(1).max(app_1.MAX_PAGE_SIZE)),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
// ── Date range ────────────────────────────────────────────────────────────────
exports.dateRangeSchema = zod_1.z.object({
    fromDate: zod_1.z.string().date('Invalid from date'),
    toDate: zod_1.z.string().date('Invalid to date'),
});
// ── UUID param ────────────────────────────────────────────────────────────────
exports.uuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid UUID'),
});
// ── Slug param ────────────────────────────────────────────────────────────────
exports.slugSchema = zod_1.z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens');
// ── Money ─────────────────────────────────────────────────────────────────────
/** Positive monetary amount with up to 2 decimal places */
exports.moneySchema = zod_1.z
    .number()
    .nonnegative('Amount must be >= 0')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places');
// ── Phone (India) ─────────────────────────────────────────────────────────────
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
// ── GSTIN ─────────────────────────────────────────────────────────────────────
exports.gstinSchema = zod_1.z
    .string()
    .length(15)
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format');
// ── PAN ───────────────────────────────────────────────────────────────────────
exports.panSchema = zod_1.z
    .string()
    .length(10)
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format');
//# sourceMappingURL=index.js.map