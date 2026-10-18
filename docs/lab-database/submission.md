# Canvas submission draft — complete remaining evidence first

- Repository: https://github.com/byteboss22/cis3610-capstone-beacon
- Branch: `feature/database`
- Pull request: pending; use the draft database implementation PR when available.
- Deployment or demonstration URL: pending; local development URL is not a public deployment.
- Test evidence: `docs/lab-database/test-output.txt`, `security-output.txt`, `verification.md`; rerun `npm test` and `npm run scan:secrets` at the submitted commit.
- AI evidence: `docs/lab-database/ai-log.md`. Codex work is recorded; separate ChatGPT and Gemini reviews and human verification remain pending.

Suggested statement after finishing the external checks:

> Our database implementation uses a numbered migration and fictional seed, default-deny RLS on five exposed tables, owner-scoped writes, server-authorized approval, and a listings UI. Tests and redacted security checks are in docs/lab-database/. AI prompts, actual outputs, rejected suggestions, verification, and commit references are in ai-log.md. [Student: identify the code/review/tests you personally performed and the relevant commit IDs.]

Do not submit this draft statement as though pending tests/reviews have run. Every student must identify an individual contribution and its evidence. AI-authored code is not evidence of manual student review. Canvas People-group configuration requires instructor/course access and is not handled by this repository.
