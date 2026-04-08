# 💸 PayFlow — P2P Payment Request Platform

PayFlow is a **peer-to-peer (P2P) payment request application** — similar to Venmo's "Request Money" or Cash App's payment requests. Users can send payment requests to friends, approve incoming requests, decline them, or let them expire automatically after 7 days.

This project was built as part of the **Lovie.co Senior Frontend Engineering** assessment, following a strict **Spec-Driven, AI-Native Development Workflow** using GitHub Spec-Kit.

---

## 🌐 Live Demo

> **Live URL**: https://pay-flow-lgbx.vercel.app

You can visit the live demo and test the full application without any local setup. Just create an account and start sending/receiving payment requests!

---

## 📸 What Does The App Look Like?

### Login Page
A clean, glassmorphism-styled login page with email/password authentication.

### Dashboard
The main dashboard features:
- A **digital wallet card** showing your real-time balance with animated transitions
- **Stats cards** for Total Received, Total Sent, and Pending request count
- **Interactive charts** (bar, line, and pie) powered by Recharts
- **Incoming/Outgoing tabs** with status sub-filters and a search bar
- **Request cards** showing sender/recipient, amount, status badge, and action buttons

### Request Detail Page
Each payment request has its own shareable URL (`/request/[id]`) showing:
- Amount, sender, recipient, and note
- Dynamic expiration countdown
- Pay/Decline/Cancel buttons based on your role

---

## ✨ Features

### Core Functionality
| Feature | Description |
|---|---|
| **Request Money** | Enter a recipient's email, an amount, and an optional note to create a payment request |
| **Pay Requests** | Click "Pay" on an incoming request → enter your 4-digit PIN (`1234`) → funds transfer instantly |
| **Decline Requests** | Reject incoming requests you don't want to pay |
| **Cancel Requests** | Cancel your own outgoing requests that haven't been paid yet |
| **Auto-Expiry** | Requests expire automatically after 7 days if not acted upon |
| **Shareable Links** | Every request has a unique URL you can copy and share with anyone |
| **Real-time Updates** | Dashboard updates instantly via Supabase Realtime subscriptions |

### Dashboard Filters
| Filter | How It Works |
|---|---|
| **Incoming / Outgoing Tabs** | Switch between requests sent TO you vs requests sent BY you |
| **Status Sub-Tabs** | Filter by: All, Pending, Paid, Declined, or Expired |
| **Search Bar** | Type to search by email or note (300ms debounced for performance) |
| **Count Badges** | Each status tab shows how many requests match that filter |

### Security & Validation
| Feature | Details |
|---|---|
| **Email Validation** | RFC 5322 compliant regex — rejects invalid formats like `user@` or `@domain` |
| **Phone Validation** | E.164 international format (e.g. `+905551234567`) |
| **Amount Bounds** | Minimum: $0.01 — Maximum amount is bounded by the requester's available balance |
| **Self-Request Block** | You cannot send a payment request to your own email |
| **Row Level Security** | Database-level policies prevent unauthorized data access |
| **Atomic Payments** | The `process_payment` RPC uses PostgreSQL row locks to prevent race conditions |

---

## 🏗 Tech Stack

| Layer | Technology | Why? |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side rendering, file-based routing, React Server Components |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS 4 + Custom CSS | Glassmorphism dark theme with premium animations |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with built-in Auth, Realtime, and Row Level Security |
| **Auth** | Supabase Auth | Email/password authentication with JWT tokens |
| **Charts** | Recharts | Interactive financial analytics (bar, line, pie charts) |
| **Icons** | Lucide React | Consistent, lightweight icon library |
| **Testing** | Playwright | End-to-end browser testing with automatic video recording |
| **Deployment** | Vercel | Zero-config Next.js deployment with automatic previews |
| **AI Tools** | Google DeepMind Agent (Antigravity) | Spec-Kit workflow, code generation, and automated testing |

---

## 📂 Project Structure

