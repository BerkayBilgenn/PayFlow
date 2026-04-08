# Feature Specification: P2P Payment Request System

> **Feature ID**: 001-p2p-payment-request
> **Status**: Implementation Complete — Production Hardening Phase
> **Last Updated**: 2026-04-08
> **Author**: Bilge (spec-driven with AI-native workflow)

---

## 1. Overview

PayFlow is a consumer fintech application that enables Peer-to-Peer (P2P) money requests — functionally equivalent to Venmo's "Request" or Cash App's payment requests. Users can request money from friends via email, track the lifecycle of each request on a dashboard, and fulfill or decline incoming requests — all with real-time balance updates, shareable links, and bank-grade input validation.

### 1.1 Problem Statement

Users need a fast, secure way to request money from friends and contacts without exchanging bank details. The system must handle the full lifecycle: creation → notification → fulfillment or expiration, with clear status transparency for both sender and recipient.

### 1.2 Success Criteria

| Metric | Target |
|---|---|
| Request creation → confirmation | < 2 seconds |
| Payment simulation → status update | 2–3 seconds (simulated processing) |
| Dashboard load (50 requests) | < 1 second |
| Mobile responsiveness | Fully functional on 375px+ viewports |
| E2E test pass rate | 100% on critical paths |
| Automated video recording | All E2E tests produce `.webm` recordings |

---

## 2. User Stories & Acceptance Criteria

### US-1: Request Creation Flow

**As a** logged-in user,
**I want to** send a payment request to a friend's email,
**So that** they receive a notification and can pay me directly.

**Acceptance Criteria:**
- [ ] User enters recipient email/phone, amount ($0.01–$10,000), and optional note
- [ ] System validates all inputs before submission (see §6 Input Validation)
- [ ] On success: creates a `PENDING` request with UUID, shows success toast with amount and recipient
- [ ] On success: modal closes, request appears in Outgoing list immediately
- [ ] On failure: inline error message without closing modal
- [ ] Self-requesting (own email) is blocked with explicit error message

### US-2: Request Management Dashboard

**As a** logged-in user,
**I want to** see all my incoming and outgoing payment requests,
**So that** I can track their status and take action.

**Acceptance Criteria:**
- [ ] Two primary tabs: **Incoming** (requests TO me) and **Outgoing** (requests FROM me)
- [ ] Status sub-filter tabs: All | Pending | Paid | Declined | Expired
- [ ] Search bar: real-time filter by sender/recipient email (debounced 300ms)
- [ ] Each request card shows: contact email, amount, note, status badge, expiration date
- [ ] Empty states: contextual illustration + message (e.g., "No pending requests — you're all caught up!")
- [ ] Mobile-responsive: cards stack vertically on viewports < 768px
- [ ] Balance card shows derived balance: `wallet_balance + total_received - total_sent`

### US-3: Request Detail View (Shareable Link)

**As a** user (authenticated or not),
**I want to** view a specific payment request via its unique URL,
**So that** I can see amount, note, and take action if I'm the recipient.

**Acceptance Criteria:**
- [ ] Route: `/request/[id]` — publicly accessible (no auth required to VIEW)
- [ ] Displays: amount (formatted as currency), note, sender email, recipient email, created timestamp
- [ ] Shows dynamic expiration countdown: "Expires in 5 days 3 hours" (turns red if < 24h remaining)
- [ ] **Authenticated recipient**: shows "Pay" and "Decline" buttons (if status is PENDING)
- [ ] **Authenticated sender**: shows "Cancel" button (if status is PENDING)
- [ ] **Unauthenticated viewer**: shows amount, note, and a "Login to Pay" call-to-action button
- [ ] **Invalid UUID or nonexistent ID**: returns styled 404 page with "Request not found" message
- [ ] **Non-PENDING status**: shows read-only view with status badge (PAID / DECLINED / EXPIRED / CANCELED)

### US-4: Payment Fulfillment (Simulated)

**As a** recipient of an incoming payment request,
**I want to** click "Pay" to fulfill the request,
**So that** the sender receives the funds and both dashboards update.

