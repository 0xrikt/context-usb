# Context USB — 技术架构文档

> 版本：0.1 MVP
> 日期：2026-05-27

---

## 架构原则

1. **本地优先**：用户数据默认存储在本地，云端为可选备份
2. **LLM 驱动结构化**：用 LLM 做"理解"，不是用规则做"分类"
3. **输出即产品**：上下文的输出方式（复制/MCP/扩展）是核心体验，不是附属功能
4. **最小可行安全**：MVP 不碰密码、不存 API key 在服务端、不跨境传输

---

## 系统总览

```
┌─────────────────────────────────────────────────────────┐
│                     用户触达层                            │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Web App  │  │ 浏览器扩展    │  │  MCP Server       │  │
│  │ (Next.js) │  │ (Chrome Ext) │  │ (HTTP Transport)  │  │
│  └─────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│        │               │                   │              │
│        └───────────────┼───────────────────┘              │
│                        ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              上下文引擎 (Context Engine)              │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │  │
│  │  │ 数据导入  │  │ 结构化处理 │  │ 上下文管理/输出   │ │  │
│  │  │ Pipeline │  │ (LLM)     │  │ (CRUD + Export)  │ │  │
│  │  └──────────┘  └───────────┘  └──────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                        │                                  │
│  ┌─────────────────────┼───────────────────────────────┐  │
│  │              数据连接层 (Connectors)                   │  │
│  │  ┌────────┐ ┌──────┐ ┌────────┐ ┌───────┐ ┌─────┐ │  │
│  │  │ Notion │ │flomo │ │印象笔记 │ │微信读书│ │ 文件│ │  │
│  │  │  API   │ │Parser│ │  API   │ │Reverse│ │Upload│ │  │
│  │  └────────┘ └──────┘ └────────┘ └───────┘ └─────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                        │                                  │
│  ┌─────────────────────┼───────────────────────────────┐  │
│  │              存储层                                    │  │
│  │  ┌────────────────┐  ┌─────────────────────────────┐│  │
│  │  │ 本地存储        │  │ 云端存储（可选）              ││  │
│  │  │ IndexedDB/      │  │ Supabase                    ││  │
│  │  │ localStorage    │  │ (Postgres + Auth + Storage) ││  │
│  │  └────────────────┘  └─────────────────────────────┘│  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 技术栈选型

### 前端

| 组件 | 选型 | 理由 |
|------|------|------|
| 框架 | **Next.js 15 (App Router)** | SSR + API Routes 一体化，Vercel 部署方便 |
| UI | **Tailwind CSS + shadcn/ui** | 快速开发，组件质量高 |
| 状态管理 | **Zustand** | 轻量、TypeScript 友好 |
| 本地存储 | **IndexedDB (via Dexie.js)** | 结构化本地存储，支持大量数据 |
| Markdown 渲染 | **react-markdown + remark** | 上下文文件预览 |

### 后端

| 组件 | 选型 | 理由 |
|------|------|------|
| API | **Next.js API Routes / Server Actions** | 与前端同项目，开发效率高 |
| 认证 | **Supabase Auth** | 邮箱 + 微信登录，自带 JWT |
| 数据库 | **Supabase (PostgreSQL)** | 用户账户 + 元数据；原始上下文数据存本地 |
| 文件存储 | **Supabase Storage** | 用户上传的导出文件暂存 |
| LLM | **DeepSeek API** | 性价比最高的中文 LLM，结构化任务表现好 |

### 浏览器扩展

| 组件 | 选型 | 理由 |
|------|------|------|
| 框架 | **Plasmo** | Chrome 扩展开发框架，支持 React + TypeScript |
| 注入方式 | **Content Script** | 在豆包/DeepSeek/ChatGPT 页面注入上下文 |

### MCP Server

| 组件 | 选型 | 理由 |
|------|------|------|
| 协议 | **MCP HTTP Transport** | 标准协议，兼容 Claude/Cursor/Kimi Code |
| 部署 | **Cloudflare Workers** | 边缘部署，低延迟，免费额度 |

---

## 核心模块设计

### 模块 1：数据导入 Pipeline

```
用户数据 → Connector → 原始数据规范化 → 存储

Connectors:
├── FileConnector        # 解析上传的文件
│   ├── FlomoHTMLParser  # 解析 flomo 导出的 HTML
│   ├── MarkdownParser   # 解析 Markdown 文件
│   ├── WeiboExportParser # 解析 stablog/Chrome 扩展导出
│   └── PlainTextParser  # 纯文本
├── NotionConnector      # Notion OAuth → API 读取
├── EvernoteConnector    # 印象笔记 API 读取
└── PasteConnector       # 用户粘贴的文本
```

**规范化数据格式**（所有 Connector 输出统一格式）：

```typescript
interface RawEntry {
  id: string;
  source: 'flomo' | 'notion' | 'evernote' | 'weibo' | 'paste' | 'file';
  content: string;          // 原始文本内容
  createdAt: string;        // ISO 8601
  updatedAt?: string;
  tags?: string[];           // 原始标签
  metadata: {
    url?: string;            // 原始链接
    title?: string;          // 标题（如有）
    type?: string;           // memo/page/note/status
    wordCount: number;
  };
}
```

### 模块 2：上下文结构化引擎

这是产品的核心——用 LLM 把原始数据"读懂"并结构化为个人上下文。

**处理流程**：

```
原始数据（RawEntry[]）
    │
    ▼