```
payflow-app/
├── .spec/                          # Spec-Kit generated documentation
│   ├── spec.md                     # Full feature specification (12 sections)
│   ├── plan.md                     # Implementation plan (6 phases)
│   └── tasks.md                    # Task checklist with progress tracking
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Inter font, meta tags)
│   │   ├── page.tsx                # Landing page (redirects to /login)
│   │   ├── globals.css             # Global styles + glassmorphism design system
│   │   ├── login/page.tsx          # Login page with email/password form
│   │   ├── signup/page.tsx         # Signup page for new users
│   │   ├── dashboard/page.tsx      # Main dashboard (wallet, charts, requests)
│   │   └── request/[id]/page.tsx   # Shareable request detail page
│   │
│   ├── components/
│   │   ├── WalletCard.tsx          # Animated digital wallet card
│   │   ├── FinanceAnalytics.tsx    # Interactive charts (Recharts)
│   │   ├── RequestMoneyModal.tsx   # Modal form to create new requests
│   │   ├── TransactionConfirmModal.tsx  # PIN confirmation modal
│   │   ├── StatusBadge.tsx         # Color-coded status labels
│   │   └── Toast.tsx               # Toast notification component
│   │
│   └── lib/
│       ├── supabase.ts             # Supabase client initialization
│       ├── types.ts                # TypeScript interfaces + helper functions
│       └── validation.ts           # Email/phone/amount validation rules
│
├── tests/
│   └── payment-flow.spec.ts        # Playwright E2E test suite
│
├── test-results/                   # Auto-generated test videos (.webm)
├── playwright-report/              # HTML test report with embedded video
├── Supabase.sql                    # Database schema + RLS policies + RPC
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

---

## 🚀 Getting Started (Local Development)

Follow these steps to run PayFlow on your own machine.

### Prerequisites

Make sure you have these installed:
- **Node.js** (version 18 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download here](https://git-scm.com/)
- A **Supabase account** (free) — [Sign up here](https://supabase.com/)

### Step 1: Clone the Repository

Open your terminal (Command Prompt, PowerShell, or Terminal on Mac) and run:

```bash
git clone https://github.com/BerkayBilgenn/PayFlow.git
cd PayFlow
```

### Step 2: Install Dependencies

```bash
npm install
```

This will download all required packages (~238 MB). Wait for it to complete.

### Step 3: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a **new project**
2. Once your project is created, go to **Settings → API** in the Supabase dashboard
3. You'll need two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### Step 4: Create Environment File

Create a file named `.env.local` in the project root directory:

```bash
# On Windows (PowerShell):
New-Item -Path .env.local -ItemType File

# On Mac/Linux:
touch .env.local
```

Open `.env.local` in any text editor and paste these two lines (replace with YOUR values from Step 3):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **Important**: Never share your `.env.local` file or commit it to GitHub. It's already in `.gitignore`.

### Step 5: Initialize the Database

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the `Supabase.sql` file from this project, copy **all** its contents
4. Paste it into the SQL Editor and click **"Run"**

This creates:
- `profiles` table (user balances)
- `payment_requests` table (all payment requests)
- Row Level Security (RLS) policies
- `process_payment` atomic RPC function

### Step 6: Enable Authentication

1. In Supabase dashboard, go to **Authentication → Providers**
2. Make sure **Email** provider is enabled (it should be by default)
3. For testing, you may want to disable **"Confirm email"** under Authentication → Settings so you don't need to verify email addresses

### Step 7: Run the Development Server

```bash
npm run dev
```

You'll see output like:
```
▲ Next.js 16.2.2
- Local:   http://localhost:3000
```

Open **http://localhost:3000** in your browser. You're ready to go! 🎉

---

## 📖 How to Use The Application

### 1. Create an Account

1. Open the app in your browser
2. Click **"Sign Up"** on the login page
3. Enter your email address and a password (minimum 6 characters)
4. Click **"Sign Up"** button
5. You'll be redirected to the dashboard

### 2. Understanding the Dashboard

When you first log in, you'll see:

- **Top Bar**: Your email and a logout button
- **Wallet Card**: Shows your current balance (starts at **$50,000.00**)
- **Stats Grid**: Three cards showing Total Received, Total Sent, and Pending count
- **Charts**: Financial analytics visualizing your transaction history
- **Filter Section**: Tabs for Incoming/Outgoing, status sub-tabs, and a search bar
- **Request List**: All your payment requests with action buttons

### 3. Request Money from Someone

1. Click the **"Request Money"** button (gold button, top right of dashboard)
2. A modal will open with a form:
   - **Recipient Email**: Enter the email of the person you're requesting money from
   - **Amount**: Enter an amount (up to your available balance)
   - **Note** (optional): Add a description like "Dinner split" or "Rent"
3. Click **"Send Request"**
4. You'll see a success toast: *"Request for $XX.XX sent to email@example.com"*
5. The request appears in your **Outgoing** tab with **Pending** status

### 4. Pay an Incoming Request

When someone requests money from you:

1. Find the request in your **Incoming** tab
2. Click the **"Pay"** button (gold button)
3. A PIN confirmation modal will appear
4. Enter the PIN: **1 2 3 4** (one digit per box)
5. Click **"Confirm Payment"**
6. Wait 2-3 seconds for processing animation
7. You'll see a success toast: *"Payment successful! Funds have been transferred."*
8. Your wallet balance decreases by the payment amount
9. The request status changes to **Paid** ✅

### 5. Decline an Incoming Request

1. Find the request in your **Incoming** tab
2. Click the **"Decline"** button (subtle button next to Pay)
3. The request status changes to **Declined** ❌

### 6. Cancel Your Own Request

1. Go to the **Outgoing** tab
2. Find your pending request
3. Click the **"Cancel"** button
4. The request status changes to **Canceled** 🚫

### 7. Share a Request Link

1. On any request card, click the **🔗 link icon** (top right of the card)
2. You'll see a toast: *"Link copied to clipboard!"*
3. Paste the link anywhere — anyone can view the request details
4. If the viewer is not logged in, they'll see a **"Login to Pay"** button

### 8. View Request Details

1. Click the link icon on any request to copy its URL
2. Open the URL (e.g., `https://yourapp.com/request/abc-123-def`)
3. You'll see a detailed view with:
   - Amount and sender/recipient info
   - Note (if provided)
   - Creation date
   - Expiration countdown (turns red when < 24 hours remain)
   - Action buttons based on your role

