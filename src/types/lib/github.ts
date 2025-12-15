export type TPullRequestAction = "opened" | "synchronize" | "reopened";

export type TGithubReviewEvent = "COMMENT" | "REQUEST_CHANGES";

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

export interface IParsedDiffFile {
  fromPath: string;
  toPath: string;
  chunks: string[];
}

export interface IPullRequestReview {
  id: number;
  body: string | null;
  user?: { login?: string };
  submitted_at?: string | null;
}
\export interface DiffContextBuildResult {
  context: string;
  meta: {
    maxFiles: number;
    maxCharsPerFile: number;
    totalChars: number;
    usedFiles: number;
    truncatedFiles: number; // 파일별 char 제한으로 잘린 파일 수
    droppedFiles: number;   // maxFiles 때문에 제외된 파일 수
  };
}
export interface IDiffContextBuildResult {
  context: string;
  meta: {
    maxFiles: number;
    maxCharsPerFile: number;
    totalChars: number;
    usedFiles: number;
    truncatedFiles: number; 
    droppedFiles: number;
  };
}
