import {usePresenceStore} from '../domain/store'
const KEY='presence:aurora:workspace:v1'
type Persisted=Pick<ReturnType<typeof usePresenceStore.getState>,'revision'|'admission'|'agentPhase'|'proposal'|'stale'|'activity'|'mobileDesign'|'tabletDesign'|'receipts'|'toolTraces'|'agentPublications'>
const select=(s:ReturnType<typeof usePresenceStore.getState>):Persisted=>({revision:s.revision,admission:s.admission,agentPhase:s.agentPhase,proposal:s.proposal,stale:s.stale,activity:s.activity,mobileDesign:s.mobileDesign,tabletDesign:s.tabletDesign,receipts:s.receipts,toolTraces:s.toolTraces,agentPublications:s.agentPublications})
export function installPresencePersistence(){
 try{const raw=localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw) as Partial<Persisted>;usePresenceStore.setState(value)}}catch{}
 let timer=0
 const unsubscribe=usePresenceStore.subscribe(state=>{window.clearTimeout(timer);timer=window.setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(select(state)))}catch{}},140)})
 return()=>{window.clearTimeout(timer);unsubscribe()}
}
export const clearPresencePersistence=()=>{try{localStorage.removeItem(KEY)}catch{}}
