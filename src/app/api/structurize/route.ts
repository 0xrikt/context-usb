import { NextResponse } from 'next/server';
import { buildStructurizePrompt } from '@/lib/engine/prompts';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { entries } = await request.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '服务端未配置 API Key' }, { status: 500 });
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: '没有可处理的数据' }, { status: 400 });
    }

    // 格式化条目为文本
    const entriesText = entries
      .slice(0, 100)
      .map(
        (e: { content: string; createdAt: string; source: string; tags?: string[] }) => {
          const tagStr = e.tags?.length ? ` [${e.tags.map((t) => '#' + t).join(' ')}]` : '';
          return `[${e.source} | ${e.createdAt?.slice(0, 10) || '未知日期'}]${tagStr}\n${e.content}`;
        }
      )
      .join('\n\n---\n\n');

    const prompt = buildStructurizePrompt(entriesText);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个 JSON 输出助手。只输出纯 JSON，不要包含 markdown 代码块标记或任何其他文本。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'API 调用失败';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: `${errorMessage}（${response.status}）` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'AI 返回了空内容' }, { status: 500 });
    }

    let parsed;
    try {
      const cleanJson = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        { error: 'AI 返回的格式无法解析，请重试', raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error('Structurize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理失败' },
      { status: 500 }
    );
  }
}
