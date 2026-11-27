# MASTER PROMPT — Multi-Tenant Construction ERP (SaaS)

> Paste this whole file into Antigravity as the first instruction. Work phase by phase. Do not skip ahead. After each phase, stop, summarise what was built, list how to run it, and wait for my "continue".

---

## 0. Context

You are a senior full-stack architect building a **production-grade, multi-tenant SaaS ERP for construction companies** (builders, developers, contractors) in India.

- **Working name:** `BuildERP` (keep the name in one config constant so it can be renamed later).
- **First client (tenant):** Kings Builders & Developers → `kings.builderp.in`.
- An earlier static demo exists at `D:\demo\goodsmanagement\index.html` (Kings Builders Goods Management System). Use it **only as functional reference** for screens, roles and flow. Do not copy its code.
- A real vendor quotation sample exists at `D:\demo\goodsmanagement\GCS.pdf`. Use it as reference for item lines, HSN codes and GST split (CGST/SGST, mixed 18% / 5% / Exempt rates in one document, amount in words).
- **Frontend template:** Tailux (React 19 + TypeScript + Vite 7 + Tailwind CSS v4) at `D:\demo\goodsmanagement\tailux\ts\starter`. A full demo with more components is at `D:\demo\goodsmanagement\tailux\ts\demo` and docs at `D:\demo\goodsmanagement\tailux\Documentation`.

---

## 1. Tech Stack (fixed — do not change without asking)

### Backend
- **Node.js 22 LTS + NestJS 11 (TypeScript)**: modular, DI, guards, interceptors.
- **ORM:** Prisma with **MySQL 8**.
- **Auth:** JWT access token (15 min) + refresh token (7 days, httpOnly cookie, rotated, stored hashed in DB). Passwords hashed with argon2.
- **Validation:** class-validator + class-transformer (global ValidationPipe, whitelist + forbidNonWhitelisted).
- **Docs:** Swagger at `/api/docs` (disabled in production unless a flag is set).
- **Jobs/queues:** BullMQ + Redis (emails, PDF generation, notifications, scheduled reports).
- **Files:** S3-compatible storage (AWS S3 / Cloudflare R2), with a local-disk driver for dev.
- **PDF:** Puppeteer HTML→PDF for PO, GRN, Material Issue and Quotation documents.
- **Logging:** Pino (nestjs-pino), with a request-id and tenant-id on every log line.
- **Security:** Helmet, CORS (tenant subdomains whitelisted by pattern), rate-limit (@nestjs/throttler), CSRF-safe cookie settings.
- **Testing:** Jest + Supertest (e2e for auth, tenant isolation, PO flow).
- **Config:** @nestjs/config with a Zod-validated `.env`.

### Frontend
- **Tailux TS starter** copied into the monorepo. **Never edit the original `tailux` folder.**
- React Router 7, TanStack Table, react-hook-form + yup (already in the template), axios, ApexCharts, sonner toasts, i18next (keep `en`; add `mr` and `hi` later).
- Add **TanStack Query** for server state.
- Reuse Tailux components (`components/ui`, `components/shared/table`, `components/shared/form`), layouts (`MainLayout` / `Sideblock`), theme provider and auth context. Do not install a second UI kit.

### Infra
- **Monorepo:** pnpm workspaces + Turborepo.
- Docker Compose for local dev (mysql, redis, minio, mailpit).
- Nginx (or Caddy) wildcard subdomain routing, with a wildcard SSL cert for `*.builderp.in`.

---

## 2. Project Structure

Create at `D:\demo\goodsmanagement\` (keep `index.html`, `GCS.pdf`, `assets`, `tailux` untouched):

```
goodsmanagement/
├── apps/
│   ├── api/                 # NestJS backend
│   └── web/                 # Copy of tailux/ts/starter → tenant ERP + super-admin console
├── packages/
│   ├── shared/              # Shared TS types, enums, zod schemas, permission keys
│   └── config/              # eslint / tsconfig / prettier presets
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
├── docs/                    # ARCHITECTURE.md, API.md, TENANCY.md, RUNBOOK.md
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

