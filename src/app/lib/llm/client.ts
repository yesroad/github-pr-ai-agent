import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 기본 모델은 환경 변수에서 가져오고, 없으면 gpt-4o-mini로 가정
const DEFAULT_LLM_MODEL = process.env.LLM_MODEL_NAME ?? "gpt-4o-mini";

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

/**
 * LLM 클라이언트가 설정되어 있는지 보장하는 assertion 함수
 */
export function assertLlmClient(): asserts openai is OpenAI {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not set. LLM client is not configured.");
  }
}

export function getLlmModelName() {
  return DEFAULT_LLM_MODEL;
}
