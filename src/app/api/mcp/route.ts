import { NextResponse } from "next/server";
import { isValidToken } from "@/lib/sync/token";
import { decodeContextToken } from "@/lib/sync/storage";
import { handleMcpRequest } from "@/lib/mcp/handler";
import type { JsonRpcRequest } from "@/lib/mcp/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  // Extract token from Authorization header or query param
  const authHeader = request.headers.get("Authorization");
  const { searchParams } = new URL(request.url);

  let token = searchParams.get("token");
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token || !isValidToken(token)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: "Missing or invalid token. Generate one in the Context USB app.",
        },
      },
      { status: 401, headers: corsHeaders }
    );
  }

  // Decode context from self-contained token
  const contextFiles = decodeContextToken(token) || [];

  try {
    const body = await request.json();

    // Handle batch requests
    if (Array.isArray(body)) {
      const responses = body
        .map((req: JsonRpcRequest) =>
          handleMcpRequest(req, contextFiles)
        )
        .filter(Boolean);

      return NextResponse.json(responses, { headers: corsHeaders });
    }

    // Single request
    const response = handleMcpRequest(body as JsonRpcRequest, contextFiles);

    if (!response) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error("MCP request error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON" },
      },
      { status: 400, headers: corsHeaders }
    );
  }
}
