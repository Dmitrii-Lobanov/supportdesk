# Architecture

## Overview

SupportDesk uses React for the interface, Convex for persistent data and
backend functions, and Clerk for authentication.

```text
Browser: React
  |
  | Clerk session and authentication token
  v
Convex validates identity
  |
  | Backend membership check
  v
Ticket queries and mutations
  |
  v
Convex database
  |
  | Updated query results
  v
Subscribed React components
```

The application currently supports one shared workspace.

## Frontend responsibilities

| File or component  | Responsibility                                                 |
| ------------------ | -------------------------------------------------------------- |
| `main.tsx`         | Initialize Clerk and the authenticated Convex client           |
| `App.tsx`          | Define routes and compose access boundaries                    |
| `AuthGate`         | Show sign-in, session loading, or authenticated content        |
| `WorkspaceGate`    | Show membership loading, access required, or workspace content |
| `TicketListPage`   | Manage the status filter and paginated ticket query            |
| `CreateTicketForm` | Manage draft fields and submit ticket creation                 |
| `TicketCard`       | Display a ticket and update its status                         |
| `TicketDetailPage` | Load a ticket using the ID in the URL                          |
| `Select`           | Provide a styled, reusable Radix select                        |

## State ownership

Local React state contains:

- Unsaved subject and description
- Selected creation priority
- Current status filter
- Submission and update indicators
- Recoverable mutation error messages

Convex contains:

- Saved tickets
- Workspace membership records

The frontend reads saved records through query subscriptions. It does
not maintain a second independent copy of the ticket list.

Successful creation clears the draft fields and resets the form priority
to Medium. This reset does not modify the saved ticket.

## Data model

Convex automatically adds `_id` and `_creationTime` to documents.

### tickets

| Field         | Type                                 | Purpose                          |
| ------------- | ------------------------------------ | -------------------------------- |
| `subject`     | string                               | Short description of the request |
| `description` | string                               | Request details                  |
| `status`      | `open`, `in_progress`, or `resolved` | Workflow state                   |
| `priority`    | Optional `low`, `medium`, or `high`  | Request urgency                  |

Index: `by_status`, on `status`.

Priority remains optional to support records created before the field
was introduced. New ticket creation requires a priority. The interface
displays missing priority as Medium without rewriting the record.

Creation validates trimmed subject and description lengths on the server.

### workspaceMembers

| Field         | Type   | Purpose                                  |
| ------------- | ------ | ---------------------------------------- |
| `clerkUserId` | string | Clerk user approved for workspace access |

Index: `by_clerk_user`, on `clerkUserId`.

The application uses Clerk's stable user ID rather than an email address.

The index is not a database uniqueness constraint. The provisioning
mutation checks for an existing membership before inserting one.
Membership records should be created through that function to avoid
duplicates.

## Backend functions

| Function                | Type              | Access requirement                             |
| ----------------------- | ----------------- | ---------------------------------------------- |
| `tickets:list`          | Query             | Workspace membership                           |
| `tickets:get`           | Query             | Workspace membership                           |
| `tickets:create`        | Mutation          | Workspace membership                           |
| `tickets:updateStatus`  | Mutation          | Workspace membership                           |
| `memberships:current`   | Query             | Returns the current user's membership, or null |
| `memberships:addMember` | Internal mutation | Trusted dashboard, CLI, or backend invocation  |

Queries read data. Mutations validate and change database records
transactionally.

External API calls will be introduced through actions in a later epic.

## Authentication and authorization

Clerk handles sign-in and session management.

`ConvexProviderWithClerk` supplies authentication tokens to Convex.
`auth.config.ts` configures token validation.

`requireUser` reads the validated identity and rejects signed-out
requests.

`requireMember` uses `identity.subject` to look up workspace membership
and rejects users who have not been approved.

The frontend does not supply the user ID used for these access checks.

```text
AuthGate
  -> WorkspaceGate
    -> Ticket pages
```

The gates control what appears in the interface. Backend guards enforce
access independently on every ticket function.

A signed-in user without membership can check their own membership but
cannot read or modify tickets.

## Member provisioning

The current process is manual:

1. The user signs up through Clerk.
2. A developer copies their Clerk user ID.
3. The developer runs `memberships:addMember`.
4. Convex inserts a membership record.
5. The subscribed membership query updates the interface.

The internal mutation cannot be invoked directly by a browser client.

Its user ID prefix check catches obvious input mistakes; it does not
query Clerk to verify that the user exists.

Invitations, roles, and a member-management interface are future work.

## Reactive updates

React subscribes to query results using Convex hooks.

When relevant database data changes, Convex updates the subscribed
results. React then renders the new data.

For example, changing an Open ticket to Resolved removes it from an
active Open-status result set.

No manual list refetch is needed after creation or status changes.

## Filtering and pagination

The list query uses the `by_status` index when a status is selected.

Filtering happens in the backend before pagination. Filtering only the
records already loaded into React could hide matching records on later
pages.

The backend uses `.paginate()`. The frontend uses `usePaginatedQuery`
to manage continuation cursors and combine loaded pages.

Changing the status filter resets pagination for the new arguments.

Pages remain reactive, so their sizes may change as records are added
or stop matching the query.

## Routing

| Route                | Purpose                       |
| -------------------- | ----------------------------- |
| `/`                  | Ticket list and creation form |
| `/tickets/:ticketId` | Ticket details                |
| Other paths          | Page-not-found view           |

Ticket details are queried directly by ID rather than searched for in
the currently loaded list.

The detail query normalizes the URL string into a ticket ID and returns
null for invalid or missing records.

Production hosting must serve the frontend entry point for application
routes so direct navigation and refresh work.

## Styling

- `index.css`: global defaults, color variables, focus and error styles
- `styles/layout.css`: shared page and panel structure
- Feature stylesheets: forms, filters, and pagination
- Component stylesheets: ticket cards, selects, and authentication UI
- Page stylesheets: detail-page-specific rules

Plain CSS imports remain global. Class names and scoped selectors
prevent unrelated controls from inheriting feature-specific styles.

## Environment boundaries

Vite reads frontend variables from local environment files during
development and from the frontend build environment during deployment.

Convex backend environment variables belong to the selected deployment.

Development and production must use corresponding Clerk and Convex
configuration.

## Future architecture

Planned additions:

- REST customer lookup through Convex actions
- Persistent background-job state
- Claude-generated summaries and response drafts
- Usage limits and AI cost tracking
- Automated tests and production deployment

Supporting multiple workspaces would require a workspaces table,
workspace IDs on tickets and memberships, workspace-aware indexes,
and authorization checks scoped to each ticket's workspace.
