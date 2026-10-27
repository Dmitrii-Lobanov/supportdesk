import { ConvexError, v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { requireMember } from "./lib/auth";
import { fetchCustomer } from "./lib/customerApi";
import { analyzeTicket } from "./lib/analyzeTicket";
import { analysisRecordValidator } from "./lib/analysisValidators";

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
        ...(ticket.customerId ? { customerId: ticket.customerId } : {}),
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

    await ctx.scheduler.runAfter(0, internal.jobs.run, {
      jobId: job._id,
    });

    // If the worker stops unexpectedly, don't leave the job running forever.
    await ctx.scheduler.runAfter(120_000, internal.jobs.fail, {
      jobId: job._id,
      error: "Processing timed out. Please run the analysis again.",
    });

    return null;
  },
});

export const getRunning = internalQuery({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args): Promise<Doc<"jobs"> | null> => {
    const job = await ctx.db.get(args.jobId);

    return job?.status === "running" ? job : null;
  },
});

export const run = internalAction({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args): Promise<null> => {
    const job = await ctx.runQuery(internal.jobs.getRunning, {
      jobId: args.jobId,
    });

    if (!job) {
      return null;
    }

    try {
      const customer = job.input.customerId
        ? await fetchCustomer(job.input.customerId)
        : null;

      if (job.input.customerId && !customer) {
        throw new ConvexError("The linked customer no longer exists.");
      }

      // Cancellation may have happened during the customer request.
      const activeJob = await ctx.runQuery(internal.jobs.getRunning, {
        jobId: job._id,
      });

      if (!activeJob) {
        return null;
      }

      const analysis = await analyzeTicket({
        subject: job.input.subject,
        description: job.input.description,
        customer: customer
          ? {
              name: customer.name,
              plan: customer.plan,
            }
          : null,
      });

      await ctx.runMutation(internal.jobs.finish, {
        jobId: job._id,
        result: analysis.summary,
        analysis,
      });
    } catch (error) {
      console.error("Ticket analysis failed", {
        jobId: job._id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await ctx.runMutation(internal.jobs.fail, {
        jobId: job._id,
        error:
          error instanceof ConvexError && typeof error.data === "string"
            ? error.data
            : "Analysis failed. Please try again.",
      });
    }

    return null;
  },
});

export const finish = internalMutation({
  args: {
    jobId: v.id("jobs"),
    result: v.string(),
    analysis: v.optional(analysisRecordValidator),
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
      ticket.description !== job.input.description ||
      ticket.customerId !== job.input.customerId
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
      result: args.result,
      analysis: args.analysis,
    });

    return null;
  },
});

export const fail = internalMutation({
  args: {
    jobId: v.id("jobs"),
    error: v.string(),
  },
  handler: async (ctx, args): Promise<null> => {
    const job = await ctx.db.get(args.jobId);

    if (!job || job.status !== "running") {
      return null;
    }

    await ctx.db.patch(job._id, {
      status: "failed",
      finishedAt: Date.now(),
      error: args.error,
    });

    return null;
  },
});

export const cancel = mutation({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args): Promise<null> => {
    await requireMember(ctx);

    const job = await ctx.db.get(args.jobId);

    if (!job) {
      throw new ConvexError("Job not found.");
    }

    if (job.status !== "queued" && job.status !== "running") {
      return null;
    }

    await ctx.db.patch(job._id, {
      status: "cancelled",
      finishedAt: Date.now(),
    });

    return null;
  },
});

export const saveDraft = mutation({
  args: {
    jobId: v.id("jobs"),
    text: v.string(),
    expectedRevision: v.number(),
  },
  handler: async (ctx, args): Promise<number> => {
    const member = await requireMember(ctx);
    const job = await ctx.db.get(args.jobId);

    if (!job || job.status !== "succeeded" || !job.analysis) {
      throw new ConvexError("This analysis has no editable draft.");
    }

    const text = args.text.trim();

    if (!text || text.length > 3000) {
      throw new ConvexError("Drafts must contain 1–3,000 characters.");
    }

    const revision = job.draftRevision ?? 0;

    if (args.expectedRevision !== revision) {
      throw new ConvexError(
        "Another member updated this draft. Copy your edits, then load the latest saved draft.",
      );
    }

    const nextRevision = revision + 1;

    await ctx.db.patch(job._id, {
      reviewedDraft: text,
      draftRevision: nextRevision,
      draftUpdatedAt: Date.now(),
      draftUpdatedBy: member.clerkUserId,
    });

    return nextRevision;
  },
});
