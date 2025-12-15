import type { IDiffContextBuildResult } from "@/types/lib/github";

export function buildReviewDisclaimer(
  meta: IDiffContextBuildResult["meta"]
): string {
  const notes: string[] = [];

  if (meta.droppedFiles > 0) {
    notes.push(
      `- 파일 수 제한으로 ${meta.droppedFiles}개 파일은 리뷰에서 제외되었습니다. (maxFiles=${meta.maxFiles})`
    );
  }

  if (meta.truncatedFiles > 0) {
    notes.push(
      `- 일부 파일은 길이 제한으로 diff가 잘려서 리뷰되었습니다. (maxCharsPerFile=${meta.maxCharsPerFile})`
    );
  }

  if (notes.length === 0) return "";

  return ["### ⚠️ 리뷰 범위 안내", ...notes, ""].join("\n");
}
