# AGTT — Advanced Grant Tracker Timeline

Internal OneStepGreener tool for tracking, scoring and timelining every grant, award, fellowship,
fund and prize OSG is pursuing. Rebuild of the AGTT Google Sheet as a real web app, same framework as
the BWG P&L platform: a pure calculation engine as the single source of truth, a CRUD app around it,
and parity tests proving the engine reproduces the original numbers. Deploys on Railway.

## What it does

- Tracks a database of funding opportunities with contacts, deadlines, stage, and per-funder pitch
  strategy notes.
- Auto-scores each one into a live Priority Score and band, recomputed every load from raw inputs and
  today's date. Nothing derived is ever stored.
- Auto-generates a timeline of the next N days of deadlines and action dates.

## Stack

Next.js (App Router) and TypeScript, Tailwind, Prisma with Railway-managed PostgreSQL, Recharts,
Vitest. Reads use Server Components, writes use Server Actions. No login, shared team tool.

## Project layout

```
src/lib/engine/     pure scoring engine (priority, constants, currency, dates) + parity tests
src/lib/            prisma client, scoring adapter, timeline builder, enum labels
src/app/            dashboard, opportunities, timeline, outreach, data pages + server actions
prisma/             schema + seed (40 real opportunities extracted from the sheet)
docs/               model-breakdown.md, decisions-log.md
```

The engine is framework free and is the one file to read first: `src/lib/engine/priority.ts`. The
one architectural rule: none of the auto fields are columns in the database, they are all recomputed
live. See `docs/model-breakdown.md`.

## Local development

Requires Node 20+ and a Postgres to point at.

```bash
npm install                       # installs deps and runs prisma generate
cp .env.example .env              # then edit DATABASE_URL

# option A: local Postgres via Docker
docker run -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=agtt -p 5432:5432 -d postgres

npm run db:migrate:dev            # create the schema
npm run db:seed                   # load the 40 real opportunities
npm run dev                       # http://localhost:3000
```

To develop against the real Railway Postgres instead of a local one, `railway link` this repo to the
project and run `railway run npm run dev` so Railway injects `DATABASE_URL`.

## Tests

```bash
npm test
```

The parity suite proves the engine reproduces all 14 numerically scored rows from the source sheet
exactly (frozen to today = 2026-07-13, the date the sheet's cached values were computed), and
documents the two fixes that deliberately change rankings (see `docs/decisions-log.md` 6.3 and 6.4).

## Deploy to Railway

There is no Railway MCP connector, so this uses the Railway CLI or dashboard.

1. Create a Railway project. Dashboard: New Project, Empty Project. Or CLI:
   `npm i -g @railway/cli`, `railway login`. For headless use, make a project token in
   Project Settings, Tokens, then `export RAILWAY_TOKEN=<token>`.
2. Add a PostgreSQL database in the project: New, Database, Add PostgreSQL. Railway exposes
   `DATABASE_URL` automatically.
3. Create the Next.js service: push this repo to GitHub, then New, GitHub Repo, select it. Nixpacks
   auto-detects Next.js, no Dockerfile needed.
4. Wire env vars: in the service Variables tab, set `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
5. Migrations on deploy are handled by `railway.json`, which runs `prisma migrate deploy` before
   `npm run start` on every deploy. To seed the first time, run `railway run npm run db:seed` once.
6. `next start` binds to Railway's injected `$PORT` (see the `start` script). Nixpacks build and
   start defaults otherwise work.
7. Optional custom domain: Settings, Networking, Custom Domain, add a CNAME at your DNS provider.

Deploys happen on push to the linked branch. Railway supports multiple environments per project if a
staging split is wanted later.

## Notes on the rebuild

Rankings differ from the old sheet on purpose. Amounts are normalized to USD before scoring, the
money score is rescaled so amounts differentiate, and opportunities with no fixed deadline now score
0 urgency instead of maximum. The dashboard carries a banner about this. Full rationale and evidence
are in `docs/decisions-log.md`.

