# BuildERP — REST API Reference Specification

BuildERP provides a comprehensive RESTful API for construction ERP management, built with NestJS, Drizzle ORM, and MySQL.

**Base URLs**:
- Local Development: `http://localhost:3000/api/v1`
- Production: `https://api.builderp.in/api/v1` (or tenant subdomain `https://{tenant}.builderp.in/api/v1`)

---

## 1. Global Request & Response Specifications

### Multi-Tenancy & Authentication Headers
All protected endpoints require tenant identification and an authenticated bearer token:

| Header | Required | Example | Description |
|---|---|---|---|
| `X-Tenant-ID` or `X-Tenant-Slug` | Yes* | `kings` | Resolves tenant scope. (*Can also be resolved automatically via Subdomain `kings.builderp.in`) |
| `Authorization` | Yes | `Bearer <JWT_TOKEN>` | Standard Bearer token acquired from `/auth/login` |
| `Content-Type` | Yes (for POST/PATCH) | `application/json` | Request payload format |

### Standard Response Envelope
All API endpoints return JSON conforming to the unified response contract:

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

#### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed: quantity must be greater than 0",
  "timestamp": "2026-11-16T10:45:00.000Z"
}
```

---

## 2. Authentication & 2FA (`/auth`)

### `POST /auth/login`
Authenticates a user against tenant credentials. Supports TOTP 2FA.
- **Request Body**:
  ```json
  {
    "email": "owner@kingsbuilders.com",
    "password": "Password123!",
    "totpCode": "123456" // Optional unless MFA is enabled for user or enforced by tenant
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "uuid": "u-101",
        "email": "owner@kingsbuilders.com",
        "firstName": "Rajesh",
        "lastName": "Kumar",
        "role": "OWNER",
        "totpEnabled": false
      },
      "tenant": {
        "id": 1,
        "slug": "kings",
        "name": "Kings Builders & Developers",
        "mfaEnabled": false
      }
    }
  }
  ```

### `POST /auth/2fa/generate`
Generates a new TOTP secret, backup codes, and QR code data URL.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "secret": "JBSWY3DPEHPK3PXP",
      "qrCodeUrl": "data:image/png;base64,...",
      "otpauthUrl": "otpauth://totp/BuildERP:owner@kingsbuilders.com?secret=...",
      "backupCodes": ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", ...]
    }
  }
  ```

### `POST /auth/2fa/enable`
Verifies user's first TOTP token and permanently activates 2FA for the account.
- **Request Body**: `{ "token": "654321", "secret": "JBSWY3DPEHPK3PXP", "backupCodes": [...] }`
- **Response**: `{ "success": true, "data": { "enabled": true } }`

### `POST /auth/2fa/disable`
Disables TOTP 2FA for the account. Requires password or current TOTP verification.
- **Request Body**: `{ "token": "654321" }`
- **Response**: `{ "success": true, "data": { "enabled": false } }`

---

## 3. Masters Management (`/masters`)

### `GET /masters/items`
Returns filtered items with Indian HSN/SAC codes, primary units, GST rates, and standard pricing.
- **Query Params**: `search`, `category`, `status`, `page`, `limit`
- **Response**: Paginated list of material and service items.

### `POST /masters/items`
Create a new master item.
- **Request Body**:
  ```json
  {
    "itemCode": "STEEL-FE500-12MM",
    "itemName": "TMT Steel Bars 12mm Fe500D",
    "category": "Raw Materials",
    "hsnCode": "72142090",
    "uom": "MT",
    "standardRate": 62500.00,
    "gstRate": 18.0,
    "minStockLevel": 5.0
  }
  ```

### `GET /masters/vendors`
List registered suppliers and contractors with verified 15-digit Indian GSTIN, PAN, and MSME numbers.

### `GET /masters/sites`
List active construction project sites with state codes and site in-charges.

### `GET /masters/tenant/branding` & `PATCH /masters/tenant/branding`
Retrieve or update tenant branding tokens, logo URL, brand color, and tagline.

---

## 4. Procurement Workflow (`/procurement`)

