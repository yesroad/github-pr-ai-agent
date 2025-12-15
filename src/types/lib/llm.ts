export type TReviewIssueType =
  | "bug"
  | "performance"
  | "maintainability"
  | "style"
  | "security";

export type TReviewSeverity = "low" | "medium" | "high";

export interface ILlmReviewIssueRaw {
  file?: unknown;
  line?: unknown;
  type?: unknown;
  severity?: unknown;
  title?: unknown;
  detail?: unknown;
  suggestion?: unknown;
}

export interface ILlmReviewOutputRaw {
  summary?: unknown;
  issues?: unknown;
}

export interface ILlmReviewOutput {
  summary: string;
  issues: {
    file: string;
    line: number;
    type: TReviewIssueType;
    severity: TReviewSeverity;
    title: string;
    detail: string;
    suggestion: string;
  }[];
}
