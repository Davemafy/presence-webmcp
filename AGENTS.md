# Presence builder constitution
Read every file in `docs/` before substantial product work. The specs are canonical.

Preserve the domain model and the product primitive: **software admits the user's external browser agent as a scoped, visible collaborator.** Do not turn Presence into a chatbot, generic AI dashboard, autonomous built-in agent, security console, or permission modal demo.

Visible state must derive from domain state. Never fabricate discovery, admission, agent work, stale-state rejection, or review. A development simulator may exist only when clearly labelled and must use the same mutation APIs and permission checks as WebMCP.

Every consequential agent mutation is gated in this order: admission → capability → resource scope → assignment → expected revision → constraints. Stale writes fail closed. Humans retain final authority.

Do not rewrite working architecture to simplify implementation. Prefer local, reversible changes. Do not introduce speculative WebMCP APIs as if supported. Do not claim cryptographic identity.

Before considering work complete: typecheck, unit/integration tests, build, flagship E2E, desktop/mobile visual inspection, and real supported-browser WebMCP verification where available.
Presence v6 release focus:
- One consistent device unit system and realistic proportions.
- Independent seat positions; no grouped device transform.
- Camera focus never mutates device geometry.
- Device drag no longer sets semantic focus.
- Temporary drag z-order; Mobile is not permanently on top.
- Authored Room/Fit includes all devices and shared project anchor.
- Shared Project hierarchy increased; desktop reference recedes.
- Desktop chrome reduced; Authority moved to header, redundant status legend removed.
