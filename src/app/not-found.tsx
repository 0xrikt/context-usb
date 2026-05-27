import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-2">
          <span className="text-3xl">?</span>
        </div>
        <h2 className="text-xl font-semibold">页面不存在</h2>
        <p className="text-sm text-muted-foreground">
          你访问的页面不存在，可能已被移除或地址有误。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          回到首页
        </Link>
      </div>
    </div>
  );
}
