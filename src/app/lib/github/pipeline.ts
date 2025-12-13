// src/lib/github/pipeline.ts

import type { IParsedPRContext } from "./parsePullRequestEvent";
import { getInstallationAccessToken } from "./appAuthentication";
import { fetchPullRequestDiff } from "./fetchPullRequestDiff";
import { generateReviewFromDiff } from "@/app/lib/llm/reviewEngine";
import { postPullRequestReview } from "./postReviewComments";
import type { IReviewResult } from "@/types/review";

// ✅ 단계별 토글: 처음엔 false로 두고 하나씩 켠다.
const ENABLE_LLM = process.env.ENABLE_LLM === "true";
const ENABLE_POST_REVIEW = process.env.ENABLE_POST_REVIEW === "true";

export async function runPullRequestReviewPipeline(
  prContext: IParsedPRContext
): Promise<void> {
  // 1) Installation 토큰 발급
  const installationToken = await getInstallationAccessToken(
    prContext.installationId
  );
  console.log("🔑 Installation token OK");

  // 2) PR diff 가져오기
  const diff = await fetchPullRequestDiff(installationToken, prContext);
  console.log("📄 PR diff length:", diff.length);

  // 3) LLM 리뷰 생성 (처음엔 OFF)
  const review: IReviewResult = ENABLE_LLM
    ? await generateReviewFromDiff({ prContext, diff })
    : { summary: "Test review (LLM disabled)", issues: [] };

  console.log("🧠 Review JSON:", review);

  // 4) GitHub에 리뷰 작성 (처음엔 OFF)
  if (ENABLE_POST_REVIEW) {
    await postPullRequestReview({
      token: installationToken,
      prContext,
      review,
    });
    console.log("✅ Review posted to GitHub");
  } else {
    console.log("🟡 Posting review disabled (ENABLE_POST_REVIEW=false)");
  }
}
