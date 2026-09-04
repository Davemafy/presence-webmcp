import {expect,test} from '@playwright/test'

declare global{interface Window{__presenceTools?:Record<string,{execute:(args:Record<string,unknown>)=>unknown}>}}

async function bootWithWebMcp(page:any){
 await page.addInitScript(()=>{
  Object.defineProperty(document,'modelContext',{configurable:true,value:{registerTool:(tool:any)=>{window.__presenceTools??={};window.__presenceTools[tool.name]=tool}}})
 })
 await page.goto('/?demo=1')
 await expect(page.getByText('WebMCP connected')).toBeVisible()
}
const call=async(page:any,name:string,args:Record<string,unknown>={})=>page.evaluate(([n,a])=>(window.__presenceTools as any)[n].execute(a),[name,args])

test('undeniable proof: real tools enforce scope, stale state, and human-only publication',async({page})=>{
 await bootWithWebMcp(page)
 const initial=await call(page,'inspect_proof') as any
 expect(initial.canonicalRevision).toBe(12)
 expect(initial.tabletOwnership).toBe('Unassigned')

 await call(page,'request_admission',{reason:'I can handle Tablet while you finish Mobile.'})
 await expect(page.getByText('Wants this seat.')).toBeVisible()
 await expect(page.getByText(/Cannot change Desktop\/Mobile or publish/)).toBeVisible()
 await page.getByRole('button',{name:/Admit Tablet/i}).click()

 for(const breakpoint of ['desktop','tablet','mobile']){
  const inspected=await call(page,'inspect_breakpoint',{breakpoint}) as any
  expect(inspected.ok).toBe(true)
  expect(inspected.breakpoint).toBe(breakpoint)
 }

 const base=(await call(page,'inspect_project') as any).revision
 const proposed=await call(page,'propose_component_move',{componentId:'visual',toIndex:0,expectedRevision:base}) as any
 expect(proposed.ok).toBe(true)
 expect(proposed.provisional).toBe(true)

 const beforeScope=await call(page,'inspect_proof') as any
 const denied=await call(page,'propose_component_change',{componentId:'hero',breakpoint:'mobile',patch:{heroGap:10},label:'Attack Mobile',expectedRevision:base}) as any
 expect(denied.error).toBe('SURFACE_NOT_ASSIGNED')
 expect(denied.beforeRevision).toBe(denied.afterRevision)
 expect(denied.beforeFingerprints.mobile).toBe(denied.afterFingerprints.mobile)
 const afterScope=await call(page,'inspect_proof') as any
 expect(afterScope.fingerprints.mobile).toBe(beforeScope.fingerprints.mobile)

 // Visible human action commits Mobile while the agent still carries `base`.
 await page.locator('.room-human .hero-part').first().click()
 await page.getByText('CTA width',{exact:true}).click()
 const afterHuman=await call(page,'inspect_proof') as any
 expect(afterHuman.canonicalRevision).toBeGreaterThan(base)
 const protectedMobile=afterHuman.fingerprints.mobile

 const stale=await call(page,'propose_responsive_rule',{componentId:'nav',breakpoint:'tablet',patch:{navCompact:true},label:'Stale nav',expectedRevision:base}) as any
 expect(stale.error).toBe('STALE_STATE')
 expect(stale.beforeFingerprints.tablet).toBe(stale.afterFingerprints.tablet)
 expect((await call(page,'inspect_proof') as any).fingerprints.mobile).toBe(protectedMobile)
 await expect(page.getByText(/Your Mobile edit is safe/i)).toBeVisible()

 const fresh=(await call(page,'inspect_project') as any).revision
 expect((await call(page,'propose_responsive_rule',{componentId:'nav',breakpoint:'tablet',patch:{navCompact:true},label:'Fresh nav',expectedRevision:fresh}) as any).ok).toBe(true)
 expect((await call(page,'submit_proposal') as any).ok).toBe(true)
 const publish=await call(page,'publish_proposal') as any
 expect(publish.error).toBe('HUMAN_APPROVAL_REQUIRED')
 const pending=await call(page,'inspect_proof') as any
 expect(pending.canonicalRevision).toBe(fresh)
 expect(pending.latestReceipt).toBeUndefined()

 await page.getByRole('button',{name:/Review/i}).click()
 await expect(page.getByRole('dialog')).toBeVisible()
 await expect(page.getByText('Mobile unchanged')).toBeVisible()
 await page.getByRole('button',{name:/Accept .*advance to r/i}).click()

 const final=await call(page,'inspect_proof') as any
 expect(final.acceptedProposals).toBe(1)
 expect(final.unauthorizedWritesApplied).toBe(0)
 expect(final.staleWritesApplied).toBe(0)
 expect(final.humanChangesLost).toBe(0)
 expect(final.latestReceipt.beforeFingerprints.mobile).toBe(final.latestReceipt.afterFingerprints.mobile)
 expect(final.latestReceipt.beforeFingerprints.desktop).toBe(final.latestReceipt.afterFingerprints.desktop)
 expect(final.latestReceipt.beforeFingerprints.tablet).not.toBe(final.latestReceipt.afterFingerprints.tablet)
})

