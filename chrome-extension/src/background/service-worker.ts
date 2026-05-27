// Background service worker for Context USB extension
// Stores context data and relays messages between content scripts and popup

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "CONTEXT_UPDATED": {
      // Content script on context-usb.vercel.app sent updated context
      chrome.storage.local.set({ contextFiles: message.contextFiles });
      // Notify any open popups
      chrome.runtime.sendMessage({
        type: "CONTEXT_RESPONSE",
        contextFiles: message.contextFiles,
      }).catch(() => {
        // Popup might not be open, ignore
      });
      break;
    }

    case "GET_CONTEXT": {
      // Popup or injector requesting context data
      chrome.storage.local.get("contextFiles", (result) => {
        sendResponse({
          type: "CONTEXT_RESPONSE",
          contextFiles: result.contextFiles || null,
        });
      });
      return true; // Keep channel open for async response
    }
  }
});

// Set badge when context is available
chrome.storage.onChanged.addListener((changes) => {
  if (changes.contextFiles?.newValue) {
    const files = changes.contextFiles.newValue;
    const count = files.filter(
      (f: { content?: string; visibility?: string }) =>
        f.visibility === "public" && f.content && f.content.trim().length > 0
    ).length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#000000" });
  }
});
