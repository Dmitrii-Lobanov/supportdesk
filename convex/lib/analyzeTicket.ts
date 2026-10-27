import { ConvexError } from "convex/values";
import { analyzeWithGroq } from "./analyzeWithGroq";
import { AnalysisInput, analyzeWithClaude } from "./analyzeWithClaude";

export async function analyzeTicket(input: AnalysisInput) {
  // Validate before either provider receives the request.
  if (input.subject.length > 300 || input.description.length > 12_000) {
    throw new ConvexError(
      "Analysis supports subjects up to 300 characters and descriptions up to 12,000 characters.",
    );
  }

  try {
    return await analyzeWithClaude(input);
  } catch {
    console.warn("Claude analysis failed; trying Groq fallback.");
  }

  try {
    return await analyzeWithGroq(input);
  } catch {
    console.error("Groq fallback failed.");

    throw new ConvexError("Both AI providers failed. Please try again later.");
  }
}
