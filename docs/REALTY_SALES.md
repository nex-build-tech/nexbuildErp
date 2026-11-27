# Realty Sales & CRM Module Documentation (BuildERP)

## 1. Executive Architecture Overview

The **Realty Sales & CRM** module extends BuildERP from a pure construction management and procurement platform into a full-lifecycle real estate developer ERP. It covers everything from project setup, inventory modeling, dynamic pricing, and lead nurturing to bookings, milestone-based demand runs, maker-checker receipt collections, channel partner commissions (Section 194-H TDS), and customer self-service.

```
                           +----------------------------------------+
                           |           BuildERP Platform            |
                           +----------------------------------------+
                                        |              |
                      +-----------------+              +------------------+
                      |                                                   |
           Construction Modules                                 Realty Sales & CRM
      (Procurement, Inventory, Site DPR,                     (Pre-Sales, Bookings,
       Contractors, Machinery, Tally)                       Demands, Receipts, CP)
                                        |              |
                                        +-------+------+
                                                |
                               +----------------------------------+
                               |     Unified Database & Auth      |
                               |  - Drizzle ORM (MySQL 8/MariaDB) |
                               |  - Multi-tenant (TenantContext)  |
                               |  - RBAC & Module Guarding        |
                               +----------------------------------+
```

---

## 2. Multi-Tenancy & Module Guarding

1. **Per-Tenant Module Toggle (`tenant_modules`)**:
   - The module `REALTY_SALES` is toggled per tenant via `re_tenant_modules`.
   - `RequireModuleGuard` (`@RequireModule('REALTY_SALES')`) secures all `/api/v1/realty/*` endpoints. If disabled, calls return `403 Forbidden` (`Module REALTY_SALES is not enabled for this tenant`).
   - The frontend navigation sidebar filters out all Realty menus when the module is not enabled for the tenant.

2. **Role-Based Access Control (RBAC)**:
   - **Sales Roles**:
     - `sales_head`: Full sales access (`realty:leads:manage`, `realty:bookings:create`, `realty:bookings:approve`, `realty:cost_sheets:approve`, `realty:pricing:manage`).
     - `presales_exec`: Lead qualification, routing, follow-ups, and site visits.
     - `sales_exec`: Cost sheet generation, negotiations, site visits, and booking draft creation.
   - **Post-Sales & CRM Roles**:
     - `crm_manager` / `crm`: Demand generation, stage completion certificates, customer letters, transfers, cancellations.
     - `collections_exec` / `collections`: Receipt creation, TDS 194-IA reconciliation, bank allocation preview, voucher posting.
   - **External Roles**:
     - `channel_partner` (`cp_demo`): Scoped CP Portal (`/cp-portal/*`), 60-day anti-collision client protection, scoped live inventory, brokerage ledger with 5% Section 194-H TDS.
   - **Separation of Concerns**:
     - Construction roles (`store`, `purchase`, `sitemgr`) do NOT see Realty menus and receive `403 Forbidden` if attempting to call Realty APIs.
     - `admin` and `boss` roles retain universal access across all modules.

---

## 3. Database Schema (`apps/api/src/database/schema/realty.ts`)

The module introduces 27 tables prefixed with `re_`:

