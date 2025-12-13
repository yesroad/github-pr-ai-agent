// src/lib/github/commentFormatter.ts

import type { IReviewIssue } from "@/types/review";

/**
 * ReviewIssue 하나를 GitHub PR 코멘트 Markdown으로 변환
 */
export function buildIssueCommentBody(issue: IReviewIssue): string {
  const lines: string[] = [];

  // 제목
  lines.push(`### ${issue.title}`);
  lines.push("");
  lines.push(
    `**Type:** \`${issue.type}\`  |  **Severity:** \`${issue.severity}\``
  );
  lines.push("");
  lines.push("**Details**");
  lines.push("");
  lines.push(issue.detail);
  lines.push("");

  if (issue.suggestion) {
    lines.push("**Suggestion (description)**");
    lines.push("");
    lines.push(issue.suggestion);
    lines.push("");
  }

  if (issue.originalCode) {
    lines.push("**Current code**");
    lines.push("");
    lines.push("```ts");
    lines.push(issue.originalCode.trim());
    lines.push("```");
    lines.push("");
  }

  if (issue.suggestedCode) {
    lines.push("**Suggested code**");
    lines.push("");
    lines.push("```ts");
    lines.push(issue.suggestedCode.trim());
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}
