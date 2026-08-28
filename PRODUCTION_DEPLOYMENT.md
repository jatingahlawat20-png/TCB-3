# TCB-3 — Production Deployment Guide

This document defines the production architecture, required external services, environment configuration, database procedures, security checklist, and post-deployment validation steps for **TCB-3 (The Coaching Brand)**.

---

## 1. Production Architecture Overview

TCB-3 is a modern full-stack web application built on **Next.js 16 (App Router)** and **PostgreSQL**.

```mermaid
flowchart TD
    subgraph Client Layer
        Browser[Client / Trainer Browser]
    end

    subgraph Edge & App Routing
        CDN[Edge CDN / HTTPS] --> Middleware[Next.js Auth & RBAC Middleware]
        Middleware --> AppRouter[Next.js 16 App Router (SSR & Dynamic APIs)]
    end

    subgraph Data & Storage
        AppRouter -->|Prisma Pg Adapter| PostgresDB[(Managed PostgreSQL 15+)]
    end

    subgraph External Infrastructure
        AppRouter -->|Token Issuance| LiveKit[LiveKit Cloud / WebRTC SFU]
        AppRouter -->|Order & Verification| Razorpay[Razorpay Payments]
        Browser <-->|Low Latency Video/Audio| LiveKit
    end

    Browser --> CDN
```

---

## 2. Required External Services

| Service | Purpose | Recommended Providers |
| :--- | :--- | :--- |
| **Application Hosting** | Next.js runtime, SSR, and API route execution | Vercel, Railway, Render, AWS Amplify, Docker |
| **Managed Database** | PostgreSQL 15+ database instance | Neon, Supabase, AWS RDS, Railway, Render |
| **Video & WebRTC** | Real-time live coaching video room infrastructure | LiveKit Cloud (`livekit.io`) |
| **Payment Gateway** | Client checkout, subscriptions & webhook processing | Razorpay (Test mode for sandbox / Live mode for production) |
| **Custom Domain & SSL** | HTTPS termination (mandatory for WebRTC and cookies) | Cloudflare, Vercel DNS, Route 53 |

---

## 3. Environment Variable Checklist

> [!WARNING]
> Never commit real secrets to version control. Configure these variables directly in your deployment platform's Environment Settings.

```env
# ==============================================================================
# 1. CORE RUNTIME CONFIGURATION
# ==============================================================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# ==============================================================================
# 2. DATABASE CONFIGURATION (PostgreSQL)
# ==============================================================================
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public&sslmode=prefer"

# ==============================================================================
# 3. AUTHENTICATION & JWT SECURITY
# ==============================================================================
# Minimum 32-character random secret (e.g. generated via: openssl rand -base64 32)
JWT_SECRET="YOUR_LONG_CRYPTOGRAPHIC_JWT_SECRET"

# ==============================================================================
# 4. PAYMENT GATEWAY (Razorpay)
# ==============================================================================
RAZORPAY_KEY_ID="rzp_live_or_test_key"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_or_test_key"
RAZORPAY_KEY_SECRET="YOUR_RAZORPAY_KEY_SECRET"
RAZORPAY_WEBHOOK_SECRET="YOUR_RAZORPAY_WEBHOOK_SECRET"
PLATFORM_FEE_PERCENT="10"

# ==============================================================================
# 5. WEBRTC & LIVE COACHING (LiveKit Cloud)
# ==============================================================================
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="YOUR_LIVEKIT_API_KEY"
LIVEKIT_API_SECRET="YOUR_LIVEKIT_API_SECRET"
SESSION_JOIN_WINDOW_MINUTES="15"
```

---

## 4. Production Database Setup (Option A — Fresh Production Database)

> [!IMPORTANT]
> **Development Database Isolation**: Do NOT migrate, overwrite, reset, or delete the existing local development database.

### Step-by-Step Database Initialization:

1. **Provision an Empty PostgreSQL Database**:
   - Create a fresh PostgreSQL 15+ database on your provider (Neon, Supabase, AWS RDS, etc.).
2. **Set `DATABASE_URL`**:
   - Add the connection string to your hosting provider's environment variables.
