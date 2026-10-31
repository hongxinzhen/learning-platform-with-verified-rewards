/* SPDX-License-Identifier: GPL-3.0-only
 * WebGL adapter for Scott Sun's Jelly Baby, https://github.com/scottstts/Jelly-Baby.
 * This reuses the original FEM cage, visible mesh, solver, face patches and expression code.
 * No replacement sphere is used. WebGPU/TSL optical transport is intentionally not copied;
 * standard MeshPhysicalMaterial gives a local WebGL rendition of the same geometry.
 */
import * as THREE from 'three';
import {parseBabyCage} from '../../../vendor/jelly-mobile/src/physics/baby-cage.ts';
import {SoftBody} from '../../../vendor/jelly-mobile/src/physics/soft-body.js';
import {PHYS} from '../../../vendor/jelly-mobile/src/physics/constants.js';
import {Locomotion} from '../../../vendor/jelly-mobile/src/app/locomotion.ts';
import {surfaceGrab,advanceGrabTarget} from '../../../vendor/jelly-mobile/src/physics/grab.ts';
import {BabyFace} from './baby-face.ts';

export const supportedActions=Object.freeze(['observe','jump','dance','rest','trampoline','ball']);
export const JELLY_SOURCE=Object.freeze({project:'Jelly Baby',author:'Scott Sun',url:'https://github.com/scottstts/Jelly-Baby',license:'GPL-3.0-only',originalMesh:true});
const LOOKS={lime:{color:'#c5e79a',attenuation:'#70a645'},strawberry:{color:'#ffc4cf',attenuation:'#d28598'},blueberry:{color:'#bedcfa',attenuation:'#648bc2'}};
let modelPromise;
async function model(){if(!modelPromise)modelPromise=Promise.all([fetch(new URL('../../../vendor/jelly-mobile/src/assets/model/jelly-baby.bin',import.meta.url)),fetch(new URL('../../../vendor/jelly-mobile/src/assets/model/jelly-baby.json',import.meta.url))]).then(async([binary,metadata])=>{if(!binary.ok||!metadata.ok)throw Error('原果冻模型未能加载');return {buffer:await binary.arrayBuffer(),manifest:await metadata.json()}}).catch(e=>{modelPromise=null;throw e});return modelPromise}
const bounded=(n,min,max)=>Math.min(max,Math.max(min,n));

