"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useStore, createEmptyContextFiles } from "@/lib/store";
import { parseFlomoHTML } from "@/lib/connectors/flomo-parser";
import { parseText } from "@/lib/connectors/text-parser";
import { buildContextMarkdown } from "@/lib/engine/prompts";
import type { ContextFile, ContextFileType } from "@/lib/connectors/types";
import { CONTEXT_FILE_LABELS } from "@/lib/connectors/types";
import { Upload, FileText, ClipboardPaste, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImportPanelProps {
  onComplete: () => void;
}

export function ImportPanel({ onComplete }: ImportPanelProps) {
  const {
    rawEntries,
    addEntries,
    clearEntries,
    isProcessing,
    processingStep,
    processingProgress,
    setProcessing,
    setContextFiles,
  } = useStore();

  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) return;

          let entries;
          if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
            entries = parseFlomoHTML(content);
            toast.success(`解析了 ${entries.length} 条 flomo 记录`);
          } else {
            entries = parseText(content, "file");
            toast.success(`导入了 ${entries.length} 条记录`);
          }
          addEntries(entries);
        };
        reader.readAsText(file);
      });
    },
    [addEntries]
  );

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return;
    const entries = parseText(pasteText, "paste");
    addEntries(entries);
    setPasteText("");
    toast.success(`导入了 ${entries.length} 条记录`);
  }, [pasteText, addEntries]);

  const handleStructurize = useCallback(async () => {
    if (rawEntries.length === 0) {
      toast.error("没有数据可以分析，请先导入");
      return;
    }

    setProcessing(true, "正在发送到 AI 分析...", 10);

    try {
      setProcessing(true, "AI 正在阅读你的记录...", 30);

      const response = await fetch("/api/structurize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: rawEntries }),
      });

      setProcessing(true, "正在生成个人上下文...", 70);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      const result = data.result;

      // 将 JSON 结果转换为 ContextFile[]
      const types: ContextFileType[] = [
        "identity",
        "interests",
        "growth-journal",
        "relationships",
        "goals",
        "voice",
      ];

      const keyMap: Record<string, string> = {
        "growth-journal": "growth_journal",
      };

      const contextFiles: ContextFile[] = types.map((type) => {
        const dataKey = keyMap[type] || type;
        const typeData = result[dataKey] || {};
        const content = buildContextMarkdown(type, typeData);
        return {
          id: `ctx-${type}`,
          type,
          label: CONTEXT_FILE_LABELS[type],
          content,
          version: 1,
          updatedAt: new Date().toISOString(),
          visibility: type === "relationships" ? "private" : "public",
        };
      });

      setContextFiles(contextFiles);
      setProcessing(true, "完成!", 100);

      setTimeout(() => {
        setProcessing(false);
        toast.success("个人上下文生成完成!");
        onComplete();
      }, 500);
    } catch (error) {
      setProcessing(false);
      toast.error(
        error instanceof Error ? error.message : "分析失败，请检查 API Key 是否正确"
      );
    }
  }, [rawEntries, setProcessing, setContextFiles, onComplete]);

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card
        className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".html,.htm,.txt,.md";
          input.multiple = true;
          input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
          input.click();
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">上传文件</p>
            <p className="text-sm text-muted-foreground">
              拖拽或点击上传 flomo 导出的 HTML，或任意文本文件
            </p>
          </div>
        </div>
      </Card>

      {/* Text Paste */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardPaste className="h-4 w-4" />
          <h3 className="font-medium">粘贴文本</h3>
        </div>
        <Textarea
          placeholder="直接粘贴你的笔记、日记、微博内容、聊天记录等任意文本..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={5}
          className="mb-3"
        />
        <Button
          onClick={handlePaste}
          disabled={!pasteText.trim()}
          variant="outline"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-1.5" />
          导入文本
        </Button>
      </Card>

      {/* Data Summary + Process */}
      {rawEntries.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">已导入 {rawEntries.length} 条记录</h3>
              <p className="text-sm text-muted-foreground">
                来源：
                {[...new Set(rawEntries.map((e) => e.source))].join("、")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearEntries();
                toast.info("已清除所有导入数据");
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              清除
            </Button>
          </div>

          {isProcessing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{processingStep}</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          ) : (
            <Button onClick={handleStructurize} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              AI 生成个人上下文
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
