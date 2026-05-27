# Context USB — 开发指导文档

> 版本：0.1
> 日期：2026-05-27
> 面向：开发者（1-2 人独立团队）

---

## 快速开始

### 前置条件

```bash
# Node.js 20+
node -v

# pnpm (推荐)
npm install -g pnpm

# Supabase CLI
brew install supabase/tap/supabase

# Vercel CLI
npm install -g vercel
```

### 项目初始化

```bash
# 创建 Next.js 项目
pnpm create next-app context-usb --typescript --tailwind --app --src-dir

# 安装核心依赖
cd context-usb
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add dexie dexie-react-hooks          # IndexedDB
pnpm add react-markdown remark-gfm        # Markdown 渲染
pnpm add zustand                           # 状态管理
pnpm add cheerio                           # HTML 解析（flomo 导出）
pnpm add ai @ai-sdk/openai-compatible     # Vercel AI SDK（DeepSeek 调用）
pnpm add zod                               # Schema 验证
pnpm add lucide-react                      # 图标

# 安装 shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog input label tabs textarea toast progress badge
```

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# DeepSeek API
DEEPSEEK_API_KEY=xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Notion OAuth（Phase 1）
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
NOTION_REDIRECT_URI=https://contextusb.com/api/notion/callback

# 印象笔记（Phase 1）
EVERNOTE_CONSUMER_KEY=xxx
EVERNOTE_CONSUMER_SECRET=xxx
```

---

## 项目结构

```
context-usb/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # 根布局
│   │   ├── page.tsx                # 首页（Landing）
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── dashboard/              # 主界面
│   │   │   ├── page.tsx            # 上下文总览
│   │   │   ├── import/page.tsx     # 数据导入
│   │   │   ├── context/[type]/page.tsx  # 单个上下文文件查看/编辑
│   │   │   └── export/page.tsx     # 输出/导出
│   │   └── api/
│   │       ├── structurize/route.ts    # LLM 结构化 API
│   │       ├── notion/
│   │       │   ├── auth/route.ts       # Notion OAuth
│   │       │   └── callback/route.ts
│   │       └── mcp/route.ts            # MCP Server 端点
│   │
│   ├── lib/
│   │   ├── connectors/             # 数据源连接器
│   │   │   ├── types.ts            # RawEntry 类型定义
│   │   │   ├── flomo-parser.ts     # flomo HTML 解析
│   │   │   ├── notion-connector.ts # Notion API 连接
│   │   │   ├── evernote-connector.ts
│   │   │   ├── markdown-parser.ts
│   │   │   └── text-parser.ts
│   │   │
│   │   ├── engine/                 # 上下文结构化引擎
│   │   │   ├── chunker.ts          # 分块
│   │   │   ├── extractor.ts        # 信息提取（LLM）
│   │   │   ├── aggregator.ts       # 聚合合并
│   │   │   ├── generator.ts        # 生成上下文文件
│   │   │   ├── prompts.ts          # LLM Prompt 模板
│   │   │   └── pipeline.ts         # 完整 pipeline 编排
│   │   │
│   │   ├── store/                  # 状态管理
│   │   │   ├── context-store.ts    # Zustand store
│   │   │   └── db.ts              # Dexie.js IndexedDB
│   │   │
│   │   ├── export/                 # 上下文输出
│   │   │   ├── copy-text.ts        # 生成复制文本
│   │   │   ├── mcp-handler.ts      # MCP Server 处理
│   │   │   └── compress.ts         # 上下文压缩
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   │
│   │   └── utils/
│   │       ├── markdown.ts
│   │       └── sanitize.ts
│   │
│   └── components/
│       ├── ui/                     # shadcn/ui 组件
│       ├── import/
│       │   ├── file-upload.tsx
│       │   ├── text-paste.tsx
│       │   ├── notion-connect.tsx
│       │   └── import-progress.tsx
│       ├── context/
│       │   ├── context-card.tsx
│       │   ├── context-editor.tsx
│       │   ├── context-preview.tsx
│       │   ├── source-trace.tsx
│       │   └── visibility-toggle.tsx
│       ├── export/
│       │   ├── copy-button.tsx
│       │   ├── mcp-setup.tsx
│       │   └── export-options.tsx
│       └── layout/
│           ├── sidebar.tsx
│           ├── header.tsx
│           └── onboarding.tsx
│
├── extension/                      # Chrome 扩展（Phase 1）
│   ├── manifest.json
│   ├── background.ts
│   ├── content-scripts/
│   │   ├── doubao.ts
│   │   ├── deepseek.ts
│   │   └── chatgpt.ts
│   └── popup/
│       └── index.tsx
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 001_initial.sql
│
└── mcp-server/                     # MCP Server（Phase 1）
    ├── src/
    │   └── index.ts
    └── wrangler.toml               # Cloudflare Workers 配置
