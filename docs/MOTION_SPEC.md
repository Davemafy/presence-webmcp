# Presence — Product motion specification

Motion communicates authority and shared state. It is not decoration.

## Motion personality
Calm, precise, weighted, continuous, tactile, controlled. Default easing `cubic-bezier(.22,1,.36,1)`. Micro transitions 120–180ms; controls 160–220ms; state transitions 350–550ms; defining spatial morphs 650–900ms. Avoid bounce.

## Admission
Request materializes inside Tablet with 16–24px upward settle and 0.98→1 scale over ~450ms. On Admit, preserve frame geometry: request content fades/condenses while the live Tablet canvas resolves beneath it over ~700ms. Ownership label morphs UNASSIGNED→YOUR AGENT during the same transition. Agent cursor enters from the edge only after authority is granted.

## Semantic agent cursor
Cursor target equals latest real semantic operation target. Movement duration 450–750ms depending distance. It never roams randomly. Labels: YOUR AGENT, CATCHING UP…, PROPOSAL READY. Cursor disappears immediately on revoke except for a short 180–240ms exit fade.

## Stale interruption
On STALE_STATE: cancel/stop current movement, add local amber tension to Tablet, drop saturation slightly, switch cursor label to CATCHING UP… over ~180ms. Hold long enough to be legible. On successful re-inspection, tension releases over ~500ms and cursor resumes from current position, not reset origin.

## Proposal settlement
When submitted, cursor reaches a stable lower/right resting target, provisional marker settles in, and review affordance appears with opacity/translate only. No confetti.

## Review
Backdrop 180–220ms fade; sheet 420–520ms y 32→0 and scale .99→1. Per-operation rejection collapses row height 220–300ms. Acceptance should visually settle and close; canonical revision increment is the persistent proof.

## Pause / revoke
Pause freezes semantic movement and changes status label; no disappearance. Revoke removes authority first in domain state, then cursor exits/fades, ownership changes back to UNASSIGNED, and Tablet content may remain canonical but the seat becomes visibly empty.

## Reduced motion
For `prefers-reduced-motion`, remove spatial travel, springing, and scale. Preserve opacity/state swaps in ≤100ms and all textual status evidence.
