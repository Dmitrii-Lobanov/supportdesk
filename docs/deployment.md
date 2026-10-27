# Deployment

## Environment boundaries

The frontend and Convex backend must use matching environments.

| Frontend variable          | Value                                          |
| -------------------------- | ---------------------------------------------- |
| VITE_CONVEX_URL            | URL of the intended Convex deployment          |
| VITE_CLERK_PUBLISHABLE_KEY | Publishable key of the intended Clerk instance |

Configure these backend variables in the matching Convex deployment:

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| CLERK_JWT_ISSUER_DOMAIN | Trusted Clerk token issuer                       |
| CUSTOMER_API_BASE_URL   | Public HTTPS customer service URL                |
| ANTHROPIC_API_KEY       | Claude API credentials                           |
| ANTHROPIC_MODEL         | Claude model identifier                          |
| GROQ_API_KEY            | Groq fallback credentials                        |
| GROQ_MODEL              | Groq model identifier                            |
| ANALYSIS_DAILY_LIMIT    | New analysis jobs allowed per member per UTC day |

Do not prefix backend secrets with VITE_.

CUSTOMER_API_TEST_MODE should be absent during normal operation.

## Customer service availability

The local mock service and temporary development tunnel depend on a
developer's computer remaining online.

A persistent hosted demo needs a customer service available independently
of that computer. Keep its fictional customer IDs consistent with the
tickets used in the demo.

## Authentication and membership

Configure Clerk for the deployed frontend URL.

The frontend publishable key and Convex JWT issuer must refer to the
same Clerk instance.

A separate Convex production database starts without development tickets,
jobs, usage records, or workspace memberships.

After signing in, provision the intended Clerk user through the internal
memberships:addMember mutation in the matching deployment.

## Browser routing

The host must serve index.html for frontend routes such as
/tickets/:ticketId.

Verify direct navigation and refreshing a ticket URL after deployment.

## Release verification

- Sign in and confirm approved workspace access.
- Confirm a signed-in nonmember cannot access workspace data.
- Create a ticket and refresh.
- Open a ticket URL directly in a new tab.
- Update status and verify another window updates.
- Load a linked customer.
- Generate an analysis and verify persisted output.
- Edit and save a reply draft.
- Verify stale draft edits cannot overwrite a newer save.
- Confirm provider failures produce a recoverable error.
- Confirm backend secrets are absent from frontend configuration.
