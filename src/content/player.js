/*
 * BetterTikTok – floating player toolbar.
 *
 * A small, draggable, collapsible glass panel that floats over TikTok and
 * gives you download, cover, play/pause, mute, speed, PiP, fullscreen and
 * copy-link in one place. Position is remembered.
 */
(function () {
  "use strict";

  var BT = globalThis.BT;

  /* Inner markup only – buildIcon() adds the <svg> wrapper. */
  var ICONS = {
    download: '<path d="M12 3v11m0 0l-4.5-4.5M12 14l4.5-4.5M4.5 20h15"/>',
    image:
      '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 15.5l-4.5-4.5-6.5 7.5"/>',
    play: '<path class="bt-i-play" d="M8 5.5l11 6.5-11 6.5z"/>',
    pause: '<path class="bt-i-pause" d="M8.5 5h2.5v14H8.5zM13 5h2.5v14H13z"/>',
    volume:
      '<g class="bt-i-vol"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></g>',
    muted:
      '<g class="bt-i-mute"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM16 9.5l5 5m0-5l-5 5"/></g>',
    pip: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="12" y="11.5" width="7" height="5.5" rx="1.2"/>',
    fullscreen: '<path d="M4 9V4.5h5M20 9V4.5h-5M4 15v4.5h5M20 15v4.5h-5"/>',
    link:
      '<path d="M10.5 13.5a4.5 4.5 0 006.4 0l2.6-2.6a4.5 4.5 0 10-6.4-6.4l-1.3 1.3"/><path d="M13.5 10.5a4.5 4.5 0 00-6.4 0l-2.6 2.6a4.5 4.5 0 106.4 6.4l1.3-1.3"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="2.6"/>',
    chevron: '<path d="M8 10l4 4 4-4"/>'
  };

  function buildIcon(name) {
    var inner = ICONS[name] || "";
    /* Solid glyphs (play/pause) need fill; the rest are stroked. */
    inner = inner.replace(/<path class="bt-i-(?:play|pause)"[^>]*\/>/g, function (m) {
      return "<g fill=\"currentColor\" stroke=\"none\">" + m + "</g>";
    });
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      inner +
      "</svg>"
    );
  }

  var BUTTONS = [
    { act: "download", icon: "download", title: "Download video (D)" },
    { act: "cover", icon: "image", title: "Download cover image" },
    { act: "play", icon: "play", title: "Play / pause (Space)", dual: ["play", "pause"] },
    { act: "mute", icon: "volume", title: "Mute / unmute (M)", dual: ["volume", "muted"] },
    { act: "speed", icon: null, title: "Playback speed", text: "1×" },
    { act: "pip", icon: "pip", title: "Picture-in-Picture (P)" },
    { act: "fs", icon: "fullscreen", title: "Fullscreen (F)" },
    { act: "link", icon: "link", title: "Copy link (C)" }
  ];

  BT.player = {
    panel: null,
    grid: null,
    speedBtn: null,
    playBtn: null,
    muteBtn: null,
    collapsed: false,
    lastX: 0,
    lastY: 0,

    init: function () {
      if (document.getElementById("bt-panel")) return;

      var panel = document.createElement("div");
      panel.id = "bt-panel";
      panel.setAttribute("role", "toolbar");
      panel.setAttribute("aria-label", "BetterTikTok controls");

      var head = document.createElement("div");
      head.className = "bt-head";
      head.innerHTML =
        '<span class="bt-grip" title="Drag to move">' + buildIcon("grip") + "</span>" +
        '<button type="button" class="bt-collapse" title="Collapse toolbar (T)">' +
        buildIcon("chevron") + "</button>";
      panel.appendChild(head);

      var grid = document.createElement("div");
      grid.className = "bt-grid";
      for (var i = 0; i < BUTTONS.length; i++) {
        var cfg = BUTTONS[i];
        var b = document.createElement("button");
        b.type = "button";
        b.dataset.act = cfg.act;
        b.title = cfg.title;
        if (cfg.dual) {
          b.innerHTML =
            buildIcon(cfg.dual[0]) + buildIcon(cfg.dual[1]);
        } else if (cfg.icon) {
          b.innerHTML = buildIcon(cfg.icon);
        } else {
          b.textContent = cfg.text;
          b.classList.add("bt-speed");
        }
        grid.appendChild(b);
      }
      panel.appendChild(grid);

      (document.body || document.documentElement).appendChild(panel);
      this.panel = panel;
      this.grid = grid;
      this.speedBtn = grid.querySelector('[data-act="speed"]');
      this.playBtn = grid.querySelector('[data-act="play"]');
      this.muteBtn = grid.querySelector('[data-act="mute"]');

      grid.addEventListener("click", this.onClick.bind(this));
      head
        .querySelector(".bt-collapse")
        .addEventListener("click", this.toggleCollapsed.bind(this));
      this.bindDrag(head);

      this.restorePos();
      this.refresh();

      var self = this;
      document.addEventListener(
        "play",
        function () {
          self.scheduleRefresh();
        },
        true
      );
      document.addEventListener(
        "pause",
        function () {
          self.scheduleRefresh();
        },
        true
      );
      document.addEventListener(
        "volumechange",
        function () {
          self.scheduleRefresh();
        },
        true
      );
      document.addEventListener(
        "ratechange",
        function () {
          self.scheduleRefresh();
        },
        true
      );
    },

    /* ------------------------------------------------------------ actions */

    onClick: function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var v = BT.activeVideo();
      var act = btn.dataset.act;
      var self = this;

      if (act === "download") BT.download.video();
      else if (act === "cover") BT.download.cover();
      else if (act === "link") {
        BT.copy(location.href).then(function (ok) {
          BT.toast(ok ? "Link copied ✓" : "Could not copy link", ok ? "" : "error");
        });
      } else if (act === "play") {
        if (!v) return;
        if (v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      } else if (act === "mute") {
        if (v) v.muted = !v.muted;
      } else if (act === "speed") {
        this.cycleSpeed(v);
      } else if (act === "pip") {
        this.togglePip(v);
      } else if (act === "fs") {
        this.toggleFullscreen(v);
      }
      self.scheduleRefresh();
    },

    cycleSpeed: function (v) {
      if (!v) return;
      var speeds = BT.SPEEDS;
      var cur = v.playbackRate || 1;
      var idx = 0;
      for (var i = 0; i < speeds.length; i++) {
        if (Math.abs(speeds[i] - cur) < 0.001) idx = i;
      }
      var next = speeds[(idx + 1) % speeds.length];
      v.playbackRate = next;
      BT.store.set({ lastSpeed: next });
      BT.toast("Speed " + next + "×");
    },

    togglePip: function (v) {
      if (!v) return;
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(function () {});
        } else if (v.requestPictureInPicture) {
          v.requestPictureInPicture().catch(function (err) {
            BT.toast("Picture-in-Picture failed", "error");
          });
        } else {
          BT.toast("Picture-in-Picture is not supported here", "error");
        }
      } catch (e) {
        BT.toast("Picture-in-Picture failed", "error");
      }
    },

    fsTarget: function (v) {
      if (!v) return null;
      var cur = v.parentElement;
      var videoRect = v.getBoundingClientRect();
      for (var i = 0; i < 6 && cur && cur !== document.body; i++) {
        var cls = (cur.className && cur.className.toString && cur.className.toString()) || "";
        var r = cur.getBoundingClientRect();
        if (/player|video/i.test(cls) && r.width >= videoRect.width - 40) return cur;
        cur = cur.parentElement;
      }
      return v.parentElement || v;
    },

    toggleFullscreen: function (v) {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          return;
        }
        var t = this.fsTarget(v);
        if (t && t.requestFullscreen) {
          var p = t.requestFullscreen();
          if (p && p.catch) {
            p.catch(function () {
              if (v && v.webkitEnterFullscreen) v.webkitEnterFullscreen();
            });
          }
        } else if (v && v.webkitEnterFullscreen) {
          v.webkitEnterFullscreen();
        }
      } catch (e) {
        BT.toast("Fullscreen failed", "error");
      }
    },

    /* ------------------------------------------------------------- refresh */

    scheduleRefresh: function () {
      var self = this;
      clearTimeout(this._rt);
      this._rt = setTimeout(function () {
        self.refresh();
      }, 90);
    },

    refresh: function () {
      if (!this.panel) return;
      var v = BT.activeVideo();
      if (this.playBtn) {
        this.playBtn.classList.toggle("bt-hidden", !v);
        if (v) this.playBtn.classList.toggle("bt-on", !v.paused);
      }
      if (this.muteBtn) {
        this.muteBtn.classList.toggle("bt-hidden", !v);
        if (v) this.muteBtn.classList.toggle("bt-on", !!v.muted);
      }
      if (this.speedBtn && v) {
        var r = Math.round((v.playbackRate || 1) * 100) / 100;
        this.speedBtn.textContent = r + "×";
      }
    },

    /* -------------------------------------------------------- drag & state */

    bindDrag: function (handle) {
      var self = this;
      var startX = 0,
        startY = 0,
        origX = 0,
        origY = 0,
        dragging = false;

      handle.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        var pos = self.panel.getBoundingClientRect();
        origX = pos.left;
        origY = pos.top;
        self.panel.classList.add("bt-dragging");
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      handle.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var x = origX + (e.clientX - startX);
        var y = origY + (e.clientY - startY);
        self.moveTo(x, y, false);
      });

      handle.addEventListener("pointerup", function () {
        if (!dragging) return;
        dragging = false;
        self.panel.classList.remove("bt-dragging");
        var r = self.panel.getBoundingClientRect();
        BT.store.set({ panelPos: { x: Math.round(r.left), y: Math.round(r.top) } });
      });
    },

    moveTo: function (x, y, save) {
      if (!this.panel) return;
      var r = this.panel.getBoundingClientRect();
      x = BT.clamp(x, 4, innerWidth - r.width - 4);
      y = BT.clamp(y, 4, innerHeight - r.height - 4);
      this.panel.style.left = Math.round(x) + "px";
      this.panel.style.top = Math.round(y) + "px";
      this.panel.style.right = "auto";
      this.panel.style.bottom = "auto";
      if (save) BT.store.set({ panelPos: { x: Math.round(x), y: Math.round(y) } });
    },

    restorePos: function () {
      var pos = (BT.state && BT.state.panelPos) || null;
      if (pos && typeof pos.x === "number") {
        this.moveTo(pos.x, pos.y, false);
      } else {
        this.moveTo(innerWidth - 116, innerHeight - 264, false);
      }
    },

    toggleCollapsed: function () {
      this.collapsed = !this.collapsed;
      this.panel.classList.toggle("bt-collapsed", this.collapsed);
      this.restorePos();
    },

    /* Called when settings change. */
    apply: function () {
      if (!BT.state.playerToolbar) return; /* hidden by CSS rule */
      if (!this.panel) this.init();
      this.restorePos();
      this.refresh();
    },

    applySpeed: function (v) {
      if (!v || !BT.state) return;
      var s = BT.state;
      var target = s.rememberSpeed ? s.lastSpeed || 1 : s.defaultSpeed || 1;
      try {
        if (Math.abs((v.playbackRate || 1) - target) > 0.001) v.playbackRate = target;
      } catch (e) { /* ignore */ }
    }
  };
})();