One web app serves both surfaces and switches by hostname:
- `admin.builderp.in` → **Super Admin Console**
- `{tenant}.builderp.in` → **Tenant ERP**
- `builderp.in` / `www` → simple landing + "find your company" login redirect

---

## 3. Multi-Tenancy Design

### Strategy: shared database, `tenant_id` on every tenant-owned row
- Every tenant table has a `tenantId` column, indexed, with composite unique keys where needed (e.g. `@@unique([tenantId, code])`).
- **Tenant resolution middleware:**
  1. Read the subdomain from the `Host` header (in dev, also allow an `X-Tenant` header and `kings.localhost`).
  2. Look up the tenant (cached in Redis, 5 min).
  3. Reject with 404 if the tenant is missing and 403 if it is suspended.
  4. Store the tenant in AsyncLocalStorage (CLS).
- **Prisma client extension** that automatically injects `where: { tenantId }` on read/update/delete and sets `tenantId` on create for all tenant-scoped models. Raw queries are forbidden outside a reviewed repository helper.
- The JWT carries `tenantId`. A token used on the wrong subdomain gets 401.
- **Super-admin** routes live under `/api/platform/*`, use a separate guard, and bypass the tenant filter explicitly (never implicitly).
- Write **e2e tests proving Tenant A can never read or write Tenant B's data**.

### Tenant lifecycle (Super Admin)
Create tenant → choose subdomain (validated: lowercase, 3–30 chars, reserved words blocked: `admin`, `api`, `www`, `app`, `mail`, `static`) → plan → modules enabled → first tenant-admin user invited by email → status `trial | active | suspended | cancelled`.

---

## 4. Roles & Permissions (RBAC)

### Platform level
- **SUPER_ADMIN**: manages tenants, plans, modules, billing status, global settings, impersonation (logged), audit view, system health.

### Tenant level (seeded defaults; tenant admin can create custom roles)
| Role | Scope |
|---|---|
| **Owner / Boss** | Everything in the tenant, plus final approvals and all reports |
| **Admin** | Users, roles, masters, settings |
| **Purchase Officer** | Vendors, indents → PO, rate comparison |
| **Store Keeper** | GRN, inventory, material issue, stock transfer |
| **Site Manager** | Material requests, issue receipts and consumption for **assigned sites only** |
| **Accounts** | Bills, payments, GST reports, Tally export |
| **Viewer** | Read-only |

- Permissions use a `module.action` format (`po.create`, `po.approve`, `grn.create`, `stock.view`, `report.export` …), defined once in `packages/shared`.
- Use a `@Permissions()` decorator with a guard on the API, and a `<Can permission="">` component plus route guards in the web app.
- **Data scoping:** Site Manager and Store Keeper see only their assigned sites and warehouses.
- **Approval matrix** per tenant: PO approval levels by amount (e.g. ≤ ₹50k: Purchase Officer; ≤ ₹5L: Admin; above: Owner).

---

## 5. Modules (build in this order)

### 5.1 Platform (Super Admin)
Tenants CRUD, plans (Starter / Growth / Enterprise with user, site and module limits), module toggles per tenant, usage stats, impersonate tenant admin (banner + audit), global announcements.

### 5.2 Tenant Setup
- **Company profile:** legal name, GSTIN, PAN, state code (drives CGST+SGST vs IGST), address, logo, bank details, document prefixes, financial year.
- **Branding:** logo and primary colour, applied through Tailux theme tokens.

### 5.3 Masters
- **Item categories** (tree)
- **Units** (with conversions, e.g. bag ↔ kg)
- **Items:** code, name, category, unit, HSN/SAC, GST rate (0 / 5 / 12 / 18 / 28 / Exempt), reorder level, brand
- **Warehouses / stores**
- **Sites / projects:** code, name, client, address, start/end dates, status, assigned users
- **Vendors:** GSTIN validation, PAN, state, contacts, bank, payment terms, rating
- **Contractors**
- **Tax master**
- **Document number series**

