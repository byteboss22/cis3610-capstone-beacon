# AI provenance log
Purpose: disclose actual assistance and distinguish generated drafts from evidence. Session date: October 10, 2026 (America/Los_Angeles).

## Actual Codex interaction
| Field | Record |
|---|---|
| Tool name | Codex |
| Prompt | Full user-supplied task preserved verbatim in [task source](task-source.txt); user instructed reading the pasted request and completing Lab 4 setup |
| Purpose | Inspect repository; draft documentation, hypothetical requirements, templates, issues, and manual GitHub setup |
| Useful generated output | Lab 4 documents, eight questions, two personas, eight stories, ten high-priority Gherkin scenarios, Mermaid workflow, issue drafts |
| Rejected or modified output | No separate candidate response was rejected by a human. Generation deliberately treats visitors/reviewers as inferred roles and limits US-04 MVP scope to browse; no interviews or other AI executions claimed |
| Human verification | Pending student/team/instructor review; automated document checks are not human approval |
| Related files or commit | docs/lab-04/, .github/, README.md; identify commit with git log -1 |
| Verification status | AI-authored provisional drafts; see validation-evidence.md for structural checks |

GitHub connector confirmed private visibility, write permission, issue #1, issue #2, labels, and feature assignee. It is an API connector, not additional stakeholder evidence. CLI authentication initially failed. After the user authenticated and approved project scope, Codex used gh to create milestone #1 and private Project Atomic-Rose/1, configure five statuses and Priority/Effort fields, add nine items, and verify the results. Board layout is confirmed; grouping by Status requires a manual UI step. Direct repository linking was rejected because the owners differ, while adding repository issues succeeded. No connected browser was available for the grouping step.

## Other interactions — not executed
| Tool | Prompt | Purpose | Useful output | Rejected/modified output | Human verification | Related file | Status |
|---|---|---|---|---|---|---|---|
| ChatGPT (separate interaction) | Not yet provided | Optional review | None | Not applicable | Pending | Appropriate reviewed document | Not executed |
| Gemini | Not yet provided | Critique neutral/privacy-sensitive questions | None | Not applicable | Pending | 02-interview-guide.md | Not executed |
| Google AI Studio | Exact prompt in 05-ai-themes.md | Theme and requirement analysis | None | Not applicable | Pending | 05-ai-themes.md | Not executed |

For each actual future interaction, record exact prompt, tool/model as known, date, output used, rejected suggestions and reasons, reviewer, source files, and verification status. Do not send actual notes to external AI without appropriate permission and de-identification.
