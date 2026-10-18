# Verification evidence and access matrix

Local execution: October 17, 2026. Node v24.19.0. The current suite has 40 passing checks, including the restored Next.js interface and both migration versions. See [test-output.txt](test-output.txt) for captured test output and [security-output.txt](security-output.txt) for the scan/audit results.

## Role matrix

| Operation | Anonymous | Owner | Other user | Service role |
|---|---|---|---|---|
| Read approved property/active sponsor | Allow | Allow | Allow | Allow |
| Read owner's unapproved property/inactive sponsor | No rows | Allow | No rows | Allow |
| Insert own draft | Deny | Allow | Allow only with own ID | Allow |
| Insert draft with someone else's owner ID | Deny | Deny | Deny | Allow if FK valid |
| Edit owner's unapproved property/inactive sponsor | Deny | Allow | No affected rows | Allow |
| Edit approved property/active sponsor | Deny | No affected rows | No affected rows | Allow |
| Change owner ID/approval/activation | Deny | Deny | Deny | Allow |
| Read profiles | Deny | Self only | Self only | Allow |
| Read inquiries | Deny | Own sent messages only | Own sent messages only | Allow |
| Send inquiry to approved listing | Deny | Allow as self | Allow as self | Allow if FK valid |
| Send inquiry to unapproved listing | Deny | Deny | Deny | Allow if FK valid |
| Read partnership | Both endpoints public only | Both endpoints public only | Both endpoints public only | Allow |
| Write partnership/delete listing | Deny | Deny | Deny | Allow subject to FKs |

The executable suite covers representative allow/deny paths in this matrix; it is not an exhaustive test of every cell. It also checks five RLS flags, publication immutability, profile ownership spoofing, invalid rent, foreign-key restrictions and join cascades. SQLSTATE `42501` means insufficient privilege or RLS denial, `23514` CHECK violation, `23503` FK violation. A forbidden RLS SELECT/UPDATE commonly returns zero rows rather than throwing; tests explicitly assert that result. Each role-scoped test rolls back its mutations.

## What ran

- Fresh PostgreSQL schema creation and exact versioned migration/fictional seed execution through PGlite. This proves local clean-schema rebuilding, not hosted Supabase parity.
- `anon`, `authenticated` owner/other, and `service_role BYPASSRLS` queries with locally set Auth UUID context.
- HTTP tests: public read; authenticated POST/PATCH; token rejection; strict validation; oversized/malformed JSON; hidden static files; safe errors; non-admin denial; verified admin approval.
- Supabase SDK HTTP adapter test: explicit selects, approved read filter, read limit, caller JWT forwarding, owner/draft filters, structured mutation values and dedicated service credentials for admin calls.
- React DOM tests: loading, empty, error/retry, combined rent/type/bedroom filters, active sponsors, detail pages, rendered monthly rent and HTML-like database content displayed as text.
- Scanner self-tests: blank examples allowed, populated credential assignment detected/redacted, synthetic token detected in deleted Git history.
- Pattern scan of nonignored files and reachable Git blobs; blank `.env.local` is ignored. Dependency audit reports zero vulnerabilities at execution time.

The local automated suite uses no genuine credentials. The subsequent live HTTP/anonymous Data API checks used the student’s local project URL and anon/publishable key without recording them; see [interface-live-output.txt](interface-live-output.txt). No actual authenticated owner/admin mutation tests or production security certification are claimed.

## Hosted verification still required

| Evidence | Status | Record after running |
|---|---|---|
| Initial development migration and seed | Student confirmed; live fixture reads verified | `0001` and initial fixtures; October 17, 2026 |
| Hosted presentation migration and optional seed | Pending | `0002` and optional `seed-ui.sql` |
| Actual anonymous Data API read of public/draft fixtures | Passed | 1 public listing/active sponsor/eligible partnership; draft zero rows; profiles/inquiries SQLSTATE 42501 |
| Real owner and second-user token negative tests | Pending | Redacted HTTP status and row counts; repeat direct Data API attempts |
| Trusted administrator route approval | Pending | Non-admin 403, verified-admin 200; public GET changes |
| Browser visual/manual review of restored interface | Pending | React DOM states and live Next HTTP/CSP checks pass; student should inspect the actual browser layout |
| Separate ChatGPT and Gemini critique and human DDL review | Pending | Actual output, accepted/rejected suggestions, tests, student commit |

Supabase Auth must validate the JWT and supply `auth.uid()` in deployment. The local shim only models that context; a hosted configuration mistake cannot be ruled out by the local suite. Never disable RLS to make public reads work: check grants, policy, and publication status first.