┌─────────────────────┐
│ Step 1: 分块         │  按时间/主题分成可消化的块（每块 ~2000 字）
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Step 2: 提取         │  LLM 从每个块中提取结构化信息
│  - 人格特征          │  （prompt: "从这些记录中提取关于用户的..."）
│  - 兴趣爱好          │
│  - 情绪状态          │
│  - 目标/困惑         │
│  - 表达风格          │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Step 3: 聚合         │  跨块合并、去重、解决矛盾
│  - 同主题合并        │  （多条关于读书的记录 → 一段阅读偏好描述）
│  - 时间加权          │  （近期记录权重更高）
│  - 矛盾标记          │  （1月说想跳槽，3月说想留下 → 标记为"纠结中"）
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Step 4: 生成文件      │  生成 6 个上下文 Markdown 文件
│  identity.md         │
│  interests.md        │
│  growth-journal.md   │
│  relationships.md    │
│  goals.md            │
│  voice.md            │
└─────────────────────┘
```

**LLM 选型与成本**：

| 任务 | 模型 | 预估 token/用户 | 成本/用户 |
|------|------|----------------|----------|
| 提取 | DeepSeek-V3 | ~50K input + ~5K output | ~¥0.07 |
| 聚合 | DeepSeek-V3 | ~20K input + ~3K output | ~¥0.03 |
| 生成 | DeepSeek-V3 | ~10K input + ~5K output | ~¥0.02 |
| **总计** | | | **~¥0.12/用户/次** |

DeepSeek-V3 定价：输入 ¥1/百万 token，输出 ¥2/百万 token（缓存命中更低）。极具成本优势。

### 模块 3：上下文管理

```typescript
interface ContextFile {
  id: string;
  type: 'identity' | 'interests' | 'growth-journal' | 'relationships' | 'goals' | 'voice';
  content: string;          // Markdown 格式
  version: number;          // 版本号
  updatedAt: string;
  sources: SourceRef[];      // 引用的原始数据
  visibility: 'public' | 'private' | 'hidden';  // 输出时的可见性
}

interface SourceRef {
  entryId: string;
  source: string;
  excerpt: string;          // 原文摘录（用于溯源）
  confidence: number;       // 0-1 置信度
}
```

**用户操作**：
- 查看每个上下文文件的内容
- 编辑/修改任意内容（用户的修改优先级最高）
- 切换每个文件的可见性
- 查看每条信息的来源溯源
- 触发增量更新（有新数据时）

### 模块 4：上下文输出

**4a. 复制粘贴（P0）**

```typescript
function generateCopyText(files: ContextFile[], options: ExportOptions): string {
  // 将选中的上下文文件合并为一段文本
  // 开头加提示词："以下是关于我的个人背景，请在对话中参考："
  // 根据 visibility 过滤
  // 压缩到合理长度（默认 2000 字，可调）
  // 输出纯文本
}
```

**4b. MCP Server（P1）**

```
MCP Server 端点：https://mcp.contextusb.com/

Tools:
├── get_user_context     # 获取完整上下文（尊重 visibility 设置）
├── get_context_file     # 获取单个上下文文件
├── search_context       # 在上下文中搜索特定信息
└── get_context_summary  # 获取精简版上下文（省 token）

认证：JWT Token（用户在 Web App 中生成）
```

**4c. 浏览器扩展（P1）**

```
目标网站：
├── doubao.com (豆包)
├── chat.deepseek.com (DeepSeek)  
├── chatgpt.com (ChatGPT)
├── kimi.moonshot.cn (Kimi)
└── claude.ai (Claude)

注入方式：
1. 检测用户打开新对话
2. 在输入框中自动添加上下文前缀（用户可预览和编辑）
3. 或：在侧边栏显示上下文摘要，一键插入
```

---

## 数据流图

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  flomo   │     │  Notion  │     │ 粘贴文本  │
│  HTML    │     │  OAuth   │     │          │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     ▼                ▼                ▼
┌─────────────────────────────────────────────┐
│         Connector Layer (规范化)              │
│    RawEntry[] — 统一格式的原始数据             │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│         Structuring Engine (LLM)            │
│    分块 → 提取 → 聚合 → 生成上下文文件         │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│         Context Store                       │
│    6 个 Markdown 文件 + 版本管理 + 溯源        │
│    存储位置：IndexedDB（本地） 或 Supabase     │
└──────┬──────────────┬───────────────┬───────┘
       │              │               │
       ▼              ▼               ▼
  ┌─────────┐   ┌──────────┐   ┌───────────┐
  │复制粘贴  │   │MCP Server│   │浏览器扩展  │
  │(一键复制)│   │(HTTP)    │   │(自动注入)  │
  └─────────┘   └──────────┘   └───────────┘
       │              │               │
       ▼              ▼               ▼
  ┌─────────────────────────────────────────┐
  │     AI 对话工具                          │
  │  豆包 / DeepSeek / ChatGPT / Kimi / ... │
  └─────────────────────────────────────────┘
```

