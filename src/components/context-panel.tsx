"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { ContextFile } from "@/lib/connectors/types";
import {
  User,
  Sparkles,
  BookOpen,
  Users,
  Target,
  MessageCircle,
  Eye,
  EyeOff,
  EyeClosed,
  Pencil,
  Check,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const ICON_MAP: Record<string, typeof User> = {
  identity: User,
  interests: Sparkles,
  "growth-journal": BookOpen,
  relationships: Users,
  goals: Target,
  voice: MessageCircle,
};

export function ContextPanel() {
  const { contextFiles } = useStore();
  const hasContent = contextFiles.some((f) => f.content.length > 0);

  if (!hasContent) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">还没有生成上下文</p>
        <p className="text-sm">先导入数据，然后点击「AI 生成个人上下文」</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {contextFiles.filter((f) => f.content).length} 个上下文维度 · 点击可编辑 · 点击眼睛图标控制是否输出
        </p>
      </div>
      {contextFiles
        .filter((f) => f.content.length > 0)
        .map((file) => (
          <ContextCard key={file.id} file={file} />
        ))}
    </div>
  );
}

function ContextCard({ file }: { file: ContextFile }) {
  const { updateContextFile, toggleVisibility } = useStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(file.content);

  const Icon = ICON_MAP[file.type] || BookOpen;

  const visibilityIcon =
    file.visibility === "public" ? (
      <Eye className="h-4 w-4" />
    ) : file.visibility === "private" ? (
      <EyeOff className="h-4 w-4" />
    ) : (
      <EyeClosed className="h-4 w-4" />
    );

  const visibilityLabel =
    file.visibility === "public"
      ? "输出"
      : file.visibility === "private"
        ? "不输出"
        : "隐藏";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{file.label}</h3>
          <Badge
            variant={file.visibility === "public" ? "default" : "secondary"}
            className="cursor-pointer text-xs"
            onClick={() => toggleVisibility(file.id)}
          >
            {visibilityIcon}
            <span className="ml-1">{visibilityLabel}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateContextFile(file.id, editContent);
                  setEditing(false);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(file.content);
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditContent(file.content);
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
      ) : (
        <div className="prose prose-sm max-w-none text-sm leading-relaxed">
          <ReactMarkdown>{file.content}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
}