| Table Name | Description |
|---|---|
| `re_tenant_modules` | Per-tenant module enablement switches (`REALTY_SALES`) |
| `re_projects` | Project-level configuration, MahaRERA registrations, escrow bank accounts |
| `re_phases` | Project phases, wings, sanction approvals, and construction stages |
| `re_wings` | Wing-level definitions linked to phases |
| `re_unit_types` | Unit types (1RK, 1BHK, 2BHK, 3BHK, Shops) with carpet areas and configurations |
| `re_units` | Inventory units (status: `available`, `hold`, `booked`, `sold`, `blocked`, `mortgaged`) |
| `re_parking_slots` | Stilt, open, and puzzle parking slots linked to wings and units |
| `re_charge_heads` | Configurable charge heads (Base rate, Floor rise, PLC, Club, Development, Society, Infra) |
| `re_price_lists` | Active price lists and rate schedules |
| `re_pay_stages` | Standard civil milestones (Call money, Plinth, Slab 1..N, MEP, Possession) |
| `re_pay_schemes` | Payment schemes (Construction Linked, 10:90 Subvention, Time Linked) with 100% stage validation |
| `re_pay_scheme_stages` | Stage weightages (must strictly sum to 100%) for each payment scheme |
| `re_cost_sheets` | Cost sheet calculations, statutory breakdowns (GST 5%, Stamp Duty 5-6%, Regn 1%), discount approvals |
| `re_bookings` | Confirmed bookings, customer KYC, primary applicant, allotment dates, agreement values |
| `re_booking_applicants` | Co-applicants and power-of-attorney holders with masked Aadhaar |
| `re_payment_schedules` | Itemized schedule of payments linked to civil stages and bookings |
| `re_demands` | Milestone demand notices, architectural certificates, due dates, late interest flags |
| `re_receipts` | Maker-checker receipts, payment instruments (NEFT/Cheque/UPI), TDS 194-IA credits, approval statuses |
| `re_receipt_allocations` | FIFO allocation of payments against outstanding demands and interest |
| `re_customer_ledger` | Immutable financial ledger of debits, credits, and balances |
| `re_letters` | Formal customer communications (Demand Letters, Allotment, Welcome, Possession, Defaulter) |
| `re_cancellations` | Cancellation requests, forfeiture calculations, refund schedules |
| `re_leads` | Inbound prospective buyers, deduplication hashes, scoring, routing assignments, UTM campaign tracking |
| `re_lead_interactions` | Omnichannel interaction timeline (Calls, WhatsApp, Site Visits, Cost Sheets) |
| `re_channel_partners` | Registered CP brokerage firms, MahaRERA numbers, PAN, bank details, tiers (`bronze`, `silver`, `gold`, `platinum`) |
| `re_cp_brokerage_slabs` | Tiered brokerage slabs (e.g. 2.0% - 3.5%) with booking thresholds |
| `re_cp_brokerage_entries` | Brokerage ledger entries with 18% GST, 5% Section 194-H TDS deduction, and NEFT payout references |
| `re_feature_interest` | Early access registration log for upcoming roadmap preview modules |

---

## 4. Key Engines & Business Logic

### 4.1. Pricing & Cost Sheet Engine (`pricing.service.ts`)
- **Carpet Area Basis**: Strictly adheres to RERA carpet area.
- **Agreement Value**: `Base Rate + Floor Rise (above 4th floor) + Preferred Location Charges (PLC)`.
- **Other Charges**: Development charges, clubhouse membership, advance maintenance, and society formation.
- **Statutory Taxes**:
  - GST: Standard residential 5% without ITC (or 1% affordable housing).
  - Stamp Duty: 5% (or 6% with local surcharge).
  - Registration: 1% capped at ₹30,000.
- **Discount Approval**: Sales executives can offer up to ₹50/sq.ft; higher discounts require `sales_head` approval.

### 4.2. Demand & Billing Engine (`demands.service.ts`)
- Triggered when civil engineers mark a structural stage complete (e.g., "12th Slab Casting").
- Automatically identifies all eligible bookings on that payment scheme.
- Generates itemized demand letters, computes GST, adjusts prior advances, and dispatches via email/WhatsApp.

### 4.3. Maker-Checker Collections & TDS Engine (`receipts.service.ts`)
- **Payment Modes**: NEFT, RTGS, Cheque, Demand Draft, UPI, Card.
- **Section 194-IA TDS**: Supports 1% TDS deduction for properties ≥ ₹50 Lakhs with Form 26QB verification.
- **FIFO Allocation**: Automatically settles oldest overdue demands first before clearing current installments.
- **Maker-Checker Workflow**: Receipt drafted by sales/collections rep (`pending`) -> approved by Accounts Manager (`approved`) -> updates customer ledger and posts Tally receipt voucher.

