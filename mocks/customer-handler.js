import { customers } from "./customers.js";

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function error(status, code, message) {
  return json({ error: { code, message } }, status);
}

export async function handleCustomerRequest(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return json(
      {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Use GET.",
        },
      },
      405,
      { Allow: "GET" },
    );
  }

  if (url.pathname === "/health") {
    return json({ status: "ok" });
  }

  const isSearch = url.pathname === "/customers";
  const match = /^\/customers\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);

  if (!isSearch && !match) {
    return error(404, "ROUTE_NOT_FOUND", "Route not found.");
  }

  const mode = url.searchParams.get("mode") ?? "success";

  if (!["success", "slow", "error", "invalid"].includes(mode)) {
    return error(400, "INVALID_MODE", "Unsupported simulation mode.");
  }

  if (mode === "error") {
    return error(
      503,
      "SERVICE_UNAVAILABLE",
      "Customer service is temporarily unavailable.",
    );
  }

  let body;

  if (isSearch) {
    const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    if (search.length > 100) {
      return error(400, "INVALID_SEARCH", "Search is too long.");
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
      return error(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
    }

    body = customer;
  }

  if (mode === "invalid") {
    body = isSearch
      ? { customers: [{ id: "cus_001", name: 123 }] }
      : { id: match[1], name: 123, plan: "unknown" };
  }

  if (mode === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return json(body);
}
