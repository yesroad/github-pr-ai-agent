import type { IParsedDiffFile } from "@/types/lib/github";
import { Nullable } from "@/types/utils";

/**
 * @description unified diff를 "파일 단위"로만 나누는 최소 파서
 */
export function splitDiffByFile(diffText: string): IParsedDiffFile[] {
  const lines = diffText.split("\n");
  const files: IParsedDiffFile[] = [];

  let current: Nullable<IParsedDiffFile> = null;

  for (const line of lines) {
    // 파일 시작: diff --git a/... b/...
    if (line.startsWith("diff --git ")) {
      // 이전 파일 flush
      if (current) files.push(current);

      const m = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
      current = {
        fromPath: m ? `a/${m[1]}` : "a/unknown",
        toPath: m ? `b/${m[2]}` : "b/unknown",
        chunks: [line],
      };
      continue;
    }

    // 파일 내부 라인 누적
    if (current) current.chunks.push(line);
  }

  if (current) files.push(current);

  return files;
}

/**
 * @description LLM에 넣기 쉬운 형태로 압축(너무 길면 파일별로 잘라 넣기 쉬움)
 */
export function formatDiffForLlm(files: IParsedDiffFile[]): string {
  return files
    .map((f) => {
      const header = `# File: ${f.toPath}`;
      const body = f.chunks.join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");
}
