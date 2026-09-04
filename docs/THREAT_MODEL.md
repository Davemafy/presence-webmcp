# Threat model

Presence assumes an agent may request too much authority, act on stale state, attempt a protected surface, attempt publication, continue after pause/revocation/expiry, or conflict with another exclusive seat. The enforcement boundary is the semantic operation commit: scope and expected revision are revalidated immediately before proposal creation or canonical mutation. Soft UI locks are awareness only.

Protected outcomes are recorded as structured audit events. Denied operations do not mutate canonical documents. Human acceptance is the only path from provisional proposal to canonical state.
