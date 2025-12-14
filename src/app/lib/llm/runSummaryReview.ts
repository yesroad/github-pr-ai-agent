import type {
  ILlmReviewOutput,
  ILlmReviewIssueRaw,
  ILlmReviewOutputRaw,
} from "@/types/lib/llm";
import { getModelName, getOpenAIClient } from "./openaiClient";
import { isReviewIssueType, isReviewSeverity } from "@/types/lib/typeGuards";

function normalizeIssue(raw: ILlmReviewIssueRaw) {
  return {
    file:
      typeof raw.file === "string"
        ? raw.file.replace(/^b\//, "").replace(/^a\//, "")
        : "",
    line: typeof raw.line === "number" ? raw.line : 0,
    type: isReviewIssueType(raw.type) ? raw.type : "maintainability",
    severity: isReviewSeverity(raw.severity) ? raw.severity : "low",
    title: typeof raw.title === "string" ? raw.title : "",
    detail: typeof raw.detail === "string" ? raw.detail : "",
    suggestion: typeof raw.suggestion === "string" ? raw.suggestion : "",
  };
}

export async function runSummaryReview(
  diffContext: string
): Promise<ILlmReviewOutput> {
  const openai = getOpenAIClient();
  const model = getModelName();

  const system = `
You are a strict code reviewer.
Return ONLY valid JSON with the exact schema below. No markdown, no extra text.

Schema:
{
  "summary": "",
  "issues": [
    {
      "file": "",
      "line": 0,
      "type": "bug | performance | maintainability | style | security",
      "severity": "low | medium | high",
      "title": "",
      "detail": "",
      "suggestion": ""
    }
  ]
}

Rules:
- If you can't confidently map line number, use line = 0.
- File must be a relative path (no "a/" or "b/" prefix).
- Focus on actionable issues and avoid vague feedback.
`;

  const user = `
Review the following Git diff. Provide a concise summary and a list of issues.

DIFF:
${diffContext}
`;

  const res = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system.trim() },
      { role: "user", content: user.trim() },
    ],
    response_format: { type: "json_object" },
  });

  const text = res.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM response is empty");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("LLM returned non-JSON output");
  }

  const raw = parsed as ILlmReviewOutputRaw;

  if (typeof raw.summary !== "string" || !Array.isArray(raw.issues)) {
    throw new Error("LLM JSON does not match expected schema");
  }

  const normalized: ILlmReviewOutput = {
    summary: raw.summary,
    issues: raw.issues.map((i) => normalizeIssue(i as ILlmReviewIssueRaw)),
  };

  return normalized;
}
