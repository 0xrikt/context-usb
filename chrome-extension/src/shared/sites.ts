// Per-site selector configurations for AI chat platforms
// Each site may update their DOM, so we use multiple fallback selectors

export interface SiteConfig {
  domain: string;
  name: string;
  inputSelectors: string[];
  isContentEditable: boolean;
}

export const SUPPORTED_SITES: SiteConfig[] = [
  {
    domain: "chatgpt.com",
    name: "ChatGPT",
    inputSelectors: [
      "#prompt-textarea",
      'div[contenteditable="true"]',
      "textarea",
    ],
    isContentEditable: true,
  },
  {
    domain: "chat.deepseek.com",
    name: "DeepSeek",
    inputSelectors: [
      "textarea#chat-input",
      "textarea.chat-input",
      "textarea",
    ],
    isContentEditable: false,
  },
  {
    domain: "kimi.moonshot.cn",
    name: "Kimi",
    inputSelectors: [
      'div[contenteditable="true"]',
      ".chat-input textarea",
      "textarea",
    ],
    isContentEditable: true,
  },
  {
    domain: "www.doubao.com",
    name: "Doubao",
    inputSelectors: [
      'div[contenteditable="true"]',
      ".chat-input textarea",
      "textarea",
    ],
    isContentEditable: true,
  },
];

export function getCurrentSite(): SiteConfig | null {
  const hostname = window.location.hostname;
  return SUPPORTED_SITES.find((site) => hostname.includes(site.domain)) ?? null;
}

export function findInputElement(site: SiteConfig): HTMLElement | null {
  for (const selector of site.inputSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}