**Acceptance Criteria:**
- [ ] Click "Pay" → opens PIN confirmation modal (demo PIN: `1234`)
- [ ] Correct PIN → 2–3 second loading animation (simulated payment processing)
- [ ] On success: status transitions to `PAID`, success toast appears
- [ ] Sender's balance increases by the paid amount (via `derivedBalance` recalculation)
- [ ] Recipient's balance decreases by the paid amount
- [ ] Incorrect PIN → shake animation, "Incorrect code. Please try again." error
- [ ] If request is no longer PENDING (race condition): "This request has already been paid" toast

### US-5: Request Cancellation & Decline

**As a** sender, I can cancel my own PENDING outgoing request.
**As a** recipient, I can decline an incoming PENDING request.

**Acceptance Criteria:**
- [ ] Cancel/Decline buttons only visible when status is `PENDING`
- [ ] Successful action: status updates, toast notification confirms
- [ ] Expired requests: actions are hidden, status badge shows `EXPIRED`

### US-6: Shareable Link (Copy to Clipboard)

**As a** user viewing any request (on dashboard or detail page),
**I want to** copy the request's unique URL to share with the recipient,
**So that** they can open it directly in their browser.

**Acceptance Criteria:**
- [ ] "Copy Link" button on every request card
- [ ] Copies `{origin}/request/{id}` to clipboard
- [ ] Shows success toast: "Link copied to clipboard!"
- [ ] Works on both desktop and mobile browsers

### US-7: Request Expiration

**As the** system,
**I want to** automatically expire requests older than 7 days,
**So that** stale requests cannot be accidentally fulfilled.

**Acceptance Criteria:**
- [ ] `expires_at` = `created_at + 7 days` (set on creation)
- [ ] Client-side: `getEffectiveStatus()` checks `expires_at` and returns `EXPIRED` for pending requests past expiry
- [ ] Expired requests: "Pay" and "Decline" buttons are hidden
- [ ] Detail page shows: "This request expired on [date]" in red
- [ ] Server-side: DB constraint prevents status updates on expired rows

---

## 3. Data Models

### 3.1 Table: `profiles`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | Primary Key, references `auth.users.id` |
| `email` | TEXT | Unique, Not Null |
| `balance` | DECIMAL(12,2) | Default 50000.00, Not Null |
| `created_at` | TIMESTAMPTZ | Default NOW() |

### 3.2 Table: `payment_requests`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | Primary Key, Default `gen_random_uuid()` |
| `sender_id` | UUID | FK → `auth.users(id)`, Not Null |
| `sender_email` | TEXT | Not Null |
| `recipient_email` | TEXT | Not Null |
| `recipient_contact` | TEXT | Not Null (email or phone) |
| `amount` | DECIMAL(10,2) | Not Null, CHECK (`amount > 0`), CHECK (`amount <= 10000`) |
| `note` | TEXT | Nullable |
| `status` | payment_status | Default `'PENDING'`, Not Null |
| `created_at` | TIMESTAMPTZ | Default NOW(), Not Null |
| `expires_at` | TIMESTAMPTZ | Default `NOW() + INTERVAL '7 days'`, Not Null |

### 3.3 Enum: `payment_status`

```sql
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'DECLINED', 'EXPIRED', 'CANCELED');
```

### 3.4 Derived State (Client-Side)

```typescript
// Effective status accounts for expiration
function getEffectiveStatus(request: PaymentRequest): PaymentStatus {
  if (request.status === 'PENDING' && new Date(request.expires_at) < new Date()) {
    return 'EXPIRED';
  }
  return request.status;
}

// Derived balance shown on wallet card
const derivedBalance = walletBalance + totalReceived - totalSent;
```

---

## 4. Technical Architecture

### 4.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server/client component model, file-based routing |
| **Language** | TypeScript 5 | Type safety across full stack |
| **Styling** | Tailwind CSS 4 + Custom CSS | Utility-first with premium glassmorphism design |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL with built-in auth, RLS, and real-time |
| **Auth** | Supabase Auth (email/password) | Magic link optional; email/password for demo simplicity |
| **Real-time** | Supabase Realtime (WebSocket) | Live dashboard updates on payment status changes |
| **Charts** | Recharts 3 | Finance analytics visualization |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Testing** | Playwright | E2E tests with automatic video recording |
| **Deployment** | Vercel | Zero-config Next.js deployment |

### 4.2 Route Structure

