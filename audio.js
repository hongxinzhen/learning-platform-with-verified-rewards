/* Local CC0 sound effects. No music, network services, or tracking. */
(function(root){
 'use strict';
 const SOUNDS={click:{file:'candidate-pet-C.wav',label:'按钮轻触 · 8C',gain:.7},submit:{file:'candidate-submit-A.wav',label:'提交练习 · 4A',gain:.8},level:{file:'candidate-level-B.wav',label:'升级庆祝 · 6B',gain:.8},celebrate:{file:'candidate-achievement-B.wav',label:'成就庆祝 · 7B',gain:.8}};
 let prefs=()=>({sound:false,volume:.35}),ctx=null,master=null,gesture=false,generation=0,clickAt=-1000;
 const buffers=new Map(),pending=new Map(),playing=new Set();
 const status={loaded:0,last:null,lastError:null,started:0,ready:false};
 function configure(getter){prefs=getter;sync()}
 function sync(){if(master&&ctx)master.gain.setTargetAtTime(prefs().sound?Math.max(0,Math.min(1,prefs().volume)):0,ctx.currentTime,.025);if(!prefs().sound)stopAll()}
 function context(){if(ctx)return ctx;const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.gain.value=prefs().sound?prefs().volume:0;master.connect(ctx.destination);return ctx}
 async function load(file){if(buffers.has(file))return buffers.get(file);if(pending.has(file))return pending.get(file);const task=(async()=>{const c=context();if(!c)throw Error('浏览器没有Web Audio');const response=await fetch('assets/audio/'+file);if(!response.ok)throw Error('音效资源未就绪：'+file);const buffer=await c.decodeAudioData(await response.arrayBuffer());buffers.set(file,buffer);status.loaded=buffers.size;return buffer})().catch(e=>{status.lastError=String(e.message||e);pending.delete(file);return null});pending.set(file,task);return task}
 function unlock(){gesture=true;const c=context();if(c){void c.resume().then(()=>{status.ready=c.state==='running'}).catch(()=>{});if(prefs().sound)for(const file of new Set(Object.values(SOUNDS).map(s=>s.file)))void load(file)}}
 async function play(name,{delay=0,force=false}={}){const spec=SOUNDS[name];if(!spec||(!prefs().sound&&!force)||!gesture)return false;
  const now=typeof performance!=='undefined'?performance.now():Date.now();if(name==='click'&&now-clickAt<60)return false;if(name==='click')clickAt=now;
  const stamp=generation,buffer=await load(spec.file);if(!buffer||stamp!==generation||(!prefs().sound&&!force))return false;
  const c=context();await c.resume().catch(()=>{});if(c.state!=='running')return false;
  if(['level','celebrate'].includes(name)){for(const p of [...playing])if(p.major){try{p.node.stop()}catch{}playing.delete(p)}}
  if(playing.size>=6){const first=playing.values().next().value;try{first.node.stop()}catch{}playing.delete(first)}
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;source.loop=false;gain.gain.value=spec.gain;source.connect(gain);gain.connect(master);const item={node:source,gain,major:['level','celebrate'].includes(name)};playing.add(item);source.onended=()=>{playing.delete(item);source.disconnect();gain.disconnect()};source.start(c.currentTime+delay);status.last=name;status.started++;status.ready=true;return true;
 }
 function stopAll(){generation++;for(const p of playing){try{p.node.stop()}catch{}p.node.disconnect();p.gain.disconnect()}playing.clear()}
 function closeCelebration(){generation++;for(const p of [...playing])if(p.major){try{p.node.stop()}catch{}playing.delete(p)}}
 function bind(){if(!root.document?.addEventListener)return;document.addEventListener('pointerdown',unlock,{capture:true,once:false});document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key))unlock()},{capture:true});document.addEventListener('click',e=>{const target=e.target?.closest?.('button,a,input[type="checkbox"]');if(!target||target.disabled||target.dataset.sfx==='none')return;unlock();void play(target.dataset.sfx||'click')},{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll()});}
 const api={SOUNDS,configure,play,unlock,sync,stopAll,closeCelebration,diagnostics:()=>({...status,context:ctx?.state||'not-started',active:playing.size})};root.MoyaAudio=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;bind();
})(typeof globalThis!=='undefined'?globalThis:this);
