interface ICreatePullRequestReview {
  owner: string;
  repo: string;
  pullNumber: number;
  installationToken: string;
  body: string;
}

async function createPullRequestReview({
  owner,
  repo,
  pullNumber,
  installationToken,
  body,
}: ICreatePullRequestReview): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${installationToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-pr-ai-agent",
      },
      body: JSON.stringify({
        body,
        event: "COMMENT",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create PR review: ${res.status} ${res.statusText} ${text}`
    );
  }
}

export default createPullRequestReview;
