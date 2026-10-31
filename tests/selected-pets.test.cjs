'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../pet-platform-config.js');
const state=(petId,petLevel=1,heroLevel=1,unlocked=[])=>({petId,petLevel,heroLevel,unlocked});
test('selected original robot actions unlock at their own levels; unanimated panther cannot be made to run',()=>{
 for(const id of ['bot-one','bot-two','bot-three']){
  assert.equal(C.canAct(state(id,1),'observe'),true);assert.equal(C.canAct(state(id,2),'jump'),false);assert.equal(C.canAct(state(id,3),'jump'),true);assert.equal(C.canAct(state(id,9),'run'),false);assert.equal(C.canAct(state(id,10),'run'),true);assert.equal(C.capabilities(state(id,10)).find(a=>a.id==='jump').kind,'native');
 }
 assert.equal(C.canAct(state('sharpei',4),'walk'),false);assert.equal(C.canAct(state('sharpei',5),'walk'),true);assert.equal(C.canAct(state('sharpei',9),'sit'),false);assert.equal(C.canAct(state('sharpei',10),'sit'),true);
 for(const id of ['sharpei','panther'])for(const action of ['jump','run','dance'])assert.equal(C.canAct(state(id,100,100,['bed','trampoline','soccer']),action),false);
 assert.deepEqual(C.capabilities(state('panther',100)).map(a=>a.id),['observe']);
});
test('selected model bytes carry original author, license and source, match hashes and declared native clips',()=>{
 const catalogue=require('../assets/selected-pets/manifest.json');
 for(const m of catalogue.models){
  const bytes=fs.readFileSync(m.file);assert.equal(bytes.subarray(0,4).toString(),'glTF');assert.equal(bytes.length,m.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
  const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));assert.match(json.asset.extras.license,/CC-BY-4\.0/);assert.equal(json.asset.extras.source,m.originalSource);assert.ok(json.asset.extras.author);assert.equal(m.modifiedBinary,false);
  for(const variant of catalogue.variants.filter(v=>v.source===m.id))for(const clip of Object.values(C.MODELS[variant.modelId].clips))assert.ok(json.animations.some(a=>a.name===clip),variant.modelId+' missing '+clip);
 }
});
test('actual selected GLBs load with independent skeletons, one robot at a time, finite animation and correct unsupported actions',async()=>{
 // The runner restores all image-loading shims and module hooks in its finally block.
 await import('../design/test-selected-pets.mjs');
});
