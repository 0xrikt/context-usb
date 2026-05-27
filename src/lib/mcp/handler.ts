// MCP JSON-RPC message handler
import type { ContextFile } from "../connectors/types";
import type { JsonRpcRequest, JsonRpcResponse, McpToolCallParams } from "./types";
import { MCP_SERVER_INFO, } from "./types";
import {
  MCP_TOOLS,
  executeGetFullContext,
  executeGetContextDimension,
  executeListDimensions,
} from "./tools";

export function handleMcpRequest(
  request: JsonRpcRequest,
  contextFiles: ContextFile[]
): JsonRpcResponse | null {
  const { method, id } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: MCP_SERVER_INFO,
      };

    case "notifications/initialized":
      // Notification, no response needed
      return null;

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: { tools: MCP_TOOLS },
      };

    case "tools/call": {
      const params = request.params as unknown as McpToolCallParams;
      if (!params?.name) {
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          error: {
            code: -32602,
            message: "Missing tool name in params",
          },
        };
      }

      const result = executeTool(params.name, params.arguments ?? {}, contextFiles);
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          content: [{ type: "text", text: result }],
        },
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

function executeTool(
  name: string,
  args: Record<string, unknown>,
  contextFiles: ContextFile[]
): string {
  switch (name) {
    case "get_full_context":
      return executeGetFullContext(contextFiles);

    case "get_context_dimension":
      return executeGetContextDimension(
        contextFiles,
        (args.dimension as string) || ""
      );

    case "list_dimensions":
      return executeListDimensions(contextFiles);

    default:
      return `Unknown tool: ${name}`;
  }
}
