# Candidate user stories
Purpose: specify provisional capabilities and acceptance checks. All priorities, estimates, fields, and scenarios require human confirmation. No scenario has been executed against an application. Proposed owner for every story: **Unassigned**.

Effort definitions and scope are in [the MVP plan](08-mvp-plan.md). Administrators and property visitors are inferred roles, not additional interviewed personas.

## US-01 — add property listings
- User persona: Residential Listing Agent
- User story: As a Residential Listing Agent, I want to add property listings, so that I can prepare accurate information for publication.
- Priority: High
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-002; OBS-01/02 (AI inference)
- Assumptions requiring confirmation: address, price, description are proposed required fields.

```gherkin
Scenario: A - Happy Path
  Given a listing with address, positive numeric price, and description
  When I submit it
  Then one listing enters Pending Review and remains unpublished

Scenario: B - Failure or Edge Case
  Given a listing missing its address
  When I submit it
  Then an address-required message appears, input remains, and no review item is created
```

## US-02 — receive validation messages for missing or invalid required property information
- User persona: Residential Listing Agent
- User story: As a Residential Listing Agent, I want to receive validation messages for missing or invalid required property information, so that I can correct errors before submitting a listing.
- Priority: High
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-001; OBS-01/02 (simulated support)
- Assumptions requiring confirmation: price must be a positive number; currency and bounds unconfirmed.

```gherkin
Scenario: A - Happy Path
  Given all proposed required fields and a positive numeric price are present
  When I submit the listing
  Then validation succeeds and one unpublished Pending Review item is created

Scenario: B - Failure or Edge Case
  Given the listing price is blank
  When I submit the listing
  Then a price-required message appears beside price and submission is prevented without losing input
```

## US-03 — edit existing listings
- User persona: Residential Listing Agent
- User story: As a Residential Listing Agent, I want to edit existing listings, so that I can keep property information current.
- Priority: Medium
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-002; OBS-01/02 (AI inference)
- Assumptions requiring confirmation: editing permission and re-review rules unconfirmed.

## US-04 — search available properties
- User persona: Property visitor (candidate secondary user)
- User story: As a Property visitor (candidate secondary user), I want to search available properties, so that I can find listings relevant to my needs.
- Priority: Medium
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-007; OBS-01/02 (AI inference)
- Assumptions requiring confirmation: audience and search criteria unconfirmed; only browse subset in MVP.

## US-05 — view detailed property information
- User persona: Property visitor (candidate secondary user)
- User story: As a Property visitor (candidate secondary user), I want to view detailed property information, so that I can assess whether a property meets my needs.
- Priority: High
- Estimated effort: Small
- Proposed owner: Unassigned
- Source: REQ-005; OBS-01/02 (AI inference)
- Assumptions requiring confirmation: public fields and visitor audience unconfirmed.

```gherkin
Scenario: A - Happy Path
  Given an approved listing with agreed public fields exists
  When I open its detail page
  Then its address, price, and description are displayed

Scenario: B - Failure or Edge Case
  Given a listing is Pending Review or Rejected
  When I request its direct detail URL
  Then no listing content is exposed and an unavailable message is shown
```

## US-06 — submit sponsor advertisements
- User persona: Local Business Sponsor
- User story: As a Local Business Sponsor, I want to submit sponsor advertisements, so that I can promote permitted services to nearby customers.
- Priority: Medium
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-003; OBS-03/04 (simulated support; reach is inference)
- Assumptions requiring confirmation: permitted claims, contact fields, assets, and MVP inclusion unconfirmed.

## US-07 — review and approve submitted content
- User persona: Authorized administrator (candidate reviewer role)
- User story: As a Authorized administrator (candidate reviewer role), I want to review and approve submitted content, so that I can publish content that meets agreed requirements.
- Priority: High
- Estimated effort: Large
- Proposed owner: Unassigned
- Source: REQ-004; OBS-04 (simulated support; role is inference)
- Assumptions requiring confirmation: reviewer identity, authorization mechanism, and policy unconfirmed.

```gherkin
Scenario: A - Happy Path
  Given I am an authorized reviewer and a valid listing or sponsor item is Pending Review
  When I approve the item
  Then it becomes Approved and publicly visible, with reviewer and decision recorded

Scenario: B - Failure or Edge Case
  Given I lack reviewer permission and an item is Pending Review
  When I attempt to approve it
  Then the action is denied, the item stays Pending Review, and it remains unpublished
```

## US-08 — access the platform on mobile devices
- User persona: Listing agent or Local Business Sponsor
- User story: As a Listing agent or Local Business Sponsor, I want to access the platform on mobile devices, so that I can complete content tasks while using a phone.
- Priority: High
- Estimated effort: Medium
- Proposed owner: Unassigned
- Source: REQ-006; OBS-01 through OBS-04 (AI inference; requested candidate)
- Assumptions requiring confirmation: 320-pixel viewport and keyboard checks are proposed; actual access needs unknown.

```gherkin
Scenario: A - Happy Path
  Given a supported browser viewport is 320 CSS pixels wide
  When I open the agreed submission form
  Then labels, inputs, and submit controls fit without horizontal page scrolling

Scenario: B - Failure or Edge Case
  Given a required field is blank at a 320 CSS pixel viewport
  When I submit using a keyboard
  Then a visible field-associated error appears, focus reaches the error summary, and input is retained
```
