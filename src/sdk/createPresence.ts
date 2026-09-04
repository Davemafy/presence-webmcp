export type SurfaceMode='reference'|'human-edit'|'agent-propose'
export type PresenceSurface={id:string;mode:SurfaceMode;label?:string}
export type PresenceRole={id:string;capabilities:string[];surfaceIds:string[]}
export type PresenceIdentity={id:string;displayName:string;kind:'human'|'agent';provider?:string}
export type AdmissionState='requested'|'admitted'|'paused'|'expired'|'revoked'|'released'
export type PresenceOperation={id:string;type:string;surfaceId:string;payload:Record<string,unknown>;intent:string;expectedRevision:number}
export type PresenceProposal={id:string;agentId:string;roleId:string;surfaceId:string;baseRevision:number;status:'pending'|'accepted'|'rejected';operations:PresenceOperation[];createdAt:string}
export type PresenceAudit={id:string;type:string;actorId:string;surfaceId?:string;revision:number;outcome:'allowed'|'blocked'|'state';code?:string;detail?:Record<string,unknown>;at:string}
export type PresenceReceipt={id:string;proposalId:string;humanId:string;agentId:string;roleId:string;baseRevision:number;acceptedRevision:number;affectedSurfaces:string[];protectedSurfaces:string[];beforeFingerprints:Record<string,string>;afterFingerprints:Record<string,string>;auditEventIds:string[];approvedAt:string;outcome:'accepted'}
export type DocumentAdapter<T>={clone:(doc:T)=>T;apply:(doc:T,op:PresenceOperation)=>T;serialize?:(doc:T)=>unknown}
export type PresenceStorage={load:(key:string)=>unknown|null;save:(key:string,value:unknown)=>void;clear:(key:string)=>void}
export type PresenceConfig<T>={applicationId:string;projectId?:string;surfaces:PresenceSurface[];roles:PresenceRole[];documents:Record<string,T>;documentAdapter:DocumentAdapter<T>;storageAdapter?:PresenceStorage;revision?:number}

type Admission={id:string;agentId:string;roleId:string;surfaceIds:string[];status:AdmissionState;requestedAt:string;grantedAt?:string;expiresAt?:number}
type State<T>={revision:number;documents:Record<string,T>;admissions:Admission[];proposals:PresenceProposal[];audit:PresenceAudit[];receipts:PresenceReceipt[]}

const canonical=(value:unknown):string=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value as Record<string,unknown>).sort().reduce<Record<string,unknown>>((out,k)=>{out[k]=JSON.parse(canonical((value as Record<string,unknown>)[k]));return out},{}):Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):value)
export const stableFingerprint=(value:unknown)=>{const text=canonical(value);let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(16).toUpperCase().padStart(8,'0')}
const deepClone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
let sequence=0
const uid=(p:string)=>`${p}-${++sequence}`

export function createPresence<T>(config:PresenceConfig<T>){
 const key=`presence-sdk:${config.applicationId}:${config.projectId??'default'}`
 const seed:State<T>={revision:config.revision??1,documents:deepClone(config.documents),admissions:[],proposals:[],audit:[],receipts:[]}
 let state:State<T>=seed
 const restored=config.storageAdapter?.load(key) as State<T>|null
 if(restored&&typeof restored.revision==='number')state=restored
 const listeners=new Set<()=>void>()
 // React useSyncExternalStore requires getSnapshot() to return the same object
 // until the store actually changes. Keep a protected view cache and refresh it
 // only on engine emissions; the canonical engine state remains private.
 let snapshotCache:State<T>=deepClone(state)
 const persist=()=>config.storageAdapter?.save(key,state)
 const emit=()=>{snapshotCache=deepClone(state);persist();listeners.forEach(fn=>fn())}
 const audit=(type:string,actorId:string,outcome:PresenceAudit['outcome'],extra:Partial<PresenceAudit>={})=>{const e:PresenceAudit={id:uid('evt'),type,actorId,revision:state.revision,outcome,at:new Date().toISOString(),...extra};state={...state,audit:[...state.audit,e]};return e}
 const fingerprints=()=>Object.fromEntries(Object.entries(state.documents).map(([id,doc])=>[id,stableFingerprint(config.documentAdapter.serialize?.(doc)??doc)]))
 const expire=()=>{const now=Date.now();let changed=false;state.admissions=state.admissions.map(a=>{if(a.status==='admitted'&&a.expiresAt&&a.expiresAt<=now){changed=true;a={...a,status:'expired'};audit('role.expired',a.agentId,'state',{surfaceId:a.surfaceIds[0],code:'ADMISSION_EXPIRED'})}return a});if(changed)emit()}
 const activeAdmission=(agentId:string,surfaceId:string)=>{expire();return state.admissions.find(a=>a.agentId===agentId&&a.surfaceIds.includes(surfaceId)&&a.status==='admitted')}
 const roleFor=(id:string)=>config.roles.find(r=>r.id===id)
 const surfaceFor=(id:string)=>config.surfaces.find(s=>s.id===id)
 const snapshot=()=>snapshotCache
 return {
  applicationId:config.applicationId,
  subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn)},
  snapshot,
  fingerprints,
  reset(){state=deepClone(seed);config.storageAdapter?.clear(key);audit('project.reset','system','state',{code:'RESET'});emit()},
  requestAdmission(agent:PresenceIdentity,roleId:string,surfaceIds:string[],durationMs=15*60_000){const role=roleFor(roleId);if(!role)throw new Error('Unknown role');const conflict=state.admissions.find(a=>a.status==='admitted'&&a.surfaceIds.some(id=>surfaceIds.includes(id)));if(conflict){const e=audit('admission.denied',agent.id,'blocked',{surfaceId:surfaceIds[0],code:'SEAT_OCCUPIED'});emit();return{ok:false,error:'SEAT_OCCUPIED',auditEventId:e.id}}const admission:Admission={id:uid('adm'),agentId:agent.id,roleId,surfaceIds,status:'requested',requestedAt:new Date().toISOString(),expiresAt:Date.now()+durationMs};state={...state,admissions:[...state.admissions,admission]};const e=audit('admission.requested',agent.id,'state',{surfaceId:surfaceIds[0]});emit();return{ok:true,admissionId:admission.id,auditEventId:e.id}},
  grantAdmission(human:PresenceIdentity,admissionId:string){state={...state,admissions:state.admissions.map(a=>a.id===admissionId?{...a,status:'admitted',grantedAt:new Date().toISOString()}:a)};const a=state.admissions.find(x=>x.id===admissionId);const e=audit('admission.granted',human.id,'allowed',{surfaceId:a?.surfaceIds[0]});emit();return{ok:true,auditEventId:e.id}},
  pause(human:PresenceIdentity,admissionId:string){state={...state,admissions:state.admissions.map(a=>a.id===admissionId&&a.status==='admitted'?{...a,status:'paused'}:a)};audit('role.paused',human.id,'state');emit()},
  resume(human:PresenceIdentity,admissionId:string){state={...state,admissions:state.admissions.map(a=>a.id===admissionId&&a.status==='paused'?{...a,status:'admitted'}:a)};audit('role.resumed',human.id,'state');emit()},
  revoke(human:PresenceIdentity,admissionId:string){state={...state,admissions:state.admissions.map(a=>a.id===admissionId?{...a,status:'revoked'}:a)};audit('role.revoked',human.id,'state');emit()},
  release(agent:PresenceIdentity,admissionId:string){state={...state,admissions:state.admissions.map(a=>a.id===admissionId?{...a,status:'released'}:a)};audit('role.released',agent.id,'state');emit()},
  humanMutate(human:PresenceIdentity,surfaceId:string,op:Omit<PresenceOperation,'id'|'expectedRevision'>){const surface=surfaceFor(surfaceId);if(!surface||surface.mode!=='human-edit'){const e=audit('operation.denied',human.id,'blocked',{surfaceId,code:'SURFACE_NOT_HUMAN_EDITABLE'});emit();return{ok:false,error:'SURFACE_NOT_HUMAN_EDITABLE',auditEventId:e.id}}const full:PresenceOperation={...op,id:uid('op'),surfaceId,expectedRevision:state.revision};state={...state,documents:{...state.documents,[surfaceId]:config.documentAdapter.apply(config.documentAdapter.clone(state.documents[surfaceId]),full)},revision:state.revision+1};const e=audit('human.change.committed',human.id,'allowed',{surfaceId});emit();return{ok:true,revision:state.revision,auditEventId:e.id}},
  propose(agent:PresenceIdentity,roleId:string,op:Omit<PresenceOperation,'id'>){const surface=surfaceFor(op.surfaceId);expire();const agentAdmissions=state.admissions.filter(a=>a.agentId===agent.id&&a.roleId===roleId);const activeRoleAdmission=agentAdmissions.find(a=>a.status==='admitted');if(!activeRoleAdmission){const status=agentAdmissions.at(-1)?.status??state.admissions.find(a=>a.agentId===agent.id)?.status;const code=status==='paused'?'ADMISSION_PAUSED':status==='revoked'?'ADMISSION_REVOKED':status==='expired'?'ADMISSION_EXPIRED':'ADMISSION_REQUIRED';const e=audit('operation.denied',agent.id,'blocked',{surfaceId:op.surfaceId,code});emit();return{ok:false,error:code,auditEventId:e.id}}if(!activeRoleAdmission.surfaceIds.includes(op.surfaceId)||!roleFor(roleId)?.surfaceIds.includes(op.surfaceId)){const e=audit('operation.denied',agent.id,'blocked',{surfaceId:op.surfaceId,code:'SURFACE_NOT_ASSIGNED'});emit();return{ok:false,error:'SURFACE_NOT_ASSIGNED',auditEventId:e.id}}if(surface?.mode==='reference'){const e=audit('operation.denied',agent.id,'blocked',{surfaceId:op.surfaceId,code:'REFERENCE_LOCKED'});emit();return{ok:false,error:'REFERENCE_LOCKED',auditEventId:e.id}}if(surface?.mode!=='agent-propose'){const e=audit('operation.denied',agent.id,'blocked',{surfaceId:op.surfaceId,code:'SURFACE_NOT_ASSIGNED'});emit();return{ok:false,error:'SURFACE_NOT_ASSIGNED',auditEventId:e.id}}if(op.expectedRevision!==state.revision){const e=audit('operation.stale_blocked',agent.id,'blocked',{surfaceId:op.surfaceId,code:'STALE_STATE',detail:{expectedRevision:op.expectedRevision,currentRevision:state.revision}});emit();return{ok:false,error:'STALE_STATE',expectedRevision:op.expectedRevision,currentRevision:state.revision,auditEventId:e.id}}const full={...op,id:uid('op')};const proposal:PresenceProposal={id:uid('prop'),agentId:agent.id,roleId,surfaceId:op.surfaceId,baseRevision:state.revision,status:'pending',operations:[full],createdAt:new Date().toISOString()};state={...state,proposals:[...state.proposals,proposal]};const e=audit('proposal.created',agent.id,'allowed',{surfaceId:op.surfaceId});emit();return{ok:true,proposalId:proposal.id,revision:state.revision,auditEventId:e.id}},
  agentPublish(agent:PresenceIdentity,proposalId:string){const p=state.proposals.find(x=>x.id===proposalId);const e=audit('proposal.publication_blocked',agent.id,'blocked',{surfaceId:p?.surfaceId,code:'HUMAN_APPROVAL_REQUIRED'});emit();return{ok:false,error:'HUMAN_APPROVAL_REQUIRED',auditEventId:e.id}},
  accept(human:PresenceIdentity,proposalId:string){const proposal=state.proposals.find(p=>p.id===proposalId&&p.status==='pending');if(!proposal)return{ok:false,error:'PROPOSAL_NOT_PENDING'};if(proposal.baseRevision!==state.revision){const e=audit('proposal.accept_blocked',human.id,'blocked',{surfaceId:proposal.surfaceId,code:'STALE_STATE'});emit();return{ok:false,error:'STALE_STATE',auditEventId:e.id}}const before=fingerprints();let next=config.documentAdapter.clone(state.documents[proposal.surfaceId]);for(const op of proposal.operations)next=config.documentAdapter.apply(next,op);state={...state,documents:{...state.documents,[proposal.surfaceId]:next},revision:state.revision+1,proposals:state.proposals.map(p=>p.id===proposalId?{...p,status:'accepted'}:p)};const accepted=audit('proposal.accepted',human.id,'allowed',{surfaceId:proposal.surfaceId});const after=fingerprints();const receipt:PresenceReceipt={id:uid('receipt'),proposalId,humanId:human.id,agentId:proposal.agentId,roleId:proposal.roleId,baseRevision:proposal.baseRevision,acceptedRevision:state.revision,affectedSurfaces:[proposal.surfaceId],protectedSurfaces:config.surfaces.filter(s=>s.id!==proposal.surfaceId).map(s=>s.id),beforeFingerprints:before,afterFingerprints:after,auditEventIds:[accepted.id],approvedAt:new Date().toISOString(),outcome:'accepted'};state={...state,receipts:[...state.receipts,receipt]};emit();return{ok:true,revision:state.revision,receipt}},
 }
}

