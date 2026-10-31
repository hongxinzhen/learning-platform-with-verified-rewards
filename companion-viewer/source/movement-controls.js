/* SPDX-License-Identifier: GPL-3.0-only
 * Bounded, acknowledgement-gated movement for the shared MoYa scene.
 * This controller never awards experience, submits work or mutates inventory.
 */
import '../../pet-platform-config.js';

export function clampToPlatform(x,z,radius=1.25){
 x=Number.isFinite(x)?x:0;z=Number.isFinite(z)?z:0;
 const distance=Math.hypot(x,z),scale=distance>radius?radius/distance:1;
 return {x:x*scale,z:z*scale,bounded:distance>radius};
}

const DIRECTIONS={up:[0,-1],left:[-1,0],right:[1,0],down:[0,1]};
const KEY_DIRECTION={KeyW:'up',KeyA:'left',KeyD:'right',KeyS:'down'};
const CSS=`.moya-movement-controls{position:absolute;z-index:3;left:12px;bottom:180px;width:134px;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none}.moya-move-pad{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);gap:3px;align-items:center;justify-items:center}.moya-move-pad button{width:42px;min-width:42px;height:42px;min-height:42px;padding:0;font:19px/1 system-ui;border-radius:14px;color:#71895f;border:1px solid #d8ddc5;background:#fff9e5d9;backdrop-filter:blur(8px);box-shadow:0 3px 10px #2c473b10;touch-action:none}.moya-move-pad button:disabled{opacity:.38}.moya-move-pad button.held{background:#e5edc8;border-color:#9fb778;color:#476b43;box-shadow:0 0 0 3px #b7c69b44}.moya-move-pad [data-direction=up]{grid-column:2;grid-row:1}.moya-move-pad [data-direction=left]{grid-column:1;grid-row:2}.moya-move-pad [data-direction=right]{grid-column:3;grid-row:2}.moya-move-pad [data-direction=down]{grid-column:2;grid-row:3}.moya-move-label{grid-column:2;grid-row:2;font-size:8px;color:#91a07f;letter-spacing:1px;pointer-events:none}.moya-move-caption{font-size:8px;color:#8a9b78;line-height:1.6;text-align:center;margin-top:6px;background:#fffbedb8;border:1px solid #e0e2ceaa;border-radius:10px;padding:5px 6px;pointer-events:none}.moya-movement-controls[data-waiting=true] .moya-move-caption{color:#a08b54}@media(max-width:360px){.moya-movement-controls{left:7px;bottom:175px;width:125px}.moya-move-pad{grid-template-columns:repeat(3,39px);grid-template-rows:repeat(3,39px)}.moya-move-pad button{width:39px;min-width:39px;height:39px;min-height:39px}}`;

/**
 * requestAction(action,{source:'movement',token,petId}) MUST use the existing
 * authorised action path. It can return an id (later call ack), a Promise that
 * resolves true only after confirmation, or nothing (later call ack).
 */
