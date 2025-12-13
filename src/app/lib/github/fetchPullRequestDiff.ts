import { IParsedPRContext } from "./parsePullRequestEvent";

export async function fetchPullRequestDiff(
  token: string,
  context: IParsedPRContext
): Promise<string> {
  const { owner, repo, pullNumber } = context;

  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3.diff",
      "User-Agent": "github-pr-ai-agent",
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error("❌ Failed to fetch PR diff", {
      status: response.status,
      statusText: response.statusText,
      body: bodyText,
    });

    throw new Error(
      `Failed to fetch PR diff: ${response.status} ${response.statusText}`
    );
  }

  const diff = await response.text();

  return diff;
}
