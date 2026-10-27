import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tickets: defineTable({
    subject: v.string(),
    description: v.string(),
    customerId: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
  }).index("by_status", ["status"]),
  workspaceMembers: defineTable({
    clerkUserId: v.string(),
  }).index("by_clerk_user", ["clerkUserId"]),
  jobs: defineTable({
    ticketId: v.id("tickets"),
    requestedBy: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    input: v.object({
      subject: v.string(),
      description: v.string(),
      customerId: v.optional(v.string()),
    }),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_ticket", ["ticketId"]),
});
