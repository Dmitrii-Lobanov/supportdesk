import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireMember(ctx: QueryCtx | MutationCtx) {
  const identity = await requireUser(ctx);

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!membership) {
    throw new ConvexError("You do not have access to this workspace.");
  }

  return membership;
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must sign in to access tickets.");
  }

  return identity;
}
