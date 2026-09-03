import {beforeEach,describe,expect,it,vi} from 'vitest'
import {usePresenceStore} from '../domain/store'
import {registerWebMcp} from '../webmcp/register'

type Tool={name:string;execute:(args:Record<string,unknown>)=>unknown}
const tools=new Map<string,Tool>()
beforeEach(()=>{tools.clear();usePresenceStore.getState().reset();Object.defineProperty(document,'modelContext',{configurable:true,value:{registerTool:vi.fn((tool:Tool)=>tools.set(tool.name,tool))}})})

describe('WebMCP surface',()=>{
 it('registers the semantic tool set and discovers without granting authority',()=>{
  expect(registerWebMcp()).toBe(true)
  expect(tools.has('inspect_presence')).toBe(true);expect(tools.has('request_admission')).toBe(true);expect(tools.has('propose_layout_change')).toBe(true)
  tools.get('inspect_presence')?.execute({})
  expect(usePresenceStore.getState().admission?.status).toBe('discovered')
  expect(usePresenceStore.getState().admission?.grantedScopes).toHaveLength(0)
 })

 it('lets an agent attempt another surface but the domain engine denies it and records authority proof',()=>{
  registerWebMcp();tools.get('request_admission')?.execute({reason:'I can handle Tablet.'});usePresenceStore.getState().approveAdmission()
  const revision=usePresenceStore.getState().revision
  expect(tools.get('propose_layout_change')?.execute({componentId:'hero',breakpoint:'mobile',patch:{heroGap:12},label:'Try Mobile anyway',expectedRevision:revision})).toEqual({ok:false,error:'SURFACE_NOT_ASSIGNED'})
  const current=usePresenceStore.getState()
  expect(current.mobileDesign.heroGap).toBe(18)
  expect(current.blockedAttempt?.error).toBe('SURFACE_NOT_ASSIGNED')
  expect(current.activity.at(-1)?.code).toBe('SURFACE_NOT_ASSIGNED')
 })
 it('drives request -> approval -> fresh proposal through the same domain engine',()=>{
  registerWebMcp();tools.get('request_admission')?.execute({reason:'I can handle Tablet.'})
  expect(usePresenceStore.getState().admission?.status).toBe('pending')
  usePresenceStore.getState().approveAdmission();const revision=usePresenceStore.getState().revision
  expect(tools.get('propose_layout_change')?.execute({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'Adapt hero',expectedRevision:revision})).toEqual({ok:true})
  expect(usePresenceStore.getState().proposal?.operations).toHaveLength(1)
 })
})
