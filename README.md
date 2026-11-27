# BuildERP

> Multi-tenant SaaS ERP for procurement, inventory, and goods management — built on NestJS + React.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22 LTS |
| pnpm | 9+ (`npm i -g pnpm@9`) |
| MySQL | 8.0+ (Running on port 3307, e.g. via XAMPP) |

---

## Quick Start

```bash
# 1. Start your local MySQL (running on port 3307)
# Database `builderp` is auto-connected

# 2. Start both API and Web in dev mode
pnpm dev
```

---

## Service URLs

| Service | URL |
|---|---|
| **API health** | http://localhost:3000/api/v1/health |
| **Swagger UI** | http://localhost:3000/api/docs |
| **Web app** | http://localhost:5173 |
| **Mailpit (email)** | http://localhost:8025 |
| **MinIO console** | http://localhost:9001 |

---

## Project Structure

```
goodsmanagement/
├── apps/
│   ├── api/          # NestJS 11 REST API
│   └── web/          # React 19 + Vite 7 + Tailux frontend
├── packages/
│   ├── config/       # Shared TypeScript, ESLint, Prettier configs
│   └── shared/       # Cross-platform types, enums, zod schemas, permissions
├── docker/
│   └── docker-compose.yml
├── docs/             # Architecture, tenancy, API, runbook
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Useful Commands

```bash
pnpm dev            # Start all apps in dev mode
pnpm build          # Build all apps
pnpm lint           # Lint all apps
pnpm test           # Run all tests

cd apps/api
pnpm db:studio   # Open Drizzle DB visual browser
pnpm db:push     # Push schema changes directly to MySQL
pnpm db:generate # Generate SQL migrations
```

---

## Documentation

| Doc | Description |
|---|---|
| [DESIGN.md](DESIGN.md) | Comprehensive System Design Document (Architecture, Subsystems, Schema, Workflows) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, tech stack, module roadmap |
| [TENANCY.md](docs/TENANCY.md) | Multi-tenancy strategy, Prisma extension, Redis |
| [API.md](docs/API.md) | API conventions, envelope, auth flow, pagination |
| [RUNBOOK.md](docs/RUNBOOK.md) | Local setup, common commands, troubleshooting |

---

## Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| **P0** | Monorepo scaffold, shared packages, docker, docs | ✅ Done |
| P1 | Auth (JWT + RBAC), tenant provisioning | 🔜 |
| P2 | Supplier & Item master data | 🔜 |
| P3 | Purchase Orders | 🔜 |
| P4 | Goods Receipt Notes + Stock | 🔜 |
| P5 | Supplier Invoicing (3-way match) | 🔜 |
| P6 | Payments + Ledger | 🔜 |
| P7 | Reports + GST summaries | 🔜 |
| P8 | Notifications (in-app + email) | 🔜 |
| P9 | File attachments (MinIO) | 🔜 |
| P10 | Multi-warehouse transfers | 🔜 |
