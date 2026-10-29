# Customer API contract

The independent customer service represents an existing backend integration.
All records are fictional and defined in `mocks/customers.js`; this is not a real
CRM or evidence of customer-data access.

Hosted base URL: `https://supportdesk-customers.dmlob-supportdesk.workers.dev`.
Convex uses `CUSTOMER_API_BASE_URL` to select the service. The browser calls
authorized Convex actions, which make the REST requests and validate responses.

## Endpoints

All routes accept GET only. Responses use JSON and `Cache-Control: no-store`.

| Route                | Behavior                                                |
| -------------------- | ------------------------------------------------------- |
| `/health`            | HTTP 200, `{"status":"ok"}`                             |
| `/customers?q=alex`  | Case-insensitive substring search of ID, name, or email |
| `/customers/cus_001` | Return one customer or HTTP 404                         |

Search is optional, trimmed, limited to 100 characters, and returns at most 20
records. An empty search returns the available records within that limit. No
matches is HTTP 200 with `{"customers":[]}`, not an error. There is no customer
pagination contract in this demo.

Detail response:

```json
{
  "id": "cus_001",
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "plan": "pro"
}
```

Search response:

```json
{
  "customers": [
    {
      "id": "cus_001",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "plan": "pro"
    }
  ]
}
```

Convex validates IDs against `^cus_[a-zA-Z0-9_-]{1,64}$`, nonempty trimmed names,
email format, and `free | pro | enterprise` plans. Search results must be a bounded
array with no duplicate IDs. A detail response must match the requested ID.
HTTP 200 alone does not establish a valid contract.

## Errors and client behavior

Error envelope:

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found."
  }
}
```

| Status/condition             | Service meaning                                        | Convex integration behavior                                                                   |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 400                          | `INVALID_SEARCH` or `INVALID_MODE`                     | Reject the operation; do not treat as an empty result                                         |
| 404                          | `CUSTOMER_NOT_FOUND` or `ROUTE_NOT_FOUND`              | Request helper returns null; detail lookup treats it as missing, search validation rejects it |
| 405                          | `METHOD_NOT_ALLOWED`, `Allow: GET`                     | Reject the operation                                                                          |
| 503                          | `SERVICE_UNAVAILABLE`                                  | Show a recoverable service error                                                              |
| Invalid JSON/body            | Broken external contract, including malformed HTTP 200 | Reject before using data                                                                      |
| Request exceeds five seconds | Network/service timeout                                | Abort the fetch and return a retryable user-facing error                                      |

The integration does not forward arbitrary service error text to the browser.
It checks HTTPS, applies the timeout, and produces controlled Convex errors.
See `convex/lib/customerApi.ts` and `convex/customers.ts`.

## Authorization, freshness, and persistence

- `customers:search` requires approved workspace membership.
- `customers:getForTicket` first reads the ticket through an authorized query.
- Ticket creation revalidates the selected external customer before insertion.
- Only the customer ID persists on a ticket. Detail responses remain transient;
  Load/Refresh customer makes a new request instead of subscribing to remote data.
- Analysis fetches current customer context when the job runs. It sends the name
  and plan, not the separate email field, to the AI adapter.
- No linked ID means an unlinked ticket; a configured ID that disappears is an
  error for analysis. Remote existence checks and local writes are not atomic.

The Worker itself is public and unauthenticated because it serves fictional data.
Convex membership protects the app's access path, not direct access to that public
Worker. A real customer backend needs its own authentication and privacy design.

## Contract handoff expectations

For an integration with a backend owner, agree on field types, stable IDs, search
limits, missing/empty semantics, authentication, timeouts, and compatibility before
changing either side. Add representative success/error fixtures and review
breaking changes with the caller. This contract documents the demo boundary;
it does not claim a real backend team participated.

## Local execution and simulations

```bash
npm run dev:customers
# Local Node adapter: http://127.0.0.1:3001
npm run dev:worker
# Worker development through Wrangler; use the URL printed by the command
```

Both adapters share `mocks/customer-handler.js`. Convex cloud actions cannot reach
the laptop's localhost. Prefer the hosted Worker; an optional development-only
tunnel can expose the local adapter:

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

Set the generated HTTPS base URL in the intended Convex development deployment
and restore the hosted URL afterward. A temporary tunnel depends on the laptop;
the deployed Worker does not.

The optional `mode` parameter supports `success` (default), `slow` (two-second
delay), `error` (503), and `invalid` (malformed HTTP 200). Example:
`/customers/cus_001?mode=invalid`. Two seconds does not exercise the five-second
timeout by itself. `CUSTOMER_API_TEST_MODE` injects a mode from Convex for controlled
testing; remove it during normal operation. Simulations are not production API
requirements. Available IDs: `cus_001`, `cus_002`, `cus_003`.

## Verification

`tests/customer-api.test.ts` exercises shared handler contracts. CI deploys the
Worker after application validation and checks HTTP success at `/health`.
For hosted integration evidence and remaining tests, see [verification](verification.md).
