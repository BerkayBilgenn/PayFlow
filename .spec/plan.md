# Implementation Plan: P2P Payment Request System

> **Feature**: 001-p2p-payment-request
> **Spec**: `.spec/spec.md`
> **Created**: 2026-04-08

---

## Phase -1: Pre-Implementation Gates

### Simplicity Gate
- [x] Using ≤ 3 projects? → **1 project** (Next.js monolith)
- [x] No future-proofing? → Only building what's specified
- [x] No speculative features? → Every feature traces to a user story

### Anti-Abstraction Gate
- [x] Using framework directly? → Next.js App Router, no wrappers
- [x] Single model representation? → TypeScript interfaces match DB schema 1:1

### Integration-First Gate
- [x] Contracts defined? → RLS policies + RPC function specified
- [x] E2E tests planned before implementation? → Playwright test scenarios defined

---

## Phase 0: Foundation (COMPLETE)

**Status**: ✅ Implemented

### 0.1 Database Schema
- Supabase project provisioned
- `profiles` table with balance tracking
- `payment_requests` table with UUID, status enum, expiration
- RLS policies for SELECT/INSERT/UPDATE
- `process_payment` RPC for atomic payment processing

### 0.2 Authentication
- Email/password auth via Supabase Auth
- Login page (`/login`) with form validation
- Signup page (`/signup`) with account creation
- Auth guard: dashboard redirects to login if unauthenticated

### 0.3 Core Dashboard
- Wallet balance card with animated count-up
- Incoming/Outgoing tab toggle
- Request cards with status badges
- Request Money modal (create new requests)
- Transaction Confirm modal (PIN `1234` for payments)
- Finance Analytics charts (Recharts)
- Toast notification system
- Real-time Supabase channel subscriptions

---

## Phase 1: Shareable Links & Request Detail View

**Priority**: High — Core requirement from assignment spec

### 1.1 Create `/request/[id]` Route
**File**: `src/app/request/[id]/page.tsx` [NEW]

**Implementation Details**:
1. Fetch `payment_request` by UUID from Supabase
2. If not found → render styled 404 ("Request not found")
3. If found → render detail card:
   - Amount (formatted as `$X,XXX.XX`)
   - Note (or "No note provided")
   - Sender email + Recipient email
   - Created timestamp (formatted)
   - Expiration countdown (dynamic: "Expires in X days Y hours")
   - If < 24h remaining: countdown text turns red
4. Auth-dependent actions:
   - Check `supabase.auth.getUser()`
   - If **recipient + PENDING**: show Pay / Decline buttons
   - If **sender + PENDING**: show Cancel button
   - If **unauthenticated**: show "Login to Pay" CTA → redirect to `/login`
   - If **non-PENDING**: show read-only status badge

### 1.2 "Copy Link" Button on Dashboard Cards
**File**: `src/app/dashboard/page.tsx` [MODIFY]

**Implementation Details**:
1. Add a link/share icon button to each request card
2. `onClick`: `navigator.clipboard.writeText(\`\${window.location.origin}/request/\${req.id}\`)`
3. Show success toast: "Link copied to clipboard!"
4. Fallback for insecure contexts: textarea + `document.execCommand('copy')`

---

## Phase 2: Advanced Dashboard Filters

**Priority**: High — Directly evaluated in "Technical Depth" criteria

### 2.1 Status Sub-Tabs
**File**: `src/app/dashboard/page.tsx` [MODIFY]

**Implementation Details**:
1. Add `statusFilter` state: `'ALL' | 'PENDING' | 'PAID' | 'DECLINED' | 'EXPIRED'`
2. Render horizontal pill tabs below the Incoming/Outgoing toggle
3. Filter `currentList` by status (using `getEffectiveStatus()`)
4. "All" shows everything; others filter by exact match
5. Show count badge on each tab

### 2.2 Search Bar (Debounced)
**File**: `src/app/dashboard/page.tsx` [MODIFY]

**Implementation Details**:
1. Add `searchQuery` state + search input with magnifying glass icon
2. Implement 300ms debounce via `useEffect` + `setTimeout`
3. Filter by: `sender_email.includes(query) || recipient_email.includes(query)`
4. Case-insensitive matching
5. Clear button (X) to reset search

### 2.3 Empty States
**File**: `src/app/dashboard/page.tsx` [MODIFY]

**Implementation Details**:
1. When filtered list is empty, show contextual empty state:
   - Pending tab: "No pending requests — you're all caught up!"
   - Paid tab: "No paid requests yet"
   - Search with no results: "No requests matching '[query]'"
2. Each empty state includes an icon illustration

---

## Phase 3: Input Validation Hardening

**Priority**: High — "Fintech Understanding" evaluation criteria

### 3.1 Validation Library
**File**: `src/lib/validation.ts` [NEW]

```typescript
// Email: RFC 5322 simplified
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone: E.164 international format
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Amount bounds
export const MIN_AMOUNT = 0.01;
export const MAX_AMOUNT = 10000;

export function validateRecipient(value: string): string | null { ... }
export function validateAmount(value: string): string | null { ... }
```

### 3.2 Apply to RequestMoneyModal
**File**: `src/components/RequestMoneyModal.tsx` [MODIFY]

1. Import validators from `validation.ts`
2. Replace inline `includes("@")` check with `validateRecipient()`
3. Replace inline amount check with `validateAmount()`
4. Show specific error messages per validation rule

---

## Phase 4: Error Handling Enhancement

**Priority**: Medium — Covers "Edge Case Coverage" evaluation

### 4.1 Granular Error Toasts
**File**: `src/app/dashboard/page.tsx` [MODIFY]

Map every failure case to its specified toast message (see spec §7):
1. Wrap all `supabase` calls in `try/catch`
2. Detect specific error types and show matching messages
3. Catch network errors with generic fallback message

---

## Phase 5: Security Hardening (RLS Audit)

**Priority**: High — Required deliverable

### 5.1 Update SQL Definitions
**File**: `Supabase.sql` [MODIFY]

1. Ensure all existing policies match spec §8.2 exactly
2. Add `anon` read policy for `/request/[id]` public view
3. Add CHECK constraint for `amount <= 10000`
4. Verify `process_payment` RPC uses `SECURITY DEFINER`

---

## Phase 6: E2E Test Updates

**Priority**: High — "E2E Testing" is 25% of evaluation

### 6.1 Update Test Suite
**File**: `tests/payment-flow.spec.ts` [MODIFY]

Ensure the combined flow test still passes after dashboard UI changes (new tabs, search bar, etc.).

---

## Verification Plan

### Automated Tests
```bash
# Run full E2E suite with video recording
npx playwright test

# Videos output to: test-results/*/video.webm
```

### Manual Verification
1. Visit `/request/[valid-uuid]` — sees detail page with countdown
2. Visit `/request/invalid-id` — sees styled 404
3. Click "Copy Link" on dashboard — clipboard contains valid URL
4. Search by email — results filter in real-time
5. Status tabs filter correctly
6. Invalid email in modal → specific error toast
7. Self-request blocked → "You cannot request money from yourself"
