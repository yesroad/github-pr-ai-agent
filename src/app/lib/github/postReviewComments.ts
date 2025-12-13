// src/lib/github/postReviewComments.ts

import type { IParsedPRContext } from "./parsePullRequestEvent";
import type { IReviewResult, IReviewIssue } from "@/types/review";
import { buildIssueCommentBody } from "./commentFormatter";

/**
 * GitHub Review API에 전달할 단일 comment 구조 타입
 * (문서 기준: Create a review for a pull request)
 */
interface IGitHubReviewComment {
  path: string; // 파일 경로 (예: "src/app/page.tsx")
  line: number; // 변경된 파일 기준 줄 번호
  side: "RIGHT"; // 항상 최종 버전 기준으로 코멘트 (HEAD)
  body: string; // Markdown 형식의 코멘트 내용
}

/**
 * ReviewIssue[] → GitHubReviewComment[] 로 변환
 */
function mapIssuesToGitHubComments(
  issues: IReviewIssue[]
): IGitHubReviewComment[] {
  return issues
    .filter((issue) => issue.file && issue.line > 0)
    .map((issue) => ({
      path: issue.file,
      line: issue.line,
      side: "RIGHT" as const,
      body: buildIssueCommentBody(issue),
    }));
}

/**
 * GitHub Pull Request Review를 생성하는 함수.
 *
 * - token: Installation Access Token
 * - prContext: owner / repo / pullNumber 정보
 * - review: LLM이 생성한 ReviewResult (summary + issues[])
 *
 * 동작:
 * - issues가 없으면: summary만 포함된 일반 코멘트 리뷰를 남긴다.
 * - issues가 있으면: summary + 각 이슈를 개별 인라인 코멘트로 남긴다.
 */
export async function postPullRequestReview(params: {
  token: string;
  prContext: IParsedPRContext;
  review: IReviewResult;
}): Promise<void> {
  const { token, prContext, review } = params;
  const { owner, repo, pullNumber } = prContext;

  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  const comments = mapIssuesToGitHubComments(review.issues ?? []);

  /**
   * GitHub Review event 종류:
   * - "COMMENT": 일반 리뷰 (변경 요청/승인 아님)
   * - "REQUEST_CHANGES": 변경 요청
   * - "APPROVE": 승인
   *
   * MVP 단계에서는 안전하게 "COMMENT"만 사용한다.
   * (나중에 severity 등을 기준으로 REQUEST_CHANGES로 확장 가능)
   */
  const event = "COMMENT" as const;

  // 리뷰 본문(body)은 summary를 사용하되,
  // 없으면 기본 문구를 넣는다.
  const body =
    review.summary && review.summary.trim().length > 0
      ? review.summary.trim()
      : "AI code review summary";

  const payload: {
    body: string;
    event: "COMMENT";
    comments?: IGitHubReviewComment[];
  } = {
    body,
    event,
  };

  if (comments.length > 0) {
    payload.comments = comments;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "github-pr-ai-agent",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("❌ Failed to post PR review", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    throw new Error(
      `Failed to post PR review: ${response.status} ${response.statusText}`
    );
  }

  console.log("✅ Successfully posted PR review to GitHub");
}
