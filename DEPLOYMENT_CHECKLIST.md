# TCB-3 Production Deployment & Release Readiness Checklist

This document provides a comprehensive guide for deploying **TCB-3 (The Coaching Brand)** to production environments (Vercel, Render, Railway, AWS, Docker, or custom Linux VPS).

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    ClientBrowser[Client Browser (Desktop/Mobile)] -->|HTTPS / WSS| LoadBalancer[Next.js App / Edge Router]
    LoadBalancer -->|Protected Routes| Middleware[Auth Middleware & RBAC]
    Middleware -->|Dynamic SSR & API| ServerRoutes[Next.js 16 App Router]
    
    ServerRoutes -->|Prisma Pg Adapter| PostgreSQL[(PostgreSQL 15+ Database)]
    ServerRoutes -->|JWT Auth Cookies| AuthModule[JWT Auth Engine]
    ServerRoutes -->|Orders & Webhooks| RazorpayAPI[Razorpay Payment Gateway]
    ServerRoutes -->|Token Generation| LiveKitCloud[LiveKit Cloud SFU / WebRTC]
    
    ClientBrowser <-->|Direct Low-Latency Video| LiveKitCloud
```

---

## 2. Production Build & Start Commands

| Command | Purpose |
| :--- | :--- |
| `npm install` | Install all production and build dependencies. |
| `npm run postinstall` | Automatically executes `prisma generate` to compile the Prisma client. |
| `npm run db:push` | Synchronizes database schema with PostgreSQL instance. |
| `npm run build` | Compiles the production Next.js bundle with full TypeScript and route checks. |
| `npm run start` | Boots the optimized production Node.js server (Default Port: `3000`). |

---

## 3. Required Production Environment Variables

Configure these variables in your deployment platform's Environment Settings dashboard:

### A. Core & Authentication
| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Server/Client | Set to `production`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Client/Server | Canonical URL of your app (e.g. `https://tcb3.fitness`). |
| `JWT_SECRET` | Yes | Server-only | Cryptographic secret for signing session tokens ($\ge 32$ chars). Generate via `openssl rand -base64 32`. |

### B. Database (PostgreSQL)
| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Server-only | PostgreSQL connection string: `postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public&sslmode=prefer` |

### C. Payments (Razorpay)
| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Yes | Server-only | Public Razorpay Key (`rzp_test_...` or `rzp_live_...`). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Client-safe | Same as `RAZORPAY_KEY_ID` for frontend checkout modal. |
| `RAZORPAY_KEY_SECRET` | Yes | Server-only | Secret key from Razorpay Dashboard. |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Server-only | Secret configured in Razorpay Webhooks dashboard. |
| `PLATFORM_FEE_PERCENT` | Optional | Server-only | Platform commission percentage (Default: `10`). |

### D. Live Video & WebRTC (LiveKit Cloud)
| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `LIVEKIT_URL` | Yes | Server-only | WebSocket endpoint (e.g. `wss://tcb3.livekit.cloud`). |
| `LIVEKIT_API_KEY` | Yes | Server-only | LiveKit API Key. |
| `LIVEKIT_API_SECRET` | Yes | Server-only | LiveKit API Secret. |
| `SESSION_JOIN_WINDOW_MINUTES` | Optional | Server-only | Early session join buffer in minutes (Default: `15`). |

---

## 4. Production Database Strategy — Option A (Fresh Production Database)

> [!IMPORTANT]
> **Zero Impact on Development Database**: Do NOT migrate, overwrite, reset, or delete the existing local development database. The production database is completely isolated.

### Step-by-Step Safe Production Database Initialization Procedure:

1. **Provision a New Empty PostgreSQL Instance**:
   - Provision a fresh, dedicated PostgreSQL 15+ database instance on your managed hosting provider (e.g., AWS RDS, Supabase, Neon, Railway, Render).
   - Ensure the database is completely empty upon creation.

2. **Configure Production `DATABASE_URL`**:
   - Set `DATABASE_URL` in your production deployment platform's environment settings:
     `DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public&sslmode=prefer"`

