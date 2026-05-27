"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-2">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-xl font-semibold">出了点问题</h2>
        <p className="text-sm text-muted-foreground">
          应用遇到了一个错误。你的数据仍然安全地保存在浏览器中。
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
