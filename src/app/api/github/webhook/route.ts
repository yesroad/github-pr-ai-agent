import parsePullRequestEvent from "@/app/lib/github/parsePullRequestEvent";
import runPullRequestReviewJob from "@/app/lib/github/runPullRequestReviewJob";
import verifyGithubSignature from "@/app/lib/github/verifySignature";
import { hasErrorCode } from "@/types/utils";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());

  const githubEvent = req.headers.get("x-github-event");
  const signature256 = req.headers.get("x-hub-signature-256");
  const signature1 = req.headers.get("x-hub-signature");

  try {
    await verifyGithubSignature({
      signature256,
      signature1,
      payload: rawBody,
    });

    const payload = JSON.parse(rawBody.toString("utf8"));
    const prContext = parsePullRequestEvent({ event: githubEvent, payload });

    if (!prContext)
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });

    const repoFullName = payload?.repository?.full_name;

    console.log("✅ [Webhook] accepted", {
      event: githubEvent,
      action: payload?.action,
      repo: repoFullName,
      installationId: payload?.installation?.id,
      pullNumber: payload?.pull_request?.number,
    });

    // Respond quickly to GitHub, but make sure job errors are not swallowed.
    const response = NextResponse.json(
      { ok: true, accepted: true },
      { status: 202 }
    );

    void runPullRequestReviewJob(prContext).catch((e) => {
      console.error(
        "❌ [Job] failed",
        {
          event: githubEvent,
          repo: repoFullName,
          installationId: prContext.installationId,
          owner: prContext.owner,
          repoName: prContext.repo,
          pullNumber: prContext.pullNumber,
          headSha: prContext.headSha,
        },
        e
      );
    });

    return response;
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
