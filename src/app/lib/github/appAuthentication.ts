import jwt from "jsonwebtoken";

interface IGithubAppEnv {
  appId: string; // GitHub App ID (string number)
  privateKey: string; // PEM
}

function isNumericString(v: string): boolean {
  return /^[0-9]+$/.test(v);
}

function looksLikePemPrivateKey(key: string): boolean {
  // RSA/PKCS8 둘 다 허용
  return (
    key.includes("BEGIN PRIVATE KEY") || key.includes("BEGIN RSA PRIVATE KEY")
  );
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  key = key.replace(/\\n/g, "\n");
  key = key.replace(/\r/g, "");

  return key;
}

function getGithubAppEnv(): IGithubAppEnv {
  const appId = process.env.GITHUB_APP_ID?.trim() ?? "";
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY ?? "";

  if (!appId) {
    throw new Error("GITHUB_APP_ID is not set");
  }
  if (!isNumericString(appId)) {
    throw new Error("GITHUB_APP_ID must be a numeric string");
  }

  if (!rawKey.trim()) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set");
  }

  const privateKey = normalizePrivateKey(rawKey);

  if (!looksLikePemPrivateKey(privateKey)) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY does not look like a PEM private key"
    );
  }

  return { appId, privateKey };
}

export function createAppJwt(): string {
  const { appId, privateKey } = getGithubAppEnv();

  // iat/exp 권장: exp는 최대 10분
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

export async function getInstallationAccessToken(
  installationId: number
): Promise<string> {
  const token = createAppJwt();

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-pr-ai-agent",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new Error(
      `Installation token 생성 실패 (status: ${res.status}, message: ${res.statusText}, response: ${text})`
    );
  }

  const data = (await res.json()) as { token: string };

  if (!data.token) {
    throw new Error("설치 토큰 생성 응답에 토큰이 포함되어 있지 않습니다.");
  }

  return data.token;
}
