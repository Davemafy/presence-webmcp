import {create} from 'zustand'
import type {Activity,Admission,DesignPatch,MutationResult,Operation,ResponsiveDesign,Store,ToolTrace} from './types'
import {projectFingerprints} from './proof'

let seq=0
const id=(prefix:string)=>`${prefix}-${++seq}`
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
const waitForRevisionChange=async(from:number,timeout=4200)=>{
 const started=Date.now()
 while(Date.now()-started<timeout){if(usePresenceStore.getState().revision!==from)return true;await wait(120)}
 return false
}
const event=(actor:Activity['actor'],message:string,revision:number,extra:Partial<Activity>={}):Activity=>({id:id('activity'),actor,message,revision,...extra})
const blockedMessage=(error:string,surface:string)=>error==='SURFACE_NOT_ASSIGNED'||error==='CAPABILITY_NOT_GRANTED'?`Your agent doesn't have access to ${surface[0].toUpperCase()+surface.slice(1)}.`:error==='STALE_STATE'?'Presence prevented an overwrite from stale project state.':error==='ADMISSION_REVOKED'?'This agent no longer has access.':'Presence blocked this operation.'
const requestedScopes:Admission['requestedScopes']=[
 {resource:'breakpoint',id:'desktop',mode:'inspect'},
 {resource:'breakpoint',id:'tablet',mode:'inspect'},
 {resource:'breakpoint',id:'mobile',mode:'inspect'},
 {resource:'breakpoint',id:'tablet',mode:'propose'},
]
const baseDesign=():ResponsiveDesign=>({heroOrder:['copy','visual'],heroLayout:'stack',alignment:'left',heroGap:18,heroPadding:28,ctaFull:false,titleScale:1,navCompact:false})
const cloneDesign=(d:ResponsiveDesign):ResponsiveDesign=>({...d,heroOrder:[...d.heroOrder]})
const newAdmission=(status:Admission['status'],reason?:string):Admission=>({
 id:id('admission'),status,role:'responsive-collaborator',reason:reason??'I can handle Tablet while you finish Mobile.',
 identity:{id:'browser-agent',displayName:'Your agent',provider:'browser'},requestedScopes,
 grantedScopes:status==='admitted'?requestedScopes:[],
})
const initial=()=>({
 revision:12,admission:undefined,agentPhase:'absent' as const,proposal:undefined,stale:false,reviewOpen:false,
 mobileDesign:baseDesign(),tabletDesign:baseDesign(),selectedMobile:null,humanPast:[] as ResponsiveDesign[],humanFuture:[] as ResponsiveDesign[],
 agentWork:{target:null,label:'',baseRevision:null,currentRevision:null},reviewFocus:null,blockedAttempt:undefined,
 receipts:[],toolTraces:[],agentPublications:0,evidenceSuite:{passed:0,total:16},
 activity:[event('system','Workspace ready. Tablet has no collaborator.',12,{kind:'authority',outcome:'state',code:'RESET'})],
})
const applyPatch=(design:ResponsiveDesign,patch:Record<string,unknown>):ResponsiveDesign=>{
 const next=cloneDesign(design)
 if(Array.isArray(patch.heroOrder)&&patch.heroOrder.every(v=>v==='copy'||v==='visual')) next.heroOrder=[...patch.heroOrder] as ResponsiveDesign['heroOrder']
 if(patch.heroLayout==='stack'||patch.heroLayout==='split') next.heroLayout=patch.heroLayout
 if(patch.alignment==='left'||patch.alignment==='center') next.alignment=patch.alignment
 if(typeof patch.heroGap==='number') next.heroGap=Math.max(8,Math.min(40,patch.heroGap))
 if(typeof patch.heroPadding==='number') next.heroPadding=Math.max(16,Math.min(56,patch.heroPadding))
 if(typeof patch.ctaFull==='boolean') next.ctaFull=patch.ctaFull
 if(typeof patch.titleScale==='number') next.titleScale=Math.max(.82,Math.min(1.24,patch.titleScale))
 if(typeof patch.navCompact==='boolean') next.navCompact=patch.navCompact
 return next
}
const admissionError=(state:Store):MutationResult|undefined=>{
 if(!state.admission)return{ok:false,error:'ADMISSION_REQUIRED'}
 if(state.admission.status==='pending'||state.admission.status==='discovered')return{ok:false,error:'ADMISSION_PENDING'}
 if(state.admission.status==='paused')return{ok:false,error:'ADMISSION_PAUSED'}
 if(state.admission.status==='revoked')return{ok:false,error:'ADMISSION_REVOKED'}
 return undefined
}

