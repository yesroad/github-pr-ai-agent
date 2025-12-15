import type {
  DiffContextBuildResult,
  IParsedDiffFile,
} from "@/types/lib/github";

interface IDiffContext {
  files: IParsedDiffFile[];
  maxCharsPerFile?: number;
  maxFiles?: number;
}

/**
 * @description 전체 요약 리뷰용 diff 컨텍스트 생성 (큰 PR 안전장치 포함)
 * - 파일 수 제한
 * - 파일당 문자 수 제한
 * - 제한 적용 여부(meta)를 함께 반환
 */
function diffContextSummary({
  files,
  maxCharsPerFile = 8000,
  maxFiles = 20,
}: IDiffContext): DiffContextBuildResult {
  const selected = files.slice(0, maxFiles);
  const droppedFiles = Math.max(files.length - selected.length, 0);

  let totalChars = 0;
  let truncatedFiles = 0;

  const context = selected
    .map((item) => {
      const file = item.toPath.startsWith("b/")
        ? item.toPath.slice(2)
        : item.toPath;

      const full = item.chunks.join("\n");
      const body = full.slice(0, maxCharsPerFile);

      if (full.length > body.length) truncatedFiles += 1;

      const chunk = `# File: ${file}\n${body}`;
      totalChars += chunk.length;

      return chunk;
    })
    .join("\n\n");

  return {
    context,
    meta: {
      maxFiles,
      maxCharsPerFile,
      totalChars,
      usedFiles: selected.length,
      truncatedFiles,
      droppedFiles,
    },
  };
}

export default diffContextSummary;