```
/                     → Redirect to /login or /dashboard
/login                → Email/password authentication
/signup               → New account creation
/dashboard            → Main dashboard (protected, requires auth)
/request/[id]         → Request detail view (public read, auth for actions)
```

### 4.3 Component Architecture

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, metadata)
│   ├── page.tsx                      # Root redirect
│   ├── globals.css                   # Global styles + design tokens
│   ├── login/page.tsx                # Login page
│   ├── signup/page.tsx               # Signup page
│   ├── dashboard/page.tsx            # Main dashboard (client component)
│   └── request/[id]/page.tsx         # Request detail view (NEW)
├── components/
│   ├── RequestMoneyModal.tsx         # Create request form
│   ├── TransactionConfirmModal.tsx   # PIN confirmation for payments
│   ├── StatusBadge.tsx               # Status pill component
│   ├── Toast.tsx                     # Notification system
│   ├── WalletCard.tsx                # Balance display card
│   └── FinanceAnalytics.tsx          # Charts and stats
└── lib/
    ├── supabase.ts                   # Supabase client singleton
    ├── types.ts                      # TypeScript interfaces + helpers
    ├── validation.ts                 # Input validation schemas (NEW)
    └── mock-data.ts                  # Development seed data
```

### 4.4 State Management

- **Server State**: Supabase queries via `@supabase/supabase-js` client
- **Client State**: React `useState` / `useCallback` for UI interactions
- **Real-time**: Supabase channel subscriptions for live updates on `payment_requests` and `profiles` tables
- **Derived Calculations**: Balance computed client-side as `walletBalance + totalReceived - totalSent`

---

## 5. Edge Cases & Validation Rules

### 5.1 Amount Validation

| Rule | Client | Server (DB) |
|---|---|---|
| Amount > 0 | ✅ Form validation | ✅ `CHECK (amount > 0)` |
| Amount ≤ $10,000 | ✅ Form validation | ✅ `CHECK (amount <= 10000)` |
| Amount ≥ $0.01 | ✅ `min="0.01"` on input | ✅ `CHECK (amount > 0)` |
| Decimal precision | ✅ `step="0.01"` | ✅ `DECIMAL(10,2)` |

### 5.2 Contact Validation

| Format | Regex Pattern | Example |
|---|---|---|
| Email (RFC 5322 simplified) | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `user@example.com` |
| Phone (E.164) | `/^\+[1-9]\d{1,14}$/` | `+14155552671` |

### 5.3 Business Logic Guards

| Scenario | Guard | Error Message |
|---|---|---|
| Self-requesting | `recipient !== sender_email` | "You cannot request money from yourself" |
| Expired request action | `getEffectiveStatus() !== EXPIRED` | "This request expired on [date]" |
| Already-paid request | `status === PENDING` check before update | "This request has already been paid" |
| Insufficient balance | `amount <= derivedBalance` | "Insufficient balance — transaction amount exceeds your available funds" |
| Network failure | `try/catch` on all Supabase calls | "Payment failed. Please try again." |
| Invalid recipient format | Regex validation pre-submit | "Please enter a valid email address or phone number" |

### 5.4 Race Condition Handling

```
Scenario: Two users attempt to pay the same request simultaneously
Solution: Supabase RPC `process_payment` performs atomic status check + update
  1. SELECT status WHERE id = request_id FOR UPDATE
  2. IF status != 'PENDING' → return error "already handled"
  3. UPDATE status = 'PAID'
  4. UPDATE profiles.balance for both sender and recipient
  5. COMMIT
```

---

## 6. Input Validation (Detailed)

### 6.1 Client-Side Validation (RequestMoneyModal)

```typescript
// Email validation (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (E.164 international format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Amount validation
const isValidAmount = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0.01 && num <= 10000;
};

// Recipient validation (accepts email OR phone)
const isValidRecipient = (value: string): boolean => {
  return EMAIL_REGEX.test(value) || PHONE_REGEX.test(value);
};
```

### 6.2 Server-Side Validation (Database Constraints)

```sql
-- Amount bounds enforced at DB level
CHECK (amount > 0)
CHECK (amount <= 10000)

-- Self-request prevention via RLS INSERT policy
WITH CHECK (recipient_contact != (auth.jwt() ->> 'email'))

