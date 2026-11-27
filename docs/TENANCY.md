# BuildERP — Multi-Tenancy Architecture & Security Isolation

## 1. Multi-Tenancy Model Overview

BuildERP implements a **Shared Database, Shared Schema, Row-Level Partitioned Multi-Tenancy Architecture**. This approach delivers optimal resource efficiency, seamless horizontal scaling, low operational maintenance overhead, and instant tenant provisioning without requiring separate database instances or schema migrations per tenant.

```
Incoming Request (e.g. kings.builderp.in OR X-Tenant-ID: kings)
                           │
                           ▼
                 TenantMiddleware
   ┌────────────────────────────────────────────────────────┐
   │ 1. Extract subdomain or header (X-Tenant-ID)           │
   │ 2. Query `tenants` table where slug = :slug            │
   │ 3. Verify status === 'active'                          │
   │ 4. Attach TenantContext to `req.tenant`                │
   └────────────────────────────────────────────────────────┘
                           │
                           ▼
                  Controller / Service
   ┌────────────────────────────────────────────────────────┐
   │ Drizzle query automatically scopes by tenant.id:       │
   │ SELECT * FROM purchase_orders WHERE tenant_id = ?      │
   └────────────────────────────────────────────────────────┘
```

---

## 2. Tenant Context Resolution Hierarchy

The `TenantMiddleware` resolves tenant identity using the following resolution order:

1. **Explicit Custom Header (`X-Tenant-ID` or `x-tenant`):**  
   Primary mechanism used by programmatic API clients, automated mobile integrations, and frontend HTTP interceptors.
   ```http
   X-Tenant-ID: kings
   ```

2. **Wildcard Host Subdomain (`*.builderp.in`):**  
   Evaluates `req.headers.host`. When a user navigates to `kings.builderp.in`, the subdomain `kings` is resolved. Reserved subdomains (`www`, `api`, `admin`, `staging`) are excluded.

3. **Local Development Default:**  
   If running on `localhost:3000` or `127.0.0.1` and no header is provided, the middleware automatically binds to the primary demo tenant **`kings`** (*Kings Builders & Developers*).

---

## 3. Database Partitioning & Indexing Strategy

All 34 application tables enforce strict tenant partitioning:
- `tenant_id BIGINT NOT NULL` present on every table.
- Composite unique indexes `(tenant_id, document_number)` and `(tenant_id, code)` prevent cross-tenant collisions while allowing each tenant to maintain independent document sequences (e.g. `KB/PO/26-27/0001`).
- Dedicated foreign-key B-Tree indexes on `tenant_id` guarantee sub-millisecond query execution even with tens of thousands of rows per tenant.

### Table Schema Partition Matrix

| Table | Tenant Key | Isolation Index | Collision Safeguard |
|---|---|---|---|
| `users` | `tenant_id` | `user_tenant_idx` | `UNIQUE(tenant_id, username)`, `UNIQUE(tenant_id, email)` |
| `roles` | `tenant_id` | `role_tenant_idx` | `UNIQUE(tenant_id, code)` |
| `items` | `tenant_id` | `item_tenant_idx` | `UNIQUE(tenant_id, code)` |
| `vendors` | `tenant_id` | `vendor_tenant_idx` | `UNIQUE(tenant_id, code)` |
| `contractors` | `tenant_id` | `contractor_tenant_idx` | `UNIQUE(tenant_id, code)` |
| `purchase_orders` | `tenant_id` | `po_tenant_idx` | `UNIQUE(tenant_id, po_number)` |
| `goods_receipt_notes` | `tenant_id` | `grn_tenant_idx` | `UNIQUE(tenant_id, grn_number)` |
| `stock_balances` | `tenant_id` | `sb_tenant_idx` | `UNIQUE(tenant_id, warehouse_id, item_id)` |
| `work_orders` | `tenant_id` | `wo_tenant_idx` | `UNIQUE(tenant_id, wo_number)` |
| `ra_bills` | `tenant_id` | `ra_tenant_idx` | `UNIQUE(tenant_id, bill_number)` |
| `notifications` | `tenant_id` | `notif_tenant_idx` | `INDEX(tenant_id, is_read)` |

---

## 4. Tenant Customization & Branding Engine

Every tenant possesses its own configurable identity:
- **Company Name & Tagline:** e.g. *Kings Builders & Developers • Builders & Developers*
- **Registered GSTIN:** e.g. *27AABCK1234F1Z5* (Maharashtra, state code 27)
- **Primary Theme Color:** e.g. Kings Gold (`#c5a04e`), injected dynamically into the frontend CSS custom properties (`--primary-theme-color`).
- **Brand Logo:** Rendered in sidebar and official document print headers.
- **Tenant-Enforced 2FA Policy:** Directors can toggle `mfa_enabled = true` on the tenant record to require all employees to authenticate with TOTP tokens.

---

## 5. Security Invariants & Cross-Tenant Leakage Prevention

1. **No Shared Sequence Numbers:** Every tenant maintains independent auto-incrementing document series records via the `document_series` table.
2. **Strict Guard Interception:** The `TenantContext` object is immutable throughout the lifecycle of the HTTP request.
3. **Audit Trails with Tenant Scoping:** Every user action logged in `audit_logs` records the `tenant_id`, enabling isolated compliance audits.
