"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportPanel } from "@/components/import-panel";
import { ContextPanel } from "@/components/context-panel";
import { ExportPanel } from "@/components/export-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { useStore } from "@/lib/store";
import { Usb, Upload, FileText, Share2 } from "lucide-react";

export default function Home() {
  const { contextFiles, rawEntries } = useStore();
  const hasContext = contextFiles.some((f) => f.content.length > 0);
  const hasData = rawEntries.length > 0;
  const [showApp, setShowApp] = useState(hasData || hasContext);
  const [activeTab, setActiveTab] = useState(
    hasContext ? "context" : "import"
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Usb className="h-5 w-5" />
            <span className="font-semibold text-lg">Context USB</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              让 AI 读懂你
            </span>
          </div>
          <SettingsDialog />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {!showApp ? (
          <LandingHero onStart={() => { setShowApp(true); setActiveTab("import"); }} />
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className={!showApp ? "hidden" : ""}
        >
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="import" className="gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">导入数据</span>
              <span className="sm:hidden">导入</span>
              {rawEntries.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">
                  {rawEntries.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="context" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">我的上下文</span>
              <span className="sm:hidden">上下文</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">输出到 AI</span>
              <span className="sm:hidden">输出</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <ImportPanel onComplete={() => setActiveTab("context")} />
          </TabsContent>
          <TabsContent value="context">
            <ContextPanel />
          </TabsContent>
          <TabsContent value="export">
            <ExportPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <p>Context USB — 你的数据只存在你的浏览器中，我们不保存任何内容</p>
      </footer>
    </div>
  );
}

function LandingHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center mb-8">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 mb-6">
          <Usb className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Context USB
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          从你的树洞平台提取个人上下文，一键插入任意 AI 对话。
          <br />
          <strong>设置一次，所有 AI 都懂你。</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mb-10">
        <StepCard step="1" title="导入数据" desc="上传 flomo 导出文件，或直接粘贴笔记、日记" />
        <StepCard step="2" title="AI 结构化" desc="自动提取你的性格、兴趣、目标等个人画像" />
        <StepCard step="3" title="一键输出" desc="复制到豆包、DeepSeek、ChatGPT 等 AI 工具" />
      </div>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Upload className="h-4 w-4" />
        开始导入你的数据
      </button>

      <p className="mt-4 text-xs text-muted-foreground max-w-md">
        所有数据仅存储在你的浏览器本地。AI 分析由 DeepSeek 驱动，分析完成后不保留数据。
      </p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="border rounded-lg p-4 text-left">
      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
        {step}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
