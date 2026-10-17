# Changelog

All notable changes to BetterTikTok are documented here.

## [1.0.0] – 2026-10-17

First release. 🎉

### Added

- **One-click video download** — floating toolbar button, keyboard shortcut
  (`D`) and a right-click "Download video (BetterTikTok)" menu entry.
  Resolves the file from the player, the network timeline or TikTok's page
  state, and saves it as `BetterTikTok/@author_videoid.mp4`.
- **Cover image download** — save the video's thumbnail/cover.
- **Floating player toolbar** — draggable, collapsible glass panel with
  download, cover, play/pause, mute, playback speed (0.5×–2×), Picture-in-
  Picture, fullscreen and copy-link. Position is remembered.
- **Layout cleanup** — hide promoted/sponsored posts, the right-hand
  suggestion rail and the comments column. Each is an independent, instantly
  reversible toggle.
- **Focus mode** — dims navigation and sidebars so the video stands out.
- **Smooth UI** — smooth scrolling, slim scrollbars and subtle hover fades.
- **Keyboard shortcuts** — Space, arrows, J/L, M, P, F, D, C, N, B and `?`
  for an in-page shortcut cheatsheet.
- **Popup** — current-video status, quick actions and the most-used toggles.
- **Options page** — every setting grouped and described, default speed,
  custom CSS escape hatch, toolbar-position reset, settings export/import
  and a one-click reset.
- **Privacy-respecting by design** — no analytics, no external requests,
  settings stay in `chrome.storage.sync`.
