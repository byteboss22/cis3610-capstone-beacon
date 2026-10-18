# Redacted configuration and development runbook

## Server/client boundary

| Variable | Location | Purpose |
|---|---|---|
| `SUPABASE_URL` | `.env.local`, server process | Development project endpoint |
| `SUPABASE_ANON_KEY` | `.env.local`, server process | Anonymous/user-scoped database access |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, server process only | Optional administrator approval; never `NEXT_PUBLIC_`, `VITE_`, or another public prefix |
| `PORT` | `.env.local`, server process | Loopback development HTTP port |

All example credential values are blank. `.env.local` was copied from the example and `git check-ignore .env.local` confirms it is ignored. The UI receives no Supabase configuration or keys. The server serves exactly three public asset paths and never serves repository files. Restart `npm start` after local configuration changes.

## Apply numbered migration to Supabase development

Create/select a disposable development project in your own Supabase account. Use PostgreSQL's `psql` client and configure a local connection service named `beacon-dev` with the project's connection details in your workstation's `~/.pg_service.conf` and password in `~/.pgpass` (permissions 0600). Keep both outside Git. The session must be a migration administrator. Do not use production.

```sh
psql 'service=beacon-dev' -X -v ON_ERROR_STOP=1 -f supabase/migrations/0001_beacon.sql
psql 'service=beacon-dev' -X -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

Apply `0001` once to a clean schema. It is transactional and intentionally fails if already applied; record the migration version in project release notes. Future changes require a new numbered migration, never edits to already-applied SQL. A new disposable project plus the two commands demonstrates a clean rebuild. Supabase provides `auth.users`, `auth.uid()`, `anon`, `authenticated`, and `service_role` automatically; do not deploy the test harness's Auth shim.

The seed inserts fictional Auth identifiers without passwords and cannot be used to sign in. To exercise routes, create development test users through Supabase Auth normally. POST will create their minimal profile. Do not enable untrusted writes to Auth metadata or copy real customer data into fixtures.

## HTTP demonstration

Obtain short-lived access tokens for the development users through the project's normal Supabase Auth flow. Keep them in local shell variables; do not record terminal output containing tokens. These example variables are placeholders, not committed values.

```sh
curl -i http://127.0.0.1:3000/api/listings
curl -i http://127.0.0.1:3000/api/listings \
  -H "Authorization: Bearer ${OWNER_ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Fictional Test Home","description":"Coursework fixture","city":"Sample City","rent_cents":150000}'
curl -i -X PATCH "http://127.0.0.1:3000/api/listings/${DRAFT_ID}" \
  -H "Authorization: Bearer ${OTHER_ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' --data '{"title":"Forbidden change"}'
```

Expected: GET 200 approved records only; owner POST 201 draft absent from public GET; other user PATCH 404. Repeat with owner token for 200, an `approved` field for 400, no token for 401, and a non-admin call to `/api/admin/listings/:id` for 403. Test direct Data API reads/writes too: route validation alone is not RLS evidence. Use the matrix in `verification.md` and record only role labels, status/SQLSTATE, affected row counts, and redacted results.

For admin testing, a trusted project administrator must assign `app_metadata.role = admin` using Supabase's trusted administration tooling. Do not set it via client-editable user metadata. The server's optional service-role key is needed only for this route. Verify non-admin denial before testing approval.

## Hygiene

`npm run scan:secrets` scans nonignored repository files and all blobs reachable through local Git refs. It prints locations, never matching credential values. It covers common private keys, JWTs, Supabase secret keys, GitHub tokens, AWS access IDs, and environment credential assignments; arbitrary secret formats and unreachable/deleted objects are not guaranteed to be detected. Fetch remote refs before a final history review. `.env.local` is intentionally excluded because it is ignored; verify its values stay local.

Also inspect staged changes and environment-file history:

```sh
git check-ignore .env.local
git diff --cached --stat
git log --all --oneline -- .env .env.local
npm run scan:secrets
npm audit --audit-level=high
```

Review diffs in a private local terminal; never paste secret values into evidence. If a real credential was committed, rotate/revoke it first and arrange history cleanup before sharing. No real credential was supplied during this implementation.
