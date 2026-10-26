# Customer API

## Purpose

A separate mock service represents an existing customer backend.
All customer records are fictional and stored in memory.

## Endpoint

GET /customers/:customerId

Example:

GET /customers/cus_001

## Successful response

Status: 200
Content-Type: application/json

```json
{
  "id": "cus_001",
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "plan": "pro"
}
```

Fields:

- id: nonempty string
- name: nonempty string
- email: string containing the customer's email address
- plan: free, pro, or enterprise

## Error response

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found."
  }
}
```

Status codes:

- 200: customer returned
- 400: unsupported simulation mode
- 404: customer or route not found
- 405: unsupported HTTP method
- 503: simulated service failure

## Development simulation

The optional mode query parameter supports:

- success: normal response; the default
- slow: successful response after two seconds
- error: service unavailable response
- invalid: intentionally malformed customer data with HTTP 200

Example:

GET /customers/cus_001?mode=error

Simulation controls belong to the mock service, not the future
production API contract.

## Available customers

- cus_001: Alex Rivera, pro
- cus_002: Taylor Morgan, free
- cus_003: Jordan Lee, enterprise

## Integration boundary

The frontend will request customer information through a Convex action.

A Convex cloud action cannot reach the developer's localhost.
Before connecting it, the mock service will need an externally
reachable HTTPS endpoint.

The integration must validate response data at runtime rather than
assuming an HTTP 200 response contains a valid customer.

## Customer search

GET /customers?q=alex

Search matches customer ID, name, or email, ignoring case.
The query is optional and limited to 100 characters.
The mock returns at most 20 matching customers.

Successful response:

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

No matches returns HTTP 200 with an empty customers array.

The success, slow, error, and invalid simulation modes also apply
to this endpoint.

## Development connectivity

Run the mock:

```bash
npm run dev:customers
```

In another terminal, run:

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

Set CUSTOMER_API_BASE_URL in the Convex development deployment to
the generated HTTPS base URL. Update it whenever the tunnel URL changes.

The tunnel exposes fictional mock data and is for development only.
