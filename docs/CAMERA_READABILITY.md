# Presence camera + readability contract

Presence defaults to intelligent framing. Manual camera controls remain available, but normal editing should not require them.

## Modes

- **Overview** — all devices, semantic low-zoom rendering, optional minimap.
- **Edit** — selected device becomes the readable primary surface; other devices remain context.
- **Review** — full workspace review with fixed human decision controls.

## Shortcuts

- `0` Overview
- `1` Desktop
- `2` Tablet
- `3` Mobile
- `F` Fit selected device
- `Shift+F` Fit all
- `Cmd/Ctrl+0` 100%
- `Cmd/Ctrl++` / `Cmd/Ctrl+-` zoom

Wheel/trackpad scrolling inside an Aurora device belongs to that device. Outer-canvas pan only occurs on empty workspace. Device scroll positions survive breakpoint switching.

Proposal review is always surfaced in editor chrome, never hidden inside a scaled device.
