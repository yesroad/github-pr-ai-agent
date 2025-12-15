import type { TReviewIssueType, TReviewSeverity } from "./llm";

export function isReviewIssueType(v: unknown): v is TReviewIssueType {
  return (
    v === "bug" ||
    v === "performance" ||
    v === "maintainability" ||
    v === "style" ||
    v === "security"
  );
}

export function isReviewSeverity(v: unknown): v is TReviewSeverity {
  return v === "low" || v === "medium" || v === "high";
}
