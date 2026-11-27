# MASTER PROMPT — Real-Estate Builder CRM & Post-Sales SaaS (Tailux + Node.js + MySQL)

> Paste this whole file into Antigravity (or any AI coding agent) at the root of the project.
> Replace `{{PRODUCT_NAME}}` with the final brand name (working name: **NexBuild Realty**).

---

## 0. ROLE & GOAL

You are a senior full-stack engineer and product designer. Build **{{PRODUCT_NAME}}**, a **multi-tenant SaaS for Indian real-estate builders/developers**. It covers the full journey from lead to possession, in the spirit of Sell.Do, and replaces legacy desktop tools like Newton "Flat Deal".

**Scope of this build:**

- **Modules 1–5: fully working** (UI + API + DB):
  1. Marketing Automation (lead capture)
  2. Sales & Pre-Sales
  3. Inventory & Negotiations
  4. Channel Partners
  5. Post-Sales & Collections
- **Modules 6–10: "Coming Soon"** but **visually present**. Each gets a polished preview page with realistic mock UI, a feature list, an ETA badge and a "Notify me / Request early access" button. They must **not** look empty or broken:
  6. Customer Experience Hub (buyer portal)
  7. Communication Hub
  8. AI & Intelligence ("Jarvis"-style)
  9. Reporting & Analytics (advanced)
  10. Integrations Marketplace

First client: **Kings Builders & Developers**, project **"Kings My Home"**. Use it for seed data.

---

## 1. TECH STACK (do not change)

| Layer | Choice |
|---|---|
| Frontend | **Tailux – React Tailwind Admin Template (React 19 + Vite + Tailwind CSS v4)**. Use the **TypeScript (TSX) starter** already in the project. |
| Routing | React Router (as used inside Tailux) |
| State / data | TanStack Query (React Query) for server state, Zustand or Tailux's existing context for UI state |
| Forms | react-hook-form + zod |
| Tables | Tailux's existing table components (TanStack Table based). Server-side pagination, sort and filter. |
| Charts | The chart library Tailux already ships (ApexCharts / Recharts, whichever is present) |
| Backend | **Node.js (LTS) + Express + TypeScript**, REST JSON API, versioned `/api/v1` |
| DB | **MySQL 8**, **Prisma ORM** (or Knex if Prisma is not wanted), migrations + seeders |
| Auth | JWT access token (15 min) + refresh token (httpOnly cookie), bcrypt passwords, RBAC |
| Files | Local `/uploads` in dev; S3-compatible storage behind an interface for prod. KYC files stored **encrypted / private**, served via signed URLs. |
| PDFs | Server-side PDF (Puppeteer or pdfmake) for receipts, demand letters, booking forms, cost sheets |
| Jobs | node-cron / BullMQ (Redis optional) for interest calculation, reminders, bulk letters |
| Messaging | Email via SMTP (Nodemailer). WhatsApp/SMS behind a `NotificationProvider` interface (stub in dev; plug Gupshup/Interakt/MSG91 later). |
| Payments | Razorpay behind a `PaymentGateway` interface (stub mode by default) |

Project layout (monorepo):

```
/realty-saas
  /apps/web        → Tailux TSX starter (frontend)
  /apps/api        → Express + Prisma (backend)
  /packages/shared → shared TS types, zod schemas, enums, constants
  docker-compose.yml (mysql, redis, mailhog)
  README.md
```

---

## 2. TAILUX TEMPLATE RULES (very important)

1. **Before writing any UI, read the existing Tailux starter in `/apps/web`**:
   - layouts (main layout, sidebar layout; Tailux has two sidebar types)
   - navigation config file(s) for menu items
   - route definitions
   - theme / dark-mode / primary-colour config
   - the components folder (Button, Card, Badge, Input, Select, Listbox, Modal, Tabs, Table, Avatar, Dropdown, Tooltip, Skeleton, Empty state, etc.)
   - the `fakedata` folder pattern

   Then **reuse those components and patterns**. Do **not** install another UI kit (no MUI, no shadcn, no Bootstrap).
