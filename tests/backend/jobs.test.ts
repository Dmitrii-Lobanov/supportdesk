/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-27T12:00:00Z"));
  vi.stubEnv("ANALYSIS_DAILY_LIMIT", "1");

  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected external request during backend test.");
    }),
  );
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function setup() {
  const t = convexTest(schema, modules);

  const ticketId = await t.run(async (ctx) => {
    await ctx.db.insert("workspaceMembers", {
      clerkUserId: "user_member",
    });

    return await ctx.db.insert("tickets", {
      subject: "Cannot reset password",
      description: "The reset link has expired.",
      status: "open",
      priority: "medium",
    });
  });

  const member = t.withIdentity({ subject: "user_member" });

  return { t, member, ticketId };
}

test("rejects signed-out users and signed-in nonmembers", async () => {
  const { t, ticketId } = await setup();

  await expect(t.mutation(api.jobs.start, { ticketId })).rejects.toThrow(
    "You must sign in",
  );

  const outsider = t.withIdentity({ subject: "user_outsider" });

  await expect(outsider.mutation(api.jobs.start, { ticketId })).rejects.toThrow(
    "You do not have access",
  );

  const records = await t.run(async (ctx) => ({
    jobs: await ctx.db.query("jobs").collect(),
    usage: await ctx.db.query("analysisUsage").collect(),
  }));

  expect(records.jobs).toHaveLength(0);
  expect(records.usage).toHaveLength(0);
});

test("reuses an active job without spending another allowance", async () => {
  const { t, member, ticketId } = await setup();

  const firstId = await member.mutation(api.jobs.start, { ticketId });
  const secondId = await member.mutation(api.jobs.start, { ticketId });

  expect(secondId).toBe(firstId);

  const records = await t.run(async (ctx) => ({
    jobs: await ctx.db.query("jobs").collect(),
    usage: await ctx.db.query("analysisUsage").collect(),
  }));

  expect(records.jobs).toHaveLength(1);
  expect(records.usage).toHaveLength(1);
  expect(records.usage[0]?.requests).toBe(1);

  await member.mutation(api.jobs.cancel, { jobId: firstId });

  await expect(member.mutation(api.jobs.start, { ticketId })).rejects.toThrow(
    "daily analysis limit",
  );

  const jobs = await t.run((ctx) => ctx.db.query("jobs").collect());

  expect(jobs).toHaveLength(1);
});

test("a late result cannot overwrite cancellation", async () => {
  const { t, member, ticketId } = await setup();

  const jobId = await t.run((ctx) =>
    ctx.db.insert("jobs", {
      ticketId,
      requestedBy: "user_member",
      status: "running",
      input: {
        subject: "Cannot reset password",
        description: "The reset link has expired.",
      },
    }),
  );

  await member.mutation(api.jobs.cancel, { jobId });

  await t.mutation(internal.jobs.finish, {
    jobId,
    result: "A late provider response.",
  });

  const job = await t.run((ctx) => ctx.db.get(jobId));

  expect(job?.status).toBe("cancelled");
  expect(job?.result).toBeUndefined();
});

test("rejects a result generated from outdated ticket content", async () => {
  const { t, ticketId } = await setup();

  const jobId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("jobs", {
      ticketId,
      requestedBy: "user_member",
      status: "running",
      input: {
        subject: "Cannot reset password",
        description: "The reset link has expired.",
      },
    });

    await ctx.db.patch(ticketId, {
      description: "Password reset now works; billing is the problem.",
    });

    return id;
  });

  await t.mutation(internal.jobs.finish, {
    jobId,
    result: "An outdated password-reset summary.",
  });

  const job = await t.run((ctx) => ctx.db.get(jobId));

  expect(job?.status).toBe("failed");
  expect(job?.error).toContain("Ticket content changed");
  expect(job?.result).toBeUndefined();
});
