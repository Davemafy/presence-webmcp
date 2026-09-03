# Presence — UI specification

## Design thesis
Quiet shell, extraordinary interaction. Presence should feel like serious collaborative software at rest and reveal its novelty through spatial state changes. Learn from the restraint and hierarchy of best-in-class productivity tools without cloning their shell.

## Desktop geometry
At 1536×1024: 56px top bar; 90–125px title band; remaining height is workspace; 45px status bar. Workspace uses three unequal surfaces with 14–16px gaps. Desktop is widest, Tablet is central and visually important, Mobile narrowest. No permanent left navigation. No permanent activity feed. No generic right “AI sidebar.”

## Spatial language
The Tablet surface is the agent seat. Empty, requested, occupied, interrupted, recovered, proposal-ready, and gone are all states of the same region. Permission UI attaches to or occupies Tablet. This continuity is the product’s visual signature.

## Typography
Use a characterful neutral sans for display and a highly legible UI sans. Product title 42–48px desktop, 34px mobile, tight tracking. Surface labels 9–10px uppercase with 0.12–0.16em tracking. Primary body 11–13px. Avoid tiny 7–8px text except decorative in-canvas mock product content.

## Surfaces
App shell: near black (#090a0d family), thin translucent separators, almost no gradients. Product canvases: warm near-white. Border radius 14–18px for major surfaces, 8–10px controls. Shadows deep but subtle; no glow halos.

## Ownership colors
Human uses restrained violet; agent uses cool cyan; reference uses neutral grey. These colors communicate ownership only. Do not flood cards/backgrounds with them.

## Empty Tablet
Must look intentional and desirable: a faint seat/artboard silhouette, “Waiting for a collaborator,” and a one-sentence explanation. It should be the first unusual thing the eye notices without becoming a marketing illustration.

## Request state
Copy hierarchy: BROWSER AGENT → “Wants this seat.” → reason → capabilities. Show exact role `Responsive collaborator`; access `Read all · Propose Tablet`; blocked `Desktop write · Mobile write · Publish`. Buttons: Not now / Admit agent. No hidden permissions.

## Occupied Tablet
Label YOUR AGENT in the frame header. Cursor appears inside live content only after admission. Persistent controls remain small and contextual near the occupied seat: role, pause/resume, remove. Avoid task checklists and fake activity.

## Stale state
Use local visual tension: slightly reduced saturation/brightness, narrow amber border, cursor label “CATCHING UP…”. No full-width warning banner unless accessibility requires an announced status region.

## Review
Large centered sheet, approximately 1000px max width. Left 60–65% preview; right 35–40% operation list. Source, base revision, operation count clearly visible. Accept action belongs to human. Conflicts are shown inline with “Keep mine / Use agent’s / Compare”.

## Responsive behavior
Below ~1100px hide Desktop or Mobile based on available width; never squeeze all canvases into illegibility. Below 760px, use horizontal snap between Tablet and Mobile. Tablet opens first because it contains the admission interaction. Review becomes stacked. Top/status chrome remains compact and sticky.

## Accessibility
Keyboard focus must be obvious. Buttons have accessible names. Ownership is never color-only. Status changes use polite live announcements where appropriate. Reduced-motion preserves state transitions without travel/scale spectacle. Contrast target WCAG AA for functional text.

## Anti-patterns
No cyberpunk blue/purple glow, no 12-card dashboard, no telemetry wall, no “AI copilot” chat sidebar, no fake graph, no equal-weight boxes, no permanent permission inspector, no unexplained autonomous cursor, no modal that visually disconnects admission from the requested Tablet seat.

## Spatial canvas territory

On desktop and medium screens, Desktop, Tablet, and Mobile are persistent artboards in one camera-controlled world. Their internal dimensions and typography do not responsively shrink when the viewport changes; the camera fits, pans, zooms, or focuses the world instead.

The Tablet artboard is the admission surface itself. Vacancy, request, admission, live work, stale interruption, review, acceptance, pause, and revocation all happen in or physically attached to that seat. Review must not become a disconnected dashboard modal on desktop.

Camera behavior is UI state only and must never mutate project/domain state. Dragging empty canvas pans. Trackpad scrolling pans. Ctrl/Command + wheel or pinch zooms around the pointer. `0` fits all surfaces; `1`, `2`, and `3` focus Desktop, Tablet, and Mobile respectively. Frame captions are spatial navigation, not tabs that hide other artboards.
