/* Actual selected CC BY models; provenance is retained under assets/selected-*. */
import * as THREE from 'three';
import {GLTFLoader} from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
const islandURL=new URL('../../assets/selected-worlds/floating-island/model.glb',import.meta.url).href;
const crystalURL=new URL('../../assets/selected-items/crystal/model.glb',import.meta.url).href;
export async function loadSelectedCrystal(){
 const gltf=await new GLTFLoader().loadAsync(crystalURL),body=gltf.scene,box=new THREE.Box3().setFromObject(body),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 body.position.sub(center);body.scale.setScalar(.32/Math.max(size.x,size.y,size.z));body.position.multiplyScalar(body.scale.x);
 const root=new THREE.Group();root.name='original-selected-crystal';root.add(body);root.visible=false;
 const originals=[];body.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of Array.isArray(o.material)?o.material:[o.material])originals.push({m,color:m.color?.clone(),emissive:m.emissive?.clone()})}});
 return {root,setTier(key){const t={small:'#d5b2f3',medium:'#85d6bc',rare:'#8ab5f5',legend:'#f1d477'}[key]||'#fff';for(const x of originals){if(x.color)x.m.color.copy(x.color).multiply(new THREE.Color(t));if(x.emissive)x.m.emissive.copy(x.emissive).multiply(new THREE.Color(t))}}};
}
export async function loadSelectedIsland(){
 const gltf=await new GLTFLoader().loadAsync(islandURL),root=gltf.scene,box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const norm=new THREE.Group();norm.name='selected-JavierG-floating-island';norm.add(root);root.position.sub(center);norm.scale.setScalar(5.8/Math.max(size.x,size.z));norm.position.set(0,-1.05,-.6);
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});norm.visible=false;return norm;
}

const foodURLs={small:new URL('../../assets/selected-items/food-burger/model.glb',import.meta.url).href,medium:new URL('../../assets/selected-items/food-pizza/model.glb',import.meta.url).href,rare:new URL('../../assets/selected-items/food-croissant/model.glb',import.meta.url).href,legend:new URL('../../assets/selected-items/food-cake/model.glb',import.meta.url).href};
export async function loadSelectedFoods(){const result={};await Promise.all(Object.entries(foodURLs).map(async([key,url])=>{const gltf=await new GLTFLoader().loadAsync(url),body=gltf.scene,bounds=new THREE.Box3().setFromObject(body),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=.6/Math.max(size.x,size.y,size.z);body.position.sub(center).multiplyScalar(scale);body.scale.setScalar(scale);const root=new THREE.Group();root.name='feeding-food-'+key;root.add(body);root.visible=false;result[key]=root}));return result}
