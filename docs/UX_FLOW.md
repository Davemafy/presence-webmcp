# Presence — Canonical UX flow

## 1. Solo
Desktop shows REFERENCE, Tablet shows UNASSIGNED, Mobile shows YOU. Tablet must visibly read as an empty seat, not a broken preview. No agent cursor exists.

## 2. Request
A real WebMCP `request_admission` call creates a pending admission. In development fallback, the simulator creates the same domain state. The request occupies the Tablet seat spatially. It states role, requested scope, mode, reason, allowed actions, and blocked actions. Primary action: Admit agent. Secondary: Not now.

## 3. Admission
Approval changes the same Tablet region rather than opening a disconnected dashboard. The request morphs into the Tablet surface. Ownership changes UNASSIGNED → YOUR AGENT. The agent cursor enters only after admission. Tablet is now assigned in propose mode.

## 4. Collaboration
Human works Mobile. Agent proposes Tablet operations. Cursor movement is tied to semantic operation targets and therefore acts as evidence, not animation garnish. Agent changes remain provisional.

## 5. Interruption
A human canonical mutation increments revision. An in-flight agent operation carrying the old `expectedRevision` is rejected. No last-write-wins. Tablet subtly dims/tensions; the cursor pauses near its semantic target; copy reads “Catching up…”. Avoid giant warning panels.

## 6. Recovery
Agent re-inspects fresh state, updates its expected revision, and retries within its granted scope. The interruption settles. Activity records the rejection and recovery.

## 7. Proposal
When ready, Tablet shows a restrained “proposal ready” affordance and provisional markers. Review opens only at human request.

## 8. Review
Review names the source “your browser agent”, previews Tablet, lists individual operations, allows per-operation rejection, reject-all, ask-to-revise, conflict resolution, and accept-selected. Agent cannot accept for the human.

## 9. Commit
Acceptance applies selected provisional operations to canonical state, increments revision, and records human activity.

## 10. Pause / revoke
Pause temporarily blocks agent mutation while preserving admission. Revoke ends authority, removes active assignment/presence, leaves accepted work intact and proposal history available, and returns Tablet to an unassigned seat. Later mutations from that admission fail.
