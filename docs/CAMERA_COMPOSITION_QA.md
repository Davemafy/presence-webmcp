# Presence — Camera Composition QA

This pass changes only workspace composition/navigation presentation. Domain authority, WebMCP handlers, revisions, fingerprints, audit events, proposal semantics, admission, and permission enforcement remain untouched.

## Release behavior

- Initial load and Arrange Devices use viewport-aware geometry.
- Desktop / Tablet / Mobile remain visible together at recording sizes; narrow desktop workspaces use a compact read-only Desktop reference card rather than shrinking every active surface below readability.
- Tablet is the canonical initial selection.
- Fit Selection reads `selectedDeviceIds`, includes title/handle/shadow bounds, occupies roughly 82% of the unobstructed canvas, and transitions in 280ms.
- Fit All includes complete outer bounds and is deterministic/idempotent.
- Manual wheel/pinch zoom and manual pan remain crisp/direct. Commanded Fit operations are the only camera actions that animate.
- Proof is a resizable right drawer on wide screens and a bottom sheet on narrow screens. It reserves workspace space instead of covering the active canvas.
- Run the Proof reserves a right-side guide lane on wide screens and collapses on direct canvas interaction; it reopens when a real human admission/publication decision is required.
- Vacant Tablet renders the real Tablet page beneath a restrained read-only dimmer.

## Browser coverage added

`e2e/composition.spec.ts` covers the requested 1440×900, 1280×800, and 1024×768 arrangements; Tablet/Mobile selection; Fit Selection; Fit All idempotence; off-screen recovery; Proof camera preservation; proof-guide collisions; Tablet 820 resize; Undo; viewport resize; vacant Tablet; and console warnings/errors. It also writes the requested screenshot moments to `artifacts/` when Playwright runs.

## Current environment limitation

The source checks and syntax/CSS parsing pass in this workspace. Full browser execution still requires an environment where project dependencies can be installed and Chromium is permitted to navigate to the local dev server. The current sandbox blocks both npm registry DNS and Chromium localhost/file navigation, so visual screenshots must be generated in the normal development/CI environment before release is declared complete.
