# BuildERP — Local Development & Operations Runbook

This runbook covers day-to-day development, testing, database operations, and maintenance for BuildERP without complex container overhead.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Verified Environment |
|---|---|---|
| **Node.js** | v20 LTS or v22 LTS | Windows 10/11 x64, macOS, Linux |
| **Package Manager** | `pnpm` v9+ | Fast, space-efficient hard-linking |
| **Database** | MySQL 8.0+ or MariaDB 10.4+ | Running locally on port `3307` (or default `3306`) |
| **ORM** | Drizzle ORM | Native, zero-runtime overhead, lightweight SQL builder |

---

## 2. Quickstart Development Setup

### Step 1: Install Dependencies
From the repository root (`D:\demo\goodsmanagement`):
```bash
pnpm install
```

### Step 2: Environment Configuration
Copy sample environment files if not already present:
```bash
# Backend environment
cp apps/api/.env.example apps/api/.env

# Frontend environment
cp apps/web/.env.example apps/web/.env
```

Ensure `apps/api/.env` has the correct database connection:
```env
PORT=3000
DATABASE_URL=mysql://root:@localhost:3307/builderp
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=builderp

JWT_SECRET=super-secret-build-erp-signing-key-minimum-32-chars!
JWT_REFRESH_SECRET=super-secret-build-erp-refresh-key-minimum-32-chars!

# Optional BullMQ Redis (falls back automatically to in-memory queue when omitted)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 3: Run Database Migrations & Seeds
Populate schema tables and the comprehensive **Kings Builders & Developers** demonstration dataset:
```bash
cd apps/api
pnpm db:migrate
pnpm db:seed
cd ../..
```

### Step 4: Start Services
You can run both API and Web concurrently from the root or in individual terminals:
```bash
# Run both frontend & backend concurrently:
pnpm dev

# Or run separately:
# Terminal 1 (API Server - http://localhost:3000)
cd apps/api && pnpm start:dev

# Terminal 2 (Web Client - http://localhost:5173)
cd apps/web && pnpm dev
```

---

## 3. Demo Credentials (Kings Builders & Developers)

| Role | Email | Password | Tenant ID / Slug |
|---|---|---|---|
| **Owner / Director** | `owner@kingsbuilders.com` | `Password123!` | `kings` |
| **Project Manager** | `pm@kingsbuilders.com` | `Password123!` | `kings` |
| **Procurement Manager**| `purchase@kingsbuilders.com` | `Password123!` | `kings` |
| **Site Engineer** | `site@kingsbuilders.com` | `Password123!` | `kings` |
| **Store Keeper** | `stores@kingsbuilders.com` | `Password123!` | `kings` |
| **Accountant** | `accounts@kingsbuilders.com` | `Password123!` | `kings` |

---

## 4. Daily Database Backups

BuildERP includes automated, verifiable daily backup scripts with automatic 14-day retention.

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-mysql.ps1
```
*Output*: Generates timestamped SQL dump in `backups/builderp_backup_YYYYMMDD_HHMMSS.sql`.

### Linux / Production VPS (Bash)
```bash
chmod +x scripts/backup-mysql.sh
./scripts/backup-mysql.sh
```
*Features*: Includes `gzip -9` compression, `sha256sum` verification checksums, and auto-purging of archives older than 14 days.

---

## 5. Testing & Code Quality Checks

Execute these commands before committing code or deploying:

```bash
# 1. Typecheck the entire monorepo
pnpm -r exec tsc --noEmit

# 2. Build backend application
cd apps/api && pnpm build && cd ../..

# 3. Build frontend bundle
cd apps/web && pnpm build && cd ../..

# 4. Run automated test suites
cd apps/api && pnpm test
```

---

## 6. Troubleshooting Common Issues

### 1. Database Connection Refused (`ECONNREFUSED 127.0.0.1:3307`)
- Ensure your local MySQL or MariaDB service is active.
- Verify the listening port via `netstat -ano | findstr :3307` or check your XAMPP / MariaDB control panel.
- If running on standard MySQL port 3306, adjust `DB_PORT=3306` in `apps/api/.env`.

### 2. Port 3000 Already in Use
Find the PID holding port 3000 and terminate it:
```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### 3. Queue Notification Warning in Logs
If Redis is not installed locally, you may see:
`[QueueService] BullMQ not initialized. Queueing job in memory fallback queue.`
This is expected and normal for local lightweight setups. The application executes email and WhatsApp notification simulations asynchronously in-memory without error.
