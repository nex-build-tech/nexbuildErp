# BuildERP: Phase-wise Prompts for Antigravity

**How to use**
1. Put `MASTER_PROMPT_BuildERP.md` in the project root (`D:\demo\goodsmanagement\`).
2. Paste **one prompt at a time**.
3. Paste the next prompt only after:
   - you've checked the result,
   - it runs, and
   - the checklist at the end of that phase passes.
4. If something breaks, use the **Fix prompt** at the bottom before moving on.

---

## Prompt 0: Kick-off (paste once)

```
Read MASTER_PROMPT_BuildERP.md in the project root fully. It is the single source of truth for this project.
Do NOT write any code yet.
Reply with:
1. Your understanding of the product in 5–6 lines
2. The final folder structure you will create
3. Any questions or conflicts you see in the master prompt
4. Confirmation that you will work phase by phase and stop after each phase
```

---

## Prompt P0: Project Setup

```
Start Phase P0 from MASTER_PROMPT_BuildERP.md.

Do only this:
- Create pnpm + Turborepo monorepo at D:\demo\goodsmanagement with apps/api, apps/web, packages/shared, packages/config, docker/, docs/
- Copy tailux/ts/starter into apps/web (do not touch the original tailux folder). Make sure it runs.
- Create NestJS app in apps/api with: config module (zod-validated .env), Pino logger, global validation pipe, response envelope interceptor, global exception filter, /api/v1/health endpoint, Swagger at /api/docs
- Prisma installed and connected to MySQL (empty schema for now)
- docker-compose.yml with mysql 8, redis, minio, mailpit
- .env.example for api and web
- Root README with exact run commands

Do NOT build any business module yet.
When done: run lint + build for both apps, then give the phase report (what built, files, how to run, gaps). Stop and wait.
```

✅ **Check before moving on:** `docker compose up` works, the API health endpoint returns OK, Swagger opens, and the Tailux web app opens in the browser.

---

## Prompt P1: Database, Multi-Tenancy & Auth

```
Start Phase P1.

Build:
1. Prisma schema for: Tenant, Plan, TenantModule, User, Role, Permission, RolePermission, UserRole, UserSite (scoping), RefreshToken, AuditLog. Follow DB rules in section 6 (uuid public id, Decimal, soft delete, tenantId index).
2. Tenant resolution middleware (subdomain from Host, X-Tenant header + kings.localhost for dev, Redis cache, 404/403 rules) using AsyncLocalStorage (nestjs-cls).
3. Prisma client extension that auto-applies tenantId on all tenant-scoped models.
4. Auth: login, refresh (httpOnly cookie, rotation), logout, forgot/reset password, me endpoint. argon2 hashing. Login rate limit + lockout after 5 attempts.
5. RBAC: permission keys in packages/shared, @Permissions() decorator + guard, SUPER_ADMIN platform guard.
6. Seed: 1 super admin, tenant "Kings Builders & Developers" (subdomain kings), default roles with permissions, 1 demo user per role.
7. Web: connect Tailux auth context + login page to real API, store access token in memory, auto refresh with axios interceptor. Demo logins visible only if VITE_SHOW_DEMO_LOGINS=true.
8. e2e tests: tenant A cannot read/write tenant B data, wrong subdomain token = 401.

Stop after report.
```

✅ **Check before moving on:** login works on `kings.localhost`, the tenant isolation tests pass, and the refresh token works after 15 minutes.

---

## Prompt P2: Super Admin Console

```
Start Phase P2.

Build on admin subdomain (admin.localhost in dev):
- Super Admin login + separate layout using Tailux
- Tenants: list (Tailux table with search/filter), create (subdomain validation + reserved words), edit, suspend/activate
- Plans: CRUD with limits (users, sites, modules)
- Module toggles per tenant
- Invite first tenant admin by email (mailpit in dev)
- Impersonate tenant admin (banner shown + audit logged)
- Platform dashboard: total tenants, active users, tenants by plan

Web app must decide admin vs tenant mode by hostname.
Stop after report.
```

✅ **Check before moving on:** you can create a new test tenant, log in to it on its subdomain, and impersonating it gets logged.

---

## Prompt P3: Tenant Setup & Masters

```
Start Phase P3.

Build API + UI (Tailux tables and react-hook-form+yup forms) for:
- Company profile: GSTIN, PAN, state code, address, logo, bank, document prefixes, financial year
- Item Categories (tree), Units (with conversions), Items (HSN, GST rate incl. Exempt, reorder level)
- Warehouses, Sites/Projects (assign users), Vendors (GSTIN validation, state, bank, terms), Contractors
- Document number series (format like KB/PO/26-27/0001, FY aware)
- Users & Roles management for tenant admin (custom roles, permission matrix UI)
- Tenant sidebar: Dashboard, Masters, Procurement, Inventory, Sites, Reports, Settings — filtered by permission

Every list: search, filters, column toggle, pagination, export CSV/Excel.
Seed ~50 items (construction + GCS.pdf housekeeping items with HSN), 5 sites, 8 vendors.
Stop after report.
```

✅ **Check before moving on:** all masters work for CRUD, a Site Manager sees only their assigned sites, and exports download correctly.

---

## Prompt P4: Procurement (Indent → PO)

```
Start Phase P4.

First build the GST engine as a pure function in packages/shared:
- CGST+SGST if vendor state = company state, else IGST
- Line discount, mixed rates (0/5/12/18/28/Exempt), rate-wise tax summary, round-off, amount in words (Indian format)
- Unit test against GCS.pdf: taxable 20,035.00, CGST 1,446.65, SGST 1,446.65, total 22,928.30

Then build:
1. Material Request / Indent from site → approval
2. RFQ + vendor quotations + rate comparison sheet (lowest highlighted) → create PO from selected quote
3. Purchase Order: spreadsheet-like line entry (keyboard nav, item combobox, live totals), terms, delivery site, approval matrix by amount, status flow, PDF (Puppeteer, A4, logo, GSTIN, bank, signature), email to vendor
4. Print preview with react-to-print
5. Notifications to approvers (in-app)
6. Idempotency key on PO create

Stop after report.
```

✅ **Check before moving on:** the GST test passes, a PO goes all the way from draft → approval → PDF → email, and approval limits are respected.

---

## Prompt P5: GRN & Inventory

```
Start Phase P5.

Build:
- GRN against PO: received / accepted / rejected qty, photo upload, short receipt, updates PO status (partially_received / closed)
- Purchase bill entry with 3-way match (PO-GRN-Bill) + mismatch warning
- Stock ledger as single source of truth (every movement = ledger row), weighted average valuation, DB transactions with row locks
- Stock summary by warehouse and site
- Material Issue to site/contractor (purpose, received by)
- Inter-site / warehouse transfer (dispatch → receive)
- Returns from site, scrap/wastage
- Low-stock alerts (reorder level)
- Physical stock audit with variance posting after approval
- Mobile-friendly screens for Site Manager (request, receive, photo)

Write tests: stock never goes negative, concurrent issues don't corrupt balance.
Stop after report.
```

✅ **Check before moving on:** PO → GRN → issue → transfer stock numbers match the ledger, and stock can't go negative.

---

## Prompt P6: Dashboard, Reports & Audit

```
Start Phase P6.

Build:
- Role-aware dashboard (ApexCharts): stock value, pending approvals, open POs, pending GRNs, low stock, site-wise consumption, top vendors, recent activity
- Reports: PO register, GRN register, stock summary, stock ledger, item movement, site consumption, vendor-wise purchase, GST input summary (rate-wise taxable/CGST/SGST/IGST), ageing
- All reports: date range, filters, sort, column toggle, export Excel/CSV/PDF
- Audit log viewer (before/after diff) for Owner/Admin
- Global search (items, vendors, POs)

Make sure list APIs stay < 300ms with 10k rows (add indexes, check queries).
Stop after report.
```

✅ **Check before moving on:** each role sees the correct dashboard, the GST summary matches the PO data, and exports open correctly in Excel.

---

## Prompt P7: Notifications, Polish & Deployment

```
Start Phase P7.

Build:
- Notification centre (in-app) + email via BullMQ queue (PO approval, PO sent, GRN done, low stock)
- WhatsApp notification interface (provider-agnostic, stub implementation)
- Optional TOTP 2FA per tenant
- Tenant branding (logo + primary colour via Tailux theme tokens)
- Empty states, skeletons, toasts, confirm modals everywhere
- Final seed polish for a clean Kings Builders demo
- Daily MySQL backup script
- docs/: ARCHITECTURE.md, TENANCY.md, API.md, RUNBOOK.md
- Deployment guide: VPS/AWS, Nginx wildcard subdomain, wildcard SSL, Docker/PM2, env setup

Run full lint, type-check, all tests. Stop after report.
```

✅ **Check before moving on:** a fresh setup runs from the README alone, the full demo flow works on `kings`, and all tests are green.

---

## Prompt P8: Phase-2 Modules (when needed)

```
Start Phase P8.

Build:
- Contractor work orders + RA bills (measurement, retention, deductions)
- Daily Progress Report with photos (mobile-friendly)
- Labour attendance (count-based)
- Site consumption vs BOQ
- Tally XML export for purchases
- WhatsApp provider integration (Meta Cloud API) for approvals and PO sharing

Stop after report.
```

---

## Utility Prompts (use anytime)

**Fix / debug**
```
Something is broken: [paste error / describe issue].
Find the root cause, fix it without changing the agreed architecture, re-run lint + tests, and tell me what was wrong.
```

**Review a phase before moving on**
```
Before we continue, review everything built in Phase [X] against MASTER_PROMPT_BuildERP.md.
List: missing items, deviations, security issues (especially tenant isolation), and fix them.
```

**Change request**
```
Change request: [describe].
First tell me which modules/files are affected and the risk. Wait for my OK before coding.
```

**Resume in a new session**
```
Read MASTER_PROMPT_BuildERP.md and docs/. Check git log to find the last completed phase.
Summarise current status in 5 lines, then continue with the next phase only after I confirm.
```
