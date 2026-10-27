import Groq from "groq-sdk";
import { ConvexError } from "convex/values";
import { analysisSchema, ANALYSIS_PROMPT_VERSION } from "../../shared/analysis";
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisInput } from "./analysisPrompt";

type AnalysisInput = Parameters<typeof buildAnalysisInput>[0];

export async function analyzeWithGroq(input: AnalysisInput) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey || !model) {
    throw new ConvexError("Groq fallback is not configured.");
  }

  const client = new Groq({
    apiKey,
    maxRetries: 0,
    timeout: 20_000,
  });

  const response = await client.chat.completions.create({
    model,
    max_completion_tokens: 3000,
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content: ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildAnalysisInput(input),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ticket_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            category: {
              type: "string",
              enum: ["billing", "technical", "account", "general"],
            },
            draftReply: { type: "string" },
          },
          required: ["summary", "category", "draftReply"],
          additionalProperties: false,
        },
      },
    },
  });

  const choice = response.choices[0];

  if (choice?.finish_reason !== "stop" || !choice.message.content) {
    throw new ConvexError("Groq analysis did not complete.");
  }

  let body: unknown;

  try {
    body = JSON.parse(choice.message.content);
  } catch {
    throw new ConvexError("Groq returned an unreadable analysis.");
  }

  const parsed = analysisSchema.safeParse(body);

  if (!parsed.success || !response.usage) {
    throw new ConvexError("Groq returned an invalid analysis.");
  }

  return {
    ...parsed.data,
    provider: "groq" as const,
    model: response.model,
    promptVersion: ANALYSIS_PROMPT_VERSION,
    inputTokens: response.usage.prompt_tokens,
    outputTokens: response.usage.completion_tokens,
  };
}
