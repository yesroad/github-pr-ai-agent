import { IPullRequestContext } from "@/types/lib/github";
import { getInstallationAccessToken } from "@/app/lib/github/appAuthentication";
import createPullRequestReview from "@/app/lib/github/createPullRequestReview";
import diffContextSummary from "@/app/lib/github/diffContextSummary";
import { splitDiffByFile } from "@/app/lib/github/diffParser";
import fetchPullRequestDiff from "@/app/lib/github/fetchPullRequestDiff";
import { listPullRequestReviews } from "@/app/lib/github/listPullRequestReviews";
import renderReviewMarkdown from "@/app/lib/github/renderReviewMarkdown";
import { buildReviewDisclaimer } from "@/app/lib/github/reviewDisclaimer";
import { attachMarkerToBody } from "@/app/lib/github/reviewMarker";
import decideReviewEvent from "@/app/lib/github/reviewPolicy";
import shouldSkipReviewByHeadSha from "@/app/lib/github/shouldSkipReview";
import { runSummaryReview } from "@/app/lib/llm/runSummaryReview";

async function runPullRequestReviewJob(prContext: IPullRequestContext) {
  console.log("🚀 [Job] start");

  // 토큰 발급
  const installationToken = await getInstallationAccessToken(
    prContext.installationId
  );

  // 중복 리뷰 방지
  const existingReviews = await listPullRequestReviews({
    owner: prContext.owner,
    repo: prContext.repo,
    pullNumber: prContext.pullNumber,
    installationToken,
  });

  if (
    shouldSkipReviewByHeadSha({
      reviews: existingReviews,
      headSha: prContext.headSha,
    })
  ) {
    console.log("⏭️ [Job] skipped (already reviewed)");
    return;
  }

  // PR diff 조회
  const diffText = await fetchPullRequestDiff({
    owner: prContext.owner,
    repo: prContext.repo,
    pullNumber: prContext.pullNumber,
    installationToken,
  });

  const files = splitDiffByFile(diffText);

  // diff context + meta
  const { context: diffContext, meta } = diffContextSummary({
    files,
    maxFiles: 20,
    maxCharsPerFile: 8000,
  });

  const disclaimer = buildReviewDisclaimer(meta);

  // LLM
  const llmJson = await runSummaryReview(diffContext);

  // markdown
  const markdown = renderReviewMarkdown(llmJson, {
    maxIssues: 15,
    preface: disclaimer,
  });

  const event = decideReviewEvent(llmJson);

  const finalBody = attachMarkerToBody({
    body: markdown,
    headSha: prContext.headSha,
  });

  // review 생성
  await createPullRequestReview({
    owner: prContext.owner,
    repo: prContext.repo,
    pullNumber: prContext.pullNumber,
    installationToken,
    body: finalBody,
    event,
  });

  console.log("✅ [Job] done");
}

export default runPullRequestReviewJob;
