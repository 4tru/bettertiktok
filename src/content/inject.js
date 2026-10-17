/*
 * BetterTikTok – MAIN-world helper.
 *
 * Runs in the page's own JavaScript world so it can read data TikTok keeps in
 * page globals (rehydration state, router state, …). The extension's isolated
 * world asks for it with a `bt-state-request` event and reads the answer from
 * the event detail (or, as a belt-and-braces fallback, from a data attribute).
 */
(function () {
  "use strict";

  const ATTR = "data-bt-state";

  function pickItem() {
    /* Current shape: TikTok embeds the visible video in this blob. */
    try {
      const scope =
        window.__UNIVERSAL_DATA_FOR_REHYDRATION__ &&
        window.__UNIVERSAL_DATA_FOR_REHYDRATION__.__DEFAULT_SCOPE__;
      const item =
        scope &&
        scope["webapp.video-detail"] &&
        scope["webapp.video-detail"].itemInfo &&
        scope["webapp.video-detail"].itemInfo.itemStruct;
      if (item && item.video) return item;
    } catch (e) { /* ignore */ }

    /* SSR router data (same shape, different holder). */
    try {
      const item =
        window._ROUTER_DATA &&
        window._ROUTER_DATA.props &&
        window._ROUTER_DATA.props.pageProps &&
        window._ROUTER_DATA.props.pageProps.itemInfo &&
        window._ROUTER_DATA.props.pageProps.itemInfo.itemStruct;
      if (item && item.video) return item;
    } catch (e) { /* ignore */ }

    /* Older SIGI state. */
    try {
      const mod = window.SIGI_STATE && window.SIGI_STATE.ItemModule;
      if (mod) {
        const key = Object.keys(mod)[0];
        const item = key ? mod[key] : null;
        if (item && item.video) return item;
      }
    } catch (e) { /* ignore */ }

    return null;
  }

  function collect() {
    const out = {};
    try {
      const item = pickItem();
      if (item) {
        const v = item.video || {};
        out.playAddr =
          v.playAddr ||
          (Array.isArray(v.bitRate) && v.bitRate[0] && v.bitRate[0].playAddr) ||
          "";
        out.cover = v.cover || v.originCover || v.dynamicCover || "";
        out.title = item.desc || "";
        out.author =
          (item.author && (item.author.uniqueId || item.author.nickname)) || "";
        out.id = item.id || "";
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  function respond() {
    try {
      const data = collect();
      const json = JSON.stringify(data);
      document.documentElement.setAttribute(ATTR, json);
      document.dispatchEvent(new CustomEvent("bt-state-response", { detail: data }));
    } catch (e) { /* ignore */ }
  }

  document.addEventListener("bt-state-request", respond);
})();
