// MoYa pet-only adaptation of Jelly Baby by Scott Sun. GPL-3.0-only.
import * as THREE from 'three/webgpu';
import { MoyaCompanion } from './moya-companion.ts';
import { SoftBody } from '../physics/soft-body.js';
import { PHYS } from '../physics/constants.js';
import { loadBabyCage } from '../physics/baby-cage.ts';
import { RefractiveLightField } from '../graphics/optics/refractive-light.js';
import { CausticReceivers } from '../graphics/optics/caustic-receivers.ts';
import { Baby, ABSORPTION } from '../graphics/character/baby.ts';
import { loadEnvironment } from '../graphics/scene/environment.ts';
import { loadTableTextures, makeTable } from '../graphics/scene/table.ts';
import { Locomotion } from './locomotion.ts';
import { Input } from './input.ts';
import { JellySound } from './sound.ts';
import { createRenderer, resizeView } from '../graphics/scene/renderer.ts';
import { OpticalTransport } from '../graphics/optics/transport.ts';
import { createComposite } from '../graphics/scene/composite.ts';
import { FixedStepper } from './fixed-step.ts';
import { FacilityShadows } from '../facilities/shadows.ts';
import { warmMainScenePipelines } from '../graphics/scene/render-warmup.ts';
import { LocalReflectionProbe } from '../graphics/scene/local-reflections.ts';
import { startupPlatformProfile } from './platform-profile.ts';

export async function startGame(stage:(s:string)=>void,fail:(e:unknown)=>void) {
  const profile=startupPlatformProfile();
  stage('正在唤醒果冻');
  const renderer=await createRenderer(fail);
  document.querySelector('#viewport')!.appendChild(renderer.domElement);
  // Construct audio before the remaining async scene work so the first mobile
  // gesture can unlock Web Audio even while assets and shaders are settling.
  const sound=new JellySound();
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e8d9c3');scene.fog=new THREE.Fog('#e8d9c3',2,12);
  const camera=new THREE.PerspectiveCamera(36,1,.001,40);
  camera.position.set(.09,.13,.19);
  stage('正在布置阳光小屋');
  const [environment,cage,tableTextures]=await Promise.all([
    loadEnvironment(renderer,scene),loadBabyCage(),loadTableTextures(profile.mobile),
  ]);
  // Start the large table uploads before CPU-side world construction so the
  // backend can overlap transfer work with geometry/physics setup.
  for(const texture of Object.values(tableTextures))renderer.initTexture(texture);
  stage('正在准备柔软的身体');
  const body=new SoftBody(cage);
  const baby=new Baby(body);scene.add(baby.group);
  const localReflections=new LocalReflectionProbe(scene,baby.group,environment.reflectionTexture,profile.reflectionFacesPerFrame);
  baby.setReflectionMap(localReflections.texture,environment.intensity);
  const optics=new RefractiveLightField(body.cage.opticalSurface,environment.incoming,ABSORPTION);
  optics.setCamera(camera);
  // Worker BVH construction is independent of the remaining scene setup. Start
  // it here so that cold worker initialization runs in parallel with facilities.
  const transport=new OpticalTransport(optics,body,camera,environment.incoming,fail,profile.cameraOnlyOpticalHz);
  const caustics=new CausticReceivers(optics,environment);
  const facilityShadows=new FacilityShadows(environment.incoming,environment.windowFraction,caustics,-.00005,profile.surfaceShadowSize);
  facilityShadows.surfaces.addBaby(baby.mesh);
  const table=makeTable(optics,environment,facilityShadows,caustics,tableTextures);scene.add(table.mesh);
  const composite=createComposite(renderer,scene,camera,profile.bloomResolutionScale);
  const rig=new Locomotion(body);

  rig.onContact=(speed,foot)=>sound.contact(speed,foot);
  const physicsClock=new FixedStepper(PHYS.step);
  const input=new Input(camera,renderer.domElement,body,baby.mesh,rig,sound);
  const companion=new MoyaCompanion(scene,camera,renderer,body,baby,rig,input,sound,optics,facilityShadows);
  let disposed=false,lastTime=0;
  const reset=()=>{companion.resetInteraction();physicsClock.reset();if(window.parent!==window)window.parent.postMessage({type:'moya:requestIdle'},location.origin);};
  document.querySelector('#reset')!.addEventListener('click',reset);
  document.querySelector('#sound')!.addEventListener('click',()=>{
    if(window.parent!==window){window.parent.postMessage({type:'moya:requestSound'},location.origin);return;}
    const muted=sound.toggle();
    document.querySelector('#sound')!.setAttribute('aria-pressed',String(muted));
    document.querySelector('#sound')!.textContent=muted?'声音关':'声音开';
    void sound.unlock().catch(()=>{});
  });
  // Start muted so a learning page never makes an unexpected sound.
  sound.toggle();document.querySelector('#sound')!.setAttribute('aria-pressed','true');
  const resize=()=>resizeView(renderer,camera,input.controls,Math.min(1.5,profile.maxDpr));
  const resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(document.querySelector('#viewport')!);resize();
  for(let i=0;i<80;i++){rig.step(PHYS.step);body.step(PHYS.step);}
  body.updateSurface();baby.update();input.update(1);
  const revision=facilityShadows.update(renderer);
  facilityShadows.surfaces.update(renderer,revision);
  optics.update(renderer,body,true);await transport.update();
  localReflections.captureNow(renderer,body.center);
  stage('正在准备光影与交互');
  await warmMainScenePipelines(renderer,scene,camera);
  composite.render();
  const backend=renderer.backend as unknown as {device:GPUDevice};
  await backend.device.queue.onSubmittedWorkDone();
  lastTime=performance.now();
  const frame=(time:number)=>{
    if(disposed)return;
    try {
      const dt=Math.min(.05,Math.max(0,(time-lastTime)/1000));lastTime=time;
      if(document.hidden||companion.paused||companion.switching){physicsClock.reset();return;}
      const steps=physicsClock.advance(dt,()=>{
        input.step(PHYS.step);companion.beforeStep(PHYS.step);if(!companion.controlled)rig.step(PHYS.step);body.step(PHYS.step);
        companion.afterStep();input.afterPhysicsStep();if(!companion.controlled)rig.afterStep();
      });
      if(steps&&body.surfaceDirty){
        if(!body.isFinite())throw new Error('果冻物理状态异常，请重试');
        body.updateSurface();
      }
      companion.update(dt);baby.update(dt,companion.playing,companion.sleeping);
      const revision=facilityShadows.update(renderer);
      facilityShadows.surfaces.update(renderer,revision);
      input.update(dt);sound.listen(camera);transport.follow();
      optics.update(renderer,body);
      table.mesh.position.x=body.center.x;table.mesh.position.z=body.center.z;
      localReflections.update(renderer,body.center);
      void transport.update().catch(fail);composite.render();
    }catch(error){fail(error);}
  };
  const stop=()=>{
    if(disposed)return;disposed=true;
    void renderer.setAnimationLoop(null);resizeObserver.disconnect();
    companion.dispose();input.dispose();sound.dispose();transport.dispose();facilityShadows.dispose();caustics.dispose();
    composite.dispose();localReflections.dispose();baby.dispose();table.dispose();environment.dispose();optics.dispose();renderer.dispose();
  };
  await renderer.setAnimationLoop(frame);
  window.addEventListener('pagehide',()=>stop());
  if(import.meta.hot)import.meta.hot.dispose(stop);
  return {stop};
}
