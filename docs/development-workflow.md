# Development workflow

SupportDesk was developed as a guided, incremental learning project. The developer
implemented changes with AI-assisted explanations, review, debugging, and checks.
This describes the actual workflow; integrating the Claude API is separate from
using Claude Code as a development tool.

## Small, reviewable increments

The project progressed through tickets and reactive reads, authentication and
membership, REST customer contracts, persistent jobs, structured AI output,
reviewed drafts, quotas, tests, and hosting. Changes were validated and committed
as separate increments rather than delivered as one generated application.

Git history is the evidence for scope and sequence. The learning-plan hour budget
was an estimate, not recorded delivery time or a measured productivity result.

## Concrete AI-assisted example: provider fallback

**Problem:** Claude requests failed during development, including insufficient
provider credit. The user-facing analysis flow needed a recoverable outcome.

**AI assistance:** Codex helped reason through a Groq fallback and the structured
response contract. The developer implemented and exercised the integration.

**Review responsibility:** Keep validation before either request; preserve the
same output contract; check completion reasons; record which provider actually
succeeded; expose a useful failure when both providers fail.

**Validation evidence:** `tests/backend/analysis-fallback.test.ts` covers primary
success, primary failure with fallback, both failing, and oversized input rejected
before calls. These tests mock provider adapters. `tests/analysis.test.ts` checks
the shared output schema. The recorded walkthrough shows a hosted Groq result.

**Limits:** This does not establish Claude output quality, a completed adversarial
evaluation, or active Claude Code usage. Codex assisted this project; Claude Code
experience should be documented only after actually using it.

## Review loop

1. Define the user-visible outcome and data/API contract.
2. Ask the assistant for a focused change or explanation.
3. Inspect types, authorization, error paths, and external side effects.
4. Run relevant tests and manually inspect the affected UI.
5. Record what was observed, what remains uncertain, and the next small step.

AI suggestions are not proof of correctness. Contract tests, backend tests,
browser checks, and live observations provide different kinds of evidence.
See [verification](verification.md) for their current boundaries.

## Communication and handoff

For a team handoff, use: outcome delivered; API/data-contract changes; validation
performed; blocker or risk; next action and owner. Share sample payloads and error
semantics before integrating against another developer's endpoint.

This is the proposed collaboration pattern, not a claim that this solo project
included customer interviews, daily standups, or a production backend team.
