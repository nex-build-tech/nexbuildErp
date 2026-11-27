import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/app';

// ── Pagination ────────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : DEFAULT_PAGE_SIZE))
    .pipe(z.number().min(1).max(MAX_PAGE_SIZE)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ── Date range ────────────────────────────────────────────────────────────────

export const dateRangeSchema = z.object({
  fromDate: z.string().date('Invalid from date'),
  toDate: z.string().date('Invalid to date'),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

// ── UUID param ────────────────────────────────────────────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
});

// ── Slug param ────────────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens');

// ── Money ─────────────────────────────────────────────────────────────────────

/** Positive monetary amount with up to 2 decimal places */
export const moneySchema = z
  .number()
  .nonnegative('Amount must be >= 0')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

// ── Phone (India) ─────────────────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

// ── GSTIN ─────────────────────────────────────────────────────────────────────

export const gstinSchema = z
  .string()
  .length(15)
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format',
  );

// ── PAN ───────────────────────────────────────────────────────────────────────

export const panSchema = z
  .string()
  .length(10)
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format');
