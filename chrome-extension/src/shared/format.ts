// Standalone copy of generateCopyText from the web app
// Kept independent so the extension has no external dependencies

import type { ContextFile, ContextFileType } from "./types";

const CONTEXT_FILE_LABELS: Record<ContextFileType, string> = {
  identity: "关于我",
  interests: "我的兴趣",
  "growth-journal": "最近在想什么",
  relationships: "我的社交世界",
  goals: "我的目标",
  voice: "我的表达风格",
};

export function generateCopyText(
  files: ContextFile[],
  maxLength = 3000
): string {
  const visibleFiles = files
    .filter((f) => f.visibility === "public")
    .filter((f) => f.content && f.content.trim().length > 0);

  if (visibleFiles.length === 0) {
    return "";
  }

  const header = `以下是关于我的个人背景信息。请在后续对话中参考这些信息来了解我，给出更贴合我个人情况的回应。不需要复述这些信息，自然地融入你的回答即可。\n\n---\n\n`;

  let body = "";
  for (const file of visibleFiles) {
    const label = CONTEXT_FILE_LABELS[file.type] || file.type;
    body += `## ${label}\n\n${file.content}\n\n`;
  }

  let result = header + body;
  if (result.length > maxLength) {
    result = result.slice(0, maxLength - 20) + "\n\n[内容已截断]";
  }

  return result.trim();
}
