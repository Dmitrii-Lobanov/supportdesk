import Anthropic from "@anthropic-ai/sdk";
import { ConvexError } from "convex/values";
import { analysisSchema, ANALYSIS_PROMPT_VERSION } from "../../shared/analysis";
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisInput } from "./analysisPrompt";

type AnalysisInput = Parameters<typeof buildAnalysisInput>[0];

export async function analyzeTicket(input: AnalysisInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;

  if (!apiKey || !model) {
    throw new ConvexError("AI analysis is not configured.");
  }

  if (input.subject.length > 300 || input.description.length > 12_000) {
    throw new ConvexError(
      "Analysis supports subjects up to 300 characters and descriptions up to 12,000 characters.",
    );
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: 40_000,
  });

  const response = await client.messages.create({
    model,
    max_tokens: 1600,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildAnalysisInput(input),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
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

  if (response.stop_reason !== "end_turn") {
    throw new ConvexError("AI analysis did not complete. Please try again.");
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let body: unknown;

  try {
    body = JSON.parse(text);
  } catch {
    throw new ConvexError("AI returned an unreadable analysis.");
  }

  const parsed = analysisSchema.safeParse(body);

  if (!parsed.success) {
    throw new ConvexError("AI returned an invalid analysis.");
  }

  return {
    ...parsed.data,
    model: response.model,
    promptVersion: ANALYSIS_PROMPT_VERSION,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
