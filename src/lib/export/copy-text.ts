import type { ContextFile } from '../connectors/types';
import { CONTEXT_FILE_LABELS } from '../connectors/types';

interface CopyOptions {
  maxLength?: number;
  includeHidden?: boolean;
}

export function generateCopyText(
  files: ContextFile[],
  options: CopyOptions = {}
): string {
  const { maxLength = 3000, includeHidden = false } = options;

  const visibleFiles = files.filter((f) => {
    if (f.visibility === 'hidden') return includeHidden;
    if (f.visibility === 'private') return false;
    return true;
  }).filter((f) => f.content && f.content.trim().length > 0);

  if (visibleFiles.length === 0) {
    return '';
  }

  const header = `以下是关于我的个人背景信息。请在后续对话中参考这些信息来了解我，给出更贴合我个人情况的回应。不需要复述这些信息，自然地融入你的回答即可。\n\n---\n\n`;

  let body = '';
  for (const file of visibleFiles) {
    const label = CONTEXT_FILE_LABELS[file.type] || file.type;
    body += `## ${label}\n\n${file.content}\n\n`;
  }

  let result = header + body;
  if (result.length > maxLength) {
    result = result.slice(0, maxLength - 20) + '\n\n[内容已截断]';
  }

  return result.trim();
}
