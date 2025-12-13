import crypto from "crypto";

export async function verifyGithubSignature(params: {
  signature256: string | null; // x-hub-signature-256
  signature1: string | null; // x-hub-signature
  payload: Buffer;
}): Promise<void> {
  const secretRaw = process.env.GITHUB_WEBHOOK_SECRET;

  // ✅ 값 자체는 노출하지 말고, JSON.stringify로 "숨은 문자"만 확인 가능하게
  console.log("[env] secret json:", JSON.stringify(secretRaw));
  console.log("[env] secret length:", secretRaw?.length ?? 0);

  if (!secretRaw) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not set");
  }

  // ✅ 실무에서 자주 넣는 안전장치: env에 실수로 붙은 공백/개행 제거
  // (GitHub App에 넣은 값 자체에 공백이 있을 일은 거의 없고, 로컬 env 실수 방지용)
  const secret = secretRaw.trim();

  // --- sha256 검증 (우선) ---
  if (params.signature256) {
    const digest = crypto
      .createHmac("sha256", secret)
      .update(params.payload)
      .digest("hex");
    const expected = `sha256=${digest}`;

    console.log(
      "[sig256] recv prefix/len:",
      params.signature256.slice(0, 16),
      params.signature256.length
    );
    console.log(
      "[sig256] exp  prefix/len:",
      expected.slice(0, 16),
      expected.length
    );

    const ok =
      params.signature256.length === expected.length &&
      crypto.timingSafeEqual(
        Buffer.from(params.signature256),
        Buffer.from(expected)
      );

    if (!ok) {
      const err = new Error("Invalid signature (sha256)");
      (err as any).code = "INVALID_SIGNATURE";
      throw err;
    }

    return;
  }

  // --- sha1 검증 (fallback) ---
  if (params.signature1) {
    const digest = crypto
      .createHmac("sha1", secret)
      .update(params.payload)
      .digest("hex");
    const expected = `sha1=${digest}`;

    console.log(
      "[sig1] recv prefix/len:",
      params.signature1.slice(0, 12),
      params.signature1.length
    );
    console.log(
      "[sig1] exp  prefix/len:",
      expected.slice(0, 12),
      expected.length
    );

    const ok =
      params.signature1.length === expected.length &&
      crypto.timingSafeEqual(
        Buffer.from(params.signature1),
        Buffer.from(expected)
      );

    if (!ok) {
      const err = new Error("Invalid signature (sha1)");
      (err as any).code = "INVALID_SIGNATURE";
      throw err;
    }

    return;
  }

  const err = new Error("Missing signature headers");
  (err as any).code = "INVALID_SIGNATURE";
  throw err;
}
