# Presence

**Presence lets your browser agent enter live software as a scoped, visible collaborator.**

The flagship host app is Responsive Studio. Desktop is the reference surface, Mobile belongs to the human, and Tablet begins as an intentionally empty collaborator seat. A browser agent can inspect the workspace, request that seat, receive only human-approved scope, work provisionally in shared state, recover from stale state, submit a proposal for review, and lose authority immediately when paused or removed.

## Immediate review
Open `prototype.html` directly in a browser. It is a dependency-free interactive product proof with the full flagship arc: empty seat → admission → visible agent → shared-state interruption → stale recovery → proposal → human review → accept/revoke.

Run the zero-dependency sanity check with:

```bash
npm run smoke
```

## Production source
The canonical implementation is in `src/` and uses React, TypeScript, Zustand, Framer Motion and the current `document.modelContext.registerTool()` WebMCP surface. Development fallback is intentionally separate from real WebMCP: use `?demo=1` to expose demo-only admission controls when a supported WebMCP runtime is unavailable.

```bash
npm install
npm test
npm run build
```

The environment used to assemble this handoff could not reach the npm registry, so dependency-backed typecheck/Vitest/Vite execution must be rerun in a network-enabled Node environment. The standalone artifact itself has passed syntax/content smoke validation and local HTTP serving.

## Product invariants
Agent mutations are rejected unless the admission is active, the capability is granted, Tablet is in scope, and `expectedRevision` matches the live canonical revision. Agent changes remain provisional until the human accepts them. Pause and revoke remove mutation authority. No cryptographic agent-identity claim is made; permissions are application-level.

## Canonical specs
`docs/PRODUCT.md`, `docs/UX_FLOW.md`, `docs/UI_SPEC.md`, `docs/MOTION_SPEC.md`, `docs/DOMAIN_SPEC.md`, `docs/WEBMCP_SPEC.md`, and `docs/DEMO_AND_QA.md` are the source of truth. `AGENTS.md` is the builder constitution.

## Demo resilience

The primary URL is intentionally usable without a query string. In a browser without WebMCP, Presence exposes a visibly-labelled **Local fallback** that invokes the same admission and domain APIs used by registered WebMCP tools. It has no extra mutation privileges. When WebMCP is available, an external browser agent can discover and request the Tablet seat through the registered semantic tools.

On mobile, Tablet is the primary surface and Mobile is available through the surface switcher so admission remains above the fold instead of turning the desktop stage into a long horizontal/vertical canvas.

## Human editing is real

Mobile is not a static demo canvas. Select Aurora elements directly to expose the contextual **YOU** inspector. Alignment, spacing, padding, CTA width and typography controls mutate the shared project state and increment the canonical revision. The hero copy and product media are direct-manipulation reorder targets using Framer Motion drag/reorder. Undo and redo are also revisioned mutations. Agent Tablet proposals operate on the same responsive design model and become canonical only after human acceptance.


## Final interaction evidence

The flagship path now proves the thesis through real shared state rather than narrated simulation:

- Mobile is a real editable surface: select Navigation, Hero, Headline, CTA, media and feature areas; change layout, alignment, spacing, padding, typography and CTA width; drag hero parts to reorder; undo/redo are revisioned mutations.
- Once admitted, the browser agent visibly inspects semantic Tablet targets and applies provisional operations incrementally. Cursor movement is tied to the actual component being inspected or changed.
- The local collaboration proof deliberately keeps the agent working from its original revision long enough for a real human Mobile edit. If the human changes the project, the next agent write is genuinely rejected as `STALE_STATE`; Presence shows the interruption as “Project changed / Catching up…”, then re-reads the fresh revision and continues.
- Review is spatial and provisional: proposed Tablet targets are blue-outlined, selecting a review row focuses the real changed component, rejecting one operation removes only that previewed property, and accepting the rest commits them to canonical Tablet state.
- Removing the agent revokes its application-level authority. A subsequent mutation attempt returns `ADMISSION_REVOKED` and surfaces a restrained blocked-access proof in the Tablet seat.
- The **Proof** control exposes recent domain events and revisions for judges who want the technical evidence without turning the main workspace into an activity dashboard.

For the 45-second local fallback demo: admit the agent, start agent work, then immediately make a real Mobile edit while the agent is inspecting/adapting Tablet. The stale/recovery sequence is caused by that actual revision change; it is not injected by the agent demo routine.

## Phone authority remote

Presence keeps the normal product fully usable on phones. A separate `/remote/:sessionId` route is intentionally an authority-only companion: it can Admit, Decline, Pause, Resume, Revoke, review/reject proposal operations, and accept/reject proposals, but it never runs the agent and does not replace the editor.

On desktop, choose **Phone authority** to open the pairing sheet and QR code. The remote controls the exact same domain actions as the desktop UI. Revoking from the remote changes the admission state immediately; the next agent mutation is rejected by the same permission engine with `ADMISSION_REVOKED`.

