import type { IPullRequestReview } from "@/types/lib/github";

interface IPullRequestReviewParams {
  owner: string;
  repo: string;
  pullNumber: number;
  installationToken: string;
}

export async function listPullRequestReviews({
  owner,
  repo,
  pullNumber,
  installationToken,
}: IPullRequestReviewParams): Promise<IPullRequestReview[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${installationToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-pr-ai-agent",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PR 리뷰 목록 조회 실패: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as IPullRequestReview[];
  return Array.isArray(data) ? data : [];
}
