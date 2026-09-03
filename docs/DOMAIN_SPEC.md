# Presence — Domain specification

## Authority
Zustand is the client-side authoritative store. All visible product state derives from it. Domain mutations are centralized and revisioned.

## Admission
`AgentAdmission`: id, agentIdentity, status (`discovered|requesting|pending_user_approval|admitted|paused|revoked|expired`), requested role/scopes, granted scopes, timestamps/session id. MVP identity is application-level (`Your agent` / `Browser Agent`) and is not cryptographic identity.

## Role
`Responsive collaborator`: read Desktop/Tablet/Mobile; propose Tablet; no Desktop or Mobile mutation; no publish; no canonical copy change; no final human acceptance.

## Permission order
Every consequential agent mutation checks: admitted → capability → resource scope → assignment → expectedRevision → constraints. Errors include `ADMISSION_REQUIRED`, `ADMISSION_PENDING`, `ADMISSION_REVOKED`, `ADMISSION_PAUSED`, `ROLE_NOT_GRANTED`, `CAPABILITY_NOT_GRANTED`, `SURFACE_NOT_ASSIGNED`, `STALE_STATE`, `CONSTRAINT_VIOLATION`, `INVALID_OPERATION`, `NOT_FOUND`.

## Revisions
Canonical state has a monotonically increasing revision. Agent mutation requests include `expectedRevision`. If expected != current, mutation returns STALE_STATE and performs no mutation.

## Proposals
Agent work is provisional. Proposal stores base revision, operations, explanation, source admission, status. Human may reject individual operations, reject all, ask to revise, resolve conflicts, or accept selected. Acceptance commits selected operations via the same domain engine and increments canonical revision.

## Conflicts
When human and agent touch the same semantic property, create explicit conflict evidence rather than silently choosing a winner. Resolution choices are human-canonical or agent-proposed.

## Pause / revoke
Pause keeps identity/assignment metadata but rejects mutation. Revoke removes current authority/assignment and blocks all future mutation under that admission. Existing accepted canonical work persists. Proposal/history may persist as record.

## Session rule
Admission is session-scoped in MVP. Reload must not silently restore active agent authority. Project content and accepted proposal history may persist independently.
