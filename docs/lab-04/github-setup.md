# GitHub status and remaining setup
Purpose: record actual operations and reproducible next steps.

Confirmed private repository: https://github.com/byteboss22/cis3610-capstone-beacon
Connected identity: Atomic-Rose, confirmed write permission.
Planning issue: [#1](https://github.com/byteboss22/cis3610-capstone-beacon/issues/1).
Validation feature: [#2](https://github.com/byteboss22/cis3610-capstone-beacon/issues/2), assigned to Atomic-Rose with enhancement, validation, and ui labels confirmed by GitHub.
Milestone and project board: **Not yet created**. Available connector tools do not manage Projects or milestones; CLI authentication is invalid.
Issue creation was preceded by a repository-wide issue search with no existing issues returned. Do not recreate these issues.

## Restore CLI access and publish the local commit
Run from the repository in PowerShell:
```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth status
gh auth setup-git
git fetch origin
git status --short --branch
git log --oneline origin/main..HEAD
git push origin main
```
Use an account with repository write permission. If the remote advanced, inspect changes and use a normal merge or a review branch according to team policy; never force-push. Do not create another repository or change its visibility.

## Milestone
First inspect existing milestones:
```powershell
gh api repos/byteboss22/cis3610-capstone-beacon/milestones --paginate
```
If no suitable Week 8 milestone exists:
```powershell
gh api --method POST repos/byteboss22/cis3610-capstone-beacon/milestones -f title='Week 8 MVP' -f description='Provisional scope; instructor and stakeholder confirmation pending'
gh issue edit 2 --repo byteboss22/cis3610-capstone-beacon --milestone 'Week 8 MVP'
```
If a suitable equivalent exists, use its exact title instead. Labels already exist; no creation needed.

## Project board
1. Agree whether the project belongs to the repository owner or your personal account. Repository write permission does not establish permission to create the owner's Projects.
2. Restore Projects scope and inspect existing boards before creating one:
```powershell
gh auth refresh --hostname github.com --scopes project
gh project list --owner '@me'
```
3. If no matching board exists and personal ownership is agreed:
```powershell
$beaconProject = gh project create --owner '@me' --title 'CIS 3610 — Team Beacon Capstone' --format json | ConvertFrom-Json
$beaconNumber = $beaconProject.number
gh project link $beaconNumber --owner '@me' --repo byteboss22/cis3610-capstone-beacon
gh project view $beaconNumber --owner '@me' --web
```
For an existing board, set $beaconNumber to its number instead of creating a duplicate.
4. In project settings, edit the existing **Status** field to exactly: Backlog, Ready, In Progress, Review, Done. Do not create a second Status field. Create a board view grouped by Status.
5. Inspect fields first, then create only missing fields:
```powershell
gh project field-list $beaconNumber --owner '@me'
gh project field-create $beaconNumber --owner '@me' --name Priority --data-type SINGLE_SELECT --single-select-options 'High,Medium,Low'
gh project field-create $beaconNumber --owner '@me' --name Effort --data-type SINGLE_SELECT --single-select-options 'Small,Medium,Large'
gh project item-add $beaconNumber --owner '@me' --url https://github.com/byteboss22/cis3610-capstone-beacon/issues/1
gh project item-add $beaconNumber --owner '@me' --url https://github.com/byteboss22/cis3610-capstone-beacon/issues/2
```
6. Create seven draft items for US-01 and US-03 through US-08; link issue #2 as US-02. Copy each story, source, assumptions, and acceptance scenarios from the requirements document. Example:
```powershell
gh project item-create $beaconNumber --owner '@me' --title 'US-01: Add property listings' --body 'Provisional; see docs/lab-04/07-user-stories.md. Priority High; Effort Medium; owner Unassigned.'
```
7. Set fields from this table in the UI; all initial statuses are Backlog. Leave story owners unassigned unless team usernames and responsibilities are confirmed. Issue #2 remains assigned to Atomic-Rose.

| Story | Priority | Effort |
|---|---|---|
| US-01 | High | Medium |
| US-02 | High | Medium |
| US-03 | Medium | Medium |
| US-04 | Medium | Medium |
| US-05 | High | Small |
| US-06 | Medium | Medium |
| US-07 | High | Large |
| US-08 | High | Medium |

8. Copy the actual board URL and milestone result into the submission checklist. Confirm visibility and instructor access; keep the repository private unless authorized otherwise.
