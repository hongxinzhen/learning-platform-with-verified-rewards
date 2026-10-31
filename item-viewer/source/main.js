/* MIT. MoYa local selected-item viewer. Model licenses remain independent. */
import * as THREE from 'three';
import {createSelectedItemLoader} from './material-compat.js';
import {OrbitControls} from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import {createRewardFX} from '../../companion-viewer/source/reward-fx.js';
import catalog from '../../assets/selected-items/manifest.json';
import {MODELS} from './model-assets.js';
const $=s=>document.querySelector(s),q=new URLSearchParams(location.search),key=q.get('item')||'small',entry=catalog.items[key],thumbnail=q.get('thumbnail')==='1',embedded=parent!==window;
let reduced=q.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,paused=false,spin=q.get('spin')==='1',disposed=false,raf=0,actor=null,mixer=null,animations=[],currentAction=null;
document.body.classList.toggle('embedded',embedded&&!thumbnail);document.body.classList.toggle('thumbnail',thumbnail);document.body.classList.toggle('compact',innerWidth<430);
const post=(type,data={})=>{if(embedded)parent.postMessage({type,...data},location.origin)};
function error(message){$('#loading').hidden=false;$('#loading').textContent=message;post('moya:item-error',{item:key,message})}
if(!entry||!MODELS[entry.model]){error('这件道具的原始模型尚未接入，请返回背包。')}else void start();
async function start(){
 let renderer,scene,camera,controls,fx,clock,root,pmremTexture;
 try{
  $('#title').textContent=entry.name;$('#source').textContent=entry.author+' · '+entry.license;
  const tier=catalog.chestTiers[q.get('tier')]?q.get('tier'):'wood',tierDef=catalog.chestTiers[tier];
  if(entry.model==='chest'){$('#tier').hidden=false;$('#tier').textContent=tierDef.name+'宝箱 · 同一原作，材质分档'}
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,thumbnail?1:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.setAttribute('aria-label',entry.name+'，真实本地3D模型');$('#stage').append(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#15251d');camera=new THREE.PerspectiveCamera(32,1,.05,40);camera.position.set(3.3,2.05,4.6);camera.lookAt(0,.85,0);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.85,0);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=2.5;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.79;controls.autoRotate=spin&&!reduced;controls.autoRotateSpeed=.7;controls.enabled=!thumbnail;
  scene.add(new THREE.HemisphereLight('#fff2d5','#5f775e',1.5));const sun=new THREE.DirectionalLight('#fff2d2',3);sun.position.set(-3,5,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-3;sun.shadow.camera.right=3;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.015;scene.add(sun);
  const rim=new THREE.PointLight(entry.accent||'#d9bd74',20,12);rim.position.set(2.5,2,-1.5);scene.add(rim);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();pmremTexture=pmrem.fromScene(room,.04).texture;scene.environment=pmremTexture;room.dispose();pmrem.dispose();
  const stand=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.23,.12,80),new THREE.MeshStandardMaterial({color:'#263d2e',roughness:.48,metalness:.2}));stand.position.y=-.08;stand.receiveShadow=true;scene.add(stand);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.19,.012,7,96),new THREE.MeshStandardMaterial({color:entry.accent||'#bda468',roughness:.3,metalness:.7}));ring.rotation.x=-Math.PI/2;ring.position.y=-.012;scene.add(ring);
  root=new THREE.Group();scene.add(root);
  fx=createRewardFX(scene,{reduced:reduced||thumbnail});
  const gltf=await createSelectedItemLoader().loadAsync(MODELS[entry.model]);if(disposed)return;
  actor=gltf.scene;actor.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(actor),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(extent)||extent<=0)throw Error('模型尺寸无效');
  // A parent transform preserves original animation and morph coordinates.
  const normalize=new THREE.Group(),scale=1.95/extent;normalize.scale.setScalar(scale);normalize.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);normalize.add(actor);root.add(normalize);
  actor.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?mats.map(m=>m.clone()):mats[0].clone();for(const m of (Array.isArray(o.material)?o.material:[o.material])){
   if(m.envMapIntensity!==undefined)m.envMapIntensity=.9;
   if(entry.model==='crystal'&&m.color&&key!=='small')m.color.lerp(new THREE.Color(entry.accent),.18);
   if(entry.model==='chest'&&/metal|iron|lock|holder/i.test(o.name+' '+o.parent?.name)){if(tier!=='wood'){m.map=null;m.color?.set(tierDef.color)}else m.color?.lerp(new THREE.Color(tierDef.color),.3);if(m.metalness!==undefined)m.metalness=tier==='wood'?.12:.8;if(m.roughness!==undefined)m.roughness=tier==='wood'?.65:.32;}
  }});
  animations=gltf.animations||[];if(animations.length){mixer=new THREE.AnimationMixer(actor);playAnimation(animations[0].name);$('#animate').hidden=false;$('#motion').textContent=animations.map(a=>a.name).join(' · ')+' · 原生动画';}else $('#motion').textContent='拖动旋转 · 原作静态模型';
  if(entry.model==='spellbook')root.rotation.y=Math.PI-.35;if(thumbnail){if(entry.model!=='spellbook')root.rotation.y=.1;if(mixer)mixer.setTime(entry.model==='sands-of-time'?2.5:.15)}
  function resize(){const box=$('#stage').getBoundingClientRect();renderer.setSize(Math.max(1,box.width),Math.max(1,box.height));camera.aspect=box.width/Math.max(1,box.height);camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe($('#stage'));resize();clock=new THREE.Clock();$('#loading').hidden=true;
  $('#rotate').textContent=spin?'停止转动':'慢慢转动';$('#rotate').onclick=()=>{spin=!spin;controls.autoRotate=spin&&!reduced;$('#rotate').textContent=spin?'停止转动':'慢慢转动'};
  $('#animate').onclick=()=>{if(animations[0])playAnimation(animations[0].name,true)};
  $('#celebrate').onclick=()=>fx.play(q.get('effect')==='fireworks'?'fireworks':'cone');
  if(!thumbnail&&['cone','fireworks'].includes(q.get('effect')))fx.play(q.get('effect'));
  const onMessage=e=>{if(!embedded||e.source!==parent||e.origin!==location.origin||!e.data)return;const m=e.data;if(m.type==='moya:item-state'){if(m.paused!==undefined)paused=!!m.paused;if(m.reduced!==undefined){reduced=!!m.reduced;controls.autoRotate=spin&&!reduced;fx.dispose();fx=createRewardFX(scene,{reduced:reduced||thumbnail})}}if(m.type==='moya:item-fx'&&!paused&&['cone','fireworks'].includes(m.effect))fx.play(m.effect);if(m.type==='moya:item-play'&&typeof m.animation==='string')playAnimation(m.animation,true);if(m.type==='moya:item-dispose')disposeViewer()};
  window.addEventListener('message',onMessage);
  function loop(){if(disposed)return;raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.06);if(!paused&&!document.hidden){if(mixer&&!reduced&&!thumbnail)mixer.update(dt);fx.update(dt);controls.update();renderer.render(scene,camera)}}loop();
  post('moya:item-ready',{item:key,model:entry.model,animations:animations.map(a=>({name:a.name,duration:a.duration})),local:true,thumbnail});
  function disposeViewer(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();fx.dispose();pmremTexture.dispose();scene.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}});renderer.dispose();renderer.forceContextLoss();window.removeEventListener('message',onMessage)}
  window.addEventListener('pagehide',disposeViewer,{once:true});window.addEventListener('unload',disposeViewer,{once:true});
 }catch(e){console.error('Selected item viewer:',entry.model,e);error('这件道具暂时没有打开成功，请稍后重试。')}
 function playAnimation(name,restart=false){if(!mixer)return;const clip=animations.find(a=>a.name===name);if(!clip)return;currentAction?.stop();currentAction=mixer.clipAction(clip);if(restart)currentAction.reset();currentAction.play()}
}

