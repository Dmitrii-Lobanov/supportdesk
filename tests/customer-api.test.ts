import test from "node:test";
import assert from "node:assert/strict";
import { handleCustomerRequest } from "../mocks/customer-handler.js";

function request(path: string, method = "GET") {
  return handleCustomerRequest(
    new Request(`https://customers.example${path}`, { method }),
  );
}

test("returns the linked customer with the expected contract", async () => {
  const response = await request("/customers/cus_001");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), {
    id: "cus_001",
    name: "Alex Rivera",
    email: "alex@example.com",
    plan: "pro",
  });
});

test("searches email case-insensitively and returns matching customers only", async () => {
  const response = await request("/customers?q=ALEX%40EXAMPLE.COM");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.customers.map((customer: { id: string }) => customer.id),
    ["cus_001"],
  );
});

test("returns an empty list for a search with no matches", async () => {
  const response = await request("/customers?q=does-not-exist");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { customers: [] });
});

test("distinguishes a missing customer from a service failure", async () => {
  const missing = await request("/customers/cus_missing");
  const unavailable = await request("/customers/cus_001?mode=error");

  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, "CUSTOMER_NOT_FOUND");

  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error.code, "SERVICE_UNAVAILABLE");
});

test("rejects unsupported methods", async () => {
  const response = await request("/customers/cus_001", "POST");

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("rejects oversized search input", async () => {
  const response = await request(`/customers?q=${"a".repeat(101)}`);

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_SEARCH");
});
