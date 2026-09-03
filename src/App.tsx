import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import QRCode from 'qrcode'
import type {CSSProperties,MouseEvent,PointerEvent as ReactPointerEvent} from 'react'
import {useNavigate} from 'react-router-dom'
import {AnimatePresence,motion,Reorder} from 'framer-motion'
import {AlignCenter,AlignLeft,ArrowRight,Check,Command,GripVertical,Maximize2,Minimize2,Minus,MousePointer2,Pause,Play,Plus,Redo2,RotateCcw,ShieldCheck,Smartphone,Sparkles,Tablet as TabletIcon,Undo2,X,ZoomIn,ZoomOut} from 'lucide-react'
import {usePresenceStore} from './domain/store'
import type {HeroPart,ResponsiveDesign} from './domain/types'
import {registerWebMcp} from './webmcp/register'
import {connectDesktopSession,getOrCreateSessionId,hasCrossDeviceRelay} from './sessionSync'

const ease=[0.22,1,0.36,1] as const
type MobileView='tablet'|'mobile'

export default function App(){
 const s=usePresenceStore()
 const [webmcp,setWebmcp]=useState(false)
 const [mobileView,setMobileView]=useState<MobileView>('tablet')
 const [proofOpen,setProofOpen]=useState(false)
 const [pairOpen,setPairOpen]=useState(false)
 const [qr,setQr]=useState('')
 const sessionId=useMemo(()=>getOrCreateSessionId(),[])
 const demoMode=useMemo(()=>new URLSearchParams(location.search).get('demo')==='1',[])
 const admitted=s.admission?.status==='admitted'||s.admission?.status==='paused'
 useEffect(()=>{setWebmcp(registerWebMcp())},[])
 useEffect(()=>connectDesktopSession(sessionId),[sessionId])
 useEffect(()=>{if(!pairOpen)return;const url=`${location.origin}/remote/${sessionId}`;QRCode.toDataURL(url,{margin:1,width:220}).then(setQr)},[pairOpen,sessionId])
 return <main className="app-shell">
  <header className="topbar"><div className="brand"><div className="brand-mark"><Sparkles size={14}/></div><span>Presence</span><span className="muted slash">/</span><span className="project-name">Aurora</span></div><div className="top-actions"><span className="revision">r{s.revision}</span><span className="connection"><i className={webmcp?'online':''}/>{webmcp?'WebMCP connected':'Local product mode'}</span><button className="ghost authority-trigger top-authority" onClick={()=>setProofOpen(v=>!v)}><ShieldCheck size={12}/> Authority</button><button className="icon-btn workspace-reset" title="Reset Presence" aria-label="Reset Presence" onClick={()=>{s.reset();window.dispatchEvent(new CustomEvent('presence:reset-workspace'))}}><RotateCcw size={13}/></button></div></header>
  <section className="stage-head"><div><p className="eyebrow">RESPONSIVE STUDIO</p><h1>Your product has seats now.</h1><p className="lede">Keep Mobile. Let your browser agent take Tablet — with only the access you approve.</p></div><div className="stage-note">Shared project · live state</div></section>
  <div className="mobile-switcher" role="tablist" aria-label="Workspace surface"><button role="tab" aria-selected={mobileView==='tablet'} className={mobileView==='tablet'?'active':''} onClick={()=>setMobileView('tablet')}><TabletIcon size={13}/>Tablet</button><button role="tab" aria-selected={mobileView==='mobile'} className={mobileView==='mobile'?'active':''} onClick={()=>setMobileView('mobile')}><Smartphone size={13}/>Mobile</button></div>
  <SpatialWorkspace mobileView={mobileView} demoMode={demoMode} webmcp={webmcp}/><BoundaryToast/>
  <AnimatePresence>{s.reviewOpen&&s.proposal?.status==='ready'&&<ReviewOverlay/>}</AnimatePresence>
  <DemoDirector enabled={demoMode}/>
  <CanonicalMoment enabled={demoMode}/>

  <footer className="statusbar"><div className="footer-actions">{(!webmcp||demoMode)&&<span className="demo-badge">LOCAL FALLBACK</span>}</div></footer>
  <AnimatePresence>{proofOpen&&<ProofPanel close={()=>setProofOpen(false)}/>}</AnimatePresence>

 </main>
}

