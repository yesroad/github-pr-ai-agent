import crypto from "crypto";

import { Nullable } from "@/types/utils";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET?.trim() ?? "";

interface IVerifyGithubSignature {
  signature256: Nullable<string>;
  signature1: Nullable<string>;
  payload: Buffer;
}

interface IVerifyHmacSignature {
  algorithm: "sha256" | "sha1";
  payload: Buffer;
  signature: string;
}

function verifyHmacSignature({
  algorithm,
  payload,
  signature,
}: IVerifyHmacSignature) {
  const digest = crypto
    .createHmac(algorithm, WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const expected = `${algorithm}=${digest}`;

  const ok =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!ok) {
    const err = new Error(`Invalid signature (${algorithm})`);
    (err as { code?: string }).code = "INVALID_SIGNATURE";
    throw err;
  }
}

/**
 * @description GitHub webhook signature 검증
 */
async function verifyGithubSignature({
  signature256,
  signature1,
  payload,
}: IVerifyGithubSignature) {
  if (!WEBHOOK_SECRET) throw new Error("GITHUB_WEBHOOK_SECRET 가 없습니다.");

  // sha256 검증 (우선)
  if (signature256) {
    verifyHmacSignature({
      algorithm: "sha256",
      payload,
      signature: signature256,
    });

    return;
  }

  // sha1 fallback
  if (signature1) {
    verifyHmacSignature({
      algorithm: "sha1",
      payload,
      signature: signature1,
    });

    return;
  }

  const err = new Error("signature headers 가 없습니다.");
  (err as { code?: string }).code = "INVALID_SIGNATURE";
  throw err;
}

export default verifyGithubSignature;
