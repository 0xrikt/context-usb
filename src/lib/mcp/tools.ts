// MCP Tool definitions and implementations
import type { ContextFile } from "../connectors/types";
import { CONTEXT_FILE_LABELS } from "../connectors/types";
import { generateCopyText } from "../export/copy-text";
import type { McpTool } from "./types";

// Tool definitions
export const MCP_TOOLS: McpTool[] = [
  {
    name: "get_full_context",
    description:
      "获取用户的完整个人上下文。返回所有可见维度的结构化个人信息，包括身份、兴趣、近期思考、社交、目标和表达风格。",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_context_dimension",
    description:
      "获取用户某个特定维度的个人上下文。可选维度：identity(关于我)、interests(兴趣)、growth-journal(近期想法)、relationships(社交)、goals(目标)、voice(表达风格)",
    inputSchema: {
      type: "object",
      properties: {
        dimension: {
          type: "string",
          description: "要查询的维度类型",
          enum: [
            "identity",
            "interests",
            "growth-journal",
            "relationships",
            "goals",
            "voice",
          ],
        },
      },
      required: ["dimension"],
    },
  },
  {
    name: "list_dimensions",
    description:
      "列出用户所有可用的上下文维度及其状态（是否有内容、是否公开）。",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Tool implementations
export function executeGetFullContext(contextFiles: ContextFile[]): string {
  const text = generateCopyText(contextFiles);
  if (!text) {
    return "用户尚未生成个人上下文。请建议用户先在 Context USB 中导入数据并生成上下文。";
  }
  return text;
}

export function executeGetContextDimension(
  contextFiles: ContextFile[],
  dimension: string
): string {
  const file = contextFiles.find((f) => f.type === dimension);
  if (!file) {
    return `未找到维度 "${dimension}" 的上下文数据。`;
  }
  if (file.visibility !== "public") {
    return `维度 "${CONTEXT_FILE_LABELS[file.type] || dimension}" 已被用户设为不公开。`;
  }
  if (!file.content || !file.content.trim()) {
    return `维度 "${CONTEXT_FILE_LABELS[file.type] || dimension}" 暂无内容。`;
  }

  const label = CONTEXT_FILE_LABELS[file.type] || file.type;
  return `## ${label}\n\n${file.content}`;
}

export function executeListDimensions(contextFiles: ContextFile[]): string {
  if (!contextFiles || contextFiles.length === 0) {
    return "用户尚未生成任何上下文维度。";
  }

  const lines = contextFiles.map((f) => {
    const label = CONTEXT_FILE_LABELS[f.type] || f.type;
    const hasContent = f.content && f.content.trim().length > 0;
    const status = !hasContent
      ? "空"
      : f.visibility === "public"
        ? "公开"
        : f.visibility === "private"
          ? "仅自己可见"
          : "隐藏";
    const chars = hasContent ? `${f.content.trim().length} 字` : "";
    return `- ${label} (${f.type}): ${status}${chars ? ` | ${chars}` : ""}`;
  });

  return `用户的上下文维度：\n${lines.join("\n")}`;
}
