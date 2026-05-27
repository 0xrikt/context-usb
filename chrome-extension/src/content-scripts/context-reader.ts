// Content script that runs on context-usb.vercel.app
// Reads localStorage and sends context data to the extension background

function readAndSendContext(): void {
  try {
    const raw = localStorage.getItem("context-usb-storage");
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state?.contextFiles || !Array.isArray(state.contextFiles)) return;

    // Only send if there's actual content
    const hasContent = state.contextFiles.some(
      (f: { content?: string }) => f.content && f.content.trim().length > 0
    );
    if (!hasContent) return;

    chrome.runtime.sendMessage({
      type: "CONTEXT_UPDATED",
      contextFiles: state.contextFiles,
    });

    console.log("[Context USB] Context synced to extension");
  } catch (err) {
    console.error("[Context USB] Failed to read context:", err);
  }
}

// Read on page load
readAndSendContext();

// Re-read periodically to catch updates (every 30 seconds)
setInterval(readAndSendContext, 30_000);

// Listen for storage events (when another tab updates localStorage)
window.addEventListener("storage", (e) => {
  if (e.key === "context-usb-storage") {
    readAndSendContext();
  }
});
