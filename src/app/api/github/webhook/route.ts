import { getInstallationAccessToken } from "@/app/lib/github/appAuthentication";
import { splitDiffByFile } from "@/app/lib/github/diffParser";
import fetchPullRequestDiff from "@/app/lib/github/fetchPullRequestDiff";
import parsePullRequestEvent from "@/app/lib/github/parsePullRequestEvent";
import verifyGithubSignature from "@/app/lib/github/verifySignature";
import { hasErrorCode } from "@/types/utils";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());

  const event = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");
  const signature256 = req.headers.get("x-hub-signature-256");
  const signature1 = req.headers.get("x-hub-signature");

  console.log("🌐 [Webhook] incoming", {
    event,
    deliveryId,
    hasSig256: Boolean(signature256),
    hasSig1: Boolean(signature1),
    bodyBytes: rawBody.length,
  });

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

    // PR diff 조회
    const diffText = await fetchPullRequestDiff({
      owner: prContext.owner,
      repo: prContext.repo,
      pullNumber: prContext.pullNumber,
      installationToken,
    });

    console.log("📄 [Diff] fetched", {
      chars: diffText.length,
      firstLine: diffText.split("\n")[0],
    });

    const files = splitDiffByFile(diffText);

    console.log("🧩 [Diff] files", {
      count: files.length,
      sample: files[0]?.toPath ?? null,
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
