<div align="center">

# BetterTikTok

**An open-source Chromium extension that makes TikTok better.**

One-click video downloads · decluttered layout · ad hiding · a floating
player toolbar · keyboard shortcuts · a smoother UI

[Features](#features) · [Install](#install) · [Shortcuts](#keyboard-shortcuts) ·
[Settings](#settings) · [Development](#development) · [License](#license)

</div>

---

## About

An extension for Chromium based browsers that is fully open-source. It highly
improves Tiktok and makes it a better experience.

BetterTikTok runs entirely on top of the normal TikTok website — no accounts,
no proxies, no servers. Everything is plain Manifest V3 HTML/CSS/JS with zero
build step and zero dependencies.

## Features

| Feature | What it does |
| --- | --- |
| ⬇ **Video download** | One click saves the video you're watching as `BetterTikTok/@author_videoid.mp4`. Also available via the `D` shortcut and the right-click menu. |
| 🖼 **Cover download** | Save the video's thumbnail/cover image. |
| 🎛 **Player toolbar** | A floating, draggable, collapsible glass panel: download, cover, play/pause, mute, speed (0.5×–2×), Picture-in-Picture, fullscreen, copy link. Its position is remembered. |
| 🚫 **Ad hiding** | Promoted/sponsored posts are detected and hidden from the feed. |
| 🧹 **Layout cleanup** | Hide the right-hand suggestion rail and/or the comments column — each is its own toggle. |
| 🎯 **Focus mode** | Dims navigation and sidebars so the video stands out. |
| ✨ **Smooth UI** | Smooth scrolling, slim scrollbars and subtle hover fades. |
| ⌨️ **Keyboard shortcuts** | Full control of the player without touching the mouse — press `?` for the cheatsheet. |
| 🧩 **Popup & options page** | Quick toggles in the popup; every setting, custom CSS, and export/import in the options page. |
| 🔒 **Private** | No analytics, no external requests, no accounts. Settings live in `chrome.storage.sync` and nowhere else. |

## Install

### From a release (recommended)

1. Download `bettertiktok-vX.Y.Z.zip` from the
   [latest release](../../releases/latest) and unzip it.
2. Open `chrome://extensions` in a Chromium-based browser (Chrome, Edge,
   Brave, Vivaldi, Opera, …).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `bettertiktok-vX.Y.Z`
   folder.

### From source

```bash
git clone https://github.com/4tru/bettertiktok.git
cd bettertiktok
```

Then follow steps 2–4 above, selecting the repository folder itself.

> TikTok occasionally changes its website. If something stops being hidden or
> a button disappears, check the [issues](../../issues) — and until a release
> fixes it, you can hide anything yourself with the **Custom CSS** setting.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / pause |
| <kbd>↑</kbd> <kbd>↓</kbd> | Volume up / down |
| <kbd>←</kbd> <kbd>→</kbd> | Seek −5 s / +5 s |
| <kbd>J</kbd> <kbd>L</kbd> | Seek −10 s / +10 s |
| <kbd>M</kbd> | Mute / unmute |
| <kbd>P</kbd> | Picture-in-Picture |
| <kbd>F</kbd> | Fullscreen |
| <kbd>D</kbd> | Download video |
| <kbd>C</kbd> | Copy video link |
| <kbd>N</kbd> | Next video |
| <kbd>B</kbd> | Previous video |
| <kbd>T</kbd> | Show/hide the toolbar |
| <kbd>?</kbd> | Show/hide the shortcut cheatsheet |
| <kbd>Esc</kbd> | Close overlays |

All shortcuts can be disabled (and every feature can be turned off) from the
options page.

## Settings

Click the extension icon for quick toggles, or open the options page via
**⚙ All settings** for everything:

- **Downloads** — toolbar button, cover button, right-click menu entry
- **Player & toolbar** — toolbar visibility, remember speed, default speed
- **Layout & appearance** — ads, sidebar, comments, focus mode, smooth UI
- **Shortcuts & feedback** — hotkeys, toast notifications
- **Advanced** — custom CSS, toolbar position reset, settings export/import,
  factory reset

## Permissions

| Permission | Why it's needed |
| --- | --- |
| `storage` | Save your settings (`chrome.storage.sync`). |
| `downloads` | Save videos and cover images to your computer. |
| `contextMenus` | The right-click “Download video” entry. |
| `clipboardWrite` | The copy-link button. |
| Access to `tiktok.com` | Inject the toolbar, shortcuts and layout rules. |

Nothing ever leaves your browser.

## Development

The project has **no build step and no dependencies** — the source *is* the
extension.

```bash
# load ./src-based repo folder via chrome://extensions → Load unpacked

# regenerate icons (Pillow required)
python3 scripts/generate_icons.py

# package a release zip (uses git archive)
bash scripts/build.sh

# sanity checks
find src -name '*.js' -print0 | xargs -0 -n1 node --check
jq . manifest.json
```

Project layout:

```
manifest.json              Manifest V3 definition
src/
  background.js            service worker: downloads + context menu
  common/
    defaults.js            settings defaults + feature metadata (shared)
    toggle.css             shared switch/row styling
  content/
    inject.js              MAIN-world helper (reads TikTok's page state)
    util.js                storage, toasts, video picker, helpers
    downloader.js          video/cover resolution + download
    layout.js              ad/sidebar/comment detection + mode classes
    player.js              floating toolbar
    shortcuts.js           hotkeys + help overlay
    main.js                bootstrap, settings sync, SPA watching
    styles.css             everything injected into tiktok.com
  popup/                   toolbar popup
  options/                 full settings page
  icons/                   generated icons (see scripts/)
scripts/                   icon generator + release packaging
.github/workflows/ci.yml   validation + packaging on every push
```

Contributions are welcome — open an issue or a pull request.

## Disclaimer

BetterTikTok is an independent, open-source project. It is not affiliated
with, endorsed by, or connected to TikTok or ByteDance. Downloaded content
remains subject to TikTok's terms and the copyright of its creators — please
only download videos you have the right to use.

## License

[MIT](LICENSE) © 4tru
