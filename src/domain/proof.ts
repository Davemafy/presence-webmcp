import type {Activity,ResponsiveDesign,Store} from './types'

export const canonicalStringify=(value:unknown):string=>{
 const walk=(input:unknown):unknown=>{
  if(Array.isArray(input))return input.map(walk)
  if(input&&typeof input==='object')return Object.keys(input as Record<string,unknown>).sort().reduce<Record<string,unknown>>((out,key)=>{out[key]=walk((input as Record<string,unknown>)[key]);return out},{})
  return input
 }
 return JSON.stringify(walk(value))
}

// Deterministic FNV-1a fingerprint. The demo requires stable verification, not secrecy.
export const fingerprint=(value:unknown):string=>{
 const text=canonicalStringify(value)
 let hash=0x811c9dc5
 for(let i=0;i<text.length;i++){
  hash^=text.charCodeAt(i)
  hash=Math.imul(hash,0x01000193)
 }
 const hex=(hash>>>0).toString(16).toUpperCase().padStart(8,'0')
 return `${hex.slice(0,4)}…${hex.slice(4)}`
}

export const projectFingerprints=(state:Pick<Store,'mobileDesign'|'tabletDesign'>)=>({
 desktop:fingerprint(referenceDesign),
 tablet:fingerprint(state.tabletDesign),
 mobile:fingerprint(state.mobileDesign),
})

export const referenceDesign:ResponsiveDesign={heroOrder:['copy','visual'],heroLayout:'stack',alignment:'left',heroGap:18,heroPadding:28,ctaFull:false,titleScale:1,navCompact:false}

export const proofMetrics=(state:Pick<Store,'activity'|'admission'|'revision'|'proposal'|'mobileDesign'|'tabletDesign'|'receipts'|'agentPublications'>)=>{
 const denied=state.activity.filter(item=>item.kind==='authority'&&item.outcome==='blocked')
 const staleDenied=denied.filter(item=>item.code==='STALE_STATE')
 const unauthorizedDenied=denied.filter(item=>item.code==='SURFACE_NOT_ASSIGNED'||item.code==='CAPABILITY_NOT_GRANTED'||item.code==='HUMAN_APPROVAL_REQUIRED')
 const accepted=state.activity.filter(item=>item.code==='PROPOSAL_ACCEPTED').length
 const unauthorizedWritesApplied=state.receipts.filter(receipt=>receipt.beforeFingerprints.mobile!==receipt.afterFingerprints.mobile||receipt.beforeFingerprints.desktop!==receipt.afterFingerprints.desktop).length
 const staleWritesApplied=state.receipts.filter(receipt=>receipt.operationExpectedRevisions.some(expected=>expected!==receipt.baseRevision)).length
 const humanChangesLost=state.receipts.filter(receipt=>receipt.beforeFingerprints.mobile!==receipt.afterFingerprints.mobile).length
 return {
  mobileOwnership:'Human',
  tabletOwnership:state.admission?.status==='admitted'||state.admission?.status==='paused'?'Agent, temporary':'Unassigned',
  desktopMode:'Reference',
  canonicalRevision:state.revision,
  humanChangesLost,
  unauthorizedWritesApplied,
  staleWritesApplied,
  agentPublications:state.agentPublications,
  acceptedProposals:accepted,
  deniedOperations:denied.length,
  staleDenied:staleDenied.length,
  unauthorizedDenied:unauthorizedDenied.length,
  fingerprints:projectFingerprints(state),
  latestReceipt:state.receipts.at(-1),
 }
}

export const auditByIds=(activity:Activity[],ids:string[])=>activity.filter(item=>ids.includes(item.id))
