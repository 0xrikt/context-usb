"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { generateCopyText } from "@/lib/export/copy-text";
import { Copy, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { McpSetupCard } from "@/components/mcp-setup-card";

export function ExportPanel() {
  const { contextFiles } = useStore();
  const [copied, setCopied] = useState(false);
  const hasContent = contextFiles.some((f) => f.content.length > 0);

  if (!hasContent) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">还没有上下文可以输出</p>
        <p className="text-sm">先导入数据并生成个人上下文</p>
      </div>
    );
  }

  const publicFiles = contextFiles.filter(
    (f) => f.visibility === "public" && f.content.length > 0
  );
  const copyText = generateCopyText(contextFiles);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success("已复制到剪贴板！粘贴到 AI 对话开头即可");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 备选方案
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("已复制到剪贴板！");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 一键复制 */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-2">一键复制到 AI</h3>
        <p className="text-sm text-muted-foreground mb-4">
          复制后粘贴到豆包、DeepSeek、ChatGPT、Kimi 等任意 AI 对话的开头，AI 会立即了解你的个人背景。
        </p>

        <div className="flex items-center gap-3 mb-4">
          <Badge variant="outline">
            {publicFiles.length} 个维度将被输出
          </Badge>
          <Badge variant="outline">{copyText.length} 字</Badge>
        </div>

        <Button onClick={handleCopy} size="lg" className="w-full">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              已复制！
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              复制个人上下文
            </>
          )}
        </Button>
      </Card>

      {/* 预览 */}
      <Card className="p-6">
        <h3 className="font-medium mb-3">输出内容预览</h3>
        <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
            {copyText}
          </pre>
        </div>
      </Card>

      {/* MCP Server */}
      <McpSetupCard />

      {/* 使用说明 */}
      <Card className="p-6">
        <h3 className="font-medium mb-3">使用方法</h3>
        <div className="space-y-3 text-sm">
          <Step n="1" text="点击上方「复制个人上下文」" />
          <Step n="2" text="打开你常用的 AI 对话工具（豆包、DeepSeek、ChatGPT...）" />
          <Step n="3" text="开一个新对话，先粘贴上下文，再输入你想聊的话题" />
          <Step n="4" text="AI 会基于你的背景给出个性化的回应" />
        </div>
      </Card>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
        {n}
      </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