function SpatialWorkspace({mobileView,demoMode,webmcp}:{mobileView:MobileView;demoMode:boolean;webmcp:boolean}){
 const s=usePresenceStore()
 const viewport=useRef<HTMLDivElement>(null)
 const worldNode=useRef<HTMLDivElement>(null)
 const frameNodes=useRef<Record<'reference'|'agent'|'you',HTMLDivElement|null>>({reference:null,agent:null,you:null})
 const topologyNodes=useRef<Record<'reference'|'agent'|'you',SVGLineElement|null>>({reference:null,agent:null,you:null})
 const [scale,setScale]=useState(.72)
 const [offset,setOffset]=useState({x:0,y:0})
 const [cameraReady,setCameraReady]=useState(false)
 const [panning,setPanning]=useState(false)
 const [fullscreen,setFullscreen]=useState(false)
 const [focused,setFocused]=useState<'room'|'manual'|'reference'|'agent'|'you'>('room')
 const [regrouping,setRegrouping]=useState(false)
 type FrameKind='reference'|'agent'|'you'
 type FrameRect={x:number;y:number;w:number;h:number}
 type DragState={kind:FrameKind;pointerId:number;startWorldX:number;startWorldY:number;frameX:number;frameY:number;moved:boolean;lastClientX:number;lastClientY:number}
 const WORLD_W=12000,WORLD_H=8000
 const HUB={x:6010,y:2570}
 // One rigid physical scale for every device. Focus only moves the camera; object geometry never changes.
 const canonicalFrames:Record<FrameKind,FrameRect>={
  reference:{x:5260,y:2760,w:600,h:380},
  agent:{x:5970,y:2720,w:384,h:450},
  you:{x:6425,y:2765,w:195,h:422},
 }
 const [frames,setFramesState]=useState<Record<FrameKind,FrameRect>>(canonicalFrames)
 const framesRef=useRef<Record<FrameKind,FrameRect>>(canonicalFrames)
 const setFrames=(next:Record<FrameKind,FrameRect>|((prev:Record<FrameKind,FrameRect>)=>Record<FrameKind,FrameRect>))=>{
  const value=typeof next==='function'?(next as (prev:Record<FrameKind,FrameRect>)=>Record<FrameKind,FrameRect>)(framesRef.current):next
  framesRef.current=value;setFramesState(value)
 }
 const [draggingSeat,setDraggingSeat]=useState<FrameKind|null>(null)
 const [layoutMode,setLayoutMode]=useState<'grouped'|'free'>('grouped')
 const cameraRef=useRef({scale:.72,x:0,y:0})
 const targetRef=useRef({scale:.72,x:0,y:0})
 const cameraVelocity=useRef({scale:0,x:0,y:0})
 const cameraMode=useRef<'idle'|'target'|'coast'>('idle')
 const rafRef=useRef<number|undefined>(undefined)
 const pan=useRef({x:0,y:0,ox:0,oy:0,pointerId:-1,lastX:0,lastY:0,lastT:0,vx:0,vy:0})
 const deviceDrag=useRef<DragState|null>(null)
 const autoPanRaf=useRef<number|undefined>(undefined)
 const suppressCaptionClick=useRef(false)
 const spaceHeld=useRef(false)
 const focusedRef=useRef(focused)
 useEffect(()=>{focusedRef.current=focused},[focused])
 const admitted=s.admission?.status==='admitted'||s.admission?.status==='paused'
 const pending=s.admission?.status==='discovered'||s.admission?.status==='pending'
 const stale=s.agentPhase==='catching-up'||s.stale
 const proposalLive=Boolean(s.proposal&&['working','ready'].includes(s.proposal.status))
 const blockedMobile=s.blockedAttempt?.surface==='mobile'&&(s.blockedAttempt.error==='SURFACE_NOT_ASSIGNED'||s.blockedAttempt.error==='CAPABILITY_NOT_GRANTED')
 const revokedBlocked=s.blockedAttempt?.error==='ADMISSION_REVOKED'
 const lastActivity=s.activity[s.activity.length-1]
 const activityActor=lastActivity?.actor||'system'
 const clampScale=(v:number)=>Math.max(.46,Math.min(1.16,v))
 const center=(f:FrameRect)=>({x:f.x+f.w/2,y:f.y+f.h/2})
 const applyCamera=(n:{scale:number,x:number,y:number},syncReact=true)=>{
  cameraRef.current=n
  if(worldNode.current)worldNode.current.style.transform=`translate3d(${n.x}px,${n.y}px,0) scale(${n.scale})`
  if(worldNode.current)worldNode.current.style.setProperty('--inv-scale',String(1/n.scale))
  if(syncReact){setScale(n.scale);setOffset({x:n.x,y:n.y})}
 }
 const commit=(n:{scale:number,x:number,y:number})=>{targetRef.current=n;applyCamera(n,true)}
 const stopCameraAnimation=()=>{if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=undefined};cameraMode.current='idle';targetRef.current=cameraRef.current;cameraVelocity.current={scale:0,x:0,y:0}}
 const ensureCameraLoop=()=>{
  if(rafRef.current||deviceDrag.current)return
  let last=performance.now()
  const tick=(now:number)=>{
   const dt=Math.min(.028,Math.max(.001,(now-last)/1000));last=now
   const c=cameraRef.current,v=cameraVelocity.current
   if(cameraMode.current==='target'){
    const t=targetRef.current
    // Reference-matched glide: quick pickup, brief carry, precise arrival.
    const omega=7.15,zeta=.90
    const step=(value:number,target:number,velocity:number)=>{const a=omega*omega*(target-value)-2*zeta*omega*velocity;const nv=velocity+a*dt;return [value+nv*dt,nv] as const}
    const [x,vx]=step(c.x,t.x,v.x),[y,vy]=step(c.y,t.y,v.y),[z,vz]=step(c.scale,t.scale,v.scale)
    cameraVelocity.current={x:vx,y:vy,scale:vz};applyCamera({scale:z,x,y},false)
    const error=Math.abs(x-t.x)+Math.abs(y-t.y)+Math.abs(z-t.scale)*300
    const speed=Math.abs(vx)+Math.abs(vy)+Math.abs(vz)*300
    if(error<.12&&speed<.16){cameraVelocity.current={scale:0,x:0,y:0};cameraMode.current='idle';applyCamera(t,false);setScale(t.scale);setOffset({x:t.x,y:t.y});rafRef.current=undefined;return}
   }else if(cameraMode.current==='coast'){
    // Reference-matched momentum: short, sweet coast rather than floaty drift.
    const drag=Math.exp(-8.35*dt)
    const vx=v.x*drag,vy=v.y*drag,vz=v.scale*Math.exp(-9.4*dt)
    cameraVelocity.current={x:vx,y:vy,scale:vz}
    const next={scale:clampScale(c.scale+vz*dt),x:c.x+vx*dt,y:c.y+vy*dt}
    applyCamera(next,false)
    if(Math.abs(vx)+Math.abs(vy)+Math.abs(vz)*300<1.45){cameraVelocity.current={scale:0,x:0,y:0};cameraMode.current='idle';commit(next);rafRef.current=undefined;return}
   }else{rafRef.current=undefined;return}
   rafRef.current=requestAnimationFrame(tick)
  }
  rafRef.current=requestAnimationFrame(tick)
 }
 const smoothTo=(n:{scale:number,x:number,y:number})=>{if(deviceDrag.current)return;targetRef.current=n;cameraMode.current='target';ensureCameraLoop()}
 const addPanImpulse=(dx:number,dy:number)=>{
  if(deviceDrag.current)return
  const v=cameraVelocity.current
  const cap=(n:number)=>Math.max(-1450,Math.min(1450,n))
  cameraVelocity.current={scale:v.scale,x:cap(v.x+dx),y:cap(v.y+dy)}
  targetRef.current=cameraRef.current;cameraMode.current='coast';ensureCameraLoop()
 }
 const getBounds=(source:Record<FrameKind,FrameRect>=framesRef.current,includeHub=true)=>{const boxes=Object.values(source);let minX=Math.min(...boxes.map(f=>f.x)),minY=Math.min(...boxes.map(f=>f.y-42)),maxX=Math.max(...boxes.map(f=>f.x+f.w)),maxY=Math.max(...boxes.map(f=>f.y+f.h));if(includeHub){minX=Math.min(minX,HUB.x-145);maxX=Math.max(maxX,HUB.x+145);minY=Math.min(minY,HUB.y-26);maxY=Math.max(maxY,HUB.y+46)}return{x:minX,y:minY,w:maxX-minX,h:maxY-minY}}
 const safeViewport=()=>{const el=viewport.current;if(!el)return null;return{x:34,y:30,w:Math.max(100,el.clientWidth-68),h:Math.max(100,el.clientHeight-84)}}
 const roomCamera=(source:Record<FrameKind,FrameRect>=framesRef.current)=>{const safe=safeViewport();if(!safe)return null;const b=getBounds(source,true);const z=clampScale(Math.min(.94,safe.w/b.w,safe.h/b.h));return{scale:z,x:safe.x+(safe.w-b.w*z)/2-b.x*z,y:safe.y+(safe.h-b.h*z)/2-b.y*z}}
 const fit=(source:Record<FrameKind,FrameRect>=framesRef.current,immediate=false)=>{if(deviceDrag.current)return;const next=roomCamera(source);if(!next)return;if(immediate)commit(next);else smoothTo(next);setCameraReady(true);setFocused('room')}
 const focus=(kind:FrameKind,immediate=false)=>{if(deviceDrag.current)return;const safe=safeViewport();if(!safe)return;const primary=framesRef.current[kind],pc=center(primary);const maxZoom=kind==='reference'?.88:kind==='agent'?.98:1.06;const padX=kind==='reference'?116:kind==='agent'?104:92,padY=kind==='reference'?96:86;const z=clampScale(Math.min(maxZoom,safe.w/(primary.w+padX*2),safe.h/(primary.h+padY*2)));const next={scale:z,x:safe.x+safe.w/2-pc.x*z,y:safe.y+safe.h/2-pc.y*z};if(immediate){stopCameraAnimation();commit(next)}else smoothTo(next);setFocused(kind)}
 const zoomAt=(factor:number,cx?:number,cy?:number)=>{if(deviceDrag.current)return;const el=viewport.current;if(!el)return;const rect=el.getBoundingClientRect(),c=targetRef.current,px=cx===undefined?el.clientWidth/2:cx-rect.left,py=cy===undefined?el.clientHeight/2:cy-rect.top,nz=clampScale(c.scale*factor);if(Math.abs(nz-c.scale)<.001)return;const wx=(px-c.x)/c.scale,wy=(py-c.y)/c.scale;smoothTo({scale:nz,x:px-wx*nz,y:py-wy*nz});setFocused('manual')}
 const toggleFullscreen=async()=>{const el=viewport.current;if(!el)return;try{if(!document.fullscreenElement)await el.requestFullscreen();else await document.exitFullscreen()}catch{}}
 const resetLayout=()=>{
  stopCameraAnimation();if(autoPanRaf.current){cancelAnimationFrame(autoPanRaf.current);autoPanRaf.current=undefined}
  deviceDrag.current=null;setDraggingSeat(null);setPanning(false);setLayoutMode('grouped');setRegrouping(true);setFocused('room')
  // Let the regrouping class reach the DOM before changing seat transforms.
  // Otherwise the seats jump to home before the transition exists.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   ;(['reference','agent','you'] as FrameKind[]).forEach(kind=>applyFrameDirect(kind,canonicalFrames[kind]))
   const next=roomCamera(canonicalFrames);if(next)smoothTo(next)
  }))
  window.setTimeout(()=>{setFrames(canonicalFrames);setRegrouping(false)},980)
 }
 const disband=()=>{setLayoutMode('free');setFocused('room');fit()}
 const regroup=()=>resetLayout()
 useLayoutEffect(()=>{setFrames(canonicalFrames);fit(canonicalFrames,true)},[])
 useEffect(()=>{const reset=()=>resetLayout();const restore=(e:PageTransitionEvent)=>{if(e.persisted)resetLayout()};const focusSeat=(e:Event)=>{const detail=(e as CustomEvent<{seat?:FrameKind|'room'}>).detail;if(!detail?.seat)return;if(detail.seat==='room')fit();else focus(detail.seat)};window.addEventListener('presence:reset-workspace',reset as EventListener);window.addEventListener('presence:focus-seat',focusSeat as EventListener);window.addEventListener('pageshow',restore);return()=>{window.removeEventListener('presence:reset-workspace',reset as EventListener);window.removeEventListener('presence:focus-seat',focusSeat as EventListener);window.removeEventListener('pageshow',restore)}},[])
 useEffect(()=>{const ro=new ResizeObserver(()=>{if(deviceDrag.current)return;requestAnimationFrame(()=>{if(focusedRef.current==='room')fit();else if(focusedRef.current!=='manual')focus(focusedRef.current as FrameKind)})});if(viewport.current)ro.observe(viewport.current);const fs=()=>{setFullscreen(Boolean(document.fullscreenElement));if(deviceDrag.current)return;requestAnimationFrame(()=>{if(focusedRef.current==='room')fit();else if(focusedRef.current!=='manual')focus(focusedRef.current as FrameKind)})};document.addEventListener('fullscreenchange',fs);const el=viewport.current;const wheel=(e:WheelEvent)=>{if(deviceDrag.current)return;e.preventDefault();if(e.ctrlKey||e.metaKey){zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);return}const unit=e.deltaMode===1?18:e.deltaMode===2?el?.clientHeight||600:1;addPanImpulse(-e.deltaX*unit*5.4,-e.deltaY*unit*5.4);setFocused('manual')};el?.addEventListener('wheel',wheel,{passive:false});return()=>{ro.disconnect();document.removeEventListener('fullscreenchange',fs);el?.removeEventListener('wheel',wheel);stopCameraAnimation();if(autoPanRaf.current)cancelAnimationFrame(autoPanRaf.current)}},[])
 useEffect(()=>{const kd=(e:KeyboardEvent)=>{if(e.code==='Space'){spaceHeld.current=true;if(document.activeElement===document.body)e.preventDefault()}if((e.target as HTMLElement)?.matches?.('input,textarea,[contenteditable=true]'))return;if(e.key==='0'){e.preventDefault();fit()}if(e.key==='1'){e.preventDefault();focus('reference')}if(e.key==='2'){e.preventDefault();focus('agent')}if(e.key==='3'){e.preventDefault();focus('you')}if(e.key.toLowerCase()==='f'){e.preventDefault();void toggleFullscreen()}if(e.key.toLowerCase()==='r'&&!e.metaKey&&!e.ctrlKey){e.preventDefault();resetLayout()}if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.08)}if(e.key==='-'){e.preventDefault();zoomAt(.92)}};const ku=(e:KeyboardEvent)=>{if(e.code==='Space')spaceHeld.current=false};window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}},[])
 const down=(e:ReactPointerEvent)=>{if(deviceDrag.current)return;if(window.matchMedia('(pointer:coarse)').matches)return;const target=e.target as HTMLElement;const interactive=target.closest('button,a,.editable-target,.human-inspector,.seat-controls,.request-card,.start-agent,.review-pill,.spatial-review,.frame-caption');if(e.button!==1&&!(e.button===0&&(spaceHeld.current||!interactive)))return;e.preventDefault();stopCameraAnimation();setPanning(true);setFocused('manual');const now=performance.now();pan.current={x:e.clientX,y:e.clientY,ox:cameraRef.current.x,oy:cameraRef.current.y,pointerId:e.pointerId,lastX:e.clientX,lastY:e.clientY,lastT:now,vx:0,vy:0};(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}
 const move=(e:ReactPointerEvent)=>{if(!panning||pan.current.pointerId!==e.pointerId)return;e.preventDefault();const now=performance.now(),dt=Math.max(8,now-pan.current.lastT)/1000,dx=e.clientX-pan.current.lastX,dy=e.clientY-pan.current.lastY;pan.current.vx=pan.current.vx*.52+(dx/dt)*.48;pan.current.vy=pan.current.vy*.52+(dy/dt)*.48;pan.current.lastX=e.clientX;pan.current.lastY=e.clientY;pan.current.lastT=now;applyCamera({scale:cameraRef.current.scale,x:pan.current.ox+e.clientX-pan.current.x,y:pan.current.oy+e.clientY-pan.current.y},false)}
 const up=(e:ReactPointerEvent)=>{if(panning&&pan.current.pointerId===e.pointerId){setPanning(false);cameraVelocity.current={scale:0,x:Math.max(-1050,Math.min(1050,pan.current.vx*.58)),y:Math.max(-1050,Math.min(1050,pan.current.vy*.58))};cameraMode.current='coast';targetRef.current=cameraRef.current;ensureCameraLoop()}if((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId))(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)}
 const pointerWorld=(clientX:number,clientY:number)=>{const el=viewport.current;if(!el)return{x:0,y:0};const rect=el.getBoundingClientRect(),c=cameraRef.current;return{x:(clientX-rect.left-c.x)/c.scale,y:(clientY-rect.top-c.y)/c.scale}}
 const syncTopology=(source:Record<FrameKind,FrameRect>)=>{(['reference','agent','you'] as FrameKind[]).forEach(k=>{const line=topologyNodes.current[k];if(!line)return;const c=center(source[k]);line.setAttribute('x2',String(c.x));line.setAttribute('y2',String(c.y))})}
 const applyFrameDirect=(kind:FrameKind,next:FrameRect)=>{const node=frameNodes.current[kind];if(node){node.style.setProperty('--seat-x',`${next.x}px`);node.style.setProperty('--seat-y',`${next.y}px`)}const updated={...framesRef.current,[kind]:next};framesRef.current=updated;syncTopology(updated)}
 const updateDraggedSeat=(clientX:number,clientY:number)=>{const d=deviceDrag.current;if(!d)return;const w=pointerWorld(clientX,clientY),dx=w.x-d.startWorldX,dy=w.y-d.startWorldY;if(Math.abs(dx)+Math.abs(dy)>2)d.moved=true;const current=framesRef.current[d.kind];let x=d.frameX+dx,y=d.frameY+dy;if(layoutMode==='grouped'){const pad=34;x=Math.max(pad,Math.min(WORLD_W-current.w-pad,x));y=Math.max(90,Math.min(WORLD_H-current.h-pad,y))}applyFrameDirect(d.kind,{...current,x,y})}
 const autoPanVelocity=(clientX:number,clientY:number)=>{const d=deviceDrag.current,el=viewport.current;if(!d||!el)return{x:0,y:0};const r=el.getBoundingClientRect(),c=cameraRef.current,f=framesRef.current[d.kind],cx=(f.x+f.w/2)*c.scale+c.x+r.left,cy=(f.y+f.h/2)*c.scale+c.y+r.top;const innerL=r.left+r.width*.20,innerR=r.right-r.width*.20,innerT=r.top+r.height*.18,innerB=r.bottom-r.height*.18;const pointerEdge=84,max=10;let x=0,y=0;if(cx<innerL)x=Math.min(max,(innerL-cx)*.042);else if(cx>innerR)x=-Math.min(max,(cx-innerR)*.042);if(cy<innerT)y=Math.min(max,(innerT-cy)*.042);else if(cy>innerB)y=-Math.min(max,(cy-innerB)*.042);if(clientX<r.left+pointerEdge)x=Math.max(x,max*(1-(clientX-r.left)/pointerEdge));else if(clientX>r.right-pointerEdge)x=Math.min(x,-max*(1-(r.right-clientX)/pointerEdge));if(clientY<r.top+pointerEdge)y=Math.max(y,max*(1-(clientY-r.top)/pointerEdge));else if(clientY>r.bottom-pointerEdge)y=Math.min(y,-max*(1-(r.bottom-clientY)/pointerEdge));return{x,y}}
 const runAutoPan=()=>{if(autoPanRaf.current)cancelAnimationFrame(autoPanRaf.current);const tick=()=>{const d=deviceDrag.current;if(!d){autoPanRaf.current=undefined;return}const v=autoPanVelocity(d.lastClientX,d.lastClientY);if(v.x||v.y){const c=cameraRef.current;applyCamera({scale:c.scale,x:c.x+v.x,y:c.y+v.y},false);updateDraggedSeat(d.lastClientX,d.lastClientY)}autoPanRaf.current=requestAnimationFrame(tick)};autoPanRaf.current=requestAnimationFrame(tick)}
 const beginDeviceDrag=(kind:FrameKind)=>(e:ReactPointerEvent<HTMLButtonElement>)=>{if(e.button!==0)return;if(window.matchMedia('(pointer:coarse)').matches)return;e.preventDefault();e.stopPropagation();stopCameraAnimation();const f=framesRef.current[kind],w=pointerWorld(e.clientX,e.clientY);deviceDrag.current={kind,pointerId:e.pointerId,startWorldX:w.x,startWorldY:w.y,frameX:f.x,frameY:f.y,moved:false,lastClientX:e.clientX,lastClientY:e.clientY};setDraggingSeat(kind);setFocused('manual');e.currentTarget.setPointerCapture(e.pointerId);runAutoPan()}
 const moveDevice=(e:ReactPointerEvent<HTMLButtonElement>)=>{const d=deviceDrag.current;if(!d||d.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();d.lastClientX=e.clientX;d.lastClientY=e.clientY;updateDraggedSeat(e.clientX,e.clientY)}
 const endDeviceDrag=(e:ReactPointerEvent<HTMLButtonElement>)=>{const d=deviceDrag.current;if(!d||d.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();if(autoPanRaf.current){cancelAnimationFrame(autoPanRaf.current);autoPanRaf.current=undefined}suppressCaptionClick.current=d.moved;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);let committed={...framesRef.current};if(d.moved&&layoutMode==='grouped'){const f=committed[d.kind],home=canonicalFrames[d.kind];const snapX=Math.abs(f.x-home.x)<54?home.x:f.x,snapY=Math.abs(f.y-home.y)<54?home.y:f.y;committed={...committed,[d.kind]:{...f,x:snapX,y:snapY}};applyFrameDirect(d.kind,committed[d.kind])}setFrames(committed);commit(cameraRef.current);deviceDrag.current=null;setDraggingSeat(null)}
 const clickCaption=(kind:FrameKind)=>()=>{if(suppressCaptionClick.current){suppressCaptionClick.current=false;return}focus(kind)}
 useEffect(()=>{if(deviceDrag.current)return;if(pending&&focusedRef.current!=='manual')requestAnimationFrame(()=>focus('agent'))},[pending])
 useEffect(()=>{if(deviceDrag.current)return;const a=s.blockedAttempt;if(!a||focusedRef.current==='manual')return;if(a.error==='SURFACE_NOT_ASSIGNED'||a.error==='CAPABILITY_NOT_GRANTED')requestAnimationFrame(()=>focus('you'));else if(a.error==='ADMISSION_REVOKED'||a.error==='STALE_STATE')requestAnimationFrame(()=>focus('agent'))},[s.blockedAttempt?.nonce])
 useEffect(()=>{if(deviceDrag.current)return;if(s.reviewOpen)requestAnimationFrame(()=>focus('agent'))},[s.reviewOpen])
 const hub=HUB
 const rc=center(frames.reference),ac=center(frames.agent),yc=center(frames.you)
 const zFor=(kind:FrameKind)=>draggingSeat===kind?12:5
 return <section className={`workspace room-workspace mobile-view-${mobileView} layout-${layoutMode} ${regrouping?'is-regrouping':''}`}>
  <div ref={viewport} className={`presence-room room-camera ${cameraReady?'camera-ready':''} ${panning?'is-panning':''} ${draggingSeat?'is-seat-dragging':''} ${admitted?'has-agent':''} ${pending?'agent-arriving':''} ${stale?'is-stale':''} ${proposalLive?'has-proposal':''} focus-${focused}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDoubleClick={e=>{const t=e.target as HTMLElement;if(t.closest('.room-agent'))focus('agent');else if(t.closest('.room-human'))focus('you');else if(t.closest('.room-reference'))focus('reference');else fit()}}>
   <div className="room-grid"/>
   <div ref={worldNode} className="room-world" style={{width:WORLD_W,height:WORLD_H,transform:`translate3d(${offset.x}px,${offset.y}px,0) scale(${scale})`,'--inv-scale':1/scale,'--hub-x':`${HUB.x}px`,'--hub-y':`${HUB.y}px`} as CSSProperties}>
    <motion.header key={`hub-${s.revision}`} className={`room-project-hub revision-actor-${activityActor}`} style={{left:hub.x,top:hub.y}} aria-label={`Aurora shared project revision ${s.revision}`} initial={{filter:'brightness(1.35)'}} animate={{filter:'brightness(1)'}} transition={{duration:.72,ease}}><span>AURORA</span><b>SHARED PROJECT</b><motion.code key={s.revision} initial={{scale:1.22,opacity:.65}} animate={{scale:1,opacity:1}} transition={{duration:.48,ease}}>r{s.revision}</motion.code><i className="project-live-dot"/></motion.header>
    <svg className="room-topology-svg" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} aria-hidden="true"><line ref={n=>{topologyNodes.current.reference=n}} x1={hub.x} y1={hub.y+28} x2={rc.x} y2={rc.y}/><line ref={n=>{topologyNodes.current.agent=n}} className={`agent-link ${stale?'blocked':''}`} x1={hub.x} y1={hub.y+28} x2={ac.x} y2={ac.y}/><line ref={n=>{topologyNodes.current.you=n}} className="human-link" x1={hub.x} y1={hub.y+28} x2={yc.x} y2={yc.y}/></svg>
    <CausalActivity frames={frames} hub={hub} revision={s.revision} actor={activityActor} phase={s.agentPhase}/>
    {stale&&<motion.div className="stale-junction" style={{left:(hub.x+ac.x)/2-56,top:(hub.y+ac.y)/2-18}} initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}><b>×</b><span>STALE STATE</span><small>r{s.agentWork.baseRevision} → r{s.revision}</small></motion.div>}
    <AuthorityChoreography frames={frames} roomWidth={WORLD_W} hub={hub}/>
    <div ref={n=>{frameNodes.current.reference=n}} className="room-frame room-reference" style={{'--seat-x':`${frames.reference.x}px`,'--seat-y':`${frames.reference.y}px`,width:frames.reference.w,height:frames.reference.h,zIndex:zFor('reference')} as CSSProperties}><FrameCaption title="Desktop" state="REFERENCE" onFocus={clickCaption('reference')} onPointerDown={beginDeviceDrag('reference')} onPointerMove={moveDevice} onPointerUp={endDeviceDrag}/><Canvas kind="desktop" label="REFERENCE" /></div>
    <div ref={n=>{frameNodes.current.agent=n}} className={`room-frame room-agent ${admitted?'territory-agent':''} ${pending?'seat-requested':''}`} style={{'--seat-x':`${frames.agent.x}px`,'--seat-y':`${frames.agent.y}px`,width:frames.agent.w,height:frames.agent.h,zIndex:zFor('agent')} as CSSProperties}><FrameCaption title="Tablet" state={admitted?'YOUR AGENT':'AGENT SEAT'} onFocus={clickCaption('agent')} onPointerDown={beginDeviceDrag('agent')} onPointerMove={moveDevice} onPointerUp={endDeviceDrag}/><TabletSeat demoMode={demoMode} webmcp={webmcp}/>{pending&&<motion.div className="arrival-thread" initial={{opacity:0,scaleX:.2}} animate={{opacity:1,scaleX:1}} transition={{duration:.55,ease}}><span>YOUR BROWSER AGENT</span></motion.div>}</div>
    <div ref={n=>{frameNodes.current.you=n}} className="room-frame room-human territory-human" style={{'--seat-x':`${frames.you.x}px`,'--seat-y':`${frames.you.y}px`,width:frames.you.w,height:frames.you.h,zIndex:zFor('you')} as CSSProperties}><FrameCaption title="Mobile" state="YOU" onFocus={clickCaption('you')} onPointerDown={beginDeviceDrag('you')} onPointerMove={moveDevice} onPointerUp={endDeviceDrag}/><Canvas kind="mobile" label="YOU" human/></div>
    <AnimatePresence>{blockedMobile&&s.blockedAttempt&&<motion.div key={s.blockedAttempt.nonce} className="authority-boundary-impact" style={{left:frames.you.x-216,top:frames.you.y+Math.min(170,frames.you.h*.34)}} initial={{opacity:0,scale:.92,y:-5}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96}}><ShieldCheck size={14}/><div><b>BLOCKED · YOUR TERRITORY</b><span>Agent authority ends before Mobile</span></div><code>{s.blockedAttempt.error}</code></motion.div>}</AnimatePresence>
    <AnimatePresence>{revokedBlocked&&s.blockedAttempt&&<motion.div key={s.blockedAttempt.nonce} className="entry-denied" style={{left:frames.agent.x+frames.agent.w+18,top:frames.agent.y+frames.agent.h*.46}} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}}><b>ENTRY DENIED</b><span>Admission revoked</span><code>ADMISSION_REVOKED</code></motion.div>}</AnimatePresence>
   </div>
   <FloatingHumanInspector/>
   {layoutMode==='free'&&<div className="free-layout-indicator"><span/>FREE LAYOUT</div>}
   <div className="room-camera-targets" aria-label="Focus workspace territory"><button className={focused==='room'?'active':''} onClick={()=>fit()}>Room</button><i/><button className={focused==='reference'?'active':''} onClick={()=>focus('reference')}>Reference</button><button className={focused==='agent'?'active':''} onClick={()=>focus('agent')}>Agent</button><button className={focused==='you'?'active':''} onClick={()=>focus('you')}>You</button><i/><button className={`layout-mode-toggle ${layoutMode==='free'?'is-free':''}`} onClick={layoutMode==='grouped'?disband:regroup} title={layoutMode==='grouped'?'Release the three seats into free layout':'Return all seats to the authored room'}>{layoutMode==='grouped'?'Disband':'Regroup'}</button><button className="reset-layout-button" onClick={resetLayout} title="Restore the authored room and grouped layout">Reset layout</button></div>
   <div className="room-zoom"><button onClick={()=>zoomAt(.92)} aria-label="Zoom out"><ZoomOut size={12}/></button><span>{Math.round(scale*100)}%</span><button onClick={()=>zoomAt(1.08)} aria-label="Zoom in"><ZoomIn size={12}/></button><i/><button onClick={()=>void toggleFullscreen()}>{fullscreen?<Minimize2 size={12}/>:<Maximize2 size={12}/>}<span>{fullscreen?'Exit':'Full'}</span></button></div>
  </div>
 </section>
}
function CausalActivity({frames,hub,revision,actor,phase}:{frames:Record<'reference'|'agent'|'you',{x:number;y:number;w:number;h:number}>;hub:{x:number;y:number};revision:number;actor:string;phase:string}){
 const source=actor==='human'?frames.you:actor==='agent'?frames.agent:null
 const activeAgent=['inspecting','working','catching-up','ready'].includes(phase)
 if(!source&&!activeAgent)return null
 const from=source?{x:source.x+source.w/2,y:source.y+source.h/2}:null
 return <div className="causal-activity" aria-hidden="true">
  {from&&<motion.i key={`${revision}-${actor}`} className={`state-packet packet-${actor}`} initial={{x:from.x-4,y:from.y-4,opacity:0,scale:.7}} animate={{x:[from.x-4,(from.x+hub.x)/2-4,hub.x-4],y:[from.y-4,(from.y+hub.y)/2-4,hub.y+18],opacity:[0,.9,0],scale:[.7,1,.72]}} transition={{duration:.72,ease}}/>}
  {activeAgent&&<motion.span className="agent-live-signal" style={{left:frames.agent.x+frames.agent.w-10,top:frames.agent.y+12}} animate={{opacity:[.22,.72,.22],scale:[.9,1.08,.9]}} transition={{duration:2.4,repeat:Infinity,ease:'easeInOut'}}/>}
 </div>
}

function AuthorityChoreography({frames,roomWidth,hub}:{frames:Record<'reference'|'agent'|'you',{x:number;y:number;w:number;h:number}>;roomWidth:number;hub:{x:number;y:number}}){
 const attempt=usePresenceStore(state=>state.blockedAttempt)
 if(!attempt)return null
 const scope=(attempt.error==='SURFACE_NOT_ASSIGNED'||attempt.error==='CAPABILITY_NOT_GRANTED')&&attempt.surface==='mobile'
 const stale=attempt.error==='STALE_STATE'
 const revoked=attempt.error==='ADMISSION_REVOKED'
 if(!scope&&!stale&&!revoked)return null
 const label=(attempt.label||'PROPOSE CHANGE').replace(/Tablet|Mobile/gi,'').trim().toUpperCase()
 const agent={x:frames.agent.x+frames.agent.w/2,y:frames.agent.y+frames.agent.h/2}
 const human={x:frames.you.x+frames.you.w/2,y:frames.you.y+frames.you.h/2}
 const dx=human.x-agent.x,dy=human.y-agent.y,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len
 const hit={x:human.x-ux*(Math.min(frames.you.w,frames.you.h)*.46),y:human.y-uy*(Math.min(frames.you.w,frames.you.h)*.46)}
 const staleEnd={x:hub.x-74,y:hub.y+24}
 const revokedStart={x:Math.min(roomWidth+40,frames.agent.x+frames.agent.w+170),y:frames.agent.y+frames.agent.h*.5}
 const revokedEnd={x:frames.agent.x+frames.agent.w+10,y:frames.agent.y+frames.agent.h*.5}
 return <AnimatePresence mode="wait">
  <motion.div key={attempt.nonce} className={`authority-flight ${scope?'flight-scope':stale?'flight-stale':'flight-revoked'}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
   {scope&&<><motion.div className="operation-token" initial={{x:agent.x-72,y:agent.y-20,opacity:0,scale:.86}} animate={{x:[agent.x-72,(agent.x+hit.x)/2-72,hit.x-72],y:[agent.y-20,(agent.y+hit.y)/2-20,hit.y-20],opacity:[0,1,1],scale:[.86,1,1]}} transition={{duration:.78,ease}}><span>AGENT OPERATION</span><b>{label}</b><code>→ MOBILE</code></motion.div><motion.i className="impact-line human-impact" style={{left:hit.x,top:hit.y-28}} initial={{scaleY:0,opacity:0}} animate={{scaleY:[0,1,1],opacity:[0,1,.8]}} transition={{delay:.58,duration:.28}}/><motion.div className="impact-copy" style={{left:hit.x+18,top:hit.y-18}} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:.66,duration:.3}}><strong>ACCESS ENDS HERE</strong><span>Mobile belongs to you</span><code>{attempt.error}</code></motion.div></>}
   {stale&&<><motion.div className="operation-token stale-token" initial={{x:agent.x-72,y:agent.y-20,opacity:0}} animate={{x:[agent.x-72,(agent.x+staleEnd.x)/2-72,staleEnd.x],y:[agent.y-20,(agent.y+staleEnd.y)/2-20,staleEnd.y],opacity:[0,1,1]}} transition={{duration:.72,ease}}><span>AGENT OPERATION</span><b>EXPECTED r{attempt.expectedRevision}</b><code>{attempt.componentId?.toUpperCase()||'TABLET'}</code></motion.div><motion.div className="revision-collision" style={{left:hub.x-78,top:hub.y+56}} initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:[.8,1.08,1]}} transition={{delay:.58,duration:.4,ease}}><b>r{attempt.expectedRevision}</b><i>×</i><b>r{attempt.atRevision}</b><span>OVERWRITE PREVENTED</span></motion.div></>}
   {revoked&&<><motion.div className="operation-token revoked-token" initial={{x:revokedStart.x,y:revokedStart.y-20,opacity:0}} animate={{x:[revokedStart.x,(revokedStart.x+revokedEnd.x)/2,revokedEnd.x],y:[revokedStart.y-20,revokedEnd.y-20,revokedEnd.y-20],opacity:[0,1,1]}} transition={{duration:.62,ease}}><span>AGENT OPERATION</span><b>TABLET</b><code>NO ADMISSION</code></motion.div><motion.i className="impact-line entry-impact" style={{left:revokedEnd.x,top:revokedEnd.y-30}} initial={{scaleY:0,opacity:0}} animate={{scaleY:1,opacity:1}} transition={{delay:.48,duration:.22}}/></>}
  </motion.div>
 </AnimatePresence>
}

