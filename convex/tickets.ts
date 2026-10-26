import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireMember } from "./lib/auth";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { fetchCustomer } from "./lib/customerApi";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("resolved"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);

    const status = args.status;

    if (status === undefined) {
      return await ctx.db
        .query("tickets")
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

const createArgs = {
  subject: v.string(),
  description: v.string(),
  customerId: v.optional(v.string()),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
};

export const create = action({
  args: createArgs,
  handler: async (ctx, args): Promise<Id<"tickets">> => {
    const membership = await ctx.runQuery(api.memberships.current, {});

    if (!membership) {
      throw new ConvexError("Workspace access required.");
    }

    const subject = args.subject.trim();
    const description = args.description.trim();
    const customerId = args.customerId?.trim();

    if (subject.length === 0 || subject.length > 120) {
      throw new ConvexError("Subject must contain 1–120 characters.");
    }

    if (description.length === 0 || description.length > 5000) {
      throw new ConvexError("Description must contain 1–5000 characters.");
    }

    if (customerId !== undefined) {
      if (!/^cus_[a-zA-Z0-9_-]{1,64}$/.test(customerId)) {
        throw new ConvexError("Invalid customer ID.");
      }

      const customer = await fetchCustomer(customerId);

      if (!customer) {
        throw new ConvexError(
          "The selected customer no longer exists. Choose another customer.",
        );
      }
    }

    return await ctx.runMutation(internal.tickets.insert, {
      subject,
      description,
      priority: args.priority,
      ...(customerId === undefined ? {} : { customerId }),
    });
  },
});

export const insert = internalMutation({
  args: createArgs,
  handler: async (ctx, args) => {
    await requireMember(ctx);

    return await ctx.db.insert("tickets", {
      subject: args.subject,
      description: args.description,
      status: "open",
      priority: args.priority,
      ...(args.customerId === undefined ? {} : { customerId: args.customerId }),
    });
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
    ),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);

    const ticket = await ctx.db.get(args.ticketId);

    if (!ticket) {
      throw new ConvexError("Ticket not found.");
    }

    await ctx.db.patch(args.ticketId, {
      status: args.status,
    });
  },
});

export const get = query({
  args: {
    ticketId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);

    const ticketId = ctx.db.normalizeId("tickets", args.ticketId);

    if (!ticketId) {
      return null;
    }

    return await ctx.db.get(ticketId);
  },
});