```

---

## 核心实现指南

### 1. flomo HTML 解析器

flomo 的 HTML 导出格式比较规整，每条 memo 是一个 `<div class="memo">` 块。

```typescript
// src/lib/connectors/flomo-parser.ts

import * as cheerio from 'cheerio';
import type { RawEntry } from './types';

export function parseFlomoHTML(html: string): RawEntry[] {
  const $ = cheerio.load(html);
  const entries: RawEntry[] = [];

  // flomo 导出的 HTML 结构：
  // <div class="memo">
  //   <div class="time">2026-01-15 14:30</div>
  //   <div class="content">
  //     <p>今天读了《原则》...</p>
  //     <p class="tag">#读书笔记 #个人成长</p>
  //   </div>
  // </div>
  //
  // 注意：实际结构可能有变化，需要拿到真实导出文件后微调选择器。
  // 以下为基于公开信息的最佳猜测实现。

  $('.memo').each((index, element) => {
    const $memo = $(element);
    const timeText = $memo.find('.time').text().trim();
    const contentEl = $memo.find('.content');

    // 提取标签
    const tags: string[] = [];
    contentEl.find('.tag, a[href*="tag"]').each((_, tagEl) => {
      const tagText = $(tagEl).text().trim().replace(/^#/, '');
      if (tagText) tags.push(tagText);
    });

    // 提取纯文本内容（去掉标签）
    const content = contentEl.text().trim();

    if (!content) return;

    entries.push({
      id: `flomo-${index}-${Date.now()}`,
      source: 'flomo',
      content,
      createdAt: parseFlomoDate(timeText),
      tags,
      metadata: {
        type: 'memo',
        wordCount: content.length,
      },
    });
  });

  return entries;
}

function parseFlomoDate(dateStr: string): string {
  // flomo 日期格式：2026-01-15 14:30 或类似
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}
```

**重要提醒**：上面的选择器基于公开信息推测。实际开发时需要拿到一份真实的 flomo HTML 导出文件来校准选择器。建议第一步就让自己导出一份 flomo 数据来测试。

### 2. LLM 结构化 Prompt 设计

```typescript
// src/lib/engine/prompts.ts

export const EXTRACTION_PROMPT = `你是一个个人上下文分析师。你的任务是从用户的个人记录中提取关于用户的关键信息。

## 输入
用户的一批个人记录（可能来自笔记应用、社交媒体、日记等）。

## 输出要求
请从以下 6 个维度分析这些记录，输出 JSON 格式：

{
  "identity": {
    "traits": ["性格特征1", "性格特征2"],
    "values": ["价值观1", "价值观2"],
    "life_stage": "当前人生阶段描述",
    "evidence": ["支持证据（原文摘录）"]
  },
  "interests": {
    "reading": ["近期在读/喜欢的书"],
    "topics": ["持续关注的话题"],
    "aesthetic": "审美偏好描述",
    "evidence": ["支持证据"]
  },
  "growth_journal": {
    "recent_thoughts": ["近期的核心思考"],
    "emotional_state": "近期情绪基调",
    "challenges": ["面对的挑战/困惑"],
    "breakthroughs": ["近期的领悟/突破"],
    "evidence": ["支持证据"]
  },
  "relationships": {
    "important_people": ["提到的重要人物及关系"],
    "social_patterns": "社交模式描述",
    "evidence": ["支持证据"]
  },
  "goals": {
    "short_term": ["短期目标"],
    "long_term": ["长期愿景"],
    "dilemmas": ["纠结的决定"],
    "evidence": ["支持证据"]
  },
  "voice": {
    "style": "表达风格描述",
    "common_expressions": ["常用表达/口头禅"],
    "humor_type": "幽默类型",
    "evidence": ["支持证据"]
  }
}

## 重要规则
1. 只提取有明确证据支持的信息，不要推测
2. evidence 字段必须引用原文（精确摘录 10-30 字）
3. 如果某个维度信息不足，该字段留空数组或"信息不足"
4. 注意时间维度：区分"过去想法"和"当前状态"
5. 如果记录中有矛盾（如先说想做A后说想做B），如实标记为矛盾/纠结

## 用户记录
---
{entries}
---`;

export const AGGREGATION_PROMPT = `你是一个个人上下文编辑。你的任务是将多个分析结果合并为一份完整、无重复的个人画像。

## 输入
多批提取结果（JSON 格式），来自用户的不同时间段或不同数据源。

## 合并规则
1. 相同信息去重（如"喜欢读书"只保留一次，但附上最丰富的证据）
2. 矛盾信息保留两面并标注时间（如"1月想跳槽 → 3月想留下"）
3. 时间越近的信息权重越高（标注为"近期"vs"早期"）
4. 不同数据源的信息交叉验证增强置信度
5. 保留所有证据溯源

## 之前的提取结果
---
{extraction_results}
---

请输出合并后的 JSON。`;

export const GENERATION_PROMPT = `你是用户的"个人上下文代笔人"。根据下面的结构化数据，为用户生成一份 Markdown 格式的个人上下文文件。

## 要求
1. 用第三人称描述（"这位用户..."），因为这份文件是给 AI 读的
2. 自然、流畅、具体——不要用列表堆砌，要像一段段有温度的描述
3. 每段重要描述后附上 [来源: {source}, {date}] 的溯源标记
4. 长度控制在 300-800 字
5. 开头用一句话总结这个维度的核心印象

## 文件类型：{file_type}

## 结构化数据
---
{aggregated_data}
---

请输出 Markdown 格式的上下文文件内容。`;
```

### 3. 结构化 Pipeline 实现

```typescript
// src/lib/engine/pipeline.ts

import { chunk } from './chunker';
import { extract } from './extractor';
import { aggregate } from './aggregator';
import { generate } from './generator';
import type { RawEntry } from '../connectors/types';
import type { ContextFile } from './types';

const CONTEXT_FILE_TYPES = [
  'identity',
  'interests',
  'growth-journal',
  'relationships',
  'goals',
  'voice',
] as const;

export async function structurize(
  entries: RawEntry[],
  onProgress?: (step: string, progress: number) => void
): Promise<ContextFile[]> {

  // Step 1: 分块（每块 ~2000 字 / ~30 条 memo）
  onProgress?.('分块处理中...', 0.1);
  const chunks = chunk(entries, { maxCharsPerChunk: 4000, maxEntriesPerChunk: 30 });

  // Step 2: 逐块提取
  onProgress?.('AI 正在阅读你的记录...', 0.2);
  const extractions = [];
  for (let i = 0; i < chunks.length; i++) {
    const result = await extract(chunks[i]);
    extractions.push(result);
    onProgress?.(
      `AI 正在阅读你的记录... (${i + 1}/${chunks.length})`,
      0.2 + (0.4 * (i + 1) / chunks.length)
    );
  }

  // Step 3: 聚合
  onProgress?.('正在整合分析结果...', 0.7);
  const aggregated = await aggregate(extractions);

  // Step 4: 生成上下文文件
  onProgress?.('正在生成你的个人上下文...', 0.85);
  const contextFiles: ContextFile[] = [];

  for (const type of CONTEXT_FILE_TYPES) {
    const content = await generate(type, aggregated[type]);
    contextFiles.push({
      id: `ctx-${type}-${Date.now()}`,
      type,
      content,
      version: 1,
      updatedAt: new Date().toISOString(),
      sources: aggregated[type]?.evidence ?? [],
      visibility: type === 'relationships' ? 'private' : 'public', // 默认关系信息为私密
    });
  }

  onProgress?.('完成！', 1.0);
  return contextFiles;
}
```

### 4. DeepSeek API 调用

```typescript
// src/app/api/structurize/route.ts

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject } from 'ai';
import { z } from 'zod';
import { EXTRACTION_PROMPT } from '@/lib/engine/prompts';