-- Status transition enforcement
-- Only PENDING requests can be updated to PAID/DECLINED/CANCELED
```

---

## 7. Error Handling & Toast Notifications

All user-facing errors MUST display as Toast notifications. The following exhaustive error catalog defines every possible failure state:

| Error Code | Toast Message | Trigger |
|---|---|---|
| `NETWORK_ERROR` | "Payment failed. Please try again." | Any Supabase call throws |
| `EXPIRED_REQUEST` | "This request expired on [formatted date]" | User tries to pay/decline an expired request |
| `SELF_REQUEST` | "You cannot request money from yourself" | Recipient email matches sender |
| `INVALID_AMOUNT` | "Amount must be between $0.01 and $10,000" | Amount validation fails |
| `INVALID_RECIPIENT` | "Please enter a valid email address or phone number" | Recipient format validation fails |
| `ALREADY_PAID` | "This request has already been paid" | Race condition: status changed before action |
| `ALREADY_DECLINED` | "This request has already been declined" | Race condition: status changed |
| `INSUFFICIENT_BALANCE` | "Insufficient balance — transaction exceeds available funds" | derivedBalance < amount |
| `WRONG_PIN` | "Incorrect code. Please try again." | PIN entry doesn't match `1234` |
| `REQUEST_NOT_FOUND` | "Request not found" | Invalid UUID in URL |
| `CANCEL_SUCCESS` | "Request canceled." | Sender cancels successfully |
| `DECLINE_SUCCESS` | "Request declined." | Recipient declines successfully |
| `PAY_SUCCESS` | "Payment successful! Funds have been transferred." | Payment completes |
| `CREATE_SUCCESS` | "Request for $[amount] sent to [email]" | Request created |
| `LINK_COPIED` | "Link copied to clipboard!" | Copy Link button clicked |

---

## 8. Security: Row Level Security (RLS)

### 8.1 Design Principle

Every database query is filtered at the PostgreSQL level. Even if client code is compromised, users CANNOT access rows they don't own.

### 8.2 RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- PAYMENT_REQUESTS: Users can view requests they sent or received
CREATE POLICY "Users can view their requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_contact = (auth.jwt() ->> 'email')
    OR recipient_email = (auth.jwt() ->> 'email')
  );

-- PAYMENT_REQUESTS: Users can create requests as sender (no self-requesting)
CREATE POLICY "Users can insert requests"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND amount > 0
    AND recipient_contact != (auth.jwt() ->> 'email')
  );

-- PAYMENT_REQUESTS: Involved users can update request status
CREATE POLICY "Users can update their requests"
  ON public.payment_requests FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_contact = (auth.jwt() ->> 'email')
    OR recipient_email = (auth.jwt() ->> 'email')
  );

-- PUBLIC READ for detail page (unauthenticated viewers)
CREATE POLICY "Anyone can view individual requests by ID"
  ON public.payment_requests FOR SELECT
  TO anon
  USING (true);  -- Read-only; actions require auth
```

### 8.3 Atomic Payment Processing (RPC)

```sql
CREATE OR REPLACE FUNCTION process_payment(request_id UUID)
RETURNS VOID AS $$
DECLARE
  req RECORD;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT * INTO req FROM payment_requests WHERE id = request_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF req.status != 'PENDING' THEN
    RAISE EXCEPTION 'Request is no longer pending (current status: %)', req.status;
  END IF;

  IF req.expires_at < NOW() THEN
    RAISE EXCEPTION 'Request has expired';
  END IF;

  -- Update request status
  UPDATE payment_requests SET status = 'PAID' WHERE id = request_id;

  -- Deduct from recipient (the person paying)
  UPDATE profiles SET balance = balance - req.amount
    WHERE id = auth.uid();

  -- Credit to sender (the person who requested)
  UPDATE profiles SET balance = balance + req.amount
    WHERE id = req.sender_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 9. UI/UX Design System

### 9.1 Visual Language

- **Theme**: Premium dark fintech aesthetic (glassmorphism, gold accents)
- **Background**: Deep navy (`#06080F`) with gradient mesh orbs
- **Primary Accent**: Gold (`#CA8A04` → `#EAB308` gradient)
- **Text Hierarchy**: `#F1F3F8` (primary), `#C8CDD8` (secondary), `#7A839A` (muted)
- **Cards**: `rgba(15, 20, 35, 0.5)` with `blur(20px)` backdrop
- **Borders**: `rgba(255, 255, 255, 0.06)` subtle separators
- **Success**: `#10B981` (emerald green)
- **Error**: `#EF4444` (red-400)
- **Warning**: `#F59E0B` (amber)

