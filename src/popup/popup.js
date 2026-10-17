/*
 * BetterTikTok – popup logic. Writes settings to chrome.storage.sync (content
 * scripts react via storage.onChanged) and drives the quick-action buttons.
 */
(function () {
  "use strict";

  var settings = {};
  var onTikTok = false;

  function $(sel) {
    return document.querySelector(sel);
  }

  async function load() {
    settings = await chrome.storage.sync.get(BT.DEFAULTS);
    $("#version").textContent = "v" + BT.VERSION;
    renderToggles();
    queryTab();
  }

  /* ----------------------------------------------------------- toggles */

  function renderToggles() {
    var box = $("#toggles");
    box.textContent = "";

    BT.POPUP_FEATURES.forEach(function (key) {
      var meta = BT.FEATURE_META[key];
      if (!meta) return;

      var row = document.createElement("label");
      row.className = "row";

      var label = document.createElement("span");
      label.className = "label";
      var b = document.createElement("b");
      b.textContent = meta.label;
      label.appendChild(b);

      var sw = document.createElement("span");
      sw.className = "sw";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!settings[key];
      var track = document.createElement("span");
      track.className = "track";
      sw.appendChild(input);
      sw.appendChild(track);

      row.appendChild(label);
      row.appendChild(sw);
      box.appendChild(row);

      input.addEventListener("change", function () {
        settings[key] = input.checked;
        var patch = {};
        patch[key] = input.checked;
        chrome.storage.sync.set(patch);
      });
    });
  }

  /* -------------------------------------------------------- tab queries */

  function setActionsEnabled(enabled) {
    ["act-download", "act-cover", "act-copy", "act-play"].forEach(function (id) {
      $("#" + id).disabled = !enabled;
    });
  }

  function setNotOnTikTok(msg) {
    onTikTok = false;
    var st = $("#status");
    st.classList.add("off");
    st.querySelector(".status-title").textContent = msg || "Open TikTok to get started";
    st.querySelector(".status-sub").textContent =
      "BetterTikTok works on tiktok.com";
    setActionsEnabled(false);
  }

  function setStatus(state) {
    onTikTok = true;
    var st = $("#status");
    var title = st.querySelector(".status-title");
    var sub = st.querySelector(".status-sub");

    if (state.note) {
      st.classList.add("off");
      title.textContent = "Ready after reload";
      sub.textContent = state.note;
      setActionsEnabled(false);
      return;
    }

    if (state.hasVideo) {
      st.classList.remove("off");
      title.textContent = state.title || "Current video";
      sub.textContent = (state.author ? "@" + state.author + " · " : "") +
        (state.paused ? "paused" : "playing");
      setActionsEnabled(true);
    } else {
      st.classList.add("off");
      title.textContent = "No video on this page";
      sub.textContent = "Open a video or the For You feed";
      setActionsEnabled(false);
    }
  }

  async function queryTab() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs && tabs[0];
    if (!tab || !tab.url || !/tiktok\.com/i.test(tab.url)) {
      setNotOnTikTok();
      return;
    }
    try {
      var state = await chrome.tabs.sendMessage(tab.id, { type: "BT_GET_STATE" });
      setStatus(state || { hasVideo: false });
    } catch (e) {
      setStatus({ note: "Reload the TikTok tab once after installing." });
    }
  }

  async function send(type, btn, busyLabel) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs && tabs[0];
    if (!tab) return;
    var oldLabel = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = busyLabel || "…";
    }
    try {
      await chrome.tabs.sendMessage(tab.id, { type: type });
    } catch (e) {
      /* toast is shown by the content script when possible */
    }
    setTimeout(function () {
      if (btn) {
        btn.textContent = oldLabel;
        btn.disabled = !onTikTok;
      }
    }, 700);
  }

  /* ------------------------------------------------------------- wiring */

  document.addEventListener("DOMContentLoaded", function () {
    load();

    $("#act-download").addEventListener("click", function () {
      send("BT_DOWNLOAD_VIDEO", this, "…");
    });
    $("#act-cover").addEventListener("click", function () {
      send("BT_DOWNLOAD_COVER", this, "…");
    });
    $("#act-copy").addEventListener("click", function () {
      send("BT_COPY_LINK", this, "✓");
    });
    $("#act-play").addEventListener("click", function () {
      send("BT_TOGGLE_PLAY", this, "…");
    });
    $("#open-options").addEventListener("click", function () {
      chrome.runtime.openOptionsPage();
    });
  });
})();