For physical-phone ↔ desktop pairing across devices, configure these Netlify/Vite environment variables and redeploy:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Presence uses an ephemeral Supabase Realtime Broadcast channel named `presence:<sessionId>` only as a transport. No account, database table, or mobile agent runtime is required. Without those variables the same remote flow still works between tabs/windows on the same origin through `BroadcastChannel`, which is useful for local QA.

## Final submission proof sequence

Do not add features after this point. A release candidate is acceptable only when this exact sequence succeeds twice in a row on the deployed build:

1. Select a real Mobile component and change spacing/layout. Confirm the revision increments.
2. Have the browser agent request the Tablet seat. Confirm Tablet is still unassigned until human approval.
3. Approve from desktop or the paired phone authority remote. Confirm the agent cursor appears only after admission.
4. Start Tablet work. While the agent is visibly working, make another real Mobile edit.
5. Confirm the next stale Tablet operation is rejected, the UI shows the old/current revisions, the agent rereads fresh state, then continues.
6. Open Review. Every row must say `TABLET ONLY`; focusing a row must highlight the corresponding Tablet target. Reject one operation and confirm only that provisional property reverts.
7. Accept the remaining proposal. Confirm Mobile stays unchanged and Tablet settles from provisional to canonical.
8. Revoke from the phone authority remote. Confirm the desktop agent cursor disappears and Tablet returns to `UNASSIGNED`.
9. Trigger one more Tablet mutation. Confirm it is denied with `ADMISSION_REVOKED` and a restrained `Blocked` event appears.

The intended final frame is: `Desktop ✓ · Tablet ✓ · Mobile ✓` with no agent in the workspace. The product should be understandable with the demo muted.

## Authority route hardening

The phone authority companion is a real client route: `/remote/:sessionId`, implemented with React Router. Netlify rewrites SPA deep links to `index.html`, so QR scans and direct refreshes resolve correctly instead of returning Netlify's 404 page.

Pairing adapts to the device:
- desktop: QR, session code, copy/open controls;
- phone: `Phone authority` remains available and the sheet replaces the self-scan QR with `Use this device as authority`;
- session ids are normalized before connecting to the authority channel.

The normal `/` route remains the full responsive editor on phone. `/remote/:sessionId` is intentionally the focused human-authority surface.

## Routing and phone authority

Presence uses React Router. `/` is the full responsive editor and `/remote/:sessionId` is the human-authority companion. Netlify SPA fallback is defined in both `netlify.toml` and `public/_redirects`, so direct visits and refreshes on authority links boot the React app instead of returning a Netlify 404.

On a phone, **Phone authority** does not show a QR that the same phone cannot scan. It offers **Use this device as authority**, plus copy/open-link fallbacks. The normal `/` route remains the full editable Presence product on phone; the `/remote/:sessionId` route is deliberately authority-only.

## Spatial workspace

Desktop and laptop workspaces use a single pan/zoom spatial canvas. Desktop, Tablet, and Mobile remain mounted together as fixed artboards; responsive breakpoints no longer remove a proof surface. `Fit` restores the complete three-seat view, +/- controls zoom, and dragging empty canvas space pans the world. Artboard internals and Aurora typography are intentionally unchanged by viewport breakpoints—the outer workspace transform is the only desktop scaling layer. Phone keeps the focused Tablet/Mobile switcher so the full editor remains usable at touch size.

### Flagship proof
Presence is an agent-permission system; Aurora Responsive Studio is the demo surface. The release-critical proof is that real WebMCP mutations survive three attacks: an out-of-scope Mobile write is denied, a stale write is denied without overwriting human work, and a post-revocation Tablet write is denied. These results are emitted by the domain engine and rendered in the Agent Authority evidence drawer.

## Winning-room v4

The responsive demo surfaces now behave as spatial seats rather than fixed CSS slots on desktop:

- Desktop, Tablet, and Mobile can be repositioned independently by dragging their caption/handle.
- Empty-canvas drag still pans the camera; editing inside Mobile still edits the real project.
- Mobile uses a tall phone geometry in the room.
- Fit and semantic focus targets use the live seat coordinates.
- Shared-state topology, stale-state junctions, permission attack trajectories, and revoke denial positions derive from the live seat geometry.
- Reset room restores the canonical demo composition (`R` shortcut).

This is deliberately bounded. Seat placement is local presentation state, not a project revision, permission, or new Figma-like editor model.


## ROOM FOUNDATION v5
Camera modes are explicit: Room, Manual, Reference, Agent, You. Room is the canonical escape hatch and authored composition. Spatial grammar is prioritized over canvas feature growth.

## v6 spatial state repair

Desktop room geometry now uses one physical world scale across all device surfaces: Desktop 1200×760, Tablet 768×900, and Mobile 390×844 are represented at the same 0.5 world scale. Device position, camera position, semantic focus, and drag state are separate concerns. Each seat can be dragged independently from its caption rail without changing camera focus or project revision; focus commands move only the camera. Room/Fit includes all three seats plus the shared project anchor. Default z-order no longer privileges Mobile, and z elevation is temporary while a seat is dragged.

## v7 spatial usability freeze

This pass freezes the canvas feature set and repairs the room around the product grammar:

