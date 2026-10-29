# Verification and evidence

This file separates implementation, automated coverage, observed demo behavior,
and checks still needed. It is not a claim of complete production verification.

## Automated coverage in the repository

| Suite                                     | Covers                                                                                           | Does not establish                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `tests/analysis.test.ts`                  | Shared analysis schema, limits, malformed input                                                  | Live provider response quality                                  |
| `tests/customer-api.test.ts`              | Customer mock contract, search, missing records, errors, methods, query limits                   | Live network reliability or real customer-backend compatibility |
| `tests/backend/jobs.test.ts`              | Job authorization, active-job reuse, cancellation, stale input, draft conflicts, UTC quota reset | Full browser workflow or load behavior                          |
| `tests/backend/analysis-fallback.test.ts` | Adapter orchestration with mocked providers                                                      | Real Claude/Groq availability or billing                        |
| `tests/e2e/access.spec.ts`                | Signed-out root/detail access and refresh                                                        | Authenticated creation, editing, or AI workflow                 |

Run from the repository root:

```bash
npm run format:check
npm run lint
npm run test:all
npm run test:e2e
```

`test:e2e` builds the frontend before Playwright. It requires frontend configuration
matching the intended Clerk and Convex environment. Never use live provider keys
for mocked unit tests.

## Recorded evidence — October 27, 2026

[76-second hosted walkthrough](https://youtu.be/6m3Fvd7pkd4): sign-in, customer
selection, linked ticket creation, AI analysis, draft editing/saving, customer
lookup, and status change. The result shown uses Groq. A screen recording is
demonstration evidence, not an automated assertion of every persistence path.

Read-only live inspection on that date confirmed signed-out gating and the Clerk
dialog, signed-in ticket listing/details, direct ticket refresh, existing
analysis/draft display, and customer lookup returning Alex Rivera. These are dated
observations; they are not continuous monitoring or a new check on October 29.

[CI run for fdcd123, successful second attempt](https://github.com/Dmitrii-Lobanov/supportdesk/actions/runs/40569549747)
showed application validation and customer Worker deployment succeeding. It does
not prove every later commit passes. The Worker job checks HTTP success at
`/health`; it does not validate every deployed customer endpoint.

## Remaining verification checklist

Record date, commit/deployment, steps, expected result, observed result, and an
artifact or CI link for each new check. Mark a check passed only after observing it.

- [ ] Verify the saved edited draft and status after a fresh authenticated reload.
- [ ] Demonstrate live status propagation between two browser windows.
- [ ] Exercise signed-in nonmember rejection in the hosted UI.
- [ ] Verify conflict recovery between two editors in the browser.
- [ ] Check customer timeout/malformed response recovery in a controlled environment.
- [ ] Complete the cases in [AI evaluation](ai-evaluation.md), by provider.
- [ ] Check keyboard navigation, focus, labels, and narrow viewport layouts.
- [ ] Measure frontend performance before making performance claims.
- [ ] Add authenticated browser automation with isolated test data and cleanup.
- [ ] Verify a separately configured staging/production release and recovery.

Backend tests cover several corresponding invariants, but do not replace these
UI and environment checks. No completion is inferred from a feature existing.
