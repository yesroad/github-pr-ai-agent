import type { IReviewResult } from "@/types/review";
import { assertLlmClient, getLlmModelName, openai } from "./client";
import type { IParsedPRContext } from "../github/parsePullRequestEvent";

/**
 * LLM에 넘길 프롬프트를 구성하는 함수
 */
function buildReviewPrompt(params: {
  prContext: IParsedPRContext;
  diff: string;
}): { system: string; user: string } {
  const { prContext, diff } = params;

  const system = `
너는 숙련된 시니어 소프트웨어 엔지니어이자 코드 리뷰어다.
아래 기준을 지키면서 GitHub Pull Request의 변경(diff)을 리뷰해라.

- 언어: 개발자에게 피드백하듯이, 간결하고 실무적인 톤으로.
- 출력 형식: 반드시 JSON만 반환할 것. 앞뒤에 설명 문장이나 마크다운을 붙이지 말 것.
- JSON 스키마는 다음을 반드시 따른다:

{
  "summary": "이 PR 전체에 대한 한 줄 요약 또는 짧은 요약",
  "issues": [
    {
      "file": "변경이 발생한 파일 경로 (예: src/app/page.tsx)",
      "line": 0,
      "type": "bug | performance | maintainability | style | security 중 하나",
      "severity": "low | medium | high 중 하나",
      "title": "한 줄로 된 문제 요약",
      "detail": "왜 이게 문제인지, 어떤 상황에서 문제가 될 수 있는지 상세 설명",
      "suggestion": "자연어로 된 수정 방향/가이드 설명",
      "originalCode": "문제가 되는 현재 코드 스니펫 (가능하면 3~10줄 정도, 선택 필드)",
      "suggestedCode": "실제 수정 예시 코드 스니펫 (가능하면 3~10줄 정도, 선택 필드)"
    }
  ]
}

- issues 배열은 빈 배열일 수도 있다.
- originalCode, suggestedCode는 선택 필드이지만, 가능하면 채워라.
  - originalCode에는 '현재 코드'를,
  - suggestedCode에는 '수정된 버전 코드'를 넣는다.
- JSON 속성 외에 추가 속성을 임의로 만들지 말 것.
- JSON 앞뒤에 주석, 마크다운, 텍스트를 붙이지 말고 오직 순수 JSON만 반환할 것.
`.trim();

  const user = `
다음은 GitHub Pull Request의 메타 정보와 diff이다.

[PR Context]
- Repository: ${prContext.owner}/${prContext.repo}
- Pull Request Number: ${prContext.pullNumber}
- Head SHA: ${prContext.headSha}
- Base SHA: ${prContext.baseSha}

[Diff]
\`\`\`diff
${diff}
\`\`\`

요구사항:

1. 변경된 코드 중 의미 있는 이슈만 선별해라. 사소한 스타일 이슈는 가능하면 생략해도 된다.
2. 각 이슈에 대해:
   - 무엇이 문제인지 (detail),
   - 왜 문제가 되는지 (detail),
   - 어떻게 수정하면 좋은지 (suggestion),
   - 현재 코드 예시 (originalCode),
   - 수정된 코드 예시 (suggestedCode)
   를 포함해라.
3. 반드시 위에서 정의한 JSON 스키마 형식으로만 응답해라.
`.trim();

  return { system, user };
}

/**
 * LLM 출력(raw string)을 ReviewResult로 파싱
 * - 나중에 zod 등으로 검증 추가 가능
 */
function parseReviewResult(raw: string): IReviewResult {
  try {
    const parsed = JSON.parse(raw);
    return parsed as IReviewResult;
  } catch (error) {
    console.error("❌ Failed to parse LLM review JSON", { raw });
    throw new Error("LLM output is not valid JSON");
  }
}

/**
 * 핵심: diff → LLM → ReviewResult(JSON)
 *
 * - prContext: 어떤 PR인지 메타 정보
 * - diff: PR 전체 diff 텍스트
 */
export async function generateReviewFromDiff(params: {
  prContext: IParsedPRContext;
  diff: string;
}): Promise<IReviewResult> {
  const { prContext, diff } = params;

  assertLlmClient();

  const { system, user } = buildReviewPrompt({ prContext, diff });

  const response = await openai!.chat.completions.create({
    model: getLlmModelName(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2, // JSON 일관성을 위해 낮게
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("LLM returned empty response");
  }

  const reviewResult = parseReviewResult(content);

  return reviewResult;
}
