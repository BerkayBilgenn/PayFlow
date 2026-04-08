# PayFlow: Peer-to-Peer Fintech Payment Application Prospectus

## 1. Project Prospectus and Overview
PayFlow is a secure, fast, and highly reliable consumer fintech application designed explicitly for peer-to-peer (P2P) money requests and transfers. It functions similarly to widely known tools like Venmo or Cash App but is specialized for a streamlined "Request First" logic. 

This document serves as the comprehensive prospectus and manual, detailing exactly what the software does, under what circumstances it should be utilized, and step-by-step instructions on how to navigate its interface. It fulfills the requirements of the Lovie First Interview Assignment, acting as a testament to strict spec-driven design.

## 2. When to Use This Application (Core Use Cases)
PayFlow is designed for situations where financial interactions between individuals need structure, tracking, and instant synchronization. You should use PayFlow in scenarios such as:

- Shared Expenses: Splitting a dinner bill with friends where one person pays the restaurant and needs to reliably collect immediate reimbursements from the others.
- Freelance or Micro-Payments: Requesting structured payments for small services without relying on heavy invoicing tools. The 7-day expiration ensures prompt settlements.
- Roommate Utilities: Consolidating household bills into clear, formal requests so that every member can track what they owe and what has already been settled.

## 3. How to Use the Application: Step-by-Step User Guide
The interface is designed to be frictionless. Even users with minimal technical background must follow these steps to securely transact.

### A. Registering and Accessing the Dashboard
1. Open the application URL in a web browser (desktop or mobile).
2. You will be greeted by the Login portal. If you do not have an account, click the "Create one" link to navigate to the Registration screen.
3. Enter a valid email address and a strong password. Click the "Sign Up" button. You will be instantly authenticated and redirected to your Dashboard.

### B. Creating a Money Request
1. On your Dashboard, locate the brightly colored "Request Money" button in the upper right section. Click it.
2. A secure modal window will appear. 
3. In the "Recipient Email" field, accurately type the email address of the person from whom you are requesting money.
4. In the "Amount" field, input the exact numeric value (e.g., 50.00). It must be greater than zero.
5. In the "Note" field, provide a clear reason for the request (e.g., "Dinner at Italian Restaurant").
6. Click "Send Request". The system will instantly validate your inputs. If your wallet balance and inputs are valid, the request is generated and stored securely. 

### C. Paying an Incoming Request
1. As the recipient of a request, check your Dashboard under the "Incoming" tab.
2. You will see a list of records showing who requested the money, the amount, the note, and the expiration time.
3. To fulfill the request, review the details. If you agree, click the "Pay" button next to the relevant request.
4. An encrypted payment transition will simulate processing. Once finalized, the system deducts the amount from your total balance and routes it to the sender's balance. 
5. The request status updates automatically to "Paid", and the notification is pushed to all devices without needing to refresh the page.

### D. Declining or Canceling a Request
- If you receive an unjustified request: Click the "Decline" button. The status immediately updates to "Declined", protecting your wallet balance.
- If you made a mistake sending a request: Navigate to your "Outgoing" tab. As long as the request is still marked as "Pending", you will have a "Cancel" option. Clicking it invalidates the request for the recipient.

## 4. Functional Mechanics and System Rules
- Real-Time Updates: The entire dashboard is connected via WebSockets. If your debtor pays your request while you are staring at the screen, your total wallet balance flashes and updates instantaneously.
- Zero-Trust Security: Under the hood, Row Level Security ensures that you can strictly only view your own incoming requests and your own outgoing requests. A completely different user can never peek into your transactional history.
- Expiration Logic: The system guarantees that pending requests do not linger indefinitely. A 7-day countdown operates on every request. If an action (Pay or Decline) is not taken before time runs out, the request is strictly locked and marked as "Expired".

## 5. Live Demo and Actionable Assets
- Public Live Application URL: [Insert Vercel URL Here]
- Development Demonstration Video: [Insert Video Link Here showing your prompts and build process]
- E2E Playwright Automation Video: [Insert Playwright Automation Video URL]

## 6. Technical Architecture and AI Tools Used
- Frontend Infrastructure: Next.js (App Router), React Server Components.
- User Interface: Custom styling implementing Glassmorphism for a premium aesthetic touch.
- Data and Authentication Layer: Supabase (PostgreSQL with strict Row Level Security rules). Payments are handled via atomic Remote Procedure Calls (RPC) to prevent race conditions.
- Automated Testing: Playwright for comprehensive cross-browser test simulations.
- AI Vibe Coding: Constructed using Google Gemini via the Antigravity Agentic workflow for strict rapid prototyping, exact UI positioning, and complex relational security policies.

## 7. Setup Instructions for Local Development
1. Verify Node.js (v18+) and Git are installed.
2. Clone the repository running: git clone https://github.com/BerkayBilgenn/PayFlow.git
3. Navigate into the directory: cd PayFlow
4. Install all node modules securely: npm install
5. Create a file named .env.local in your directory and add:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
6. Execute the contents of Supabase.sql inside your Supabase project's SQL editor to structure the database and establish the safety policies.
7. Launch the local development server: npm run dev
8. Open your local browser to http://localhost:3000.

## 8. How to Execute E2E Tests
1. From the project root, download the required test browser binaries: npx playwright install
2. Execute the entire test suite via: npx playwright test
3. The testing engine will perform clicks and inputs just like a human user would, validating that requests drop into the correct queues and that balances update correctly.
4. To view the final results and the automated screen recordings, run: npx playwright show-report

## 9. Workflow and Spec-Kit Details
The development of this software was built upon a rigorous Spec-Kit workflow. Detailed instructional directives defined edge cases beforehand (e.g., insufficient funds mitigation, zero dollar boundaries, secure token referencing). These specifications were fed sequentially to the AI coding agent. The testing and deployment mechanisms were automated continuously, ensuring that architecture and implementation progressed in complete lockstep.