2. Add every module, page and menu item **through Tailux's own navigation config and routing pattern**. Keep its modular folder + URL structure, e.g. `src/app/pages/<module>/<page>`.
3. Replace `fakedata` with real API calls through a central `apiClient` (axios) plus React Query hooks per module (`useLeads`, `useUnits`, `useBookings`…).
4. Keep **light + dark mode**, RTL off, responsive down to 360 px. Primary colour: indigo/violet (`#4F46E5`-ish). Configure it via Tailux's theme config, not hard-coded classes.
5. Every list page has the same anatomy:
   - page header (title, breadcrumb, primary action)
   - filter bar (search + filters + date range + "Clear")
   - KPI chips row (optional)
   - data table (column toggle, sort, pagination, row actions, bulk actions, export CSV/XLSX)
   - empty state with illustration + CTA
   - skeleton loaders
6. Every form page:
   - sections in Cards
   - sticky footer with Cancel / Save draft / Save
   - inline zod validation
   - toast on success/error
   - unsaved-changes guard
7. Use **Indian formats** everywhere:
   - ₹ with the Indian grouping `1,00,00,000`
   - dates `DD-MMM-YYYY`
   - amounts in words in Indian system (Lakh/Crore) on receipts and letters
   - PAN regex `^[A-Z]{5}[0-9]{4}[A-Z]$`, Aadhaar 12 digits (mask as `XXXX-XXXX-1234` in UI), mobile `^[6-9]\d{9}$`, pincode 6 digits, GSTIN regex
8. i18n-ready (English now; keep strings in locale files so Marathi/Hindi can be added).

---

## 3. MULTI-TENANCY, ROLES & SECURITY

- **Tenancy model:** shared DB, `tenant_id` on every business table. Tenant resolved from **subdomain** (`kings.{{domain}}`) or `X-Tenant` header in dev. A Prisma middleware / repository layer enforces `tenant_id` on every query, so no cross-tenant leaks.
- **Super Admin portal** (`admin.{{domain}}`):
  - tenants CRUD, plan & module toggles (feature flags per tenant), user seats
  - status (trial/active/suspended), usage stats, impersonate tenant (audited)
- **Tenant roles** (seeded; tenant admin can create custom roles with permission matrix):
  - Tenant Admin, Sales Head, Pre-Sales Executive, Sales Executive
  - CRM/Post-Sales Executive, Accounts, Channel Partner (external login), Viewer
- **Permissions:** `module.resource.action` (e.g. `postsales.receipt.approve`). Check them on the API (middleware) **and** hide them in the UI.
- **Context switcher** in the top bar (like the legacy Flat Deal "Selection" screen, but better): **Company → Project → Phase/Building → Wing**. Persist per user. All lists filter by it; "All projects" is allowed for admins.
- **Security:**
  - HTTPS only
  - helmet, rate limiting, CORS whitelist
  - input validation with zod on API
  - audit log table (who / what / old → new / IP / time) for every create/update/delete/approve
  - soft deletes
  - KYC docs private, with access logged
  - **maker–checker** on money actions

---

## 4. DATA MODEL (MySQL via Prisma)

Create these core tables. All have `id (bigint/uuid)`, `tenant_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`.