function FrameCaption({title,state,onFocus,onPointerDown,onPointerMove,onPointerUp}:{title:string;state:string;onFocus:()=>void;onPointerDown:(e:ReactPointerEvent<HTMLButtonElement>)=>void;onPointerMove:(e:ReactPointerEvent<HTMLButtonElement>)=>void;onPointerUp:(e:ReactPointerEvent<HTMLButtonElement>)=>void}){return <button className="frame-caption" onClick={onFocus} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} title="Drag to move this seat · click to focus"><GripVertical size={10}/><span>{title}</span><b>{state}</b></button>}

function PairRemote({sessionId,qr,close}:{sessionId:string;qr:string;close:()=>void}){
 const navigate=useNavigate()
 const remotePath=`/remote/${sessionId.toLowerCase()}`
 const remoteUrl=`${location.origin}${remotePath}`
 const [copied,setCopied]=useState(false)
 const useThisDevice=()=>{close();navigate(remotePath)}
 const copyLink=async()=>{try{await navigator.clipboard.writeText(remoteUrl);setCopied(true);setTimeout(()=>setCopied(false),1400)}catch{}}
 return <motion.div className="pair-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.section className="pair-sheet" initial={{opacity:0,y:18,scale:.985}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12}}><div className="pair-head"><div><p className="eyebrow">PHONE AUTHORITY</p><h2>Control this session from your phone.</h2></div><button className="icon-btn" onClick={close}><X size={15}/></button></div><p className="pair-copy">Scan to approve agents, review proposals, pause work, or revoke access without giving the phone an agent runtime.</p><div className="pair-body"><div className="qr-wrap">{qr?<img src={qr} alt="QR code to open Presence authority remote"/>:<span>Preparing QR…</span>}</div><div className="pair-meta"><span>SESSION</span><b>{sessionId.toUpperCase()}</b><small>{hasCrossDeviceRelay()?'Cross-device relay connected':'Same-device pairing is ready. Add the realtime relay for a separate physical phone.'}</small><button className="primary pair-use-device" onClick={useThisDevice}>Use this device as authority <ArrowRight size={12}/></button><div className="pair-links"><button onClick={copyLink}>{copied?'Copied':'Copy link'}</button><a href={remoteUrl} target="_blank" rel="noreferrer">Open in new tab <ArrowRight size={12}/></a></div></div></div><footer>Your software stays in control.</footer></motion.section></motion.div>
}

