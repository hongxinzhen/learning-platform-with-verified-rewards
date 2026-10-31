// Renderer-free structural and animation QA; images stay as original GLB data.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const url=pathToFileURL(path.resolve('vendor/jelly-mobile/node_modules/three/build/three.module.js')).href;
const hook=registerHooks({resolve(s,c,n){return s==='three'?{url,shortCircuit:true}:n(s,c)}});
const original={fetch:global.fetch,self:global.self,createImageBitmap:global.createImageBitmap,ProgressEvent:global.ProgressEvent};
global.self=globalThis;
global.createImageBitmap=async()=>({width:1,height:1,close(){}});
global.ProgressEvent=class ProgressEvent{constructor(type,props){this.type=type;Object.assign(this,props)}};
global.fetch=async(u,...args)=>{const uri=typeof u==='string'?u:u.url||String(u);return uri.startsWith('file:')?new Response(fs.readFileSync(fileURLToPath(uri))):original.fetch(u,...args)};
try{
 const T=await import(url),{createGLTFActor}=await import('../companion-viewer/source/gltf-actor.js');
 const results=[];
 for(const id of ['cuteRobot1','cuteRobot2','cuteRobot3','sharpei','panther']){
  const actor=await createGLTFActor(id);let meshes=0,skins=0;const names=[],rigRoots=new Set();
  actor.root.traverse(o=>{if(o.isMesh)meshes++;if(o.isSkinnedMesh){skins++;names.push(o.name);rigRoots.add(o.skeleton.bones[0]?.uuid)}});
  assert.ok(meshes>0,id+' has no rendered meshes');
  assert.ok(skins>0,id+' lost its original skeleton');
  const bounds=new T.Box3().setFromObject(actor.root,true),size=bounds.getSize(new T.Vector3());
  assert.ok(Number.isFinite(size.y)&&size.y>.5&&size.y<2,id+' normalization');
  if(id.startsWith('cuteRobot')){assert.equal(rigRoots.size,1,id+' renders more than one robot rig');assert.equal(actor.play('jump'),true);for(let i=0;i<90;i++)actor.update(1/60);assert.equal(actor.play('run'),true)}
  if(id==='sharpei'){assert.equal(actor.play('walk'),true);assert.equal(actor.play('sit'),true);assert.equal(actor.play('run'),false);assert.equal(actor.play('jump'),false)}
  if(id==='panther'){assert.equal(meshes,4,'malformed Sphere/clows overlays must not dominate body bounds');assert.ok(actor.root.getObjectByName('Object_20'),'original panther body retained');assert.ok(actor.root.getObjectByName('Object_12'),'original panther armour retained');assert.equal(actor.play('observe'),true);assert.equal(actor.play('walk'),false);assert.equal(actor.play('run'),false);assert.equal(actor.play('jump'),false)}
  for(let i=0;i<120;i++)actor.update(1/60);
  actor.root.updateMatrixWorld(true);
  if(id==='panther'){const live=new T.Box3().setFromObject(actor.root,true),extent=live.getSize(new T.Vector3());assert.ok(extent.y>.6&&extent.y<1.5,'panther stays body-sized after idle updates');assert.ok(Math.max(extent.x,extent.z)<2.1,'panther footprint stays inside shared view');for(const name of ['Object_12','Object_13','Object_20','Object_21']){const part=actor.root.getObjectByName(name),partExtent=new T.Box3().setFromObject(part,true).getSize(new T.Vector3());assert.ok(Math.max(partExtent.x,partExtent.y,partExtent.z)>.15,name+' collapsed after idle');}}
  actor.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),id+' invalid transform'));
  results.push({id,meshes,skins,names,height:size.y,clips:actor.nativeClips});actor.dispose();assert.equal(actor.root.children.length,0);
 }
 fs.writeFileSync('design/selected-pets-structural-qa.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(({id,meshes,skins,height})=>({id,meshes,skins,height})),null,2));
}finally{Object.assign(global,original);hook.deregister()}
