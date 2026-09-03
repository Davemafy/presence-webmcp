# Presence — Demo and QA specification

## 45–60 second flagship
0–6s: show Desktop REFERENCE, Tablet UNASSIGNED, Mobile YOU. Say the app has an empty seat for the user’s browser agent.
6–14s: external browser agent requests Responsive collaborator. Tablet itself becomes permission surface. Show exact scope and blocked capabilities.
14–20s: Admit agent. Request morphs to live Tablet; ownership becomes YOUR AGENT; cursor enters.
20–30s: agent performs a real Tablet proposal operation while human changes Mobile. Shared project revision increments.
30–38s: stale in-flight agent write is rejected with STALE_STATE. Tablet locally signals CATCHING UP…; agent re-inspects and adapts.
38–48s: proposal becomes ready. Open review, show provisional operations and human-only acceptance.
48–55s: accept selected; revision advances. Remove agent; cursor leaves, Tablet becomes unassigned; post-revoke mutation is rejected.

## Automated coverage
Admission required before mutation; pending cannot mutate; wrong surface rejected; paused rejected; revoked rejected; stale revision rejected without state change; re-inspect/fresh retry succeeds; proposal remains provisional; agent cannot human-accept; per-op rejection works; conflict resolution deterministic; session restore clears active admission; simulator uses same gates.

## Visual QA
Check 1536×1024, 1440×900, 1280×800, 390×844, 375×812. Verify no clipped controls, illegible canvas text, horizontal body overflow, sidebar clutter, generic dashboard appearance, random cursor travel, or permission UI detached from Tablet. Four screenshot moments must be excellent: UNASSIGNED, WANTS THIS SEAT, YOUR AGENT, CATCHING UP.

## Runtime QA
Real WebMCP verification is separate from ordinary Chromium E2E. In a supported browser, confirm tools register, external agent can inspect/request, approval gates mutation, expectedRevision rejects stale work, refreshed call succeeds, proposal appears in UI, release/revoke blocks future calls. Do not label simulator proof as real runtime verification.

## Completion gate
Typecheck green, unit/integration green, production build green, flagship E2E green, desktop/mobile visual inspection complete, no console errors in normal flow. Deployment is intentionally out of scope unless explicitly requested.

## Permission-boundary flagship sequence

The final demo is a real invariant attack, not a UI tour:

1. Browser agent discovers Presence and requests Tablet.
2. Human sees exact scope and admits the agent.
3. Human edits Mobile while the agent performs real Tablet operations.
4. Agent deliberately calls a proposal tool against Mobile. The domain engine returns `SURFACE_NOT_ASSIGNED`; Mobile does not mutate; the Agent Authority drawer records the denial.
5. Agent works from revision N. Human edits Mobile to N+1. The next mutation with `expectedRevision: N` returns `STALE_STATE`; no proposal operation is appended; Tablet shows catch-up state; the authority event records N → N+1.
6. Agent re-inspects the fresh revision, continues, and submits a real provisional proposal.
7. Human reviews and accepts selected changes.
8. Human removes the agent. Tablet returns to UNASSIGNED.
9. A final Tablet proposal attempt returns `ADMISSION_REVOKED` and is recorded by the same authority evidence surface.

Release blocker: at desktop split-screen widths used beside ChatGPT Work, Desktop / REFERENCE, Tablet / YOUR AGENT, and Mobile / YOU must all remain simultaneously perceptible.
