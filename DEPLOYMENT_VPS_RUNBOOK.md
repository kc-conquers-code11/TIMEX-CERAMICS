# TIMEX CERAMIC — ENTERPRISE PRODUCTION DEPLOYMENT & DEVOPS RUNBOOK

**Author / Senior Dev:** Timex Engineering Team - Last updated by KC -(kc-conquers-code11)  
**System Classification:** Production E-Commerce & Surface Catalog Platform  
**Target Architecture:** Next.js 16 (React 19, Tailwind CSS v4, Webpack) + Node.js Express 5 + MySQL 8 + Nginx + PM2 on Ubuntu Linux  
**Target Host:** Hostinger Cloud VPS (`189.72.155.253`)  
**Active Production Path:** `/var/www/timex-ceramic-new`  

---

## 1. Executive Architecture Overview

```
                        +---------------------------------------------+
                        |             INTERNET / VISITORS             |
                        +---------------------------------------------+
                                               |
                                        [Port 80 / 443]
                                               v
                        +---------------------------------------------+
                        |            NGINX REVERSE PROXY              |
                        |      (SSL Termination / Gzip / Static)       |
                        +---------------------------------------------+
                                   |                       |
                  [/api/v1/*, /uploads/*,                  | [All Frontend Pages]
                   /catalogue/*]                           v
                                   v                +--------------------+
                        +--------------------+      |   PM2: ID 4        |
                        |   PM2: ID 5        |      |  timex-frontend    |
                        |  timex-backend     |      |  (Next.js SSR)     |
                        | (Express API Server)      |  Port: 3000        |
                        |  Port: 5001        |      +--------------------+
                        +--------------------+                 |
                                   |                           |
                                   +-------------+-------------+
                                                 | (Queries / Writes)
                                                 v
                                    +--------------------------+
                                    |         MYSQL 8          |
                                    |   DB: timex_ceramic      |
                                    | (Single Source of Truth) |
                                    +--------------------------+
```

### Critical Architectural Principle: Single Source of Truth
Historically, the platform suffered from a **split-brain glitch** where some operations wrote to flat JSON files (`server/data/store.json`) while others attempted to query MySQL, leading to data overwrites upon code deployments.  
**Strict Policy:** All production CRUD operations (Products, Variants, Colors, Categories, Spaces, Collections, Media, Inquiries, SEO) run **100% on MySQL (`timex_ceramic`)**. `store.json` is purely a local developer fallback/seed template and **must not be used as primary storage in production**.

---

## 2. Server Infrastructure & Topology

| Service / Resource | Value / Configuration |
| :--- | :--- |
| **VPS IP** | `189.72.155.253` (User: `root`, Port: `22`) |
| **Web Root Path** | `/var/www/timex-ceramic-new` |
| **Web Server / Proxy** | Nginx `1.28.3` (Ubuntu Linux) |
| **Process Manager** | PM2 (`timex-frontend` on port 3000, `timex-backend` on port 5001) |
| **Database Server** | MySQL 8.0 on `localhost:3306` |
| **Database Name** | `timex_ceramic` |
| **Database User** | `timex_user` |
| **Frontend Runtime** | Next.js 16.2.9 (App Router, Node.js 20+) |
| **Backend Runtime** | Express 5.2.1 |
| **Persistent Media** | `/var/www/timex-ceramic-new/public/uploads` |

---

## 3. Standard Deployment Workflow (Recommended CI/CD Runbook)

### Why We Build on Local Workstation and Deploy Artifacts
Next.js 16 with React 19, Tailwind v4, Three.js, and Framer Motion requires **2.5GB - 3.5GB peak memory** during Webpack optimization and static page generation (590+ pages).  
On standard VPS instances with 1GB - 2GB RAM and without adequate swap, running `next build` on the server causes the Linux kernel's **Out-Of-Memory (OOM) Killer** to immediately terminate the process with `SIGKILL`.

**Best Practice:** Build on a developer workstation or GitHub Actions runner, package the pre-compiled `.next` folder and updated `src/`, upload via `scp`, and reload PM2. This guarantees **zero-downtime** and zero memory pressure on the server.

---

### Step-by-Step Deployment Commands

#### Step 1: On Local Workstation (PowerShell / Terminal)
From the project directory (`timex/`):

```powershell
# 1. Run production build locally
npm run build

# 2. Package production build (excluding dev and cache files to keep package light ~57MB)
tar --exclude='.next/cache' --exclude='.next/dev' --exclude='.next/diagnostics' -czvf next_prod_build.tar.gz .next

# 3. Package source code changes
tar -czvf update_source.tar.gz src/

# 4. Upload both archives to the VPS
scp next_prod_build.tar.gz root@189.72.155.253:/var/www/timex-ceramic-new/
scp update_source.tar.gz root@189.72.155.253:/var/www/timex-ceramic-new/
```

#### Step 2: On Remote VPS Terminal (SSH)
Connect to the VPS and run:

```bash
cd /var/www/timex-ceramic-new

# 1. Extract updated source code and production build
tar -xzvf update_source.tar.gz
tar -xzvf next_prod_build.tar.gz

# 2. Restart frontend and backend with zero downtime
pm2 restart timex-frontend
pm2 restart timex-backend

# 3. Verify health
pm2 status
```

---

## 4. Database Operations & Migration Runbook

### Taking an Authoritative Database Dump
When taking backups on MySQL 8 with standard database users, the default `mysqldump` command attempts to lock tablespaces, requiring the global `PROCESS` administrative privilege. Always pass `--no-tablespaces`:

```bash
# Correct backup command:
mysqldump --no-tablespaces -u timex_user -p timex_ceramic > ~/backup_timex_ceramic_$(date +%F_%T).sql
```

### Syncing or Re-Migrating Flat Store Data to MySQL
If seed data or catalog imports ever need to be pushed into MySQL:

```bash
cd /var/www/timex-ceramic-new
npm run migrate:mysql
```
*Script location:* `server/scripts/sync-store-to-mysql.js`  
*Schema definition:* `server/schema_full_production.sql`

---

## 5. Historical Issues & Forensic Solutions Matrix

This section documents every critical issue encountered during deployments, its underlying root cause, and the definitive fix so future engineers never repeat them.

| # | Error / Symptom | Root Cause | Definitive Fix / Command |
| :- | :--- | :--- | :--- |
| **1** | `mysqldump: Got error: 1049: Unknown database 'timex_db'` | Database was incorrectly assumed to be `timex_db`. Actual production database name in `.env.production` is `timex_ceramic`. | Use `timex_ceramic` as database name in all connection strings and dumps. |
| **2** | `mysqldump: Access denied; you need PROCESS privilege for tablespaces` | MySQL 8 enables tablespace inspection by default on dump commands, requiring root-level PROCESS grant. | Append `--no-tablespaces` flag: `mysqldump --no-tablespaces -u timex_user -p timex_ceramic > backup.sql`. |
| **3** | `Schema Notice: You have an error in your SQL syntax near 'IF NOT EXISTS available_sizes_json'` | MySQL versions prior to 8.0.29 do not support `ADD COLUMN IF NOT EXISTS` syntax. | Wrap migration script with fallback execution that removes `IF NOT EXISTS` and catches `ER_DUP_FIELDNAME` safely. |
| **4** | `Table 'timex_ceramic.media' doesn't exist` | In `schema_full_production.sql` line 198, backtick syntax typo `` `caption TEXT` NULL `` caused the entire `media` table creation statement to fail. | Corrected to `` `caption` TEXT NULL ``. |
| **5** | `Duplicate entry 'TMX-SKU-TMX-362' for key 'products.sku'` | In retail tile catalogs, related series/models (e.g. Lagoon Series vs 226 Plain) legitimately share model numbers or SKU series. MySQL schema had a rigid `UNIQUE` constraint on `sku` and `code`. | Removed unique constraint from `sku` and `code`, keeping `id` (primary key) and `slug` (unique routing key) as unique: `ALTER TABLE products DROP INDEX sku; ALTER TABLE products DROP INDEX code;`. |
| **6** | `502 Bad Gateway (nginx/1.28.3)` | `timex-frontend` process crashed or entered a restart loop because the `.next` directory did not exist or was wiped before compilation finished. | Build `.next` before starting PM2, or stop PM2 (`pm2 stop timex-frontend`) while extracting the build archive, then start it. |
| **7** | `Next.js build worker exited with signal: SIGKILL` | Linux Out-Of-Memory (OOM) Killer terminated `next build` because compiling 590+ pages on React 19 exceeded VPS physical RAM. | (A) Build on workstation/CI and upload `next_prod_build.tar.gz`. (B) On VPS, configure a 2GB swapfile: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`. |

---

## 6. Daily Operations & Emergency Commands Cheat Sheet

### PM2 Process Management
```bash
# View process status, memory, uptime, and restarts
pm2 status

# View live consolidated logs
pm2 logs --lines 50

# View specific process logs without streaming
pm2 logs timex-frontend --lines 30 --nostream
pm2 logs timex-backend --lines 30 --nostream

# Zero-downtime reload
pm2 reload all

# Hard restart a specific process
pm2 restart timex-frontend
```

### MySQL Direct Health Queries
```bash
# Test connection and view last 3 updated products
mysql -u timex_user -p timex_ceramic -e "SELECT id, name, sku, updated_at FROM products ORDER BY updated_at DESC LIMIT 3;"

# Count records across all key tables
mysql -u timex_user -p timex_ceramic -e "
  SELECT 'products' as tbl, count(*) as count FROM products
  UNION ALL SELECT 'categories', count(*) FROM categories
  UNION ALL SELECT 'spaces', count(*) FROM spaces
  UNION ALL SELECT 'collections', count(*) FROM collections
  UNION ALL SELECT 'media', count(*) FROM media
  UNION ALL SELECT 'enquiries', count(*) FROM enquiries;
"
```

### Nginx Management
```bash
# Test configuration syntax before reloading
nginx -t

# Reload without dropping connections
systemctl reload nginx

# Check Nginx error logs
tail -n 50 /var/log/nginx/error.log
```

---

## 7. Configuration Files Reference

- **Frontend PM2 & Config:** `/var/www/timex-ceramic-new/ecosystem.config.js`
- **Environment Variables:** `/var/www/timex-ceramic-new/.env.production`
- **Database Schema Master:** `/var/www/timex-ceramic-new/server/schema_full_production.sql`
- **Database Migration Pipeline:** `/var/www/timex-ceramic-new/server/scripts/sync-store-to-mysql.js`
- **Static Assets & Uploads:** `/var/www/timex-ceramic-new/public/uploads`
- **Catalogues / PDFs:** `/var/www/timex-ceramic-new/public/catalogue`

---
*Maintained under Timex Ceramic Engineering Standards.*