### 9. Filter and Search Requests

- **Incoming/Outgoing tabs**: Click to switch between requests sent to you vs. by you
- **Status sub-tabs**: Click All, Pending, Paid, Declined, or Expired to filter
- **Search bar**: Type an email or note to find specific requests instantly
- **Clear search**: Click the ✕ button in the search bar to reset

### 10. Request Expiration

- Every request has a **7-day expiration timer**
- You can see the countdown on the request detail page
- When a request expires, it changes to **Expired** status and can no longer be paid
- The countdown turns **red** when less than 24 hours remain

---

## 🧪 Running E2E Tests

PayFlow includes a complete automated test suite that simulates a full user flow and records a video.

### What the test does (step by step):
1. Logs in with a test account
2. Verifies the dashboard loads with $50,000.00 balance
3. Finds an incoming $100 request and clicks "Pay"
4. Enters PIN 1-2-3-4 and confirms payment
5. Verifies balance drops to $49,900.00
6. Opens the "Request Money" modal and sends a $50 request
7. Simulates the recipient paying instantly
8. Verifies balance rises to $49,950.00
9. Scrolls down to verify both transactions show "PAID" status
10. Records the entire flow as a `.webm` video

### Run all tests:

```bash
npx playwright test
```

Expected output:
```
Running 1 test using 1 worker

✅ Initial balance captured: $50,000.00
✅ Balance successfully dropped to $49,900.00 after paying
✅ Balance successfully increased to $49,950.00 after receiving
✅ Both transactions displayed correctly with PAID status

  1 passed (16.3s)
```

### View the test video:

After running tests, the automatically recorded video is saved at:
```
test-results/payment-flow-Payment-Flow--e9902--and-create-a-money-request-chromium/video.webm
```

Open this `.webm` file in any modern browser (Chrome, Edge, Firefox) to watch the full automated flow.

### View the HTML test report:

```bash
npx playwright show-report
```

This opens an interactive HTML report in your browser with the test video embedded.

---

## 📜 Spec-Kit Documentation

This project follows the **GitHub Spec-Kit** workflow. All specification documents are in the `.spec/` directory:

| File | Purpose | Sections |
|---|---|---|
| **spec.md** | Complete feature specification | 12 sections: Overview, User Stories, Data Models, Architecture, Edge Cases, Validation, Error Handling, RLS Security, UI/UX Design, Testing, Deployment, Assumptions |
| **plan.md** | Implementation plan | 6 phases with pre-implementation gates (Simplicity, Anti-Abstraction, Integration-First) |
| **tasks.md** | Executable task checklist | All 6 phases tracked with `[x]` completion markers |

---

## 🔐 Security Architecture

### Row Level Security (RLS)
- **Anonymous users** can view individual request details (for shareable links)
- **Authenticated users** can only read/write their own requests
- **Insert policy** enforces: sender must be the authenticated user, amount must be > 0
- **Update policy** ensures only sender or recipient can modify request status

### Atomic Payment Processing
The `process_payment` PostgreSQL function uses:
- `SELECT ... FOR UPDATE` to lock the request row (prevents two people paying simultaneously)
- Balance checks before deduction (prevents negative balances)
- All operations in a single transaction (if any step fails, everything rolls back)

---

## 🎨 Design System

PayFlow uses a **premium dark glassmorphism** design language:

| Token | Value | Usage |
|---|---|---|
| Background | `#06080F` | Main app background |
| Card | `rgba(15,20,35,0.6)` | Glassmorphism card surfaces |
| Gold Accent | `#CA8A04` | Primary brand color, CTAs |
| Gold Light | `#FDE68A` | Active tab text, highlights |
| Success | `#6EE7B7` | Paid status, positive values |
| Error | `#EF4444` | Declined status, error toasts |
| Warning | `#FCD34D` | Pending status, countdown alerts |
| Text Primary | `#F1F3F8` | Main text color |
| Text Secondary | `#7A839A` | Subtitles, timestamps |
| Font | Inter | All text (Google Fonts) |

---

## 📝 Evaluation Criteria Mapping

| Criteria (Weight) | How PayFlow Addresses It |
|---|---|
| **Language Mastery (30%)** | 380+ line spec with 7 user stories, 16 error codes, regex validation rules, and testable acceptance criteria |
| **Technical Depth (25%)** | Decimal precision (`DECIMAL(10,2)`), atomic RPC with row locks, RLS policies, RFC 5322 email validation |
| **Execution Speed (20%)** | Full working prototype with 6 components, real-time subscriptions, charts, and premium UI |
| **Process Discipline (25%)** | Spec-Kit workflow (spec → plan → tasks → implement → test), Playwright E2E with video recording |

---

## 🤝 Author

**Berkay Bilgen**

Built with ❤️ for the Lovie.co engineering team.