export function createMovementControls({host,current,requestAction,actorRoot,getActor,isBlocked=()=>false,getHeading=()=>0,getFacingOffset=()=>0,radius=1.25,now=()=>performance.now()}={}){
 if(!host||typeof current!=='function'||typeof requestAction!=='function'||!actorRoot||typeof getActor!=='function')throw new Error('Movement controls require host, current, requestAction, actorRoot and getActor');
 radius=Math.min(1.25,Math.max(.1,Number(radius)||1.25));
 const doc=host.ownerDocument||document,win=doc.defaultView||window,P=globalThis.MoyaPetPlatform;
 const root=doc.createElement('div');root.className='moya-movement-controls';root.setAttribute('role','group');root.setAttribute('aria-label','伙伴移动控制');
 const style=doc.createElement('style');style.textContent=CSS;root.append(style);
 const pad=doc.createElement('div');pad.className='moya-move-pad';root.append(pad);
 const label=doc.createElement('span');label.className='moya-move-label';label.textContent='移动';pad.append(label);
 const buttons=new Map(),symbols={up:'↑',left:'←',right:'→',down:'↓'},labels={up:'向前移动',left:'向左移动',right:'向右移动',down:'向后移动'};
 for(const direction of Object.keys(DIRECTIONS)){const button=doc.createElement('button');button.type='button';button.dataset.direction=direction;button.textContent=symbols[direction];button.setAttribute('aria-label',labels[direction]);button.setAttribute('aria-pressed','false');pad.append(button);buttons.set(direction,button)}
 const caption=doc.createElement('div');caption.className='moya-move-caption';caption.setAttribute('role','status');caption.setAttribute('aria-live','polite');root.append(caption);host.append(root);
 const keys=new Set(),pointers=new Map(),listeners=[];
 let pending=null,active=null,tap=null,generation=0,disposed=false,runRequested=false,lastKey=null,lastActor=null,lastSignature='',lastError='',errorUntil=0;
 function listen(target,type,handler,options){target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options))}
 function snapshot(){
  let state={},actor=null,blocked=true;try{state=current()||{};actor=getActor();blocked=disposed||!!doc.hidden||!!state.paused||isBlocked()||!!doc.querySelector?.('dialog[open]')}catch{}
  const capabilities=P.capabilities(state),walk=capabilities.find(a=>a.id==='walk'&&a.kind==='native'&&a.clip),run=capabilities.find(a=>a.id==='run'&&a.kind==='native'&&a.clip);
  const action=runRequested&&run&&!run.locked?'run':walk&&!walk.locked?'walk':run&&!run.locked?'run':null;
  const reason=!actor?'伙伴正在准备…':blocked?'先看看当前的信息吧':action?'点按或按住方向 · WASD也可以':(walk?.reason||run?.reason||'这位伙伴现在喜欢原地陪你');
  return {state,actor,blocked,action,reason,canMove:!!actor&&!blocked&&!!action,key:String(state.studentId||'')+'|'+String(state.petId||'')};
 }
 function input(){
  let x=0,z=0;for(const code of keys){const v=DIRECTIONS[KEY_DIRECTION[code]];if(v){x+=v[0];z+=v[1]}}
  for(const p of pointers.values()){x+=p.vector[0];z+=p.vector[1]}
  if(!x&&!z&&tap&&tap.remaining>0){x=tap.x;z=tap.z}
  const length=Math.hypot(x,z);if(!length)return null;
  const h=Number(getHeading())||0,c=Math.cos(h),s=Math.sin(h);x/=length;z/=length;
  return {x:x*c+z*s,z:-x*s+z*c};
 }
 function clear(){
  generation++;const previous=active;active=pending=tap=null;keys.clear();runRequested=false;
  const captures=[...pointers.entries()];pointers.clear();for(const [id,p]of captures)try{if(p.button.hasPointerCapture?.(id))p.button.releasePointerCapture(id)}catch{}
  try{previous?.actor.play('observe')}catch{}
  for(const button of buttons.values()){button.classList.remove('held');button.setAttribute('aria-pressed','false')}
  lastSignature='';
 }
 function reset(){clear();refresh()}
 function refresh(){
  if(disposed)return null;const s=snapshot();
  if((lastKey!==null&&s.key!==lastKey)||(lastActor&&s.actor!==lastActor)||s.blocked&&(pending||active||keys.size||pointers.size||tap))clear();
  lastKey=s.key;lastActor=s.actor;
  const message=lastError&&now()<errorUntil?lastError:pending?'正在和伙伴确认…':active?'在小平台里一起走走':s.reason;
  root.hidden=!s.canMove;
  const signature=s.key+'|'+s.canMove+'|'+message+'|'+!!pending;
  if(signature!==lastSignature){for(const button of buttons.values())button.disabled=!s.canMove;caption.textContent=message;root.dataset.waiting=String(!!pending);lastSignature=signature}
  for(const [direction,button]of buttons){const held=[...keys].some(code=>KEY_DIRECTION[code]===direction)||[...pointers.values()].some(p=>p.direction===direction);button.classList.toggle('held',held);button.setAttribute('aria-pressed',String(held))}
  return s;
 }
 function deny(message='这次没有移动，请再试一下'){clear();lastError=message;errorUntil=now()+2500;refresh()}
 function ack(action,{ok=true,token,petId,requestId}={}){
  if(disposed||!pending||pending.action!==action)return false;
  if(token!=null&&token!==pending.token||petId!=null&&petId!==pending.petId||requestId!=null&&pending.requestId&&requestId!==pending.requestId)return false;
  const expected=pending,s=snapshot();
  if(!ok){deny();return true}
  if(!s.canMove||s.key!==expected.key||s.actor!==expected.actor||!P.canAct(s.state,action)||!input()||now()-expected.started>8000){clear();refresh();return true}
  if(!s.actor.play(action)){deny('伙伴还没学会这个动作');return true}
  active={action,actor:s.actor,key:s.key,petId:expected.petId,renewIn:2.2};pending=null;
  const point=clampToPlatform(actorRoot.position.x,actorRoot.position.z,radius);actorRoot.position.x=point.x;actorRoot.position.z=point.z;actorRoot.position.y=0;refresh();return true;
 }
 function ensure(){
  const s=refresh(),direction=input();if(!s||!s.canMove||!direction){if(active||pending)clear();return}
  if(active&&active.action===s.action&&active.key===s.key&&active.actor===s.actor)return;
  if(pending&&pending.action===s.action&&pending.key===s.key&&pending.actor===s.actor)return;
  if(active){active.actor.play('observe');active=null}
  const token=++generation,expected={token,action:s.action,petId:s.state.petId,key:s.key,actor:s.actor,started:now(),requestId:null};pending=expected;refresh();
  try{
   const result=requestAction(s.action,{source:'movement',token,petId:s.state.petId});
   if(typeof result==='string'&&pending===expected)expected.requestId=result;
   else if(result&&typeof result.then==='function')result.then(value=>{if(pending!==expected)return;if(value===true||value?.ok===true)ack(expected.action,{token,petId:expected.petId});else if(value===false||value?.ok===false)ack(expected.action,{token,ok:false})}).catch(()=>{if(pending===expected)deny()});
   else if(result===false&&pending===expected)deny();
   else if(result===true&&pending===expected)ack(expected.action,{token,petId:expected.petId});
  }catch{if(pending===expected)deny()}
 }
 function releasePointer(e,cancelled=false){
  const p=pointers.get(e.pointerId);if(!p)return;pointers.delete(e.pointerId);
  if(!cancelled&&now()-p.started<250){tap={x:p.vector[0],z:p.vector[1],remaining:.32}}
  try{if(p.button.hasPointerCapture?.(e.pointerId))p.button.releasePointerCapture(e.pointerId)}catch{}
  if(!input()){clear();refresh()}else ensure();
 }
 for(const [direction,button]of buttons){
  listen(button,'pointerdown',e=>{if(e.button!==0||button.disabled)return;e.preventDefault();e.stopPropagation();tap=null;lastError='';pointers.set(e.pointerId,{direction,vector:DIRECTIONS[direction],started:now(),button});try{button.setPointerCapture?.(e.pointerId)}catch{}ensure()});
  listen(button,'pointerup',e=>{e.preventDefault();e.stopPropagation();releasePointer(e)});
  listen(button,'pointercancel',e=>releasePointer(e,true));
  listen(button,'lostpointercapture',e=>releasePointer(e,true));
 }
 const editable=el=>el&&(/INPUT|TEXTAREA|SELECT/.test(el.tagName)||el.isContentEditable);
 listen(doc,'keydown',e=>{
  if(e.code==='Escape'){reset();return}if(editable(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight'){runRequested=true;if(keys.size)ensure();return}
  const code=e.code||('Key'+String(e.key||'').toUpperCase());if(!KEY_DIRECTION[code])return;
  const s=snapshot();if(!s.canMove)return;e.preventDefault();e.stopPropagation();if(keys.has(code))return;runRequested=!!e.shiftKey;keys.add(code);lastError='';ensure();
 },true);
 listen(doc,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){runRequested=false;if(keys.size)ensure();return}const code=e.code||('Key'+String(e.key||'').toUpperCase());if(!KEY_DIRECTION[code])return;if(keys.has(code)){keys.delete(code);e.preventDefault();if(!input()){clear();refresh()}else ensure()}},true);
 listen(doc,'pointerup',e=>releasePointer(e),true);listen(doc,'pointercancel',e=>releasePointer(e,true),true);
 listen(doc,'pointerdown',e=>{if(!root.contains(e.target)&&(active||pending||keys.size||pointers.size||tap))reset()},true);
 listen(doc,'visibilitychange',()=>{if(doc.hidden)reset()});listen(win,'blur',reset);
 function update(dt){
  if(disposed)return;const delta=Math.min(.06,Math.max(0,Number(dt)||0)),s=refresh();
  if(pending&&now()-pending.started>8000){deny('伙伴还没回应，请再试一下');return}
  if(!s?.canMove){if(active||pending)clear();return}
  const direction=input();if(!direction){if(active||pending)clear();return}
  if(!active){ensure();return}
  if(active.key!==s.key||active.actor!==s.actor||!P.canAct(s.state,active.action)){clear();refresh();return}
  active.renewIn-=delta;if(active.renewIn<=0){if(!active.actor.play(active.action)){deny();return}active.renewIn=2.2}
  const speed=active.action==='run'?.82:.42,point=clampToPlatform(actorRoot.position.x+direction.x*speed*delta,actorRoot.position.z+direction.z*speed*delta,radius);
  actorRoot.position.x=point.x;actorRoot.position.z=point.z;actorRoot.position.y=0;actorRoot.rotation.y=Math.atan2(direction.x,direction.z)+(Number(getFacingOffset(s.state))||0);
  if(tap&&!keys.size&&!pointers.size){tap.remaining-=delta;if(tap.remaining<=0){tap=null;clear();refresh()}}
 }
 function dispose(){if(disposed)return;clear();disposed=true;for(const remove of listeners)remove();root.remove()}
 refresh();return {element:root,update,reset,ack,refresh,dispose,get pending(){return pending?{action:pending.action,token:pending.token,petId:pending.petId,requestId:pending.requestId}:null},get moving(){return !!active}};
}

