# AI provenance and review checkpoint

Session date: October 17, 2026 (America/Los_Angeles).

## Actual interaction: Codex (OpenAI)

- **User prompt:** Help implement the database/security assignment pasted in this chat, including persistent PostgreSQL storage, five named entities, migrations and seeds, default-deny RLS, role denial tests, server routes, UI read states, secret hygiene, and AI collaboration evidence. The pasted Lab 4/5 sample is context, not evidence that new reviews/interviews occurred.
- **Implementation prompt:** The user's full assignment in the conversation. The reusable defensive review prompt is preserved verbatim in [ai-review-prompt.md](ai-review-prompt.md).
- **Useful output:** Migration, fictional seed, RLS restrictions, SQL denial tests, server routes, strict validation, public listing UI, security tests and documentation.
- **Modified/rejected design alternatives during implementation:** Service-role owner writes were avoided because they bypass RLS; client-editable user_metadata administrator claims were rejected in favor of verified app_metadata; blanket cascading ownership/inquiry deletion was replaced with restrictive foreign keys; approval/ownership fields were excluded from client column grants and request schemas. These are Codex design choices, not a claimed human rejection of Gemini output.
- **Verification actually performed:** Exact migration/seed applied to a fresh PGlite PostgreSQL instance; role-scoped SQL denials; Node HTTP and mock Supabase adapter tests; browser DOM loading/empty/error/retry/text rendering tests; npm dependency audit; local reachable-history and working-tree pattern scan; `.env.local` ignore check. See [verification.md](verification.md).
- **Limitations:** Tests use a minimal Auth shim and mock HTTP provider; no live Supabase project was available. Docker exists but its daemon was unavailable. AI Studio access was attempted through computer-use tooling; Chrome was unavailable and the browser inventory was empty, so no external AI prompt was sent.
- **Human verification:** Pending. Student must review schema, policies, outputs and tests and identify their own changes before submission.
- **Commit:** `774ff0b` on `feature/database`; draft PR https://github.com/byteboss22/cis3610-capstone-beacon/pull/3. Add subsequent human-review/fix commit IDs below.

## Separate model reviews — pending, not executed

| Tool | Exact prompt/source | Useful output | Rejected output/reason | Verification/reviewer | Commit/status |
|---|---|---|---|---|---|
| ChatGPT (separate conversation) | ai-review-prompt.md + migration and RLS test source | None yet | None yet | Pending | Not executed |
| Gemini / Google AI Studio | Same prompt and attachments | None yet | None yet | Pending | Blocked in this session: no connected browser or Gemini API tool |

Codex is an OpenAI coding agent; do not label this session as a separately completed ChatGPT conversation or Gemini/AI Studio review. Confirm with the instructor whether this interaction satisfies their ChatGPT portion; otherwise run both separate reviews.

## Fill after each actual review

- Tool/model, date, and exact prompt/attachments:
- Useful excerpt or accurate summary:
- Rejected suggestion, reason, and relevant schema/policy reference:
- Verification command and actual result (redacted):
- Student reviewer and individual contribution:
- Commit containing the resulting change:

Never substitute the old discovery-stage Gemini output in the pasted course sample for a database schema review.

## Interface integration follow-up — October 17, 2026

- **User request:** “okay lets do that, lets bring that into beacon” referring to the earlier Neighborhood Listing Platform interface.
- **Actual assistance:** Codex inspected both repositories, imported/adapted the original property cards, filters, sponsor banner and SVG assets, and connected them to Beacon's server API. Source: `byteboss22/neighborhood-listing-platform` main commit `894beca1493c14748fd70df340c2c81282650919`; copied component code matched the local clean worktree. The source application was not edited.
- **Useful output:** Next.js interface, API integration, public detail/sponsor reads, additive migration `0002`, fictional presentation seed, regression tests and upgrade notes.
- **Modified/rejected approaches:** Kept `0001` intact because the student had applied it already. Avoided importing old static JSON as the live data source; mapped its fictional records to UUIDs and integer cents in an optional seed instead. Replaced sale-sized price filters with monthly rent. Missing presentation fields remain unknown. Updated imported Next.js dependencies after an audit identified advisories in the older version; current full audit is clean. Removed a React Server Component sentinel from the Pages API entry point after a production smoke test showed it is incompatible there; Pages API routes are server-only bundles, and client-build checks verify configured keys are absent.
- **Actual verification:** 40 local checks pass, including both migration versions, new field constraints and ownership denials, React filter/detail/sponsor/retry states, and API adapter fallback rules. Type checking, lint, and the production build pass. A production server connected to the student's live `0001` project passes public reads and anonymous denial checks. No hosted `0002` or owner/admin mutation tests have run. No browser visual review is claimed; UI testing uses React/JSDOM and live HTTP/CSP checks.
- **Human review and individual contribution:** Pending student review. User confirmed initial schema/seed execution and initial live page setup; this is reported confirmation, not a claim that Codex applied those hosted scripts.
- **Commit:** `e23e5d3` on `feature/nextjs-interface`; draft PR https://github.com/byteboss22/cis3610-capstone-beacon/pull/4. Record human review/fixes separately.

Separate ChatGPT and Gemini database critiques are still pending. This follow-up does not substitute for them.
