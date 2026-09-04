import {readFileSync} from 'node:fs'
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
const store=readFileSync(new URL('../src/domain/store.ts',import.meta.url),'utf8')
const webmcp=readFileSync(new URL('../src/webmcp/register.ts',import.meta.url),'utf8')
const proof=readFileSync(new URL('../src/domain/proof.ts',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8')
const required=[
 ['workspace','Fit Selection',app],['workspace','Arrange devices',app],['resize handles','resize-handle',app],['custom breakpoints','Responsive breakpoints',app],
 ['proof runner','Live system · deterministic seed · no simulated tool results',app],['hero proof','Your Mobile edit is safe.',app],['human publication gate','publish_proposal',webmcp],
 ['semantic agent move','propose_component_move',webmcp],['scope gate','SURFACE_NOT_ASSIGNED',store],['stale gate','STALE_STATE',store],['receipt','beforeFingerprints',store],
 ['fingerprints','canonicalStringify',proof],['proof drawer','CANONICAL FINGERPRINTS',app],['webmcp traces','LIVE INVOCATIONS',app],['container reflow','container-type:inline-size',css]
]
const missing=required.filter(([,token,text])=>!text.includes(token)).map(([name])=>name)
if(missing.length){console.error('Missing v14 proof/editor evidence:',missing.join(', '));process.exit(1)}
if(css.includes('\\n\\n/*')){console.error('Literal escaped newline found in CSS');process.exit(1)}
let depth=0
for(const ch of css){if(ch==='{')depth++;else if(ch==='}')depth--;if(depth<0){console.error('CSS brace underflow');process.exit(1)}}
if(depth!==0){console.error('Unbalanced CSS braces:',depth);process.exit(1)}
console.log('Presence v14 source smoke: PASS · spatial editor + authority engine + proof surfaces present')