### 9.2 Animation System

- **Fade In Up**: Staggered entrance for lists (`60ms` delay per item)
- **Scale In**: Modal entrance animation
- **Count-Up**: Animated balance numbers (600ms exponential ease-out)
- **Spin**: Loading spinners for async operations
- **Shake**: Error feedback on PIN modal

### 9.3 Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 480px` | Single column, compact cards, hidden email in nav |
| `480px–768px` | Two-column stats grid, stacked wallet card |
| `768px+` | Three-column stats grid, full dashboard layout |

---

## 10. Testing Criteria (E2E with Playwright)

### 10.1 Test Configuration

```typescript
// playwright.config.ts
{
  use: {
    video: 'on',          // ALL tests produce .webm video recordings
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  }
}
```

### 10.2 Critical Path Test Scenarios

| Test | Description | Assertions |
|---|---|---|
| **Login Flow** | User logs in with mocked Supabase auth | Dashboard visible, email displayed |
| **Balance Display** | Initial balance renders correctly | `$50,000.00` text visible |
| **Request Creation** | Fill form, submit, verify toast | Success toast with amount and recipient |
| **Pay Incoming** | Click Pay on incoming request, enter PIN | Balance decreases, `PAID` status badge |
| **Request Money** | Create request, verify outgoing list | Request appears in Outgoing tab |
| **Instant Payment Simulation** | Mock recipient paying instantly | Balance increases, status shows `PAID` |
| **Combined Flow** | Pay incoming $100, then request $50 (instantly paid) | Balance: $50,000 → $49,900 → $49,950 |
| **Copy Link** | Click copy link button | Toast "Link copied to clipboard!" |
| **Expiration** | Request past `expires_at` | Actions hidden, `EXPIRED` badge shown |
| **Validation** | Submit with invalid email, self-email, $0 amount | Appropriate error messages |

### 10.3 Video Recording

All E2E tests automatically capture browser interaction videos:
- Output: `test-results/[test-name]/video.webm`
- Purpose: Submission artifact demonstrating automated test coverage
- Configuration: `use: { video: 'on' }` in Playwright config

---

## 11. Deployment & Live Demo

### 11.1 Deployment Target

- **Platform**: Vercel
- **URL**: Public, accessible without local setup
- **Environment Variables** (set in Vercel dashboard):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 11.2 Setup Instructions (Local)

```bash
# Clone and install
git clone <repo-url>
cd payflow-app
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Run E2E tests with video recording
npx playwright test

# View test results
npx playwright show-report
```

---

## 12. Assumptions & Design Decisions

| Decision | Rationale |
|---|---|
| Email/password auth (not magic link) | Simpler for demo; magic link requires email provider setup |
| Client-side expiration check | Avoids cron job complexity; `getEffectiveStatus()` computes on render |
| Simulated payment (not real processor) | Assignment scope; 2-3s delay simulates external processing |
| PIN `1234` for confirmation | Demo simplicity; production would use biometrics or real 2FA |
| $50,000 default balance | Provides a realistic demo starting point |
| 7-day expiration | Standard P2P request TTL (matches Venmo/Zelle norms) |
| Glassmorphism dark UI | Premium fintech aesthetics per Lovie's "vibe coding" evaluation criteria |

---

## Spec Completeness Checklist

### Requirement Completeness
- [x] All user stories have acceptance criteria
- [x] All acceptance criteria are testable and unambiguous
- [x] Success criteria are measurable (§1.2)
- [x] Edge cases documented (§5)
- [x] Error messages specified (§7)

### Technical Completeness
- [x] Data models defined with types and constraints (§3)
- [x] API/RPC contracts specified (§8.3)
- [x] Security policies defined (§8)
- [x] Validation rules documented client + server (§6)
- [x] State management approach documented (§4.4)

### Process Completeness
- [x] E2E test scenarios defined (§10)
- [x] Video recording configured (§10.3)
- [x] Deployment instructions documented (§11)
- [x] Assumptions explicitly stated (§12)