3. **Deploy Schema**:
   - Run the non-destructive schema deployment:
     ```bash
     npx prisma db push
     ```
   - *Alternative (Migration deployment)*: `npx prisma migrate deploy`
4. **Seed Deliberate Production-Safe Data**:
   - Seed *strictly* the 6 official verified elite coaches with their default coaching packages:
     ```bash
     curl -X GET https://your-domain.com/api/seed
     ```
   - **Data Hygiene Guarantee**: Seeds *only* 6 verified coaches (`Aryan Singh`, `Neha Sharma`, `Rahul Mehta`, `Ananya Desai`, `Vikram Malhotra`, `Karan Patel`). Zero test accounts, mock payments, fake sessions, or mock analytics are created.

---

## 5. Deployment Steps

1. **Push Code to Repository**:
   ```bash
   git add .
   git commit -m "feat: complete Phase 9 production deployment readiness"
   git push origin main
   ```
2. **Link to Hosting Platform**:
   - Import the repository in your hosting dashboard (Vercel, Railway, Render).
3. **Configure Environment Variables**:
   - Populate all variables from Section 3.
4. **Deploy Application**:
   - The platform will run `npm run postinstall` (`prisma generate`) and `npm run build`.
5. **Run Initial Schema Push & Seed**:
   ```bash
   npx prisma db push
   curl -X GET https://your-domain.com/api/seed
   ```
6. **Configure Webhooks**:
   - In Razorpay Dashboard, add webhook URL: `https://your-domain.com/api/webhooks/razorpay` with events: `payment.captured`, `order.paid`, `payment.failed`.

---

## 6. Post-Deployment Smoke Test Protocol

Verify the live deployment with this 14-step checklist:

- [ ] **1. Public Discovery**: Visit `https://your-domain.com/` and navigate to `/trainers`.
- [ ] **2. Trainer Marketplace**: Confirm exactly 6 verified coaches are displayed.
- [ ] **3. Athlete Signup**: Register a new client account at `/signup`.
- [ ] **4. Coaching Application**: Open a coach profile and click **Request Coaching**.
- [ ] **5. Coach Acceptance**: Log in as the coach and accept the request.
- [ ] **6. In-App Messaging**: Verify conversation thread is automatically opened in `/messages`.
- [ ] **7. Program Builder**: Coach creates a multi-week workout program for the client.
- [ ] **8. Workout Logging**: Client opens `/workouts`, logs completed workout with RPE and volume.
- [ ] **9. Nutrition Tracking**: Client opens `/nutrition`, confirms 0 kcal zero-state, logs food and water.
- [ ] **10. Session Scheduling**: Schedule a 1-on-1 coaching session in `/sessions`.
- [ ] **11. Video Room Entry**: Client and coach join the session room (using separate physical devices).
- [ ] **12. Media Controls**: Verify microphone mute, camera toggle, and timer in video room.
- [ ] **13. Payment Checkout**: Test package purchase in sandbox test mode.
- [ ] **14. Dashboard Analytics**: Verify client and coach dashboards reflect real logged data.

---

## 7. Rollback Precautions & Disaster Recovery

- **Instant Rollback**: Hosting platforms (Vercel / Railway) support single-click rollbacks to the previous immutable build deployment.
- **Database Snapshots**: Configure daily automated PostgreSQL backups with 7-day point-in-time recovery (PITR).
- **Non-Destructive Migrations**: All schema updates use additive migrations and never drop columns or tables without backward-compatible transition phases.

---

## 8. Security Pre-Flight Checklist

- [x] All cookies use `httpOnly: true`, `secure: true` (in production), and `sameSite: "lax"`.
- [x] JWT tokens signed with strong cryptographic secret.
- [x] Route middleware protects `/dashboard`, `/trainer/*`, `/workouts`, `/nutrition`, `/sessions`, `/messages`.
- [x] Public endpoints filter strictly for `status: "ACTIVE"` and `verified: true` trainer profiles.
- [x] Server-side price calculation and HMAC SHA-256 signature verification for payments.
- [x] Video room tokens restricted strictly to assigned participants.
- [x] Zero stack traces, database credentials, or secret keys leaked to client.