export const browserStorageAdapter:PresenceStorage={load:key=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}},save:(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}},clear:key=>{try{localStorage.removeItem(key)}catch{}}}

export type PresenceTool={name:string;description:string;inputSchema:Record<string,unknown>;execute:(args:Record<string,unknown>)=>unknown}
export function createPresenceTools(engine:{applicationId:string;snapshot:()=>any;fingerprints:()=>Record<string,string>;propose:(agent:PresenceIdentity,roleId:string,op:any)=>unknown;release:(agent:PresenceIdentity,admissionId:string)=>unknown},agent:PresenceIdentity,roleId:string):PresenceTool[]{
 const prefix=engine.applicationId.replace(/[^a-z0-9]+/gi,'_').toLowerCase()
 return [
  {name:`${prefix}_inspect_state`,description:`Inspect ${engine.applicationId} through the Presence SDK without mutation.`,inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>({applicationId:engine.applicationId,state:engine.snapshot(),fingerprints:engine.fingerprints()})},
  {name:`${prefix}_propose_operation`,description:`Create a scoped provisional proposal in ${engine.applicationId}; authority and expected revision are revalidated before proposal creation.`,inputSchema:{type:'object',properties:{surfaceId:{type:'string'},type:{type:'string'},payload:{type:'object'},intent:{type:'string'},expectedRevision:{type:'integer'}},required:['surfaceId','type','payload','intent','expectedRevision'],additionalProperties:false},execute:args=>engine.propose(agent,roleId,{surfaceId:String(args.surfaceId),type:String(args.type),payload:(args.payload??{}) as Record<string,unknown>,intent:String(args.intent),expectedRevision:Number(args.expectedRevision)})},
  {name:`${prefix}_release_role`,description:`Release the active ${engine.applicationId} role without broadening authority.`,inputSchema:{type:'object',properties:{admissionId:{type:'string'}},required:['admissionId'],additionalProperties:false},execute:args=>engine.release(agent,String(args.admissionId))},
 ]
}
