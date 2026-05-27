"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SettingsDialog() {
  const { rawEntries, contextFiles, resetAll } = useStore();

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" />}
      >
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>管理你的数据和偏好</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 数据概览 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">数据概览</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>导入的记录</span>
              <span className="text-right font-mono">{rawEntries.length} 条</span>
              <span>上下文维度</span>
              <span className="text-right font-mono">
                {contextFiles.filter((f) => f.content).length} / 6
              </span>
              <span>数据存储</span>
              <span className="text-right">浏览器本地</span>
            </div>
          </div>

          {/* 隐私说明 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">隐私说明</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>- 所有数据存储在你的浏览器 localStorage 中</li>
              <li>- 生成上下文时，数据会发送到 DeepSeek API 进行分析</li>
              <li>- 我们的服务器不保存你的任何个人数据</li>
              <li>- 清除浏览器数据会删除所有内容</li>
            </ul>
          </div>

          {/* 清除数据 */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              resetAll();
              toast.success("所有数据已清除");
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清除所有数据
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
