import { parsePullRequestEvent } from "@/app/lib/github/parsePullRequestEvent";
import { verifyGithubSignature } from "@/app/lib/github/verifySignature";
import { hasErrorCode } from "@/types/utills";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const request = req as unknown as Request;
  const arrayBuffer = await request.arrayBuffer();
  const rawBody = Buffer.from(arrayBuffer).toString("utf-8");

  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  try {
    await verifyGithubSignature({ signature, payload: rawBody });

    const payload = JSON.parse(rawBody);

    console.log("✅ Valid GitHub webhook received", {
      event,
      deliveryId,
      action: payload?.action,
    });

    const prContext = parsePullRequestEvent({
      event,
      payload,
    });

    if (!prContext) {
      console.log("ℹ️ Not a target pull_request event. Skipped.");
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    console.log("🧩 Parsed PR context", prContext);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    if (hasErrorCode(e) && e.code === "INVALID_SIGNATURE") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.error("Unexpected error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
