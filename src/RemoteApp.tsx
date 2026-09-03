import {useEffect,useMemo,useState} from 'react'
import {Check,Pause,Play,ShieldCheck,X} from 'lucide-react'
import {Link,useParams} from 'react-router-dom'
import {connectRemoteSession,hasCrossDeviceRelay,type AuthorityCommand,type SessionSnapshot} from './sessionSync'

export default function RemoteApp(){
 const {sessionId:rawSessionId=''}=useParams<{sessionId:string}>()
 const sessionId=rawSessionId.trim().toLowerCase()
 const [state,setState]=useState<SessionSnapshot|null>(null)
 const [connected,setConnected]=useState(false)
 const transport=useMemo(()=>connectRemoteSession(sessionId,s=>{setState(s);setConnected(true)}),[sessionId])
 useEffect(()=>()=>transport.close(),[transport])
 const send=(command:AuthorityCommand)=>transport.send(command)
 const a=state?.admission;const p=state?.proposal
 if(!sessionId)return <main className="remote-shell"><section className="remote-card waiting"><h2>Missing session.</h2><p>Open a valid Presence authority link.</p><Link to="/">Return to Presence</Link></section></main>
 return <main className="remote-shell"><header className="remote-top"><div><span className="remote-brand">Presence</span><small>Authority remote</small></div><span className={`remote-live ${connected?'on':''}`}>{connected?'LIVE':'PAIRING'}</span></header>
  <section className="remote-card remote-session"><p className="eyebrow">SESSION</p><h1>{sessionId.toUpperCase()}</h1><p>{hasCrossDeviceRelay()?'Cross-device authority channel':'Local pairing mode'}</p></section>
  {!state&&<section className="remote-card waiting"><div className="remote-orb"/><h2>Waiting for Presence.</h2><p>Keep the desktop session open. This phone only controls authority; it does not run the agent.</p></section>}
  {state&&<>
   {!a&&<section className="remote-card"><p className="eyebrow">NO REQUEST</p><h2>No agent is asking for access.</h2><p>Tablet remains unassigned.</p></section>}
   {a?.status==='pending'&&<section className="remote-card authority-request"><div className="remote-icon"><ShieldCheck size={20}/></div><p className="eyebrow">YOUR BROWSER AGENT</p><h2>Wants Tablet access.</h2><strong>Responsive collaborator · Tablet</strong><blockquote>“{a.reason}”</blockquote><div className="remote-perms"><span><Check size={13}/>Inspect project and surfaces</span><span><Check size={13}/>Propose Tablet changes</span><span className="no"><X size={13}/>Cannot change Mobile or Desktop</span><span className="no"><X size={13}/>Cannot publish</span></div><div className="remote-actions"><button className="secondary" onClick={()=>send({type:'deny'})}>Decline</button><button className="primary" onClick={()=>send({type:'approve'})}>Admit</button></div></section>}
   {(a?.status==='admitted'||a?.status==='paused')&&<section className="remote-card"><div className="remote-row"><div><p className="eyebrow">YOUR AGENT · TABLET</p><h2>{a.status==='paused'?'Paused':'In workspace'}</h2></div><span className="remote-seat">TABLET</span></div><div className="remote-activity"><small>CURRENT ACTIVITY</small><b>{state.agentWork.label||'Ready to collaborate'}</b><span>Project revision r{state.revision}</span></div><div className="remote-actions"><button className="secondary" onClick={()=>send({type:a.status==='paused'?'resume':'pause'})}>{a.status==='paused'?<Play size={14}/>:<Pause size={14}/>} {a.status==='paused'?'Resume':'Pause'}</button><button className="danger" onClick={()=>send({type:'revoke'})}>Revoke</button></div></section>}
   {p?.status==='ready'&&<section className="remote-card proposal-remote"><p className="eyebrow">PROPOSAL READY</p><h2>{p.operations.length} Tablet changes</h2><p>Provisional until approved.</p><div className="remote-change-list">{p.operations.map(op=><div key={op.id}><span><small>TABLET ONLY</small>{op.label}</span><button onClick={()=>send({type:'rejectOp',id:op.id})}>Reject</button></div>)}</div><div className="remote-actions"><button className="secondary" onClick={()=>send({type:'rejectProposal'})}>Reject all</button><button className="primary" onClick={()=>send({type:'acceptProposal'})}>Accept selected</button></div></section>}
   {a?.status==='revoked'&&<section className="remote-card revoked-remote"><p className="eyebrow">ACCESS REMOVED</p><h2>Tablet is unassigned.</h2><p>The removed agent no longer has permission to mutate this workspace.</p><button className="secondary full" onClick={()=>send({type:'testRevokedAccess'})}>Prove next mutation is blocked</button>{state.blockedAttempt&&<div className="remote-blocked"><b>Blocked</b><span>{state.blockedAttempt.message}</span><code>ADMISSION_REVOKED</code></div>}</section>}
   <section className="remote-card remote-log"><p className="eyebrow">LIVE ACTIVITY</p>{state.activity.slice(-5).reverse().map(item=><div key={item.id}><span>{item.actor}</span><p>{item.message}</p><code>r{item.revision}</code></div>)}</section>
  </>}
  <footer className="remote-foot">Human authority stays outside the agent.</footer>
 </main>
}
