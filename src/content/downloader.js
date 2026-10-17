/*
 * BetterTikTok – video/cover downloading.
 *
 * Resolution strategy for the video file (in order):
 *   1. the <video> element's own src (direct mp4 – the common case)
 *   2. a video resource from the Performance timeline
 *   3. TikTok's embedded page state (read via the MAIN-world helper)
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  function pickPerfUrl() {
    try {
      var entries = performance.getEntriesByType("resource");
      var vids = entries.filter(function (e) {
        return (
          e.initiatorType === "video" ||
          /\.mp4(\?|#|$)/i.test(e.name) ||
          /mime_type=video/i.test(e.name)
        );
      });
      if (!vids.length) return null;
      var last = vids[vids.length - 1].name;
      return /^https?:/i.test(last) ? last : null;
    } catch (e) {
      return null;
    }
  }

  function resolveVideoUrl(video) {
    var src = "";
    try {
      src = (video && (video.currentSrc || video.src)) || "";
    } catch (e) { /* ignore */ }
    if (/^https?:/i.test(src)) return Promise.resolve(src);

    var perf = pickPerfUrl();
    if (perf) return Promise.resolve(perf);

    return BT.requestState().then(function (st) {
      var addr = st && st.playAddr;
      return addr && /^https?:/i.test(addr) ? addr : null;
    });
  }

  function sendDownload(url, filename) {
    return chrome.runtime
      .sendMessage({ type: "BT_DOWNLOAD", url: url, filename: filename })
      .then(function (res) {
        return res || { ok: false, error: "no response from background" };
      })
      .catch(function (err) {
        return { ok: false, error: String(err) };
      });
  }

  BT.download = {
    video: function () {
      var v = BT.activeVideo();
      if (!v) {
        BT.toast("No video found on this page", "error");
        return Promise.resolve({ ok: false, error: "no video" });
      }
      return resolveVideoUrl(v).then(function (url) {
        if (!url) {
          BT.toast("Couldn't find the video file — try right-click → Save video", "error");
          return { ok: false, error: "unresolved" };
        }
        var meta = BT.videoMeta();
        return sendDownload(url, BT.fileName(meta, "mp4")).then(function (res) {
          if (res && res.ok) BT.toast("Download started ✓");
          else BT.toast("Download failed: " + ((res && res.error) || "unknown"), "error");
          return res;
        });
      });
    },

    cover: function () {
      var v = BT.activeVideo();
      var url = (v && v.poster) || "";
      if (!url) {
        try {
          var og = document.querySelector('meta[property="og:image"]');
          url = (og && og.content) || "";
        } catch (e) { /* ignore */ }
      }
      var go = function (finalUrl) {
        if (!finalUrl || !/^https?:/i.test(finalUrl)) {
          BT.toast("No cover image found", "error");
          return Promise.resolve({ ok: false, error: "no cover" });
        }
        var ext = /\.png(\?|#|$)/i.test(finalUrl) ? "png" : "jpg";
        var meta = BT.videoMeta();
        return sendDownload(finalUrl, BT.fileName(meta, ext)).then(function (res) {
          if (res && res.ok) BT.toast("Cover download started ✓");
          else BT.toast("Cover download failed", "error");
          return res;
        });
      };

      if (/^https?:/i.test(url)) return go(url);
      return BT.requestState().then(function (st) {
        return go((st && st.cover) || url);
      });
    },

    resolve: resolveVideoUrl
  };
})();
