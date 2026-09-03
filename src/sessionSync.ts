import {createClient, type RealtimeChannel} from '@supabase/supabase-js'
import {usePresenceStore} from './domain/store'
import type {Store} from './domain/types'

export type AuthorityCommand=
 | {type:'approve'}|{type:'deny'}|{type:'pause'}|{type:'resume'}|{type:'revoke'}
 | {type:'acceptProposal'}|{type:'rejectProposal'}|{type:'rejectOp';id:string}|{type:'testRevokedAccess'}

export type AuthorityEnvelope={
 id:string
 source:'phone-authority'
 sentAt:number
 command:AuthorityCommand
}

export type SessionSnapshot={
 revision:number; admission?:Store['admission']; agentPhase:Store['agentPhase']; proposal?:Store['proposal'];
 activity:Store['activity']; blockedAttempt?:Store['blockedAttempt']; agentWork:Store['agentWork'];
}

const snapshot=():SessionSnapshot=>{const s=usePresenceStore.getState();return {revision:s.revision,admission:s.admission,agentPhase:s.agentPhase,proposal:s.proposal,activity:s.activity,blockedAttempt:s.blockedAttempt,agentWork:s.agentWork}}
export const createSessionId=()=>crypto.randomUUID().replaceAll('-','').slice(0,10)
export const getOrCreateSessionId=()=>{const key='presence-session-id';let value=sessionStorage.getItem(key);if(!value){value=createSessionId();sessionStorage.setItem(key,value)}return value}

const localChannel=(sessionId:string)=>new BroadcastChannel(`presence:${sessionId}`)
const supabaseConfig=()=>({url:import.meta.env.VITE_SUPABASE_URL as string|undefined,key:import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined})
export const hasCrossDeviceRelay=()=>{const {url,key}=supabaseConfig();return !!url&&!!key}
const commandEnvelope=(command:AuthorityCommand):AuthorityEnvelope=>({id:crypto.randomUUID(),source:'phone-authority',sentAt:Date.now(),command})
const isEnvelope=(value:unknown):value is AuthorityEnvelope=>!!value&&typeof value==='object'&&'id'in value&&'command'in value

const applyCommand=(command:AuthorityCommand)=>{const s=usePresenceStore.getState();switch(command.type){case'approve':s.approveAdmission();break;case'deny':s.denyAdmission();break;case'pause':s.pause();break;case'resume':s.resume();break;case'revoke':s.revoke();break;case'acceptProposal':s.acceptProposal();break;case'rejectProposal':s.rejectProposal();break;case'rejectOp':s.rejectOp(command.id);break;case'testRevokedAccess':s.testRevokedAccess();break}}

/**
 * The phone may be connected through BroadcastChannel and Supabase at the same
 * time (for example while QA'ing the remote in another browser tab). Every
 * authority command therefore carries an id and is applied exactly once.
 */
export function connectDesktopSession(sessionId:string){
 const bc=localChannel(sessionId)
 const processed=new Set<string>()
 const applyOnce=(payload:unknown)=>{
  if(!isEnvelope(payload))return
  if(processed.has(payload.id))return
  processed.add(payload.id)
  // Keep the set bounded for long-running sessions.
  if(processed.size>128){const first=processed.values().next().value as string|undefined;if(first)processed.delete(first)}
  applyCommand(payload.command)
 }
 const sendLocalSnapshot=()=>bc.postMessage({kind:'snapshot',snapshot:snapshot()})
 bc.onmessage=e=>{if(e.data?.kind==='command'){applyOnce(e.data.envelope);queueMicrotask(sendLocalSnapshot)}if(e.data?.kind==='hello')sendLocalSnapshot()}
 const unsubLocal=usePresenceStore.subscribe(sendLocalSnapshot)
 sendLocalSnapshot()

 let realtime:RealtimeChannel|undefined
 let unsubRealtimeStore:(()=>void)|undefined
 const {url,key}=supabaseConfig()
 if(url&&key){
  const client=createClient(url,key)
  realtime=client.channel(`presence:${sessionId}`,{config:{broadcast:{self:false}}})
  realtime
   .on('broadcast',{event:'command'},({payload})=>{applyOnce(payload);void realtime?.send({type:'broadcast',event:'snapshot',payload:snapshot()})})
   .on('broadcast',{event:'hello'},()=>{void realtime?.send({type:'broadcast',event:'snapshot',payload:snapshot()})})
   .subscribe(status=>{if(status==='SUBSCRIBED')void realtime?.send({type:'broadcast',event:'snapshot',payload:snapshot()})})
  unsubRealtimeStore=usePresenceStore.subscribe(()=>{void realtime?.send({type:'broadcast',event:'snapshot',payload:snapshot()})})
 }
 return()=>{unsubLocal();unsubRealtimeStore?.();bc.close();if(realtime)void realtime.unsubscribe()}
}

export function connectRemoteSession(sessionId:string,onSnapshot:(s:SessionSnapshot)=>void){
 const bc=localChannel(sessionId)
 bc.onmessage=e=>{if(e.data?.kind==='snapshot')onSnapshot(e.data.snapshot)}
 bc.postMessage({kind:'hello'})
 let realtime:RealtimeChannel|undefined
 const {url,key}=supabaseConfig()
 if(url&&key){
  const client=createClient(url,key)
  realtime=client.channel(`presence:${sessionId}`,{config:{broadcast:{self:false}}})
  realtime.on('broadcast',{event:'snapshot'},({payload})=>onSnapshot(payload as SessionSnapshot)).subscribe(status=>{if(status==='SUBSCRIBED')void realtime?.send({type:'broadcast',event:'hello',payload:{}})})
 }
 const send=(command:AuthorityCommand)=>{
  const envelope=commandEnvelope(command)
  bc.postMessage({kind:'command',envelope})
  if(realtime)void realtime.send({type:'broadcast',event:'command',payload:envelope})
 }
 return{send,close:()=>{bc.close();if(realtime)void realtime.unsubscribe()}}
}
