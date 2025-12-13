import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // ⚠️ 값 자체는 절대 노출하지 말고 길이만 확인
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  return NextResponse.json({
    hasSecret: Boolean(secret),
    length: secret?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  });
}
