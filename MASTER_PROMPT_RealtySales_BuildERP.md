# MASTER PROMPT — Realty Sales & CRM module inside BuildERP

> Put this file in the project root `D:\demo\goodsmanagement\` next to `MASTER_PROMPT_BuildERP.md`.
> It **extends** BuildERP. It does **not** create a new app. Use the phase prompts in §12 one at a time.

---

## 0. GOAL

Add a new product area, **"Realty Sales & CRM"**, to the existing BuildERP construction ERP. It lets the builder (first tenant: **Kings Builders & Developers**, slug `kings`) sell flats and collect money in the same system that runs procurement, stores, contractors, DPR and BOQ. It is the sales side of the business, comparable to Sell.Do, and replaces the legacy Newton "Flat Deal" software.

**Scope:**

- **Modules 1–5: fully working** (Drizzle tables + NestJS APIs + Tailux pages):
  1. Marketing & Lead Capture
  2. Pre-Sales & Sales (leads, follow-ups, site visits)
  3. Unit Inventory & Negotiation (inventory grid, cost sheet, payment plans)
  4. Channel Partners (brokers, lead tagging, brokerage)
  5. Post-Sales & Collections (booking, demands, receipts, ledger, interest, letters, cancellation/transfer, reports)
- **Modules 6–10: "Coming Soon" pages that still look real:**
  6. Customer Experience Hub
  7. Communication Hub
  8. AI Intelligence
  9. Advanced Analytics
  10. Integrations Marketplace

  Each has a sidebar item with a "Soon" badge, a blurred live-mock preview, feature cards and a "Request early access" button.
- **Separate roles**: sales and CRM staff see **only** the Realty menus. Construction roles (store, purchase, sitemgr) do **not** see Realty. `boss` and `admin` see everything.
- **Per-tenant module switch**: Super Admin can enable or disable "Realty Sales" for each tenant.

---

## 1. EXISTING PROJECT — FOLLOW IT EXACTLY (read before coding)

Read these first and copy their patterns:
- `docs/ARCHITECTURE.md`, `docs/TENANCY.md`, `docs/API.md`, `MASTER_PROMPT_BuildERP.md`

| Concern | Existing convention (reuse; do NOT replace) |
|---|---|
| Monorepo | pnpm workspaces + Turborepo: `@builderp/api`, `@builderp/web`, `@builderp/shared`, `@builderp/config` |
| Backend | **NestJS 11** modules: `module` + `controller` + `service`, Swagger decorators, Pino logger |
| ORM | **Drizzle ORM + mysql2**, schema in `apps/api/src/database/schema/`, migrations via `pnpm db:generate` / `db:push`. **Do NOT introduce Prisma** (the old README mentions it; ignore that). |
| DB | MySQL 8 / MariaDB on port 3307 (dev). `bigint` autoincrement `id` + `uuid varchar(36)` + `tenant_id` + `created_at/updated_at/deleted_at`. Indexes are named like `xxx_tenant_idx`, and uniques are `(tenant_id, code/number)`. |
| Tenancy | `TenantMiddleware` resolves the tenant from the `X-Tenant` header or subdomain (default `kings` in dev). Get it with `@CurrentTenant() tenant: TenantContext`. **Every query filters by `tenant.id`.** |
| Auth / RBAC | `JwtAuthGuard`, `@CurrentUser()`, `@Permissions()` decorator + `PermissionsGuard` (role `boss` = wildcard). Permission constants live in `packages/shared/src/permissions/index.ts`. Seeded into the `permissions` / `role_permissions` tables in `apps/api/src/database/seed.ts`. |
| Responses | Existing response-envelope interceptor + exception filters |
| Numbering | Reuse the **`document_series`** table (prefix, financial_year, next_number, padding), e.g. `KB/BK/26-27/0001` |
| Audit | Write every create/update/delete/approve to **`audit_logs`** (diff_json before/after) |
| Notifications | Reuse `NotificationsModule` (in-app + BullMQ/in-memory queue) and the **WhatsApp provider interface** (Meta Cloud + stub) |
| Accounting | Extend `integrations/tally` to also export **receipt vouchers** |
| GST / TDS math | Put new real-estate tax helpers next to the existing GST engine in `packages/shared/src/gst` |
| Frontend | `apps/web`: Tailux (React 19 + Vite 7 + Tailwind 4), TSX. Pages in `src/app/pages/<area>/<page>/index.tsx`. Lazy routes in `src/app/router/protected.tsx`. Sidebar from `src/app/navigation/baseNavigation.ts` + `segments/*.ts` + `icons.ts` + `navigation/index.ts`. |
| UI kit | Tailux components in `src/components/ui`, plus the existing shared `EmptyState`, `TableSkeleton`, `ConfirmModal`, `sonner` toasts, Heroicons, react-apexcharts, TanStack Query + Table, react-hook-form, axios `src/lib/api-client.ts`. **No new UI library.** |
| Theme | Tenant primary colour (Kings gold `#c5a04e`) via CSS vars. Light + dark mode. |

**Naming collision warning:** the table `units` already exists (units of measure). All new tables use the prefix **`re_`** (real estate), e.g. `re_units`, `re_bookings`. API routes live under **`/api/v1/realty/...`** and web routes under **`/realty/...`**.

**Project = Site:** reuse the existing **`sites`** table as the real-estate project, so construction and sales share one project record. Add a `re_project_settings` table (1:1 with site) for sales-only fields (RERA no, launch/possession dates, stamp duty %, interest rate, etc.).

---

## 2. ROLES & PERMISSIONS (separate from construction)

Add these to `packages/shared/src/permissions/index.ts` (new keys, pattern `realty.<area>.<action>`):

```
realty.lead.view/create/edit/delete/assign/import/export
realty.sitevisit.view/manage
realty.campaign.view/manage
realty.inventory.view/hold/block/release/manage
realty.costsheet.create/approve
realty.plan.manage            (pay stages, schemes, charge heads, price list)
realty.cp.view/manage/approve
realty.brokerage.view/approve/pay
realty.booking.view/create/edit/approve/cancel/transfer
realty.demand.view/generate/send
realty.receipt.view/create/approve/bounce
realty.ledger.view
realty.interest.manage/waive
realty.letter.manage/send
realty.report.view/export
realty.settings.manage
```

Seed these new roles for every tenant (in `seed.ts` + a separate idempotent `seed-realty.ts`):

| Role code | Name | Gets |
|---|---|---|
| `sales_head` | Sales Head | all `realty.*` except receipt approve, interest waive, brokerage pay |
| `presales` | Pre-Sales Executive | lead view/create/edit, sitevisit, campaign view, inventory view |
| `sales_exec` | Sales Executive | lead (own), sitevisit, inventory view/hold, costsheet create, booking create |
| `crm_exec` | CRM / Post-Sales Executive | booking view/edit, demand generate/send, receipt create, ledger, letters, reports |
| `crm_accounts` | Collections Accountant | receipt approve/bounce, interest manage, ledger, brokerage approve/pay, reports, Tally export |
| `channel_partner` | Channel Partner (external) | CP portal only (own tagged leads, scoped inventory, own brokerage) |

- `boss` = wildcard (already). `admin` also gets all `realty.*`.
- Existing roles `store`, `purchase` and `sitemgr` get **no** `realty.*` permissions.
- Seed demo users:

  | Username | Password | Role |
  |---|---|---|
  | `saleshead` | `sales123` | sales_head |
  | `presales` | `pre123` | presales |
  | `salesexec` | `exec123` | sales_exec |
  | `crm` | `crm123` | crm_exec |
  | `collections` | `acc123` | crm_accounts |
  | `cp_demo` | `cp123` | channel_partner, linked to a demo CP firm |

**Frontend visibility:**
- Find the existing mechanism that filters sidebar/routes by role or permission (Sidebar Menu components, `AuthGuard`, auth context). Extend it so each NavigationTree item can declare `permission?: string` (or `roles?: string[]`). Items the user lacks are hidden, and the matching routes show the existing 401 page.
- When a sales role logs in, the **default landing page is `/realty/dashboard`**, not the construction dashboard.
- `channel_partner` gets a **minimal CP portal layout** (no ERP menus at all).

**Tenant module switch:**
- Add a table `tenant_modules (tenant_id, module_code, enabled)` with module codes `REALTY_SALES`, `REALTY_CP_PORTAL`, `REALTY_CUSTOMER_HUB`.
- Add toggles on the Super Admin → Tenants page.
- API guard `@RequireModule('REALTY_SALES')` returns 403 when disabled. The UI hides the Realty menus.

---

## 3. DATA MODEL — new Drizzle file `apps/api/src/database/schema/realty.ts`

Export it from `schema/index.ts`. Every table has `id, uuid, tenant_id (indexed), created_by, created_at, updated_at, deleted_at` unless stated. Money uses `decimal(15,2)`, rates/percentages `decimal(7,4)`, areas `decimal(10,2)`.

**Project setup**
- `re_project_settings`: site_id (unique), rera_no, launch_date, possession_date, stamp_duty_pct (default 6), metro_cess_pct, registration_pct (1) + registration_cap (30000), interest_rate_pa, interest_grace_days, gst_rate_under_construction (5 / 1 affordable), hold_hours_default, cp_tag_validity_days (60), letterhead_html, bank_details_text
- `re_phases` (site_id, name), `re_wings` (phase_id, name, total_floors)
- `re_floors` (wing_id, name, level_no: Ground = 0)
- `re_unit_types` (code, name, category RES/COM, default carpet area); examples: 1RK, 1BHK-320, Shop
- `re_units`: site_id, wing_id, floor_id, unit_no, unit_type_id, carpet_area, balcony_area, terrace_area, saleable_area, facing, base_rate, floor_rise_rate, plc_amount, status enum, hold_by, hold_till, is_investor
  - status enum: `available, hold, blocked, booked, agreement, registered, possession, cancelled, not_for_sale`
  - unique `(tenant_id, wing_id, unit_no)`
- `re_parking_slots` (site_id, wing_id, type open/stilt/podium/basement, slot_no, price, status, booking_id)
- `re_charge_heads` (code, name, calc_type fixed/per_sqft/pct_of_agreement/per_month, default_value, gst_applicable, gst_rate, sequence)
  - seed: Development, Legal, Society Formation, Club House, Water, Electricity/MSEB, Corpus, Advance Maintenance (months), Share Money, Municipal Tax, MNGL, Solar/Rainwater, EDC/IDC, IFMS, PLC, Parking
- `re_pay_stages` (site_id, code A..Z, name, default_pct, sequence, is_construction_linked, status pending/completed, completed_on, certificate_file, linked_boq_item_id nullable, linked_dpr_id nullable)
- `re_schemes` (site_id, name, gst_mode with/without, unit_type_ids json, floor_from, floor_to, stamp_by_builder bool, registration_by_builder bool, max_discount_pct, active)
- `re_scheme_stages` (scheme_id, pay_stage_id, pct). **Validate that the total is 100.**

**CRM**
- `re_lead_sources`, `re_campaigns` (name, source_id, site_id, budget, start/end, utm_*)
- `re_leads`:
  - contact: name, mobile, alt_mobile, email, city
  - requirement: budget_min/max, config_pref, purpose
  - origin: source_id, campaign_id, cp_id, site_id
  - status: stage, sub_stage, lost_reason, score, temperature hot/warm/cold
  - ownership: presales_owner_id, sales_owner_id, next_followup_at, first_response_at, sla_breached
  - dedupe: duplicate_of_id
  - unique-ish index `(tenant_id, mobile, site_id)` for dedupe
- `re_lead_activities` (lead_id, type call/whatsapp/sms/email/note/stage_change/assign, outcome, duration_sec, notes, at, user_id)
- `re_followups` (lead_id, due_at, type, assigned_to, status, done_at, outcome)
- `re_site_visits` (lead_id, site_id, scheduled_at, status scheduled/confirmed/done/no_show/rescheduled, attended_by, feedback, is_revisit)
- `re_routing_rules` (name, conditions json, user_pool json, strategy round_robin/load, sla_minutes, active)

**Negotiation & booking**
- `re_cost_sheets` (lead_id, unit_id, scheme_id, rate, discount_pct, lines json, totals, valid_till, status draft/pending_approval/approved/rejected/shared, approved_by)
- `re_approvals` (generic: entity, entity_id, level, approver_role, status, remarks, acted_by, acted_at)
- `re_bookings`:
  - booking_no (document_series `BK`), unit_id, lead_id, cp_id, scheme_id, booking_date, area_basis
  - pricing: sold_rate, basic_cost, floor_rise_amt, plc_amt, discount_pct, discount_amt, net_cost, agreement_value
  - taxes: gst_pct, gst_amt, stamp_duty, registration_fee, stamp_by_builder, reg_by_builder
  - totals: other_charges_total, grand_total_incl_gst, grand_total_excl_gst
  - status `draft, pending_approval, booked, agreement_done, registered, possession, cancelled, transferred`
  - milestones: agreement_date, registration_date, registration_no, loan_bank, loan_amount, possession_date
- `re_booking_applicants`:
  - booking_id, type primary/co1/co2/co3, title, first/middle/last name, dob, gender, occupation
  - **pan, aadhaar_enc (AES-256-GCM encrypted; show only last 4)**
  - mobile, email, phones, permanent/correspondence address, same_as flag, city/state/pincode, relation
- `re_booking_documents` (booking_id, type pan/aadhaar/photo/agreement/registration/allotment/other, file_url, private=true)
- `re_booking_charges` (booking_id, charge_head_id, amount, gst_amt)
- `re_booking_parkings` (booking_id, slot_id, price)
- `re_payment_schedule` (booking_id, pay_stage_id, pct, amount, gst_amt, due_date, demand_id, paid_amount, status not_due/demanded/partly_paid/paid/overdue)

**Collections**
- `re_demands` (demand_no series `DM`, booking_id, pay_stage_id, demand_date, due_date, principal, gst, interest_carried, total, pdf_url, sent_via, sent_at, status)
- `re_receipts`:
  - receipt_no series `RC`, booking_id, receipt_date
  - against: stage/other_charge/gst/stamp/registration/interest/maintenance/extra_work; pay_stage_id
  - instrument: mode cash/cheque/dd/neft/rtgs/imps/upi/swift/online, instrument_no, instrument_date, drawn_on_bank, deposit_bank_id
  - amount, tds_applicable, tds_pct, tds_amount, gst_component
  - status `draft, pending_approval, passed, hold, bounced, cancelled`; realised_on, bounce_charges, narration
  - attachment_url, tally_synced
- `re_receipt_allocations` (receipt_id, schedule_id or charge, amount). FIFO by default.
- `re_ledger_entries` (booking_id, entry_date, doc_type, doc_id, debit, credit, narration). The running balance is computed.
- `re_interest_entries` (booking_id, schedule_id, from, to, days, rate, amount, waived_amount, waiver_approval_id)
- `re_credit_notes`, `re_cancellations` (received_till_date, cancellation_charges, tds, gst_reversal, refund_amount, refund_status), `re_transfers`
- `re_letter_templates` (type demand/allotment/welcome/agreement_intimation/possession/noc/reminder/interest/cancellation/other, name, body_html with `{{merge_fields}}`)
- `re_letters_issued`

**Channel partners**
- `re_channel_partners` (firm_name, contact_person, mobile, email, rera_no, pan, gstin, bank json, status pending_kyc/active/suspended, tier silver/gold/platinum, agreement_accepted_at, agreement_ip, user_id)
- `re_cp_project_access` (cp_id, site_id)
- `re_cp_lead_tags` (lead_id, cp_id, tagged_at, valid_till, status active/expired/rejected_duplicate/converted, evidence)
- `re_brokerage_slabs` (site_id, tier, from_count, to_count, pct)
- `re_brokerage_entries` (booking_id, cp_id, base, pct, brokerage, gst, tds_194H, net, status accrued/eligible/invoiced/approved/paid, eligible_rule)
- `re_cp_payouts`

**Misc**
- `re_feature_interest` (module_code, user_id, note), used by the Coming Soon "Request early access" button

Add `document_series` rows per tenant: `BK` (booking), `DM` (demand), `RC` (receipt), `CS` (cost sheet), `CN` (credit note), `CX` (cancellation).

---

## 4. BACKEND — `apps/api/src/realty/` (one parent folder, sub-modules)

```
realty/
  realty.module.ts            imports all below; register in app.module.ts
  common/                     RequireModule guard, realty pricing.service, ledger.service, interest.service, encryption util
  setup/                      project settings, phases/wings/floors (bulk), unit types, units (bulk generate), parking, charge heads, pay stages, schemes
  crm/                        sources, campaigns, leads (+public webhook, import, dedupe, scoring, routing, SLA cron), activities, follow-ups, site visits
  inventory/                  grid API, hold/block/release (+expiry cron), cost sheets (+approval)
  channel-partners/           onboarding (public), CP CRUD/approval, tagging, brokerage engine, payouts, CP-portal endpoints
  post-sales/                 bookings (+approval, schedule generation), stages→demands (bulk), receipts (+maker-checker, bounce), ledger/SOA, interest, credit notes, cancellation, transfer, letters (templates + bulk PDF)
  reports/                    collection, outstanding & ageing, demand vs collection, receipt register, flat status, customer list, member ledger, interest, cancelled, parking, TDS, GST
  dashboard/                  sales KPIs + post-sales KPIs
```

Rules:
- All controllers use `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions(...)` + `@RequireModule('REALTY_SALES')`, Swagger tags `realty-*`, DTOs validated with zod/class-validator as in the existing code. **No `any` in new code.**
- All money math lives in `pricing.service.ts` and `ledger.service.ts`, with **Jest unit tests**:
  - cost sheet, scheme totals = 100
  - GST on under-construction property
  - stamp duty & registration cap
  - TDS 194-IA (1% when agreement value ≥ ₹50 L)
  - FIFO allocation, interest days × rate
  - brokerage slab + 194H TDS
  - cancellation refund
- PDFs (receipt, demand, cost sheet, booking form, letters, SOA): reuse whatever PDF/print approach the PO module uses. If none exists, add one server-side generator in `realty/common/pdf`. Use the tenant letterhead, logo and primary colour.
- Notifications: new types `LEAD_ASSIGNED, SLA_BREACH, FOLLOWUP_DUE, COSTSHEET_APPROVAL, BOOKING_APPROVAL, RECEIPT_APPROVAL, DEMAND_SENT, CHEQUE_BOUNCED, CP_REGISTERED`. Use the WhatsApp provider (stub in dev) to send demand letters and receipts.
- Cron jobs (existing queue): hold expiry, SLA breach, follow-up reminders, nightly interest accrual, CP tag expiry.
- Public endpoints, excluded from JWT but tenant-resolved, with API key + rate limit:
  - `POST /api/v1/realty/public/leads` (website/Meta/portal webhook)
  - `POST /api/v1/realty/public/cp-register`

**Construction ↔ Sales link (key differentiator):**
- In Pay Stages, allow linking a stage to a BOQ item or DPR milestone.
- When a Site Manager approves a DPR that completes a linked milestone, create a notification for `crm_exec`: "Slab 5 complete at Kings Heights: 42 bookings eligible for demand". **Do not auto-send.** CRM reviews and bulk-generates.

---

## 5. FRONTEND — `apps/web/src/app/pages/realty/...`

**Navigation** (new segment files + entries in `baseNavigation.ts`, `navigation/index.ts` and `icons.ts`; Heroicons):

```
Realty Sales (root, permission realty.lead.view)
  Sales Dashboard            /realty/dashboard
  Leads                      /realty/leads
  Follow-ups                 /realty/followups
  Site Visits                /realty/site-visits
  Campaigns & Lead Capture   /realty/campaigns
  Inventory Grid             /realty/inventory
  Cost Sheets                /realty/cost-sheets
  Channel Partners           /realty/channel-partners
Post-Sales (root, permission realty.booking.view)
  Post-Sales Dashboard       /realty/post-sales
  Bookings                   /realty/bookings
  Construction Stages & Demands /realty/demands
  Receipts                   /realty/receipts
  Customer Ledger            /realty/ledger
  Letters                    /realty/letters
  Cancellation & Transfer    /realty/cancellations
  Reports                    /realty/reports
Realty Setup (root, permission realty.plan.manage)
  Project Setup Wizard       /realty/setup/project
  Payment Plans              /realty/setup/plans
  Charge Heads & Price List  /realty/setup/charges
  Letter Templates           /realty/setup/letters
  Routing Rules              /realty/setup/routing
Coming Soon (root, visible to realty roles)  — each item with a "Soon" badge
  Customer Hub · Communication Hub · AI Intelligence · Advanced Analytics · Integrations
```

Add a **Project / Wing context switcher** in the header for realty pages. Reuse the existing site selector pattern if there is one.

**Signature screens (make these look excellent):**
1. **Inventory Grid**:
   - wing elevation with floors as rows (top floor first) and units as tiles coloured by status, with a legend and counts
   - hover shows a mini card (type, carpet area, price, status, owner)
   - click opens a drawer with Hold / Block / Cost Sheet / Book / Release
   - filters: type, facing, price, status
   - table-view toggle and a parking view
2. **Lead 360**:
   - header with click-to-call and a WhatsApp link, score, stage stepper
   - tabs: Timeline, Follow-ups, Site Visits, Cost Sheets, Matching Units, Documents
3. **Booking Wizard** (7 steps): Unit & Scheme → Applicant (KYC upload) → Co-applicants → Cost & Taxes → Charges & Parking → Booking Amount → Review/Submit
4. **Customer 360 (booking detail)**:
   - KPI header: agreement value, received, outstanding, overdue, interest
   - status timeline
   - tabs: Schedule, Demands, Receipts, Ledger/SOA, Interest, Documents, Letters, Applicants, Activity
5. **Demand run**: pick stage → mark complete (certificate) → eligible bookings list → preview → bulk generate PDF → send email/WhatsApp → sent/pending/failed tracker
6. **Receipt entry**: due stages panel, mode-specific fields, TDS suggestion, FIFO allocation preview, approval status, two-copy printable receipt (amount in words in Lakh/Crore)
7. **Dashboards**:
   - Sales: funnel, source-wise conversion, executive leaderboard, today's agenda, SLA breaches
   - Post-Sales: unit-status KPIs **from one status source so they reconcile**, sale value / demanded / collected / outstanding / overdue, collection efficiency %, monthly collection chart, ageing donut
8. **CP Portal** (own layout): dashboard, tag lead, my leads with expiry countdown, scoped inventory (no margins), my brokerage and payouts

**Common UI rules:** follow the anatomy of existing pages like `procurement/pos` and `inventory/grn`:
- header + breadcrumb + primary action
- filter bar, KPI chips
- TanStack table with server pagination, export CSV/XLSX
- EmptyState, TableSkeleton, ConfirmModal, sonner toasts
- mobile-friendly, dark mode
- Indian formats: ₹1,00,00,000; DD-MMM-YYYY; PAN/Aadhaar/mobile/pincode/GSTIN validation; mask Aadhaar

---

## 6. MODULES 6–10 — COMING SOON (show something)

Build one reusable `ComingSoonModule` component. It shows:
- an icon, the title and a one-line value proposition
- an ETA chip ("Q1 2027")
- a "Request early access" button (POST to `re_feature_interest` + toast) and a "Notify me" toggle
- a **blurred, non-interactive mock built from real Tailux components with fake data**, with a lock icon and a "Coming soon" ribbon
- 4–6 feature cards
- a 3-step "How it will work" strip

| Module | Mock to render | Feature cards |
|---|---|---|
| Customer Hub | Phone frame: "Next due ₹4,20,000 on 15-Jan", schedule progress bar, receipts, construction photos (pull 3 real DPR photos if available) | Self-serve ledger, Download receipts/letters, Pay via UPI, Construction updates, Service requests, Referral rewards |
| Communication Hub | WhatsApp-style inbox + chat pane + template picker | WhatsApp API, Click-to-call + recording, SMS/RCS, Email drips, Broadcasts, Auto-log to lead |
| AI Intelligence | "Ask AI" panel ("Which leads will book this week?"), lead-score gauge, call-summary card | Predictive scoring, AI voice call-back, Call summary & sentiment, Next-best-action, NL reports, AI demand assistant |
| Advanced Analytics | Drag-drop report builder + 3 charts | Custom reports, Scheduled emails, Management MIS, Project P&L (sales vs construction cost from BuildERP), Funnel/cohort, Excel/PDF |
| Integrations | Cards: Meta Lead Ads, Google Ads, 99acres, MagicBricks, Housing.com, Razorpay, Tally (already live, green "Connected"), Exotel, Google Calendar, Leegality e-sign, Webhooks | Lead sync, Payments, Accounting, Telephony, e-Sign, API keys |

---

## 7. SEED DATA (`apps/api/src/database/seed-realty.ts`, idempotent; add script `pnpm db:seed:realty`)

For tenant `kings`, on the existing site **SITE-KH Kings Heights Tower A & B**:
- Phase "Building 2", Wing B, floors Ground + 1–23
- ~134 units: 1RK 203, 1BHK 288/301/306/316/320–322, 7 shops on the ground floor
- base rate ₹26,250/sq ft carpet; floor rise ₹50/sq ft per floor above the 4th; 20 stilt parkings
- Pay stages A–U:
  - A Call Money 13
  - B On Registration 10
  - C Plinth 17
  - D–O: 12 stages × 4 (each "On commencement of slab n/n+1")
  - P Internal Masonry 2, Q External Masonry 2, R Internal Plaster 2, S External Plaster 2, T Lift & Lobby 2, U Possession 2
  - **Total = 100**
- Schemes: Standard (Project), 1 BHK 320-321, 1 BHK 320-321 No GST, Upto 14th Floor No GST (Call Money 16 / Registration 10 / Plinth 14 / …), 15th–23rd Floor With GST, SHOP
- ~100 leads across sources/stages, 30 site visits, 60 bookings with mixed statuses
- ~200 receipts (mixed modes; a few on hold or bounced), demands for completed stages
- 5 cancellations, 6 channel partners with tags and brokerage
- letter templates for every type
- the demo users from §2
- Mark stages A–H completed so the demand, ledger and interest screens have data

---

## 8. QUALITY BAR

- Strict TypeScript, ESLint/Prettier clean, `pnpm build` and `pnpm lint` pass across turbo
- Jest unit tests for all money logic. One e2e test (like `test/phase-p7.spec.ts`) for lead → cost sheet → booking → demand → receipt → ledger.
- No cross-tenant leaks: add an e2e test with a second tenant
- Nothing breaks in the existing construction modules. Run their tests and build after every phase.
- Update `docs/ARCHITECTURE.md` (new Realty section), `docs/API.md` (realty endpoints), `docs/TENANCY.md` (new tables) and the README phase table
- Log assumptions in `docs/REALTY_ASSUMPTIONS.md` and continue; don't stop for minor ambiguities

---

## 9. DO NOT

- create a new app, a new monorepo, Prisma, Express-only servers, or another UI library
- rename or alter existing construction tables (only add; `sites` gets **no** schema change)
- store Aadhaar in plain text or expose KYC files publicly
- calculate money only on the frontend
- leave modules 6–10 as blank pages
- show realty menus to store/purchase/site roles

---

## 10. DEFINITION OF DONE (whole feature)

1. Login as `saleshead`: you see only the Realty menus, land on the Sales Dashboard, and can create a lead → site visit → cost sheet (approval) → booking.
2. Login as `crm`: mark Slab 5 complete → bulk demand letters → send (stub WhatsApp/email) → create receipt.
3. Login as `collections`: approve the receipt → ledger and outstanding update → Tally export includes the receipt.
4. Login as `cp_demo`: CP portal only; tag a lead, a duplicate is rejected, and brokerage shows after booking.
5. Login as `store`: no Realty menus, and Realty APIs return 403.
6. Super Admin disables REALTY_SALES for a tenant: menus disappear and the APIs return 403.
7. The Coming Soon pages render with mocks, and "Request early access" saves a row.

---

## 11. BUILD ORDER

R0 Read & plan → R1 Schema + roles/permissions + module switch → R2 Setup (project wizard, units, plans, charges) → R3 Inventory grid + cost sheet → R4 Bookings + schedule → R5 Demands, receipts, ledger, interest, letters, cancellation/transfer, reports, Tally → R6 CRM (leads, routing, follow-ups, site visits, campaigns, webhook, dashboard) → R7 Channel partners + CP portal → R8 Coming Soon + docs + tests + seed polish.

---

## 12. PHASE PROMPTS (paste one at a time in Antigravity)

**R0: Kick-off**
```
Read MASTER_PROMPT_RealtySales_BuildERP.md fully, plus docs/ARCHITECTURE.md, docs/TENANCY.md, docs/API.md, apps/api/src/database/schema/index.ts, apps/api/src/app.module.ts, packages/shared/src/permissions/index.ts, apps/web/src/app/navigation/*, apps/web/src/app/router/protected.tsx and the sidebar Menu components.
Do NOT write code. Reply with:
1. how you will plug the Realty module into the existing API, DB, nav and RBAC
2. how sidebar/route filtering by permission works today and what you will change
3. the list of new files
4. any conflicts you see
Then stop.
```

**R1: Foundation**
```
Phase R1 of MASTER_PROMPT_RealtySales_BuildERP.md:
- schema/realty.ts with ALL re_ tables from §3 + tenant_modules
- generate the migration
- realty permissions in packages/shared
- new roles + demo users in seed-realty.ts
- RequireModule guard + Super Admin toggle
- nav permission filtering + role-based landing page
- empty realty.module with sub-modules registered
- Realty menus + all routes stubbed with placeholder pages
Build and lint all apps, confirm the construction modules still work, give the phase report, stop.
```

**R2: Setup**
```
Phase R2: Realty Setup.
- project settings
- phase/wing/floor bulk create
- unit types
- bulk unit generator
- parking slots
- charge heads, price list
- pay stages, schemes (100% validation, copy scheme)
- APIs + Tailux pages
- seed Kings Heights data from §7 (setup part)
Tests for scheme validation. Report, stop.
```

**R3: Inventory & Cost Sheet**
```
Phase R3:
- Inventory Grid (signature screen) with hold/block/release + hold-expiry cron
- parking view
- cost sheet engine in pricing.service with unit tests, cost sheet UI + PDF, discount approval flow
Report, stop.
```

**R4: Bookings**
```
Phase R4:
- Booking wizard (7 steps, encrypted Aadhaar, KYC uploads), booking approval
- unit status update, payment schedule generation, welcome notification
- Bookings list, Customer 360 shell
Seed bookings. Report, stop.
```

**R5: Collections**
```
Phase R5:
- stage completion → eligible bookings → bulk demand PDFs → send
- receipts with maker-checker, TDS 194-IA, FIFO allocation, bounce/hold, two-copy receipt PDF
- ledger/SOA
- nightly interest + waiver
- letters (templates + bulk generation)
- cancellation & transfer
- all reports in §4 reports/
- Tally receipt export
- Post-Sales dashboard
- DPR→stage notification hook
Unit tests for all money logic + the e2e test. Report, stop.
```

**R6: CRM**
```
Phase R6:
- sources, campaigns, public lead webhook with API key, CSV import with dedupe
- scoring, routing rules + SLA cron
- Leads list (saved views), Lead 360, follow-ups calendar, site visits board
- Sales dashboard
Seed leads. Report, stop.
```

**R7: Channel Partners**
```
Phase R7:
- public CP registration, approval queue
- CP portal layout for channel_partner role
- lead tagging with validity/duplicate rules
- scoped inventory
- brokerage slabs engine (194H), payouts, leaderboard
Tests. Report, stop.
```

**R8: Coming Soon + Finish**
```
Phase R8:
- ComingSoonModule + 5 pages from §6, feature-interest API
- update all docs, finish seed data
- run the full Definition of Done checklist from §10 and report each item pass/fail
```

**Fix prompt (use anytime)**
```
Something is broken: <paste error / describe>. Find the root cause and fix it without changing unrelated code or existing construction modules. Re-run build + lint + tests and tell me exactly what changed.
```