- bounded 1380×800 useful world rather than an effectively infinite empty canvas
- one physical scale for Desktop 1200×760, Tablet 768×900, Mobile 390×844
- authored canonical positions with independent seat dragging
- soft snap back near each seat's home position
- Room/Reference/Agent/You focus preserve collaboration context
- semantic labels and Shared Project remain legible while zoomed out
- human inspector is screen-space UI outside Mobile, so the phone remains the specimen instead of becoming a nested settings app
- inactive Aurora surfaces recede so Presence ontology owns the hierarchy
- vacant Tablet has stronger spatial affordance
- topology lines are quiet until state makes them meaningful
- real authority events now pull the camera toward Agent + You without changing device geometry
- Reset layout restores canonical seat positions; Room only frames the current room

No domain/WebMCP permission semantics were weakened for this pass.

## v8 — Disband / Regroup
Desktop spatial mode now has an explicit layout state. `Disband` releases Desktop, Tablet, and Mobile from the authored room's magnetic home behavior while preserving the same project, permissions, camera, and live authority topology. Each seat can then be positioned independently. `Regroup` restores the canonical authored collaboration composition and camera. `Reset` also returns to grouped canonical layout. Spatial layout state never mutates Aurora project state or revision.

## v10 solid-room repair

This build freezes canvas feature growth and repairs the spatial interaction engine itself:

- rigid device geometry (Desktop 1200×760, Tablet 768×900, Mobile 390×844 at one shared world scale)
- direct unsmoothed pointer-to-world seat dragging
- no semantic camera/focus updates while a seat is being dragged
- generous overall world bounds in FREE layout instead of hidden per-seat travel envelopes
- edge auto-pan while dragging in FREE layout
- one camera authority (`x`, `y`, `scale`) and one position authority per seat
- connector endpoints update in the same manipulation frame as the dragged seat
- deterministic boot into canonical GROUPED / Room state; transient layout/camera state is not persisted
- Room frames the current arrangement; Regroup/Reset layout restores the authored arrangement
- screen-stabilized seat labels and Shared Project anchor
- explicit FREE LAYOUT indicator and larger grab rails
- system-driven Regroup uses a deliberate settle animation; direct manipulation does not spring or wobble

## v11.2 — smoothness repair
Camera interpolation now updates the world transform directly on the compositor and commits React state only when motion settles. This removes whole-room React renders from every animation frame. Regrouping is also sequenced after the regroup transition class reaches the DOM, so seats animate home instead of snapping before the transition can start.

## v11.3 — Living Room
- Replaced target-by-target exponential camera easing with one interruptible critically-damped camera carrying velocity across focus changes.
- Added causal state packets from the actor seat to Shared Project on real revision-producing activity.
- Shared Project revision visibly settles when canonical state changes and indicates the actor responsible for the latest activity.
- Agent presence has a restrained live signal only while the agent is actively inspecting/working/catching up/ready.
- Admission request wakes the vacant Tablet boundary; the room remains quiet when nothing is happening.
- Authority events exert contextual camera gravity without overriding manual navigation.


## v11.4 — Loose Butter Motion
The v11.3 camera was physically correct but too tightly damped. v11.4 lowers camera natural frequency, retains velocity across interrupted focus changes, widens semantic focus compositions, reduces maximum focus zoom, and lengthens regroup settlement. Direct seat dragging remains 1:1 and unsmoothed; only system-driven camera/layout choreography is loose.


## v11.5 — Sweet Momentum
- Trackpad/wheel navigation accumulates camera velocity and coasts with exponential damping instead of springing every wheel event.
- Pointer panning preserves release velocity for a natural inertial tail.
- Semantic tabs frame the selected seat exactly at the safe-viewport center while preserving incoming camera momentum.
- Dragging any seat activates a continuous camera-follow dead zone; the room travels with the dragged seat while pointer-to-seat attachment stays rigid.
- Device drag remains direct and unsmoothed; only the camera receives inertia.


## v11.7.1 regression repair
- Rebased on v11.6.2 layout/visual foundation.
- Removed v11.7 structural mobile CSS that collapsed Tablet and detached blocked proof from the product surface.
- Mobile scroll fix is now gesture-only on coarse pointers; it does not alter room/world/frame geometry.
- Tablet gets a protected mobile minimum height so live/proof states cannot collapse into a header strip.
- Keeps the real SURFACE_NOT_ASSIGNED demo attempt and stale-state concurrency beat.

## v11.8 — Review Climax
- Review is now a viewport-level human gate rather than an inline seat child, so it cannot be clipped by spatial seat overflow/transforms.
- Review activation is isolated from room pointer/pan handling and guarded to ready proposals with at least one operation.
- Acceptance explicitly previews the canonical revision advance and remains a human-only action.
- Added a domain regression test for working -> ready -> open review -> accept -> revision advance.

## v11.9 — Undeniable Flagship Demo
- Demo-only flagship proof director at ?demo=1.
- Real human concurrency shortcut uses the same revisioned humanEdit store action.
- Agent demo is single-flight guarded against double-starts.
- Review remains viewport-level and human-only.
- Acceptance gets a canonical revision moment; revoke closes with a real ADMISSION_REVOKED proof.
