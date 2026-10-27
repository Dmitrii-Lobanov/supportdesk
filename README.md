# SupportDesk

A customer support workspace built with React, TypeScript, and Convex,
featuring reactive ticket updates and background AI analysis.

**Watch the 76-second walkthrough:** customer selection → ticket creation →
AI analysis → saved reply draft → status update.

[![Watch the SupportDesk demo](https://img.youtube.com/vi/6m3Fvd7pkd4/hqdefault.jpg)](https://www.youtube.com/watch?v=6m3Fvd7pkd4)

[Live app](https://supportdesk-virid.vercel.app/) ·
[Watch demo](https://www.youtube.com/watch?v=6m3Fvd7pkd4)

The video shows the complete workflow without requiring sign-in.
Interactive workspace access requires approval.

## Demo access

Sign in with GitHub, Google, or email. Workspace access requires approval;
contact me through my GitHub profile to arrange a walkthrough.

The demo uses fictional customer data. Approved members share one workspace.
AI replies are suggestions: saving a draft does not send a message.

## Features

- Create tickets with an optional linked customer and priority.
- Update status and receive live updates.
- Filter by status and load tickets with cursor-based pagination.
- Retrieve customer details from a REST API hosted on Cloudflare Workers.
- Run background AI analysis with Claude and a Groq fallback.
- Review summaries, categories, and suggested replies.
- Save edited drafts with revision conflict protection.
- Cancel active analysis jobs and enforce daily request limits.

## How I used Convex

- **Database and indexes:** persist tickets, workspace memberships, jobs,
  drafts, and usage counters.
- **Reactive queries:** keep ticket lists and job status synchronized.
- **Mutations:** validate writes and update state atomically.
- **Actions:** call customer and AI APIs with server-side credentials.
- **Scheduler:** execute analysis jobs in the background.
- **Authorization:** validate Clerk identity and workspace membership
  before granting access.
- **Consistency:** prevent cancelled jobs or stale analysis results from
  overwriting current state.

## Architecture

React frontend on Vercel → Convex backend and database.

Clerk provides authentication. Convex calls the customer API on
Cloudflare Workers and the Claude/Groq AI providers.

Backend credentials stay in Convex environment variables.

## Local development

Requires Node.js 24, npm, and Convex and Clerk accounts.

```bash
npm ci
npx convex dev
```

Configure frontend variables using `.env.example` and follow
[deployment configuration](docs/deployment.md) for backend variables.

Start the frontend in another terminal:

```bash
npm run dev
```

For a local customer API:

```bash
npm run dev:customers
```

New users require workspace membership. In the matching Convex dashboard,
run the internal mutation `memberships:addMember`:

```json
{
  "clerkUserId": "user_replace_me"
}
```

## Verification

```bash
npm run format:check
npm run lint
npm run test:all
npm run test:e2e
```

Tests cover AI response validation, customer API behavior, backend
authorization, job cancellation, stale results, quotas, draft conflicts,
and signed-out browser access.

GitHub Actions validates the application before deploying the customer
Worker. Vercel deploys the frontend through its Git integration.

## Demo limitations

- Uses development Clerk and Convex configuration.
- One shared workspace with manually approved members.
- Customer data is simulated.
- Replies are saved as drafts; email delivery is not implemented.
- Automatic job retries and monetary budget tracking are future improvements.

## Documentation

- [Deployment](docs/deployment.md)
- [Architecture notes](docs/architecture.md)
- [Learning plan](docs/learning-plan.md)
