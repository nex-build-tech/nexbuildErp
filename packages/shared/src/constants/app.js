"use strict";
// Application-level constants for BuildERP
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_DOCUMENT_MIME_TYPES = exports.MAX_FILE_SIZE_BYTES = exports.DEFAULT_TIMEZONE = exports.DEFAULT_CURRENCY = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = exports.COOKIE_REFRESH_TOKEN = exports.COOKIE_ACCESS_TOKEN = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.API_PREFIX = exports.APP_DESCRIPTION = exports.APP_VERSION = exports.APP_SLUG = exports.APP_NAME = void 0;
exports.APP_NAME = 'BuildERP';
exports.APP_SLUG = 'builderp';
exports.APP_VERSION = '0.1.0';
exports.APP_DESCRIPTION = 'Multi-tenant SaaS ERP for procurement, inventory and goods management';
exports.API_PREFIX = 'api/v1';
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
exports.COOKIE_ACCESS_TOKEN = 'builderp_access';
exports.COOKIE_REFRESH_TOKEN = 'builderp_refresh';
exports.SUPPORTED_LOCALES = ['en', 'hi', 'mr'];
exports.DEFAULT_LOCALE = 'en';
exports.DEFAULT_CURRENCY = 'INR';
exports.DEFAULT_TIMEZONE = 'Asia/Kolkata';
exports.MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
exports.ALLOWED_DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
//# sourceMappingURL=app.js.map