### 5.4 Procurement (core flow)
1. **Material Request / Indent** from site → approval
2. **RFQ / vendor quotations**, with a rate comparison sheet (lowest highlighted)
3. **Purchase Order:** lines carry item, HSN, qty, unit, rate, discount %, GST rate. Auto **CGST+SGST (intra-state) or IGST (inter-state)** based on the vendor's state vs the company state. Exempt lines are supported. Totals, round-off and amount in words (Indian format). Terms, delivery site, approval workflow (matrix), PDF, email to vendor. Statuses: `draft → pending_approval → approved → partially_received → closed / cancelled`.
4. **GRN (Goods Receipt):** against a PO, with received, accepted and rejected qty, a photo upload, and a short-receipt flag.
5. **Purchase bill entry** with a 3-way match (PO ↔ GRN ↔ Bill) and mismatch warnings.

### 5.5 Inventory
- Stock ledger, the **single source of truth**: every movement is a ledger row, and balances are derived and cached.
- Stock by warehouse and by site, with a weighted-average valuation.
- **Material Issue** to site/contractor, recording purpose and the person who received it.
- **Inter-site / warehouse transfer** (dispatch → receive)
- Returns from site, scrap / wastage entry
- Low-stock alerts (reorder level)
- Physical stock audit with variance posting (requires approval)

### 5.6 Site Operations (Phase 2)
Contractor work orders, RA bills, daily progress report (photos), labour attendance (count-based), site-wise consumption vs BOQ.

### 5.7 Reports & Dashboard
- **Dashboard (role-aware):** stock value, pending approvals, open POs, pending GRNs, low-stock items, site-wise consumption (chart), top vendors, recent activity.
- **Reports:** PO register, GRN register, stock summary, stock ledger, item movement, site consumption, vendor-wise purchase, GST input summary (rate-wise taxable / CGST / SGST / IGST, like the quotation footer), ageing.
- All reports: filter, sort, column toggle (Tailux table), export to Excel/CSV/PDF.

### 5.8 Notifications & Integrations
- In-app notification centre, email (SMTP/Resend), and WhatsApp hooks (interface only in v1: approvals, PO sent, low stock)
- **Tally XML export** for purchases (Phase 2)

### 5.9 Cross-cutting
- **Audit log:** who, what, before/after JSON, IP, tenant; viewable by Owner/Admin.
- Soft delete everywhere, plus `createdBy` / `updatedBy`.
- Attachments on any document.
- Global search (items, vendors, POs).
- Financial-year aware document numbering, e.g. `KB/PO/26-27/0001`.

---

## 6. Database Rules (Prisma + MySQL)
- `id`: BIGINT autoincrement internally, plus a `uuid` public id exposed in APIs and URLs.
- Money: `Decimal(14,2)`. Qty: `Decimal(14,3)`. Rates: `Decimal(14,4)`. **Never use floats.**
- Timestamps in UTC; the UI shows IST.
- Every tenant table has `tenantId` + an index, `createdAt`, `updatedAt`, `deletedAt`, `createdById`.
- Wrap stock-affecting operations in transactions, with row locking on the stock balance.
- Provide a `prisma/seed.ts`: 1 super admin, a demo tenant **Kings Builders & Developers** (`kings`), all default roles, demo users per role, ~50 items (cement, steel, sand, aggregate, bricks, pipes, electrical, plus housekeeping items from the GCS quotation with their HSN codes), 5 sites, 8 vendors, sample POs/GRNs/issues.

---