const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: process.env.DEEPSEEK_BASE_URL!,
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function POST(request: Request) {
  const { entries, step } = await request.json();

  // 验证输入
  if (!entries || !Array.isArray(entries)) {
    return Response.json({ error: 'Invalid entries' }, { status: 400 });
  }

  // 限制单次处理量
  if (entries.length > 50) {
    return Response.json({ error: 'Too many entries, max 50 per batch' }, { status: 400 });
  }

  const entriesText = entries
    .map((e: { content: string; createdAt: string; source: string }) =>
      `[${e.source} | ${e.createdAt}]\n${e.content}`
    )
    .join('\n---\n');

  const prompt = EXTRACTION_PROMPT.replace('{entries}', entriesText);

  const result = await generateObject({
    model: deepseek('deepseek-chat'),
    prompt,
    schema: ExtractionSchema,  // Zod schema 定义输出结构
    temperature: 0.3,          // 低温度保证一致性
  });

  return Response.json(result.object);
}

// Zod Schema 定义（确保 LLM 输出结构正确）
const ExtractionSchema = z.object({
  identity: z.object({
    traits: z.array(z.string()),
    values: z.array(z.string()),
    life_stage: z.string(),
    evidence: z.array(z.string()),
  }),
  interests: z.object({
    reading: z.array(z.string()),
    topics: z.array(z.string()),
    aesthetic: z.string(),
    evidence: z.array(z.string()),
  }),
  growth_journal: z.object({
    recent_thoughts: z.array(z.string()),
    emotional_state: z.string(),
    challenges: z.array(z.string()),
    breakthroughs: z.array(z.string()),
    evidence: z.array(z.string()),
  }),
  relationships: z.object({
    important_people: z.array(z.string()),
    social_patterns: z.string(),
    evidence: z.array(z.string()),
  }),
  goals: z.object({
    short_term: z.array(z.string()),
    long_term: z.array(z.string()),
    dilemmas: z.array(z.string()),
    evidence: z.array(z.string()),
  }),
  voice: z.object({
    style: z.string(),
    common_expressions: z.array(z.string()),
    humor_type: z.string(),
    evidence: z.array(z.string()),
  }),
});
```

### 5. IndexedDB 本地存储

```typescript
// src/lib/store/db.ts

