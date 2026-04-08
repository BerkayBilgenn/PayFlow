# Tasks: P2P Payment Request System

> **Feature**: 001-p2p-payment-request
> **Plan**: `.spec/plan.md`
> **Generated**: 08.04.2026

---

## Phase 0: Foundation 
- [x] Supabase schema: `profiles`, `payment_requests`, RLS, `process_payment` RPC
- [x] Auth: login + signup pages with Supabase email/password
- [x] Dashboard: wallet card, incoming/outgoing tabs, request cards
- [x] Request Money modal with form + submission
- [x] Transaction Confirm modal with PIN entry
- [x] Finance Analytics charts (Recharts)
- [x] Toast notification system
- [x] Real-time subscriptions (Supabase channels)
- [x] StatusBadge component
- [x] Responsive CSS + glassmorphism design system
- [x] Playwright E2E test: combined pay + request flow with video

---

## Phase 1: Shareable Links & Request Detail View
- [x] Create `src/app/request/[id]/page.tsx` — detail page
  - [x] Fetch request by UUID from Supabase
  - [x] 404 handling for invalid/missing IDs
  - [x] Display amount, note, sender, recipient, created_at
  - [x] Dynamic expiration countdown (red if < 24h)
  - [x] Auth check: show Pay/Decline for recipient, Cancel for sender
  - [x] Unauthenticated: show "Login to Pay" CTA
  - [x] Non-PENDING: read-only status badge
- [x] Add "Copy Link" button to dashboard request cards [P]
  - [x] `navigator.clipboard.writeText()` implementation
  - [x] Success toast: "Link copied to clipboard!"

---

## Phase 2: Advanced Dashboard Filters
- [x] Add status sub-tabs: All | Pending | Paid | Declined | Expired
  - [x] `statusFilter` state management
  - [x] Filter logic using `getEffectiveStatus()`
  - [x] Count badges on each tab
- [x] Add search bar with 300ms debounce [P]
  - [x] `searchQuery` state + `useEffect` debounce
  - [x] Case-insensitive email matching
  - [x] Clear button (X icon)
- [x] Contextual empty states per tab/search

---

## Phase 3: Input Validation Hardening
- [x] Create `src/lib/validation.ts` [P]
  - [x] `EMAIL_REGEX` (RFC 5322 simplified)
  - [x] `PHONE_REGEX` (E.164 format)
  - [x] `validateRecipient()` function
  - [x] `validateAmount()` function (min $0.01, max $10,000)
- [x] Update `RequestMoneyModal.tsx` to use validators
  - [x] Replace inline `includes("@")` with `validateRecipient()`
  - [x] Add max amount check ($10,000)
  - [x] Specific error messages per validation rule

---

## Phase 4: Error Handling Enhancement
- [x] Audit all `supabase` calls in `dashboard/page.tsx`
  - [x] Wrap in `try/catch` blocks
  - [x] Map errors to spec §7 toast messages
  - [x] Network error fallback: "Payment failed. Please try again."
- [x] Add race condition toast for already-handled requests
- [x] Add expired action toast with formatted date

---

## Phase 5: Security Hardening
- [x] Update `Supabase.sql` with hardened RLS policies
  - [x] `anon` read policy for public request detail view
  - [x] `CHECK (amount <= 10000)` constraint
  - [x] Verify `process_payment` uses `SECURITY DEFINER`
- [x] Document SQL execution steps for Supabase dashboard

---

## Phase 6: E2E Test Updates
- [x] Verify existing combined flow test passes after UI changes
- [x] Add assertions for new UI elements (status tabs, search bar) if needed
- [x] Confirm video recording captures all new features

---

## Legend
- `[x]` = Completed
- `[/]` = In Progress
- `[ ]` = Todo
- `[P]` = Parallelizable (can run independently)
