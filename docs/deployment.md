# Deployment and operations

## Current hosted demo

| Service            | Responsibility                                                 | Current boundary                                              |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Vercel             | React frontend                                                 | <https://supportdesk-virid.vercel.app/>                       |
| Convex             | Database, authorization, reactive functions, scheduled AI work | Development deployment shared with local development          |
| Clerk              | Authentication                                                 | Development instance; workspace membership is separate        |
| Cloudflare Workers | Fictional customer REST API                                    | <https://supportdesk-customers.dmlob-supportdesk.workers.dev> |
| Claude / Groq      | Primary and fallback AI providers                              | Called by Convex with backend credentials                     |

These hosted services run independently of a developer's laptop. Local Vite,
Node mock servers, and temporary tunnels are not needed for the hosted topology.
This is a deployed development demo; separate staging/production environments
have not been configured and verified.

## Environment configuration and secrets

Frontend build configuration must target matching Clerk and Convex environments:

| Variable                     | Location                          | Purpose                                                 |
| ---------------------------- | --------------------------------- | ------------------------------------------------------- |
| `VITE_CONVEX_URL`            | Vercel build / local `.env.local` | Browser connection to intended Convex deployment        |
| `VITE_CLERK_PUBLISHABLE_KEY` | Vercel build / local `.env.local` | Browser Clerk configuration                             |
| `CONVEX_DEPLOYMENT`          | Local CLI configuration           | Select development deployment; not a browser credential |

`VITE_` values are compiled into browser code. These two frontend values are public
configuration, not authentication secrets. Redeploy the frontend after changing
build-time values. `.env.example` contains placeholders; keep real local env files
outside Git.

Set the following on the intended Convex deployment, not in frontend variables:

| Variable                               | Purpose                                              |
| -------------------------------------- | ---------------------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN`              | Trusted issuer matching the frontend Clerk instance  |
| `CUSTOMER_API_BASE_URL`                | HTTPS base URL of the customer service               |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Claude credentials and model                         |
| `GROQ_API_KEY`, `GROQ_MODEL`           | Fallback credentials and model                       |
| `ANALYSIS_DAILY_LIMIT`                 | Per-member new-job allowance per UTC day; default 20 |

API keys are secrets. Never put them in `VITE_` variables, committed examples,
screenshots, or logs. Remove `CUSTOMER_API_TEST_MODE` for normal operation.
GitHub Actions uses repository variables for frontend configuration and secrets
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` for Worker deployment. The account ID
is an identifier, not a credential, although this workflow stores it as a secret.
Scope the token to the intended account and required deployment permissions.

## Authentication and reviewer access

Clerk handles sign-in; Convex membership controls workspace access. After a user
signs up, provision their stable Clerk user ID with the internal
`memberships:addMember` mutation in the matching deployment. All approved members
share the same tickets and permissions. Do not publish reusable login credentials.

A separate Convex database begins without demo tickets, memberships, jobs, or usage
records. Before a real environment split, configure the intended Clerk instance,
its accepted frontend domain, matching token issuer, backend keys, customer URL,
and explicit member provisioning; verify isolation before routing users there.

## Release flow

```bash
npm ci
npm run format:check
npm run lint
npm run test:all
npm run test:e2e
```

`test:e2e` builds the frontend. For local backend development, `npx convex dev`
syncs with the development deployment; it is not evidence of a production release.
For an intentional Convex production release, configure the target environment
and run `npx convex deploy`, reviewing its target before confirming.

GitHub Actions (`.github/workflows/ci.yml`) checks configuration, formatting,
lint, contract/backend tests, build, and signed-out Playwright smoke tests.
Only a successful push validation on `main` proceeds to customer Worker deployment
and an HTTP health check. Manual Worker deployment is `npm run deploy:customers`.

Vercel's Git integration deploys the frontend independently. The workflow does
not gate Vercel deployment or deploy Convex. Do not describe the current pipeline
as one atomic release of all three services. `vercel.json` rewrites frontend routes
to `index.html`; verify a ticket URL directly and after refresh.

## AI usage and cost controls

- Job admission atomically reserves one allowance per member per UTC day. Active
  duplicate starts reuse the job without another reservation. Failed/cancelled
  jobs retain their allowance; `0` blocks new jobs, rather than disabling limits.
- Analysis input caps are 300 subject / 12,000 description characters; new-ticket
  validation is stricter at 120 / 5,000. Output validation caps summary/draft length.
- Claude uses a 1,600-token output cap; Groq uses a 3,000 completion-token cap.
  Both SDKs have 20-second timeouts and automatic retries disabled.
- Claude failure invokes Groq once through the application fallback. This can
  produce two billed attempts for one admitted job.
- A two-minute running-job watchdog prevents indefinitely running UI state.
  Cancellation rejects late results but may not stop an in-flight billed request.
- Stored usage describes successful analysis, not a complete ledger of all failed
  provider attempts. Model metadata does not establish dollar cost by itself.

These controls bound requests, not total spend. There is no workspace monetary
budget or automatic cost cutoff. Check provider usage/billing dashboards, use
provider-side spending controls where available, and set conservative admission
limits. Complete per-attempt usage accounting and a workspace budget are future work.

## Troubleshooting and recovery

| Symptom                              | Checks and recovery                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in fails or member loses access | Confirm matching Clerk key/issuer and intended Convex deployment; verify member provisioning without bypassing guards                       |
| Customer lookup fails                | Check Worker health and a customer endpoint; verify the exact base URL, HTTPS, and absence of simulation mode; retry after service recovery |
| AI job fails                         | Check Convex job error/logs, both providers' configuration, credits and model support; restore service then manually rerun                  |
| Job appears running too long         | Inspect persisted state and watchdog; cancel if appropriate; avoid repeatedly issuing provider calls                                        |
| Draft conflict                       | Copy unsaved edits, load the latest saved draft, reconcile, then save                                                                       |
| Ticket refresh returns hosting 404   | Verify the frontend rewrite and redeploy the correct revision                                                                               |

To recover a broken frontend, redeploy a known-good Vercel deployment/revision.
For a broken Worker, redeploy a known-good source revision through validation or
the manual deployment command. For Convex, review schema compatibility before
deploying known-good code: code rollback does not undo database writes or safely
reverse every schema change. Restore configuration separately if it changed.
Capture the affected deployment, timestamp, error, recovery action, and outcome.
These are recovery procedures to exercise, not completed rollback drills.

## Release evidence

Use [verification](verification.md) for dated observations, test boundaries, and
the remaining release checklist. Check authenticated access, customer integration,
AI completion, draft/status persistence, direct routes, and both-window updates
after a material deployment. Record measured results rather than assuming that a
successful build establishes production behavior.
