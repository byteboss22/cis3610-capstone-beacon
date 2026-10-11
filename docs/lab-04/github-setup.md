# GitHub setup status
Purpose: record confirmed setup and remaining access/layout steps.

## Confirmed artifacts
- Private repository: https://github.com/byteboss22/cis3610-capstone-beacon
- Active private Project: [CIS 3610 — Team Beacon Capstone](https://github.com/users/byteboss22/projects/1), owned by byteboss22 and linked to byteboss22/cis3610-capstone-beacon. The user copied it from the original Atomic-Rose Project; use this copy for team work.
- Planning issue: [#1](https://github.com/byteboss22/cis3610-capstone-beacon/issues/1).
- Validation issue: [#2](https://github.com/byteboss22/cis3610-capstone-beacon/issues/2), assigned to Atomic-Rose with enhancement, validation, and ui labels.
- [Week 8 MVP milestone #1](https://github.com/byteboss22/cis3610-capstone-beacon/milestone/1), attached to issue #2; scope remains provisional.
- CLI authentication and project scope confirmed after user authentication.
- Project has nine items: planning issue, seven draft stories, and issue #2 representing US-02. All start in Backlog.
- Status options: Backlog, Ready, In Progress, Review, Done.
- Priority and Effort fields match the requirements table.
- Capstone Board view uses Board layout.

| Story | Priority | Effort |
|---|---|---|
| US-01 | High | Medium |
| US-02 (issue #2) | High | Medium |
| US-03 | Medium | Medium |
| US-04 | Medium | Medium |
| US-05 | High | Small |
| US-06 | Medium | Medium |
| US-07 | High | Large |
| US-08 | High | Medium |

## Remaining manual steps
1. Open the Project's **Capstone Board** view. Use the view configuration to select **Group by → Status**, then save the view. GitHub's API confirmed Board layout but returned no grouping field; its view update input supports visible fields, not grouping. No connected browser was available to finish this UI setting.
2. Confirm team and instructor access to the private Project and repository. Project access is separate from repository access. Grant access through the owner according to team policy.
3. Use the repository's Projects tab or the active Project URL above. Repository linking is now confirmed. The original Atomic-Rose Project remains intact; avoid maintaining two separate boards.
4. Confirm scope and owners before moving stories from Backlog. Draft story owners remain Unassigned.

## Verification commands
Run from the repository in PowerShell:
```powershell
gh auth status
gh project view 1 --owner byteboss22 --format json
gh project field-list 1 --owner byteboss22 --format json
gh project item-list 1 --owner byteboss22 --format json
gh api repos/byteboss22/cis3610-capstone-beacon/milestones --paginate
gh issue view 2 --repo byteboss22/cis3610-capstone-beacon
```
Do not recreate issues, fields, milestone, or the Project; all exist.

## Publishing future updates
```powershell
git fetch origin
git status --short --branch
git log --oneline origin/main..HEAD
git push origin main
```
If the remote advances, inspect changes and follow team merge/review policy. Never force-push or change repository visibility without authorization.
