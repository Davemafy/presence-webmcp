# Presence — WebMCP specification

## Boundary
WebMCP is how the external browser agent discovers and operates the live application. It does not create a hidden second source of truth. Every handler reads fresh store state at execution time.

## Registered semantic tools
Admission: `inspect_presence`, `inspect_available_roles`, `request_admission`, `inspect_admission`.
Observation: `inspect_project`, `inspect_breakpoint`, `inspect_component`, `inspect_constraints`, `inspect_recent_changes`, `compare_breakpoints`.
Action: `propose_layout_change`, `propose_component_change`, `propose_responsive_rule`, `submit_proposal`, `explain_proposal`, `release_role`.

## Rules
Tools are narrow and single-purpose. Names/descriptions are semantic. Inputs use strict validation. Mutating tools require admission id where needed and `expectedRevision`. Handlers read current state when called; do not capture stale closures at registration. Errors are structured and meaningful. Tool calls update the same UI/domain state humans see.

## Discovery
Only show “agent discovered” if an actual runtime call provides grounded evidence. The first visible agent-originated state may simply be a real `request_admission`. Never fabricate detection because WebMCP is available.

## Simulator
Development fallback is clearly labeled and available only when real WebMCP is unavailable. It invokes the same store/domain APIs and receives no bypass privileges.

## Current vs future
Current implementation uses `document.modelContext.registerTool` where available. Do not claim standardized cryptographic identity, agent-to-agent messaging, cross-origin delegation, reactive tool definitions, remote MCP bridging, or other proposal-stage capabilities unless independently implemented and verified.