**Platform:** `tenants`, `plans`, `tenant_modules`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_project_access`, `audit_logs`, `notifications`, `files`, `settings` (key-value per tenant), `number_series` (prefix, next_no, padding per doc type & project, e.g. `KIN/RCP/25-26/00001`).

**Project masters (Module 3 base):**
- `companies` (name, type, GSTIN, PAN, address, logo, letterhead)
- `projects` (company_id, name, RERA no, address, city, launch_date, possession_date, status)
- `phases` / `buildings` (project_id, name)
- `wings` (phase_id, name, total_floors)
- `floors` (wing_id, name, level_no; Ground = 0, Basement negative)
- `unit_types` (1RK, 1BHK, 2BHK, Shop, Office… with default carpet/built-up area)
- `units` (wing_id, floor_id, unit_no, unit_type_id, category RES/COM, carpet_area, balcony, terrace, saleable_area, facing, base_rate, floor_rise, plc, status [AVAILABLE, HOLD, BLOCKED, BOOKED, AGREEMENT, REGISTERED, POSSESSION, CANCELLED, NOT_FOR_SALE], hold_till, investor_flag)
- `parking_slots` (project/wing, type OPEN/STILT/PODIUM/BASEMENT, slot_no, price, status, allocated_booking_id)
- `charge_heads` (Development, Legal, Society, Club, Water, Electricity, Corpus, Maintenance-advance (months), Share money, Municipal, MNGL, Solar/Rainwater, EDC/IDC, IFMS, PLC, Parking, Other). Each head has `calc_type` (FIXED / PER_SQFT / PERCENT_OF_AGREEMENT / PER_MONTH), `gst_applicable`, `gst_rate`.
- `price_lists` (project/wing, effective_from, base_rate, floor_rise_per_floor, plc rules)
- `banks` (collection accounts: bank, branch, IFSC, account no masked, escrow flag), `brokers`, `vendors` (architect), `holidays`, `employees` → users

**Payment plans:**
- `pay_stages` (project_id, code A..Z, name, default_percent, sequence, is_construction_linked, status [PENDING, COMPLETED], completed_on, architect_certificate_file)
- `schemes` (project_id, name e.g. "Standard CLP", "Upto 14th Floor – No GST", "Subvention 20:80", gst_mode, applicable unit types/floor range, offers: stamp duty borne by builder Y/N, registration borne by builder Y/N, discount %)
- `scheme_stages` (scheme_id, pay_stage_id, percent). **The percentages must total 100; validate this.**

**CRM (Modules 1–2):**
- `lead_sources` (Website, Facebook, Google, 99acres, MagicBricks, Housing, Walk-in, Referral, Channel Partner, Hoarding, Newspaper, Other)
- `campaigns` (name, source, project, budget, start/end, utm)
- `leads` (name, mobile, alt_mobile, email, city, budget_min/max, config_pref, purpose [END_USE/INVESTMENT], source_id, campaign_id, cp_id, project_id, stage, sub_stage, score 0–100, temperature [HOT/WARM/COLD], owner_presales_id, owner_sales_id, next_followup_at, lost_reason, duplicate_of_id, utm fields)
- `lead_activities` (type CALL/WHATSAPP/SMS/EMAIL/NOTE/STAGE_CHANGE/ASSIGNMENT, direction, outcome, duration, notes, at)
- `followups` (lead_id, due_at, type, assigned_to, status, done_at)
- `site_visits` (lead_id, project_id, scheduled_at, pickup required, attended_by, status [SCHEDULED, CONFIRMED, DONE, NO_SHOW, RESCHEDULED], feedback, revisit flag)
- `routing_rules` (conditions JSON: source/project/city/budget → assign round-robin to user pool; SLA minutes)

**Negotiation & booking:**
- `cost_sheets` (lead_id/unit_id, scheme_id, rate, discount, all computed lines JSON, valid_till, status [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SHARED])
- `approvals` (generic: entity_type, entity_id, requested_by, approver_role, level, status, remarks)
- `bookings` (booking_no, unit_id, lead_id, cp_id, scheme_id, booking_date, sold_rate, area_basis CARPET, basic_cost, floor_rise_amt, plc_amt, discount_pct, discount_amt, net_cost, agreement_value, gst %, gst_amt, stamp_duty, registration_fee, stamp_by_builder, reg_by_builder, other_charges_total, grand_total_incl_gst, grand_total_excl_gst, status [DRAFT, PENDING_APPROVAL, BOOKED, AGREEMENT_DONE, REGISTERED, POSSESSION, CANCELLED, TRANSFERRED], agreement_date, registration_date, registration_no, loan_bank, loan_amount, possession_date)
- `booking_applicants` (booking_id, type PRIMARY/CO1/CO2, title, first/middle/last name, dob, age auto, gender, occupation, company, PAN, Aadhaar (encrypted), mobile, email, residential/office phone, permanent address, correspondence address, same-as flag, country/state/city/pincode, relation_to_primary)
- `booking_documents` (PAN proof, Aadhaar proof, photo, agreement copy, registration receipt, allotment letter…)
- `booking_charges` (booking_id, charge_head_id, amount, gst)
- `booking_parkings` (booking_id, parking_slot_id, price)
- `payment_schedule` (booking_id, pay_stage_id, percent, amount, gst_amount, due_date, demand_id, status [NOT_DUE, DEMANDED, PARTIALLY_PAID, PAID, OVERDUE])

**Collections (Module 5):**
- `demands` (demand_no, booking_id, pay_stage_id, demand_date, due_date, basic amount, gst, interest_carried, total, letter_file, sent_via, sent_at, status)
- `receipts` (voucher_no, booking_id, receipt_date, against [STAGE / OTHER_CHARGE / GST / STAMP / REGISTRATION / INTEREST / MAINTENANCE / EXTRA_WORK], pay_stage_id nullable, mode [CASH, CHEQUE, DD, NEFT, RTGS, IMPS, UPI, SWIFT, ONLINE], instrument_no, instrument_date, drawn_on_bank, deposit_bank_id, amount, tds_applicable, tds_pct, tds_amount, gst_component, status [DRAFT, PENDING_APPROVAL, PASSED, HOLD, BOUNCED, CANCELLED], realised_on, bounce_charges, narration, attachment, tally_synced)
- `receipt_allocations` (receipt_id → payment_schedule_id / charge, amount). FIFO auto-allocation with a manual override.
- `ledger_entries` (booking_id, date, doc_type, doc_id, debit, credit, running balance), driving the **customer ledger / statement of account**
- `interest_runs` and `interest_entries` (rate % p.a., grace days, calc on overdue principal, waived amount + approval)
- `credit_notes` (booking_id, reason, amount, approval)
- `cancellations` (booking_id, reason, received_till_date, cancellation_charges, tds, gst reversal, refund_amount, refund mode/status, approval)
- `transfers` (booking_id, from applicants → to applicants, transfer_fee, approval)
- `letter_templates` (type [DEMAND, ALLOTMENT, AGREEMENT_INTIMATION, POSSESSION, NOC, WELCOME, REMINDER, INTEREST, CANCELLATION, OTHER], name, body HTML with merge fields `{{customer_name}}` `{{unit_no}}` `{{wing}}` `{{floor}}` `{{project}}` `{{amount}}` `{{amount_words}}` `{{due_date}}` `{{stage_name}}` `{{bank_details}}` `{{rera_no}}`…, letterhead toggle)
- `letters_issued` (template_id, booking_id, file, sent_via, sent_at)

**Channel partners (Module 4):**
- `channel_partners` (firm_name, contact person, mobile, email, RERA no, PAN, GSTIN, bank details, address, status [PENDING_KYC, ACTIVE, SUSPENDED], tier [SILVER/GOLD/PLATINUM], agreement_file, onboarded_at)
- `cp_users` (login for CP staff)
- `cp_project_access` (cp_id, project_id, visible unit filters)
- `cp_lead_tags` (lead_id, cp_id, tagged_at, valid_till, status [ACTIVE, EXPIRED, REJECTED_DUPLICATE, CONVERTED], evidence)
- `brokerage_slabs` (project_id, tier, from_bookings, to_bookings, percent or fixed per sqft)
- `brokerage_entries` (booking_id, cp_id, base_amount, percent, brokerage, gst, tds, net, status [ACCRUED, ELIGIBLE, INVOICED, APPROVED, PAID], eligible_after e.g. 10% collected / agreement registered)
- `cp_invoices`, `cp_payouts`

---

## 5. MODULE SPECS (build fully)

### MODULE 1 — Marketing Automation
**Pages:**
1. **Lead Sources & Campaigns**: CRUD campaigns. Per campaign: leads, site visits, bookings, cost per lead, cost per booking, ROI.
2. **Lead Capture**:
   - public REST webhook `POST /api/v1/public/leads/:tenantKey` (website forms, Meta Lead Ads, Google Ads, portals). Validate with an API key and log the payload.
   - embeddable website form snippet generator
   - CSV/XLSX bulk import with column mapping, dedupe preview and error report
3. **Dedup engine**: same mobile or email inside the same project within N days → mark as duplicate, attach to the original, and notify the owner.
4. **Lead scoring (rule-based v1)**: points for source, budget match, configuration match, engagement (calls answered, site visit). Shows HOT/WARM/COLD.
5. **Marketing dashboard**: leads by source, day-wise trend, funnel (Lead → Contacted → SV scheduled → SV done → Negotiation → Booked), source-wise conversion %.

### MODULE 2 — Sales & Pre-Sales
1. **Leads list**:
   - saved views (My leads, Today's follow-ups, Overdue, Hot, Unassigned, SV scheduled)
   - filters: stage, source, project, owner, date, budget, temperature
   - bulk assign / change stage / export
2. **Lead 360° detail page**:
   - header: name, mobile with click-to-call (tel:) and WhatsApp deep link, score, stage pill, owner
   - tabs: Timeline (all activities), Follow-ups, Site Visits, Cost Sheets, Documents, Matching Inventory (units matching budget/config), Notes
3. **Lead stages** (configurable): New → Contacted → Interested → SV Scheduled → SV Done → Negotiation → Booking Done / Lost (with lost reasons) / Not Interested / Invalid
4. **Auto-routing** by `routing_rules` (round-robin / load-based)
   - **response SLA** (e.g. call within 15 min). Breached → escalate to the manager and optionally reassign (lead churn).
   - reassignment restricted to the manager hierarchy
5. **Follow-up planner**: calendar + list, reminders (in-app + email), "Log call" quick modal (outcome, next follow-up)
6. **Site Visit management**: schedule, confirm, mark attended/no-show, feedback form, revisit; daily SV board for the site team
7. **Sales dashboard**: per executive (calls, follow-ups done vs due, SVs, bookings, conversion), leaderboard, today's agenda

### MODULE 3 — Inventory & Negotiations
1. **Project Masters wizard**:
   - Company → Project → Phase → Wing → bulk Floors (Ground..Nth) → bulk Units (pattern e.g. floor×100 + 1..6, with unit type per stack)
   - Unit Types, Parking slots, Charge Heads, Price list, Banks
2. **Inventory Grid** (signature screen; must look great):
   - wing-wise building elevation grid: floors as rows (top floor first), units as tiles
   - tiles colour-coded by status; legend + counts
   - hover → unit card (type, carpet, rate, price, status, owner if booked)
   - click → side drawer with actions: Hold (with expiry), Block, Generate Cost Sheet, Book, Release
   - filters: type, facing, price range, status
   - also a table view and a "Graphical Parking Status" view
3. **Cost Sheet generator**:
   - inputs: unit, scheme, rate, discount, parking, charge heads
   - output: basic cost, floor rise, PLC, agreement value, GST, stamp duty (configurable %, default 6% Maharashtra incl. metro cess setting), registration (1% capped ₹30,000, configurable), other charges, grand total incl./excl. GST, and the **stage-wise payment schedule** with amounts
   - PDF + share via email/WhatsApp link
   - discount above the user's limit → **approval workflow** (Sales Head → Director)
4. **Payment Plans**:
   - Pay Stages master (A..U, e.g. Call Money 13%, On Registration 10%, Plinth 17%, each 2-slab pair 4%, Masonry/Plaster/Lift/Possession 2%)
   - Schemes (stage % per scheme, must total 100%, with live validation)
   - copy scheme
5. **Holds & blocks**: auto-release expired holds (cron)

### MODULE 4 — Channel Partners
1. **CP onboarding**:
   - public self-registration link (branded per tenant)
   - form: firm, RERA no, PAN, GST, bank, documents
   - e-agreement accept checkbox + timestamp/IP
   - admin approval queue
2. **CP Master**: list, tier, status, KYC docs, projects allowed, performance
3. **CP Portal** (separate login, same app, limited layout):
   - dashboard: active leads, SVs, bookings, conversion %, brokerage earned / pending / paid
   - **Tag a lead**: duplicate check across tenant. Validity window (e.g. 60 days); a done site visit extends it by 30 days. Duplicate or recycled leads are rejected with a reason.
   - lead board with stage + expiry countdown
   - scoped live inventory (no margin/discount info)
   - book SV
   - brokerage ledger, invoices upload, payout statements
4. **Brokerage engine**:
   - slab-based per project & tier
   - accrues on booking; becomes eligible when the rule is met (e.g. ≥10% collected or agreement registered)
   - computes GST + TDS (194H)
   - payout runs with statement PDF and approval
5. **Conflict rules**: first verified tag wins inside the validity window. Disputes are logged with evidence.
6. **CP leaderboard & tiering**

### MODULE 5 — Post-Sales & Collections (most important for Kings)

1. **Booking form** (multi-step wizard, modern version of the legacy 6-tab form):
   1. Unit & scheme (pre-filled from cost sheet)
   2. Primary applicant (incl. KYC uploads)
   3. Co-applicants (0–3)
   4. Cost & taxes (read-only summary + editable allowed fields)
   5. Other charges & parking
   6. Booking amount / cheque details (Date, Bank, Branch, Cheque No, Amount)
   7. Review & submit → approval (if configured) → unit status BOOKED → payment schedule generated → welcome email/WhatsApp

   Booking list with filters + "View enquiry" link back to the lead.
2. **Customer 360° (booking detail)**:
   - header: customer, unit, agreement value, received, outstanding, overdue, interest due, status timeline (Booked → Agreement → Registered → Possession)
   - tabs: Payment Schedule, Demands, Receipts, **Ledger/SOA**, Interest, Documents, Letters, Applicants, Activity, Cancellation/Transfer
3. **Construction progress → Demands**:
   - "Mark stage complete" (upload architect certificate, date)
   - system lists **all eligible bookings** for that stage
   - preview → bulk generate demand letters (PDF, letterhead, bank details, QR/UPI link)
   - bulk send via email (+ WhatsApp stub)
   - track sent/pending/failed
4. **Receipt Entry**:
   - choose booking → shows due stages
   - amount, mode, instrument details, deposit bank, TDS (1% under 194-IA if value ≥ ₹50 L, auto-suggest), GST split
   - auto voucher no from `number_series`
   - FIFO allocation preview
   - status DRAFT → **maker–checker** approval → PASSED
   - Hold / Bounce flow with bounce charges
   - **Receipt PDF** (office + customer copy, amount in words, "Cheque subject to realisation", RERA No, GSTIN, signatory) and send to customer
5. **Customer Ledger / Statement of Account**: PDF/Excel, date range, opening/closing balance
6. **Interest on delayed payment**:
   - nightly job; rate % p.a. and grace days per project
   - interest statement
   - waiver with approval
   - interest letter
7. **Letters**:
   - template editor (rich text + merge fields + preview)
   - generate for one or **many units** (checkbox grid of flats with Select All, like the legacy tool, but better)
   - types: Demand, Allotment, Welcome, Agreement Intimation, Possession, NOC (bank loan), Reminder, Interest, Cancellation
   - history in `letters_issued`
8. **Cancellation**:
   - auto-fill received till date, agreement value
   - enter cancellation charges (% or fixed), TDS, GST reversal → refund amount
   - approval → unit back to AVAILABLE; ledger + CP brokerage reversed
9. **Transfer / name change**: new applicants, transfer fee, approval, transfer letter
10. **Reports** (each with filters, table, export, print):
    - Collection Summary (date / bank / mode)
    - Outstanding & **Ageing** (0–30, 31–60, 61–90, 90+), Overdue list
    - Demand vs Collection (stage-wise)
    - Payment Details (receipt register), Hold/Bounced receipts
    - Flat Status (live inventory), Customer List, Member Ledger, Interest Statement
    - Cancelled Flats, Parking allocation
    - TDS register, GST on receipts
11. **Tally export**: receipts/vouchers as Tally XML; mark `tally_synced`
12. **Post-sales dashboard**:
    - KPIs: Total units, Available, Hold, Booked, Agreement done, Registered, Possession pending, Cancelled. **All derived from one `units.status` source so they always reconcile.**
    - Total sale value, Demanded, Collected, Outstanding, Overdue, Collection efficiency %
    - charts: monthly collections, stage-wise demand vs collection, ageing donut
    - reminders widget: PDC due, birthdays/anniversaries, follow-ups

---

## 6. MODULES 6–10 — "COMING SOON" (show something!)

Create each as a real route and sidebar item with a small **"Soon"** badge. Every page uses one reusable `<ComingSoonModule>` component:

- hero: module icon, name, one-line value proposition, ETA chip (e.g. "Q1 2027"), "Request early access" button (saves to `feature_interest` table + toast) and "Notify me" toggle
- **blurred / semi-transparent mock preview** of the real UI, built with real Tailux components and fake data, not an image, overlaid with a lock + "Coming soon" ribbon
- 4–6 feature cards (icon + title + 1 line)
- "How it will work" 3-step strip

| # | Module | Mock preview to render | Feature cards |
|---|---|---|---|
| 6 | **Customer Experience Hub** (buyer portal & app) | Phone-frame mockup of a buyer app: unit card, "Next due ₹4,20,000 on 15-Jan", payment schedule progress bar, receipts list, construction photo gallery | Self-serve ledger, Download receipts & letters, Pay online (UPI), Construction updates, Raise service request, Referral rewards |
| 7 | **Communication Hub** | Unified inbox: WhatsApp-style chat list + conversation pane, template picker | WhatsApp Business API, Click-to-call with recording, SMS & RCS, Email drips, Bulk broadcasts with templates, Auto-log to lead timeline |
| 8 | **AI & Intelligence** | "Ask AI" chat panel answering "Which leads are likely to book this week?" + AI lead-score gauge + call-summary card | Predictive lead scoring, AI voice agent instant call-back, Call summary & sentiment, Next-best-action, Natural-language reports, AI demand-letter assistant |
| 9 | **Reporting & Analytics** | Drag-and-drop report builder canvas + 3 sample charts | Custom report builder, Scheduled email reports, Management MIS, Project P&L view, Cohort & funnel analysis, Export to Excel/PDF |
| 10 | **Integrations Marketplace** | Grid of integration cards with Connect buttons (disabled): Meta Lead Ads, Google Ads, 99acres, MagicBricks, Housing.com, Razorpay, Tally, Gupshup/Interakt (WhatsApp), Exotel/Knowlarity, Google Calendar, Zapier/Webhooks, DocuSign/Leegality e-sign | Lead-source sync, Payments, Accounting, Telephony, e-Sign, Webhooks/API keys |

Also add a **"What's coming" roadmap page** (Settings → Roadmap): a timeline of modules 6–10 with status pills (Planned / In design / In development).

---

## 7. NAVIGATION (sidebar)

```
Dashboard (role-based home)
── SALES
   Marketing      → Campaigns, Lead Capture, Import, Marketing Dashboard
   Leads          → All Leads, Follow-ups, Site Visits, Sales Dashboard
   Inventory      → Inventory Grid, Cost Sheets, Holds & Blocks, Parking
   Channel Partners → Partners, Approvals, Lead Tags, Brokerage, Payouts, Leaderboard
