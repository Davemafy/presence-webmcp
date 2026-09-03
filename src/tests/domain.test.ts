import {beforeEach,describe,expect,it} from 'vitest'
import {usePresenceStore} from '../domain/store'

const state=()=>usePresenceStore.getState()
beforeEach(()=>state().reset())

describe('agent admission invariants',()=>{
 it('starts with Tablet unassigned and rejects pre-admission mutation',()=>{
  expect(state().admission).toBeUndefined()
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'x',expectedRevision:12})).toEqual({ok:false,error:'ADMISSION_REQUIRED'})
 })
 it('requires explicit human approval before proposing',()=>{
  state().requestAdmission('Take Tablet')
  expect(state().admission?.status).toBe('pending')
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'x',expectedRevision:12})).toEqual({ok:false,error:'ADMISSION_PENDING'})
  state().approveAdmission()
  expect(state().admission?.status).toBe('admitted')
 })
 it('blocks out-of-scope surfaces',()=>{
  state().requestAdmission();state().approveAdmission()
  expect(state().agentPropose({componentId:'hero',breakpoint:'mobile',patch:{columns:2},label:'x',expectedRevision:12})).toEqual({ok:false,error:'SURFACE_NOT_ASSIGNED'})
  expect(state().blockedAttempt?.error).toBe('SURFACE_NOT_ASSIGNED')
  expect(state().activity.at(-1)?.code).toBe('SURFACE_NOT_ASSIGNED')
 })
 it('rejects stale writes without appending an operation',()=>{
  state().requestAdmission();state().approveAdmission();const readRevision=state().revision
  state().humanChange()
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'x',expectedRevision:readRevision})).toEqual({ok:false,error:'STALE_STATE'})
  expect(state().proposal).toBeUndefined();expect(state().agentPhase).toBe('catching-up')
  expect(state().blockedAttempt?.error).toBe('STALE_STATE')
  expect(state().activity.at(-1)?.code).toBe('STALE_STATE')
 })
 it('allows fresh re-inspection and provisional proposal',()=>{
  state().requestAdmission();state().approveAdmission();state().humanChange();const revision=state().revision
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'adapt',expectedRevision:revision})).toEqual({ok:true})
  expect(state().proposal?.operations).toHaveLength(1);expect(state().revision).toBe(revision)
 })
 it('pause and revoke immediately remove mutation authority',()=>{
  state().requestAdmission();state().approveAdmission();state().pause()
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{columns:2},label:'x',expectedRevision:12})).toEqual({ok:false,error:'ADMISSION_PAUSED'})
  state().resume();state().revoke()
  expect(state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroGap:12},label:'x',expectedRevision:12})).toEqual({ok:false,error:'ADMISSION_REVOKED'})
  expect(state().blockedAttempt?.error).toBe('ADMISSION_REVOKED')
 })
})

describe('human Mobile editing',()=>{
 it('applies a real Mobile edit and increments the canonical revision',()=>{
  const before=state().revision
  state().humanEdit('copy',{alignment:'center',titleScale:1.12},'Centered Mobile copy')
  expect(state().mobileDesign.alignment).toBe('center')
  expect(state().mobileDesign.titleScale).toBeCloseTo(1.12)
  expect(state().revision).toBe(before+1)
 })
 it('reorders hero parts through the same human mutation path',()=>{
  state().humanReorderHero(['visual','copy'])
  expect(state().mobileDesign.heroOrder).toEqual(['visual','copy'])
  expect(state().revision).toBe(13)
 })
 it('undo and redo are canonical mutations',()=>{
  state().humanEdit('cta',{ctaFull:true},'Full width CTA')
  expect(state().mobileDesign.ctaFull).toBe(true)
  state().undo()
  expect(state().mobileDesign.ctaFull).toBe(false)
  state().redo()
  expect(state().mobileDesign.ctaFull).toBe(true)
  expect(state().revision).toBe(15)
 })

 it('opens human review only for a ready proposal and acceptance advances canonical revision',()=>{
  state().requestAdmission();state().approveAdmission()
  const before=state().revision
  state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroGap:12},label:'Tighten Tablet gap',expectedRevision:before})
  state().openReview()
  expect(state().reviewOpen).toBe(false)
  state().markProposalReady();state().openReview()
  expect(state().reviewOpen).toBe(true)
  expect(state().reviewFocus).toBe('hero')
  state().acceptProposal()
  expect(state().reviewOpen).toBe(false)
  expect(state().proposal?.status).toBe('accepted')
  expect(state().revision).toBe(before+1)
 })
 it('accepted agent operations become the Tablet canonical design',()=>{
  state().requestAdmission();state().approveAdmission()
  const revision=state().revision
  state().agentPropose({componentId:'hero',breakpoint:'tablet',patch:{heroOrder:['visual','copy'],ctaFull:true,navCompact:true,heroLayout:'split'},label:'Reorder hero',expectedRevision:revision})
  state().markProposalReady();state().acceptProposal()
  expect(state().tabletDesign.heroOrder).toEqual(['visual','copy'])
  expect(state().tabletDesign.ctaFull).toBe(true)
  expect(state().tabletDesign.navCompact).toBe(true)
  expect(state().tabletDesign.heroLayout).toBe('split')
 })
})
