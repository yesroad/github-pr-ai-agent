export type TReviewIssueType =
  | "bug"
  | "performance"
  | "maintainability"
  | "style"
  | "security";

export type TReviewIssueSeverity = "low" | "medium" | "high";

/**
 * LLM이 반환해야 할 단일 이슈 구조
 */
export interface IReviewIssue {
  file: string; // 예: "src/app/page.tsx"
  line: number; // PR에서 문제되는 줄 번호
  type: TReviewIssueType; // bug / performance / maintainability / style / security
  severity: TReviewIssueSeverity; // low / medium / high
  title: string; // 한 줄 요약
  detail: string; // 왜 문제인지, 어떤 상황에서 문제되는지 상세 설명
  suggestion: string; // 자연어로 된 수정 방향/가이드 설명

  /**
   * (선택) 현재 코드 스니펫
   * - 가능하면 문제 근처 3~10줄 정도
   */
  originalCode?: string;

  /**
   * (선택) 제안 코드 스니펫
   * - 어떻게 바꾸면 좋은지에 대한 예시 코드
   */
  suggestedCode?: string;
}

/**
 * LLM 최종 결과 JSON 구조
 */
export interface IReviewResult {
  summary: string; // PR 전체에 대한 짧은 요약
  issues: IReviewIssue[]; // 발견된 이슈 목록 (없으면 빈 배열)
}