export async function createJelly(flavor='lime'){
 const data=await model(),cage=parseBabyCage(data.buffer.slice(0),data.manifest),body=new SoftBody(cage),rig=new Locomotion(body);
 const root=new THREE.Group();root.name='moya-original-jelly';root.userData={modelId:'jelly',source:JELLY_SOURCE.url,license:JELLY_SOURCE.license,originalMesh:true,interactiveMesh:null};
 const anatomy=new THREE.Group();anatomy.name='original-jelly-anatomy';root.add(anatomy);
 const material=new THREE.MeshPhysicalMaterial({color:LOOKS.lime.color,roughness:.13,metalness:0,transmission:.64,thickness:.8,ior:1.35,attenuationColor:LOOKS.lime.attenuation,attenuationDistance:1.5,clearcoat:.55,clearcoatRoughness:.08,envMapIntensity:1.15,side:THREE.FrontSide});
 const mesh=new THREE.Mesh(body.surface.geometry,material);mesh.name='original-jelly-soft-body';mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;mesh.renderOrder=1;anatomy.add(mesh);root.userData.interactiveMesh=mesh;
 const face=new BabyFace(body,anatomy);body.updateSurface();body.surface.geometry.computeBoundingBox();
 const bounds=body.surface.geometry.boundingBox.clone(),center=bounds.getCenter(new THREE.Vector3()),height=bounds.max.y-bounds.min.y,baseFloorY=bounds.min.y,scale=1.55/height;
 // Normalization is a parent transform only: the FEM solver stays in original SI units.
 anatomy.position.set(-center.x,-bounds.min.y,-center.z);anatomy.scale.setScalar(scale);anatomy.position.multiplyScalar(scale);
 const adornments=new THREE.Group();adornments.name='jelly-growth-and-hat';root.add(adornments);
 const growth=new THREE.Group(),hatRoot=new THREE.Group();adornments.add(growth,hatRoot);
 const green=new THREE.MeshStandardMaterial({color:'#91b65e',roughness:.65}),gold=new THREE.MeshStandardMaterial({color:'#d7bb6d',metalness:.2,roughness:.4,emissive:'#58451e',emissiveIntensity:.09});
 const leaf=new THREE.Group();for(const sign of [-1,1]){const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),green);m.scale.set(.065,.18,.03);m.rotation.z=sign*.55;m.position.set(sign*.075,.1,0);leaf.add(m)}growth.add(leaf);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.018,7,56),gold);ring.rotation.x=Math.PI/2-.18;ring.position.y=.37;growth.add(ring);
 const stars=[-1,1].map(sign=>{const m=new THREE.Mesh(new THREE.OctahedronGeometry(.075),gold);m.position.set(sign*.95,.92,0);growth.add(m);return m});
 let disposed=false,accumulator=0,elapsed=0,action='observe',actionTime=0,danceNext=0,jumpQueued=0,currentHat=null,level=1,releaseTime=1;
 const desired=new THREE.Vector3(),localPoint=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),nearestPoint=new THREE.Vector3(),candidate=new THREE.Vector3(),triangle=new THREE.Triangle();
 let currentGrab=null;

 function setFlavor(id){const look=LOOKS[id]||LOOKS.lime;material.color.set(look.color);material.attenuationColor.set(look.attenuation);root.userData.flavor=Object.hasOwn(LOOKS,id)?id:'lime'}
 function setGrowth(n){level=bounded(Number.isFinite(n)?Math.floor(n):1,1,100);leaf.visible=level>=20;ring.visible=level>=40;stars.forEach(s=>s.visible=level>=70);gold.color.set(level>=100?'#f3cd65':'#d7bb6d');gold.emissiveIntensity=level>=100?.2:.09;root.userData.petLevel=level}
 function disposeGroup(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});group.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
 function setHat(id){if(id===currentHat)return;currentHat=id;disposeGroup(hatRoot);if(!['cap','crown','tophat'].includes(id))return;
  // Runtime simplified hats are authored scene props, not substituted pet meshes.
  const cream=new THREE.MeshStandardMaterial({color:'#e4dec6',roughness:.7}),mint=new THREE.MeshStandardMaterial({color:'#799c60',roughness:.7});
  if(id==='cap'){const top=new THREE.Mesh(new THREE.SphereGeometry(.31,22,12,0,Math.PI*2,0,Math.PI/2),mint);top.scale.y=.62;hatRoot.add(top);const visor=new THREE.Mesh(new THREE.SphereGeometry(.32,20,8),cream);visor.scale.set(1,.07,.8);visor.position.set(0,-.015,.2);hatRoot.add(visor)}
  if(id==='tophat'){const brim=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.045,24),cream),top=new THREE.Mesh(new THREE.CylinderGeometry(.235,.27,.38,24),mint);top.position.y=.2;hatRoot.add(brim,top);const band=new THREE.Mesh(new THREE.CylinderGeometry(.252,.262,.065,24),cream);band.position.y=.075;hatRoot.add(band)}
  if(id==='crown'){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.3,.025,7,24),mint);hoop.rotation.x=Math.PI/2;hatRoot.add(hoop);for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,flower=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),new THREE.MeshStandardMaterial({color:i%2?'#efc0af':'#f5dc96',roughness:.75}));flower.position.set(Math.sin(angle)*.3,.025,Math.cos(angle)*.3);hatRoot.add(flower)}}
  if(id==='crown')cream.dispose();hatRoot.traverse(o=>{if(o.isMesh)o.castShadow=true});
 }
 function play(id){if(disposed||!supportedActions.includes(id)||id==='dance'&&level<60)return false;action=id;actionTime=0;danceNext=0;face.reset();if(id!=='rest')body.wake();if(id==='jump'||id==='ball')jumpQueued=.35;if(id==='trampoline'){actionTime=0;danceNext=.15}if(id==='observe')rig.move.set(0,0,0);return true}
 function worldToBody(point){anatomy.updateWorldMatrix(true,false);return anatomy.worldToLocal(localPoint.copy(point))}
 function grabStart(point){if(disposed||!point||![point.x,point.y,point.z].every(Number.isFinite))return false;grabEnd();const p=worldToBody(point).clone(),positions=body.surface.positions,indices=body.surface.indices;let vertex=-1,best=Infinity;
  for(let i=0;i<positions.length;i+=3){const d=(positions[i]-p.x)**2+(positions[i+1]-p.y)**2+(positions[i+2]-p.z)**2;if(d<best){best=d;vertex=i/3}}
  if(vertex<0||best>.02**2)return false;let found=null;best=Infinity;
  for(let i=0;i<indices.length;i+=3){const ia=indices[i],ib=indices[i+1],ic=indices[i+2];if(ia!==vertex&&ib!==vertex&&ic!==vertex)continue;a.fromArray(positions,ia*3);b.fromArray(positions,ib*3);c.fromArray(positions,ic*3);triangle.set(a,b,c);triangle.closestPointToPoint(p,candidate);const d=candidate.distanceToSquared(p);if(d<best){best=d;nearestPoint.copy(candidate);found={a:ia,b:ib,c:ic}}}
  if(!found)return false;try{currentGrab=surfaceGrab(body,found,nearestPoint)}catch{return false}if(!currentGrab)return false;body.grabs.push(currentGrab);desired.copy(currentGrab.target);body.wake();action='observe';actionTime=0;releaseTime=0;return true;
 }
 function grabMove(point){if(!currentGrab||disposed||!point||![point.x,point.y,point.z].every(Number.isFinite))return;const p=worldToBody(point);desired.copy(p);desired.y=bounded(desired.y,.0003,.145);const lead=desired.clone().sub(currentGrab.point);if(lead.length()>.11)desired.copy(currentGrab.point).add(lead.setLength(.11))}
 function grabEnd(){if(currentGrab){const index=body.grabs.indexOf(currentGrab);if(index>=0)body.grabs.splice(index,1);currentGrab=null;body.wake();releaseTime=0}}
 function update(dtSeconds,timeMs){if(disposed)return;const dt=bounded(Number.isFinite(dtSeconds)?dtSeconds:0,0,.045);elapsed+=dt;actionTime+=dt;releaseTime+=dt;accumulator=Math.min(accumulator+dt,PHYS.step*12);
  if((action==='dance'||action==='trampoline')&&actionTime>=danceNext){jumpQueued=.35;danceNext=actionTime+(action==='dance'?.65:.8)}if(['jump','ball'].includes(action)&&actionTime>1.15)action='observe';if(action==='dance'&&actionTime>4)action='observe';
  let steps=0;while(accumulator>=PHYS.step&&steps<12){if(currentGrab)advanceGrabTarget(currentGrab.target,desired,PHYS.step,currentGrab.point);if(jumpQueued>0){if(body.grounded){rig.jump();jumpQueued=0}else jumpQueued=Math.max(0,jumpQueued-PHYS.step)}rig.step(PHYS.step);body.step(PHYS.step);rig.afterStep();accumulator-=PHYS.step;steps++}
  if(!body.isFinite()){body.reset();rig.reset();currentGrab=null;accumulator=0}
  if(steps&&body.surfaceDirty)body.updateSurface();face.update(dt,action==='dance'||action==='trampoline'||actionTime<.7&&action==='jump',action==='rest');
  const bounds=body.surface.geometry.boundingBox;hatRoot.position.set((body.center.x-center.x)*scale,(bounds.max.y-baseFloorY)*scale-.01,(body.center.z-center.z)*scale);
  leaf.position.set((body.center.x-center.x)*scale,(bounds.max.y-baseFloorY)*scale+.02,(body.center.z-center.z)*scale);stars.forEach((s,i)=>{const t=elapsed*.5+i*Math.PI;s.position.set(Math.cos(t)*.93,.92+Math.sin(t*1.5)*.08,Math.sin(t)*.35)});ring.rotation.z=Math.sin(elapsed*.7)*.025;
  root.userData.dragging=!!currentGrab;root.userData.action=action;root.userData.originalVertexCount=body.surface.positions.length/3;
 }
 function dispose(){if(disposed)return;disposed=true;grabEnd();body.grabs.length=0;const geometry=new Set(),materials=new Set();root.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});geometry.add(cage.opticalSurface.geometry);geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear();root.removeFromParent()}
 setFlavor(flavor);setGrowth(1);face.update(0);update(0,0);
 return {root,update,play,setFlavor,setHat,setGrowth,grabStart,grabMove,grabEnd,dispose,supportedActions,interactiveMesh:mesh,userData:root.userData};
}
