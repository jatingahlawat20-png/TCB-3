# TCB-3 — Final Production Deployment Plan

**Target Architecture:**
- **Frontend & API Routes**: Vercel (Next.js 16 App Router)
- **Production Database**: Neon Serverless PostgreSQL 15+ (Isolated Option A)
- **ORM & Migrations**: Prisma 7.9 with `@prisma/adapter-pg`
- **Live Video Coaching**: LiveKit Cloud
- **Payment Processing**: Razorpay Gateway (Sandbox / Live)
- **Domain & Security**: Custom Domain with Automated SSL/TLS (HTTPS)

---

## 1. Services & Accounts Required

| Service | Purpose | Account Registration URL |
| :--- | :--- | :--- |
| **Vercel** | Application deployment, edge routing, serverless API execution | [vercel.com/signup](https://vercel.com/signup) |
| **Neon** | Serverless PostgreSQL database (Option A: fresh empty DB) | [neon.tech](https://neon.tech) |
| **LiveKit Cloud** | Global SFU real-time video/audio room infrastructure | [cloud.livekit.io](https://cloud.livekit.io) |
| **Razorpay** | Payment processing, subscriptions, and webhooks | [dashboard.razorpay.com](https://dashboard.razorpay.com) |
| **Domain Registrar / DNS** | Custom domain configuration (e.g. Cloudflare, Namecheap, GoDaddy) | Your chosen registrar |

---

## 2. Required Environment Variable Names

These exact variable names are required by the existing codebase:

```env
# Core & Domain
NODE_ENV
NEXT_PUBLIC_APP_URL

# Database (Neon PostgreSQL)
DATABASE_URL

# Authentication Security
JWT_SECRET

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
PLATFORM_FEE_PERCENT

# Live Coaching / WebRTC (LiveKit Cloud)
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
SESSION_JOIN_WINDOW_MINUTES
```

---

## 3. Values to Obtain from Each Service

| Provider | Variable Name | Dashboard Location / How to Obtain |
| :--- | :--- | :--- |
| **Neon** | `DATABASE_URL` | Neon Console $\rightarrow$ Select Project $\rightarrow$ Connection Details $\rightarrow$ Copy connection string (Ensure `sslmode=require`). |
| **LiveKit** | `LIVEKIT_URL` | LiveKit Cloud Console $\rightarrow$ Project Settings $\rightarrow$ WebSocket URL (`wss://...livekit.cloud`). |
| **LiveKit** | `LIVEKIT_API_KEY` | LiveKit Cloud Console $\rightarrow$ Project Settings $\rightarrow$ Keys $\rightarrow$ API Key. |
| **LiveKit** | `LIVEKIT_API_SECRET` | LiveKit Cloud Console $\rightarrow$ Project Settings $\rightarrow$ Keys $\rightarrow$ API Secret. |
| **Razorpay** | `RAZORPAY_KEY_ID` | Razorpay Dashboard $\rightarrow$ Settings $\rightarrow$ API Keys $\rightarrow$ Key ID. |
| **Razorpay** | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same value as `RAZORPAY_KEY_ID`. |
| **Razorpay** | `RAZORPAY_KEY_SECRET` | Razorpay Dashboard $\rightarrow$ Settings $\rightarrow$ API Keys $\rightarrow$ Key Secret. |
| **Razorpay** | `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard $\rightarrow$ Settings $\rightarrow$ Webhooks $\rightarrow$ Create Webhook $\rightarrow$ Webhook Secret. |
| **Self-Generated** | `JWT_SECRET` | Run locally: `openssl rand -base64 32` (generate a strong 32+ character random string). |
| **Self-Provided** | `NEXT_PUBLIC_APP_URL` | Your custom production domain (e.g. `https://tcb3.fitness` or `https://tcb-3.vercel.app`). |
| **Default Settings** | `NODE_ENV` | `"production"` |
| **Default Settings** | `PLATFORM_FEE_PERCENT` | `"10"` |
| **Default Settings** | `SESSION_JOIN_WINDOW_MINUTES` | `"15"` |

---

## 4. Prisma Production Database Setup Commands

> [!IMPORTANT]
> **Zero Impact on Local Database**: The local development database is never touched, reset, or migrated.

When initializing the fresh Neon PostgreSQL database:

```bash
# Non-destructive schema deployment to the Neon production database:
npx prisma db push

# (Alternative declarative migration command):
# npx prisma migrate deploy
```

---

## 5. Safe Production Seed Procedure

To populate the 6 curated, production-verified elite coaches and their official coaching packages without polluting the database:

```bash
# Trigger the idempotent production seed endpoint once deployed:
curl -X GET https://your-domain.com/api/seed
```

**Seed Hygiene Guarantee:**
- Seeds **strictly** the 6 official coaches (*Aryan Singh, Neha Sharma, Rahul Mehta, Ananya Desai, Vikram Malhotra, Karan Patel*).
- **Zero test accounts**, **zero mock payments**, **zero fake sessions**, **zero fake messages**, and **zero mock analytics** will be created.

---

## 6. Vercel Deployment Configuration

1. **Framework Preset**: Next.js (automatically detected).
2. **Root Directory**: `./` (current directory).
3. **Build Command**: `npm run build` (or default Next.js build).
4. **Install Command**: `npm install` (triggers `postinstall: prisma generate` automatically).
5. **Node.js Version**: 20.x or 22.x.
6. **Environment Variables**: Add all variables from Section 2 in Vercel $\rightarrow$ Project Settings $\rightarrow$ Environment Variables (select Production & Preview).

---

## 7. LiveKit Production Configuration

1. Sign in to [LiveKit Cloud](https://cloud.livekit.io).
2. Create a new Project (e.g. `tcb-3-production`).
3. Copy the `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.
4. Enter these into your Vercel Environment Variables.
5. In-app tokens are generated server-side in [`/api/sessions/[id]/token`](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/api/sessions/[id]/token/route.ts) with 6-hour expirations and strict participant authorization.

---

## 8. Razorpay Production Configuration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. For testing/launch, use **Test Mode** keys (`rzp_test_...`). To activate real billing, switch to **Live Mode** keys (`rzp_live_...`).
3. In Razorpay Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add New Webhook**:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
   - **Secret**: Enter your `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: `payment.captured`, `order.paid`, `payment.failed`.

---

## 9. Custom Domain & HTTPS Setup

1. In Vercel Console $\rightarrow$ Project Settings $\rightarrow$ **Domains** $\rightarrow$ Add `yourdomain.com` and `www.yourdomain.com`.
2. Configure DNS records at your domain registrar:
   - `CNAME` for `www` $\rightarrow$ `cname.vercel-dns.com`
   - `A` record for apex domain $\rightarrow$ `76.76.21.21` (or Vercel DNS nameservers)
3. Vercel will automatically provision and renew the SSL/TLS certificate (HTTPS enabled by default).

---

## 10. Final Production Smoke-Test Checklist

Perform this 14-step end-to-end verification once the app is deployed:

- [ ] **1. Discovery**: Visit `https://your-domain.com/` and navigate to `/trainers`.
- [ ] **2. Marketplace**: Confirm exactly 6 verified coaches render with prices and tags.
- [ ] **3. Athlete Signup**: Create a new Client account at `/signup`.
- [ ] **4. Coaching Application**: Open a trainer profile and submit a coaching request.
- [ ] **5. Coach Login**: Log in as the coach and accept the request.
- [ ] **6. Messaging**: Confirm an automated conversation thread opens in `/messages`.
- [ ] **7. Program Builder**: Coach builds a customized workout split for the athlete.
- [ ] **8. Workout Logging**: Client opens `/workouts`, logs completed workout with sets, reps, weight, RPE.
- [ ] **9. Nutrition Tracking**: Client opens `/nutrition`, verifies 0 kcal zero-state, logs a meal and hydration.
- [ ] **10. Session Booking**: Schedule a 1-on-1 coaching session in `/sessions`.
- [ ] **11. Video Coaching Room**: Client and coach enter the video room on separate physical devices.
- [ ] **12. Media Controls**: Verify microphone mute, camera toggle, and timer in call.
- [ ] **13. Payment Flow**: Complete package checkout in Razorpay modal.
- [ ] **14. Dashboards**: Verify client and coach dashboards reflect real logged database entries.

---

## Separation of Responsibilities

### A. Things You Must Do Manually in Provider Dashboards:
1. Create a fresh PostgreSQL database in **Neon** and copy the `DATABASE_URL`.
2. Create a project in **LiveKit Cloud** and copy `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
3. Create/obtain **Razorpay** keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
4. Import the GitHub repository into **Vercel** and paste the environment variables into Vercel Settings.
5. Set up DNS records for your custom domain.

### B. Commands Antigravity Can Safely Execute:
1. Run local builds (`npm run build`) and verification tests.
2. Push schema to production database (`DATABASE_URL="..." npx prisma db push`) when provided with the target connection string.
3. Trigger the production seed endpoint (`curl -X GET https://your-domain.com/api/seed`).
4. Validate TypeScript, ESLint, and Next.js configuration.

### C. Secrets You Must Enter Yourself:
- `DATABASE_URL`
- `JWT_SECRET`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `LIVEKIT_API_SECRET`
*(Enter these directly into Vercel Settings or your secure deployment dashboard)*
