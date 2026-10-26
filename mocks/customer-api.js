import { createServer } from "node:http";

const customers = new Map([
  [
    "cus_001",
    {
      id: "cus_001",
      name: "Alex Rivera",
      email: "alex@example.com",
      plan: "pro",
    },
  ],
  [
    "cus_002",
    {
      id: "cus_002",
      name: "Taylor Morgan",
      email: "taylor@example.com",
      plan: "free",
    },
  ],
  [
    "cus_003",
    {
      id: "cus_003",
      name: "Jordan Lee",
      email: "jordan@example.com",
      plan: "enterprise",
    },
  ],
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message) {
  sendJson(response, status, {
    error: { code, message },
  });
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost:3001");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendError(response, 405, "METHOD_NOT_ALLOWED", "Use GET.");
    return;
  }

  const isSearch = url.pathname === "/customers";
  const match = /^\/customers\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);

  if (!isSearch && !match) {
    sendError(response, 404, "ROUTE_NOT_FOUND", "Route not found.");
    return;
  }

  const mode = url.searchParams.get("mode") ?? "success";

  if (!["success", "slow", "error", "invalid"].includes(mode)) {
    sendError(response, 400, "INVALID_MODE", "Unsupported simulation mode.");
    return;
  }

  if (mode === "error") {
    sendError(
      response,
      503,
      "SERVICE_UNAVAILABLE",
      "Customer service is temporarily unavailable.",
    );
    return;
  }

  let body;

  if (isSearch) {
    const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    if (search.length > 100) {
      sendError(response, 400, "INVALID_SEARCH", "Search is too long.");
      return;
    }

    const matches = [...customers.values()].filter((customer) =>
      [customer.id, customer.name, customer.email].some((value) =>
        value.toLowerCase().includes(search),
      ),
    );

    body = { customers: matches.slice(0, 20) };
  } else {
    const customer = customers.get(match[1]);

    if (!customer) {
      sendError(response, 404, "CUSTOMER_NOT_FOUND", "Customer not found.");
      return;
    }

    body = customer;
  }

  if (mode === "invalid") {
    body = isSearch
      ? { customers: [{ id: "cus_001", name: 123 }] }
      : { id: match[1], name: 123, plan: "unknown" };
  }

  if (mode === "slow") {
    setTimeout(() => {
      if (!response.destroyed) {
        sendJson(response, 200, body);
      }
    }, 2000);
    return;
  }

  sendJson(response, 200, body);
});

server.listen(3001, "127.0.0.1", () => {
  console.log("Customer API running at http://127.0.0.1:3001");
});
