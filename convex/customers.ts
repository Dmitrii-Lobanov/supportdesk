import { ConvexError, v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import {
  customerSchema,
  fetchCustomer,
  requestCustomerApi,
} from "./lib/customerApi";
import type { Customer } from "./lib/customerApi";

const searchResponseSchema = z.object({
  customers: z.array(customerSchema).max(20),
});

export const search = action({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args): Promise<Customer[]> => {
    const membership = await ctx.runQuery(api.memberships.current, {});

    if (!membership) {
      throw new ConvexError("Workspace access required.");
    }

    const search = args.search.trim();

    if (search.length > 100) {
      throw new ConvexError("Search must contain at most 100 characters.");
    }

    const body = await requestCustomerApi("/customers", {
      q: search,
    });

    const result = searchResponseSchema.safeParse(body);

    if (!result.success) {
      throw new ConvexError(
        "Customer service returned invalid search results.",
      );
    }

    const ids = result.data.customers.map((customer) => customer.id);

    if (new Set(ids).size !== ids.length) {
      throw new ConvexError("Customer service returned duplicate customers.");
    }

    return result.data.customers;
  },
});

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

    return await fetchCustomer(ticket.customerId);
  },
});
