# Engineering decisions

These notes explain choices in this solo portfolio project. They describe product
reasoning and implementation tradeoffs, not customer research or team experience.

## Keep persisted state in Convex

**Problem:** Ticket lists, filters, detail views, and job status must agree after
writes and across navigation.

**Decision:** Subscribe to Convex queries; keep unsaved input and transient UI
state in React. Filter with an index before cursor-based pagination.

**Tradeoff:** Avoids a duplicate server-data cache and manual invalidation, while
coupling saved-state behavior to Convex. Customer REST action responses still
need explicit loading. A separate store would be reconsidered for complex shared
unsaved state, not added just to demonstrate a library.

**Evidence:** `src/pages/TicketListPage.tsx`, `convex/tickets.ts`.

## Model AI work as persistent jobs

**Problem:** A long API request should not appear frozen or disappear when the
agent refreshes. Repeated clicks and late responses should not corrupt state.

**Decision:** Persist queued/running/terminal states; schedule work from a
mutation; reuse an active job; guard completion with state and input checks.

**Tradeoff:** Adds state transitions and a watchdog, but gives the frontend a
durable status source. Cancellation is logical: an in-flight external request
may continue. No exactly-once provider execution or automatic job retry is claimed.

**Evidence:** `convex/jobs.ts`, `src/components/AnalysisPanel.tsx`,
`tests/backend/jobs.test.ts`.

## Keep replies under human control

**Problem:** An AI reply can invent an account action or policy. Two agents can
also overwrite each other's revisions.

**Decision:** Validate structured output, label it as a suggestion, save reviewed
drafts separately from the suggestion, and enforce expected-revision checks.
No automatic customer messaging is implemented.

**Tradeoff:** Requires review and an explicit conflict-recovery step. A new
analysis has its own draft; old edits are not automatically merged.

**Evidence:** `shared/analysis.ts`, `convex/lib/analysisPrompt.ts`,
`src/components/ReplyDraftEditor.tsx`, `convex/jobs.ts`.

## Validate external contracts at the boundary

**Problem:** HTTP 200 and TypeScript types do not establish that remote customer
data is valid. A selected customer may disappear before submission.

**Decision:** Put HTTPS requests and runtime validation in Convex actions; check
customer existence at ticket creation; persist the external ID rather than a
second copy of the customer directory.

**Tradeoff:** Avoids stale replicated customer profiles, but lookup depends on
service availability. Remote validation and the database insert cannot be atomic.
This demo service is fictional; no collaboration with a real backend team is implied.

**Evidence:** `convex/customers.ts`, `convex/lib/customerApi.ts`,
[customer contract](customer-api.md).

## Bound requests before adding billing infrastructure

**Problem:** AI calls introduce latency, failures, and variable external costs.

**Decision:** Apply per-member daily admission limits, input/output limits,
provider timeouts, disabled SDK retries, and a single fallback provider path.

**Tradeoff:** A request limit is not a dollar cap. A fallback can create two billed
attempts, failed-attempt usage is not fully recorded, and new members increase
aggregate exposure. Workspace budgets and per-attempt accounting are future work.

**Evidence:** `convex/lib/analysisUsage.ts`, provider adapters,
[operational limits](deployment.md#ai-usage-and-cost-controls).
