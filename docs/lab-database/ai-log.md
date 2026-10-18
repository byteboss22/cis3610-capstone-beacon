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
