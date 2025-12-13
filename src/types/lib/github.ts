export type TPullRequestAction = "opened" | "synchronize" | "reopened";

/**
 * 토큰 발급, diff fetch, review 작성에서 필요한 최소 PR 컨텍스트
 */
export interface IPullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
  headSha: string;
  baseSha: string;
  installationId: number;
}

/**
 * pull_request webhook payload 최소 타입
 */
export interface IGithubWebhookPullRequestPayload {
  action: TPullRequestAction;
  installation?: {
    id: number;
  };
  repository?: {
    name: string;
    owner?: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
    head?: {
      sha: string;
    };
    base?: {
      sha: string;
    };
  };
  [key: string]: unknown;
}