export const usePresenceStore=create<Store>((set,get)=>({
 ...initial(),
 discoverAgent:()=>set(state=>{
  if(state.admission && !['revoked'].includes(state.admission.status)) return state
  return {admission:newAdmission('discovered'),agentPhase:'discovered',blockedAttempt:undefined,activity:[...state.activity,event('agent','Browser agent inspected Presence roles.',state.revision)]}
 }),
 requestAdmission:(reason)=>set(state=>({
  admission:{...(state.admission??newAdmission('pending',reason)),status:'pending',reason:reason??state.admission?.reason??'I can handle Tablet while you finish Mobile.',grantedScopes:[]},
  agentPhase:'requesting',blockedAttempt:undefined,activity:[...state.activity,event('agent','Browser agent requested the Tablet seat.',state.revision)]
 })),
 denyAdmission:()=>set(state=>({admission:undefined,agentPhase:'absent',activity:[...state.activity,event('human','Admission request declined.',state.revision)]})),
 approveAdmission:()=>set(state=>state.admission?.status==='pending'?({
  admission:{...state.admission,status:'admitted',grantedScopes:requestedScopes},agentPhase:'present',agentWork:{target:null,label:'Ready to collaborate',baseRevision:state.revision,currentRevision:state.revision},activity:[...state.activity,event('human','Admission granted · Tablet',state.revision,{kind:'authority',outcome:'allowed',code:'ADMISSION_GRANTED',surface:'tablet'})]
 }):state),
 pause:()=>set(state=>state.admission?.status==='admitted'?({admission:{...state.admission,status:'paused'},agentPhase:'paused',activity:[...state.activity,event('human','Agent paused.',state.revision)]}):state),
 resume:()=>set(state=>state.admission?.status==='paused'?({admission:{...state.admission,status:'admitted'},agentPhase:'present',activity:[...state.activity,event('human','Agent resumed.',state.revision)]}):state),
 revoke:()=>set(state=>state.admission?({admission:{...state.admission,status:'revoked',grantedScopes:[]},agentPhase:'revoked',stale:false,agentWork:{target:null,label:'Removed',baseRevision:null,currentRevision:state.revision},activity:[...state.activity,event('human','Agent removed. Tablet is unassigned again.',state.revision,{kind:'authority',outcome:'state',surface:'tablet'})]}):state),
 selectMobile:(componentId)=>set({selectedMobile:componentId}),
 humanEdit:(componentId,patch:DesignPatch,label)=>set(state=>({
  mobileDesign:applyPatch(state.mobileDesign,patch as Record<string,unknown>),selectedMobile:componentId,
  humanPast:[...state.humanPast,cloneDesign(state.mobileDesign)].slice(-30),humanFuture:[],revision:state.revision+1,
  activity:[...state.activity,event('human',label,state.revision+1)]
 })),
 humanReorderHero:(order)=>{
  const current=get().mobileDesign.heroOrder
  if(current.join('|')===order.join('|'))return
  get().humanEdit('hero',{heroOrder:order},order[0]==='visual'?'You dragged product media above the copy.':'You dragged hero copy above product media.')
 },
 undo:()=>set(state=>{
  const previous=state.humanPast.at(-1);if(!previous)return state
  return {mobileDesign:cloneDesign(previous),humanPast:state.humanPast.slice(0,-1),humanFuture:[cloneDesign(state.mobileDesign),...state.humanFuture].slice(0,30),revision:state.revision+1,activity:[...state.activity,event('human','Undid the last Mobile edit.',state.revision+1)]}
 }),
 redo:()=>set(state=>{
  const next=state.humanFuture[0];if(!next)return state
  return {mobileDesign:cloneDesign(next),humanPast:[...state.humanPast,cloneDesign(state.mobileDesign)].slice(-30),humanFuture:state.humanFuture.slice(1),revision:state.revision+1,activity:[...state.activity,event('human','Redid the Mobile edit.',state.revision+1)]}
 }),
 humanChange:()=>get().humanEdit('hero',{heroOrder:['visual','copy'],alignment:'center',ctaFull:true},'You changed the Mobile hero composition.'),
 agentInspect:(componentId,label='Inspecting component')=>{
  const state=get();const gate=admissionError(state);if(gate)return gate
  if(!['hero','copy','media','features','nav','cta'].includes(componentId))return{ok:false,error:'NOT_FOUND'}
  set(current=>({agentPhase:'inspecting',agentWork:{target:componentId,label,baseRevision:current.agentWork.baseRevision??current.revision,currentRevision:current.revision,detail:`Read r${current.revision}`},activity:[...current.activity,event('agent',label,current.revision)]}))
  return{ok:true}
 },
 agentPropose:(input):MutationResult=>{
  const state=get(); const gate=admissionError(state)
  if(gate){
   if('error' in gate){
    const error=gate.error
    set(current=>({blockedAttempt:{error,message:blockedMessage(error,input.breakpoint),atRevision:current.revision,surface:input.breakpoint,nonce:Date.now(),expectedRevision:input.expectedRevision,componentId:input.componentId,label:input.label},activity:[...current.activity,event('system',`Operation blocked · ${input.breakpoint[0].toUpperCase()+input.breakpoint.slice(1)}`,current.revision,{kind:'authority',outcome:'blocked',code:error,surface:input.breakpoint})]}))
   }
   return gate
  }
  const admission=state.admission!
  if(input.breakpoint!=='tablet'){
   const error=input.breakpoint==='desktop'?'REFERENCE_LOCKED' as const:'SURFACE_NOT_ASSIGNED' as const
   const message=input.breakpoint==='desktop'?'Desktop is locked as the canonical reference.':blockedMessage(error,input.breakpoint)
   set(current=>({blockedAttempt:{error,message,atRevision:current.revision,surface:input.breakpoint,nonce:Date.now(),expectedRevision:input.expectedRevision,componentId:input.componentId,label:input.label},activity:[...current.activity,event('system',`Operation blocked · ${input.breakpoint[0].toUpperCase()+input.breakpoint.slice(1)}`,current.revision,{kind:'authority',outcome:'blocked',code:error,surface:input.breakpoint})]}))
   return{ok:false,error}
  }
  if(!admission.grantedScopes.some(scope=>scope.id===input.breakpoint&&scope.mode==='propose')){
   const error='CAPABILITY_NOT_GRANTED' as const
   set(current=>({blockedAttempt:{error,message:blockedMessage(error,input.breakpoint),atRevision:current.revision,surface:input.breakpoint,nonce:Date.now(),expectedRevision:input.expectedRevision,componentId:input.componentId,label:input.label},activity:[...current.activity,event('system','Operation blocked · Tablet',current.revision,{kind:'authority',outcome:'blocked',code:error,surface:'tablet'})]}))
   return{ok:false,error}
  }
  if(!['hero','copy','media','features','nav','cta'].includes(input.componentId))return{ok:false,error:'NOT_FOUND'}
  if(!input.componentId||!input.label||!input.patch||Object.keys(input.patch).length===0)return{ok:false,error:'INVALID_OPERATION'}
  if(input.expectedRevision!==state.revision){
   const error='STALE_STATE' as const
   set(current=>({stale:true,agentPhase:'catching-up',blockedAttempt:{error,message:blockedMessage(error,input.breakpoint),atRevision:current.revision,surface:'tablet',nonce:Date.now(),expectedRevision:input.expectedRevision,componentId:input.componentId,label:input.label},agentWork:{target:input.componentId,label:'Project changed',baseRevision:input.expectedRevision,currentRevision:current.revision,detail:`Working from r${input.expectedRevision} · current r${current.revision}`},activity:[...current.activity,event('system',`Stale operation blocked · r${input.expectedRevision} → r${current.revision}`,current.revision,{kind:'authority',outcome:'blocked',code:error,surface:'tablet'})]}))
   return{ok:false,error}
  }
  const operation:Operation={...input,id:id('op')}
  set(current=>({
   stale:false,blockedAttempt:undefined,agentPhase:'working',agentWork:{target:input.componentId,label:input.label,baseRevision:input.expectedRevision,currentRevision:current.revision,detail:`Applied provisionally at r${current.revision}`},
   proposal:current.proposal&&['working','ready','conflicted'].includes(current.proposal.status)
    ?{...current.proposal,status:'working',baseRevision:current.proposal.baseRevision===current.revision?current.proposal.baseRevision:current.revision,operations:[...current.proposal.operations.map(op=>current.proposal!.baseRevision===current.revision?op:{...op,expectedRevision:current.revision}),operation]}
    :{id:id('proposal'),status:'working',baseRevision:current.revision,operations:[operation],explanation:'Adapted Tablet while preserving the hierarchy and constraints of the live project.'},
   activity:[...current.activity,event('agent',input.label,current.revision),event('agent',`Proposal created · ${input.componentId}`,current.revision,{kind:'authority',outcome:'allowed',code:'PROPOSAL_CREATED',surface:'tablet'})]
  }))
  return{ok:true}
 },
 markProposalReady:():MutationResult=>{
  const state=get();const gate=admissionError(state);if(gate)return gate
  if(!state.proposal?.operations.length)return{ok:false,error:'INVALID_OPERATION'}
  set(current=>({proposal:current.proposal?{...current.proposal,status:'ready'}:undefined,agentPhase:'ready',agentWork:{target:'hero',label:'Proposal ready',baseRevision:current.proposal?.baseRevision??current.revision,currentRevision:current.revision,detail:`${current.proposal?.operations.length??0} changes ready`},activity:[...current.activity,event('agent','Tablet proposal ready for your review.',current.revision,{kind:'authority',outcome:'state',code:'PROPOSAL_READY',surface:'tablet'})]}))
  return{ok:true}
 },
 agentPublish:():MutationResult=>{
  const state=get();const gate=admissionError(state);if(gate)return gate
  const error='HUMAN_APPROVAL_REQUIRED' as const
  set(current=>({agentPublications:current.agentPublications,blockedAttempt:{error,message:'Final approval belongs to the human.',atRevision:current.revision,surface:'tablet',nonce:Date.now(),expectedRevision:current.proposal?.baseRevision,label:'Agent attempted final publication'},activity:[...current.activity,event('system','Agent publication blocked · human approval required',current.revision,{kind:'authority',outcome:'blocked',code:error,surface:'tablet'})]}))
  return{ok:false,error}
 },
 recordToolTrace:(trace:Omit<ToolTrace,'id'>)=>set(state=>({toolTraces:[...state.toolTraces,{...trace,id:id('tool')}].slice(-24)})),
 setEvidenceSuite:(passed,total)=>set({evidenceSuite:{passed,total,ranAt:new Date().toISOString()}}),
 runAgentDemo:async()=>{

  const state=get(); if(state.admission?.status!=='admitted'||state.agentPhase!=='present'||state.proposal?.status==='working'||state.proposal?.status==='ready')return
  const base=state.revision
  get().agentInspect('hero','Inspecting Hero · targeting Tablet')
  await wait(520)
  // Establish a visible, provisional Tablet intent at the current canonical revision.
  // Nothing here mutates canonical project state.
  get().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroLayout:'split',heroPadding:42},label:'Prepared Tablet hero composition',expectedRevision:base})
  await wait(420)
  get().agentInspect('nav','Tablet plan ready · waiting on live project state')
  // Keep a generous human concurrency window for the recording. A Mobile edit
  // advances the shared revision while the agent still carries `base`.
  await Promise.race([waitForRevisionChange(base,14000),wait(14000)])
  const staleAttempt=get().agentPropose({componentId:'nav',breakpoint:'tablet',patch:{navCompact:true},label:'Applying Tablet navigation from earlier state',expectedRevision:base})
  if('error' in staleAttempt&&staleAttempt.error==='STALE_STATE'){
   // Conflict red-state is intentionally sub-second. Presence freezes, then the
   // agent re-reads and rebases instead of overwriting the human revision.
   await wait(720)
   const fresh=get().revision
   set(current=>({stale:false,blockedAttempt:undefined,proposal:current.proposal?{...current.proposal,baseRevision:fresh,operations:current.proposal.operations.map(op=>({...op,expectedRevision:fresh}))}:current.proposal,agentPhase:'inspecting',agentWork:{target:'hero',label:`Rebased on r${fresh}`,baseRevision:fresh,currentRevision:fresh,detail:'Human Mobile change preserved · adapting Tablet only'},activity:[...current.activity,event('agent',`Rebased safely on r${fresh}; Mobile preserved.`,fresh)]}))
   await wait(520)
   get().agentPropose({componentId:'nav',breakpoint:'tablet',patch:{navCompact:true},label:'Compacted Tablet navigation',expectedRevision:fresh})
   await wait(420)
   get().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroOrder:['visual','copy'],heroGap:14,heroPadding:48},label:'Recomposed Tablet hero',expectedRevision:fresh})
   await wait(420)
   get().agentPropose({componentId:'cta',breakpoint:'tablet',patch:{ctaFull:true},label:'Expanded Tablet CTA',expectedRevision:fresh})
   await wait(360)
   get().agentPropose({componentId:'copy',breakpoint:'tablet',patch:{titleScale:.92},label:'Balanced Tablet headline',expectedRevision:fresh})
  }else{
   const fresh=get().revision
   await wait(420)
   get().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroOrder:['visual','copy'],heroGap:14,heroPadding:48},label:'Recomposed Tablet hero',expectedRevision:fresh})
   await wait(360)
   get().agentPropose({componentId:'cta',breakpoint:'tablet',patch:{ctaFull:true},label:'Expanded Tablet CTA',expectedRevision:fresh})
  }
  get().markProposalReady()
 },
 testRevokedAccess:()=>get().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroGap:10},label:'Attempted post-revocation Tablet change',expectedRevision:get().revision}),
 openReview:()=>set(state=>state.proposal?.status==='ready'&&state.proposal.operations.length?({reviewOpen:true,reviewFocus:state.proposal.operations[0]?.componentId??null,activity:[...state.activity,event('human','Opened Tablet proposal for human review.',state.revision)]}):state),closeReview:()=>set({reviewOpen:false,reviewFocus:null}),focusReview:(componentId)=>set({reviewFocus:componentId}),
 rejectOp:operationId=>set(state=>state.proposal?({proposal:{...state.proposal,operations:state.proposal.operations.filter(operation=>operation.id!==operationId)},reviewFocus:state.reviewFocus===state.proposal.operations.find(operation=>operation.id===operationId)?.componentId?null:state.reviewFocus}):state),
 acceptProposal:()=>set(state=>{
  if(!state.proposal||state.proposal.status!=='ready')return state
  const before=projectFingerprints(state)
  const next=state.proposal.operations.reduce((design,operation)=>applyPatch(design,operation.patch),state.tabletDesign)
  const acceptedRevision=state.revision+1
  const acceptEvent=event('human','Accepted selected Tablet changes.',acceptedRevision,{kind:'authority',outcome:'allowed',code:'PROPOSAL_ACCEPTED',surface:'tablet'})
  const after=projectFingerprints({...state,tabletDesign:next})
  const relevantIds=[...state.activity.filter(item=>item.revision>=state.proposal!.baseRevision).map(item=>item.id),acceptEvent.id]
  const receipt:Store['receipts'][number]={id:id('receipt'),proposalId:state.proposal.id,agentIdentity:state.admission?.identity.displayName??'Browser agent',role:state.admission?.role??'responsive-collaborator',scope:'Tablet · propose only',baseRevision:state.proposal.baseRevision,acceptedRevision,affectedBreakpoint:'tablet',operations:state.proposal.operations.map(op=>op.label),operationExpectedRevisions:state.proposal.operations.map(op=>op.expectedRevision),protectedSurfaces:['desktop','mobile'],beforeFingerprints:before,afterFingerprints:after,approvedAt:new Date().toISOString(),outcome:'accepted',auditEventIds:relevantIds}
  const acceptedState:Partial<Store>={tabletDesign:next,proposal:{...state.proposal,status:'accepted'},reviewOpen:false,reviewFocus:null,revision:acceptedRevision,agentPhase:state.admission?.status==='admitted'?'present':state.agentPhase,agentWork:{target:null,label:'Accepted',baseRevision:null,currentRevision:acceptedRevision},receipts:[...state.receipts,receipt],activity:[...state.activity,acceptEvent]}
  return acceptedState
 }),
 rejectProposal:()=>set(state=>state.proposal?({proposal:{...state.proposal,status:'rejected'},reviewOpen:false,reviewFocus:null,agentPhase:state.admission?.status==='admitted'?'present':state.agentPhase,activity:[...state.activity,event('human','Rejected the Tablet proposal.',state.revision,{kind:'authority',outcome:'state',code:'PROPOSAL_REJECTED',surface:'tablet'})]}):state),
 reset:()=>{seq=0;set(initial())},
}))
