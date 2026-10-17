/*
 * BetterTikTok – shared utilities for the content scripts.
 * Everything lives under the BT namespace created by defaults.js.
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  /* ---------------------------------------------------------------- store */

  BT.store = {
    get: function () {
      return chrome.storage.sync.get(BT.DEFAULTS).then(function (s) {
        return Object.assign({}, BT.DEFAULTS, s);
      });
    },
    set: function (patch) {
      return chrome.storage.sync.set(patch);
    },
    reset: function () {
      return chrome.storage.sync.set(BT.DEFAULTS);
    }
  };

  /* ---------------------------------------------------------------- misc */

  BT.clamp = function (n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  };

  BT.debounce = function (fn, ms) {
    var t = null;
    return function () {
      var args = arguments,
        self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, ms);
    };
  };

  BT.onIdle = function (fn) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 120);
    }
  };

  BT.sleep = function (ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  };

  /* --------------------------------------------------------------- toast */

  var toastEl = null;
  var toastTimer = null;

  BT.toast = function (msg, kind) {
    if (BT.state && BT.state.toasts === false && kind !== "error") return;
    try {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "bt-toast";
        (document.body || document.documentElement).appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.className = kind === "error" ? "bt-err" : "";
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        if (toastEl) toastEl.hidden = true;
      }, 2800);
    } catch (e) { /* toast is best-effort */ }
  };

  /* ---------------------------------------------------------- video picker */

  /*
   * Pick the video the user is actually watching: the most visible one, with
   * a bonus for currently playing elements. Deliberately selector-free so it
   * keeps working when TikTok renames its classes.
   */
  BT.activeVideo = function () {
    var vids;
    try {
      vids = document.querySelectorAll("video");
    } catch (e) {
      return null;
    }
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < vids.length; i++) {
      var v = vids[i];
      var r = v.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      var visH = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      var visW = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      var ratio = (visH * visW) / (r.width * r.height);
      if (ratio <= 0.05) continue;
      var score = ratio + (v.paused ? 0 : 0.6) + (r.height / innerHeight) * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    return best;
  };

  /* -------------------------------------------------------------- metadata */

  BT.videoMeta = function () {
    var href = location.href;
    var idM = href.match(/\/video\/(\d+)/);
    var author = "";
    var authorM = href.match(/tiktok\.com\/@([^/?#]+)/);
    if (authorM) {
      author = authorM[1];
    } else {
      try {
        var el = document.querySelector(
          '[data-e2e="video-author-uniqueid"], [data-e2e="browse-user-uniqueid"]'
        );
        if (el) author = (el.textContent || "").replace(/^@/, "").trim();
      } catch (e) { /* ignore */ }
    }
    var title = "";
    try {
      var desc = document.querySelector(
        '[data-e2e="browse-video-desc"], [data-e2e="video-desc"], [data-e2e="feed-video-desc"]'
      );
      title = ((desc && desc.textContent) || "").trim();
    } catch (e) { /* ignore */ }
    if (!title) title = (document.title || "").replace(/\s*on TikTok.*$/i, "").trim();

    return {
      id: idM ? idM[1] : "",
      author: author,
      title: title
    };
  };

  BT.fileName = function (meta, ext) {
    var base = (meta.author ? "@" + meta.author : "tiktok") + "_" + (meta.id || Date.now());
    base = base.replace(/[^\w.@-]+/g, "-").slice(0, 80);
    return "BetterTikTok/" + base + "." + ext;
  };

  /* --------------------------------------------------- main-world bridge */

  BT.requestState = function () {
    return new Promise(function (resolve) {
      var done = false;

      function fromDataset() {
        try {
          var raw = document.documentElement.getAttribute("data-bt-state");
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      }

      function finish(data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        document.removeEventListener("bt-state-response", onResp);
        resolve(data || fromDataset());
      }

      function onResp(e) {
        finish(e && e.detail ? e.detail : null);
      }

      document.addEventListener("bt-state-response", onResp);
      try {
        document.dispatchEvent(new CustomEvent("bt-state-request"));
      } catch (e) { /* ignore */ }

      var timer = setTimeout(function () {
        finish(fromDataset());
      }, 700);
    });
  };

  /* ----------------------------------------------------------- clipboard */

  BT.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  };

  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------- geometry */

  BT.sectionAncestor = function (el, minW, minH) {
    var cur = el;
    for (var i = 0; i < 8 && cur && cur !== document.body; i++) {
      var r = cur.getBoundingClientRect();
      if (r.width >= minW && r.height >= minH) return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  BT.scrollParent = function (el) {
    var p = el ? el.parentElement : null;
    while (p && p !== document.body && p !== document.documentElement) {
      var st = getComputedStyle(p);
      if (/(auto|scroll)/.test(st.overflowY) && p.scrollHeight > p.clientHeight + 40) {
        return p;
      }
      p = p.parentElement;
    }
    return null;
  };
})();
