// Popup script for Context USB extension

interface ContextFile {
  type: string;
  label: string;
  content: string;
  visibility: "public" | "private" | "hidden";
}

const LABELS: Record<string, string> = {
  identity: "关于我",
  interests: "我的兴趣",
  "growth-journal": "最近在想什么",
  relationships: "我的社交世界",
  goals: "我的目标",
  voice: "我的表达风格",
};

let currentContextText = "";

function generateCopyText(files: ContextFile[]): string {
  const visibleFiles = files
    .filter((f) => f.visibility === "public")
    .filter((f) => f.content && f.content.trim().length > 0);

  if (visibleFiles.length === 0) return "";

  const header = `以下是关于我的个人背景信息。请在后续对话中参考这些信息来了解我，给出更贴合我个人情况的回应。不需要复述这些信息，自然地融入你的回答即可。\n\n---\n\n`;

  let body = "";
  for (const file of visibleFiles) {
    const label = LABELS[file.type] || file.type;
    body += `## ${label}\n\n${file.content}\n\n`;
  }

  let result = header + body;
  if (result.length > 3000) {
    result = result.slice(0, 2980) + "\n\n[内容已截断]";
  }

  return result.trim();
}

function updateUI(contextFiles: ContextFile[] | null): void {
  const statusEl = document.getElementById("status")!;
  const statusTextEl = document.getElementById("status-text")!;
  const previewEl = document.getElementById("preview")!;
  const injectBtn = document.getElementById("inject-btn") as HTMLButtonElement;
  const btnText = document.getElementById("btn-text")!;
  const statsEl = document.getElementById("stats")!;

  if (!contextFiles || contextFiles.length === 0) {
    statusEl.className = "status empty";
    statusTextEl.textContent = "未找到上下文数据";
    previewEl.classList.add("hidden");
    injectBtn.className = "inject-btn disabled";
    injectBtn.disabled = true;
    btnText.textContent = "请先访问 Context USB 生成上下文";
    statsEl.textContent = "";
    currentContextText = "";
    return;
  }

  const text = generateCopyText(contextFiles);
  if (!text) {
    statusEl.className = "status empty";
    statusTextEl.textContent = "上下文为空，请先生成";
    previewEl.classList.add("hidden");
    injectBtn.className = "inject-btn disabled";
    injectBtn.disabled = true;
    btnText.textContent = "请先访问 Context USB 生成上下文";
    statsEl.textContent = "";
    currentContextText = "";
    return;
  }

  currentContextText = text;

  const publicCount = contextFiles.filter(
    (f) => f.visibility === "public" && f.content?.trim()
  ).length;

  statusEl.className = "status ready";
  statusTextEl.textContent = `已加载 ${publicCount} 个维度的上下文`;
  previewEl.classList.remove("hidden");
  previewEl.textContent =
    text.length > 200 ? text.slice(0, 200) + "..." : text;
  statsEl.textContent = `${text.length} 字`;

  injectBtn.className = "inject-btn active";
  injectBtn.disabled = false;
  btnText.textContent = "注入上下文到当前页面";
}

// Load context on popup open
chrome.runtime.sendMessage({ type: "GET_CONTEXT" }, (response) => {
  if (response?.contextFiles) {
    updateUI(response.contextFiles);
  } else {
    updateUI(null);
  }
});

// Listen for context updates while popup is open
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CONTEXT_RESPONSE" && message.contextFiles) {
    updateUI(message.contextFiles);
  }
});

// Inject button click
document.getElementById("inject-btn")!.addEventListener("click", async () => {
  if (!currentContextText) return;

  const btn = document.getElementById("inject-btn") as HTMLButtonElement;
  const btnText = document.getElementById("btn-text")!;
  const siteInfo = document.getElementById("site-info")!;

  btn.disabled = true;
  btnText.textContent = "注入中...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      btnText.textContent = "无法获取当前标签页";
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { type: "INJECT_CONTEXT", text: currentContextText },
      (response) => {
        if (chrome.runtime.lastError) {
          // Content script not running on this page - fallback to clipboard
          navigator.clipboard.writeText(currentContextText).then(() => {
            btn.className = "inject-btn success";
            btnText.textContent = "已复制到剪贴板";
            siteInfo.style.display = "block";
            siteInfo.innerHTML = "当前页面不支持自动注入<br>请 <strong>Ctrl+V</strong> 手动粘贴";
            setTimeout(() => {
              btn.className = "inject-btn active";
              btn.disabled = false;
              btnText.textContent = "注入上下文到当前页面";
            }, 3000);
          });
          return;
        }

        if (response?.success) {
          btn.className = "inject-btn success";
          btnText.textContent =
            response.method === "clipboard"
              ? "已复制到剪贴板"
              : "注入成功!";
          setTimeout(() => {
            btn.className = "inject-btn active";
            btn.disabled = false;
            btnText.textContent = "注入上下文到当前页面";
          }, 2000);
        } else {
          btnText.textContent = "注入失败，请手动复制";
          btn.disabled = false;
        }
      }
    );
  } catch {
    btnText.textContent = "出错了，请重试";
    btn.disabled = false;
  }
});
