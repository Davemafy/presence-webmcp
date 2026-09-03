export type Breakpoint='desktop'|'tablet'|'mobile'
export type AdmissionStatus='discovered'|'pending'|'admitted'|'paused'|'revoked'
export type AgentPhase='absent'|'discovered'|'requesting'|'present'|'inspecting'|'working'|'catching-up'|'ready'|'paused'|'revoked'
export type PermissionError='ADMISSION_REQUIRED'|'ADMISSION_PENDING'|'ADMISSION_PAUSED'|'ADMISSION_REVOKED'|'CAPABILITY_NOT_GRANTED'|'SURFACE_NOT_ASSIGNED'|'STALE_STATE'|'CONSTRAINT_VIOLATION'|'INVALID_OPERATION'|'NOT_FOUND'
export type CapabilityScope={resource:'breakpoint';id:Breakpoint;mode:'inspect'|'propose'}
export type HeroPart='copy'|'visual'
export type Alignment='left'|'center'
export type HeroLayout='stack'|'split'
export type ResponsiveDesign={heroOrder:HeroPart[];heroLayout:HeroLayout;alignment:Alignment;heroGap:number;heroPadding:number;ctaFull:boolean;titleScale:number;navCompact:boolean}
export type DesignPatch=Partial<ResponsiveDesign>
export type Operation={id:string;componentId:string;breakpoint:Breakpoint;patch:Record<string,unknown>;label:string;expectedRevision:number}
export type Proposal={id:string;status:'working'|'ready'|'accepted'|'rejected'|'conflicted';baseRevision:number;operations:Operation[];explanation:string}
export type Admission={
 id:string;status:AdmissionStatus;role:'responsive-collaborator';reason:string;
 identity:{id:string;displayName:string;provider?:string};
 requestedScopes:CapabilityScope[];grantedScopes:CapabilityScope[];
}
export type AuthorityOutcome='allowed'|'blocked'|'state'
export type Activity={id:string;actor:'human'|'agent'|'system';message:string;revision:number;kind?:'activity'|'authority';outcome?:AuthorityOutcome;code?:PermissionError|'ADMISSION_GRANTED'|'PROPOSAL_CREATED';surface?:Breakpoint}
export type MutationResult={ok:true}|{ok:false;error:PermissionError}
export type AgentWork={target:string|null;label:string;baseRevision:number|null;currentRevision:number|null;detail?:string}
export type BlockedAttempt={error:PermissionError;message:string;atRevision:number;surface?:Breakpoint;nonce:number;expectedRevision?:number;componentId?:string;label?:string}
export type Store={
 revision:number; admission?:Admission; agentPhase:AgentPhase; proposal?:Proposal; stale:boolean; reviewOpen:boolean; activity:Activity[];
 mobileDesign:ResponsiveDesign;tabletDesign:ResponsiveDesign;selectedMobile:string|null;humanPast:ResponsiveDesign[];humanFuture:ResponsiveDesign[];
 agentWork:AgentWork;reviewFocus:string|null;blockedAttempt?:BlockedAttempt;
 discoverAgent:()=>void; requestAdmission:(reason?:string)=>void; denyAdmission:()=>void; approveAdmission:()=>void; pause:()=>void; resume:()=>void; revoke:()=>void;
 selectMobile:(componentId:string|null)=>void; humanEdit:(componentId:string,patch:DesignPatch,label:string)=>void; humanReorderHero:(order:HeroPart[])=>void; undo:()=>void; redo:()=>void; humanChange:()=>void;
 agentInspect:(componentId:string,label?:string)=>MutationResult; agentPropose:(op:Omit<Operation,'id'>)=>MutationResult; markProposalReady:()=>MutationResult; runAgentDemo:()=>Promise<void>; testRevokedAccess:()=>MutationResult;
 openReview:()=>void; closeReview:()=>void; focusReview:(componentId:string|null)=>void; rejectOp:(id:string)=>void; acceptProposal:()=>void; rejectProposal:()=>void; reset:()=>void;
}
