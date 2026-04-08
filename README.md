# PayFlow: Peer-to-Peer Fintech Payment Application

## Project Overview
This project is a functional prototype of a consumer fintech application, specifically designed to allow users to securely request money from their peers. It was developed to fulfill the requirements of the First Interview Assignment. The application mimics core mechanics seen in services like Venmo or Cash App, providing a seamless payment request flow. Users can create, view, manage, and fulfill money requests through an interactive, responsive dashboard.

The overarching design prioritizes reliability, real-time data synchronization, and a premium user experience.

## Live Demo and Assets
- Live Application URL: [Insert Vercel URL Here]
- Demonstration Video: [Insert Video Link Here showing your prompts and build process]
- E2E Test Recording: [Insert Playwright Automation Video URL]

Please note that the live application requires no local setup to test. You can visit the URL, register an account with any email, and begin exchanging payment requests immediately.

## Tech Stack and AI Tools Used
This application relies on a modern, robust technology stack tailored for speed and reliability:
- Frontend Framework: Next.js (App Router)
- UI Library: React Server Components and Hooks
- Styling: Custom CSS with Premium UI Design Patterns
- Database and Authentication: Supabase (PostgreSQL with Row Level Security and Realtime WebSockets)
- End-to-End Testing: Playwright
- AI Coding Assistant: Google Gemini via Antigravity Agentic Workflow. The AI was utilized for strictly specifying the architecture, generating UI layouts in a single pass, configuring Postgres Row Level Security, and debugging complex strict-mode React lifecycles.

## Core Features Breakdown
1. Request Creation Flow
Users can initiate a request by entering a target email address, a specific amount greater than zero, and an optional explanatory note. The system enforces validation on the amount and email format before submission.

2. Comprehensive Dashboard
Both incoming (received) and outgoing (sent) requests are aggregated in a unified dashboard interface. 
- Incoming requests provide actionable buttons to Pay or Decline.
- Outgoing requests display their current status (Pending, Paid, Declined, Expired, Canceled) with the option to Cancel if the request has not yet been processed.

3. Complete Fulfullment Simulation
When a user clicks Pay on an incoming request, the application triggers a specialized Supabase Remote Procedure Call (RPC). This securely updates balances using atomic operations and modifies the request status. The user interface updates instantaneously across all active devices via Supabase Realtime subscriptions without requiring a manual page refresh.

4. Expiration Logic
Every created request automatically includes a 7-day expiration timestamp. If the request is not fulfilled or declined within this period, the system will flag the request as Expired.

## Setup Instructions for Local Development
Follow these detailed steps to run the application on your own computer.

Step 1: Install Prerequisites
Ensure you have Node.js (version 18 or higher) and Git installed on your computer.

Step 2: Clone the Repository
Open your terminal or command prompt and run the following command to download the code to your local machine:
git clone https://github.com/BerkayBilgenn/PayFlow.git

Step 3: Navigate to the Directory
Move into the project folder using:
cd PayFlow

Step 4: Install Dependencies
Download and install all the necessary libraries by running:
npm install

Step 5: Configure Environment Variables
You must connect the application to a Supabase database.
1. Create a file named .env.local in the root directory of the project.
2. Open .env.local and add your Supabase credentials exactly in this format:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Step 6: Set Up the Database
In your Supabase project dashboard, navigate to the SQL Editor and execute the code found in the "Supabase.sql" file located in the root of this project. This will create the necessary users table, profiles table, payment requests table, and Row Level Security rules. You must also create the "process_payment" RPC function.

Step 7: Start the Server
Run the application locally by executing:
npm run dev

Step 8: View the Application
Open your web browser and navigate to http://localhost:3000. You will see the application running.

## How to Run End-to-End (E2E) Tests
This project includes automated End-to-End tests built with Playwright to verify core user journeys (signing up, creating a request, and paying a request).

Step 1: Install Playwright Browsers
If this is your first time using Playwright, you must download the test browsers by running:
npx playwright install

Step 2: Execute the Test Suite
To run the automated tests in the background, run the following command in your terminal:
npx playwright test

Step 3: View Test Results and Video Recordings
Playwright is configured to record video of the automation process. To view the HTML report along with the screen recordings, run:
npx playwright show-report

## Workflow and GitHub Spec-Kit
This project strictly adhered to a spec-driven development process. Initial requirements were parsed into comprehensive markdown documents. Using an agentic AI coding environment, tasks were continuously divided into smaller components, executed in an autonomous loop, and verified against the initial specification. Real-time updates and strict PostgreSQL Row Level Security policies were implemented simultaneously to maintain data integrity.
