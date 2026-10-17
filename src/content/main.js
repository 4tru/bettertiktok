/*
 * BetterTikTok – content-script bootstrap.
 * Loads settings, applies every feature, keeps them in sync, watches TikTok's
 * SPA navigation and answers messages from the popup.
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  function applyAll() {
    BT.layout.apply();
    BT.player.apply();
  }

  function onNavigate() {
    BT.layout.scan();
    BT.player.refresh();
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || typeof msg.type !== "string" || msg.type.indexOf("BT_") !== 0) return;

    var respond = function (result) {
      try {
        sendResponse(result);
      } catch (e) { /* channel gone */ }
    };

    switch (msg.type) {
      case "BT_GET_STATE": {
        var v = BT.activeVideo();
        var meta = BT.videoMeta();
        respond({
          ok: true,
          hasVideo: !!v,
          href: location.href,
          title: meta.title,
          author: meta.author,
          paused: v ? v.paused : null,
          rate: v ? v.playbackRate : null
        });
        break;
      }
      case "BT_DOWNLOAD_VIDEO":
        BT.download.video().then(respond);
        return true; /* async */
      case "BT_DOWNLOAD_COVER":
        BT.download.cover().then(respond);
        return true;
      case "BT_DOWNLOAD_FROM_SRC": {
        var src = msg.src || "";
        var video = BT.activeVideo();
        var direct = /^https?:/i.test(src)
          ? Promise.resolve(src)
          : video
          ? BT.download.resolve(video)
          : Promise.resolve(null);
        direct.then(function (url) {
          if (!url) {
            respond({ ok: false, error: "unresolved" });
            return;
          }
          chrome.runtime
            .sendMessage({
              type: "BT_DOWNLOAD",
              url: url,
              filename: BT.fileName(BT.videoMeta(), "mp4")
            })
            .then(function (res) {
              if (res && res.ok) BT.toast("Download started ✓");
              respond(res || { ok: false });
            })
            .catch(function (err) {
              respond({ ok: false, error: String(err) });
            });
        });
        return true;
      }
      case "BT_COPY_LINK":
        BT.copy(location.href).then(function (ok) {
          BT.toast(ok ? "Link copied ✓" : "Could not copy link", ok ? "" : "error");
          respond({ ok: ok });
        });
        return true;
      case "BT_TOGGLE_PLAY": {
        var vid = BT.activeVideo();
        if (vid) {
          if (vid.paused) {
            var p = vid.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            vid.pause();
          }
        }
        respond({ ok: !!vid, paused: vid ? vid.paused : null });
        break;
      }
      default:
        respond({ ok: false, error: "unknown message" });
    }
    return false;
  });

  function init() {
    return BT.store.get().then(function (settings) {
      BT.state = settings;
      BT.layout.init();
      BT.player.init();
      BT.shortcuts.init();
      applyAll();

      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== "sync" || !BT.state) return;
        var dirty = false;
        for (var k in changes) {
          if (!Object.prototype.hasOwnProperty.call(changes, k)) continue;
          BT.state[k] = changes[k].newValue;
          if (k === "panelPos") {
            if (BT.player) BT.player.restorePos();
          } else if (k !== "lastSpeed") {
            dirty = true;
          }
        }
        if (dirty) applyAll();
      });

      /* TikTok is a single-page app – watch for URL changes. */
      var lastHref = location.href;
      setInterval(function () {
        if (location.href !== lastHref) {
          lastHref = location.href;
          onNavigate();
        }
      }, 700);

      /* Re-scan when the DOM churns (feeds are virtualised). */
      var scheduled = false;
      var observer = new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        BT.onIdle(function () {
          scheduled = false;
          BT.layout.scan();
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      window.addEventListener("resize", BT.debounce(function () {
        if (BT.player && BT.player.panel) BT.player.restorePos();
      }, 250));

      /* Apply playback speed as soon as any video is ready. */
      document.addEventListener(
        "loadedmetadata",
        function (e) {
          if (e.target && e.target.tagName === "VIDEO") BT.player.applySpeed(e.target);
        },
        true
      );

      /* Apply to videos that are already loaded. */
      document.querySelectorAll("video").forEach(BT.player.applySpeed, BT.player);

      onNavigate();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    });
  } else {
    init();
  }
})();
