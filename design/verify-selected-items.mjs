// Structural GLTF + real animation interpolation test; image pixels are NOT decoded here.
import fs from 'node:fs';
import * as THREE from '../vendor/jelly-mobile/node_modules/three/build/three.module.js';
import {createSelectedItemLoader} from '../item-viewer/source/material-compat.js';
globalThis.self=globalThis;
globalThis.ProgressEvent??=class ProgressEvent extends Event{constructor(type,p={}){super(type);Object.assign(this,p)}};
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const rows=JSON.parse(fs.readFileSync('assets/selected-items/download-results.json','utf8')),out=[];
for(const row of rows){
 const runtimePath=row.key==='game-badge'?'assets/selected-items/game-badge/model-mobile.glb':row.local;
 const b=fs.readFileSync(runtimePath),gltf=await createSelectedItemLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 gltf.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
 if(![size.x,size.y,size.z].every(Number.isFinite)||Math.max(size.x,size.y,size.z)<=0)throw Error(row.key+' invalid bounds');
 let meshCount=0,morphCount=0,colorTextureMappedMeshes=0;gltf.scene.traverse(o=>{if(o.isMesh){meshCount++;if((Array.isArray(o.material)?o.material:[o.material]).some(m=>m.map||m.emissiveMap))colorTextureMappedMeshes++}if(o.morphTargetInfluences)morphCount+=o.morphTargetInfluences.length});
 if(row.key==='potion-rudolfs'&&!colorTextureMappedMeshes)throw Error('Legacy hand-painted potion lost its original colored emissive texture');
 const clips=gltf.animations.map(a=>({name:a.name,duration:a.duration,tracks:a.tracks.length}));
 let morphChanged=false;
 if(row.key==='sands-of-time'){
  const clip=gltf.animations.find(a=>a.name==='Sand Animation');if(!clip)throw Error('Actual sand clip missing');
  const mixer=new THREE.AnimationMixer(gltf.scene);mixer.clipAction(clip).play();
  const weights=()=>{const vals=[];gltf.scene.traverse(o=>{if(o.morphTargetInfluences)vals.push(...o.morphTargetInfluences)});return vals};
  mixer.setTime(0);const a=weights();mixer.setTime(2.5);const z=weights();morphChanged=a.some((v,i)=>Math.abs(v-z[i])>1e-4);if(!morphChanged)throw Error('Sand morph weights did not animate');mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);
 }
 out.push({key:row.key,runtimePath,actualLoaderParsed:true,meshCount,morphCount,colorTextureMappedMeshes,size:[size.x,size.y,size.z],animations:clips,morphChanged,imagePixelsDecoded:false});
 console.log(row.key,meshCount,'meshes',clips.map(a=>a.name).join(','),morphChanged?'sand weights changed':'');
}
fs.writeFileSync('design/selected-items-loader-verification-2026-10-30.json',JSON.stringify(out,null,2));
console.log('PASS',out.length,'genuine GLBs parsed; sand native morph interpolation verified. Browser texture/visual verification remains separate.');
