# Database lab — implementation and evidence

Branch: `feature/database`. Date: October 17, 2026 (America/Los_Angeles).

This extends the Lab 4 concept with a Next.js application with server-only API routes and a public listings interface, and a Supabase/PostgreSQL schema. It is an academic demonstration using fictional records. The student applied migration `0001` and the initial seed in a Supabase development project. Live anonymous reads and denials now pass. No stakeholder interviews, separate external AI reviews, hosted `0002` execution, authenticated owner/admin checks, or deployment are claimed.

The original Neighborhood Listing Platform interface is now integrated; see [source attribution, upgrade steps and verification](interface-integration.md).

## Evidence map

| Rubric | Artifact |
|---|---|
| Schema and migrations (25) | [Numbered migration](../../supabase/migrations/0001_beacon.sql), [fictional seed](../../supabase/seed.sql), [additive migration](../../supabase/migrations/0002_listing_presentation.sql), [optional presentation fixtures](../../supabase/seed-ui.sql), [ERD and schema review](schema-review.md) |
| RLS design and tests (35) | [Executable PostgreSQL tests](../../tests/rls.test.js), [role matrix and results](verification.md) |
| CRUD integration (25) | [HTTP routes](../../server/app.js), [server-only client](../../server/database.js), [UI](../../src/components/ListingsExplorer.tsx), route/adapter/UI tests in `tests/` |
| Secret hygiene and documentation (15) | [.env.example](../../.env.example), [.gitignore](../../.gitignore), [scan script](../../scripts/scan-secrets.py), [configuration](configuration.md), [AI log](ai-log.md) |

## Run locally

1. Use Node 24.15+ in the 24 series (see `.nvmrc`) and run `npm ci`.
2. Copy `.env.example` to `.env.local` if it does not already exist. This task created a blank local copy. Fill values locally using a **development** Supabase project. Never paste them into a chat, screenshot, or commit.
3. Apply the migration and seed to that project following [configuration.md](configuration.md). The local tests do not provision a hosted Supabase project.
4. Run `npm start` (development alias for `npm run dev`; Next.js loads `.env.local` automatically) and open `http://127.0.0.1:3000`. Without valid server configuration, startup fails safely.
5. Run `npm test`, `npm run scan:secrets`, and `npm audit --audit-level=high`.

`npm test` creates a fresh in-memory PostgreSQL database via PGlite, applies the exact migration and seed, and executes role-scoped SQL with RLS. Tests use an Auth shim, not Supabase's live authentication service. HTTP route tests and a mock Supabase HTTP endpoint verify validation, authorization flow, explicit selected columns, caller-token forwarding and response handling. React DOM tests cover filters, listing/detail/sponsor rendering, loading, empty, error/retry, and text-only rendering. These tests need no credentials.

## Routes

| Method/path | Access and behavior |
|---|---|
| `GET /api/listings` | Anonymous; at most 100 approved listings, newest first; explicit public fields |
| `GET /api/listings/:uuid` | Anonymous; approved listing only; missing/unapproved return 404 |
| `GET /api/sponsors` | Anonymous; at most 50 active sponsors, ordered by name |
| `POST /api/listings` | Verified bearer token; creates a profile if absent and a draft owned by that user |
| `PATCH /api/listings/:uuid` | Verified owner; updates only own unapproved listing; inaccessible/missing/approved all return 404 |
| `PATCH /api/admin/listings/:uuid` | Verified user with server-controlled `app_metadata.role = admin`; accepts only `approved`; service client created after authorization |

POST requires `title`, `description`, `city`, and integer `rent_cents`. PATCH accepts a nonempty subset. Extra fields, including `owner_id` and `approved`, are rejected on ordinary routes. All writes require JSON and are capped at 16 KiB. The Supabase SDK sends structured values and encoded filters through PostgREST; no route builds SQL from request input.

The public UI implements listing browse, filters, detail pages, and an active sponsor banner. A sign-in/dashboard UI, sponsor CRUD routes, inquiry routes, audit events, deployment, and production operational hardening are outside this lab implementation. Sponsors and inquiries have schema/RLS/test coverage. The required POST/PATCH behavior is available through the listing API.

To collect the actual second-user JWT denial evidence without a browser sign-in form, follow [testing without a sign-in UI](testing-without-sign-in-ui.md). The test script uses private local credentials and saves redacted request/response evidence.

## Finish before submission

- Apply the new `0002` migration and optional presentation seed to the existing development project; record redacted outcomes and repeat negative cases with actual Auth users. Use disposable test accounts, never real stakeholder data.
- Run the [AI prompt](ai-review-prompt.md) separately in ChatGPT and Gemini/AI Studio; record actual outputs and your own verification in [ai-log.md](ai-log.md).
- Review the DDL and AI-authored work yourself; identify your own contribution and commit in [submission.md](submission.md).
- Run `npm run lint`, `npm run typecheck`, and `npm run build`. For a production server use `npm run start:production` after building.
- Record hosted/demo URL if applicable. A passing local suite does not prove hosted configuration is correct.
