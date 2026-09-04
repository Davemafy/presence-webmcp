# Presence — Winning Demo

## Thesis

Presence is multiplayer permissioning for humans and browser agents.

**One-line pitch:** Presence lets a human and an AI agent safely work inside the same live web app at the same time, with scoped authority, stale-work protection, and human acceptance.

The main recording proves one thing: **the human commits a Mobile change first, stale agent work is frozen before execution, the agent rebases inside Tablet, and zero human changes are overwritten.**

## Main sequence

1. **Admit** — the agent requests the Tablet seat. The human sees three plain-language permission lines and one dominant `Admit Tablet` action.
2. **Scope** — ownership rails make the contract visible: Desktop is reference, Tablet is the agent seat, Mobile is the human surface.
3. **Work together** — the agent prepares a provisional Tablet composition while the human opens Mobile.
4. **Protect** — the human makes a bold Mobile composition change, advancing canonical state. The agent then attempts its next Tablet mutation using the earlier revision. Presence rejects it with `STALE_STATE` before execution.
5. **Hero safety moment** — red conflict state lasts 620ms. The UI leads with `Your Mobile edit is safe`, shows the old/new revision tether, then resolves to `0 human changes overwritten` while the agent re-reads canonical state.
6. **Rebase** — the agent adapts its Tablet-only proposal from the fresh revision. No second conflict is staged in the main demo.
7. **Review** — a large Tablet before/after dominates the foreground. The review explicitly states `Mobile unchanged` and `0 overwritten`.
8. **Accept** — one human action advances canonical state. End card: `0 human changes overwritten` and `Presence — multiplayer safety for the agent-native web.`

## What stays out of the main recording

- Repeated permission errors
- Decorative cursor movement
- Revocation proof
- Dense authority dashboards
- Tiny spacing-only edits
- More than one conflict

Those capabilities remain in the product and WebMCP engine for inspection, but the flagship video keeps one memorable proof.

## Recording mode

Use `/?demo=1`.

`Demo Reset` in the top bar returns both domain state and the spatial room to the authored starting position.
