# Incident Board integration

The Incident Board is the portability proof. Production is human-editable, Investigation is agent-propose, and Timeline is reference-only. It uses `createPresence()` rather than Aurora-specific guards. The included controls reproduce request → admit → human change → stale agent rejection → fresh proposal → agent publication rejection → human acceptance.
