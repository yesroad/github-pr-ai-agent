import OpenAI from "openai";

export function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;

  if (!key) throw new Error("OPENAI_API_KEY가 없습니다.");

  return new OpenAI({ apiKey: key });
}

export function getModelName(): string {
  return process.env.LLM_MODEL_NAME ?? "gpt-4o-mini";
}