## 7. API Conventions
- REST under `/api/v1`, with the tenant inferred from the host.
- Response envelope: `{ success, data, meta: { page, limit, total } }`; errors: `{ success: false, error: { code, message, details } }`.
- Pagination, sorting and filters are consistent across list endpoints (`?page=&limit=&sort=createdAt:desc&search=&status=`).
- Idempotency key support on the PO create, GRN create and issue endpoints.
- Generate a typed API client for the web app from Swagger (orval or openapi-typescript).

---

## 8. Frontend Rules
- Start from Tailux `MainLayout` (or `Sideblock`), and keep its theme switcher, dark mode, RTL safety and responsive sidebar.
- **Sidebar for the tenant ERP:** Dashboard · Masters · Procurement · Inventory · Sites · Reports · Settings (filtered by permission).
- Every list page uses Tailux TanStack Table components: search, faceted filters, column visibility, row selection, bulk actions, pagination, export.
- Every form uses react-hook-form + yup, with inline errors and a sticky footer holding Save/Cancel.
- The **PO form** must feel like a spreadsheet: keyboard navigation, add row with Enter, live tax/total calculation, item search combobox (Tailux `StyledCombobox`).
- **Print/PDF preview** for PO, GRN and Issue using `react-to-print` and a clean A4 layout with company logo, GSTIN, bank details and signature block.
- Mobile-friendly screens for Site Manager: material request, receive issue, upload photo.
- Loading skeletons, empty states (Tailux illustrations), toasts for every mutation, and confirm modals for destructive actions.
- **No demo credentials on the login page in production builds.** Show them only when `VITE_SHOW_DEMO_LOGINS=true`.

---

## 9. Non-Functional Requirements
- Tenant isolation is tested (see §3).
- p95 API response under 300 ms on lists of up to 10k rows (indexes, pagination).
- OWASP basics: rate-limited login, lockout after 5 failed attempts, password policy, 2FA (TOTP) optional per tenant.
- Backups: a daily MySQL dump script plus documentation.
- `.env.example` for both apps. Never commit secrets.
- ESLint + Prettier pass, with zero TypeScript errors, before each phase is marked done.

---

## 10. Build Phases (stop after each)

| Phase | Deliverable |
|---|---|
| **P0** | Monorepo scaffold, Docker Compose, NestJS base (config, logger, health, Swagger), web app copied from Tailux and running, README with run steps |
| **P1** | Prisma schema (platform + tenancy + auth + RBAC), tenant middleware + Prisma extension, auth (login/refresh/logout/forgot password), tenant isolation e2e tests |
| **P2** | Super Admin Console: tenants, plans, modules, impersonation |
| **P3** | Tenant setup + all Masters (API + UI) |
| **P4** | Procurement: Indent → RFQ/comparison → PO (GST engine, approvals, PDF, email) |
| **P5** | GRN + Inventory ledger + Issue + Transfer + Returns + Low-stock alerts |
| **P6** | Role-aware dashboard + reports + exports + audit log UI |
| **P7** | Notifications (in-app + email), seed data polish, deployment guide (VPS/AWS, Nginx wildcard, SSL, PM2/Docker) |
| **P8** | Phase-2 modules: contractors' RA bills, DPR, Tally export, WhatsApp |

**For every phase:** write the code, run migrations, seed, run lint + tests, then report:
1. What was built
2. Files changed
3. How to run and test
4. Known gaps

---

## 11. Working Rules for You (Antigravity)
1. Ask before changing the stack, folder layout or tenancy strategy.
2. Don't invent business rules. If something is unclear (e.g. approval limits, numbering format), use the defaults here and list them under "Assumptions" in the phase report.
3. Keep business logic in services. Controllers stay thin; repositories are tenant-safe.
4. The GST calculation lives in **one tested pure function** in `packages/shared`, used by both API and UI. Unit-test it against the GCS.pdf quotation: taxable ₹20,035.00, CGST ₹1,446.65, SGST ₹1,446.65, grand total ₹22,928.30, mixing 18%, 5% and Exempt lines.
5. Commit after each phase with a clear message.
6. Update the docs in `/docs` as you go.

**Start with Phase P0 now.**
