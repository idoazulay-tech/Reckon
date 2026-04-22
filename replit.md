# Workspace — Reckon

## Overview

Reckon is an AI-powered job search intelligence app. This is a pnpm monorepo with a TypeScript Express backend connected to Supabase.

## Product

- **Name**: Reckon
- **Purpose**: AI-powered job search management — match scoring, email generation, market intelligence
- **Pricing**: Free (3 jobs), Pay-as-you-go ($1/12 jobs), Monthly ($19/mo with 7-day trial)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Auth**: Supabase Auth (JWT validation via service role key)
- **Database**: Supabase (PostgreSQL) — tables: profiles, jobs, usage_tracking
- **Storage**: Supabase Storage (resumes bucket)
- **AI**: Anthropic Claude (claude-haiku-4-5) — job extraction, analysis, email generation
- **PDF parsing**: pdf-parse
- **File uploads**: multer (memory storage)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)

## Secrets Required

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side, never expose to frontend)
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude
- `SESSION_SECRET` — Express session secret

## Database Setup

Run `artifacts/api-server/supabase-schema.sql` in the Supabase SQL Editor (reckon-prod project, Frankfurt).
This creates: `profiles`, `jobs`, `usage_tracking` tables + RLS policies + storage bucket.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Routes

All routes under `/api`. Protected routes require `Authorization: Bearer <supabase-jwt>`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/healthz | No | Health check |
| GET | /api/profile | Yes | Get user profile |
| PUT | /api/profile | Yes | Update name |
| PUT | /api/profile/resume | Yes | Upload PDF resume |
| GET | /api/jobs | Yes | List all jobs |
| POST | /api/jobs | Yes | Create job (free limit: 3) |
| GET | /api/jobs/:id | Yes | Get single job |
| PUT | /api/jobs/:id | Yes | Update job |
| DELETE | /api/jobs/:id | Yes | Delete job |
| POST | /api/jobs/extract-url | Yes | Extract job from URL |
| POST | /api/jobs/extract-image | Yes | Extract from screenshot |
| POST | /api/jobs/:id/analyze | Yes | AI analysis (10/day limit) |
| POST | /api/jobs/:id/regenerate-email | Yes | Regenerate email (max 3) |
| GET | /api/billing/status | Yes | Current plan + usage |
| POST | /api/billing/cancel | Yes | Cancel subscription |

## Business Logic

- **Free tier**: Max 3 jobs, partial AI output (2 missing skills, no email/market report)
- **Rate limiting**: 10 AI analyses per day per user
- **Email regeneration**: Max 3 per job
- **Data retention on cancel**: 60 days

## File Structure

```
artifacts/api-server/
  src/
    app.ts              — Express app setup
    index.ts            — Server entry point
    lib/
      logger.ts         — Pino logger singleton
      supabase.ts       — Supabase admin client
    middlewares/
      auth.ts           — JWT auth middleware (requireAuth)
    routes/
      health.ts         — GET /healthz
      profile.ts        — Profile + resume routes
      jobs.ts           — Jobs CRUD + AI routes
      billing.ts        — Billing routes
      index.ts          — Router composition
  supabase-schema.sql   — Run in Supabase SQL Editor
lib/
  api-spec/openapi.yaml — OpenAPI spec (source of truth)
  api-client-react/     — Generated React Query hooks
  api-zod/              — Generated Zod validators
```
