# Context USB

> 让 AI 读懂你 — 中国互联网用户的个人上下文即插即用工具

## Project Overview

Context USB 从用户的"树洞"平台（flomo、Notion、微博等）提取个人上下文，用 DeepSeek 结构化为 6 个维度的个人画像，一键复制到豆包、DeepSeek、ChatGPT、Kimi 等 AI 对话工具。

**核心价值**: 设置一次，所有 AI 都懂你。

## Tech Stack

- **Framework**: Next.js 16 + TypeScript + Tailwind CSS
- **UI**: shadcn/ui (base-ui v5)
- **State**: Zustand with localStorage persist
- **LLM**: DeepSeek API (server-side key)
- **Deploy**: Vercel (Git Integration, auto-deploy on merge to main)
- **Domain**: context-usb.vercel.app

## Project Structure

```
src/
  app/
    page.tsx              # Main page (Landing + 3-tab layout)
    layout.tsx            # Root layout with Sonner toasts
    api/structurize/      # DeepSeek API proxy endpoint
  components/
    import-panel.tsx      # Data import (file upload + text paste)
    context-panel.tsx     # View/edit 6 context dimensions
    export-panel.tsx      # Copy context to clipboard
    settings-dialog.tsx   # Data management + privacy info
    ui/                   # shadcn/ui components
  lib/
    store.ts              # Zustand store (rawEntries + contextFiles)
    connectors/
      types.ts            # RawEntry, ContextFile types
      flomo-parser.ts     # Parse flomo HTML export
      text-parser.ts      # Parse pasted text
    engine/
      prompts.ts          # DeepSeek structurize prompts
    export/
      copy-text.ts        # Generate clipboard text
docs/
  PRD.md                  # Product requirements
  ARCHITECTURE.md         # Technical architecture
  DEV-GUIDE.md            # Development guide
  DATA-SOURCES.md         # Platform data source feasibility
```

## 6 Context Dimensions

| Type | Label | Icon |
|------|-------|------|
| identity | 关于我 | User |
| interests | 我的兴趣 | Sparkles |
| growth-journal | 最近在想什么 | BookOpen |
| relationships | 我的社交世界 | Users |
| goals | 我的目标 | Target |
| voice | 我的表达风格 | MessageCircle |

## Development

```bash
pnpm install
cp .env.example .env.local  # Set DEEPSEEK_API_KEY
pnpm dev
```

## Key Decisions

- **Local-first**: All user data in browser localStorage, no server persistence
- **Server-side API key**: DeepSeek key stored as Vercel env var, not BYOK
- **shadcn/ui v5**: Uses base-ui, `render={}` pattern instead of `asChild`
- **No Supabase yet**: MVP uses localStorage only; Supabase Auth planned for later
- **Chinese UI**: All user-facing text in Chinese

## GitHub

- Org: 0xrikt
- Repo: https://github.com/0xrikt/context-usb

## Roadmap

### Phase 0 (MVP) - DONE
- [x] flomo HTML parser
- [x] Text paste import
- [x] DeepSeek structurize API
- [x] 6-dimension context view/edit
- [x] Copy to clipboard export
- [x] Privacy-first localStorage

### Phase 1 (Next)
- [ ] MCP Server (Cloudflare Workers free tier)
- [ ] Browser extension (Chrome)
- [ ] Notion OAuth connector
- [ ] Supabase Auth (free tier)

### Phase 2 (Later)
- [ ] 印象笔记 API connector
- [ ] 微信读书 connector
- [ ] Context versioning
- [ ] Multi-device sync
