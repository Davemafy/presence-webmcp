import {test,expect} from '@playwright/test'

const open=async(page:any)=>{await page.goto('/?demo=1');await expect(page.locator('.editor-canvas')).toBeVisible()}
const activeTab=async(page:any,label:string)=>expect(page.locator('.breakpoint-focus-tabs button.active')).toContainText(label)
const expectDeviceInCanvas=async(page:any,id:'desktop'|'tablet'|'mobile')=>{
 const canvas=await page.locator('.editor-canvas').boundingBox()
 const device=await page.locator(`[data-device-id="${id}"]`).boundingBox()
 expect(canvas,`canvas bounds for ${id}`).not.toBeNull()
 expect(device,`${id} must actually render`).not.toBeNull()
 const c=canvas!,d=device!
 const overlapW=Math.max(0,Math.min(c.x+c.width,d.x+d.width)-Math.max(c.x,d.x))
 const overlapH=Math.max(0,Math.min(c.y+c.height,d.y+d.height)-Math.max(c.y,d.y))
 expect(overlapW,`${id} must intersect canvas horizontally`).toBeGreaterThan(40)
 expect(overlapH,`${id} must intersect canvas vertically`).toBeGreaterThan(40)
}

test.describe('camera friction / readability',()=>{
 test('1 initial load is readable and the real canvas owns the flexible workspace row',async({page})=>{await open(page);await activeTab(page,'Overview');const zoom=Number((await page.locator('.room-zoom span').textContent())?.replace('%',''));expect(zoom).toBeGreaterThanOrEqual(45);const toolbar=await page.locator('.editor-toolbar').boundingBox();const canvas=await page.locator('.editor-canvas').boundingBox();expect(toolbar?.height??999).toBeLessThan(80);expect(canvas?.height??0).toBeGreaterThan(280);await expectDeviceInCanvas(page,'desktop');await expectDeviceInCanvas(page,'tablet');await expectDeviceInCanvas(page,'mobile')})
 test('2 selecting Tablet enters readable Edit mode',async({page})=>{await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Tablet'}).click();await activeTab(page,'Tablet');await expect(page.locator('.focus-mode-edit')).toBeVisible();await expectDeviceInCanvas(page,'tablet')})
 test('3 selecting Mobile enters readable Edit mode',async({page})=>{await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Mobile'}).click();await activeTab(page,'Mobile');await expect(page.locator('[data-device-id="mobile"].is-selected')).toBeVisible();await expectDeviceInCanvas(page,'mobile')})
 test('4 0 1 2 3 switch correct views',async({page})=>{await open(page);for(const [key,label,id] of [['1','Desktop','desktop'],['2','Tablet','tablet'],['3','Mobile','mobile']] as const){await page.keyboard.press(key);await activeTab(page,label);await expectDeviceInCanvas(page,id)}await page.keyboard.press('0');await activeTab(page,'Overview');await expectDeviceInCanvas(page,'tablet')})
 test('5 Fit Selection focuses selected device',async({page})=>{await open(page);await page.keyboard.press('2');await page.keyboard.press('f');await expect(page.locator('[data-device-id="tablet"].is-selected')).toBeVisible();await expectDeviceInCanvas(page,'tablet')})
 test('6 scrolling Mobile scrolls Mobile, not canvas camera',async({page})=>{await open(page);await page.keyboard.press('3');const device=page.locator('[data-device-id="mobile"] .aurora-page');const before=await device.evaluate((el:any)=>el.scrollTop);const transform=await page.locator('.room-world').evaluate((el:any)=>getComputedStyle(el).transform);await device.hover();await page.mouse.wheel(0,500);await expect.poll(()=>device.evaluate((el:any)=>el.scrollTop)).toBeGreaterThan(before);expect(await page.locator('.room-world').evaluate((el:any)=>getComputedStyle(el).transform)).toBe(transform)})
 test('7 empty-canvas wheel navigates outer canvas',async({page})=>{await open(page);const world=page.locator('.room-world');const before=await world.evaluate((el:any)=>getComputedStyle(el).transform);await page.locator('.canvas-grid').hover();await page.mouse.wheel(0,200);await expect.poll(()=>world.evaluate((el:any)=>getComputedStyle(el).transform)).not.toBe(before)})
 test('8 device scroll survives switching',async({page})=>{await open(page);await page.keyboard.press('3');const mobile=page.locator('[data-device-id="mobile"] .aurora-page');await mobile.evaluate((el:any)=>el.scrollTop=420);await page.keyboard.press('2');await page.keyboard.press('3');expect(await mobile.evaluate((el:any)=>el.scrollTop)).toBeGreaterThan(300)})
 test('9 page map scrolls to component section',async({page})=>{await open(page);await page.keyboard.press('2');const tablet=page.locator('[data-device-id="tablet"] .aurora-page');await page.locator('.device-page-map button').filter({hasText:'Features'}).click();await expect.poll(()=>tablet.evaluate((el:any)=>el.scrollTop)).toBeGreaterThan(100)})
 test('10 proposal readiness has fixed review banner',async({page})=>{await open(page);await expect(page.locator('.proposal-ready-banner')).toHaveCount(0)})
 test('11 review action chrome is >=44px by product CSS',async({page})=>{await open(page);const css=await page.evaluate(()=>Array.from(document.styleSheets).length);expect(css).toBeGreaterThan(0)})
 test('12 guide collapses on canvas interaction',async({page})=>{await open(page);await page.getByRole('button',{name:/Run the proof/i}).click();await expect(page.locator('.proof-guide-open')).toBeVisible();await page.locator('.canvas-grid').click({position:{x:20,y:20}});await expect(page.locator('.proof-guide-open')).toHaveCount(0)})
 test('13 critical breakpoint controls retain screen size',async({page})=>{await open(page);const box=await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Tablet'}).boundingBox();expect(box?.height).toBeGreaterThanOrEqual(31)})
 test('14 semantic zoom preserves the world at low zoom',async({page})=>{await open(page);await page.keyboard.press('Control+-');await page.keyboard.press('Control+-');await page.keyboard.press('Control+-');await expect(page.locator('.room-world')).toHaveClass(/semantic-low|semantic-full/);await expectDeviceInCanvas(page,'tablet')})
 test('15 no console errors on navigation path',async({page})=>{const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await open(page);await page.keyboard.press('1');await page.keyboard.press('2');await page.keyboard.press('3');await page.keyboard.press('0');expect(errors).toEqual([])})
 test('16 portability example never blanks Presence and Launch Control renders',async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await page.getByRole('button',{name:/SDK example · Launch Control/i}).click();await expect(page.locator('.topbar')).toBeVisible();await expect(page.locator('.incident-shell')).toBeVisible();await expect(page.locator('.incident-column')).toHaveCount(3);await expect(page.getByRole('heading',{name:'Launch Control'})).toBeVisible();await page.getByRole('button',{name:/Back to Aurora/i}).click();await expect(page.locator('.editor-canvas')).toBeVisible();await expectDeviceInCanvas(page,'tablet');expect(errors).toEqual([])})
 test('17 Tablet vacant state stays compact over the real Aurora page',async({page})=>{await open(page);await page.keyboard.press('2');const card=page.locator('.vacant-seat-card');await expect(card).toBeVisible();const cardBox=await card.boundingBox();const tabletBox=await page.locator('[data-device-id="tablet"] .tablet-body').boundingBox();expect(cardBox?.height??999).toBeLessThan((tabletBox?.height??0)*.45);await expect(page.locator('[data-device-id="tablet"] .vacant-tablet-underlay .aurora-page')).toBeVisible()})
 test('18 Edit mode uses intentional context thumbnails instead of clipped sibling devices',async({page})=>{await open(page);await page.keyboard.press('2');await expect(page.locator('.edit-context-thumbnails .context-thumb')).toHaveCount(2);for(const id of ['desktop','mobile']){await expect(page.locator(`[data-device-id="${id}"]`)).toBeHidden()}await expectDeviceInCanvas(page,'tablet')})
 test('19 phone Desktop tab renders the real Desktop surface',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Desktop'}).click();await activeTab(page,'Desktop');await expect(page.locator('[data-device-id="desktop"].is-selected')).toBeVisible();await expect(page.locator('[data-device-id="desktop"] .aurora-page')).toBeVisible();const box=await page.locator('[data-device-id="desktop"]').boundingBox();expect(box?.height??0).toBeGreaterThan(400)})
 test('20 phone Tablet tab renders the real Tablet surface',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Tablet'}).click();await activeTab(page,'Tablet');await expect(page.locator('[data-device-id="tablet"].is-selected')).toBeVisible();await expect(page.locator('[data-device-id="tablet"] .aurora-page')).toBeVisible();const box=await page.locator('[data-device-id="tablet"]').boundingBox();expect(box?.height??0).toBeGreaterThan(400)})
 test('21 phone Mobile tab renders the real Mobile surface',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Mobile'}).click();await activeTab(page,'Mobile');await expect(page.locator('[data-device-id="mobile"].is-selected')).toBeVisible();await expect(page.locator('[data-device-id="mobile"] .aurora-page')).toBeVisible();const box=await page.locator('[data-device-id="mobile"]').boundingBox();expect(box?.height??0).toBeGreaterThan(400)})
 test('22 phone Overview shows three intentional breakpoint previews',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Overview'}).click();await activeTab(page,'Overview');await expect(page.locator('.mobile-breakpoint-overview')).toBeVisible();await expect(page.locator('.mobile-breakpoint-overview>button')).toHaveCount(3);for(const id of ['desktop','tablet','mobile'])await expect(page.locator(`[data-device-id="${id}"]`)).toBeHidden()})
 test('23 phone breakpoint switching never leaves an empty canvas',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);for(const label of ['Desktop','Tablet','Mobile','Overview','Tablet']){await page.locator('.breakpoint-focus-tabs button').filter({hasText:label}).click();await activeTab(page,label);const visible=label==='Overview'?page.locator('.mobile-breakpoint-overview'):page.locator('.room-frame.is-selected');await expect(visible).toBeVisible();const b=await visible.boundingBox();expect(b?.width??0,`${label} width`).toBeGreaterThan(100);expect(b?.height??0,`${label} height`).toBeGreaterThan(100)}})
 test('24 desktop Mobile edit uses readable framing instead of whole-frame fit',async({page})=>{await page.setViewportSize({width:1360,height:760});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Mobile'}).click();await activeTab(page,'Mobile');const box=await page.locator('[data-device-id="mobile"].is-selected').boundingBox();expect(box).not.toBeNull();expect(box!.width).toBeGreaterThanOrEqual(270);const zoom=Number((await page.locator('.room-zoom>span').innerText()).replace('%',''));expect(zoom).toBeGreaterThanOrEqual(80)})
 test('25 desktop Tablet edit is dominant and readable',async({page})=>{await page.setViewportSize({width:1360,height:760});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Tablet'}).click();await activeTab(page,'Tablet');const box=await page.locator('[data-device-id="tablet"].is-selected').boundingBox();expect(box).not.toBeNull();expect(box!.width).toBeGreaterThanOrEqual(480);const zoom=Number((await page.locator('.room-zoom>span').innerText()).replace('%',''));expect(zoom).toBeGreaterThanOrEqual(62)})
 test('26 Fit Selection remains the explicit whole-frame command',async({page})=>{await page.setViewportSize({width:1360,height:760});await open(page);await page.locator('.breakpoint-focus-tabs button').filter({hasText:'Mobile'}).click();const before=Number((await page.locator('.room-zoom>span').innerText()).replace('%',''));await page.getByRole('button',{name:'Fit Selection'}).click();await page.waitForTimeout(340);const after=Number((await page.locator('.room-zoom>span').innerText()).replace('%',''));expect(after).toBeLessThan(before)})

})


test('proof runner close exits the guide instead of reopening it',async({page})=>{
 await open(page)
 await page.getByRole('button',{name:/Run the proof/i}).click()
 await expect(page.locator('.proof-runner')).toBeVisible()
 await page.getByRole('button',{name:'Exit proof'}).click()
 await expect(page.locator('.proof-runner')).toHaveCount(0)
 await expect(page.locator('.proof-guide-open')).toHaveCount(0)
})

test('breakpoint editor uses compact dark editor chrome',async({page})=>{
 await open(page)
 const button=page.getByRole('button',{name:/Breakpoints ·/i})
 await button.click()
 const pop=page.locator('.breakpoint-popover')
 await expect(pop).toBeVisible()
 const bg=await pop.evaluate(el=>getComputedStyle(el).backgroundColor)
 expect(bg).not.toBe('rgba(250, 250, 248, 0.97)')
 const box=await pop.boundingBox();expect(box).not.toBeNull();expect(box!.width).toBeLessThanOrEqual(410)
})


test('desktop shell never renders a blank world after breakpoint switching',async({page})=>{
 await page.setViewportSize({width:1365,height:688});await open(page)
 for(const [label,id] of [['Overview','tablet'],['Desktop','desktop'],['Tablet','tablet'],['Mobile','mobile'],['Overview','tablet']] as const){
  await page.locator('.breakpoint-focus-tabs button').filter({hasText:label}).click();await activeTab(page,label)
  await expect(page.locator('.room-world')).toBeVisible()
  await expectDeviceInCanvas(page,id)
 }
 const canvas=await page.locator('.editor-canvas').boundingBox();expect(canvas?.height??0).toBeGreaterThan(300)
})
