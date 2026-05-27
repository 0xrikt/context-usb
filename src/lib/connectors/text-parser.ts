import type { RawEntry } from './types';

export function parseText(text: string, source: 'paste' | 'file' = 'paste'): RawEntry[] {
  if (!text || text.trim().length < 5) return [];

  // 按空行分割成段落
  const blocks = text
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(b => b.length > 5);

  if (blocks.length === 0) {
    // 单段文本
    return [createEntry(text.trim(), 0, source)];
  }

  return blocks.map((block, i) => createEntry(block, i, source));
}

function createEntry(
  content: string,
  index: number,
  source: 'paste' | 'file'
): RawEntry {
  const tags: string[] = [];
  const tagMatches = content.match(/#[一-龥a-zA-Z0-9_]+/g);
  if (tagMatches) {
    tagMatches.forEach(t => tags.push(t.replace(/^#/, '')));
  }

  // 尝试提取日期
  const dateMatch = content.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);

  return {
    id: `${source}-${index}-${Date.now()}`,
    source,
    content: content.slice(0, 3000),
    createdAt: dateMatch ? tryParseDate(dateMatch[1]) : new Date().toISOString(),
    tags,
    metadata: {
      type: 'text',
      wordCount: content.length,
    },
  };
}

function tryParseDate(str: string): string {
  try {
    const d = new Date(str.replace(/\//g, '-'));
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