### 4.4. Lead Engine & Anti-Collision Routing (`leads.service.ts`)
- **Deduplication**: SHA-256 fingerprint on normalized mobile numbers. Re-enquiries update the existing lead timeline rather than creating duplicates.
- **Predictive Scoring**: Dynamic 0-100 score based on budget match, site visit attendance, family presence, and financing readiness.
- **Round-Robin Assignment**: Workload-balanced lead distribution among active presales/sales reps.
- **SLA Breach Monitoring**: Flags uncontacted leads older than 2 hours.

### 4.5. Channel Partner Protection & Payouts Engine (`channel-partners.service.ts`)
- **60-Day Protection Window**: When a CP tags a prospective buyer, anti-collision locking prevents other brokers or direct sales from poaching the client for 60 days.
- **Section 194-H TDS Compliance**:
  - Gross Brokerage = `Agreement Value × Slab %`.
  - GST (18%) added if CP is GST-registered.
  - Mandatory 5% Section 194-H TDS deducted from gross commission.
  - Net Payable = `Gross + GST - TDS`.
- **Automated Payout Disbursements**: Accounts manager approves commission, issues NEFT payout reference, and generates Form 16A TDS certificates.

---

## 5. API Reference Summary

All endpoints are prefixed with `/api/v1/realty/`:

| Endpoint | Method | Description |
|---|---|---|
| `/setup/projects` | GET, POST | Project settings, RERA numbers, bank accounts |
| `/setup/wings` | GET, POST | Wing creation and floor configurations |
| `/setup/unit-types` | GET, POST | Unit type catalog and carpet area definitions |
| `/setup/units/bulk-generate` | POST | Bulk generation of floor-wise inventory units |
| `/setup/schemes` | GET, POST | Payment schemes with 100% weightage validation |
| `/inventory` | GET | Real-time unit grid with color-coded status pills |
| `/inventory/:id/hold` | POST | Place 48-hour temporary hold on a unit |
| `/pricing/calculate` | POST | Real-time calculation of agreement value, taxes, and schedule |
| `/bookings` | GET, POST | Booking creation with 7-step wizard & schedule generation |
| `/bookings/:id/approve` | PATCH | Formal booking approval & unit status transition |
| `/demands/generate` | POST | Bulk milestone demand generation for completed slabs |
| `/receipts` | GET, POST | Maker-checker customer receipt creation |
| `/receipts/:id/approve` | PATCH | Approve receipt, update ledger, trigger Tally export |
| `/leads` | GET, POST | Lead management, filtering, and scoring |
| `/public/leads` | POST | Public lead capture webhook (Meta, Google, Portals) |
| `/channel-partners` | GET, POST | Developer CP directory, KYC approvals, and slabs |
| `/public/channel-partners/register` | POST | Public CP onboarding registration |
| `/channel-partners/tag-lead` | POST | CP lead tagging with 60-day anti-collision locking |
| `/channel-partners/brokerage` | GET | Commission ledger with Section 194-H TDS breakdown |
| `/feature-interest` | GET, POST | Record user early access requests for roadmap modules |

---

## 6. Seed Data & Verification

- **Seed Script**: `pnpm --filter @builderp/api db:seed:realty`
- **Tenant**: `kings` (`tenant_id: 1`, Kings Builders & Developers)
- **Project**: SITE-KH Kings Heights Tower A & B
  - Wing B: Ground + 23 Floors (~134 Units: 1RK 203 sq.ft, 1BHK 288-322 sq.ft, 7 Ground floor shops)
  - Base Rate: ₹26,250/sq.ft carpet, Floor Rise: ₹50/sq.ft per floor above 4th floor
  - Pay Stages: A–U (Call Money 13%, Registration 10%, Plinth 17%, Slabs 1-12 × 4% each, MEP & Finishing)
  - Channel Partners: 6 registered CPs across Bronze, Silver, Gold, Platinum tiers
  - Active Bookings: Multiple confirmed bookings with payment schedules, demands, and approved receipts