test('responsive workspace supports direct resize, breakpoint crossing, and workspace undo',async({page})=>{
 await page.goto('/')
 const tablet=page.locator('.room-agent')
 await expect(tablet).toBeVisible()
 const before=Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width))
 const handle=tablet.locator('.resize-w')
 const box=await handle.boundingBox();expect(box).not.toBeNull()
 await page.mouse.move((box?.x??0)+4,(box?.y??0)+4)
 await page.mouse.down()
 await page.mouse.move((box?.x??0)+74,(box?.y??0)+4,{steps:14})
 await page.mouse.up()
 const resized=Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width))
 expect(resized).toBeLessThan(before)
 await expect(page.locator('.frame-caption').filter({hasText:/Tablet/})).toContainText('×')
 await page.getByRole('button',{name:/Undo/i}).first().click()
 await expect.poll(async()=>Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width))).toBeCloseTo(before,0)
})

test('Mobile hero reordering has a keyboard equivalent and changes the document model',async({page})=>{
 await bootWithWebMcp(page)
 const before=(await call(page,'inspect_proof') as any).canonicalRevision
 const first=page.locator('.room-human .hero-part').first()
 await first.focus()
 await first.press('Alt+ArrowDown')
 const after=(await call(page,'inspect_proof') as any).canonicalRevision
 expect(after).toBe(before+1)
})

test('spatial editor supports multi-select arrangement, exact dimensions, presets, and deterministic reset',async({page})=>{
 await page.goto('/?demo=1')
 const desktop=page.locator('.room-reference'),tablet=page.locator('.room-agent'),mobile=page.locator('.room-human')
 await expect(desktop).toBeVisible();await expect(tablet).toBeVisible();await expect(mobile).toBeVisible()
 // Exact width input is semantic viewport geometry, not CSS preview scaling.
 const widthInput=page.locator('.dimensions-tool input').first()
 await widthInput.fill('834');await widthInput.press('Enter')
 await expect.poll(async()=>Math.round(Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width)))).toBe(834)
 await expect(page.locator('.frame-caption').filter({hasText:/Tablet/})).toContainText('834')
 // Preset returns Tablet to a canonical responsive width.
 await page.getByRole('button',{name:'768',exact:true}).click()
 await expect.poll(async()=>Math.round(Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width)))).toBe(768)
 // Shift-click captions selects multiple independent devices; alignment command moves them as a group.
 const desktopCaption=desktop.locator('.frame-caption'),tabletCaption=tablet.locator('.frame-caption')
 await desktopCaption.click();await tabletCaption.click({modifiers:['Shift']})
 await expect(page.getByText('2 selected')).toBeVisible()
 await page.getByRole('button',{name:/Align top/i}).click()
 const dy=await desktop.evaluate((el:HTMLElement)=>getComputedStyle(el).getPropertyValue('--seat-y'))
 const ty=await tablet.evaluate((el:HTMLElement)=>getComputedStyle(el).getPropertyValue('--seat-y'))
 expect(Math.round(Number.parseFloat(dy))).toBe(Math.round(Number.parseFloat(ty)))
 // Reset is deterministic for workspace geometry as well as domain state.
 await page.getByRole('button',{name:/Reset Presence/i}).click()
 await expect.poll(async()=>Math.round(Number.parseFloat(await tablet.evaluate((el:HTMLElement)=>el.style.width)))).toBe(768)
 const proof=page.getByRole('button',{name:/Proof/i});await proof.click()
 await expect(page.getByText('Canonical revision').locator('..')).toContainText('r12')
})

test('proof drawer exposes machine evidence, tool schemas, audit, and acceptance receipt',async({page})=>{
 await bootWithWebMcp(page)
 await call(page,'request_admission',{reason:'Tablet proof'});await page.getByRole('button',{name:/Admit Tablet/i}).click()
 const revision=(await call(page,'inspect_project') as any).revision
 await call(page,'propose_layout_change',{componentId:'hero',breakpoint:'tablet',patch:{heroLayout:'split'},label:'Proof Tablet split',expectedRevision:revision})
 await call(page,'submit_proposal');await page.getByRole('button',{name:/Review/i}).click();await page.getByRole('button',{name:/Accept .*advance to r/i}).click()
 await page.getByRole('button',{name:/Proof/i}).click()
 await expect(page.getByText(/Live system/i)).toBeVisible()
 await expect(page.getByText(/deterministic seed · no simulated tool results/i)).toBeVisible()
 await page.getByRole('button',{name:'WebMCP',exact:true}).click()
 await expect(page.getByText('REGISTERED TOOLS')).toBeVisible();await expect(page.getByText('LIVE INVOCATIONS')).toBeVisible()
 await page.getByRole('button',{name:'Receipt',exact:true}).click()
 await expect(page.getByText(/Proposal .* accepted/i)).toBeVisible();await expect(page.getByText('Mobile preserved')).toBeVisible();await expect(page.getByText('Desktop preserved')).toBeVisible()
 await expect(page.getByRole('button',{name:'Copy JSON'})).toBeVisible();await expect(page.getByRole('button',{name:'Export JSON'})).toBeVisible()
})
