import {expect,test,Page} from '@playwright/test'

const viewports=[
 {name:'1440x900',width:1440,height:900},
 {name:'1280x800',width:1280,height:800},
 {name:'1024x768',width:1024,height:768},
]

async function boot(page:Page,width=1440,height=900){
 await page.setViewportSize({width,height})
 await page.goto('/?demo=1')
 await expect(page.locator('.editor-canvas.camera-ready')).toBeVisible()
 await page.waitForTimeout(340)
}
async function box(page:Page,id:'desktop'|'tablet'|'mobile'){
 const b=await page.locator(`[data-device-id="${id}"]`).boundingBox();expect(b).not.toBeNull();return b!
}
async function canvasBox(page:Page){const b=await page.locator('.editor-canvas').boundingBox();expect(b).not.toBeNull();return b!}
async function expectInside(page:Page,id:'desktop'|'tablet'|'mobile'){
 const c=await canvasBox(page),b=await box(page,id)
 expect(b.x).toBeGreaterThanOrEqual(c.x+8);expect(b.y).toBeGreaterThanOrEqual(c.y+8)
 expect(b.x+b.width).toBeLessThanOrEqual(c.x+c.width-8);expect(b.y+b.height).toBeLessThanOrEqual(c.y+c.height-8)
}
async function camera(page:Page){return page.locator('.room-world').evaluate((el:HTMLElement)=>getComputedStyle(el).transform)}

for(const vp of viewports){
 test(`initial arrangement is presentation-ready at ${vp.name}`,async({page})=>{
  await boot(page,vp.width,vp.height)
  await expectInside(page,'desktop');await expectInside(page,'tablet');await expectInside(page,'mobile')
  const tablet=await box(page,'tablet'),desktop=await box(page,'desktop'),mobile=await box(page,'mobile')
  expect(desktop.x+desktop.width).toBeLessThan(tablet.x)
  expect(tablet.x+tablet.width).toBeLessThan(mobile.x)
  await expect(page.locator('.room-agent .tablet-site')).toBeVisible()
  await page.screenshot({path:`artifacts/composition-initial-${vp.name}.png`,fullPage:true})
 })
}

test('Tablet selection is the canonical toolbar selection',async({page})=>{
 await boot(page);await page.locator('[data-device-id="tablet"] .frame-caption').click()
 await expect(page.locator('.dimensions-tool')).toContainText('Tablet')
 await expect(page.locator('.dimensions-tool input').first()).toHaveValue('768')
 await expect(page.locator('[data-device-id="tablet"]')).toHaveClass(/is-selected/)
 await page.screenshot({path:'artifacts/composition-tablet-selected.png',fullPage:true})
})

test('Mobile selection is the canonical toolbar selection',async({page})=>{
 await boot(page);await page.locator('[data-device-id="mobile"] .frame-caption').click()
 await expect(page.locator('.dimensions-tool')).toContainText('Mobile')
 await expect(page.locator('.dimensions-tool input').first()).toHaveValue('390')
})

test('Fit Selection centers and enlarges the exact Tablet',async({page})=>{
 await boot(page);await page.locator('[data-device-id="tablet"] .frame-caption').click()
 const before=await box(page,'tablet');await page.getByRole('button',{name:'Fit Selection'}).click();await page.waitForTimeout(340)
 const after=await box(page,'tablet'),c=await canvasBox(page)
 expect(after.width).toBeGreaterThan(before.width)
 expect(Math.abs((after.x+after.width/2)-(c.x+c.width/2))).toBeLessThan(6)
 expect(Math.abs((after.y+after.height/2)-(c.y+c.height/2))).toBeLessThan(20)
 await expect(page.locator('.dimensions-tool')).toContainText('Tablet')
 await page.screenshot({path:'artifacts/composition-tablet-fit-selection.png',fullPage:true})
})

test('Fit Selection centers Mobile and never focuses Tablet',async({page})=>{
 await boot(page);await page.locator('[data-device-id="mobile"] .frame-caption').click();await page.getByRole('button',{name:'Fit Selection'}).click();await page.waitForTimeout(340)
 const mobile=await box(page,'mobile'),c=await canvasBox(page)
 expect(Math.abs((mobile.x+mobile.width/2)-(c.x+c.width/2))).toBeLessThan(6)
 await expect(page.locator('.dimensions-tool')).toContainText('Mobile')
 await page.screenshot({path:'artifacts/composition-mobile-fit-selection.png',fullPage:true})
})