import Dexie, { type EntityTable } from 'dexie';
import type { RawEntry } from '../connectors/types';

interface ContextFileRecord {
  id: string;
  type: string;
  content: string;
  version: number;
  updatedAt: string;
  sources: string;        // JSON 序列化的 SourceRef[]
  visibility: string;
}

const db = new Dexie('ContextUSB') as Dexie & {
  rawEntries: EntityTable<RawEntry, 'id'>;
  contextFiles: EntityTable<ContextFileRecord, 'id'>;
};

db.version(1).stores({
  rawEntries: 'id, source, createdAt, *tags',
  contextFiles: 'id, type, updatedAt',
});

export { db };
```

### 6. 一键复制功能

```typescript
// src/lib/export/copy-text.ts

import type { ContextFile } from '../engine/types';

interface CopyOptions {
  maxLength?: number;      // 最大字数，默认 2000
  includeTypes?: string[]; // 包含哪些上下文文件，默认全部 public
  style?: 'full' | 'brief'; // 完整版 vs 精简版
}

export function generateCopyText(
  files: ContextFile[],
  options: CopyOptions = {}
): string {
  const {
    maxLength = 2000,
    style = 'full',
  } = options;

  // 只包含可见的文件
  const visibleFiles = files.filter(f => f.visibility === 'public');

  const header = `以下是关于我的个人背景信息。请在后续对话中参考这些信息，给出更贴合我个人情况的回应。不需要复述这些信息，只需自然地融入你的回答中。\n\n---\n\n`;

  const fileLabels: Record<string, string> = {
    'identity': '## 关于我',
    'interests': '## 我的兴趣',
    'growth-journal': '## 我最近在想什么',
    'relationships': '## 我的社交世界',
    'goals': '## 我的目标',
    'voice': '## 我的表达风格',
  };

  let body = '';
  for (const file of visibleFiles) {
    const label = fileLabels[file.type] ?? `## ${file.type}`;
    body += `${label}\n\n${file.content}\n\n`;
  }

  // 如果超长，截断（保留开头和结尾）
  let result = header + body;
  if (result.length > maxLength) {
    // 优先保留 identity 和 growth-journal
    const priorityFiles = visibleFiles.filter(
      f => f.type === 'identity' || f.type === 'growth-journal'
    );
    body = '';
    for (const file of priorityFiles) {
      const label = fileLabels[file.type] ?? `## ${file.type}`;
      body += `${label}\n\n${file.content}\n\n`;
    }
    result = header + body;

    if (result.length > maxLength) {
      result = result.slice(0, maxLength - 3) + '...';
    }
  }

  return result;
}
```

---

## 数据库设计 (Supabase)

```sql
-- supabase/migrations/001_initial.sql

-- 用户元数据（实际上下文数据存在本地 IndexedDB）
create table public.users_meta (
  id uuid references auth.users(id) primary key,
  display_name text,
  connected_sources text[] default '{}',  -- ['notion', 'flomo', 'evernote']
  context_version integer default 0,
  last_sync_at timestamptz,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MCP Token 管理
create table public.mcp_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  token_hash text not null,              -- SHA256(token)
  name text default 'default',           -- 用户自定义名称
  scopes text[] default '{"read"}',      -- 权限范围
  expires_at timestamptz not null,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- 云端上下文备份（可选，用户主动开启）
create table public.context_backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  context_type text not null,            -- identity/interests/etc.
  content_encrypted text not null,       -- AES-256 加密的内容
  version integer not null,
  created_at timestamptz default now()
);