3. **Deploy the Production Schema**:
   - Execute the non-destructive schema initialization command against the fresh production database:
     ```bash
     npx prisma db push
     ```
   - *Never* run destructive commands such as `prisma migrate reset` in any production or staging environment.

4. **Seed Deliberate Production-Safe Data Only**:
   - Seed *strictly* the 6 curated, production-verified elite coaches and their official coaching packages:
     ```bash
     curl -X GET https://your-production-domain.com/api/seed
     ```
   - **Data Hygiene Guarantee**: This procedure seeds *only* verified coaches (`Aryan Singh`, `Neha Sharma`, `Rahul Mehta`, `Ananya Desai`, `Vikram Malhotra`, `Karan Patel`).
   - **Zero Polluting Data**: No development test accounts, no mock payments, no fake video sessions, no fake messages, and no mock progress/analytics will ever be seeded into the production database.

5. **Verify Database Health**:
   - Verify public trainer listings return exactly the 6 active coaches:
     ```bash
     curl -s https://your-production-domain.com/api/trainers | jq .
     ```

---

## 5. Domain, HTTPS & Security Requirements

1. **Custom Domain & SSL/TLS**:
   - WebRTC, browser media streams (`getUserMedia`), and `Secure` HTTP cookies **strictly require HTTPS**.
   - Ensure an SSL/TLS certificate is active (e.g. Let's Encrypt, Cloudflare, AWS ACM).
2. **Browser Permissions**:
   - Modern browsers require user consent for Camera and Microphone access over HTTPS.
   - For two-person live coaching tests, **Device A (Athlete)** and **Device B (Coach)** must be separate physical devices or browsers to prevent hardware camera stream locks.
3. **Payment Webhook Endpoint**:
   - Configure your Razorpay Webhook URL to point to:
     `https://your-domain.com/api/webhooks/razorpay`
   - Active webhook events: `payment.captured`, `order.paid`, `payment.failed`.

---

## 6. Pre-Flight Deployment Checklist

- [x] All 31 Next.js routes compile cleanly in `npm run build` with **0 TypeScript and 0 lint errors**.
- [x] `.env.example` created with sanitized variable placeholders.
- [x] `.gitignore` verified to exclude `.env`, `.env.local`, and build artifacts.
- [x] Route middleware protects `/dashboard`, `/trainer/*`, `/workouts`, `/nutrition`, `/sessions`, and `/messages`.
- [x] Role-based access control redirects trainers to trainer dashboards and clients to athlete portals.
- [x] All database queries for public coaches enforce `status: "ACTIVE"` and `verified: true`.
- [x] All payments calculate integer paise amounts and platform fees server-side.
- [x] Video room tokens enforce server-side participant authorization.
- [x] Nutrition and workout tracking derive 100% of consumed values from stored database entries.

---

## 7. Post-Deployment Smoke Test Protocol

Perform this 14-step journey on the live production URL:

### Athlete (Client) Journey:
1. Navigate to `/signup` and create a Client account.
2. Browse `/trainers` and verify the 6 verified coach profiles render with accurate pricing and tags.
3. Open a trainer profile (e.g. `/trainers/1`).
4. Click **Request Coaching** (`/trainers/1/request`) and submit an application with a fitness goal.
5. Receive coaching acceptance and verify the new thread appears in `/messages`.
6. Open `/workouts` and view the assigned personalized periodization split.
7. Click **Log Workout** and record completed sets, weights, and RPE.
8. Open `/nutrition` and verify consumed values start at 0 kcal.
9. Click **+ Add Food** to log Breakfast; verify consumed calories, protein, and adherence update in real time.
10. Click **+500ml** water button; verify hydration updates.
11. Navigate to `/sessions` and verify scheduled coaching appointments.
12. Click **Join Video Room** to enter live coaching call.

### Coach (Trainer) Journey:
13. Log in with a Trainer account and verify `/trainer/dashboard` loads client metrics.
14. Navigate to `/trainer/programs` and build a workout split for an athlete.

---

## 8. Backup & Rollback Protocol

- **Database Automated Backups**: Configure daily automated snapshot backups with 7-day retention on your managed PostgreSQL provider.
- **Application Rollback**: Next.js deployments on Vercel/Railway support instant single-click rollbacks to previous build deployments if issues occur.
