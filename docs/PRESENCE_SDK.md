# Presence SDK

Presence is application-agnostic collaboration infrastructure. `createPresence()` accepts arbitrary surface IDs, roles, a document adapter, an identity model and a persistence adapter. The engine owns admission, temporary leases, optimistic revisions, provisional proposals, human-only publication, audit events, fingerprints and verification receipts.

```ts
const presence = createPresence({
  applicationId: 'aurora',
  documentAdapter,
  storageAdapter,
  surfaces: [
    {id:'desktop', mode:'reference'},
    {id:'tablet', mode:'agent-propose'},
    {id:'mobile', mode:'human-edit'}
  ],
  roles: [{id:'responsive-collaborator', capabilities:['inspect','propose'], surfaceIds:['tablet']}],
  documents
})
```

The engine is deliberately not coupled to responsive design. `IncidentBoard.tsx` registers Production, Investigation and Timeline surfaces using the same SDK.
