import test from "node:test";
import assert from "node:assert/strict";
import { analysisSchema } from "../shared/analysis.ts";

const validAnalysis = {
  summary: "The customer cannot reset their password.",
  category: "account",
  draftReply:
    "Could you share the error message you see when requesting a password reset?",
};

test("accepts a complete analysis", () => {
  const result = analysisSchema.parse(validAnalysis);

  assert.deepEqual(result, validAnalysis);
});

test("trims surrounding whitespace before accepting text", () => {
  const result = analysisSchema.parse({
    ...validAnalysis,
    summary: `  ${validAnalysis.summary}  `,
    draftReply: `\n${validAnalysis.draftReply}\n`,
  });

  assert.equal(result.summary, validAnalysis.summary);
  assert.equal(result.draftReply, validAnalysis.draftReply);
});

test("accepts text exactly at the configured limits", () => {
  const result = analysisSchema.safeParse({
    ...validAnalysis,
    summary: "a".repeat(1200),
    draftReply: "b".repeat(3000),
  });

  assert.equal(result.success, true);
});

const invalidResponses: Array<{
  name: string;
  body: unknown;
}> = [
  {
    name: "missing reply",
    body: {
      summary: validAnalysis.summary,
      category: "account",
    },
  },
  {
    name: "unknown category",
    body: { ...validAnalysis, category: "urgent" },
  },
  {
    name: "numeric summary",
    body: { ...validAnalysis, summary: 123 },
  },
  {
    name: "whitespace-only reply",
    body: { ...validAnalysis, draftReply: " \n " },
  },
  {
    name: "oversized summary",
    body: { ...validAnalysis, summary: "a".repeat(1201) },
  },
  {
    name: "oversized reply",
    body: { ...validAnalysis, draftReply: "b".repeat(3001) },
  },
  {
    name: "unexpected action field",
    body: { ...validAnalysis, sendEmail: true },
  },
  {
    name: "null response",
    body: null,
  },
];

for (const { name, body } of invalidResponses) {
  test(`rejects ${name}`, () => {
    const result = analysisSchema.safeParse(body);

    assert.equal(result.success, false);
  });
}
