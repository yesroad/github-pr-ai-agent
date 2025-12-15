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

    // 인증 성공 시 202로 gitHub에 즉시 응답
    const response = NextResponse.json(
      { ok: true, accepted: true },
      { status: 202 }
    );

    void runPullRequestReviewJob(prContext);

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
