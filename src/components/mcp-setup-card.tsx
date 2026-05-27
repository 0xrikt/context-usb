"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { generateToken } from "@/lib/sync/token";
import { Copy, Check, RefreshCw, Trash2, Plug, Loader2 } from "lucide-react";

export function McpSetupCard() {
  const { mcpToken, setMcpToken, contextFiles } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const hasContext = contextFiles.some(
    (f) => f.visibility === "public" && f.content?.trim()
  );

  const mcpUrl = mcpToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/mcp?token=${mcpToken}`
    : "";

  const syncContext = useCallback(
    async (token: string) => {
      setIsSyncing(true);
      try {
        const res = await fetch("/api/context-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, contextFiles }),
        });
        if (res.ok) {
          setLastSynced(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [contextFiles]
  );

  const handleEnable = useCallback(async () => {
    const token = generateToken();
    setMcpToken(token);
    await syncContext(token);
  }, [setMcpToken, syncContext]);

  const handleRevoke = useCallback(async () => {
    if (!mcpToken) return;
    try {
      await fetch(`/api/context-sync?token=${mcpToken}`, { method: "DELETE" });
    } catch {
      // Best effort
    }
    setMcpToken(null);
    setLastSynced(null);
  }, [mcpToken, setMcpToken]);

  const copyToClipboard = useCallback(
    async (text: string, key: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    },
    []
  );

  const mcpConfig = mcpToken
    ? JSON.stringify(
        {
          mcpServers: {
            "context-usb": {
              url: mcpUrl,
            },
          },
        },
        null,
        2
      )
    : "";

  if (!hasContext) {
    return null;
  }

  return (
    <div className="border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="h-5 w-5" />
        <h3 className="font-semibold">MCP Server</h3>
        <span className="text-xs text-muted-foreground">
          让 AI 工具直接读取你的上下文
        </span>
      </div>

      {!mcpToken ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            启用 MCP Server 后，支持 MCP 的 AI 工具（如 Claude Desktop、Cursor
            等）可以直接读取你的个人上下文，无需手动复制粘贴。
          </p>
          <button
            onClick={handleEnable}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plug className="h-4 w-4" />
            启用 MCP Server
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MCP URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              MCP Server URL
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted p-2.5 rounded-lg break-all font-mono">
                {mcpUrl}
              </code>
              <button
                onClick={() => copyToClipboard(mcpUrl, "url")}
                className="shrink-0 p-2 border rounded-lg hover:bg-muted transition-colors"
                title="复制 URL"
              >
                {copied === "url" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Config snippet */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Claude Desktop 配置（复制到 claude_desktop_config.json）
            </label>
            <div className="relative">
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                {mcpConfig}
              </pre>
              <button
                onClick={() => copyToClipboard(mcpConfig, "config")}
                className="absolute top-2 right-2 p-1.5 bg-background border rounded hover:bg-muted transition-colors"
                title="复制配置"
              >
                {copied === "config" ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Sync status and actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {lastSynced ? `上次同步: ${lastSynced}` : "已启用"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => syncContext(mcpToken)}
                disabled={isSyncing}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                同步
              </button>
              <button
                onClick={handleRevoke}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
