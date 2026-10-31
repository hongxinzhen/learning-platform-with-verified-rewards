/* MIT. MoYa adaptation of three.quarks TrailDemo and EmitterShapeDemo.
 * Upstream: Copyright (c) 2019 Forrest Sun. See licenses/THREE-QUARKS-MIT.txt.
 * The small star texture below is generated here; no upstream atlas is copied.
 */
import * as THREE from 'three';
import {BatchedRenderer,ParticleSystem,ConeEmitter,SphereEmitter,ConstantValue,IntervalValue,ColorRange,RenderMode,ApplyForce,SizeOverLife,PiecewiseBezier,Bezier} from 'three.quarks';

export function createRewardFX(scene,{reduced=false}={}){
 const batch=new BatchedRenderer();scene.add(batch);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,30);
 g.addColorStop(0,'#fff');g.addColorStop(.12,'#ffffe8');g.addColorStop(.35,'#ffffffaa');g.addColorStop(1,'#ffffff00');
 ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(canvas),live=[],queued=[];let time=0,disposed=false;
 function spawn(kind,position,color){
  if(disposed||reduced)return;
  const fire=kind==='fireworks',material=new THREE.MeshBasicMaterial({map:texture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffffff});
  const system=new ParticleSystem({duration:fire?.15:1.7,looping:false,worldSpace:true,
   startLife:new IntervalValue(fire?1.4:.7,fire?2.7:1.6),startSpeed:new IntervalValue(fire?1.7:.35,fire?3.2:1.1),
   startSize:new IntervalValue(fire?.025:.025,fire?.055:.07),
   startColor:new ColorRange(new THREE.Vector4(...color,1),new THREE.Vector4(1,.9,.54,1)),
   emissionOverTime:new ConstantValue(fire?0:38),
   emissionBursts:fire?[{time:0,count:new ConstantValue(58),cycle:1,interval:.01,probability:1}]:[],
   shape:fire?new SphereEmitter({radius:.015,thickness:1}):new ConeEmitter({radius:.43,angle:.36,thickness:1}),
   material,renderMode:fire?RenderMode.Trail:RenderMode.BillBoard,
   rendererEmitterSettings:fire?{startLength:new ConstantValue(13)}:undefined,renderOrder:8,
   behaviors:[new SizeOverLife(new PiecewiseBezier([[new Bezier(1,.9,.45,0),0]])),new ApplyForce(new THREE.Vector3(0,-1,0),new ConstantValue(fire?1.5:.12))]});
  system.emitter.position.copy(position);if(!fire)system.emitter.rotation.x=-Math.PI/2;
  scene.add(system.emitter);batch.addSystem(system);live.push({system,material,until:time+4});
 }
 function play(kind='cone'){
  if(kind==='fireworks'){
   const palette=[[1,.55,.16],[.25,.9,.65],[.64,.46,1]];
   palette.forEach((color,i)=>queued.push({at:time+i*.45,kind,position:new THREE.Vector3((i-1)*1.05,1.6+(i%2)*.55,-.7),color}));
  }else spawn('cone',new THREE.Vector3(0,.05,0),[1,.73,.2]);
 }
 function cleanup(x){batch.deleteSystem(x.system);scene.remove(x.system.emitter);x.system.dispose();x.material.dispose()}
 function update(dt){if(disposed)return;time+=Math.min(.06,Math.max(0,dt));for(let i=queued.length-1;i>=0;i--)if(queued[i].at<=time){const q=queued.splice(i,1)[0];spawn(q.kind,q.position,q.color)}batch.update(Math.min(.06,Math.max(0,dt)));for(let i=live.length-1;i>=0;i--)if(live[i].until<=time)cleanup(live.splice(i,1)[0])}
 function dispose(){if(disposed)return;disposed=true;queued.length=0;live.splice(0).forEach(cleanup);scene.remove(batch);for(const b of batch.batches)b.dispose();texture.dispose()}
 return {play,update,dispose};
}