### Purchase Requisitions (`/procurement/requisitions`)
- `GET /procurement/requisitions`: Filterable list of PRs by site, status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CONVERTED_TO_PO`).
- `POST /procurement/requisitions`: Submit site requisition for materials.
- `PATCH /procurement/requisitions/:id/approve`: Project manager / HOD approval.

### Purchase Orders (`/procurement/purchase-orders`)
- `GET /procurement/purchase-orders`: List POs with vendor name, site, total amount, GST split (CGST+SGST or IGST), status.
- `POST /procurement/purchase-orders`: Create PO with auto-computed GST based on vendor vs site state code (Inter-state vs Intra-state).
- `PATCH /procurement/purchase-orders/:id/status`: Update status (`DRAFT`, `ISSUED`, `PARTIALLY_DELIVERED`, `COMPLETED`, `CANCELLED`). Automatically triggers in-app notification & BullMQ email/WhatsApp queue.

---

## 5. Inventory & Goods Receipt (`/inventory`)

### Goods Receipt Note (`/inventory/grn`)
- `GET /inventory/grn`: List GRNs with PO linkage, delivery challan number, vehicle number, inspection status.
- `POST /inventory/grn`: Record material arrival with QC inspection (received qty, accepted qty, rejected qty). Automatically posts entries to `stock_ledger` and recalculates moving weighted average cost.

### Stock & Warehouse (`/inventory/stock`)
- `GET /inventory/stock`: Current warehouse & site balances with valuation.
- `GET /inventory/stock/low-stock`: Returns items breaching minimum safety thresholds.
- `POST /inventory/issues`: Issues material from site storage to contractor/work-package.
- `POST /inventory/transfers`: Inter-site material transfer with gate-pass generation.

---

## 6. Contractor Billing & Measurement Book (`/contractors`)

### Measurement Book (`/contractors/measurement-book`)
- `GET /contractors/measurement-book`: Site engineer measurement entries (L × B × D calculations).
- `POST /contractors/measurement-book`: Create MB entry against contractor work order item.

### RA Bills (`/contractors/ra-bills`)
- `GET /contractors/ra-bills`: Running Account bills with cumulative work certification.
- `POST /contractors/ra-bills`: Generate RA bill with statutory deductions (Retention Money 5%, TDS u/s 194C 1%-2%, Labour Cess 1%, Mobilization Advance recovery).

---

## 7. Reports & Analytics (`/reports`)

High-performance aggregation endpoints tuned to respond in `< 300ms` for 10,000+ records:

| Endpoint | Description | Query Parameters |
|---|---|---|
| `GET /reports/dashboard-stats` | KPI summary: Total stock value, open POs, pending GRNs, low stock items, site consumption | `siteId`, `from`, `to` |
| `GET /reports/po-register` | Purchase order register with line items and tax breakdown | `vendorId`, `siteId`, `status`, `from`, `to` |
| `GET /reports/grn-register` | GRN register with delivery challan, PO number, and variance | `siteId`, `vendorId`, `from`, `to` |
| `GET /reports/stock-summary` | Real-time stock valuation by site and category | `siteId`, `category` |
| `GET /reports/stock-ledger` | Chronological debit/credit material movement ledger | `itemId`, `siteId`, `from`, `to` |
| `GET /reports/gst-summary` | Rate-wise GST breakdown: Taxable, CGST, SGST, IGST | `period`, `type` (`INPUT`/`OUTPUT`) |
| `GET /reports/site-consumption` | Actual vs budgeted consumption across projects | `siteId`, `from`, `to` |
| `GET /reports/vendor-purchase` | Vendor-wise procurement volume, rating, and spend | `from`, `to`, `top` |
| `GET /reports/stock-ageing` | 0-30, 31-60, 61-90, 90+ days dead stock analysis | `siteId` |

---

## 8. Notifications Centre (`/notifications`)

- `GET /notifications`: Fetch user's notification feed (supports `page`, `limit`, `category`, `unreadOnly`).
- `GET /notifications/unread-count`: Returns `{ unreadCount: number }` for the header bell badge.
- `PATCH /notifications/:id/read`: Marks a single notification as read.
- `PATCH /notifications/read-all`: Marks all tenant notifications for the current user as read.
- `POST /notifications/test`: Dispatches a sample notification through the in-app engine and BullMQ queue.

---

## 9. Daily Progress Reports (`/dpr`)

Mobile-optimized daily progress logging for site engineers and project managers.

| Endpoint | Method | Description |
|---|---|---|
| `/dpr` | `GET` | List daily progress reports filtered by `siteId`, `startDate`, `endDate`, `status`. |
| `/dpr/:id` | `GET` | Retrieve complete DPR dossier with work items, machinery log, and photo gallery. |
| `/dpr` | `POST` | Create new DPR with activities, equipment running hours, and tagged site photos. |
| `/dpr/:id/status` | `PATCH` | Update report status (`draft`, `submitted`, `approved`, `rejected`). |
| `/dpr/:id/photos` | `POST` | Add progress photos with captions and activity tags to an existing report. |

---

## 10. Labour Attendance & Muster Roll (`/labour`)

Count-based contractor labour tracking, skill-wise categorization, and overtime monitoring.

| Endpoint | Method | Description |
|---|---|---|
| `/labour/attendance` | `GET` | Retrieve daily attendance records filtered by `siteId`, `date`, `contractorId`, `shift`. |
| `/labour/summary` | `GET` | Get aggregated workforce counts: Skilled, Semi-Skilled, Unskilled, Supervisors, OT hours. |
| `/labour/attendance/bulk` | `POST` | Rapid 1-click bulk save of multi-contractor muster roll entries. |

---

## 11. BOQ vs Site Consumption (`/boq`)

Bill of Quantities baseline management and actual site consumption variance analysis.

| Endpoint | Method | Description |
|---|---|---|
| `/boq` | `GET` | List baseline BOQ items filtered by `siteId` or `workPackage`. |
| `/boq` | `POST` | Create a single BOQ item with budgeted quantity, unit rate, and tolerance %. |
| `/boq/bulk` | `POST` | Bulk import/create BOQ items for a site work package. |
| `/boq/consumption-comparison` | `GET` | Compare BOQ budget vs actual store issues and inward receipts. Calculates utilization %, variance %, and warning status (`NORMAL`, `CAUTION`, `BREACHED`). |

---

## 12. Accounting & Tally Prime Integration (`/integrations/tally`)

Standard double-entry accounting XML generator conforming to official Tally Prime / ERP 9 `<ENVELOPE>` schema.

| Endpoint | Method | Description |
|---|---|---|
| `/integrations/tally/purchase-vouchers-xml` | `GET` | Exports purchase voucher XML with ledger accounts (Party Creditor, Purchases, CGST Input, SGST Input, IGST Input, Round-off) and HSN-wise inventory entries. Returns `Content-Type: application/xml`. |

---

## 13. Meta Cloud WhatsApp Provider (`/procurement/pos`)

Meta Graph API (`graph.facebook.com/v21.0`) integration for automated PO communication.

| Endpoint | Method | Description |
|---|---|---|
| `/procurement/pos/:id/share-whatsapp` | `POST` | Sends formal PO notification and PDF document link to the vendor's WhatsApp. |
| `/procurement/pos/:id/request-approval-whatsapp` | `POST` | Dispatches interactive quick-reply approval buttons (`Approve PO` / `Reject PO`) to Director's WhatsApp. |

---

## 14. SuperAdmin & SaaS Tenant Management (`/super-admin`)

Multi-tenant administration, dynamic brand theming, and workspace switching.

| Endpoint | Method | Description |
|---|---|---|
| `/super-admin/tenants` | `GET` | List all onboarded builder tenants with real-time statistics (sites count, users count, PO count) and brand colors. |
| `/super-admin/tenants/:id` | `GET` | Get single tenant dossier and provisioned users. |
| `/super-admin/tenants` | `POST` | Provision a new developer tenant organization with dedicated roles, permissions, admin credentials, and UOM units. |
| `/super-admin/tenants/:id/branding` | `PATCH` | Update primary brand color palette (`#hex`), logo URL, tagline, or company name. Injects immediately into root CSS variables. |
| `/super-admin/tenants/:id/status` | `PATCH` | Update tenant lifecycle status (`active`, `trial`, `suspended`, `cancelled`). |
| `/super-admin/tenants/:id/impersonate` | `POST` | Generate 1-click administrative JWT token scoped to the target tenant workspace. |