function Canvas({kind,label,human=false}:{kind:'desktop'|'mobile';label:string;human?:boolean}){
 return <article className={`surface ${kind}`}><div className="surface-meta"><span>{kind==='desktop'?'DESKTOP · 1200':'MOBILE · 375'}</span><b className={human?'human-label':''}>{label}</b></div>{human?<MobileEditor/>:<StaticSite/>}</article>
}

function StaticSite(){return <div className="site-frame">
 <div className="site-nav"><b>AURORA</b><span>Product&nbsp;&nbsp; Solutions&nbsp;&nbsp; Pricing</span><button>Start free</button></div>
 <div className="site-hero"><div className="copy"><small>A CALMER WAY TO BUILD</small><h2>Your product team, finally in the same orbit.</h2><p>Aurora keeps ideas, decisions and momentum together so your team can ship with less drag.</p><div><button className="dark">Start building</button><button className="light">See how</button></div></div><ProductVisual/></div>
 <div className="logos">NORTHSTAR&nbsp;&nbsp; WAVELINE&nbsp;&nbsp; TIDE&nbsp;&nbsp; FOUNDRY</div><div className="cards"><i/><i/><i/></div>
 </div>}

function ProductVisual(){return <div className="visual"><div className="visual-inner"><i/><i/><i/></div></div>}

