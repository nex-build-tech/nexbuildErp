# BuildERP — Production Deployment Guide

This guide covers deploying BuildERP to a Linux VPS (Ubuntu 22.04 / 24.04 LTS) or AWS EC2, configured with **wildcard subdomains** (`*.builderp.in`), **Let's Encrypt Wildcard SSL**, **Nginx reverse proxy**, **PM2 process manager** (or optional Docker setup), and production-hardened environment configurations.

---

## 1. Production Architecture Overview

```
                      Internet
                         │
                         ▼
             [ Nginx Reverse Proxy (Port 80 / 443) ]
             [ Wildcard SSL: *.builderp.in         ]
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  Frontend (SPA)                  Backend API (NestJS)
  `*.builderp.in`                 `api.builderp.in`
  Static files via Nginx          Reverse Proxied to
  /var/www/builderp/apps/web/dist `http://127.0.0.1:3000`
                                         │
                                  ┌──────┴──────┐
                                  ▼             ▼
                            MySQL 8.0+      Redis 7+
                            (or RDS)      (BullMQ queue)
```

---

## 2. Infrastructure & Sizing Guide

| Tenant Scale | CPU | RAM | Disk (NVMe/SSD) | Recommended AWS Instance |
|---|---|---|---|---|
| **Starter (1–10 tenants, <50 users)** | 2 vCPU | 4 GB | 40 GB | `t4g.medium` or Hetzner CX22 |
| **Growth (10–50 tenants, <500 users)** | 4 vCPU | 8 GB | 80 GB | `c6g.xlarge` or Hetzner CX32 |
| **Enterprise (50+ tenants)** | 8 vCPU | 16 GB | 200 GB | Separate API (`c6g.2xlarge`) + Managed RDS MySQL |

---

## 3. DNS Configuration

Configure your DNS provider (e.g., Cloudflare, Route53, GoDaddy) with the following records pointing to your server's Public Elastic IP:

| Type | Name | Target / Value | Purpose |
|---|---|---|---|
| `A` | `builderp.in` | `198.51.100.1` | Main landing / root domain |
| `A` | `api.builderp.in` | `198.51.100.1` | API Gateway endpoint |
| `A` | `*.builderp.in` | `198.51.100.1` | Wildcard subdomains for all tenants (e.g., `kings.builderp.in`) |

---

## 4. Server Setup & System Hardening

On your fresh Ubuntu 24.04 LTS instance:

```bash
# Update and install base utilities
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban certbot python3-certbot-nginx

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Install Node.js 22 LTS & pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2

# Install and start MySQL Server (if not using AWS RDS)
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## 5. Wildcard SSL Certificate (Let's Encrypt via DNS-01)

Wildcard certificates (`*.builderp.in`) require the **DNS-01 ACME challenge** (since HTTP-01 cannot issue wildcards).

### Option A: Cloudflare DNS Plugin (Automated Renewal)
```bash
sudo apt install -y python3-certbot-dns-cloudflare

# Create /etc/letsencrypt/cloudflare.ini with:
# dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d builderp.in \
  -d "*.builderp.in" \
  --agree-tos \
  -m admin@builderp.in \
  --non-interactive
```

### Option B: Manual DNS Challenge (Any Registrar)
```bash
sudo certbot certonly --manual --preferred-challenges=dns \
  -d builderp.in -d "*.builderp.in"
# Add the displayed TXT records to your DNS panel and press Enter.
```

---

## 6. Nginx Wildcard Configuration

Create `/etc/nginx/sites-available/builderp`:

```nginx
# 1. HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name builderp.in *.builderp.in;
    return 301 https://$host$request_uri;
}

# 2. API Backend (api.builderp.in)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.builderp.in;

    ssl_certificate /etc/letsencrypt/live/builderp.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/builderp.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. Tenant Frontend Web App (*.builderp.in & builderp.in)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name builderp.in *.builderp.in;

    ssl_certificate /etc/letsencrypt/live/builderp.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/builderp.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/builderp/apps/web/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the site configuration and test:
```bash
sudo ln -s /etc/nginx/sites-available/builderp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Application Deployment via PM2

### Clone & Build
```bash
sudo mkdir -p /var/www/builderp
sudo chown -R $USER:$USER /var/www/builderp
cd /var/www/builderp

git clone https://github.com/your-org/builderp.git .
pnpm install --frozen-lockfile

# Set up production environment
cp apps/api/.env.example apps/api/.env.production
# Edit apps/api/.env.production with DB credentials, production JWT secrets, etc.

# Build backend and frontend
cd apps/api && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..

# Run migrations and seeding
cd apps/api
pnpm db:migrate
pnpm db:seed
cd ../..
```

### PM2 Configuration (`ecosystem.config.js`)
Create `ecosystem.config.js` in `/var/www/builderp`:

```javascript
module.exports = {
  apps: [
    {
      name: 'builderp-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 'max',       // Utilize all available CPU cores in cluster mode
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
    },
  ],
};
```

### Launch and Auto-Start on Reboot
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd
# Run the command outputted by pm2 startup to configure systemd service
```

---

## 8. Alternative Container Deployment (Docker)

If your operations team prefers containerized deployments, use Docker Compose:

### `Dockerfile.api`
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
RUN cd apps/api && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/apps/api/dist ./apps/api/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
```

### `docker-compose.prod.yml`
```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://builderp:secret@db:3306/builderp
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - db

  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: builderp
      MYSQL_USER: builderp
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## 9. Automated Daily Backups Setup

Set up a root cron job to run the backup script every night at 2:00 AM:

```bash
sudo crontab -e
```
Add line:
```cron
0 2 * * * /var/www/builderp/scripts/backup-mysql.sh >> /var/log/builderp-backup.log 2>&1
```

The script automatically creates gzip-compressed, SHA-256 checksummed archives and deletes backups older than 14 days.

---

## 10. Production Checklist

- [ ] Node.js v22 LTS and pnpm installed.
- [ ] MySQL 8+ root secured with strong credentials; database created with `utf8mb4`.
- [ ] JWT access and refresh secrets are randomized strings $\ge 32$ characters.
- [ ] Wildcard DNS record `*.builderp.in` resolved to the server IP.
- [ ] Wildcard SSL certificate active and renewal cron/systemd timer verified.
- [ ] Nginx configured with reverse proxy for API and single-page routing for web.
- [ ] PM2 processes running in cluster mode with automatic restart on server reboot.
- [ ] Nightly backup cron configured and tested.
- [ ] UFW firewall enabled (only ports 22, 80, 443 exposed).
