import { z } from "zod";

export const analysisSchema = z
  .object({
    summary: z.string().trim().min(1).max(1200),
    category: z.enum(["billing", "technical", "account", "general"]),
    draftReply: z.string().trim().min(1).max(3000),
  })
  .strict();

export type Analysis = z.infer<typeof analysisSchema>;

export const ANALYSIS_PROMPT_VERSION = "support-analysis-v1";