function MobileEditor(){
 const s=usePresenceStore();const d=s.mobileDesign
 const [draftOrder,setDraftOrder]=useState<HeroPart[]>(d.heroOrder)
 useEffect(()=>setDraftOrder(d.heroOrder),[d.heroOrder])
 const selected=s.selectedMobile
 const choose=(id:string)=>(e:MouseEvent)=>{e.stopPropagation();s.selectMobile(id)}
 const commitOrder=()=>s.humanReorderHero(draftOrder)
 return <div className="site-frame mobile-editor" onClick={()=>s.selectMobile(null)}>
  <div className={`site-nav editable-target ${selected==='nav'?'selected':''}`} onClick={choose('nav')}><b>AURORA</b><span>Product&nbsp;&nbsp; Solutions</span><button>Start free</button>{selected==='nav'&&<YouTag/>}</div>
  <Reorder.Group as="div" axis="y" values={draftOrder} onReorder={setDraftOrder} className={`site-hero mobile-live align-${d.alignment} layout-${d.heroLayout}`} style={{gap:d.heroGap,padding:d.heroPadding}}>
   {draftOrder.map(part=><Reorder.Item as="div" value={part} key={part} className={`hero-part editable-target ${selected===part?'selected':''}`} dragElastic={0.08} onDragStart={()=>s.selectMobile(part)} onDragEnd={commitOrder} onClick={choose(part)}>
    <button className="drag-handle" aria-label={`Drag ${part}`} onClick={e=>e.stopPropagation()}><GripVertical size={13}/></button>
    {part==='copy'?<div className="copy" style={{textAlign:d.alignment}}><small>A CALMER WAY TO BUILD</small><h2 className={`editable-inline ${selected==='headline'?'selected-inline':''}`} onClick={choose('headline')} style={{fontSize:`calc(1em * ${d.titleScale})`}}>Your product team, finally in the same orbit.{selected==='headline'&&<YouTag/>}</h2><p>Aurora keeps ideas, decisions and momentum together so your team can ship with less drag.</p><div className={d.ctaFull?'cta-row full':''}><button className={`dark editable-inline ${selected==='cta'?'selected-inline':''}`} onClick={choose('cta')}>Start building{selected==='cta'&&<YouTag/>}</button><button className="light">See how</button></div></div>:<ProductVisual/>}
    {selected===part&&<YouTag/>}
   </Reorder.Item>)}
  </Reorder.Group>
  <div className={`logos editable-target ${selected==='logos'?'selected':''}`} onClick={choose('logos')}>NORTHSTAR&nbsp;&nbsp; WAVELINE&nbsp;&nbsp; TIDE&nbsp;&nbsp; FOUNDRY{selected==='logos'&&<YouTag/>}</div>
  <div className={`cards editable-target ${selected==='features'?'selected':''}`} onClick={choose('features')}><i/><i/><i/>{selected==='features'&&<YouTag/>}</div>
 </div>
}

