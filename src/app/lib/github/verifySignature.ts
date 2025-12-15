import crypto from "crypto";

import type { Nullable } from "@/types/utils";

export const INVALID_SIGNATURE_CODE = "INVALID_SIGNATURE" as const;

interface IVerifyGithubSignature {
  signature256: Nullable<string>;
  signature1: Nullable<string>;
  payload: Buffer;
}

interface IVerifyHmacSignature {
  algorithm: "sha256" | "sha1";
  payload: Buffer;
  signature: string; // "sha256=..." 또는 "sha1=..."
  secret: string;
}

type TSignatureError = Error & { code: typeof INVALID_SIGNATURE_CODE };

function makeInvalidSignatureError(message: string): TSignatureError {
  const err = new Error(message) as TSignatureError;
  err.code = INVALID_SIGNATURE_CODE;
  return err;
}

/**
 * @description HMAC 서명 검증 (공통 로직)
 * - timingSafeEqual 사용(타이밍 공격 방어)
 * - signature는 "sha256=<hex>" / "sha1=<hex>" 형태여야 함
 */
function verifyHmacSignature({
  algorithm,
  payload,
  signature,
  secret,
}: IVerifyHmacSignature): void {
  const digest = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest("hex");
  const expected = `${algorithm}=${digest}`;

  // 길이가 다르면 timingSafeEqual을 호출하지 말고 즉시 실패 처리
  if (signature.length !== expected.length) {
    throw makeInvalidSignatureError(`Invalid signature (${algorithm})`);
  }

  const ok = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!ok) {
    throw makeInvalidSignatureError(`Invalid signature (${algorithm})`);
  }
}

/**
 * @description GitHub webhook signature 검증
 * - sha256 우선
 * - 없으면 sha1 fallback
 * - 둘 다 없으면 INVALID_SIGNATURE
 */
async function verifyGithubSignature({
  signature256,
  signature1,
  payload,
}: IVerifyGithubSignature): Promise<void> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) throw new Error("GITHUB_WEBHOOK_SECRET 가 없습니다.");

  const sig256 = signature256?.trim() ?? "";
  const sig1 = signature1?.trim() ?? "";

  // 둘 다 없으면 즉시 실패
  if (!sig256 && !sig1) {
    throw makeInvalidSignatureError("signature headers 가 없습니다.");
  }

  // sha256 검증 (우선)
  if (sig256) {
    verifyHmacSignature({
      algorithm: "sha256",
      payload,
      signature: sig256,
      secret,
    });
    return;
  }

  // sha1 fallback
  verifyHmacSignature({
    algorithm: "sha1",
    payload,
    signature: sig1,
    secret,
  });
}

export default verifyGithubSignature;
