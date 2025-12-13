import { NextRequest, NextResponse } from "next/server";
import { verifyGithubSignature } from "@/app/lib/github/verifySignature";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const request = req as unknown as Request;
  const arrayBuffer = await request.arrayBuffer();
  const rawBody = Buffer.from(arrayBuffer);

  const sig256 = req.headers.get("x-hub-signature-256");
  const sig1 = req.headers.get("x-hub-signature");
  const event = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  console.log("🌐 [Webhook] incoming", {
    event,
    deliveryId,
    hasSig256: Boolean(sig256),
    hasSig1: Boolean(sig1),
    bodyBytes: rawBody.length,
  });

  try {
    await verifyGithubSignature({
      signature256: sig256,
      signature1: sig1,
      payload: rawBody,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "INVALID_SIGNATURE") {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }
    console.error("Unexpected error", e);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
