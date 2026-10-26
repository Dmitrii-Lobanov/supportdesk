# Learning Plan

## Objective

Build SupportDesk while learning to deliver a React and Convex
application with external integrations, background processing, and
production verification.

The developer implements each increment with guided instructions,
code explanations, verification steps, and independent exercises.

## Time budget

Target: 50 hours, with a 10-hour debugging buffer.

These are planning estimates, not tracked time.

| Epic                    |   Budget |
| ----------------------- | -------: |
| 1. First working slice  |  5 hours |
| 2. Ticket workflow      |  8 hours |
| 3. Authentication       |  6 hours |
| 4. REST integration     |  5 hours |
| 5. Background jobs      |  8 hours |
| 6. Claude assistance    |  7 hours |
| 7. Ship and demonstrate | 11 hours |

## Current position

Epic 3: authentication and workspace authorization are implemented.
Complete the access verification checklist before starting Epic 4.

Checked implementation items indicate code is present. They do not
replace verification.

## Epic 1 — First working slice

- [x] Create React and TypeScript application.
- [x] Configure ESLint and Prettier.
- [x] Connect a Convex development deployment.
- [x] Define the ticket schema.
- [x] Implement ticket creation and listing.
- [x] Display creation timestamps.

Verification:

- [ ] Create a ticket and confirm it survives refresh.
- [ ] Confirm live updates between two browser windows.
- [ ] Confirm server-side input validation.

## Epic 2 — Ticket workflow

- [x] Add ticket status changes.
- [x] Extract reusable ticket cards.
- [x] Add detail routes and missing-ticket handling.
- [x] Add a reusable styled select.
- [x] Separate CSS by responsibility.
- [x] Add creation priority and display badges.
- [x] Add indexed status filtering.
- [x] Separate routing, list page, and creation form.
- [x] Add cursor-based pagination.

Verification:

- [ ] Create tickets with Low, Medium, and High priority.
- [ ] Confirm older tickets display the Medium fallback.
- [ ] Confirm status changes persist and update other windows.
- [ ] Test direct detail URLs, refresh, and browser navigation.
- [ ] Test invalid IDs and unknown routes.
- [ ] Verify filtering and empty results.
- [ ] Verify Load more and filter changes.
- [ ] Check keyboard controls and narrow-screen layout.

## Epic 3 — Authentication and authorization

- [x] Connect Clerk and Convex authentication providers.
- [x] Add sign-in and account controls.
- [x] Guard ticket functions against signed-out requests.
- [x] Add workspace membership records.
- [x] Add internal member provisioning.
- [x] Require membership in all ticket functions.
- [x] Add loading and access-required screens.

Verification:

- [ ] Test sign-in and sign-out.
- [ ] Confirm the Google provider works if enabled.
- [ ] Confirm approved members can use the ticket workflow.
- [ ] Confirm signed-in nonmembers cannot access tickets.
- [ ] Confirm direct detail URLs remain protected.
- [ ] Confirm unauthenticated backend requests are rejected.
- [ ] Confirm repeated provisioning returns the existing membership.

## Epic 4 — REST integration

- [x] Define the customer data contract.
- [x] Build a separate mock customer REST service.
- [x] Add simulated delay and failure responses.
- [ ] Retrieve customer data through a Convex action.
- [ ] Validate external responses at runtime.
- [ ] Display loading, success, missing-customer, and failure states.
- [ ] Document data freshness and persistence decisions.

## Epic 5 — Background jobs

- [ ] Define a jobs table and state transitions.
- [ ] Create and schedule a job from a mutation.
- [ ] Implement simulated analysis.
- [ ] Persist progress, results, and errors.
- [ ] Display job state after navigation and refresh.
- [ ] Add bounded retries and duplicate prevention.
- [ ] Prevent stale results from replacing newer work.

## Epic 6 — Claude assistance

- [ ] Define structured summaries and draft responses.
- [ ] Replace simulated analysis with a Claude API call.
- [ ] Validate output before saving.
- [ ] Let agents review and edit drafts.
- [ ] Record model, prompt version, and usage.
- [ ] Add input limits and a usage budget.
- [ ] Verify rate-limit and provider-failure handling.
- [ ] Evaluate results with fictional support scenarios.

## Epic 7 — Ship and demonstrate

- [ ] Add meaningful authorization and workflow tests.
- [ ] Add an end-to-end test for the main workflow.
- [ ] Configure staging and production environments.
- [ ] Configure automated validation.
- [ ] Deploy and verify direct frontend routes.
- [ ] Verify authentication, integrations, and background work.
- [ ] Document troubleshooting and deployment recovery.
- [ ] Prepare a five-minute interview demonstration.

## Deferred scope

- Multiple workspaces
- Invitations and member-management UI
- Advanced roles
- Priority editing
- Attachments and email ingestion
- Comments and activity history
- Billing and knowledge-base features

## Interview practice

Be able to explain:

- Queries, mutations, and actions
- Reactive subscriptions and frontend state ownership
- Runtime validation versus TypeScript types
- Indexes and cursor-based pagination
- Authentication versus authorization
- Backend membership enforcement
- Internal versus public functions
- Safe retries and external-service side effects
- Deployment configuration and production verification

## Maintenance

At the end of each epic:

1. Run the relevant checks.
2. Mark only verified outcomes as complete.
3. Update the README and architecture if behavior changed.
4. Record important decisions without documenting every implementation detail.
