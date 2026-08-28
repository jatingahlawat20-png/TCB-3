# TCB-3 Phase 5: Real Payments & Financial Ledger Walkthrough

---

## 1. Overview & Objectives Accomplished

In Phase 5, we integrated a full-stack, production-grade payment architecture into **TCB-3** using Razorpay (Test Mode & Sandbox Engine) backed by PostgreSQL & Prisma ORM:

1. **Server-Side Price Isolation & Default Pricing**:
   - 1 Month: **₹999** (`99900` paise)
   - 3 Months: **₹2,499** (`249900` paise)
   - 6 Months: **₹4,499** (`449900` paise)
   - Amount is always retrieved server-side from the Prisma `CoachingPackage` record and never trusted from the client.
2. **Dual-Mode Razorpay Architecture**:
   - **Live Merchant Credentials**: Automatically launches the official `checkout.js` Razorpay iframe when valid live test credentials are configured.
   - **TCB-3 Sandbox Engine**: Seamlessly falls back to an interactive, branded **TCB-3 Razorpay Test Sandbox Modal** when running in offline or test placeholder mode, simulating Card, UPI (`success@razorpay`), and NetBanking payments.
3. **Cryptographic Signature Verification & Idempotency**:
   - HMAC-SHA256 signature verification over `order_id|payment_id` using the server-side `RAZORPAY_KEY_SECRET`.
   - Idempotency guard on `razorpayOrderId` prevents double-charging and duplicate records.
4. **Automated 10% Platform Fee Split & Ledger**:
   - Platform fee: 10% (`platformFee`)
   - Trainer earnings: 90% (`trainerEarnings`)
   - Stored in PostgreSQL in minor currency units (`paise`) using integer math.
5. **Strict Coaching Activation Invariant**:
   - A coaching relationship only transitions to **"Active Coaching (Paid)"** once a verified `PAID` payment record exists.
   - Accepted but unpaid requests clearly display **"Payment Required to Activate"** with checkout CTAs.
   - Once paid, redundant checkout buttons are removed from the client dashboard and replaced with **"✓ Enrolled & Paid"**.

---

## 2. Changes by Component

### A. Database & Schema
* **[prisma/schema.prisma](file:///c:/Users/hp/OneDrive/Documents/tcb-3/prisma/schema.prisma)**:
  - Added `Payment` model and `PaymentStatus` enum (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
  - Added relations between `User` (Client), `TrainerProfile` (Trainer), `CoachingPackage`, and `Payment`.

### B. Core Libraries & Helpers
* **[src/lib/razorpay.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/lib/razorpay.ts)**:
  - Added `createRazorpayOrder`, `verifyRazorpayPaymentSignature`, `verifyRazorpayWebhookSignature`, and paise/rupees arithmetic helpers.
* **[src/lib/trainers.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/lib/trainers.ts)** & **[src/lib/seed.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/lib/seed.ts)**:
  - Updated default pricing across demo trainers to ₹999 / ₹2499 / ₹4499.

### C. API Endpoints
* **[src/app/api/payments/create-order/route.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/api/payments/create-order/route.ts)**:
  - Server-side package price retrieval, 10% fee calculation, and `PENDING` payment creation.
* **[src/app/api/payments/verify/route.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/api/payments/verify/route.ts)**:
  - Cryptographic HMAC-SHA256 signature verification, idempotency guard, and `PAID` status transition.
* **[src/app/api/payments/history/route.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/api/payments/history/route.ts)**:
  - Role-based invoice history (Client invoices vs. Trainer earnings metrics & ledger).
* **[src/app/api/webhooks/razorpay/route.ts](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/api/webhooks/razorpay/route.ts)**:
  - Upstream webhook listener for automated payment synchronization.

### D. UI Components & Dashboards
* **[src/components/payments/razorpay-sandbox-modal.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/components/payments/razorpay-sandbox-modal.tsx)**:
  - Interactive test payment modal supporting Test Card, UPI, and NetBanking simulation.
* **[src/components/payments/checkout-button.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/components/payments/checkout-button.tsx)**:
  - Universal checkout button managing dual-mode checkout and verification callback.
* **[src/components/payments/payment-history-table.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/components/payments/payment-history-table.tsx)**:
  - Client invoices table with printable receipt modal.
* **[src/components/trainer/earnings-ledger.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/components/trainer/earnings-ledger.tsx)**:
  - Trainer financial dashboard showing Gross, 10% Fee, Net Payout, and full ledger.
* **[src/app/dashboard/page.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/dashboard/page.tsx)**:
  - Integrated payment history, coaching activation invariants, and paid status badges.
* **[src/app/trainer/dashboard/page.tsx](file:///c:/Users/hp/OneDrive/Documents/tcb-3/src/app/trainer/dashboard/page.tsx)**:
  - Integrated earnings ledger and paid/unpaid status indicators in active client roster.

---

## 3. Verification & Test Results

### 1. Automated Test Suite
* Ran `verify_phase5_audit.mjs` with **32/32 tests passed**:
  - Exact price calculations (₹999 / 99900 paise).
  - Platform fee split (₹99.90 / 9990 paise).
  - Trainer net payout (₹899.10 / 89910 paise).
  - Idempotent signature replay protection.
  - Page refresh idempotency (0 duplicate records created).

### 2. Next.js Production Build
* `npm run build` compiled all 22 routes with **0 errors**:
  - `✓ Compiled successfully in 18.8s`
  - `✓ Generating static pages using 3 workers (22/22)`
