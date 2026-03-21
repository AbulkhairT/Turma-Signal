# Signal

Production-minded Next.js 15 + Supabase app for personalized daily signals.

## Stack
- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Supabase (auth + Postgres)
- Vercel-compatible setup

## Routes
- Public: `/`, `/login`, `/signup`, `/onboarding`
- Protected: `/app/today`, `/app/preferences`, `/app/saved`
- Internal API: `/api/internal/ingest`, `/api/internal/process`, `/api/internal/generate-signals`

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy envs:
   ```bash
   cp .env.example .env.local
   ```
3. Fill required env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INTERNAL_CRON_SECRET`
4. Run locally:
   ```bash
   npm run dev
   ```
5. Build check:
   ```bash
   npm run build
   ```

## Notes
- Middleware protects app routes and redirects unauthenticated users to `/login`.
- Onboarding captures lens + topics and persists to Supabase.
- Today feed reads published signals by user lens/topics and applies free-tier limit (`max 3`).
- Saved page reads user saved signals and supports save/unsave from feed cards.
- Internal API routes are protected by `x-internal-secret` header (`INTERNAL_CRON_SECRET`).

## Database
Use the SQL files under `supabase/` from the existing migration + seed deliverables.
