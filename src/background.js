/*
 * BetterTikTok – background service worker.
 * Handles downloads requested by the content scripts / popup and wires up
 * the right-click "Download video" context menu.
 */

const MENU_ID = "bt-download-video";
const TIKTOK_PATTERNS = ["https://*.tiktok.com/*", "https://tiktok.com/*"];

function download(url, filename) {
  return chrome.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: "uniquify"
  });
}

function fallbackName(ext) {
  return `BetterTikTok/tiktok_${Date.now()}.${ext}`;
}

/* Context menu ------------------------------------------------------------ */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Download video (BetterTikTok)",
      contexts: ["video"],
      documentUrlPatterns: TIKTOK_PATTERNS
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab || !tab.id) return;
  const src = info.srcUrl || "";

  /* Let the content script resolve a nice filename (and blob: URLs). */
  try {
    const res = await chrome.tabs.sendMessage(tab.id, {
      type: "BT_DOWNLOAD_FROM_SRC",
      src
    });
    if (res && res.ok) return;
  } catch (e) {
    /* content script not reachable – fall through to a direct download */
  }

  if (/^https?:/i.test(src)) {
    try {
      await download(src, fallbackName("mp4"));
    } catch (e) {
      console.warn("[BetterTikTok] context download failed:", e);
    }
  }
});

/* Downloads requested from the UI ---------------------------------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "BT_DOWNLOAD") return;

  download(msg.url, msg.filename)
    .then((id) => sendResponse({ ok: true, id }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; /* keep the message channel open for the async response */
});
