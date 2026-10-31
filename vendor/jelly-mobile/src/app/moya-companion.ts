// MoYa unlockable companion integration. GPL-3.0-only, based on Jelly Baby.
import * as T from 'three/webgpu';
import type { SoftBody } from '../physics/soft-body.js';
import type { Baby } from '../graphics/character/baby.ts';
import { JELLY_FLAVORS, type JellyFlavorName } from '../graphics/character/jelly-flavors.ts';
import type { Locomotion } from './locomotion.ts';
import type { Input } from './input.ts';
import type { JellySound } from './sound.ts';
import type { RefractiveLightField } from '../graphics/optics/refractive-light.js';
import type { FacilityShadows } from '../facilities/shadows.ts';
import { BedFacility } from '../worlds/main/facilities/bed/facility.ts';
import { BED } from '../worlds/main/facilities/bed/physics.ts';
import { TrampolineFacility } from '../worlds/main/facilities/trampoline/facility.ts';
import { TRAMPOLINE } from '../worlds/main/facilities/trampoline/physics.ts';
import { WearableTable } from '../worlds/main/facilities/wearable/graphics.ts';
import { WearablePhysics, type HeadWearableIndex } from '../worlds/main/facilities/wearable/physics.ts';
import { warmMainScenePipelines } from '../graphics/scene/render-warmup.ts';

