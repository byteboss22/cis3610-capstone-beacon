---
name: Candidate requirement
about: Trace a proposed capability to evidence and acceptance scenarios
title: "REQ-XXX: "
labels: enhancement
---

## User story
As a [role], I want [capability], so that [benefit].

## Source and evidence status
Observation ID / document link:
Simulated, inferred, or verified:
Assumptions requiring confirmation:

## Planning
Priority: High / Medium / Low
Effort: Small / Medium / Large
Proposed owner: Unassigned
Milestone: Proposed, pending confirmation

## Acceptance scenarios
```gherkin
Scenario: Happy path
  Given an agreed starting state
  When the user performs the capability
  Then a specific observable result occurs

Scenario: Failure or edge case
  Given missing or invalid input
  When the user attempts the action
  Then the action is prevented and useful feedback appears
```

## Confirmation gaps
- Business:
- Technical:

## AI assistance
Tool, prompt, changes, human verification, and provenance link:
