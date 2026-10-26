import { ConvexError } from "convex/values";
import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().regex(/^cus_[a-zA-Z0-9_-]{1,64}$/),
  name: z.string().trim().min(1),
  email: z.email(),
  plan: z.enum(["free", "pro", "enterprise"]),
});

export type Customer = z.infer<typeof customerSchema>;

export async function requestCustomerApi(
  path: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const baseUrl = process.env.CUSTOMER_API_BASE_URL;

  if (!baseUrl) {
    throw new ConvexError("Customer service is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(path, baseUrl);

    if (url.protocol !== "https:") {
      throw new ConvexError("Customer service requires HTTPS.");
    }

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const testMode = process.env.CUSTOMER_API_TEST_MODE;

    if (testMode) {
      url.searchParams.set("mode", testMode);
    }

    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error("Customer API request failed", {
        status: response.status,
        path: url.pathname,
      });

      throw new ConvexError(
        "Customer service is unavailable. Please try again.",
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ConvexError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ConvexError("Customer request timed out. Please try again.");
    }

    throw new ConvexError(
      "Could not read the customer response. Please try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCustomer(
  customerId: string,
): Promise<Customer | null> {
  const body = await requestCustomerApi(
    `/customers/${encodeURIComponent(customerId)}`,
  );

  if (body === null) {
    return null;
  }

  const result = customerSchema.safeParse(body);

  if (!result.success || result.data.id !== customerId) {
    throw new ConvexError("Customer service returned invalid customer data.");
  }

  return result.data;
}