function YouTag(){return <span className="you-tag"><svg width="11" height="13" viewBox="0 0 18 22"><path d="M2 1.5L16 12.5L9.3 13.2L6.1 20.1L2 1.5Z"/></svg>YOU</span>}

function FloatingHumanInspector(){
 const s=usePresenceStore();if(!s.selectedMobile)return null
 return <div className="human-inspector-floating"><HumanInspector design={s.mobileDesign}/></div>
}

function HumanInspector({design}:{design:ResponsiveDesign}){
 const s=usePresenceStore();if(!s.selectedMobile)return null
 const edit=(patch:Partial<ResponsiveDesign>,label:string)=>s.humanEdit(s.selectedMobile??'hero',patch,label)
 return <motion.div className="human-inspector" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.18}} onClick={e=>e.stopPropagation()}>
  <div className="inspector-head"><span><i/>YOU · {s.selectedMobile.toUpperCase()}</span><div><button disabled={!s.humanPast.length} onClick={s.undo} aria-label="Undo"><Undo2 size={12}/></button><button disabled={!s.humanFuture.length} onClick={s.redo} aria-label="Redo"><Redo2 size={12}/></button><button onClick={()=>s.selectMobile(null)} aria-label="Close editor"><X size={12}/></button></div></div>
  <div className="control-grid">
   <label><span>LAYOUT</span><div className="segmented text-segment"><button className={design.heroLayout==='stack'?'active':''} onClick={()=>edit({heroLayout:'stack'},'You stacked the Mobile hero.')}>Stack</button><button className={design.heroLayout==='split'?'active':''} onClick={()=>edit({heroLayout:'split'},'You split the Mobile hero.')}>Split</button></div></label>
   <label><span>ALIGN</span><div className="segmented"><button className={design.alignment==='left'?'active':''} onClick={()=>edit({alignment:'left'},'You aligned Mobile content left.')}><AlignLeft size={12}/></button><button className={design.alignment==='center'?'active':''} onClick={()=>edit({alignment:'center'},'You centered Mobile content.')}><AlignCenter size={12}/></button></div></label>
   <label><span>SPACING</span><div className="stepper"><button onClick={()=>edit({heroGap:design.heroGap-4},'You tightened Mobile element spacing.')}><Minus size={11}/></button><b>{design.heroGap}</b><button onClick={()=>edit({heroGap:design.heroGap+4},'You opened Mobile element spacing.')}><Plus size={11}/></button></div></label>
   <label><span>PADDING</span><div className="stepper"><button onClick={()=>edit({heroPadding:design.heroPadding-4},'You reduced Mobile hero padding.')}><Minus size={11}/></button><b>{design.heroPadding}</b><button onClick={()=>edit({heroPadding:design.heroPadding+4},'You increased Mobile hero padding.')}><Plus size={11}/></button></div></label>
   <label><span>TYPE</span><div className="stepper"><button onClick={()=>edit({titleScale:design.titleScale-.06},'You reduced Mobile headline scale.')}><Minus size={11}/></button><b>{Math.round(design.titleScale*100)}%</b><button onClick={()=>edit({titleScale:design.titleScale+.06},'You increased Mobile headline scale.')}><Plus size={11}/></button></div></label>
  </div>
  <button className={`toggle-row ${design.ctaFull?'on':''}`} onClick={()=>edit({ctaFull:!design.ctaFull},design.ctaFull?'You returned the Mobile CTA to auto width.':'You made the Mobile CTA full width.')}><span>CTA width</span><b>{design.ctaFull?'FULL':'AUTO'}</b></button>
  <p className="drag-tip"><GripVertical size={11}/> Drag the hero copy or media directly to reorder it.</p>
 </motion.div>
}

