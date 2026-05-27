# Context USB

> 让 AI 读懂你 — 从你的树洞平台提取个人上下文，一键插入任意 AI 对话工具。

## What is this?

Context USB 从你的"树洞"平台（flomo、Notion、微博、印象笔记等）提取你是谁、你在想什么、你经历了什么，用 AI 结构化为 6 个维度的个人上下文，一键复制到豆包、DeepSeek、ChatGPT、Kimi 等 AI 对话工具。

**设置一次，所有 AI 都懂你。**

## How it works

1. **导入数据** — 上传 flomo 导出的 HTML，或直接粘贴笔记/日记文本
2. **AI 结构化** — DeepSeek 自动提取你的性格、兴趣、目标等 6 个维度的个人画像
3. **一键输出** — 复制粘贴到任意 AI 对话工具，AI 立刻像老朋友一样了解你

## 6 个上下文维度

| 维度 | 内容 |
|------|------|
| 关于我 | 性格特征、价值观、人生阶段 |
| 我的兴趣 | 阅读偏好、关注话题、审美取向 |
| 最近在想什么 | 近期思考、情绪状态、挑战与领悟 |
| 我的社交世界 | 重要的人、社交模式 |
| 我的目标 | 短期目标、长期愿景、纠结的决定 |
| 我的表达风格 | 说话方式、常用表达、幽默类型 |

## Privacy

- 数据存储在浏览器 localStorage，不上传到任何服务器
- 生成上下文时通过 DeepSeek API 处理，不保留数据
- 可随时一键清除所有数据

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- DeepSeek API (LLM structuring)
- Zustand (state management)
- Vercel (deployment)

## Development

```bash
pnpm install
cp .env.example .env.local  # Add DEEPSEEK_API_KEY
pnpm dev
```

## License

MIT
