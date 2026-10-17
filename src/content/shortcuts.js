/*
 * BetterTikTok – keyboard shortcuts + in-page help overlay.
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  function editable(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'
    );
  }

  function seek(v, delta) {
    if (!v) return;
    try {
      v.currentTime = Math.max(0, (v.currentTime || 0) + delta);
    } catch (e) { /* ignore */ }
  }

  function volume(v, delta) {
    if (!v) return;
    try {
      v.muted = false;
      v.volume = BT.clamp((v.volume || 0) + delta, 0, 1);
      BT.toast("Volume " + Math.round(v.volume * 100) + "%");
    } catch (e) { /* ignore */ }
  }

  function scrollFeed(dir) {
    var v = BT.activeVideo();
    var parent = BT.scrollParent(v);
    var behavior = (BT.state && BT.state.smoothUi) ? "smooth" : "auto";
    if (parent) {
      parent.scrollBy({ top: parent.clientHeight * dir, behavior: behavior });
    } else {
      window.scrollBy({ top: innerHeight * dir, behavior: behavior });
    }
  }

  BT.shortcuts = {
    overlay: null,

    init: function () {
      var self = this;
      document.addEventListener(
        "keydown",
        function (e) {
          self.onKey(e);
        },
        true
      );
    },

    ensureOverlay: function () {
      if (this.overlay && document.body.contains(this.overlay)) return this.overlay;

      var wrap = document.createElement("div");
      wrap.id = "bt-shortcuts";
      wrap.hidden = true;

      var card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-label", "BetterTikTok keyboard shortcuts");

      var html =
        '<header><span>BetterTikTok shortcuts</span>' +
        '<button type="button" class="bt-x" title="Close (Esc)">×</button></header><dl>';
      for (var i = 0; i < BT.SHORTCUTS.length; i++) {
        var sc = BT.SHORTCUTS[i];
        var keys = sc.keys
          .map(function (k) {
            return "<kbd>" + k + "</kbd>";
          })
          .join(" ");
        html += "<div><dt>" + keys + "</dt><dd>" + sc.desc + "</dd></div>";
      }
      html += "</dl>";
      card.innerHTML = html;
      wrap.appendChild(card);
      document.body.appendChild(wrap);

      var self = this;
      wrap.addEventListener("click", function (e) {
        if (e.target === wrap || e.target.closest(".bt-x")) self.toggleOverlay(false);
      });

      this.overlay = wrap;
      return wrap;
    },

    toggleOverlay: function (force) {
      var el = this.ensureOverlay();
      var show = typeof force === "boolean" ? force : el.hidden;
      el.hidden = !show;
    },

    onKey: function (e) {
      if (!BT.state || !BT.state.keyboardShortcuts) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      var overlayOpen = this.overlay && !this.overlay.hidden;

      if (e.key === "Escape") {
        if (overlayOpen) {
          this.toggleOverlay(false);
          e.preventDefault();
        }
        return;
      }

      if (e.key === "?") {
        this.toggleOverlay();
        e.preventDefault();
        return;
      }

      if (overlayOpen) return;
      if (editable(e.target)) return;

      var v = BT.activeVideo();

      switch (e.key) {
        case " ":
          if (!v) return;
          if (v.paused) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            v.pause();
          }
          e.preventDefault();
          break;
        case "ArrowUp":
          volume(v, 0.1);
          e.preventDefault();
          break;
        case "ArrowDown":
          volume(v, -0.1);
          e.preventDefault();
          break;
        case "ArrowLeft":
          seek(v, -5);
          e.preventDefault();
          break;
        case "ArrowRight":
          seek(v, 5);
          e.preventDefault();
          break;
        case "j":
        case "J":
          seek(v, -10);
          break;
        case "l":
        case "L":
          seek(v, 10);
          break;
        case "m":
        case "M":
          if (v) {
            v.muted = !v.muted;
            BT.toast(v.muted ? "Muted" : "Unmuted");
          }
          break;
        case "p":
        case "P":
          BT.player.togglePip(v);
          break;
        case "f":
        case "F":
          BT.player.toggleFullscreen(v);
          break;
        case "d":
        case "D":
          BT.download.video();
          break;
        case "c":
        case "C":
          BT.copy(location.href).then(function (ok) {
            BT.toast(ok ? "Link copied ✓" : "Could not copy link", ok ? "" : "error");
          });
          break;
        case "n":
        case "N":
          scrollFeed(1);
          break;
        case "b":
        case "B":
          scrollFeed(-1);
          break;
        case "t":
        case "T":
          BT.player.toggleCollapsed();
          break;
        default:
          return;
      }
    }
  };
})();
