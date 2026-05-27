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
    api/
      structurize/        # DeepSeek API proxy endpoint
      mcp/                # MCP Server endpoint (JSON-RPC 2.0)
  components/
    import-panel.tsx      # Data import (file upload + text paste)
    context-panel.tsx     # View/edit 6 context dimensions
    export-panel.tsx      # Copy context + MCP setup
    mcp-setup-card.tsx    # MCP Server enable/update/revoke UI
    settings-dialog.tsx   # Data management + privacy info
    ui/                   # shadcn/ui components
  lib/
    store.ts              # Zustand store (rawEntries + contextFiles + mcpToken)
    connectors/
      types.ts            # RawEntry, ContextFile types
      flomo-parser.ts     # Parse flomo HTML export
      text-parser.ts      # Parse pasted text
    engine/
      prompts.ts          # DeepSeek structurize prompts
    export/
      copy-text.ts        # Generate clipboard text
    mcp/
      handler.ts          # MCP JSON-RPC dispatcher
      tools.ts            # MCP tools (get_full_context, get_context_dimension, list_dimensions)
      types.ts            # MCP protocol types
    sync/
      storage.ts          # Self-contained token encode/decode (base64url)
      token.ts            # Token validation

chrome-extension/         # Manifest V3 Chrome extension
  manifest.json
  src/
    content-scripts/
      context-reader.ts   # Reads localStorage on context-usb domain
      injector.ts         # Injects context into AI chat inputs
    background/
      service-worker.ts   # Stores context, relays messages
    popup/
      popup.html          # Extension popup UI
      popup.ts            # Popup logic
    shared/
      types.ts, sites.ts, format.ts
  build.mjs               # esbuild build script
  generate-icons.mjs      # Icon generator
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

# Chrome extension
cd chrome-extension
npm install && npm run build
# Load chrome-extension/build/ as unpacked extension
```

## Key Technical Decisions

- **Local-first**: All user data in browser localStorage, no server persistence
- **Self-contained MCP tokens**: Context encoded as base64url in the URL, no server-side storage needed. Supports Chinese characters via TextEncoder/TextDecoder.
- **Server-side API key**: DeepSeek key stored as Vercel env var, not BYOK
- **shadcn/ui v5**: Uses base-ui, `render={}` pattern instead of `asChild`
- **No Supabase yet**: MVP uses localStorage only; Supabase Auth planned for later
- **Chinese UI**: All user-facing text in Chinese

## MCP Server

Self-contained MCP endpoint. Context is encoded in the token parameter:

```
POST /api/mcp?token=<base64url-encoded-context>
```

Supports: `initialize`, `tools/list`, `tools/call` (JSON-RPC 2.0)

Three tools: `get_full_context`, `get_context_dimension`, `list_dimensions`

Claude Desktop config:
```json
{
  "mcpServers": {
    "context-usb": {
      "url": "https://context-usb.vercel.app/api/mcp?token=<TOKEN>"
    }
  }
}
```

## Chrome Extension

Manifest V3 extension supporting:
- **Auto-sync**: Reads localStorage from context-usb.vercel.app automatically
- **One-click inject**: Injects context into AI chat inputs
- **Supported sites**: ChatGPT, DeepSeek, Kimi, Doubao
- **Fallback**: Copies to clipboard if injection fails

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

### Phase 1 - IN PROGRESS
- [x] MCP Server (self-contained tokens on Vercel)
- [x] Browser extension (Chrome, built, needs user testing)
- [ ] Notion OAuth connector
- [ ] Supabase Auth (free tier)

### Phase 2 (Later)
- [ ] 印象笔记 API connector
- [ ] 微信读书 connector
- [ ] Context versioning
- [ ] Multi-device sync