-- RLS 策略
alter table public.users_meta enable row level security;
alter table public.mcp_tokens enable row level security;
alter table public.context_backups enable row level security;

create policy "users_meta_own" on public.users_meta
  for all using (auth.uid() = id);

create policy "mcp_tokens_own" on public.mcp_tokens
  for all using (auth.uid() = user_id);

create policy "context_backups_own" on public.context_backups
  for all using (auth.uid() = user_id);
```

---

## 浏览器扩展实现要点（Phase 1）

### 注入策略

不同 AI 工具的页面结构不同，需要分别适配：

```typescript
// extension/content-scripts/doubao.ts

// 豆包的输入框选择器（需实际抓取验证）
const DOUBAO_SELECTORS = {
  inputBox: 'textarea[data-testid="chat-input"]',   // 需验证
  sendButton: 'button[data-testid="send-button"]',   // 需验证
  newChatButton: 'button[aria-label="新对话"]',       // 需验证
};

// 监听新对话创建
const observer = new MutationObserver((mutations) => {
  // 检测新对话页面加载
  // 自动在输入框前插入上下文
});
```

### 扩展架构

```
extension/
├── manifest.json           # Manifest V3
├── background.ts           # Service Worker：管理存储、MCP 通信
├── content-scripts/
│   ├── injector.ts         # 通用注入逻辑
│   ├── site-configs/       # 各站点的选择器配置
│   │   ├── doubao.ts
│   │   ├── deepseek.ts
│   │   ├── chatgpt.ts
│   │   └── kimi.ts
│   └── ui/
│       ├── sidebar.tsx     # 侧边栏（显示上下文摘要）
│       └── inject-button.tsx # 注入按钮
├── popup/
│   └── index.tsx           # 弹出页面（快速设置）
└── options/
    └── index.tsx           # 选项页面（管理上下文、连接账户）
```

---

## 测试策略

### Phase 0 测试重点

| 测试项 | 方法 | 通过标准 |
|--------|------|---------|
| flomo 解析器 | 用真实导出文件做单元测试 | 解析出的 memo 数量与原文一致 |
| LLM 结构化 | 用 5 份不同风格的样本测试 | 生成的上下文与人工判断一致度 >80% |
| 复制粘贴体验 | 手动测试：复制 → 粘贴到豆包 | AI 的回应明显引用了上下文 |
| 端到端流程 | 从上传到复制的完整流程 | 5 分钟内完成 |

### 质量保障

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm tsc --noEmit

# 单元测试
pnpm vitest run

# 关键测试文件
src/lib/connectors/__tests__/flomo-parser.test.ts
src/lib/engine/__tests__/pipeline.test.ts
src/lib/export/__tests__/copy-text.test.ts
```

---

## 部署流程

### Vercel 部署

```bash
# 首次部署
vercel link
vercel env add DEEPSEEK_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 后续：push to main → 自动部署
git push origin main
```

### Supabase 设置

```bash
# 本地开发
supabase start
supabase db reset

# 部署到生产
supabase link --project-ref xxx
supabase db push
```

### MCP Server 部署（Cloudflare Workers）

```bash
cd mcp-server
npx wrangler deploy
```

---

## 成本估算（MVP 阶段）

| 项目 | 月费用 | 备注 |
|------|--------|------|
| Vercel | $0 | Hobby plan，足够 MVP |
| Supabase | $0 | Free plan（500MB 数据库，1GB 存储） |
| DeepSeek API | ~¥60 | 按 500 用户 × ¥0.12/次计算 |
| 域名 | ~$12/年 | contextusb.com |
| Cloudflare Workers | $0 | Free plan（10 万次/天） |
| **总计** | **~¥60/月** | 极低启动成本 |

---

## 开发 Checklist — Phase 0（2 周）

### 第 1 周：基础框架 + 核心引擎

- [ ] Day 1-2：项目初始化 + Supabase 设置 + 基础认证
- [ ] Day 3：flomo HTML 解析器（拿真实导出文件测试）
- [ ] Day 4-5：LLM 结构化 pipeline（Prompt 调试是重点）
- [ ] Day 5：上下文预览页面

### 第 2 周：完整体验 + 部署

- [ ] Day 6-7：数据导入界面（文件上传 + 文本粘贴）
- [ ] Day 8：上下文管理界面（查看/编辑/可见性）
- [ ] Day 9：一键复制 + 输出优化
- [ ] Day 10：部署 + Landing Page + 冒烟测试

### 验收标准

上传一份 flomo 导出 → 等待 30-90 秒 → 看到 6 个上下文文件 → 一键复制 → 粘贴到豆包 → AI 的回应明显体现个人化。
