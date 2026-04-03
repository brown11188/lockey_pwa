# Lockey PWA

A mobile-first Progressive Web App for personal expense tracking, built with Next.js, React, and PostgreSQL. Lockey supports family sharing, budget management, streaks, achievement badges, multi-currency, and multi-language (English & Vietnamese).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Available Scripts](#available-scripts)
- [Docker](#docker)
- [Architecture Notes](#architecture-notes)

---

## Features

| Feature | Description |
|---------|-------------|
| **Expense Tracking** | Log expenses with amount, category, date, and optional photo |
| **Gallery View** | Timeline of expenses grouped by date with category filters |
| **Statistics Dashboard** | Monthly charts and category breakdowns (Recharts) |
| **Budgets** | Per-category spending limits with overspend alerts |
| **Streaks & Badges** | Daily entry streaks and achievement milestones |
| **Family Groups** | Create or join a family group for shared expense visibility |
| **Subscriptions** | Track recurring expenses with monthly cost projection |
| **Monthly Wrapped** | End-of-month spending summary with top categories |
| **Multi-Currency** | Real-time exchange rates with automatic conversion |
| **Multi-Language** | English and Vietnamese (i18n translations included) |
| **Admin Panel** | User management, detail view, and per-user statistics |
| **PWA** | Installable on mobile with standalone display mode |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Charts | Recharts |
| ORM | Drizzle ORM |
| Database | PostgreSQL via Neon serverless (local dev: SQLite) |
| Auth | NextAuth v5 (Credentials provider) |
| Password Hashing | bcryptjs |
| Date Utilities | date-fns |
| Validation | Zod |
| Linting | ESLint 9 |
| Containerisation | Docker (multi-stage, standalone output) |

---

## Project Structure

```
lockey_pwa/
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── page.tsx         # Root → redirects to /gallery
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── gallery/         # Expense gallery
│   │   ├── camera/          # Photo capture
│   │   ├── stats/           # Statistics dashboard
│   │   ├── settings/        # User settings
│   │   ├── subscriptions/   # Recurring expenses
│   │   ├── family/          # Family group management
│   │   ├── admin/           # Admin dashboard & user management
│   │   └── api/             # REST API route handlers
│   │       ├── auth/        # NextAuth endpoints
│   │       ├── entries/     # Expense CRUD
│   │       ├── budgets/     # Budget management
│   │       ├── family/      # Family operations
│   │       ├── streak/      # Streak tracking
│   │       ├── badges/      # Achievement badges
│   │       ├── settings/    # User preferences
│   │       ├── stats/       # Aggregated statistics
│   │       ├── subscriptions/ # Recurring expense templates
│   │       ├── wrapped/     # Monthly summary
│   │       ├── photos/      # Photo retrieval
│   │       ├── upload/      # Photo upload
│   │       ├── exchange-rates/ # Currency conversion
│   │       ├── health/      # Health check
│   │       └── admin/       # Admin operations
│   │
│   ├── components/          # 45 React components
│   │   ├── *-screen.tsx     # Full-page screen components
│   │   ├── *-modal.tsx      # Feature modals
│   │   └── *.tsx            # Shared UI components
│   │
│   ├── db/
│   │   ├── schema.ts        # Drizzle ORM schema (13 tables)
│   │   └── seed.ts          # Database seed script
│   │
│   ├── hooks/               # Custom React hooks (budget alert, exchange rates, OCR)
│   │
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db.ts            # Drizzle client
│   │   ├── constants.ts     # Categories, currency symbols
│   │   ├── format.ts        # Number/date formatting
│   │   ├── currency-utils.ts
│   │   ├── currency-context.tsx
│   │   ├── language-context.tsx
│   │   ├── en.ts / vi.ts    # i18n translations
│   │   └── ...              # Other utilities
│   │
│   └── middleware.ts        # Auth middleware & role-based routing
│
├── drizzle/                 # Generated migration files
├── public/                  # Static assets (PWA manifest, icons)
├── data/                    # Local SQLite database (dev only, git-ignored)
├── Dockerfile               # Multi-stage production build
├── drizzle.config.ts        # Drizzle ORM configuration
├── next.config.ts           # Next.js configuration
└── .env.example             # Environment variables template
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- A PostgreSQL database (or use the local SQLite dev setup)

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd lockey_pwa

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in values
cp .env.example .env.development

# 4. Push the schema to the database
npm run db:push

# 5. (Optional) Seed initial data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

See `.env.example` for a full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (or `./data/app.db` for local SQLite) |
| `AUTH_SECRET` | Random secret used by NextAuth to sign tokens |
| `AUTH_URL` / `NEXTAUTH_URL` | Public URL of the application |
| `NEXT_PUBLIC_BASE_PATH` | Optional base path prefix (e.g. `/apps/myapp`) |
| `NODE_ENV` | `development` or `production` |

---

## Database

Lockey uses **Drizzle ORM** with the following tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles and roles |
| `accounts`, `sessions`, `verificationTokens` | NextAuth adapter tables |
| `entries` | Expense records |
| `photos` | Photo binary data (bytea) |
| `budgets` | Per-category spending limits |
| `streak` | Daily tracking streaks |
| `badges` | Achievement tracking |
| `family` | Family group definitions |
| `subscriptions` | Recurring expense templates |
| `settings` | User preferences |
| `exchange_rates` | Cached currency conversion rates |

---

## Available Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Build for production (standalone output)
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Drizzle migration from schema changes
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema directly to the database (dev only)
npm run db:studio    # Open Drizzle Studio web UI
npm run db:seed      # Seed initial data
```

---

## Docker

A multi-stage Dockerfile is included for production deployments.

```bash
# Build the image
docker build -t lockey:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e AUTH_SECRET="your-secret" \
  -e AUTH_URL="https://your-domain.com" \
  lockey:latest
```

The image uses a standalone Next.js build and runs database migrations automatically on startup via `start.sh`.

---

## Architecture Notes

- **App Router**: All pages live under `src/app/` following Next.js 13+ conventions.
- **Authentication**: NextAuth v5 with a Credentials provider. Middleware at `src/middleware.ts` enforces login requirements and role-based access to `/admin`.
- **Data Fetching**: Client components use a typed `apiFetch` wrapper (`src/lib/api.ts`). Server-side queries are executed directly with Drizzle inside API route handlers.
- **i18n**: Translations are stored in `src/lib/en.ts` and `src/lib/vi.ts`. The active language is managed through `LanguageContext`.
- **Currency**: Exchange rates are cached in the database and surfaced via `CurrencyContext`. Conversion utilities are in `src/lib/currency-utils.ts`.
- **PWA**: A `manifest.json` in `public/` and the standalone viewport configuration make the app installable on mobile devices.
