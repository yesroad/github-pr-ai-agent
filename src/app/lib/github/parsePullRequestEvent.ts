// src/lib/github/parsePullRequestEvent.ts

import { Nullable } from "@/types/utills";

/**
 * GitHub의 pull_request Webhook payload 중
 * 필요한 필드만 간단히 정의한 타입.
 *
 * 실제 전체 타입은 훨씬 더 크지만,
 * 여기서는 최소한으로만 사용한다.
 */
interface IPullRequestEventPayload {
  action: string; // 예: "opened", "synchronize", "closed", ...
  pull_request: {
    number: number;
    head: { sha: string }; // 변경된 커밋
    base: { sha: string }; // 타겟 브랜치 커밋
  };
  repository: {
    name: string; // repo 이름
    owner: {
      login: string; // repo owner (user or org)
    };
  };
  installation?: {
    id: number; // GitHub App installation id
  };
}

/**
 * 이후 파이프라인(토큰 발급, diff 조회, LLM 등)에 넘겨줄
 * "PR 컨텍스트" 타입.
 */
export interface IParsedPRContext {
  owner: string; // 예: "kim-eunggil"
  repo: string; // 예: "github-pr-ai-agent"
  pullNumber: number; // PR 번호
  headSha: string; // 변경된 코드가 있는 커밋 SHA
  baseSha: string; // 기준 브랜치 커밋 SHA
  installationId: number; // GitHub App installation id
}

/**
 * parsePullRequestEvent 함수에 넘겨줄 파라미터 타입.
 * - event: 헤더 `x-github-event` 값 (string | null)
 * - payload: Webhook body JSON (unknown → 내부에서 구조 검사)
 */
interface IParseParams {
  event: Nullable<string>;
  payload: unknown;
}

/**
 * 어떤 pull_request action에서만 자동 리뷰를 돌릴지 정의한다.
 *
 * - opened: PR이 새로 열렸을 때
 * - synchronize: PR에 새 커밋이 push됐을 때
 * - ready_for_review: Draft → Ready로 전환됐을 때
 *
 * 이 외의 action (closed, reopened 등)은 자동 리뷰 대상에서 제외한다.
 */
const PR_ACTIONS_TO_HANDLE = new Set<string>([
  "opened",
  "synchronize",
  "ready_for_review",
]);

/**
 * Webhook 이벤트가 "pull_request"인지 확인하고,
 * 자동 리뷰를 수행하고 싶은 action인지 필터링한 뒤,
 * PR 컨텍스트(ParsedPRContext)를 만들어서 반환하는 함수.
 *
 * - pull_request 이벤트가 아니면: null 반환
 * - 처리 대상 action이 아니면: null 반환
 * - 필수 정보가 없으면: Error throw
 */
export function parsePullRequestEvent({
  event,
  payload,
}: IParseParams): Nullable<IParsedPRContext> {
  if (event !== "pull_request") {
    return null;
  }

  const prPayload = payload as IPullRequestEventPayload;

  if (!prPayload.action) {
    throw new Error("Invalid pull_request payload: missing action field");
  }

  if (!PR_ACTIONS_TO_HANDLE.has(prPayload.action)) {
    return null;
  }

  const pullRequest = prPayload.pull_request;
  const repository = prPayload.repository;
  const installation = prPayload.installation;

  if (!pullRequest || !repository) {
    throw new Error(
      "Invalid pull_request payload: missing pull_request or repository field"
    );
  }

  if (!installation?.id) {
    throw new Error("Missing installation id in pull_request webhook payload");
  }

  return {
    owner: repository.owner.login,
    repo: repository.name,
    pullNumber: pullRequest.number,
    headSha: pullRequest.head.sha,
    baseSha: pullRequest.base.sha,
    installationId: installation.id,
  };
}
