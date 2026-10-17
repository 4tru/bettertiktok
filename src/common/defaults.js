/*
 * BetterTikTok – shared defaults, feature metadata and reference data.
 * Loaded first in the content scripts, the popup, the options page and
 * (optionally) the service worker, so everything agrees on one source of truth.
 */
(function (global) {
  "use strict";

  var BT = (global.BT = global.BT || {});

  BT.VERSION = "1.0.0";

  /* Every user-facing setting, with its default value. */
  BT.DEFAULTS = {
    /* Downloads */
    downloadButton: true, // floating toolbar download button
    coverDownload: true, // button that saves the thumbnail
    contextDownload: true, // "Download video (BetterTikTok)" context menu
    /* Player */
    playerToolbar: true, // floating toolbar itself
    rememberSpeed: true, // keep the last selected playback speed
    defaultSpeed: 1, // used when "remember speed" is off
    lastSpeed: 1, // internal: last speed picked by the user
    /* Layout */
    hideAds: true, // hide promoted / sponsored posts
    hideSidebar: true, // hide the right-hand suggestion rail
    hideComments: false, // collapse the comments column
    focusMode: false, // dim nav, sidebars and chrome
    smoothUi: true, // smooth scrolling + slim scrollbars
    /* Shortcuts & feedback */
    keyboardShortcuts: true, // enable hotkeys
    toasts: true, // little confirmation messages
    /* Advanced */
    panelPos: null, // {x, y} of the floating toolbar
    customCss: "" // extra CSS applied to tiktok.com
  };

  /* Keys that never show up in the UI. */
  BT.INTERNAL_KEYS = ["lastSpeed"];

  BT.FEATURE_META = {
    downloadButton: {
      label: "Download button",
      desc: "Show the download button in the floating toolbar."
    },
    coverDownload: {
      label: "Download cover image",
      desc: "Also offer saving the video's thumbnail/cover."
    },
    contextDownload: {
      label: "Right-click download",
      desc: 'Add "Download video (BetterTikTok)" to the right-click menu of videos.'
    },
    playerToolbar: {
      label: "Player toolbar",
      desc: "Floating panel with download, play, mute, speed, PiP, fullscreen and copy-link."
    },
    rememberSpeed: {
      label: "Remember playback speed",
      desc: "Keep the speed you picked for the next videos."
    },
    defaultSpeed: {
      label: "Default playback speed",
      desc: "Applied when “remember playback speed” is off.",
      type: "select",
      options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      optionLabel: function (v) { return v + "×"; }
    },
    hideAds: {
      label: "Hide promoted content",
      desc: "Automatically hide promoted/sponsored posts from the feed."
    },
    hideSidebar: {
      label: "Hide right sidebar",
      desc: "Remove suggested accounts, trending and “you may like” blocks."
    },
    hideComments: {
      label: "Hide comments panel",
      desc: "Collapse the comments column on video pages."
    },
    focusMode: {
      label: "Focus mode",
      desc: "Dim navigation and sidebars so the video stands out."
    },
    smoothUi: {
      label: "Smooth UI",
      desc: "Smooth scrolling, slim scrollbars and subtle hover fades."
    },
    keyboardShortcuts: {
      label: "Keyboard shortcuts",
      desc: "Enable hotkeys such as Space, D, M, P, N and ?."
    },
    toasts: {
      label: "Toast notifications",
      desc: "Show small confirmation messages for actions."
    },
    customCss: {
      label: "Custom CSS",
      desc: "Extra CSS applied to tiktok.com. Handy if TikTok changes its layout — " +
        "hide anything yourself with selectors, e.g. div.SomeClass { display: none; }",
      type: "textarea"
    }
  };

  BT.GROUPS = [
    { id: "downloads", label: "Downloads", keys: ["downloadButton", "coverDownload", "contextDownload"] },
    { id: "player", label: "Player & toolbar", keys: ["playerToolbar", "rememberSpeed", "defaultSpeed"] },
    { id: "layout", label: "Layout & appearance", keys: ["hideAds", "hideSidebar", "hideComments", "focusMode", "smoothUi"] },
    { id: "feedback", label: "Shortcuts & feedback", keys: ["keyboardShortcuts", "toasts"] },
    { id: "advanced", label: "Advanced", keys: ["customCss"] }
  ];

  /* Toggles shown in the popup, in order. */
  BT.POPUP_FEATURES = [
    "downloadButton",
    "playerToolbar",
    "hideAds",
    "hideSidebar",
    "hideComments",
    "focusMode",
    "smoothUi",
    "keyboardShortcuts"
  ];

  /* Playback-speed presets offered by the toolbar button. */
  BT.SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  /* Keyboard shortcut reference (also used by the in-page help overlay). */
  BT.SHORTCUTS = [
    { keys: ["Space"], desc: "Play / pause the video" },
    { keys: ["↑", "↓"], desc: "Volume up / down" },
    { keys: ["←", "→"], desc: "Seek −5 s / +5 s" },
    { keys: ["J", "L"], desc: "Seek −10 s / +10 s" },
    { keys: ["M"], desc: "Mute / unmute" },
    { keys: ["P"], desc: "Picture-in-Picture" },
    { keys: ["F"], desc: "Fullscreen" },
    { keys: ["D"], desc: "Download video" },
    { keys: ["C"], desc: "Copy video link" },
    { keys: ["N"], desc: "Next video" },
    { keys: ["B"], desc: "Previous video" },
    { keys: ["T"], desc: "Show / hide the toolbar" },
    { keys: ["?"], desc: "Show / hide this help" },
    { keys: ["Esc"], desc: "Close help / panels" }
  ];
})(typeof globalThis !== "undefined" ? globalThis : self);