test('Fit All is idempotent and keeps every outer device visible',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Fit All'}).click();await page.waitForTimeout(340)
 await expectInside(page,'desktop');await expectInside(page,'tablet');await expectInside(page,'mobile');const first=await camera(page)
 await page.getByRole('button',{name:'Fit All'}).click();await page.waitForTimeout(340);expect(await camera(page)).toBe(first)
 await page.screenshot({path:'artifacts/composition-fit-all.png',fullPage:true})
})

test('Arrange Devices recovers an off-screen device',async({page})=>{
 await boot(page)
 await page.locator('[data-device-id="mobile"]').evaluate((el:HTMLElement)=>{el.style.setProperty('--seat-x','10px');el.style.setProperty('--seat-y','8500px')})
 await page.getByRole('button',{name:/Arrange devices/i}).click();await page.waitForTimeout(340);await expectInside(page,'mobile')
})

test('Proof drawer pushes the workspace and closing preserves camera',async({page})=>{
 await boot(page);const before=await camera(page)
 await page.getByRole('button',{name:'Proof',exact:true}).click();await expect(page.locator('.undeniable-proof-panel')).toBeVisible()
 const canvas=await canvasBox(page),drawer=await page.locator('.undeniable-proof-panel').boundingBox();expect(drawer).not.toBeNull();expect(canvas.x+canvas.width).toBeLessThanOrEqual(drawer!.x)
 await page.screenshot({path:'artifacts/composition-proof-drawer.png',fullPage:true})
 await page.locator('.undeniable-proof-panel .proof-head button').click();await expect(page.locator('.undeniable-proof-panel')).toBeHidden();expect(await camera(page)).toBe(before)
})

test('Run the Proof reserves space and does not obscure active devices',async({page})=>{
 await boot(page);await page.getByRole('button',{name:/Run the proof/i}).click();await expect(page.locator('.proof-runner')).toBeVisible();await page.waitForTimeout(340)
 const guide=await page.locator('.proof-runner').boundingBox();expect(guide).not.toBeNull();for(const id of ['desktop','tablet','mobile'] as const){const b=await box(page,id);expect(b.x+b.width).toBeLessThanOrEqual(guide!.x-6)}
 await page.screenshot({path:'artifacts/composition-run-proof.png',fullPage:true})
})

test('Tablet resize 768 → 820 preserves selection and camera',async({page})=>{
 await boot(page);await page.locator('[data-device-id="tablet"] .frame-caption').click();const before=await camera(page)
 const w=page.locator('.dimensions-tool input').first();await w.fill('820');await w.press('Enter')
 await expect(page.locator('.dimensions-tool')).toContainText('Tablet');await expect(w).toHaveValue('820');await expect(page.locator('[data-device-id="tablet"]')).toHaveClass(/is-selected/);expect(await camera(page)).toBe(before)
 await page.screenshot({path:'artifacts/composition-tablet-820.png',fullPage:true})
})

test('Undo restores previous Tablet dimension without recentering',async({page})=>{
 await boot(page);await page.locator('[data-device-id="tablet"] .frame-caption').click();const before=await camera(page);const w=page.locator('.dimensions-tool input').first();await w.fill('820');await w.press('Enter');await page.getByRole('button',{name:'Undo'}).click();await expect(w).toHaveValue('768');expect(await camera(page)).toBe(before)
})

test('window resize recalculates room composition without clipping',async({page})=>{
 await boot(page,1440,900);await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(500);await expectInside(page,'desktop');await expectInside(page,'tablet');await expectInside(page,'mobile');await page.screenshot({path:'artifacts/composition-window-resize-1024x768.png',fullPage:true})
})

test('vacant Tablet contains the real page under a restrained admission overlay',async({page})=>{
 await boot(page);await expect(page.locator('.room-agent .vacant-tablet-underlay .tablet-site')).toBeVisible();await expect(page.getByText('Tablet seat available')).toBeVisible();await expect(page.getByText('Agent changes require your approval.')).toBeVisible()
})

test('composition flow emits no relevant console errors or warnings',async({page})=>{
 const messages:string[]=[];page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')messages.push(msg.text())});page.on('pageerror',e=>messages.push(e.message));await boot(page);await page.getByRole('button',{name:'Fit All'}).click();await page.locator('[data-device-id="tablet"] .frame-caption').click();await page.getByRole('button',{name:'Fit Selection'}).click();await page.getByRole('button',{name:'Proof',exact:true}).click();await page.waitForTimeout(400);expect(messages.filter(m=>!/favicon|DevTools/i.test(m))).toEqual([])
})
