import { Nullable } from "@/types/utils";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

console.log("[verifySignature.ts] loaded", {
  hasSecret: Boolean(WEBHOOK_SECRET),
  length: WEBHOOK_SECRET?.length ?? 0,
  nodeEnv: process.env.NODE_ENV,
});

interface IVerifySignatureParams {
  signature: Nullable<string>;
  payload: string;
}

export async function verifyGithubSignature({
  signature,
  payload,
}: IVerifySignatureParams): Promise<void> {
  console.log("WEBHOOK_SECRET", WEBHOOK_SECRET);
  if (!WEBHOOK_SECRET) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not set");
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const received = signature ?? "";

  if (received.length !== expectedSignature.length) {
    const error = new Error(
      "Invalid GitHub Webhook signature (length mismatch)"
    ) as Error & { code?: string };
    error.code = "INVALID_SIGNATURE";
    throw error;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(received)
  );

  if (!isValid) {
    const error = new Error("Invalid GitHub Webhook signature") as Error & {
      code?: string;
    };
    error.code = "INVALID_SIGNATURE";
    throw error;
  }
}
