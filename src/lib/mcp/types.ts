// MCP Protocol types for JSON-RPC 2.0 + Model Context Protocol

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

// Server info returned in initialize response
export const MCP_SERVER_INFO = {
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {},
  },
  serverInfo: {
    name: "context-usb",
    version: "1.0.0",
  },
};
