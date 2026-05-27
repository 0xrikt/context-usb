import * as cheerio from 'cheerio';
import type { RawEntry } from './types';

export function parseFlomoHTML(html: string): RawEntry[] {
  const $ = cheerio.load(html);
  const entries: RawEntry[] = [];

  // flomo 导出 HTML 的结构：每条 memo 是一个带日期和内容的块
  // 支持多种可能的 CSS class / 结构
  const memoSelectors = [
    '.memo',
    '.note',
    'article',
    '.item',
  ];

  let memoElements: ReturnType<typeof $> | null = null;
  for (const selector of memoSelectors) {
    const found = $(selector);
    if (found.length > 0) {
      memoElements = found;
      break;
    }
  }

  // 如果找不到结构化的 memo 元素，尝试按 <hr> 或 <br><br> 分割
  if (!memoElements || memoElements.length === 0) {
    return parseFlomoFallback(html);
  }

  memoElements.each((index, element) => {
    const $memo = $(element);

    // 提取时间——尝试多种选择器
    let timeText = '';
    const timeSelectors = ['.time', '.date', '.timestamp', 'time', 'span.time'];
    for (const sel of timeSelectors) {
      const found = $memo.find(sel).first().text().trim();
      if (found) {
        timeText = found;
        break;
      }
    }

    // 提取标签
    const tags: string[] = [];
    $memo.find('a, .tag').each((_, tagEl) => {
      const text = $(tagEl).text().trim();
      if (text.startsWith('#')) {
        tags.push(text.replace(/^#/, ''));
      }
    });

    // 提取内容文本
    const content = $memo.text().trim();
    if (!content || content.length < 2) return;

    entries.push({
      id: `flomo-${index}-${Date.now()}`,
      source: 'flomo',
      content: cleanContent(content, timeText),
      createdAt: parseDate(timeText),
      tags,
      metadata: {
        type: 'memo',
        wordCount: content.length,
      },
    });
  });

  return entries;
}

function parseFlomoFallback(html: string): RawEntry[] {
  // 回退方案：将整个 HTML 按段落分割
  const $ = cheerio.load(html);
  const entries: RawEntry[] = [];

  // 移除 script 和 style 标签
  $('script, style').remove();

  const bodyText = $('body').text();
  // 按空行分割
  const blocks = bodyText.split(/\n\s*\n/).filter(b => b.trim().length > 10);

  blocks.forEach((block, index) => {
    const content = block.trim();
    const tags: string[] = [];

    // 从内容中提取 #标签
    const tagMatches = content.match(/#[一-龥a-zA-Z0-9_]+/g);
    if (tagMatches) {
      tagMatches.forEach(t => tags.push(t.replace(/^#/, '')));
    }

    // 尝试从内容中提取日期
    const dateMatch = content.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);
    const dateStr = dateMatch ? dateMatch[1] : '';

    entries.push({
      id: `flomo-fb-${index}-${Date.now()}`,
      source: 'flomo',
      content: content.slice(0, 2000), // 限制长度
      createdAt: parseDate(dateStr),
      tags,
      metadata: {
        type: 'memo',
        wordCount: content.length,
      },
    });
  });

  return entries;
}

function cleanContent(content: string, timeText: string): string {
  // 从内容中移除时间戳（避免重复）
  let cleaned = content;
  if (timeText) {
    cleaned = cleaned.replace(timeText, '').trim();
  }
  // 规范化空白
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    // 处理中文日期格式
    const normalized = dateStr
      .replace(/年|月/g, '-')
      .replace(/日/g, '')
      .replace(/\//g, '-')
      .trim();
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
