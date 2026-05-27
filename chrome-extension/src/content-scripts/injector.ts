// Content script that runs on AI chat sites
// Receives context from popup and injects it into the chat input

interface SiteConfig {
  domain: string;
  name: string;
  inputSelectors: string[];
}

const SUPPORTED_SITES: SiteConfig[] = [
  {
    domain: "chatgpt.com",
    name: "ChatGPT",
    inputSelectors: [
      "#prompt-textarea",
      'div[contenteditable="true"]',
      "textarea",
    ],
  },
  {
    domain: "chat.deepseek.com",
    name: "DeepSeek",
    inputSelectors: [
      "textarea#chat-input",
      "textarea.chat-input",
      "textarea",
    ],
  },
  {
    domain: "kimi.moonshot.cn",
    name: "Kimi",
    inputSelectors: [
      'div[contenteditable="true"]',
      ".chat-input textarea",
      "textarea",
    ],
  },
  {
    domain: "www.doubao.com",
    name: "Doubao",
    inputSelectors: [
      'div[contenteditable="true"]',
      ".chat-input textarea",
      "textarea",
    ],
  },
];

function getCurrentSite(): SiteConfig | null {
  const hostname = window.location.hostname;
  return SUPPORTED_SITES.find((s) => hostname.includes(s.domain)) ?? null;
}

function findInputElement(site: SiteConfig): HTMLElement | null {
  for (const selector of site.inputSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

function injectText(el: HTMLElement, text: string): boolean {
  // Try different injection methods based on element type

  // Method 1: For textarea/input elements
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  // Method 2: For contenteditable elements
  if (el.getAttribute("contenteditable") === "true") {
    el.focus();

    // Try execCommand first (triggers React's synthetic event system)
    try {
      // Select all existing content
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Insert text
      document.execCommand("insertText", false, text);

      // Dispatch events
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    } catch {
      // Fallback: direct text content set
      el.textContent = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
  }

  return false;
}

function showConfirmation(success: boolean, message: string): void {
  const banner = document.createElement("div");
  banner.textContent = message;
  Object.assign(banner.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: "8px",
    backgroundColor: success ? "#000" : "#ef4444",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "opacity 0.3s",
  });
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 300);
  }, 2000);
}

// Listen for inject command from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "INJECT_CONTEXT") return;

  const text = message.text as string;
  if (!text) {
    sendResponse({ success: false, error: "no_text" });
    return;
  }

  const site = getCurrentSite();
  if (!site) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      showConfirmation(true, "Context USB: 已复制到剪贴板，请手动粘贴");
      sendResponse({ success: true, method: "clipboard" });
    });
    return true;
  }

  const input = findInputElement(site);
  if (!input) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      showConfirmation(
        true,
        `Context USB: 未找到 ${site.name} 输入框，已复制到剪贴板`
      );
      sendResponse({ success: true, method: "clipboard" });
    });
    return true;
  }

  const injected = injectText(input, text);
  if (injected) {
    showConfirmation(true, `Context USB: 已注入到 ${site.name}`);
    sendResponse({ success: true, method: "inject" });
  } else {
    // Fallback: clipboard
    navigator.clipboard.writeText(text).then(() => {
      showConfirmation(true, "Context USB: 注入失败，已复制到剪贴板");
      sendResponse({ success: true, method: "clipboard" });
    });
    return true;
  }
});
