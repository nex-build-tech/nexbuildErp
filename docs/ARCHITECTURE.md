# BuildERP — Architectural Blueprint & System Design
**Edition:** Enterprise Construction SaaS (Customized for Kings Builders & Developers)  
**ORM:** Drizzle ORM (Pure TypeScript, Zero-Prisma, Zero-Docker Constraint Compliant)  
**Database:** Local / Managed MySQL & MariaDB (Port 3307 in Dev, 3306 in Prod)

---

## 1. Executive Summary

BuildERP is a high-performance multi-tenant SaaS ERP engineered specifically for Indian real estate developers, EPC contractors, and construction firms. It delivers an end-to-end procurement, inventory, and subcontract billing workflow designed around Indian statutory mandates:
- **CGST / SGST / IGST Engine** with automated state-code inter-state determination.
- **Section 194C TDS Withholding** (1% individual/HUF, 2% company) and Form 26Q compliance.
- **Contractor Retention Money Reserve** (5% statutory DLP liability held for 6 months post completion).
- **Physical Measurement Book (MB Book)** certification workflow for Running Account (RA) Bills.
- **Perpetual Weighted Average Valuation** & double-entry Stock Movement Ledger.
- **Multi-Channel Notifications:** In-app Notification Centre + BullMQ Async Worker Queue + Stub WhatsApp Provider interface.
- **Zero-Trust Security:** Optional TOTP Two-Factor Authentication per tenant & user.

---

## 2. Technology Stack & Frameworks

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  React 19 • Vite 7 • Tailux CSS 4 • React-ApexCharts • Heroicons       │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTPS / REST JSON + Bearer JWT
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                            │
│  NestJS 11 • TypeScript 5.9 • Pino Logger • Throttler Rate Limiting    │
│  In-Memory / BullMQ Queue • Otplib TOTP RFC 6238 • QRCode Generator    │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ SQL Queries via Drizzle ORM (mysql2)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            DATA PERSISTENCE                            │
│  MySQL 8.0 / MariaDB 10.4 • InnoDB Engine • utf8mb4_unicode_ci         │
│  Row-Level Tenant Isolation (`tenant_id` on all 40 relational tables)   │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Component | Description |
|---|---|---|
| **Monorepo** | pnpm workspaces + Turborepo | Fast, atomic builds across `@builderp/api`, `@builderp/web`, `@builderp/shared`, `@builderp/config` |
| **Backend API** | NestJS 11 + Express | Modular architecture: `auth`, `masters`, `procurement`, `inventory`, `contractors-billing`, `dpr`, `labour`, `boq`, `integrations/tally`, `dashboard`, `notifications` |
| **ORM & DB** | Drizzle ORM + mysql2 | Pure SQL builders without Prisma schema bloat, type-safe queries, `< 30ms` latency (40 tables) |
| **Frontend** | React 19 + Vite 7 | Tailux design system, dynamic theme color tokens (`#c5a04e`), React-ApexCharts, mobile DPR & Labour matrix |
| **Queueing** | BullMQ + In-Memory Fallback | Async email and alert processing; works automatically with Redis or in-memory |
| **2FA / MFA** | otplib + qrcode | RFC 6238 TOTP authenticator with 5 one-time backup recovery codes |
| **WhatsApp** | Meta Cloud API + Stub | Official Cloud API (`graph.facebook.com/v21.0`) for interactive PO approval buttons and PDF sharing, with graceful stub fallback |
| **Accounting** | Tally Prime XML Export | Double-entry XML voucher generator conforming to Tally Prime / ERP 9 schema for automated ledger import |

---

## 3. Monorepo Organization

