import { createServer } from "node:http";
import { handleCustomerRequest } from "./customer-handler.js";

const server = createServer(async (request, response) => {
  try {
    const webRequest = new Request(
      new URL(request.url ?? "/", "http://localhost:3001"),
      { method: request.method ?? "GET" },
    );

    const result = await handleCustomerRequest(webRequest);
    const body = Buffer.from(await result.arrayBuffer());

    if (response.destroyed) return;

    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(body);
  } catch (error) {
    console.error("Customer API request failed", error);

    if (!response.destroyed && !response.headersSent) {
      response.writeHead(500, {
        "Content-Type": "application/json",
      });
      response.end(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "Customer request failed.",
          },
        }),
      );
    }
  }
});

server.listen(3001, "127.0.0.1", () => {
  console.log("Customer API running at http://127.0.0.1:3001");
});
