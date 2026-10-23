import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
  },
});

export const addMember = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = args.clerkUserId.trim();

    if (!clerkUserId.startsWith("user_")) {
      throw new ConvexError("Enter a Clerk user ID starting with user_.");
    }

    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("workspaceMembers", {
      clerkUserId,
    });
  },
});
