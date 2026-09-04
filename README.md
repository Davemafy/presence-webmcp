# Presence

**Git for live human–agent collaboration.**

Presence lets people and browser agents work concurrently inside the same live application—with scoped authority, optimistic concurrency, reviewable proposals, and human-controlled publication.

Aurora is the flagship responsive-design integration. The included Launch Control proves the same engine protects a different application and surface model.

## What judges can verify

- Human-granted, temporary agent admission
- Surface-scoped proposal authority
- Reference and human-owned surfaces blocked before mutation
- Stale expected revisions rejected before canonical state changes
- Agent publication rejected; only human acceptance can merge
- Deterministic state fingerprints before and after protected operations
- Structured audit events and acceptance receipts
- Real WebMCP tools and invocation traces
- Browser persistence for canonical state, authority, proposals, audit and receipts
- A second application using the same `createPresence()` SDK

## Run

```bash
npm install
npm run dev
```

Production gate:

```bash
npm run build
```

The build runs source smoke, editor acceptance, Aurora acceptance, product-layer checks, the live collaboration evidence suite, TypeScript, then Vite.

## Judge path

1. Open Aurora Website.
2. Run the proof and request the Tablet seat.
3. Human admits the browser agent.
4. Human changes Mobile.
5. Agent attempts stale Tablet work; Presence blocks it before mutation.
6. Agent rebases and submits a Tablet-only proposal.
7. Agent publication is denied.
8. Human accepts.
9. Open Proof to inspect fingerprints, receipt, audit and WebMCP traces.
10. Switch to Launch Control to verify portability through the same SDK.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PRESENCE_SDK.md`](docs/PRESENCE_SDK.md), [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md), and [`docs/INCIDENT_BOARD.md`](docs/INCIDENT_BOARD.md).

## Persistence

The Aurora integration persists canonical project state, revision, admission state, proposals, audit events, tool traces and receipts in browser storage. Temporary pointer/drag state is never persisted. Demo Reset clears persisted Aurora state and restores the deterministic seed.

The generic SDK accepts its own storage adapter; the Launch Control uses the included browser storage adapter.

## Presenter mode

Use `?presenter=1` or the Presenter control. Presenter mode changes composition and guidance only. It does not grant admission, fabricate WebMCP results, change revisions, create audit events, or accept proposals.

## Security boundary

Presence treats visual locks as awareness, not enforcement. Mutating operations are authorized again at semantic commit time using the actor, role, surface, admission state and expected canonical revision. See the threat model for assumptions and limitations.
