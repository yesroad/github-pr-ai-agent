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
