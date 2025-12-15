interface IFetchPullRequestDiff {
  owner: string;
  repo: string;
  pullNumber: number;
  installationToken: string;
}

async function fetchPullRequestDiff({
  owner,
  repo,
  pullNumber,
  installationToken,
}: IFetchPullRequestDiff): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${installationToken}`,
        Accept: "application/vnd.github.v3.diff", // diff 형태로 받기
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-pr-ai-agent",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[fetchPullRequestDiff] GitHub API 오류", {
      status: res.status,
      statusText: res.statusText,
      response: text,
    });

    throw new Error("PR diff를 가져오는 데 실패했습니다.");
  }

  const diffText = await res.text();

  // 너무 짧거나 비어있으면 로그로 확인
  if (!diffText || diffText.trim().length === 0) {
    console.warn("[fetchPullRequestDiff] 변경 사항이 없습니다", {
      owner,
      repo,
      pullNumber,
    });

    throw new Error("PR에 변경 사항(diff)이 없습니다.");
  }

  return diffText;
}

export default fetchPullRequestDiff;