function TabletSeat({demoMode,webmcp}:{demoMode:boolean;webmcp:boolean}){
 const s=usePresenceStore();const a=s.admission
 const assigned=a?.status==='admitted'||a?.status==='paused';const active=s.proposal&&['working','ready'].includes(s.proposal.status);const phase=s.agentPhase
 const fallback=!webmcp||demoMode;const request=()=>s.requestAdmission('I can handle Tablet while you finish Mobile.')
 return <motion.article layout className={`surface tablet ${!assigned?'vacant':''} ${s.stale?'interrupted':''}`} transition={{duration:.65,ease}}>
  <div className="surface-meta"><span>TABLET · 768</span><motion.b layout className={assigned?'agent-label':''}>{assigned?'YOUR AGENT':'UNASSIGNED'}</motion.b></div>
  <div className="tablet-body"><AnimatePresence mode="wait" initial={false}>
   {!a&&<motion.div key="empty" className="empty-seat" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:.98}}><div className="seat-glyph"><span/><span/><span/></div><p>Waiting for a collaborator</p><small>Your browser agent can ask for this seat.<br/>Nothing changes until you approve.</small>{fallback&&<button className="seat-cta" onClick={request}>Preview admission flow <ArrowRight size={13}/></button>}<em>{fallback?'Local fallback · same application API':'Your browser agent can request this seat through WebMCP.'}</em></motion.div>}
   {a?.status==='discovered'&&<motion.div key="discovered" className="discovered-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.4,ease}}><span className="discovery-pulse"/><p className="request-kicker">BROWSER AGENT</p><h3>Looking for a role.</h3><p className="request-reason">Presence exposed one scoped seat: Responsive collaborator on Tablet.</p><div className="discovery-rule"><span>NO ACCESS YET</span><b>Tablet stays unassigned</b></div></motion.div>}
   {a?.status==='pending'&&<motion.div key="request" className="request-card" initial={{opacity:0,y:16,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:.985}} transition={{duration:.45,ease}}><div className="request-icon"><ShieldCheck size={18}/></div><p className="request-kicker">YOUR BROWSER AGENT</p><h3>Wants this seat.</h3><p className="role-line">Responsive collaborator · Tablet</p><p className="request-reason">“{a.reason}”</p><div className="permission-lines"><span><Check/>Inspect project and all surfaces</span><span><Check/>Propose changes on Tablet</span><span className="blocked"><X/>Cannot change Desktop or Mobile</span><span className="blocked"><X/>Cannot publish</span></div><div className="request-actions"><button className="secondary" onClick={s.denyAdmission}>Not now</button><button className="primary" onClick={s.approveAdmission}>Admit <ArrowRight size={13}/></button></div></motion.div>}
   {assigned&&<motion.div key="live" className="live-tablet" initial={{opacity:0,scale:.985}} animate={{opacity:1,scale:1}} transition={{duration:.8,ease}}><TabletSite active={!!active} focusTarget={s.agentWork.target}/><AgentPresence/><div className="seat-controls"><span>{a.status==='paused'?'Paused':'Responsive collaborator'}</span><div>{a.status==='paused'?<button onClick={s.resume}><Play size={12}/>Resume</button>:<button onClick={s.pause}><Pause size={12}/>Pause</button>}<button onClick={s.revoke}><X size={12}/>Remove agent</button></div></div>{a.status==='admitted'&&!active&&phase==='present'&&fallback&&<button className="start-agent" onClick={s.runAgentDemo}>Start agent work <ArrowRight size={13}/></button>}{phase==='ready'&&s.proposal&&!s.reviewOpen&&<button type="button" className="review-pill review-ready" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();s.openReview()}} aria-haspopup="dialog" aria-controls="presence-human-review"><span>{s.proposal.operations.length} changes ready</span>Review <ArrowRight size={13}/></button>}</motion.div>}
   {a?.status==='revoked'&&<motion.div key="revoked" className="empty-seat revoked-seat" initial={{opacity:0}} animate={{opacity:1}}><div className="seat-glyph"><span/><span/><span/></div><p>Seat is empty again.</p><small>Tablet stayed canonical. The removed agent has no authority here.</small>{fallback&&<button className="seat-cta proof-revoke" onClick={s.testRevokedAccess}>Prove access is gone <ArrowRight size={13}/></button>}<AnimatePresence>{s.blockedAttempt&&<motion.div className="blocked-proof" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><b>Blocked</b><span>{s.blockedAttempt.message}</span><code>ADMISSION_REVOKED</code></motion.div>}</AnimatePresence></motion.div>}
  </AnimatePresence></div>
 </motion.article>
}

function TabletSite({active,focusTarget=null}:{active:boolean;focusTarget?:string|null}){
 const s=usePresenceStore();let d=s.tabletDesign
 if(active&&s.proposal)d=s.proposal.operations.reduce((next,op)=>previewPatch(next,op.patch),d)
 const proposedTargets=new Set(active&&s.proposal?s.proposal.operations.map(op=>op.componentId):[])
 const cls=(id:string)=>`${proposedTargets.has(id)?'provisional-target ':''}${focusTarget===id?'agent-focus':''}`
 return <div className={`tablet-site ${active?'has-proposal':''}`}>
  <div className={`site-nav ${d.navCompact?'compact-nav':''} ${cls('nav')}`}><b>AURORA</b><span>{d.navCompact?'Menu':'Product  Solutions'}</span><button>Start free</button></div>
  <div className={`tablet-hero align-${d.alignment} layout-${d.heroLayout} ${cls('hero')}`} style={{gap:d.heroGap,padding:d.heroPadding}}>{d.heroOrder.map(part=>part==='copy'?<motion.div layout key="copy" className={`copy ${cls('copy')}`} transition={{duration:.45,ease}}><small>A CALMER WAY TO BUILD</small><h2 style={{fontSize:`calc(1em * ${d.titleScale})`}}>Your product team, finally in the same orbit.</h2><p>Aurora keeps ideas, decisions and momentum together.</p><button className={`dark ${d.ctaFull?'full-cta':''} ${cls('cta')}`}>Start building</button></motion.div>:<motion.div layout key="visual" className={cls('media')} transition={{duration:.45,ease}}><ProductVisual/></motion.div>)}</div>
  <div className={`cards ${cls('features')}`}><i/><i/><i/></div>
 </div>
}

function previewPatch(design:ResponsiveDesign,patch:Record<string,unknown>):ResponsiveDesign{
 const next={...design,heroOrder:[...design.heroOrder]}
 if(Array.isArray(patch.heroOrder)&&patch.heroOrder.every(v=>v==='copy'||v==='visual'))next.heroOrder=[...patch.heroOrder] as HeroPart[]
 if(patch.heroLayout==='stack'||patch.heroLayout==='split')next.heroLayout=patch.heroLayout
 if(patch.alignment==='left'||patch.alignment==='center')next.alignment=patch.alignment
 if(typeof patch.heroGap==='number')next.heroGap=patch.heroGap
 if(typeof patch.heroPadding==='number')next.heroPadding=patch.heroPadding
 if(typeof patch.ctaFull==='boolean')next.ctaFull=patch.ctaFull
 if(typeof patch.titleScale==='number')next.titleScale=patch.titleScale
 if(typeof patch.navCompact==='boolean')next.navCompact=patch.navCompact
 return next
}

function AgentPresence(){
 const s=usePresenceStore();const phase=s.agentPhase;const target=s.agentWork.target
 const positions:Record<string,{x:number;y:number}>={nav:{x:172,y:42},hero:{x:128,y:154},copy:{x:110,y:176},media:{x:235,y:186},cta:{x:150,y:280},features:{x:220,y:366}}
 const pos=positions[target??'hero']??positions.hero
 const title=phase==='catching-up'?'Project changed':phase==='ready'?'Proposal ready':s.agentWork.label||'Your agent'
 return <><motion.div className={`agent-cursor phase-${phase}`} initial={{opacity:0,x:282,y:18,scale:.75}} animate={{opacity:1,x:pos.x,y:pos.y,scale:1}} transition={{duration:.6,ease}}><svg width="18" height="22" viewBox="0 0 18 22"><path d="M2 1.5L16 12.5L9.3 13.2L6.1 20.1L2 1.5Z"/></svg><motion.span layout>{title}</motion.span></motion.div><AnimatePresence>{phase==='catching-up'&&<motion.div className="catchup-card" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><b>Project changed</b><span>Your agent was working from r{s.agentWork.baseRevision}. Current state is r{s.agentWork.currentRevision}.</span><strong>Catching up…</strong></motion.div>}{phase==='inspecting'&&s.agentWork.detail&&<motion.div className="agent-detail" initial={{opacity:0}} animate={{opacity:1}}>{s.agentWork.detail}</motion.div>}</AnimatePresence></>
}

const beforeAfter=(op:{patch:Record<string,unknown>})=>{
 const entries=Object.entries(op.patch)
 return entries.map(([key,value])=>{
  if(key==='heroLayout')return `Hero layout · Stack → ${String(value)==='split'?'Split':'Stack'}`
  if(key==='navCompact')return `Navigation · Full → ${value?'Condensed':'Full'}`
  if(key==='ctaFull')return `CTA width · Auto → ${value?'Full':'Auto'}`
  if(key==='titleScale')return `Headline scale · 100% → ${Math.round(Number(value)*100)}%`
  if(key==='heroPadding')return `Hero spacing · 28 → ${String(value)}`
  if(key==='heroGap')return `Element gap · 18 → ${String(value)}`
  if(key==='heroOrder')return `Hero order · Copy first → Media first`
  return `${key} → ${String(value)}`
 }).join(' · ')
}

function ReviewOverlay(){
 const s=usePresenceStore();const p=s.proposal
 if(!p||p.status!=='ready')return null
 const acceptedRevision=s.revision+1
 return <motion.div className="review-climax-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}} onPointerDown={e=>{if(e.target===e.currentTarget)s.closeReview()}} role="presentation">
  <motion.section id="presence-human-review" className="review-climax" role="dialog" aria-modal="true" aria-labelledby="presence-review-title" initial={{opacity:0,y:24,scale:.975}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:14,scale:.985}} transition={{duration:.48,ease}} onPointerDown={e=>e.stopPropagation()}>
   <header className="review-climax-head"><div><p className="eyebrow">HUMAN REVIEW · TABLET ONLY</p><h2 id="presence-review-title">Your agent is done. You decide what becomes real.</h2><p>{p.operations.length} provisional {p.operations.length===1?'change':'changes'} · based on r{p.baseRevision} · canonical stays r{s.revision} until you accept.</p></div><button type="button" className="icon-btn" onClick={s.closeReview} aria-label="Close review"><X size={15}/></button></header>
   <div className="review-climax-body">
    <div className="review-climax-preview"><div className="review-preview-label"><span>PROVISIONAL TABLET</span><b>Not canonical yet</b></div><TabletSite active focusTarget={s.reviewFocus}/></div>
    <aside className="review-climax-changes"><div className="review-revision-rail"><span>r{s.revision}</span><i/><span className="future">r{acceptedRevision}</span></div><div className="review-change-stack">{p.operations.map((op,index)=><button type="button" className={`review-change-card ${s.reviewFocus===op.componentId?'focused':''}`} key={op.id} onClick={()=>s.focusReview(op.componentId)}><span className="review-change-index">{String(index+1).padStart(2,'0')}</span><span><small>TABLET ONLY</small><b>{op.label}</b><em>{beforeAfter(op)}</em></span><span className="review-reject" role="button" tabIndex={0} onClick={e=>{e.stopPropagation();s.rejectOp(op.id)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();s.rejectOp(op.id)}}}>Reject</span></button>)}</div><div className="review-climax-why"><span>WHY THIS IS SAFE</span><p>{p.explanation}</p><small>Desktop and Mobile remain untouched. Acceptance is a human-only canonical mutation.</small></div></aside>
   </div>
   <footer className="review-climax-foot"><div><b>Human gate</b><span>Nothing advances until you approve.</span></div><div className="review-climax-actions"><button type="button" className="secondary" onClick={s.rejectProposal}>Reject all</button><button type="button" className="primary accept-climax" disabled={!p.operations.length} onClick={s.acceptProposal}>Accept {p.operations.length} {p.operations.length===1?'change':'changes'} · advance to r{acceptedRevision} <Check size={13}/></button></div></footer>
  </motion.section>
 </motion.div>
}

