# Learning plan and delivery status

## Objective

Build and explain a React/TypeScript support workspace with Convex reactive data,
REST integration, background AI jobs, tests, and independent hosted services.
The developer implemented incremental changes with AI-assisted guidance and review.
See [development workflow](development-workflow.md) for the process and its limits.

The original target was 50 hours plus a 10-hour debugging buffer. These were
planning estimates, not tracked hours or measured delivery speed.

## Current position

The portfolio demo is implemented, deployed, and recorded. Documentation now
reflects the completed application. Feature implementation, automated coverage,
manual observation, and remaining verification are tracked separately; the full
verification matrix is in [verification](verification.md).

| Increment        | Implemented                                                                                                                         | Remaining work / evidence limits                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Foundation       | React/TypeScript, formatting/lint, Convex schema and generated client                                                               | No measured performance baseline                                                |
| Ticket workflow  | Creation, status, detail routes, priority, indexed filters, reactive pagination, reusable selects/cards                             | More keyboard, responsive, and edge-case UI verification                        |
| Access           | Clerk, backend membership checks, internal provisioning, access gates                                                               | One workspace, manual approval, no role hierarchy                               |
| REST integration | Shared Node/Worker mock, customer search/selection/details, Convex actions, runtime validation, timeouts                            | Fictional backend; controlled network-error checks remain                       |
| Background jobs  | Snapshot, persistent states, scheduler, watchdog, active-job reuse, cancellation, stale-result rejection                            | Automatic bounded retries; cancellation does not guarantee stopping billing     |
| AI assistance    | Claude adapter, Groq fallback, strict output contract, metadata, editable revision-protected drafts, daily admission quota          | Monetary budgets, complete failed-attempt usage, completed provider evaluations |
| Delivery         | Vercel frontend, hosted Worker, CI validation before Worker deploy, backend/contract tests, signed-out browser tests, recorded demo | Separate staging/production, authenticated browser E2E, recovery drill          |

## Next priorities

1. Complete and record the remaining hosted/manual checks without marking unrun
   cases passed. Start with saved-draft/status reload and two-window reactivity.
2. Run the fictional scenarios in [AI evaluation](ai-evaluation.md), identifying
   the provider/model and prompt version for each result.
3. Add authenticated E2E with isolated data and a controlled test environment.
4. Separate staging and production before claiming production-environment ownership.
5. Add idempotency-aware bounded retries, per-attempt accounting, and a monetary
   budget when expanding beyond the current demo.

## Interview discussion

Be able to explain:

- Why queries, mutations, and actions have different responsibilities.
- How subscriptions change frontend state ownership and cache invalidation.
- Why filtering must precede pagination and why indexes matter.
- What runtime validation adds beyond TypeScript.
- Authentication versus authorization and public versus internal functions.
- Why remote customer validation and ticket insertion are not cross-service atomic.
- Job-state invariants, late responses, cancellation limits, and safe retries.
- Expected-revision checks and preservation of unsaved user edits.
- Fallback costs, request quotas versus monetary budgets, and evaluation limits.
- What CI checks prove, which deployments it gates, and what manual checks remain.

## Deferred product scope

Multiple workspaces, invitations/roles, priority editing, attachments, email
ingestion/delivery, comments/activity history, billing, and knowledge-base features.
The project demonstrates technical decisions; it does not by itself establish
professional tenure, customer-facing experience, or use of a particular AI editor.
