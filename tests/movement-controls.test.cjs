'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../pet-platform-config.js');
class Element extends EventTarget{
 constructor(tag,doc){super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.dataset={};this.attributes={};this.disabled=false;this.classes=new Set();this.captures=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)}}
 append(...children){for(const child of children){child.parentElement=this;this.children.push(child)}}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this)}
 contains(el){return this===el||this.children.some(c=>c.contains(el))}
 setAttribute(k,v){this.attributes[k]=String(v)}
 setPointerCapture(id){this.captures.add(id)}hasPointerCapture(id){return this.captures.has(id)}releasePointerCapture(id){this.captures.delete(id)}
}
class Document extends EventTarget{
 constructor(){super();this.defaultView=new EventTarget();this.hidden=false;this.dialog=false;this.body=new Element('body',this)}
 createElement(tag){return new Element(tag,this)}querySelector(){return this.dialog?{}:null}
}
function event(type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,props);return e}
async function setup(petId='bot-one',petLevel=10){
 const {createMovementControls}=await import('../companion-viewer/source/movement-controls.js');
 const doc=new Document(),state={studentId:'test',petId,petLevel,heroLevel:25,unlocked:['bed'],heroXp:100,inventory:{small:2}},position={x:0,y:0,z:0},root={position,rotation:{y:0}},plays=[],requests=[],actor={play:a=>{plays.push(a);return true}};let clock=0,blocked=false;
 const controls=createMovementControls({host:doc.body,current:()=>state,requestAction:(action,meta)=>{requests.push({action,...meta});return 'req-'+requests.length},actorRoot:root,getActor:()=>actor,isBlocked:()=>blocked,now:()=>clock});
 const key=(code,type='keydown')=>doc.dispatchEvent(event(type,{code,key:code.slice(3),shiftKey:false}));
 const ack=()=>{const p=controls.pending;return controls.ack(p.action,{token:p.token,petId:p.petId,requestId:p.requestId})};
 return {controls,doc,state,root,plays,requests,key,ack,setClock:v=>clock=v,block:v=>blocked=v};
}
test('movement cannot start before the actual action acknowledgement, remains bounded and renews only the approved native animation',async()=>{
 const s=await setup('bot-one',2);s.key('KeyW');assert.equal(s.requests.length,0);s.state.petLevel=10;s.controls.refresh();s.key('KeyW');assert.equal(s.requests.length,1);assert.equal(s.requests[0].action,'run');
 for(let i=0;i<30;i++)s.controls.update(1/60);assert.equal(s.root.position.z,0);assert.equal(s.plays.length,0);
 const p=s.controls.pending;assert.equal(s.controls.ack('run',{token:p.token,requestId:'wrong'}),false);assert.equal(s.controls.moving,false);assert.equal(s.ack(),true);
 for(let i=0;i<360;i++)s.controls.update(1/60);
 assert.ok(s.root.position.z<0);assert.ok(Math.hypot(s.root.position.x,s.root.position.z)<=1.25000001);assert.equal(s.requests.length,1);assert.ok(s.plays.filter(a=>a==='run').length>=3);assert.equal(s.state.heroXp,100);assert.deepEqual(s.state.inventory,{small:2});
 s.key('KeyW','keyup');assert.equal(s.controls.moving,false);assert.equal(s.plays.at(-1),'observe');s.controls.dispose();
});
test('quick taps survive delayed server acknowledgement but stop after a short step',async()=>{
 const s=await setup('sharpei',5),pad=s.controls.element.children.find(c=>c.className==='moya-move-pad'),button=pad.children.find(c=>c.dataset.direction==='right');
 button.dispatchEvent(event('pointerdown',{pointerId:7,button:0}));s.setClock(80);s.doc.dispatchEvent(event('pointerup',{pointerId:7}));assert.equal(s.root.position.x,0);assert.equal(s.requests.length,1);assert.equal(s.requests[0].action,'walk');assert.equal(s.ack(),true);
 for(let i=0;i<30;i++)s.controls.update(.02);assert.ok(s.root.position.x>.1&&s.root.position.x<.16);assert.equal(s.controls.moving,false);assert.equal(s.requests.length,1);s.controls.dispose();
});
test('switching to a pet without walking, opening a dialog and hiding the document release pending and active movement',async()=>{
 const s=await setup();s.key('KeyW');const old=s.controls.pending;s.state.petId='panther';s.controls.refresh();assert.equal(s.controls.pending,null);assert.equal(s.controls.ack('run',{token:old.token}),false);s.key('KeyW');assert.equal(s.requests.length,1);
 s.state.petId='bot-one';s.controls.refresh();s.key('KeyW');s.ack();s.controls.update(.05);s.doc.dialog=true;s.controls.update(.05);assert.equal(s.controls.moving,false);
 s.doc.dialog=false;s.controls.refresh();s.key('KeyW');s.ack();s.doc.hidden=true;s.doc.dispatchEvent(event('visibilitychange'));assert.equal(s.controls.moving,false);assert.equal(s.controls.pending,null);s.controls.dispose();assert.equal(s.doc.body.children.length,0);
});
test('late acknowledgements from an earlier key press cannot authorise a later movement request',async()=>{
 const s=await setup();s.key('KeyW');const old=s.controls.pending;s.key('KeyW','keyup');s.key('KeyW');const latest=s.controls.pending;assert.notEqual(old.token,latest.token);assert.equal(s.controls.ack('run',{token:old.token,requestId:old.requestId}),false);s.controls.update(.05);assert.equal(s.root.position.z,0);s.ack();s.controls.update(.05);assert.ok(s.root.position.z<0);s.controls.dispose();
});
