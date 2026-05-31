# Finacal

Finacal is a modern, enterprise-ready personal finance and travel tracking dashboard. It allows users to track income, expenses, shared subscriptions, savings goals, and travel logs with an intuitive and responsive UI.

## Features
- **Dashboard & Analytics:** Comprehensive charts, transaction history, and monthly overviews.
- **Goal Tracking:** Track progress toward savings goals.
- **Recurring Transactions:** Manage subscriptions and automated payments.
- **Travel Log:** Keep a ledger of trips, mileage, and travel expenses.
- **Role-Based Access Control:** Built-in Admin dashboard to manage users and system health.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Recharts
- **Backend**: Next.js Serverless API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT implementation (jose)
- **Caching/Rate-Limiting**: Redis (ioredis)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nevil-90/fincal.git
   cd fincal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file and fill in your PostgreSQL and Redis credentials:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## License
MIT