---

## 安全设计

### 数据安全

| 层面 | 措施 |
|------|------|
| 传输 | HTTPS only，TLS 1.3 |
| 存储 | 本地：IndexedDB（浏览器沙箱隔离）；云端：Supabase RLS + AES-256 |
| 认证 | Supabase Auth JWT，1 小时过期，Refresh Token 轮换 |
| API Key | 用户的 Notion/印象笔记 token 仅在前端使用，不传到我们服务端 |
| LLM 调用 | 通过我们的服务端代理调用 DeepSeek API（避免暴露 API key） |
| 数据删除 | 用户可一键删除所有数据，包括本地和云端，不可恢复 |

### PIPL 合规

| 要求 | 实现 |
|------|------|
| 明示同意 | 首次导入前弹出数据使用协议，逐条说明 |
| 最小必要 | 只读取文本内容，不采集用户社交关系、地理位置等 |
| 目的限定 | 数据仅用于生成个人上下文，不用于训练、广告、分析 |
| 用户权利 | 查看、修改、删除、导出所有数据 |
| 本地优先 | 默认不上传云端，用户主动开启云同步 |

---

## 部署架构

```
┌─────────────────────────────────────────────┐
│                  Vercel                      │
│  ┌──────────────────────────────────────┐   │
│  │  Next.js App                         │   │
│  │  - Web UI (SSR + Client)            │   │
│  │  - API Routes (Server Actions)      │   │
│  │  - LLM Proxy (/api/structurize)     │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
┌──────────────┐ ┌─────────┐ ┌──────────────┐
│  Supabase    │ │DeepSeek │ │  Cloudflare  │
│  - Auth      │ │  API    │ │  Workers     │
│  - Postgres  │ │         │ │  - MCP Server│
│  - Storage   │ │         │ │              │
└──────────────┘ └─────────┘ └──────────────┘
```

**域名规划**：
- Web App：`contextusb.com` 或 `contextusb.cn`
- MCP Server：`mcp.contextusb.com`
- 扩展：Chrome Web Store 发布

---

## 开发阶段划分

### Phase 0：原型验证（2 周）

**目标**：验证"上下文结构化"的核心体验

- [ ] 项目脚手架（Next.js + Tailwind + shadcn/ui + Supabase）
- [ ] 文件上传 + 文本粘贴功能
- [ ] flomo HTML 解析器
- [ ] LLM 结构化 pipeline（调用 DeepSeek API）
- [ ] 上下文预览页面（6 个文件的 Markdown 渲染）
- [ ] 一键复制功能
- [ ] 基础认证（邮箱登录）

**可交付**：能上传 flomo 导出 → 看到结构化的上下文 → 复制粘贴到 AI 对话

### Phase 1：MVP 完整版（4 周）

**目标**：完整的产品闭环 + 两种以上数据源 + 两种以上输出方式

- [ ] Notion OAuth 连接器
- [ ] 印象笔记 API 连接器
- [ ] 上下文编辑功能（用户修改上下文内容）
- [ ] 隐私控制（文件级可见性开关）
- [ ] 增量更新（新数据 → 增量结构化 → 合并到现有上下文）
- [ ] MCP Server（Cloudflare Workers）
- [ ] 浏览器扩展 v0（支持豆包 + DeepSeek）
- [ ] IndexedDB 本地存储
- [ ] 上下文版本历史

### Phase 2：增长迭代（持续）

- [ ] 更多数据源（微信读书、微博、即刻）
- [ ] 浏览器扩展支持更多 AI 工具
- [ ] 云同步（可选）
- [ ] 上下文自动刷新
- [ ] 多语言上下文（中英文）
- [ ] 上下文分享（生成只读链接）

---

## 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| DeepSeek API 不稳定 | 结构化失败 | 备选：Qwen API；本地 Ollama 回退 |
| flomo 导出格式变更 | 解析器失效 | 版本化解析器 + 用户反馈通道 |
| 浏览器扩展被目标网站封禁 | 注入失败 | Content Script 动态注入 + 用户反馈 |
| 用户数据量过大 | LLM 成本飙升 | 分块处理 + 采样策略（只处理最近 N 条） |
| 微信读书逆向 API 失效 | P1 功能不可用 | 降级为文件导入 + 社区 MCP 备选 |
| PIPL 合规风险 | 法律问题 | 本地优先架构 + 法律顾问审核 |