function DemoDirector({enabled}:{enabled:boolean}){
 const s=usePresenceStore()
 if(!enabled)return null
 const a=s.admission
 const p=s.proposal
 const blocked=s.blockedAttempt?.error
 const waitingForHuman=s.agentPhase==='inspecting'&&s.agentWork.target==='nav'&&p?.status==='working'&&s.revision===p.baseRevision
 const accepted=p?.status==='accepted'
 const finished=a?.status==='revoked'&&blocked==='ADMISSION_REVOKED'
 let title='Agent has no authority yet'
 let detail='Start with the empty Tablet seat. The agent must ask before it can act.'
 let step=1
 let action='Agent requests Tablet'
 let run=()=>{window.dispatchEvent(new CustomEvent('presence:focus-seat',{detail:{seat:'agent'}}));s.requestAdmission('I can handle Tablet while you finish Mobile.')}
 if(a?.status==='pending'){title='A seat is being requested',detail='Approve Tablet only. Mobile and publishing stay outside the agent’s authority.',step=1,action='Admit Tablet only',run=()=>s.approveAdmission()}
 else if(a?.status==='admitted'&&s.agentPhase==='present'&&!p){title='The agent has one scoped seat',detail='Start real Tablet work. Watch it remain provisional while Mobile stays yours.',step=2,action='Start agent work',run=()=>{window.dispatchEvent(new CustomEvent('presence:focus-seat',{detail:{seat:'agent'}}));void s.runAgentDemo()}}
 else if(waitingForHuman){title='Now create a real conflict',detail='Change Mobile while the agent is still working from the older revision.',step=3,action='You: change Mobile',run=()=>{window.dispatchEvent(new CustomEvent('presence:focus-seat',{detail:{seat:'you'}}));s.selectMobile('hero');s.humanEdit('hero',{heroGap:s.mobileDesign.heroGap===18?14:18},'You changed Mobile while the agent was working.')}}
 else if(s.agentPhase==='catching-up'||s.stale){title='Overwrite prevented',detail='The agent reached stale state, re-reads the project, and adapts instead of overwriting you.',step=3,action='',run=()=>{}}
 else if(p?.status==='working'){title=blocked==='SURFACE_NOT_ASSIGNED'?'The boundary just held':'Agent work stays provisional',detail=blocked==='SURFACE_NOT_ASSIGNED'?'The Tablet-scoped agent tried Mobile and Presence stopped it at the boundary.':'The agent is changing Tablet without mutating canonical state.',step=blocked==='SURFACE_NOT_ASSIGNED'?2:3,action='',run=()=>{}}
 else if(p?.status==='ready'&&!s.reviewOpen){title='Nothing becomes real without you',detail=`${p.operations.length} Tablet changes are ready. Canonical is still r${s.revision}.`,step=4,action='Review proposal',run=()=>s.openReview()}
 else if(s.reviewOpen){title='Human gate',detail='Inspect the provisional Tablet diff. Acceptance is the only path to canonical state.',step=4,action='',run=()=>{}}
 else if(accepted&&a?.status==='admitted'){title=`r${s.revision} is now canonical`,detail='The human accepted the proposal. Now remove the agent and prove authority disappears.',step=5,action='Revoke agent',run=()=>{window.dispatchEvent(new CustomEvent('presence:focus-seat',{detail:{seat:'agent'}}));s.revoke()}}
 else if(a?.status==='revoked'&&!finished){title='The seat is empty again',detail='One final operation proves revocation is enforced by the engine, not just the UI.',step=6,action='Prove access is gone',run=()=>s.testRevokedAccess()}
 else if(finished){title='Give agents a seat. Not the keys.',detail='Scoped admission, concurrent humans, stale-state protection, human review, and revocation — proven live.',step=6,action='',run=()=>{}}
 const labels=['Admit','Work','Conflict','Review','Commit','Revoke']
 return <motion.aside className={`demo-director ${finished?'is-finished':''}`} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} aria-label="Flagship demo guide">
  <div className="demo-director-head"><span>FLAGSHIP PROOF</span><b>{String(step).padStart(2,'0')} / 06</b></div>
  <div className="demo-director-copy"><AnimatePresence mode="wait"><motion.div key={`${step}-${title}`} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.24}}><strong>{title}</strong><p>{detail}</p></motion.div></AnimatePresence></div>
  <div className="demo-director-rail" aria-hidden="true">{labels.map((label,index)=><span key={label} className={index+1<step?'done':index+1===step?'current':''}><i/>{label}</span>)}</div>
  {action&&<button type="button" className="demo-director-action" onClick={run}>{action}<ArrowRight size={13}/></button>}
 </motion.aside>
}

function CanonicalMoment({enabled}:{enabled:boolean}){
 const s=usePresenceStore()
 const last=s.activity[s.activity.length-1]
 if(!enabled||!last?.message.startsWith('Accepted selected Tablet changes.'))return null
 return <motion.div key={last.id} className="canonical-moment" initial={{opacity:0,y:12,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}} transition={{duration:.45,ease}}><span>CANONICAL</span><b>r{s.revision}</b><p>Human accepted · Tablet is now part of the shared project</p></motion.div>
}

function BoundaryToast(){
 const attempt=usePresenceStore(state=>state.blockedAttempt)
 const [visible,setVisible]=useState(false)
 useEffect(()=>{if(!attempt)return;setVisible(true);const timer=window.setTimeout(()=>setVisible(false),3600);return()=>window.clearTimeout(timer)},[attempt?.nonce])
 return <AnimatePresence>{visible&&attempt&&<motion.div className={`boundary-toast code-${attempt.error.toLowerCase()}`} initial={{opacity:0,y:-10,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.985}} transition={{duration:.22,ease}} role="status" aria-live="assertive"><div className="boundary-icon"><ShieldCheck size={15}/></div><div><b>{attempt.error==='STALE_STATE'?'Stale work blocked':'Blocked by Presence'}</b><span>{attempt.message}</span></div><code>{attempt.error}{attempt.error==='STALE_STATE'?` · r${attempt.atRevision}`:''}</code></motion.div>}</AnimatePresence>
}

function ProofPanel({close}:{close:()=>void}){
 const s=usePresenceStore();const authority=s.activity.filter(item=>item.kind==='authority').slice(-8).reverse()
 const status=s.admission?.status==='admitted'?'Tablet only':s.admission?.status==='paused'?'Paused':s.admission?.status==='revoked'?'Revoked':'No authority'
 return <motion.aside className="proof-panel authority-panel" initial={{opacity:0,y:10,x:8}} animate={{opacity:1,y:0,x:0}} exit={{opacity:0,y:10,x:8}}><div className="proof-head"><div><p className="eyebrow">AGENT AUTHORITY</p><b>{status} · live r{s.revision}</b></div><button onClick={close}><X size={13}/></button></div><div className="authority-summary"><span>CAN</span><b>Inspect project · propose Tablet</b><span>CANNOT</span><b>Change Desktop/Mobile · publish</b></div><div className="proof-events authority-events">{authority.length?authority.map(item=><div key={item.id} className={`authority-event ${item.outcome??'state'}`}><span className="authority-symbol">{item.outcome==='blocked'?'⊘':item.outcome==='allowed'?'✓':'•'}</span><p><b>{item.message}</b>{item.code&&<small>{item.code}</small>}</p><code>{item.code==='STALE_STATE'&&item.message.includes('→')?item.message.split('· ')[1]:item.surface?item.surface[0].toUpperCase()+item.surface.slice(1):`r${item.revision}`}</code></div>):<div className="authority-empty"><span>•</span><p>Admission and enforcement events will appear here.</p><code>r{s.revision}</code></div>}</div></motion.aside>
}
