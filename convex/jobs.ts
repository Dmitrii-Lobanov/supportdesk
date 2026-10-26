import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireMember } from "./lib/auth";

export const latest = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx);

    return await ctx.db
      .query("jobs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("desc")
      .first();
  },
});

export const start = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args): Promise<Id<"jobs">> => {
    const member = await requireMember(ctx);
    const ticket = await ctx.db.get(args.ticketId);

    if (!ticket) {
      throw new ConvexError("Ticket not found.");
    }

    const latestJob = await ctx.db
      .query("jobs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("desc")
      .first();

    if (
      latestJob &&
      (latestJob.status === "queued" || latestJob.status === "running")
    ) {
      return latestJob._id;
    }

    const jobId = await ctx.db.insert("jobs", {
      ticketId: ticket._id,
      requestedBy: member.clerkUserId,
      status: "queued",
      input: {
        subject: ticket.subject,
        description: ticket.description,
      },
    });

    await ctx.scheduler.runAfter(1000, internal.jobs.begin, {
      jobId,
    });

    return jobId;
  },
});

export const begin = internalMutation({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args): Promise<null> => {
    const job = await ctx.db.get(args.jobId);

    if (!job || job.status !== "queued") {
      return null;
    }

    await ctx.db.patch(job._id, {
      status: "running",
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(15000, internal.jobs.finish, {
      jobId: job._id,
    });

    return null;
  },
});

export const finish = internalMutation({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args): Promise<null> => {
    const job = await ctx.db.get(args.jobId);

    if (!job || job.status !== "running") {
      return null;
    }

    const ticket = await ctx.db.get(job.ticketId);

    if (
      !ticket ||
      ticket.subject !== job.input.subject ||
      ticket.description !== job.input.description
    ) {
      await ctx.db.patch(job._id, {
        status: "failed",
        finishedAt: Date.now(),
        error: "Ticket content changed or the ticket was removed. Run again.",
      });

      return null;
    }

    await ctx.db.patch(job._id, {
      status: "succeeded",
      finishedAt: Date.now(),
      result:
        `Simulated analysis for "${job.input.subject}". ` +
        `Preview: ${job.input.description.slice(0, 160)}`,
    });

    return null;
  },
});
