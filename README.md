# 🌾 Smart Ration System — ECE Major Project (v1.0 — Rice Only)

> Android App + Admin Panel + Backend API + MySQL  
> Stage 1: Project Setup & Database Foundation

---

## 📁 Monorepo Structure

```
smart-ration-system/
├── backend/          Node.js + Express + TypeScript + Prisma (MySQL)
├── admin-panel/      React 18 + Vite + TypeScript (Ant Design later)
├── android-app/      Kotlin + Jetpack Compose (Stage 4)
└── docs/             ER diagrams, API documentation (optional)
```

---

## 🗄️ Database Schema (MySQL — 9 Tables)

| Table | Purpose |
|-------|---------|
| `admins` | Admin panel login accounts |
| `families` | Family registrations (Family ID, head name, mobile, address, active status) |
| `family_members` | Individual members per family (name, relation, DOB, gender, head flag) |
| `users` | Mobile app login accounts (username + bcrypt-hashed password) linked to a family member |
| `rice_entitlements` | Monthly rice quota per family (monthlyQuotaKg, unitPerMemberKg) |
| `rice_distributions` | Every rice distribution record (kg distributed, remaining, date, status) |
| `notifications` | Notifications sent to families (auto-generated on distributions) |
| `face_profiles` | Enrolled face images + embeddings per family member (face-api.js) |
| `audit_logs` | All admin actions logged for traceability |

Full schema: [`backend/prisma/schema.prisma`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/prisma/schema.prisma)

---

## 🚀 Stage 1 — QUICK START GUIDE

### Prerequisites
1. **Node.js 20+** (with npm)
2. **MySQL 8.0+** (or MariaDB 10.x — works on Raspberry Pi later)
3. A MySQL user with CREATE/DROP/ALTER/INSERT/UPDATE/SELECT privileges

---

### Step 1 — Configure Backend

**File:** [`backend/.env`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/.env)

Update the `DATABASE_URL` to match *your* MySQL credentials:
```
DATABASE_URL="mysql://YOUR_MYSQL_USER:YOUR_MYSQL_PASSWORD@localhost:3306/smart_ration_db"
```

The default assumes:
- User: `root`
- Password: `password`
- Database: `smart_ration_db` (we'll create it below)

> **Security:** Never commit the real `.env` file. A template is provided at [`.env.example`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/.env.example).

---

### Step 2 — Create the MySQL Database

In your MySQL client (Workbench, CLI, phpMyAdmin):
```sql
CREATE DATABASE IF NOT EXISTS smart_ration_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

---

### Step 3 — Install Dependencies

```bash
cd backend
npm install
```

*(Dependencies should already be installed if the setup script ran.)*

---

### Step 4 — Generate Prisma Client

```bash
npm run prisma:generate
```

This reads the Prisma schema and generates the type-safe `@prisma/client`.

---

### Step 5 — Run Database Migrations (Create Tables)

```bash
npm run prisma:migrate -- --name init
```

This creates all 9 tables in `smart_ration_db` with proper foreign keys, indexes, and cascade rules.

---

### Step 6 — Seed the Default Admin User

```bash
npm run db:seed
```

Creates the default admin:
```
👤 Username : admin
🔐 Password : admin123
```

⚠️ **Change this password after first login in Stage 2+!**

---

### Step 7 — Start the Backend Server

**Development mode (auto-restart on file changes):**
```bash
npm run dev
```

**Production mode (compile & run):**
```bash
npm run build
npm start
```

---

### Step 8 — Verify the API is Running

Open these URLs in your browser (or use `curl` / Postman):

| Endpoint | URL | Expected Result |
|----------|-----|----------------|
| Root | `http://localhost:5000/` | Welcome JSON with API name + version |
| **Health Check** | `http://localhost:5000/api/v1/health` | Full system status: uptime, DB connection, memory |
| **Ping** | `http://localhost:5000/api/v1/health/ping` | Simple `pong` response |

---

### Step 9 — Admin Panel (Stage 1 Skeleton Only)

```bash
cd ../admin-panel
npm install
npm run dev
```
Then open `http://localhost:5173/`.

Full Ant Design admin features come in Stage 3.

---

### Step 10 — Android App (Stage 4 Only)

Placeholder structure documented in [`android-app/README.md`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/android-app/README.md).

Full Kotlin + Jetpack Compose implementation comes in Stage 4.

---

## 🔒 Security Implementation (Stage 1 Highlights)

| Concern | Implementation |
|---------|---------------|
| Password storage | `bcryptjs` with cost factor 12 (never plaintext) — see [`password.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/utils/password.ts) |
| API Auth | JWT (Access tokens 30min + Refresh tokens 7d) — see [`jwt.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/utils/jwt.ts) |
| Android → MySQL | ✅ **No direct connection.** Android calls API only. API connects to DB. |
| CORS | Restricted to Admin Panel origin (`http://localhost:5173`) + localhost variants — see [`server.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/server.ts) |
| Request validation | Middleware skeleton for Zod validation — ready in Stage 2 |
| Role-based access | `protect()` + `restrictTo('ADMIN')` middleware in [`auth.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/middleware/auth.ts) |
| Audit trail | All admin actions go to `audit_logs` table via [`auditService.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/services/auditService.ts) |
| Security headers | `helmet()` middleware applied globally |

---

## ✅ How to Test Stage 1

### Test 1: Backend Compilation
```bash
cd backend
npm run build
# Should produce dist/server.js with zero TypeScript errors
```

### Test 2: Health Endpoints
Start the dev server, then run:
```bash
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/health/ping
```

Expected for `/api/v1/health`:
```json
{
  "status": "success",
  "message": "Smart Ration System API is running",
  "data": {
    "timestamp": "...",
    "uptime": 12.34,
    "database": "connected",
    "environment": "development",
    "hostname": "...",
    "memory": { "totalMB": ..., "freeMB": ..., "usedMB": ... }
  }
}
```

If `database` shows `"disconnected"`, double-check:
1. MySQL is running
2. The `smart_ration_db` database exists
3. Credentials in `.env` DATABASE_URL are correct
4. You ran `npm run prisma:migrate -- --name init`

### Test 3: Admin User Seeded
After running `npm run db:seed`, open MySQL and check:
```sql
USE smart_ration_db;
SELECT id, username, fullName, email, createdAt FROM admins;
```
You should see the `admin` user record (passwordHash is NOT plaintext bcrypt).

### Test 4: 404 Route
`curl http://localhost:5000/api/v1/does-not-exist` should return a clean JSON error with status 404 (not an HTML Express default error page) — this confirms [`errorHandler.ts`](file:///c:/Users/MY%20COMPUTER/Documents/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/middleware/errorHandler.ts) is working.

---

## 📌 What's Next — Stage 2

Stage 2 will implement **all backend API endpoints**:
1. Admin login/logout (JWT issue + verify)
2. Family CRUD (create/edit/disable/search)
3. Family members management
4. Mobile app user creation (with bcrypt passwords)
5. Rice entitlement setting
6. Rice distribution recording (auto-compute remaining + auto-generate notifications)
7. Notifications listing + mark-as-read
8. Face enrollment endpoints (save image + embeddings)
9. Rice history queries, reports

Confirm "I'm ready for Stage 2" when Stage 1 is verified working on your machine!
