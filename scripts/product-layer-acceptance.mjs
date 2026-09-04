import fs from 'node:fs'
const read=p=>fs.readFileSync(p,'utf8')
const app=read('src/App.tsx'),sdk=read('src/sdk/createPresence.ts'),incident=read('src/IncidentBoard.tsx'),persist=read('src/persistence/presencePersistence.ts'),evidence=read('src/tests/evidence.test.ts'),pkg=JSON.parse(read('package.json'))
const checks=[
 ['Git positioning',app.includes('Git for live human–agent collaboration')],
 ['application switcher',app.includes('Aurora Website')&&app.includes('Launch Control')],
 ['Why Presence comparison',app.includes('Without Presence')&&app.includes('With Presence')],
 ['generic createPresence SDK',sdk.includes('export function createPresence')&&sdk.includes('applicationId')],
 ['application-agnostic surfaces',sdk.includes("mode:'reference'")||sdk.includes('SurfaceMode')],
 ['SDK WebMCP tool factory',sdk.includes('createPresenceTools')&&incident.includes('createPresenceTools(engine')],
 ['temporary authority expiry',sdk.includes('expiresAt')&&sdk.includes('ADMISSION_EXPIRED')],
 ['pause/revoke/release lifecycle',sdk.includes('pause(')&&sdk.includes('revoke(')&&sdk.includes('release(')],
 ['optimistic stale rejection',sdk.includes("'STALE_STATE'")&&sdk.includes('expectedRevision!==state.revision')],
 ['human-only publication',sdk.includes('HUMAN_APPROVAL_REQUIRED')&&sdk.includes('agentPublish')],
 ['verification receipts',sdk.includes('PresenceReceipt')&&sdk.includes('beforeFingerprints')&&sdk.includes('afterFingerprints')],
 ['durable Aurora persistence',persist.includes('localStorage')&&persist.includes('revision')&&persist.includes('receipts')],
 ['second application same SDK',incident.includes('createPresence<Board>')&&incident.includes("applicationId:'launch-control'")],
 ['launch-control ownership model',incident.includes("id:'production',mode:'human-edit'")&&incident.includes("id:'investigation',mode:'agent-propose'")],
 ['presenter mode does not auto approve',app.includes('presenterMode')&&!app.includes('presenterMode&&s.acceptProposal')],
 ['expanded 16 invariant suite',evidence.includes('16 invariants')&&evidence.includes("it('16")],
 ['architecture/threat/SDK docs',fs.existsSync('docs/ARCHITECTURE.md')&&fs.existsSync('docs/THREAT_MODEL.md')&&fs.existsSync('docs/PRESENCE_SDK.md')]
]
let passed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)passed++}
console.log(`${passed}/${checks.length} Presence product-layer source checks ${passed===checks.length?'PASS':'FAIL'}`);if(passed!==checks.length)process.exit(1)
