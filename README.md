# PayFlow - Lovie Fintech Assessment

PayFlow is a Senior-Level P2P payment request application built as part of the Lovie.co engineering interview process. It demonstrates a rigorous Spec-Driven Development workflow, premium UI/UX design (glassmorphism), robust validation, and strict database security using Supabase Row Level Security (RLS).

## 🚀 Live Demo
**URL**: [Add your Vercel URL here]

## 🛠 Tech Stack & AI Tools
- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (Custom glassmorphism aesthetic)
- **Database & Auth**: Supabase (PostgreSQL, Realtime Subscriptions, RLS)
- **Testing**: Playwright (E2E with automated video recording)
- **Workflow**: GitHub Spec-Kit
- **AI Tools Used**: Google DeepMind Agent (Antigravity), Cursor/Claude for vibe-coding and workflow automation.

## 📋 Project Overview
- **Spec-Kit Workflow**: The entire project was generated based on the comprehensive `.spec/spec.md`.
- **Payment Lifecycle**: Users can request money, approve requests (via mocked atomic `process_payment` RPC simulation), decline, or cancel requests. Requests automatically expire after 7 days.
- **Robust Security**: Enforced boundary checks (amounts max $10k), Postgres `SECURITY DEFINER` constraints to prevent race conditions during concurrent "Pay" clicks.
- **UI/UX**: Features debounced real-time search, status tabs, dynamic balance animations, and graceful toast error handling for all potential failure states.

## 💻 Local Development Setup

1. **Clone the repository**
   ```bash
   git clone [your-repo-link]
   cd payflow-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Database**
   Execute the contents of `Supabase.sql` inside your Supabase project's SQL Editor to create the necessary tables, RLS policies, and RPC functions.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 E2E Testing (Playwright)

The project includes an automated "Grand Finale" multi-step flow test simulating a user paying a $100 incoming request and receiving a $50 outgoing request while asserting absolute UI balance changes.

1. **Run Tests (Headless)**
   ```bash
   npx playwright test
   ```

2. **Run Tests with UI mode**
   ```bash
   npx playwright test --ui
   ```

3. **View the Automated Video Recording**
   After running the tests, Playwright automatically generates a `.webm` screen recording of the flow. You can find this in the `playwright-report` or `test-results` directory.
