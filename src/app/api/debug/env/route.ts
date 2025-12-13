import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * @description 환경변수 로딩 확인용
 */
export async function GET() {
  const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
  const APP_ID = process.env.GITHUB_APP_ID;
  const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;
  const OPEN_API_KEY = process.env.OPEN_API_KEY;

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    webhookSecret: {
      has: Boolean(WEBHOOK_SECRET),
      length: WEBHOOK_SECRET?.length ?? 0,
    },
    appId: { has: Boolean(APP_ID), length: APP_ID?.length ?? 0 },
    privateKey: {
      has: Boolean(PRIVATE_KEY),
      length: PRIVATE_KEY?.length ?? 0,
      hasEscapedNewlines: Boolean(PRIVATE_KEY?.includes("\\n")),
    },
    openai: { has: Boolean(OPEN_API_KEY), length: OPEN_API_KEY?.length ?? 0 },
    model: process.env.LLM_MODEL_NAME ?? null,
  });
}
