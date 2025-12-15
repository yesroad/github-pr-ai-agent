import { ILlmReviewOutput, TReviewSeverity } from "@/types/lib/llm";

const MAX_ISSUES_DEFAULT = 15;

/**
 * @description 디버그용 JSON 첨부 여부
 */
function shouldAttachRawJson(): boolean {
  return process.env.ENABLE_REVIEW_DEBUG_JSON === "true";
}

function severityRank(sev: TReviewSeverity): number {
  switch (sev) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    default:
      return 3;
  }
}

function emojiBySeverity(sev: TReviewSeverity) {
  if (sev === "high") return "🚨";
  if (sev === "medium") return "⚠️";
  return "ℹ️";
}

function formatWhere(file: string, line: number) {
  if (!file) return "`(unknown)`";
  if (!line || line <= 0) return `\`${file}\``;
  return `\`${file}:${line}\``;
}

/**
 * @description 전체 요약 리뷰 Markdown
 */
function renderSummaryReviewMarkdown(
  result: ILlmReviewOutput,
  options?: { maxIssues?: number }
): string {
  const maxIssues = options?.maxIssues ?? MAX_ISSUES_DEFAULT;

  const summary =
    (typeof result.summary === "string" && result.summary.trim()) ||
    "변경 사항을 검토했습니다.";

  const issuesRaw = Array.isArray(result.issues) ? result.issues : [];

  const issuesSorted = [...issuesRaw].sort((a, b) => {
    const sev = severityRank(a.severity) - severityRank(b.severity);
    if (sev !== 0) return sev;

    const file = a.file.localeCompare(b.file);
    if (file !== 0) return file;

    return (a.line ?? 0) - (b.line ?? 0);
  });

  const issues = issuesSorted.slice(0, maxIssues);

  const grouped = new Map<string, typeof issues>();
  for (const it of issues) {
    const key = it.file || "(unknown)";
    const arr = grouped.get(key);
    if (arr) arr.push(it);
    else grouped.set(key, [it]);
  }

  const lines: string[] = [];
  lines.push("## 🤖 AI Code Review Summary");
  lines.push("");
  lines.push("### 요약");
  lines.push(`- ${summary}`);
  lines.push("");

  lines.push("### 주요 이슈");
  if (issuesRaw.length === 0) {
    lines.push("- 발견된 주요 이슈가 없습니다.");
    return lines.join("\n");
  }

  if (issuesRaw.length > issues.length) {
    lines.push(
      `- 총 ${issuesRaw.length}개 중 상위 ${issues.length}개만 표시합니다.`
    );
    lines.push("");
  }

  let globalIndex = 1;
  for (const [file, items] of grouped.entries()) {
    lines.push(
      `#### 📄 ${file === "(unknown)" ? "`(unknown)`" : `\`${file}\``}`
    );
    lines.push("");

    for (const it of items) {
      const sevEmoji = emojiBySeverity(it.severity);
      const where = formatWhere(it.file, it.line);

      lines.push(
        `${globalIndex}. ${sevEmoji} **${it.type.toUpperCase()}(${
          it.severity
        })**: ${it.title}`
      );
      lines.push(`   - 위치: ${where}`);
      if (it.detail) lines.push(`   - 상세: ${it.detail}`);
      if (it.suggestion) lines.push(`   - 제안: ${it.suggestion}`);
      lines.push("");
      globalIndex += 1;
    }
  }

  // 5) 필요할 때만 Raw JSON 첨부
  if (shouldAttachRawJson()) {
    lines.push("<details>");
    lines.push("<summary>LLM Raw Output (JSON)</summary>");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(result, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("</details>");
  }

  return lines.join("\n");
}

export default renderSummaryReviewMarkdown;
