import type { IParsedDiffFile } from "@/types/lib/github";

interface IDiffContext {
  files: IParsedDiffFile[];
  maxCharsPerFile?: number;
  maxFiles?: number;
}

function diffContextSummary({
  files,
  maxCharsPerFile = 8000,
  maxFiles = 20,
}: IDiffContext): string {
  return files
    .slice(0, maxFiles)
    .map((item) => {
      const file = item.toPath.startsWith("b/")
        ? item.toPath.slice(2)
        : item.toPath;
      const body = item.chunks.join("\n").slice(0, maxCharsPerFile);

      return `# File: ${file}\n${body}`;
    })
    .join("\n\n");
}

export default diffContextSummary;
