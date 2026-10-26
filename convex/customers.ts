import { ConvexError, v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const customerSchema = z.object({
  id: z.string().regex(/^cus_[a-zA-Z0-9_-]{1,64}$/),
  name: z.string().trim().min(1),
  email: z.email(),
  plan: z.enum(["free", "pro", "enterprise"]),
});

type Customer = z.infer<typeof customerSchema>;

export const getForTicket = action({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args): Promise<Customer | null> => {
    const ticket = await ctx.runQuery(api.tickets.get, {
      ticketId: args.ticketId,
    });

    if (!ticket) {
      throw new ConvexError("Ticket not found.");
    }

    if (!ticket.customerId) {
      return null;
    }

    const baseUrl = process.env.CUSTOMER_API_BASE_URL;

    if (!baseUrl) {
      throw new ConvexError("Customer service is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const url = new URL(
        `/customers/${encodeURIComponent(ticket.customerId)}`,
        baseUrl,
      );

      if (url.protocol !== "https:") {
        throw new ConvexError("Customer service requires an HTTPS URL.");
      }

      const testMode = process.env.CUSTOMER_API_TEST_MODE;

      if (testMode) {
        url.searchParams.set("mode", testMode);
      }

      const response = await fetch(url, {
        signal: controller.signal,
      });

      console.log("Customer API response", {
        url: url.toString(),
        status: response.status,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        console.error("Customer API failure", {
          status: response.status,
          body: (await response.text()).slice(0, 1000),
        });

        throw new ConvexError(
          "Customer service is unavailable. Please try again.",
        );
      }

      const body: unknown = await response.json();
      const result = customerSchema.safeParse(body);

      if (!result.success || result.data.id !== ticket.customerId) {
        throw new ConvexError(
          "Customer service returned invalid customer data.",
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new ConvexError("Customer lookup timed out. Please try again.");
      }

      throw new ConvexError(
        "Could not read the customer response. Please try again.",
      );
    } finally {
      clearTimeout(timeout);
    }
  },
});
