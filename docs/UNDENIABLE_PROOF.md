# Presence — Undeniable Proof Standard

Presence is not a responsive-editor trick. The editor is the environment in which a real collaboration protocol is made visible.

## Thesis

A human and a browser agent can work concurrently in one live application without surrendering ownership, losing human changes, accepting stale work, or allowing the agent to publish its own proposal.

## Production proof path

Open `/?demo=1` and press **Run the proof**. The guide never fabricates an agent result. It only copies the next suggested prompt or asks the human for a real decision.

1. The browser agent inspects roles and requests the temporary Tablet seat through WebMCP.
2. The human grants admission. The granted scope is inspect Desktop/Tablet/Mobile + propose Tablet.
3. The agent inspects all surfaces and creates a provisional Tablet operation at the current canonical revision.
4. The agent intentionally calls a mutation tool against Mobile. The production authority gate returns `SURFACE_NOT_ASSIGNED`. Revision, Mobile fingerprint, and provisional operations remain unchanged.
5. The human changes Mobile. That real edit increments the canonical revision.
6. The agent intentionally continues from its older expected revision. The production optimistic-concurrency check returns `STALE_STATE` before mutation.
7. The agent re-inspects the new revision, rebases, creates a fresh Tablet-only proposal, and submits it.
8. The agent intentionally calls `publish_proposal`. The production engine returns `HUMAN_APPROVAL_REQUIRED`; the proposal remains pending and canonical state is unchanged.
9. The human opens Review and accepts. Tablet changes atomically; Desktop and Mobile fingerprints remain identical.
10. Open **Proof** to inspect live invariants, fingerprints, audit events, actual WebMCP calls/results, and the generated acceptance receipt.

## Machine evidence

`src/tests/evidence.test.ts` contains twelve invariant tests. They register and invoke the same WebMCP tool definitions used by the product. The production build runs this suite before TypeScript/Vite and writes the real result to `public/evidence.json`. The Proof drawer reads that output; it never hard-codes a passing count.

The suite verifies admission, inspection, fresh Tablet proposal, Mobile denial, Desktop lock, human-only publication, stale-write rejection, protected fingerprints, atomic human acceptance, revocation, and deterministic reset.

## Deterministic fingerprints

Canonical breakpoint state is serialized with sorted object keys before hashing. Fingerprints are verification identifiers rather than security secrets. Denied tool results include before/after revision and before/after fingerprints. Human acceptance generates a receipt with the same protected-surface evidence.

## Anti-fake demo mode

Demo mode may seed and arrange the workspace and guide timing. It does not generate tool results, skip authority checks, mutate revisions on behalf of the agent, fabricate audit events, or approve proposals. The screen explicitly states:

> Live system · deterministic seed · no simulated tool results

Unexpected failures stay visible and preserve current state.
