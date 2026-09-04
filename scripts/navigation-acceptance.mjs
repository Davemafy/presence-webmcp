import fs from 'node:fs'
const app=fs.readFileSync(new URL('../src/App.tsx', import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../src/styles.css', import.meta.url),'utf8')
const sdk=fs.readFileSync(new URL('../src/sdk/createPresence.ts', import.meta.url),'utf8')
const checks=[
 ['focus modes', app.includes("type FocusMode='overview'|'edit'|'review'") && css.includes('.focus-mode-edit')],
 ['initial overview framing', app.includes("setFocusMode('overview')") && app.includes('fitAll(true)')],
 ['readable Tablet edit mode', app.includes('const editScaleFor=') && app.includes("kind==='agent'?.64") && app.includes('screenWidthTarget')],
 ['persistent breakpoint tabs', app.includes('breakpoint-focus-tabs') && app.includes('<b>1</b> Desktop') && app.includes('<b>2</b> Tablet') && app.includes('<b>3</b> Mobile')],
 ['0 1 2 3 shortcuts', app.includes("e.key==='0'") && app.includes("focus('reference')") && app.includes("focus('agent')") && app.includes("focus('you')")],
 ['F and Shift F shortcuts', app.includes("e.key.toLowerCase()==='f'") && app.includes('e.shiftKey?fitAll():fitSelection()')],
 ['device wheel isolation', app.includes("target?.closest?.('.aurora-page')") && app.includes('deviceScroll.current[kind]=devicePage.scrollTop')],
 ['scroll position preservation', app.includes('deviceScroll.current') && app.includes('page.scrollTop=deviceScroll.current[kind]')],
 ['page section navigation', app.includes('scrollToSection') && app.includes('device-page-map') && app.includes('data-section="features"')],
 ['semantic low zoom', app.includes("scale<.52?'semantic-low':'semantic-full'") && css.includes('.semantic-low .aurora-page p')],
 ['screen-space editor chrome', css.includes('transform:scale(var(--inv-scale,1))') && css.includes('.room-frame .frame-caption span{font-size:12px!important}')],
 ['fixed proposal review banner', app.includes('proposal-ready-banner') && css.includes('.proposal-ready-banner button{height:44px')],
 ['review fixed decision controls', css.includes('.review-climax-actions{position:sticky') && app.includes('Request changes')],
 ['double click Fit All', app.includes("classList.contains('canvas-grid')") && app.includes('fitAll()')],
 ['optional overview minimap', app.includes('workspace-minimap') && css.includes('.workspace-minimap')],
 ['workspace grid reserves a real canvas row', css.includes('grid-template-rows:auto auto minmax(0,1fr)!important') && css.includes('.room-workspace-shell>.editor-canvas{grid-row:3')],
 ['incident external-store snapshot is stable', sdk.includes('snapshotCache') && sdk.includes('const snapshot=()=>snapshotCache')],
 ['edit mode hides clipped world siblings', css.includes('.editor-canvas.focus-edit .room-frame:not(.is-selected){opacity:0!important;visibility:hidden!important') && app.includes('edit-context-thumbnails')],
 ['device click always enters edit focus', app.includes('const wasClick=!d.moved') && app.includes("setFocusMode('edit');requestAnimationFrame(()=>focusCamera(clickedKind))")],
 ['vacant Tablet is a subtle real-page overlay', css.includes('.vacant-tablet-dim{background:rgba(8,10,14,.10)!important') && app.includes('vacant-seat-card') && !app.includes('key="empty" className="empty-seat" initial')],
 ['portability example is demoted', app.includes('sdk-example-trigger') && app.includes("'SDK example · Launch Control'") && !app.includes('>Incident Board</button>')],
 ['phone uses canonical breakpoint tabs', css.includes('.mobile-switcher{display:none!important}') && css.includes('.presence-room.room-camera.focus-edit .room-frame.is-selected{display:block!important')],
 ['phone hidden siblings do not reserve layout space', css.includes('.presence-room.room-camera.focus-edit .room-frame:not(.is-selected){display:none!important')],
 ['phone Overview has deliberate breakpoint previews', app.includes('mobile-breakpoint-overview') && app.includes('data-overview-device={kind}') && css.includes('.mobile-breakpoint-overview>button')],
 ['phone selected surface has guaranteed viewport height', css.includes('height:min(72dvh,680px)!important') && css.includes('min-height:540px!important')],
 ['proof guide has a true exit path', app.includes("<DemoDirector enabled={productApp==='aurora'&&guideOpen}") && app.includes('setGuideOpen(false);setProofSessionActive(false)') && app.includes('aria-label="Exit proof"')],
 ['breakpoint editor matches dark editor chrome', css.includes('background:rgba(12,14,18,.96)') && css.includes('justify-self:end;width:min(390px,calc(100% - 24px))') && !css.includes('background:rgba(250,250,248,.97)')],
 ['device selection is not whole-frame fit', app.includes('editScaleFor(kind,safe,b)') && app.includes('scaledH<=safe.h') && app.includes('safe.y+18-b.y*z')],
 ['Mobile edit has readable scale floor', app.includes("const floor=kind==='you'?.82") && app.includes("const ceiling=kind==='you'?1.05")],
 ['manual zoom is faster but direct', app.includes('deltaY*.0019') && app.includes('zoomAt(1.18)') && app.includes('zoomAt(.85)')],
 ['Linear-density workspace chrome', css.includes('v15.12 — Linear-density shell') && css.includes('.editor-toolbar{min-height:38px!important;height:38px!important') && css.includes('.breakpoint-focus-tabs{height:38px!important')],
 ['compact phone overview spacing', css.includes('.mobile-breakpoint-overview>button{min-height:112px!important') && css.includes('grid-template-columns:104px 1fr!important')],
 ['desktop shell has exactly topbar workspace statusbar rows', css.includes('v15.13 — desktop canvas visibility contract') && css.includes('.app-shell{grid-template-rows:48px minmax(0,1fr) 32px!important}')],
 ['blank-canvas fail-safe verifies real frame intersection', app.includes('frameVisibleInCanvas') && app.includes("verifyCameraVisibility('all')") && app.includes('verifyCameraVisibility(kind)')],
 ['desktop world cannot be hidden by camera-ready race', css.includes('.presence-room.room-camera .room-world{opacity:1!important;visibility:visible!important}')],
]
let passed=0
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)passed++}
console.log(`\n${passed}/${checks.length} camera/navigation acceptance source checks ${passed===checks.length?'PASS':'FAIL'}`)
if(passed!==checks.length)process.exit(1)
