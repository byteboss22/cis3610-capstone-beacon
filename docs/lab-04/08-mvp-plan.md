# Provisional Week 8 MVP plan
Purpose: propose feasible scope for discussion. Week 8 is a course milestone, not a confirmed calendar date. This document authorizes no implementation.

Effort: Small = about half to one student workday; Medium = two to three; Large = four to five. Estimates exclude discovery, integration surprises, and instructor review; team capacity is unknown.

| Feature | Category | Related stories | Effort | Proposed owner |
|---|---|---|---|---|
| Basic homepage with purpose and navigation | MVP | US-04/05 | Small | Unassigned |
| Approved property listing display | MVP | US-04 browse subset | Medium | Unassigned |
| Listing details | MVP | US-05 | Small | Unassigned |
| Listing submission and validation | MVP | US-01/02 | Medium + Medium | Unassigned |
| Basic review queue and approval | MVP | US-07 | Large | Unassigned |
| Responsive layout and accessible controls | MVP | US-08 | Medium | Unassigned |
| Editing with re-review | Post-MVP | US-03 | Medium | Unassigned |
| Property search beyond basic browse | Post-MVP | US-04 search | Medium | Unassigned |
| Sponsor advertisement submission | Requires stakeholder confirmation | US-06 | Medium | Unassigned |
| Client messaging, ad analytics, payments, external integrations | Post-MVP | No approved stories | Large each | Unassigned |
| Identity and reviewer permission mechanism | Requires stakeholder confirmation; MVP dependency | US-01/07 | Large if custom accounts | Unassigned |

The MVP deliberately contains only the browse subset of US-04; full search acceptance is post-MVP. Sponsor content may share the review model later but is not assumed to be Week 8 scope.

## Sequence and capacity
1. Before implementation: confirm concept, course stack, fields, reviewer, permission mechanism, team capacity, and evidence.
2. Build a shared content model and agree acceptance examples.
3. Implement submission/validation and approved-only browse/detail flow.
4. Add approval controls, then check mobile, keyboard, error, and publication behavior.
5. Reserve roughly 25% of available capacity for fixes and review.

Core work is approximately 12–18 student workdays before contingency and any account implementation. Re-estimate after scope and team allocation. If capacity is insufficient, negotiate scope with the instructor before promising completion.

## Proposed definition of done
Agreed high-priority scenarios pass; unapproved content is inaccessible publicly; keyboard and 320-pixel viewport checks pass; team reviews evidence and AI disclosure. No application tests have been run at this planning stage.