type State={heroLevel:number;petLevel:number;petId:string;flavor:JellyFlavorName;hat:string|null;scene:string;activity:string;unlocked:string[];sound:boolean;volume:number;paused:boolean;animation:boolean};
export class MoyaCompanion {
  paused=false;switching=false;
  private state:State={heroLevel:1,petLevel:1,petId:'lime',flavor:'lime',hat:null,scene:'home',activity:'idle',unlocked:[],sound:false,volume:.35,paused:false,animation:true};
  private abort=new AbortController();
  private bedRoot=new T.Scene();private trampolineRoot=new T.Scene();private garden=new T.Group();
  private bed:BedFacility;private trampoline:TrampolineFacility;private hats=new WearableTable();private hatPhysics:WearablePhysics;
  private hatIndex:HeadWearableIndex|null=null;
  private growth=new T.Group();private leaf=new T.Group();private ring:T.Mesh;private stars:T.Mesh[]=[];
  private feedOrb=new T.Group();private feedTime=-1;private feedDuration=1.4;
  private time=0;private danceTime=0;private nextHop=0;
  private ball:T.Mesh|undefined;private stadium:{group:T.Group;setScore:(n:number)=>void;dispose:()=>void}|undefined;
  private kickTime=-1;private score=0;private viewScene='home';private sceneRevision=0;
  private pos=new T.Vector3();private rot=new T.Quaternion();
  private scene:T.Scene;private camera:T.PerspectiveCamera;private renderer:T.WebGPURenderer;private body:SoftBody;private baby:Baby;private rig:Locomotion;private input:Input;private sound:JellySound;private optics:RefractiveLightField;
  constructor(scene:T.Scene,camera:T.PerspectiveCamera,renderer:T.WebGPURenderer,body:SoftBody,baby:Baby,rig:Locomotion,input:Input,sound:JellySound,optics:RefractiveLightField,shadows:FacilityShadows){
    this.scene=scene;this.camera=camera;this.renderer=renderer;this.body=body;this.baby=baby;this.rig=rig;this.input=input;this.sound=sound;this.optics=optics;
    this.bed=new BedFacility(this.bedRoot,body,shadows);this.trampoline=new TrampolineFacility(this.trampolineRoot,body,shadows,sound.facility);
    scene.add(this.bedRoot,this.trampolineRoot,this.garden,this.growth,this.feedOrb);this.bedRoot.visible=this.trampolineRoot.visible=this.garden.visible=false;
    this.hatPhysics=new WearablePhysics(body);scene.add(this.hats.group);this.hats.group.visible=false;
    const green=new T.MeshStandardMaterial({color:'#94b86d',roughness:.4}),gold=new T.MeshStandardMaterial({color:'#e7ca79',metalness:.3,roughness:.3,emissive:'#796326',emissiveIntensity:.12});
    for(const side of [-1,1]){const l=new T.Mesh(new T.SphereGeometry(1,12,10),green);l.scale.set(.0035,.011,.0028);l.rotation.z=side*.6;l.position.set(side*.004,.004,0);this.leaf.add(l)}
    this.growth.add(this.leaf);this.ring=new T.Mesh(new T.TorusGeometry(.047,.0014,8,56),gold);this.ring.rotation.x=Math.PI/2-.23;this.growth.add(this.ring);
    for(let i=0;i<2;i++){const star=new T.Mesh(new T.OctahedronGeometry(.0033),gold);this.stars.push(star);this.growth.add(star)}
    const fruit=new T.Mesh(new T.SphereGeometry(.007,20,16),new T.MeshStandardMaterial({color:'#c5de86',roughness:.3}));fruit.name='fruit';this.feedOrb.add(fruit);const stem=new T.Mesh(new T.SphereGeometry(.002,8,8),green);stem.scale.set(1,2,1);stem.position.y=.008;stem.rotation.z=.5;this.feedOrb.add(stem);this.feedOrb.visible=false;
    this.makeGarden();this.applyGrowth();
    input.bodyControlled=()=>this.controlled;input.facilityCameraDistance=()=>this.bed.active ? .26 : this.trampoline.active ? .3 : undefined;
    rig.onJump=()=>{this.hatPhysics.jumpFromNormalLocomotion();if(this.viewScene==='soccer')this.kick()};
    window.addEventListener('message',this.receive,{signal:this.abort.signal});
  }
  get controlled(){return this.bed.active||this.trampoline.active}
  get sleeping(){return this.bed.active}
  get playing(){return this.trampoline.laughing||this.danceTime>0||this.feedTime>=0}
  private post(message:object){if(window.parent!==window)window.parent.postMessage(message,location.origin)}
  private status(text:string){this.post({type:'moya:status',text})}
  private receive=(e:MessageEvent)=>{
    if(e.source!==window.parent||e.origin!==location.origin||!e.data||typeof e.data.type!=='string')return;
    const d=e.data;
    if(d.type==='moya:state'){
      if(!Number.isInteger(d.heroLevel)||d.heroLevel<1||d.heroLevel>100000||!Number.isInteger(d.petLevel)||d.petLevel<1||d.petLevel>100||!Array.isArray(d.unlocked)||!(d.flavor in JELLY_FLAVORS))return;
      const next:State={heroLevel:d.heroLevel,petLevel:d.petLevel,petId:String(d.petId),flavor:d.flavor,hat:d.hat,scene:['home','garden','soccer'].includes(d.scene)?d.scene:'home',activity:['idle','bed','trampoline','dance','kick'].includes(d.activity)?d.activity:'idle',unlocked:d.unlocked.filter((v:unknown)=>typeof v==='string'),sound:!!d.sound,volume:Math.min(1,Math.max(0,Number(d.volume)||0)),paused:!!d.paused,animation:d.animation!==false};
      if(next.scene==='garden'&&(next.heroLevel<15||!next.unlocked.includes('garden')))next.scene='home';if(next.scene==='soccer'&&(next.heroLevel<20||!next.unlocked.includes('soccer')))next.scene='home';
      if(next.hat&&!next.unlocked.includes(next.hat))next.hat=null;
      const changedPet=this.state.petId!==next.petId,changedScene=this.state.scene!==next.scene,changedActivity=this.state.activity!==next.activity;
      this.state=next;this.paused=next.paused;if(next.paused)this.sound.stopFacilities();
      if(this.sound.muted===next.sound)this.sound.toggle();this.sound.setVolume(next.volume);
      document.querySelector('#sound')!.textContent=next.sound?'声音开':'声音关';document.querySelector('#sound')!.setAttribute('aria-pressed',String(!next.sound));
      this.baby.setFlavor(next.flavor);this.optics.setAbsorption(JELLY_FLAVORS[next.flavor].absorption);this.applyHat();this.applyGrowth();
      if(changedPet||changedScene||changedActivity){if(changedPet||changedScene)this.resetInteraction();void this.applyScene(next.scene).then(()=>{if(this.state.scene===next.scene)this.applyActivity(next.activity)}).catch(err=>this.post({type:'moya:error',message:String(err)}))}
    }
    if(d.type==='moya:feed'&&(!d.petId||d.petId===this.state.petId))this.feed(String(d.food));
    if(d.type==='moya:jump'&&!this.controlled){void this.sound.unlock().catch(()=>{});this.rig.jump()}
    if(d.type==='moya:action'){if(d.action==='kick'&&this.viewScene==='soccer')this.kick();if(d.action==='dance'&&this.state.petLevel>=60){this.danceTime=4;this.nextHop=0}}
  };
  private applyHat(){const index=({cap:2,crown:0,tophat:1} as Record<string,HeadWearableIndex>)[this.state.hat||'']??null;if(index===this.hatIndex)return;if(this.hatIndex!==null)this.hats.setOnTable(this.hatIndex);this.hatIndex=index;this.hatPhysics.wornIndex=index;if(index!==null)this.hats.setWorn(index,this.baby.group)}
  private applyGrowth(){const l=this.state.petLevel;this.leaf.visible=l>=20;this.ring.visible=l>=40;this.stars.forEach(s=>s.visible=l>=70);const mat=this.ring.material as T.MeshStandardMaterial;mat.color.set(l>=100?'#ffd768':'#d3c495');mat.emissiveIntensity=l>=100?.3:.12}
  private place(x:number,z:number){this.body.reset();for(let j=0;j<this.body.x.length;j+=3){this.body.x[j]+=x;this.body.x[j+2]+=z}this.body.previous.set(this.body.x);this.body.updateCenter();this.body.updateSurface();this.body.grounded=true;this.rig.reset();this.input.teleport()}
  resetInteraction(){this.bed.reset();this.trampoline.reset();this.bedRoot.visible=this.trampolineRoot.visible=false;this.body.reset();this.rig.reset();this.input.controls.minDistance=.135;this.input.controls.maxDistance=this.viewScene==='soccer'?.75:.48;this.camera.position.copy(this.body.center).add(this.viewScene==='soccer'?new T.Vector3(.19,.27,.37):new T.Vector3(.09,.11,.19));this.input.controls.target.copy(this.body.center);this.input.controls.update();this.input.teleport();this.baby.resetFace();this.feedTime=-1;this.feedOrb.visible=false;this.danceTime=0}
  private async applyScene(id:string){this.garden.visible=id==='garden';if(id===this.viewScene)return;this.viewScene=id;const revision=++this.sceneRevision;
    if(id==='soccer'&&!this.stadium){this.switching=true;this.status('正在准备迷你足球场…');try{const {SoccerStadium,soccerBallGeometry,soccerBallMaterial}=await import('../worlds/soccer/stadium.ts');if(this.abort.signal.aborted)return;this.stadium=new SoccerStadium();this.stadium.group.scale.setScalar(.18);this.scene.add(this.stadium.group);this.stadium.group.visible=this.state.scene==='soccer';this.ball=new T.Mesh(soccerBallGeometry(),soccerBallMaterial());this.ball.scale.setScalar(.65);this.scene.add(this.ball);this.ball.visible=this.state.scene==='soccer';await warmMainScenePipelines(this.renderer,this.scene,this.camera)}finally{this.switching=false}}
    if(revision!==this.sceneRevision)return;if(this.stadium)this.stadium.group.visible=id==='soccer';if(this.ball){this.ball.visible=id==='soccer';this.ball.position.set(.035,.016,0)}
    this.camera.position.copy(this.body.center).add(id==='soccer'?new T.Vector3(.19,.27,.37):new T.Vector3(.09,.11,.19));this.input.controls.target.copy(this.body.center);this.input.controls.maxDistance=id==='soccer'?.75:.48;this.input.controls.update();this.status(id==='soccer'?'迷你球场 · 点击「玩一会儿」踢球':id==='garden'?'林间花园 · 拖动拉伸，轻点跳跃':'拖动拉伸 · 轻点跳跃');
  }
  private applyActivity(id:string){if(id==='idle'){this.resetInteraction();return}if(id==='bed'&&this.state.heroLevel>=5&&this.state.unlocked.includes('bed')&&this.state.scene==='home'){
      if(this.bed.active)return;this.resetInteraction();this.bedRoot.visible=true;this.place(BED.x,BED.z);this.bed.interact();this.input.teleport();this.status('正在小床上休息 ·「玩一会儿」可结束')
    }else if(id==='trampoline'&&this.state.heroLevel>=10&&this.state.unlocked.includes('trampoline')&&this.state.scene==='home'){
      if(this.trampoline.active)return;this.resetInteraction();this.trampolineRoot.visible=true;this.place(TRAMPOLINE.x,TRAMPOLINE.z);this.trampoline.interact();this.input.teleport();this.status('蹦一蹦 ·「玩一会儿」可结束')
    }else if(id==='dance'&&this.state.petLevel>=60){this.danceTime=4;this.nextHop=0}else if(id==='kick'&&this.viewScene==='soccer')this.kick();
  }
  private makeGarden(){const green=new T.MeshStandardMaterial({color:'#9fb681',roughness:.7}),stone=new T.MeshStandardMaterial({color:'#d8cdb5',roughness:.8}),pink=new T.MeshStandardMaterial({color:'#e8b8ae'});for(let i=0;i<10;i++){const angle=i/10*Math.PI*2,r=.12+(i%3)*.023,plant=new T.Group();plant.position.set(Math.sin(angle)*r,0,Math.cos(angle)*r);const rock=new T.Mesh(new T.SphereGeometry(.014,12,8),stone);rock.scale.set(1,.4,.8);plant.add(rock);for(let k=0;k<3;k++){const leaf=new T.Mesh(new T.SphereGeometry(.005,8,6),green);leaf.scale.set(1,4,1);leaf.position.set((k-1)*.005,.018,0);leaf.rotation.z=(k-1)*-.4;plant.add(leaf)}if(i%2===0){const flower=new T.Mesh(new T.SphereGeometry(.007,10,8),pink);flower.position.y=.04;plant.add(flower)}this.garden.add(plant)}}
  feed(key:string){if(!this.state.animation){this.status('果实已投喂，伙伴经验已增加');return}const colors:Record<string,string>={small:'#b9d980',medium:'#edb16c',rare:'#b69bdc',legend:'#f1d26b',developer:'#b8dfaa'};((this.feedOrb.getObjectByName('fruit') as T.Mesh).material as T.MeshStandardMaterial).color.set(colors[key]||colors.small);this.feedTime=0;this.feedOrb.visible=true;this.status('啊呜，吃到成长果实啦！')}
  private kick(){if(this.kickTime>=0||!this.ball)return;this.kickTime=0;this.status('看我的射门！')}
  beforeStep(h:number){this.hatPhysics.step(h);if(this.bed.active)this.bed.step(h);if(this.trampoline.active)this.trampoline.step(h)}
  afterStep(){if(this.bed.active)this.bed.afterStep();if(this.trampoline.active)this.trampoline.afterStep()}
  update(dt:number){this.time+=dt;if(this.bedRoot.visible)this.bed.update();if(this.trampolineRoot.visible)this.trampoline.update();
    if(this.hatIndex!==null){this.hatPhysics.headPlacement(this.hatIndex,this.pos,this.rot);this.hats.updateWorn(this.hatIndex,this.pos,this.rot)}
    const c=this.body.center;this.growth.position.copy(c);this.leaf.position.set(-.027,.027,0);this.ring.rotation.z=Math.sin(this.time*.5)*.12;this.stars.forEach((s,i)=>{const a=this.time*.7+i*Math.PI;s.position.set(Math.cos(a)*.052,.024+Math.sin(a*2)*.009,Math.sin(a)*.052);s.rotation.y=a});
    if(this.feedTime>=0){this.feedTime+=dt;const t=Math.min(1,this.feedTime/this.feedDuration);this.feedOrb.position.set(c.x+(1-t)*.055,c.y+.018+Math.sin(t*Math.PI)*.045,c.z+.035*(1-t));this.feedOrb.scale.setScalar(Math.max(.05,1-Math.max(0,t-.75)*3));if(t===1){this.feedTime=-1;this.feedOrb.visible=false;this.status('谢谢你的投喂 · 伙伴又成长了一点')}}
    if(this.danceTime>0){this.danceTime-=dt;this.nextHop-=dt;if(this.nextHop<=0&&!this.controlled){this.rig.jump();this.nextHop=.9}}
    if(this.kickTime>=0&&this.ball){this.kickTime+=dt;const t=Math.min(1,this.kickTime/1.3);this.ball.position.set(.035*(1-t),.016+Math.sin(t*Math.PI)*.055,-.269*t);this.ball.rotation.x-=dt*10;if(this.kickTime>=1.3&&this.kickTime-dt<1.3){this.stadium?.setScore(++this.score);this.status('进球啦！第 '+this.score+' 球')}if(this.kickTime>2.8){this.kickTime=-1;this.ball.position.set(.035,.016,0)}}
  }
  dispose(){this.abort.abort();this.bed.dispose();this.trampoline.dispose();this.hats.dispose();this.stadium?.dispose();this.ball?.geometry.dispose();if(this.ball)(this.ball.material as T.Material).dispose();for(const root of [this.garden,this.growth,this.feedOrb])root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}})}
}
