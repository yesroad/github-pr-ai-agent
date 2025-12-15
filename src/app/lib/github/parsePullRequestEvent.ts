import {
  TPullRequestAction,
  type IGithubWebhookPullRequestPayload,
  type IPullRequestContext,
} from "@/types/lib/github";
import { Nullable } from "@/types/utils";

interface IParsePullRequestEvent {
  event: Nullable<string>;
  payload: IGithubWebhookPullRequestPayload;
}

/**
 * @description 처리할 PR 이벤트 액션만 허용
 */
const ALLOWED_ACTIONS = new Set<TPullRequestAction>([
  "opened",
  "synchronize",
  "reopened",
]);

function parsePullRequestEvent({
  event,
  payload,
}: IParsePullRequestEvent): Nullable<IPullRequestContext> {
  const { action, repository, pull_request, installation } = payload ?? {};

  if (event !== "pull_request") return null;

  if (!ALLOWED_ACTIONS.has(action)) return null;

  const owner = repository?.owner?.login;
  const repo = repository?.name;
  const pullNumber = pull_request?.number;
  const headSha = pull_request?.head?.sha;
  const baseSha = pull_request?.base?.sha;
  const installationId = installation?.id;

  if (
    typeof owner !== "string" ||
    typeof repo !== "string" ||
    typeof pullNumber !== "number" ||
    typeof headSha !== "string" ||
    typeof baseSha !== "string" ||
    typeof installationId !== "number"
  ) {
    return null;
  }

  return {
    owner,
    repo,
    pullNumber,
    headSha,
    baseSha,
    installationId,
  };
}

export default parsePullRequestEvent;
