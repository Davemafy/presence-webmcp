import {readFileSync} from 'node:fs'
const html=readFileSync(new URL('../prototype.html',import.meta.url),'utf8')
const required=[
 'Waiting for a collaborator','Wants this seat.','Responsive collaborator','YOUR AGENT','CATCHING UP…','PROPOSAL READY','Review Tablet before it becomes real.','Accept selected','Remove'
]
const missing=required.filter(text=>!html.includes(text))
if(missing.length){console.error('Missing flagship evidence:',missing.join(', '));process.exit(1)}
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]
if(!script){console.error('No prototype script found');process.exit(1)}
await import('node:vm').then(({Script})=>new Script(script))
console.log('Presence standalone smoke: PASS')
