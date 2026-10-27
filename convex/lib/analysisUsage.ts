import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";

export async function reserveAnalysisRequest(
  ctx: MutationCtx,
  clerkUserId: string,
): Promise<void> {
  const limit = Number(process.env.ANALYSIS_DAILY_LIMIT ?? "20");

  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new ConvexError("Analysis usage limit is misconfigured.");
  }

  const day = new Date(Date.now()).toISOString().slice(0, 10);

  const usage = await ctx.db
    .query("analysisUsage")
    .withIndex("by_member_day", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("day", day),
    )
    .unique();

  if ((usage?.requests ?? 0) >= limit) {
    throw new ConvexError(
      "Your daily analysis limit has been reached. It resets at 00:00 UTC.",
    );
  }

  if (usage) {
    await ctx.db.patch(usage._id, {
      requests: usage.requests + 1,
    });
  } else {
    await ctx.db.insert("analysisUsage", {
      clerkUserId,
      day,
      requests: 1,
    });
  }
}
