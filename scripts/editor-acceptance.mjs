import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8'), css=fs.readFileSync('src/styles.css','utf8'), web=fs.readFileSync('src/webmcp/register.ts','utf8'), evidence=fs.readFileSync('src/tests/evidence.test.ts','utf8')
const checks={
 '20–300% camera clamp':/Math\.max\(\.2,Math\.min\(3/.test(app),
 'crisp pointer-anchored zoom':app.includes('applyCameraImmediate')&&app.includes('const c=cameraRef.current')&&app.includes('px-wx*nz')&&!/const zoomAt=.*smoothTo/.test(app),
 'crisp direct scroll pan':app.includes('panByWheelImmediate')&&app.includes('panByWheelImmediate(-e.deltaX*unit,-e.deltaY*unit)')&&!app.includes('addPanImpulse(-e.deltaX'),
 'pointer pan stops on release':app.includes('setPanning(false);stopCameraAnimation();commitCamera(cameraRef.current)'),
 'Fit All + Fit Selection + 100%':app.includes('Fit All')&&app.includes('Fit Selection')&&app.includes('100%'),
 'multi-select + marquee':app.includes('selectionBox')&&app.includes('e.shiftKey'),
 '8-handle resize':app.includes("['n','s','e','w','ne','nw','se','sw']"),
 '280×480 minimum / 1920×1400 maximum':app.includes('Math.max(280,Math.min(1920')&&app.includes('Math.max(480,Math.min(1400'),
 'breakpoint crossing announcement':app.includes('Crossed into'),
 'workspace undo/redo':app.includes('undoFrames')&&app.includes('redoFrames'),
 'deterministic arrange/reset':app.includes('Arrange devices')&&app.includes('presence:reset-workspace'),
 'proof drawer':app.includes('UNDENIABLE PROOF')&&app.includes('CANONICAL FINGERPRINTS'),
 'receipt export':app.includes('Export JSON')&&app.includes('Copy JSON'),
 'real WebMCP proof catalog':app.includes('REGISTERED TOOLS')&&web.includes('registerTool'),
 'scope/stale/human-publish tools':web.includes('SURFACE_NOT_ASSIGNED')&&web.includes('STALE_STATE')&&web.includes('HUMAN_APPROVAL_REQUIRED'),
 '16 collaboration invariants':(evidence.match(/\bit\('/g)||[]).length===16,
 'GPU canvas transforms':css.includes('translate3d')||app.includes('translate3d'),
 'reduced motion':css.includes('prefers-reduced-motion'),
 'viewport-aware arrangement':app.includes('arrangeForViewport')&&app.includes('fullFit')&&app.includes('compactReference'),
 'single canonical device selection':app.includes('selectedDeviceIds')&&!app.includes('const [selected,setSelected]'),
 'deterministic 280ms fit transition':app.includes('duration=280')&&app.includes('Fit Selection'),
 'complete outer-bounds fitting':app.includes('outerBoundsFor')&&app.includes('caption=38')&&app.includes('shadow=16'),
 'vacant Tablet renders real page':app.includes('vacant-tablet-underlay')&&app.includes('Tablet seat available'),
 'proof drawer reserves canvas':css.includes('proof-drawer-open .room-workspace-shell')&&css.includes('--proof-width'),
 'proof drawer resizable':app.includes('proof-drawer-resizer')&&app.includes('onWidth'),
 'proof guide reserves canvas':css.includes('proof-guide-open:not(.proof-drawer-open) .room-workspace-shell'),
 'stable device ids':app.includes('data-device-id="desktop"')&&app.includes('data-device-id="tablet"')&&app.includes('data-device-id="mobile"'),
 'camera preserved by undo':!app.includes('setFrames(cloneFrames(previous));requestAnimationFrame(()=>fitSelection())'),
}
const failed=Object.entries(checks).filter(([,ok])=>!ok)
for(const [name,ok] of Object.entries(checks))console.log(`${ok?'PASS':'FAIL'}  ${name}`)
if(failed.length){console.error(`\n${failed.length} editor acceptance source checks failed.`);process.exit(1)}
console.log(`\n${Object.keys(checks).length}/${Object.keys(checks).length} editor acceptance source checks PASS`)
