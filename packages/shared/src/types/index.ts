// Shared TypeScript types for BuildERP API

/** Standard API envelope for a successful response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/** Metadata attached to paginated responses */
export interface ResponseMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Paginated response (alias for ApiResponse with meta always present) */
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: ResponseMeta;
}

/** Standard API error envelope */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]> | string;
  };
}

/** Either a success or error response */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;

/** ID types */
export type UUID = string;
export type Timestamp = string; // ISO-8601

/** Audit fields common to all Prisma models */
export interface AuditFields {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: UUID;
  updatedBy?: UUID;
}

/** Multi-tenancy context attached to every request */
export interface TenantContext {
  tenantId: UUID;
  tenantSlug: string;
  userId: UUID;
  roles: string[];
  permissions: string[];
}

/** Address shape */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}
