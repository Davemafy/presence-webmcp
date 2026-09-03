import {usePresenceStore} from '../domain/store'
import type {Breakpoint} from '../domain/types'

type ToolDefinition={name:string;description:string;inputSchema?:Record<string,unknown>;execute:(args:Record<string,unknown>)=>unknown}
declare global{interface Document{modelContext?:{registerTool:(tool:ToolDefinition)=>void}}}

const objectSchema=(properties:Record<string,unknown>,required:string[]=[]):Record<string,unknown>=>({type:'object',properties,required,additionalProperties:false})
const register=(definition:ToolDefinition)=>document.modelContext?.registerTool(definition)
const live=()=>usePresenceStore.getState()
const breakpoint=(value:unknown):Breakpoint=>value==='desktop'||value==='mobile'?'desktop'===value?'desktop':'mobile':'tablet'

export function registerWebMcp(){
 if(!document.modelContext)return false
 register({name:'inspect_presence',description:'Inspect the live Presence workspace, current revision, available agent seat, and admission state.',inputSchema:objectSchema({}),execute:()=>{const state=live();state.discoverAgent();const next=live();return{revision:next.revision,seat:{breakpoint:'tablet',status:next.admission?.status==='admitted'?'occupied':'unassigned'},admission:next.admission?.status??'none',roles:['responsive-collaborator']}}})
 register({name:'inspect_available_roles',description:'Inspect the scoped roles this application can grant to an external browser agent.',inputSchema:objectSchema({}),execute:()=>({roles:[{id:'responsive-collaborator',label:'Responsive collaborator',can:['inspect:desktop','inspect:tablet','inspect:mobile','propose:tablet'],cannot:['write:desktop','write:mobile','publish','change:canonical-copy']} ]})})
 register({name:'request_admission',description:'Ask the human to admit this browser agent as the scoped Responsive collaborator for Tablet.',inputSchema:objectSchema({reason:{type:'string',minLength:1,maxLength:180}},['reason']),execute:args=>{live().requestAdmission(String(args.reason??'I can handle Tablet while you finish Mobile.'));return{status:'pending_user_approval',requestedRole:'responsive-collaborator',requestedScope:'tablet:propose'}}})
 register({name:'inspect_admission',description:'Inspect whether this browser agent is discovered, pending, admitted, paused, or revoked.',inputSchema:objectSchema({}),execute:()=>live().admission??{status:'none'}})
 register({name:'inspect_project',description:'Inspect the live Aurora project and its current canonical revision.',inputSchema:objectSchema({}),execute:()=>({project:'Aurora',revision:live().revision,goal:'Preserve hierarchy while adapting responsive surfaces.'})})
 register({name:'inspect_breakpoint',description:'Inspect one responsive surface at the current revision.',inputSchema:objectSchema({breakpoint:{type:'string',enum:['desktop','tablet','mobile']}},['breakpoint']),execute:args=>({breakpoint:breakpoint(args.breakpoint),revision:live().revision,ownership:breakpoint(args.breakpoint)==='desktop'?'reference':breakpoint(args.breakpoint)==='mobile'?'human':'agent-seat'})})
 register({name:'inspect_component',description:'Inspect a component in the live project before proposing a change. Presence visibly focuses that semantic target.',inputSchema:objectSchema({componentId:{type:'string',minLength:1}},['componentId']),execute:args=>{const componentId=String(args.componentId);const result=live().agentInspect(componentId,`Inspecting ${componentId}`);return result.ok?{ok:true,componentId,revision:live().revision}:result}})
 register({name:'inspect_constraints',description:'Inspect the application-level capability and responsive constraints enforced on agent mutations.',inputSchema:objectSchema({}),execute:()=>({desktop:{mode:'reference'},tablet:{mode:'propose'},mobile:{mode:'human-edit'},publish:'human-only',freshRevisionRequired:true})})
 register({name:'inspect_recent_changes',description:'Inspect recent human, agent, and system activity with revisions.',inputSchema:objectSchema({}),execute:()=>live().activity.slice(-8)})
 register({name:'compare_breakpoints',description:'Compare ownership and intended behavior across Desktop, Tablet, and Mobile.',inputSchema:objectSchema({}),execute:()=>({desktop:'REFERENCE',tablet:live().admission?.status==='admitted'?'YOUR AGENT':'UNASSIGNED',mobile:'YOU'})})
 const propose=(args:Record<string,unknown>)=>live().agentPropose({componentId:String(args.componentId??''),breakpoint:breakpoint(args.breakpoint),patch:typeof args.patch==='object'&&args.patch?args.patch as Record<string,unknown>:{},label:String(args.label??'Agent proposed a Tablet change'),expectedRevision:Number(args.expectedRevision)})
 const mutationSchema=objectSchema({componentId:{type:'string',minLength:1},breakpoint:{type:'string',enum:['desktop','tablet','mobile']},patch:{type:'object'},label:{type:'string',minLength:1},expectedRevision:{type:'integer',minimum:0}},['componentId','breakpoint','patch','label','expectedRevision'])
 register({name:'propose_layout_change',description:'Propose a provisional responsive layout change. Presence enforces the admitted surface scope and current expectedRevision at execution time.',inputSchema:mutationSchema,execute:propose})
 register({name:'propose_component_change',description:'Propose a provisional component change. Presence enforces the admitted surface scope and current expectedRevision at execution time.',inputSchema:mutationSchema,execute:propose})
 register({name:'propose_responsive_rule',description:'Propose a provisional responsive rule. Presence enforces the admitted surface scope and current expectedRevision at execution time.',inputSchema:mutationSchema,execute:propose})
 register({name:'submit_proposal',description:'Mark the current provisional Tablet proposal ready for human review.',inputSchema:objectSchema({}),execute:()=>live().markProposalReady()})
 register({name:'explain_proposal',description:'Explain the current provisional Tablet proposal and its base revision.',inputSchema:objectSchema({}),execute:()=>live().proposal?{baseRevision:live().proposal?.baseRevision,explanation:live().proposal?.explanation,operations:live().proposal?.operations.length}:{status:'none'}})
 register({name:'release_role',description:'Release this agent role. The app revokes further authority but preserves the proposal record.',inputSchema:objectSchema({}),execute:()=>{live().revoke();return{status:'revoked'}}})
 return true
}
