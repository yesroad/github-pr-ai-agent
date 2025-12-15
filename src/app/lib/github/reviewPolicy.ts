import type { TGithubReviewEvent } from "@/types/lib/github";
import type { ILlmReviewOutput } from "@/types/lib/llm";

/**
 * @description LLM 리뷰 결과를 바탕으로 GitHub Review 이벤트 결정
 * - high 이슈가 있으면 REQUEST_CHANGES
 * - 그 외는 COMMENT
 */
function decideReviewEvent(result: ILlmReviewOutput): TGithubReviewEvent {
  const issues = Array.isArray(result.issues) ? result.issues : [];

  const hasHigh = issues.some((it) => it.severity === "high");
  if (hasHigh) return "REQUEST_CHANGES";

  return "COMMENT";
}

export default decideReviewEvent;
