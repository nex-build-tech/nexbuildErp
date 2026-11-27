// Application-level constants for BuildERP

export const APP_NAME = 'BuildERP' as const;
export const APP_SLUG = 'builderp' as const;
export const APP_VERSION = '0.1.0' as const;
export const APP_DESCRIPTION = 'Multi-tenant SaaS ERP for procurement, inventory and goods management' as const;

export const API_PREFIX = 'api/v1' as const;
export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

export const COOKIE_ACCESS_TOKEN = 'builderp_access' as const;
export const COOKIE_REFRESH_TOKEN = 'builderp_refresh' as const;

export const SUPPORTED_LOCALES = ['en', 'hi', 'mr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const DEFAULT_CURRENCY = 'INR' as const;
export const DEFAULT_TIMEZONE = 'Asia/Kolkata' as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
