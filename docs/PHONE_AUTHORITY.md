# Phone Authority Remote

Status: implemented companion surface.

Presence separates **where work happens** from **where authority can be exercised**.

The normal Presence URL remains a complete responsive editor on phones. `/remote/:sessionId` is a deliberately narrow companion for an already-running Presence session.

## What the remote can do

- approve or decline a pending agent admission
- observe current agent activity and project revision
- pause or resume the admitted agent
- revoke the agent immediately
- inspect a ready proposal
- reject individual proposal operations
- accept or reject the remaining proposal
- prove post-revocation denial (`ADMISSION_REVOKED`)

## What it cannot do

- run WebMCP
- host a browser agent
- edit Aurora
- publish
- grant capabilities outside the desktop-defined role

## Authority invariant

The remote does not mutate project state directly. It sends a human-authority command to the live desktop session. The desktop invokes the same Zustand/domain actions used by its own controls. Therefore revocation from the phone is not visual synchronization: it changes the permission state used by the next agent mutation.

## Transport

Same-origin local QA uses `BroadcastChannel`. Physical cross-device pairing uses an optional Supabase Realtime Broadcast channel when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present. The session ID is ephemeral and encoded into the QR URL.