── POST-SALES
   Bookings       → All Bookings, New Booking, Approvals
   Collections    → Construction Stages & Demands, Receipts, Ledger, Interest, Bounced/Hold
   Letters        → Generate, Templates, History
   Utilities      → Cancellation, Transfer, Parking Allocation, Tally Export
   Reports        → (list from §5 Module 5 point 10)
── COMING SOON
   Customer Hub · Communication Hub · AI Intelligence · Advanced Analytics · Integrations   [Soon badge]
── SETUP
   Project Masters (wizard), Payment Plans (Stages, Schemes), Charge Heads, Banks,
   Number Series, Letter Templates, Users & Roles, Routing Rules, Company Profile, Roadmap
```

The top bar has: Project context switcher, global search (lead/unit/booking/receipt no/mobile), notifications bell, quick-add (+ Lead, + Receipt, + Booking), theme toggle, profile.

---

## 8. API CONVENTIONS

- REST under `/api/v1`. Resources plural (`/leads`, `/units/:id/hold`, `/bookings/:id/receipts`, `/pay-stages/:id/complete`, `/demands/bulk-generate`).
- List endpoints: `?page=&pageSize=&sort=&q=&filters[...]` → `{ data, meta: { page, pageSize, total } }`
- Errors: `{ error: { code, message, details } }` with proper HTTP status
- Shared zod schemas in `/packages/shared`, used by both API validation and frontend forms
- OpenAPI/Swagger docs at `/api/docs`
- Money stored as `DECIMAL(15,2)`; all calculations server-side in one `pricing.service.ts` and one `ledger.service.ts`, fully unit-tested

---

## 9. SEED DATA (realistic demo)

Seed tenant **Kings Builders and Developers** (Proprietary), project **Kings My Home**:
- Phase *BUILDING-2*, Wing *WING-B*, floors Ground..23
- ~134 units (1RK 203, 1BHK 288/301/306/316/320–322, 7 Shops on ground)
- rate ₹26,250/sq ft carpet, 20 stilt parkings
- Pay stages A–U as in §5 Module 3 point 4
- Schemes: Standard, 1 BHK 320-321, 1 BHK 320-321 No GST, Upto 14th Floor No GST, 15th–23rd Floor With GST, SHOP
- ~100 leads across sources, 30 site visits, ~60 bookings with mixed statuses
- ~200 receipts (mixed modes, a few on HOLD/BOUNCED), demands for completed stages, 5 cancellations
- 6 channel partners with tags and brokerage
- users for every role (password `Demo@123`)

Also seed a second demo tenant to prove isolation.

---

## 10. QUALITY BAR & DELIVERY ORDER

Build in this order and **stop after each step to show what was done**:

1. Monorepo setup, Docker MySQL, Prisma schema + migrations, auth, tenancy, RBAC, audit log, Tailux shell with full sidebar (all routes stubbed)
2. Setup module (Project Masters wizard, Payment Plans, Charge Heads, Banks, Number Series)
3. Module 3 Inventory Grid + Cost Sheet + approvals
4. Module 5 Bookings → Payment schedule → Demands → Receipts → Ledger → Letters → Cancellation/Transfer → Reports → Post-sales dashboard
5. Modules 1 & 2 (Leads, routing, follow-ups, site visits, dashboards)
6. Module 4 Channel Partners + CP portal + brokerage
7. Modules 6–10 Coming Soon pages + Roadmap
8. Super Admin portal, seeders, README, Swagger, tests

Definition of done for every step:
- TypeScript strict, no `any`; ESLint + Prettier clean
- Unit tests for pricing, scheme %, ledger, interest, TDS/GST, brokerage; API integration tests for the booking→receipt flow
- Every page: loading skeleton, empty state, error state, mobile layout, dark mode
- No hard-coded tenant/project IDs; no secrets in code (`.env.example` provided)
- `README.md` with setup: `docker compose up -d`, `pnpm i`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`

**Do not:** invent a different UI kit; skip tenant scoping; store Aadhaar/PAN in plain text; calculate money on the frontend only; leave modules 6–10 as blank pages.

When anything is ambiguous, choose the option that matches Indian builder practice (RERA, Maharashtra stamp duty, construction-linked plans, TDS 194-IA, GST on under-construction property). Note the assumption in `/docs/ASSUMPTIONS.md` and continue.
