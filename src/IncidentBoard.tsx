import {useEffect,useMemo,useState,useSyncExternalStore} from 'react'
import {Check,Clock3,ShieldCheck,TriangleAlert} from 'lucide-react'
import {browserStorageAdapter,createPresence,createPresenceTools,type PresenceIdentity,type PresenceOperation} from './sdk/createPresence'

type Card={id:string;title:string;status:string}
type Board={title:string;cards:Card[]}
const human:PresenceIdentity={id:'human-david',displayName:'You',kind:'human'}
const agent:PresenceIdentity={id:'browser-agent',displayName:'Browser agent',kind:'agent',provider:'WebMCP'}
const adapter={clone:(d:Board)=>structuredClone(d),apply:(d:Board,op:PresenceOperation)=>{if(op.type==='add-card'){d.cards=[...d.cards,op.payload.card as Card]}if(op.type==='move-card'){const id=String(op.payload.id);d.cards=d.cards.map(c=>c.id===id?{...c,status:String(op.payload.status)}:c)}return d}}
export default function IncidentBoard(){
 const engine=useMemo(()=>createPresence<Board>({applicationId:'launch-control',projectId:'demo',storageAdapter:browserStorageAdapter,revision:7,documentAdapter:adapter,surfaces:[{id:'production',mode:'human-edit',label:'Production'},{id:'investigation',mode:'agent-propose',label:'Staging'},{id:'timeline',mode:'reference',label:'Telemetry'}],roles:[{id:'release-collaborator',capabilities:['inspect','propose'],surfaceIds:['investigation']}],documents:{production:{title:'Production',cards:[{id:'prod-v2',title:'v2.4.0 live · 100% traffic',status:'protected'},{id:'checkout',title:'Checkout conversion 4.8%',status:'healthy'}]},investigation:{title:'Staging',cards:[{id:'release-candidate',title:'v2.5.0 release candidate',status:'awaiting agent'},{id:'runbook',title:'Launch runbook · 3 checks open',status:'review'}]},timeline:{title:'Telemetry',cards:[{id:'deploy',title:'Error budget 99.96%',status:'reference'},{id:'latency',title:'p95 latency 184ms',status:'reference'}]}}}),[])
 const state=useSyncExternalStore(engine.subscribe,engine.snapshot,engine.snapshot)
 useEffect(()=>{const model=(document as Document&{modelContext?:{registerTool:(tool:any)=>void}}).modelContext;if(!model)return;for(const tool of createPresenceTools(engine,agent,'release-collaborator'))model.registerTool(tool)},[engine])
 const [baseRevision,setBaseRevision]=useState(state.revision)
 const latest=state.admissions.at(-1)
 const pending=state.proposals.find(p=>p.status==='pending')
 const request=()=>{const r=engine.requestAdmission(agent,'release-collaborator',['investigation'],5*60_000);if(r.ok)setBaseRevision(engine.snapshot().revision)}
 const humanEdit=()=>engine.humanMutate(human,'production',{surfaceId:'production',type:'add-card',payload:{card:{id:`note-${Date.now()}`,title:'Human hotfix: payment guard enabled',status:'done'}},intent:'Protect production during launch'})
 const stale=()=>engine.propose(agent,'release-collaborator',{surfaceId:'investigation',type:'add-card',payload:{card:{id:'stale',title:'Stale rollout plan from older revision',status:'proposed'}},intent:'Propose staged rollout',expectedRevision:baseRevision})
 const fresh=()=>engine.propose(agent,'release-collaborator',{surfaceId:'investigation',type:'add-card',payload:{card:{id:`agent-${Date.now()}`,title:'Stage canary at 10% + verify telemetry',status:'proposed'}},intent:'Propose fresh release plan',expectedRevision:engine.snapshot().revision})
 return <section className="incident-shell">
  <div className="incident-head"><div><small>PORTABILITY PROOF · SAME PRESENCE SDK</small><h2>Launch Control</h2><p>Ship with an agent beside you without giving it the production keys. The human owns Production; the agent can prepare Staging; Telemetry stays reference-only.</p></div><div className="incident-proof"><ShieldCheck size={15}/><span>Production · Human</span><span>Staging · Agent propose</span><span>Telemetry · Reference</span></div></div>
  <div className="incident-grid">
   {(['production','investigation','timeline'] as const).map(surface=><article key={surface} className={`incident-column ${surface}`}><header><b>{state.documents[surface].title}</b><span>{surface==='production'?'YOU':surface==='investigation'?(latest?.status==='admitted'?'AGENT · TEMPORARY':'AGENT SEAT'):'REFERENCE'}</span></header>{state.documents[surface].cards.map(card=><div className="incident-card" key={card.id}><i/><strong>{card.title}</strong><small>{card.status}</small></div>)}</article>)}
  </div>
  <div className="incident-controls"><button onClick={request}>1 · Agent requests Staging</button><button disabled={!latest||latest.status!=='requested'} onClick={()=>latest&&engine.grantAdmission(human,latest.id)}>2 · Admit</button><button onClick={humanEdit}>3 · Human protects Production</button><button onClick={stale}>4 · Stale rollout is blocked</button><button onClick={fresh}>5 · Rebase + propose rollout</button><button disabled={!pending} onClick={()=>pending&&engine.agentPublish(agent,pending.id)}>Agent tries publish</button><button className="primary" disabled={!pending} onClick={()=>pending&&engine.accept(human,pending.id)}>Human approves release</button><button onClick={()=>engine.reset()}>Reset</button></div>
  <div className="incident-status"><span><Clock3 size={12}/> r{state.revision}</span><span>{latest?.status??'no admission'}</span><span>{state.proposals.filter(p=>p.status==='pending').length} pending proposal</span><span>{state.receipts.length} receipt</span></div>
  <div className="incident-audit"><h3>Release audit</h3>{state.audit.slice(-8).reverse().map(e=><div key={e.id}><span className={e.outcome}>{e.outcome==='blocked'?<TriangleAlert size={11}/>:<Check size={11}/>}</span><b>{e.type}</b><code>{e.code??'OK'}</code><small>r{e.revision}</small></div>)}</div>
 </section>
}
