import jwt from "jsonwebtoken";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;

export function createAppJwt(): string {
  if (!GITHUB_APP_ID) {
    throw new Error("GITHUB_APP_ID is not set");
  }

  if (!GITHUB_APP_PRIVATE_KEY) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set");
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  const payload = {
    iat: nowInSeconds - 60,
    exp: nowInSeconds + 9 * 60,
    iss: GITHUB_APP_ID,
  };

  const token = jwt.sign(payload, GITHUB_APP_PRIVATE_KEY, {
    algorithm: "RS256",
  });

  return token;
}

export async function getInstallationAccessToken(
  installationId: number
): Promise<string> {
  if (!Number.isFinite(installationId)) {
    throw new Error("installationId must be a valid number");
  }

  const appJwt = createAppJwt();

  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appJwt}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "github-pr-ai-agent",
    },
  });

  if (!response.ok) {
    const text = await response.text();

    console.error("Failed to get installation access token", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    token: string;
    expires_at: string;
  };

  if (!data.token) {
    throw new Error("No token in installation access token response");
  }

  return data.token;
}
