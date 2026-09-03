# Presence — Product specification

## Thesis
Presence lets live software admit the user's external browser agent as a participant. The product is not “AI inside an editor.” The primitive is **agent admission**: an application exposes a role, the external browser agent asks to enter, the human grants narrow access, the agent becomes visibly present, works in shared state, and can be paused or removed.

## Flagship host
Responsive Studio is the first host experience. The project is Aurora. Three surfaces exist simultaneously: Desktop is REFERENCE/read-only, Tablet begins UNASSIGNED, Mobile is YOU. The browser agent may request the Responsive collaborator role: inspect all breakpoints and propose Tablet changes only. It cannot modify Desktop/Mobile, publish, change canonical copy, or accept its own proposal.

## Defining proof
UNASSIGNED → browser-agent request → exact role/scope/reason → human admits → Tablet becomes YOUR AGENT → visible shared-state work → human edits Mobile → stale agent operation rejected with STALE_STATE → agent re-inspects and adapts → provisional Tablet proposal → human review/conflict resolution → acceptance → pause/revoke → revoked agent cannot mutate.

## Product laws
External agent, explicit admission, human authority, scoped permissions, shared authoritative state, visible identity, provisional-by-default agent changes, revocability, fresh execution state, stale writes fail safely, semantic tools, application-controlled admission.

## Non-goals
No fake built-in assistant, generic chat panel, agent marketplace, OAuth clone, identity protocol, crypto identity claim, remote MCP bridge, agent OS, generic security dashboard, decorative autonomous cursor, or unrestricted cross-surface editing.
