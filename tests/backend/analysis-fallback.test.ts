import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { analyzeTicket } from "../../convex/lib/analyzeTicket";
import { analyzeWithClaude } from "../../convex/lib/analyzeWithClaude";
import { analyzeWithGroq } from "../../convex/lib/analyzeWithGroq";

vi.mock("../../convex/lib/analyzeWithClaude", () => ({
  analyzeWithClaude: vi.fn(),
}));

vi.mock("../../convex/lib/analyzeWithGroq", () => ({
  analyzeWithGroq: vi.fn(),
}));

const claude = vi.mocked(analyzeWithClaude);
const groq = vi.mocked(analyzeWithGroq);

const input = {
  subject: "Cannot reset password",
  description: "The password reset link has expired.",
  customer: null,
};

const analysis = {
  summary: "The password reset link expired.",
  category: "account" as const,
  draftReply: "Please request a new reset link.",
  model: "test-model",
  promptVersion: "test-v1",
  inputTokens: 100,
  outputTokens: 50,
};

beforeEach(() => {
  vi.resetAllMocks();

  // Silence expected fallback messages in test output.
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("returns Claude's result without calling Groq", async () => {
  const result = {
    ...analysis,
    provider: "anthropic" as const,
  };

  claude.mockResolvedValue(result);

  await expect(analyzeTicket(input)).resolves.toEqual(result);

  expect(claude).toHaveBeenCalledExactlyOnceWith(input);
  expect(groq).not.toHaveBeenCalled();
});

test("falls back to Groq when Claude rejects the request", async () => {
  claude.mockRejectedValue(new Error("Insufficient API credits."));

  const result = {
    ...analysis,
    provider: "groq" as const,
  };

  groq.mockResolvedValue(result);

  await expect(analyzeTicket(input)).resolves.toEqual(result);

  expect(claude).toHaveBeenCalledExactlyOnceWith(input);
  expect(groq).toHaveBeenCalledExactlyOnceWith(input);
});

test("returns a useful failure when both providers fail", async () => {
  claude.mockRejectedValue(new Error("Claude unavailable."));
  groq.mockRejectedValue(new Error("Groq unavailable."));

  await expect(analyzeTicket(input)).rejects.toThrow(
    "Both AI providers failed. Please try again later.",
  );

  expect(claude).toHaveBeenCalledTimes(1);
  expect(groq).toHaveBeenCalledTimes(1);
});

test("rejects oversized input before calling either provider", async () => {
  await expect(
    analyzeTicket({
      ...input,
      description: "a".repeat(12_001),
    }),
  ).rejects.toThrow("12,000 characters");

  expect(claude).not.toHaveBeenCalled();
  expect(groq).not.toHaveBeenCalled();
});
