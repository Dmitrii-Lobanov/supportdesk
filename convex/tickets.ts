import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireMember } from "./lib/auth";

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

export const create = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    customerId: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);

    const subject = args.subject.trim();
    const description = args.description.trim();

    const customerId = args.customerId.trim();

    if (!/^cus_[a-zA-Z0-9_-]{1,64}$/.test(customerId)) {
      throw new ConvexError("Enter a valid customer ID starting with cus_.");
    }

    if (subject.length === 0 || subject.length > 120) {
      throw new ConvexError("Subject must contain 1–120 characters.");
    }

    if (description.length === 0 || description.length > 5000) {
      throw new ConvexError("Description must contain 1–5000 characters.");
    }

    return await ctx.db.insert("tickets", {
      subject,
      description,
      customerId,
      status: "open",
      priority: args.priority,
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
