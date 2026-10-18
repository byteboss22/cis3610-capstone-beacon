# Restored Neighborhood Listing Platform interface

Date: October 17, 2026 (America/Los_Angeles). Branch: `feature/nextjs-interface`.

## What changed

Beacon now uses Next.js, React, TypeScript and Tailwind to carry forward the earlier coursework's feature overview, responsive property cards, labeled search filters, SVG illustrations and sponsor banner. Listing cards link to working detail pages. Public information comes from Beacon's same-origin server routes, backed by Supabase; the old JSON file is not a runtime data source. Monthly rent is stored in integer cents and displayed in dollars per month.

The earlier source is [byteboss22/neighborhood-listing-platform](https://github.com/byteboss22/neighborhood-listing-platform/tree/894beca1493c14748fd70df340c2c81282650919). Adapted components are `PropertyCard`, `PropertyListings`, `SearchFilters`, and `SponsorBanner`. SVG illustrations were copied from its `public/properties/`. Fictional presentation seed records come from `data/generated/listings.ai-studio.final.json` at that commit. IDs are mapped to fixed UUIDs and monthly prices to cents. No source-repository environment files, dependencies, Git history, private notes, or real records were imported. The source worktree was left unchanged.

The original voice-help marketing card was replaced with accessible browsing because neither application implements working voice navigation. Local SVGs retain explicit dimensions and alt text and use native lazy-loaded images; no remote image service or external fonts are required.

## What you need to do in Supabase

Your development project already has `0001` and the initial seed. In that project's **SQL Editor**, run these as separate new queries, in this order:

1. Copy and run all of [0002_listing_presentation.sql](../../supabase/migrations/0002_listing_presentation.sql) once. It adds presentation fields and narrow owner write grants without changing approval/ownership rules.
2. Optionally copy and run [seed-ui.sql](../../supabase/seed-ui.sql). It adds the earlier assignment's five fictional illustrated listings and five sponsors. It requires the original fictional owner profile from `seed.sql`; rerunning this optional seed does not overwrite existing records.

Do not rerun `0001` or the original seed. With the optional seed, public browse shows six approved properties (the original demo plus five imported fixtures) and hides the two original drafts. Sponsor reads show the original active sponsor plus five new active fixtures. The banner displays the first active sponsor alphabetically.

Before applying `0002`, the read API falls back to the original public column selection for missing-column errors, so the existing approved record still renders. Its unknown bedrooms, address details and size are omitted; the generic property illustration is labeled as an illustration. Fields are never filled from an unrelated static record. Type/bedroom filters exclude unknown values when such a filter is selected.

## Local development

```sh
npm ci
npm start
```

Open `http://127.0.0.1:3000`. `npm run dev` is equivalent; `npm start` remains a development alias so the student's existing command still works. Next.js automatically loads the existing ignored `.env.local`. Keep credentials local. For a deployment/build demonstration, use `npm run build` then `npm run start:production`.

## Security and validation

The Next Pages API entry point delegates to the existing tested streaming handler. Body parsing is disabled there so the 16 KiB cap, strict schemas, verified identity and owner filters remain authoritative. Only server API code imports the database adapter. Public detail reads always require `approved = true`, regardless of a supplied bearer token. Sponsor reads select only `id,name,website,message` with `active = true` and a 50-row limit. Public listing reads stay capped at 100 records.

Page rendering uses per-request CSP nonces. Production does not allow inline scripts without a nonce or `unsafe-eval`; development permits framework debugging/style injection. API CSP remains strict. `.env.local`, server source and SQL files are not served. The live verification script checks hidden paths, draft/private-table denials, and that locally configured keys are absent from client build artifacts. That script is not run in CI because it requires local development configuration.

## Verification

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run scan:secrets
npm audit --audit-level=high
# With the local app running and .env.local configured:
npm run verify:live
```

Forty checks cover the baseline and upgraded RLS matrix, field constraints, optional seed reruns, read compatibility, validated writes, UI filters/states, sponsor behavior, detail views and HTML-safe rendering. A live production-mode run against the existing `0001` project verified the new app/API, script nonce, anonymous reads and denials, and absent client-bundle credentials. See [live output](interface-live-output.txt). Hosted `0002` execution, real owner/admin write-denial tests, separate AI critiques and student visual/manual review remain pending.
