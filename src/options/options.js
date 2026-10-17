/*
 * BetterTikTok – options page. Renders every setting from BT.FEATURE_META,
 * saves instantly, and offers export/import/reset plus the shortcut reference.
 */
(function () {
  "use strict";

  var settings = {};
  var savedTimer = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function flashSaved() {
    var el = $("#saved");
    el.hidden = false;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () {
      el.hidden = true;
    }, 1400);
  }

  async function load() {
    settings = await chrome.storage.sync.get(BT.DEFAULTS);
    $("#version").textContent = BT.VERSION;
    renderGroups();
    renderShortcuts();
  }

  async function save(patch) {
    Object.assign(settings, patch);
    await chrome.storage.sync.set(patch);
    flashSaved();
  }

  /* ------------------------------------------------------------ renders */

  function makeSwitchRow(key) {
    var meta = BT.FEATURE_META[key];

    var row = document.createElement("label");
    row.className = "row";

    var label = document.createElement("span");
    label.className = "label";
    var b = document.createElement("b");
    b.textContent = meta.label;
    var small = document.createElement("small");
    small.textContent = meta.desc;
    label.appendChild(b);
    label.appendChild(small);

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

    input.addEventListener("change", function () {
      var patch = {};
      patch[key] = input.checked;
      save(patch);
    });

    return row;
  }

  function makeSelectRow(key) {
    var meta = BT.FEATURE_META[key];

    var row = document.createElement("div");
    row.className = "row";

    var label = document.createElement("span");
    label.className = "label";
    var b = document.createElement("b");
    b.textContent = meta.label;
    var small = document.createElement("small");
    small.textContent = meta.desc;
    label.appendChild(b);
    label.appendChild(small);

    var select = document.createElement("select");
    meta.options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = String(opt);
      o.textContent = meta.optionLabel ? meta.optionLabel(opt) : String(opt);
      if (Number(settings[key]) === opt) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener("change", function () {
      var patch = {};
      patch[key] = Number(select.value);
      save(patch);
    });

    row.appendChild(label);
    row.appendChild(select);
    return row;
  }

  function makeTextareaRow(key) {
    var meta = BT.FEATURE_META[key];

    var wrap = document.createElement("div");
    wrap.className = "row block";

    var label = document.createElement("span");
    label.className = "label";
    var b = document.createElement("b");
    b.textContent = meta.label;
    var small = document.createElement("small");
    small.textContent = meta.desc;
    label.appendChild(b);
    label.appendChild(small);

    var ta = document.createElement("textarea");
    ta.className = "custom-css";
    ta.spellcheck = false;
    ta.placeholder = "/* e.g. hide something TikTok added */\n.SomeNewClass { display: none !important; }";
    ta.maxLength = 6000;
    ta.value = settings[key] || "";
    ta.addEventListener(
      "input",
      BT_DEBOUNCE(function () {
        save({ customCss: ta.value });
      }, 400)
    );

    wrap.appendChild(label);
    wrap.appendChild(ta);
    return wrap;
  }

  /* tiny local debounce (options page has no content-script utils) */
  function BT_DEBOUNCE(fn, ms) {
    var t = null;
    return function () {
      var args = arguments,
        self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, ms);
    };
  }

  function renderGroups() {
    var root = $("#groups");
    root.textContent = "";

    BT.GROUPS.forEach(function (group) {
      var card = document.createElement("section");
      card.className = "card";

      var h = document.createElement("h2");
      h.textContent = group.label;
      card.appendChild(h);

      group.keys.forEach(function (key) {
        var meta = BT.FEATURE_META[key];
        if (!meta) return;
        if (key === "lastSpeed" || BT.INTERNAL_KEYS.indexOf(key) !== -1) return;
        if (meta.type === "select") card.appendChild(makeSelectRow(key));
        else if (meta.type === "textarea") card.appendChild(makeTextareaRow(key));
        else card.appendChild(makeSwitchRow(key));
      });

      root.appendChild(card);
    });
  }

  function renderShortcuts() {
    var box = $("#shortcuts");
    box.textContent = "";
    BT.SHORTCUTS.forEach(function (sc) {
      var row = document.createElement("div");

      var k = document.createElement("span");
      k.className = "k";
      sc.keys.forEach(function (key) {
        var kbd = document.createElement("kbd");
        kbd.textContent = key;
        k.appendChild(kbd);
      });

      var d = document.createElement("span");
      d.className = "d";
      d.textContent = sc.desc;

      row.appendChild(k);
      row.appendChild(d);
      box.appendChild(row);
    });
  }

  /* ---------------------------------------------------------- data ops */

  function exportSettings() {
    var blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "bettertiktok-settings.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function importSettings(file) {
    var reader = new FileReader();
    reader.onload = async function () {
      try {
        var data = JSON.parse(String(reader.result));
        var patch = {};
        Object.keys(BT.DEFAULTS).forEach(function (key) {
          if (!(key in data)) return;
          var want = typeof BT.DEFAULTS[key];
          var got = typeof data[key];
          if (want === "object") {
            /* panelPos: accept a valid position object, else default */
            var v = data[key];
            patch[key] =
              v && typeof v.x === "number" && typeof v.y === "number"
                ? { x: v.x, y: v.y }
                : BT.DEFAULTS[key];
          } else if (got === want) {
            patch[key] = data[key];
          }
        });
        await chrome.storage.sync.set(patch);
        settings = await chrome.storage.sync.get(BT.DEFAULTS);
        renderGroups();
        flashSaved();
      } catch (e) {
        alert("That file doesn't look like a BetterTikTok settings export.");
      }
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------- wiring */

  document.addEventListener("DOMContentLoaded", function () {
    load();

    $("#reset-pos").addEventListener("click", async function () {
      await save({ panelPos: null });
      this.textContent = "Position reset ✓";
      var btn = this;
      setTimeout(function () {
        btn.textContent = "Reset toolbar position";
      }, 1400);
    });

    $("#export").addEventListener("click", exportSettings);

    $("#import").addEventListener("click", function () {
      $("#import-file").click();
    });

    $("#import-file").addEventListener("change", function () {
      if (this.files && this.files[0]) importSettings(this.files[0]);
      this.value = "";
    });

    $("#reset").addEventListener("click", async function () {
      if (!confirm("Reset all BetterTikTok settings to their defaults?")) return;
      await chrome.storage.sync.set(BT.DEFAULTS);
      settings = await chrome.storage.sync.get(BT.DEFAULTS);
      renderGroups();
      flashSaved();
    });
  });
})();
