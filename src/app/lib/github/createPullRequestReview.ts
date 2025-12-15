import type { TGithubReviewEvent } from "@/types/lib/github";

interface ICreatePullRequestReview {
  owner: string;
  repo: string;
  pullNumber: number;
  installationToken: string;
  body: string;
  event: TGithubReviewEvent;
}

async function createPullRequestReview({
  owner,
  repo,
  pullNumber,
  installationToken,
  body,
  event,
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
        event,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PR 리뷰 생성 실패: ${res.status} ${res.statusText} ${text}`
    );
  }
}

export default createPullRequestReview;
