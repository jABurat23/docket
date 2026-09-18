# Docket

A personal dashboard that combines a budget tracker, an auto-generated monthly
financial report, a freelance/client work pipeline, and (soon) a goals tracker
— built to replace juggling separate spreadsheets and job trackers.

## Stack

| Layer     | Choice                                  | Why |
|-----------|------------------------------------------|-----|
| Frontend  | Next.js 14 (App Router), React, TypeScript, Tailwind | Server Components keep pages fast by default; Tailwind keeps styling co-located with markup instead of scattered across CSS files. |
| Backend   | Supabase (Postgres + Auth + Row Level Security) | No separate server to run — the database itself enforces that a user can only ever touch their own rows, so security doesn't depend on remembering to check `user_id` in every API route. |
| Language  | TypeScript everywhere (frontend, API routes) + SQL (schema, policies) | One language across the whole app — no context-switching, and types are shared between the client and the API via `src/lib/types.ts`. |
| Auth      | Google, GitHub, LinkedIn (OIDC) via Supabase Auth | All three are OAuth — no passwords to store or hash. |

## File structure

```
docket/
├── supabase/
│   └── migrations/0001_init.sql   # full schema + Row Level Security policies
├── src/
│   ├── app/                       # routes (Next.js App Router)
│   │   ├── login/                 # OAuth sign-in screen
│   │   ├── auth/callback/         # OAuth redirect handler
│   │   ├── dashboard/             # protected routes (see middleware.ts)
│   │   │   ├── page.tsx           # overview stats
│   │   │   ├── budget/
│   │   │   ├── report/
│   │   │   ├── goals/
│   │   │   └── pipeline/
│   │   └── api/                   # route handlers backing each module
│   ├── components/                # grouped by module, plus a shared ui/ folder
│   ├── lib/
│   │   ├── supabase/              # browser + server Supabase clients
│   │   ├── types.ts                # shared types, mirrors the SQL schema
│   │   └── report.ts               # report-generation logic
│   ├── middleware.ts               # blocks /dashboard for signed-out users
│   └── styles/globals.css
└── README.md
```

Each module (budget, pipeline, report, goals) keeps its page, components, and
API route grouped by name, so a future change to one module never means
hunting across unrelated folders.

## Setup

1. **Create a Supabase project** at supabase.com, then in the SQL editor run
   `supabase/migrations/0001_init.sql`.
2. **Copy `.env.example` to `.env.local`** and fill in your project's URL and
   anon key (Project Settings → API).
3. **Enable OAuth providers** in Supabase (Authentication → Providers):
   - **Google**: create an OAuth client in Google Cloud Console, add the
     Supabase callback URL as an authorized redirect URI.
   - **GitHub**: create an OAuth App in GitHub Developer Settings, same idea.
   - **LinkedIn**: register an app in the LinkedIn Developer Portal, enable
     "Sign In with LinkedIn using OpenID Connect," and use the `linkedin_oidc`
     provider ID in Supabase (already wired up in `LoginCard.tsx`).
4. **Install and run:**
   ```
   npm install
   npm run dev
   ```

## What's built vs. what's a placeholder

- **Budget**: full CRUD for manual entries, day/week/month filtering. CSV
  import is a disabled button for now (see below).
- **Pipeline**: full CRUD, status cycling (Sent → In progress → Won/Rejected).
  Marking something "Won" automatically creates a matching income row in the
  budget — the one place the two modules talk to each other.
- **Report**: generated on page load for the current month and cached in
  `monthly_reports` so it's only computed once per month. The savings
  suggestions are simple heuristics for now, not real analysis.
- **Goals**: schema exists (`goals` table) but there's no UI yet — deliberately
  left for a later pass, per your call on scope.

## Potential improvements

- **CSV bank import**: parse a CSV (similar to how Classboard parses PDF
  schedules) and bulk-insert into `budget_transactions` with `source: "imported"`.
- **True scheduled reports**: move report generation from "on page load" to a
  Supabase Edge Function triggered by `pg_cron` on the 1st of each month, so
  it's generated even if the user doesn't open the app that day.
- **Transaction categories**: add a `category` column to `budget_transactions`
  so the monthly report can give real category-over-category comparisons
  instead of generic suggestions.
- **Goals module**: design and build once the shape is clearer — table is
  ready (`goals`), UI and API route are not.
- **Drag-and-drop pipeline board** instead of click-to-cycle status.
- **Charts** for the revenue trend (currently only shown as raw numbers) —
  a lightweight library like Recharts would fit the existing design tokens.
- **Tests**: no test suite yet; API routes and `computeReport()` in
  `src/lib/report.ts` are the highest-value places to start.