```
goodsmanagement/
├── apps/
│   ├── api/                    # NestJS API backend (@builderp/api)
│   │   ├── src/
│   │   │   ├── auth/           # JWT auth, RBAC guards, TOTP 2FA engine
│   │   │   ├── common/         # TenantMiddleware, guards, interceptors
│   │   │   ├── database/       # Drizzle schema (34 tables), migrations, seeds
│   │   │   ├── masters/        # Sites, items, categories, vendors, contractors
│   │   │   ├── procurement/    # Site indents, RFQ comparative, GST POs, Meta WhatsApp
│   │   │   ├── inventory/      # Store inward GRN, weighted stock, site issues
│   │   │   ├── contractors-billing/ # Subcontract BOQ, MB sheets, RA bills, TDS, DLP
│   │   │   ├── dpr/            # Daily Progress Reports with photos & equipment log
│   │   │   ├── labour/         # Contractor muster roll & trade headcount matrix
│   │   │   ├── boq/            # Baseline BOQ budget vs actual site consumption
│   │   │   ├── integrations/   # Tally Prime XML double-entry purchase export
│   │   │   ├── dashboard/      # Role-aware executive analytics & 11 reports
│   │   │   └── notifications/  # In-app alerts, BullMQ queue, Meta Cloud WhatsApp
│   │   └── package.json
│   └── web/                    # Vite + React frontend (@builderp/web)
│       ├── src/
│       │   ├── app/            # Layouts (MainLayout, Sideblock), Contexts, Pages
│       │   ├── components/     # UI primitives, EmptyState, TableSkeleton, ConfirmModal
│       │   ├── styles/         # Tailux tokens, ApexCharts styles
│       │   └── utils/          # Axios interceptors, getMenuTitle helper
│       └── package.json
├── packages/
│   ├── shared/                 # Shared GST engine, TDS math, Zod schemas, types
│   └── config/                 # Shared TypeScript, ESLint, PostCSS configs
├── docs/                       # Architecture, Tenancy, API, Runbook, Deployment
├── scripts/                    # Daily MySQL backup scripts (.sh, .ps1)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 4. Core Subsystem Workflows

### 4.1 Procurement & GST Invoicing Engine
1. **Site Indent:** Site Engineer raises material requisition with urgency rating.
2. **RFQ & Comparative Statement:** Purchase Manager compares multi-vendor quotes side-by-side.
3. **Purchase Order:** Auto-calculates CGST (9%) + SGST (9%) for intra-state Maharashtra, or IGST (18%) for inter-state supply. Generates document number (e.g. `KB/PO/26-27/0001`). Enqueues `PO_APPROVAL` notification for Director.
4. **WhatsApp Dispatch & Approvals:** Meta Cloud API triggers interactive quick-reply buttons directly on the Director's WhatsApp and dispatches signed PDF PO documents to vendors.
5. **Tally Prime / ERP 9 XML Export:** Exports purchase voucher batches in standard double-entry XML format with party debit/credit, ledger accounts, and HSN-wise item breakdowns.

### 4.2 Store Inward & Perpetual Stock Valuation
1. **Store Inward (GRN):** Store Manager performs visual/technical QC, enters delivery challan & invoice numbers, accepts/rejects quantities.
2. **Perpetual Moving Weighted Average:** Updates `stock_balances` using:
   $$\text{New Average Rate} = \frac{(\text{Current Qty} \times \text{Current Rate}) + (\text{Accepted Qty} \times \text{PO Rate})}{\text{Current Qty} + \text{Accepted Qty}}$$
3. **Site Issue:** Issues materials to trade contractors for specific work orders; decreases on-hand balance and records negative ledger entry.
4. **Low Stock Detection:** Automatically fires `LOW_STOCK` notification when balance drops below `reorder_level`.

### 4.3 Contractor RA Billing & Statutory Withholdings
1. **Work Order (WO):** Subcontract order with detailed BOQ items and rates.
2. **Measurement Book (MB Sheet):** Site engineer records physical measurements ($L \times B \times D \times \text{Units} = \text{Total Qty}$).
3. **Running Account (RA) Bill:** Auto-deducts:
   - **5% Retention Money** held in statutory reserve for 6 months DLP (Defect Liability Period).
   - **1% or 2% Section 194C TDS** withheld for Govt Treasury Form 26Q deposit.
   - Material recoveries for cement/steel issued to contractor.

### 4.4 Daily Progress Reports (DPR) & Site Photo Gallery
1. **Site Progress Logging:** Mobile-optimized DPR logging captures daily weather conditions, temperature, and shift (Day/Night).
2. **Work Items & Equipment Logs:** Activity completion tracking against planned quantities and machinery hours (running, idle, breakdown).
3. **High-Resolution Photo Gallery:** Tagged site progress snapshots for quality assurance and stakeholder inspection.
4. **Approval Flow:** Site Incharge / Project Manager verifies and approves DPR records into an unalterable project history log.

### 4.5 Labour Muster Roll & BOQ Consumption Tracking
1. **Count-based Labour Attendance:** Touch-friendly count matrix records deployed contractor workforce classified by trade, skill level (skilled, semi-skilled, unskilled), gender, and supervisor count plus overtime hours.
2. **BOQ vs Site Consumption:** Baseline Bill of Quantities vs actual material store issues and inward receipts with tolerance margin checks (`NORMAL`, `CAUTION`, `BREACHED`).

---

## 5. Security & Isolation Architecture

1. **Tenant Middleware:** Evaluates `X-Tenant-ID` header or host subdomain, resolving tenant context before route execution.
2. **Row-Level Partitioning:** Every database table includes an indexed `tenant_id` foreign key.
3. **Immutable Audit Trail:** All mutations (CREATE, UPDATE, DELETE, APPROVE) are logged to `audit_logs` with JSON Before/After state snapshots.
4. **TOTP Two-Factor Authentication:** RFC 6238 compliant token generation, QR code rendering, and emergency recovery codes.
