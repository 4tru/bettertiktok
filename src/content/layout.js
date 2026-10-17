/*
 * BetterTikTok – layout improvements.
 *
 * The approach: mark elements once (ad items, right-rail blocks, comment
 * columns), then let stylesheet rules decide what is actually hidden by
 * toggling classes on <html>. That way every toggle is instant and reversible.
 *
 * TikTok's DOM changes often, so hiding uses both "candidate" selectors (CSS)
 * and text/geometry heuristics (JS) — and users can always hide more with the
 * custom CSS setting.
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  var AD_LABELS = ["promoted", "sponsored"];
  var RAIL_HEADINGS = [
    "suggested accounts",
    "following accounts",
    "you may like",
    "trending",
    "discover more",
    "more to explore",
    "creators to follow",
    "suggested"
  ];

  var scanned = typeof WeakSet === "function" ? new WeakSet() : null;

  function isScanned(el) {
    return scanned ? scanned.has(el) : el.dataset.btScan === "1";
  }

  function markScanned(el) {
    if (scanned) scanned.add(el);
    else el.dataset.btScan = "1";
  }

  function looksLikeAd(el) {
    try {
      if (/promoted|sponsored/i.test(el.getAttribute("aria-label") || "")) return true;
      var nodes = el.querySelectorAll("span, strong, b, div, p");
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.children.length > 2) continue;
        var t = (n.textContent || "").trim().toLowerCase();
        if (AD_LABELS.indexOf(t) !== -1) return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function containsVideo(el) {
    try {
      return !!el.querySelector("video");
    } catch (e) {
      return true; /* be safe */
    }
  }

  BT.layout = {
    customStyle: null,

    init: function () {
      var style = document.createElement("style");
      style.id = "bt-custom-style";
      (document.head || document.documentElement).appendChild(style);
      this.customStyle = style;
    },

    apply: function () {
      var s = BT.state || {};
      var root = document.documentElement;
      root.classList.toggle("bt-toolbar", !!s.playerToolbar);
      root.classList.toggle("bt-hide-ads", !!s.hideAds);
      root.classList.toggle("bt-hide-sidebar", !!s.hideSidebar);
      root.classList.toggle("bt-hide-comments", !!s.hideComments);
      root.classList.toggle("bt-focus", !!s.focusMode);
      root.classList.toggle("bt-smooth", !!s.smoothUi);
      if (this.customStyle) this.customStyle.textContent = s.customCss || "";
      this.scan();
    },

    scan: function () {
      var s = BT.state || {};
      if (s.hideAds) this.scanAds();
      if (s.hideSidebar) this.scanRail();
      if (s.hideComments) this.scanComments();
    },

    /* ----------------------------------------------------------- ads */

    scanAds: function () {
      var root =
        document.getElementById("main-content-others_home") ||
        document.querySelector("main") ||
        document.body;
      if (!root) return;
      var candidates = root.querySelectorAll(
        '[class*="ItemContainer"], [class*="DivVideo"], [class*="DivPlayerContainer"], ' +
          '[data-e2e="feed-item"], article'
      );
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (isScanned(el)) continue;
        markScanned(el);
        if (looksLikeAd(el)) el.classList.add("bt-ad-item");
      }
    },

    /* ------------------------------------------------- right-side rail */

    scanRail: function () {
      var self = this;
      var root = document.body;
      if (!root) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          var t = (node.nodeValue || "").trim().toLowerCase();
          return RAIL_HEADINGS.indexOf(t) !== -1
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      });
      var node;
      var count = 0;
      while ((node = walker.nextNode()) && count < 24) {
        count++;
        var el = node.parentElement;
        if (!el) continue;
        var r = el.getBoundingClientRect();
        /* only the right-hand rail region */
        if (r.left < innerWidth * 0.55) continue;
        var sec = BT.sectionAncestor(el, 170, 90);
        if (!sec || containsVideo(sec)) continue;
        if (!sec.dataset.btKind) {
          sec.dataset.btKind = "rail";
          sec.classList.add("bt-side-block");
        }
      }
    },

    /* ----------------------------------------------- comments column */

    scanComments: function () {
      var root = document.querySelector("main") || document.body;
      if (!root) return;
      var re = /^[\d,.]+\s*k?\s*comments?$/i;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          return re.test((node.nodeValue || "").trim())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      });
      var node;
      var count = 0;
      while ((node = walker.nextNode()) && count < 12) {
        count++;
        var el = node.parentElement;
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (r.left < innerWidth * 0.4) continue;
        var sec = BT.sectionAncestor(el, 280, innerHeight * 0.5);
        if (!sec || containsVideo(sec)) continue;
        if (!sec.dataset.btKind) {
          sec.dataset.btKind = "comments";
          sec.classList.add("bt-comment-block");
        }
      }
    }
  };
})();
