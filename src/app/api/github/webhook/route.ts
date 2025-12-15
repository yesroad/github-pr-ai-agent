import { getInstallationAccessToken } from "@/app/lib/github/appAuthentication";
import createPullRequestReview from "@/app/lib/github/createPullRequestReview";
import diffContextSummary from "@/app/lib/github/diffContextSummary";
import { splitDiffByFile } from "@/app/lib/github/diffParser";
import fetchPullRequestDiff from "@/app/lib/github/fetchPullRequestDiff";
import { listPullRequestReviews } from "@/app/lib/github/listPullRequestReviews";
import parsePullRequestEvent from "@/app/lib/github/parsePullRequestEvent";
import renderSummaryReviewMarkdown from "@/app/lib/github/renderReviewMarkdown";
import { buildReviewDisclaimer } from "@/app/lib/github/reviewDisclaimer";
import { attachMarkerToBody } from "@/app/lib/github/reviewMarker";
import decideReviewEvent from "@/app/lib/github/reviewPolicy";
import shouldSkipReviewByHeadSha from "@/app/lib/github/shouldSkipReview";
import verifyGithubSignature from "@/app/lib/github/verifySignature";
import { runSummaryReview } from "@/app/lib/llm/runSummaryReview";
import { hasErrorCode } from "@/types/utils";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());

  const event = req.headers.get("x-github-event");
  const signature256 = req.headers.get("x-hub-signature-256");
  const signature1 = req.headers.get("x-hub-signature");

  try {
    await verifyGithubSignature({
      signature256,
      signature1,
      payload: rawBody,
    });

    const payload = JSON.parse(rawBody.toString("utf8"));
    const prContext = parsePullRequestEvent({ event, payload });

    if (!prContext)
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });

    console.log("🧩 [Webhook] PR context", prContext);

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
      return NextResponse.json(
        { ok: true, skipped: "already_reviewed" },
        { status: 200 }
      );
    }

    // PR diff 조회
    const diffText = await fetchPullRequestDiff({
      owner: prContext.owner,
      repo: prContext.repo,
      pullNumber: prContext.pullNumber,
      installationToken,
    });

    const files = splitDiffByFile(diffText);

    const { context: diffContext, meta } = buildDiffContextForSummary({
      files,
      maxFiles: 20,
      maxCharsPerFile: 8000,
    });

    const disclaimer = buildReviewDisclaimer(meta);

    const llmJson = await runSummaryReview(diffContext);

    const markdown = renderSummaryReviewMarkdown(llmJson, {
      maxIssues: 15,
      preface: disclaimer,
    });

    const event = decideReviewEvent(llmJson);

    const finalBody = attachMarkerToBody({
      body: markdown,
      headSha: prContext.headSha,
    });

    await createPullRequestReview({
      owner: prContext.owner,
      repo: prContext.repo,
      pullNumber: prContext.pullNumber,
      installationToken,
      body: finalBody,
      event,
    });

    return NextResponse.json(
      { ok: true, diffFiles: files.length },
      { status: 200 }
    );
  } catch (e: unknown) {
    if (hasErrorCode(e) && e.code === "INVALID_SIGNATURE") {
      console.error("🛑 [Webhook] invalid signature");

      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.error("❌ [Webhook] error", e);

    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
