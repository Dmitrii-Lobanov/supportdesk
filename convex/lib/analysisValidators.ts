import { v } from "convex/values";

export const analysisRecordValidator = v.object({
  summary: v.string(),
  category: v.union(
    v.literal("billing"),
    v.literal("technical"),
    v.literal("account"),
    v.literal("general"),
  ),
  draftReply: v.string(),
  provider: v.optional(v.union(v.literal("anthropic"), v.literal("groq"))),
  model: v.string(),
  promptVersion: v.string(),
  inputTokens: v.number(),
  outputTokens: v.number(),
});
