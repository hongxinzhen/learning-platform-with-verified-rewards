/* MoYa local reward domain. All mutations are persisted atomically by the UI. */
(function(root){
 'use strict';
 const ACH_DATA=typeof module!=='undefined'&&module.exports?require('./achievement-data.js'):root.MoyaAchievementData;
 const ACHIEVEMENT_SERIES=ACH_DATA.SERIES,ACHIEVEMENT_CATEGORIES=ACH_DATA.CATEGORIES;
 const FOODS={small:{name:'香香汉堡',xp:50,color:'#a6bf65'},medium:{name:'元气披萨',xp:200,color:'#eda85b'},rare:{name:'奶香牛角包',xp:1000,color:'#ac8bcf'},legend:{name:'庆祝蛋糕',xp:3000,color:'#d9b34f'}};
 const GRADES={'C':0,'C+':5,'B':10,'B+':15,'A':20,'A+':25};
 const CATALOG=[
  {id:'cap',name:'出发棒球帽',kind:'装扮',track:'pet',level:5,desc:'一顶柔软的绿色棒球帽。戴上后，它会跟着果冻的拉伸和跳跃一起晃动。'},
  {id:'bed',name:'云朵小床',kind:'设施',track:'hero',level:5,desc:'练习之后，陪芽芽躺进小床。它会闭上眼睛，在柔软的小被子下面轻轻呼吸。'},
  {id:'trampoline',name:'弹弹蹦床',kind:'设施',track:'hero',level:10,desc:'让果冻坐上真正有弹性的蹦床，看它越跳越开心。随时可以回到小屋。'},
  {id:'sprout',name:'花叶初长',kind:'形态',track:'pet',level:20,desc:'这只伙伴长出第一枚花叶印记，自动展示在身体旁边。每只宠物独立成长。'},
  {id:'crown',name:'春日花冠',kind:'装扮',track:'pet',level:20,desc:'由花朵和藤叶编成的花冠。和棒球帽二选一佩戴，拖动时会跟随头部运动。'},
  {id:'garden',name:'林间花园',kind:'场景',track:'hero',level:15,desc:'把小屋换成一片小花园。草叶、圆石与花朵围住果冻，拖动仍然可以拉伸它。'},
  {id:'soccer',name:'迷你足球场',kind:'场景',track:'hero',level:20,desc:'原项目球场缩成伙伴的迷你球场。点击踢球按钮射门，看看足球飞向球门。此版不提供自由行走。'},
  {id:'bloom',name:'星环成长',kind:'形态',track:'pet',level:40,desc:'这只宠物拥有一圈温暖的成长星环；与花叶印记共同构成第二阶段的外观。'},
  {id:'pet2',name:'第二位伙伴',kind:'领养',track:'hero',level:25,desc:'确定获得领养资格。可以从伙伴图鉴中选择一位新朋友，之后同样用食物独立培养。'},
  {id:'tophat',name:'小小魔术师',kind:'装扮',track:'hero',level:30,desc:'一顶精致的礼帽。已经解锁的装扮归账号收藏，可以给其他伙伴佩戴。'},
  {id:'expressions',name:'开心舞步',kind:'动作',track:'pet',level:60,desc:'解锁专属开心舞步，点击后果冻会连续轻跳，身边浮起小星星。'},
  {id:'stellar',name:'星光伙伴',kind:'形态',track:'pet',level:70,desc:'花叶印记、星环之外，新增两颗绕身星光，成为第三阶段的成长展示。'},
  {id:'mature',name:'满级纪念',kind:'形态',track:'pet',level:100,desc:'成熟伙伴获得金色纪念光环。达到满级后仍可互动，食物可留给其他伙伴。'}
 ];
 const ACHIEVEMENTS=[{id:'first',name:'第一笔成长',desc:'完成1份每日作业',count:1,type:'daily',xp:20,food:'small',amount:1},{id:'week',name:'七次认真',desc:'累计完成7份每日作业，无需连续',count:7,type:'daily',xp:50,food:'medium',amount:1},{id:'month',name:'三十次坚持',desc:'累计完成30份每日作业',count:30,type:'daily',xp:100,food:'rare',amount:1},{id:'libai1',name:'诗仙的第一封信',desc:'老师确认1幅李白诗词作品',count:1,type:'libai',xp:50,food:'medium',amount:1},{id:'libai5',name:'小小诗仙',desc:'老师确认5幅李白诗词作品',count:5,type:'libai',xp:150,food:'rare',amount:1}];
 const fail=m=>{throw Error(m)};
 function integer(v,min=0,max=1000000){if(!Number.isSafeInteger(v)||v<min||v>max)fail('请输入范围内的整数');return v}
 function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)fail('日期无效');return v}
 function addDays(v,n){const d=new Date(date(v)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
 function week(v){const d=new Date(date(v)+'T12:00:00Z');return addDays(v,-((d.getUTCDay()+6)%7))}
 function heroCost(l){return 100+30*(l-1)}
 function heroTotal(l){const n=l-1;return 100*n+15*n*(n-1)}
 function heroLevel(x){let l=Math.max(1,Math.floor((-85+Math.sqrt(7225+60*x))/30)+1);while(heroTotal(l+1)<=x)l++;while(heroTotal(l)>x)l--;return l}
 function petCost(l){return l<100?100+15*(l-1):0}
 function petTotal(l){return 100*(l-1)+15*(l-1)*(l-2)/2}
 function petLevel(x){let l=1;while(l<100&&petTotal(l+1)<=x)l++;return l}
 function fresh(today){date(today);const s={version:3,enrolled:today,today,heroXp:0,pets:[{id:'lime',name:'芽芽',flavor:'lime',xp:0,hat:null}],selected:'lime',inventory:{small:0,medium:0,rare:0,legend:0,makeup:0,xpCard:0,renameCard:1},renameRevision:1,armed:false,tasks:{},attendance:[],achievements:[],unlocked:[],scene:'home',activity:'idle',events:[],settings:{sound:true,volume:.35,animation:true},dev:true};upgradeAchievements(s);return s}
 function active(s){return s.pets.find(p=>p.id===s.selected)||s.pets[0]}
 function streak(s,d){let n=0;for(let x=d;s.tasks[x];x=addDays(x,-1))n++;return n}
 function currentStreak(s){return streak(s,s.tasks[s.today]?s.today:addDays(s.today,-1))}
 function base(s,d){return Math.min(200,100+10*streak(s,addDays(d,-1)))}
 function unlocked(s,item){return item.track==='hero'?heroLevel(s.heroXp)>=item.level:s.pets.some(p=>petLevel(p.xp)>=item.level)}
 function available(s,item){return item.track==='pet'&&['形态','动作'].includes(item.kind)?petLevel(active(s).xp)>=item.level:s.unlocked.includes(item.id)}
 function displayProgress(s,item){return item.track==='pet'&&['形态','动作'].includes(item.kind)?petLevel(active(s).xp):progress(s,item)}
 function progress(s,item){return item.track==='hero'?heroLevel(s.heroXp):Math.max(...s.pets.map(p=>petLevel(p.xp)))}
 function syncUnlocks(s,e){for(const item of CATALOG)if(unlocked(s,item)&&!s.unlocked.includes(item.id)){s.unlocked.push(item.id);e.unlocks.push(item.id)}}
 function event(){return {xp:0,foods:{},heroLevels:[],petLevels:[],unlocks:[],cards:{},message:''}}
 function inventory(s,key,n,e){integer(n);if(!Object.hasOwn(s.inventory,key))fail('未知道具');s.inventory[key]+=n;if(e){const target=FOODS[key]?e.foods:e.cards;target[key]=(target[key]||0)+n}}
 function levelPack(l){integer(l,1);return l===1?{}:{small:2,medium:1+Math.floor((l-2)/10),...(l%5===0?{xpCard:1}:{}),...(l%10===0?{makeup:1,renameCard:1}:{})}}
 function awardXp(s,n,e){integer(n);const before=heroLevel(s.heroXp);s.heroXp+=n;e.xp+=n;for(let l=before+1;l<=heroLevel(s.heroXp);l++){e.heroLevels.push(l);for(const [key,n] of Object.entries(levelPack(l)))inventory(s,key,n,e)}syncUnlocks(s,e)}
 function trace(s,e,label){s.events.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:s.today,label,xp:e.xp,foods:{...e.foods},cards:{...e.cards},heroLevels:[...e.heroLevels],petLevels:[...e.petLevels],unlocks:[...e.unlocks],feed:e.feed||null,consumed:e.consumed||{},achievement:e.achievement||null});s.events=s.events.slice(0,150);syncAchievements(s,{test:label.startsWith('开发者')});return e}
 function evidence(value,debug){if(!debug&&(!value||!/^data:image\/(jpeg|png|webp);base64,/.test(value)))fail('请先上传这一天的练习照片');return value||null}
 function claim(s,{day=s.today,image=null,category='regular',extra=false,debug=false}={}){date(day);if(day>s.today)fail('不能提前完成未来的作业');if(day<s.enrolled)fail('只能提交入学后的任务');if(!['regular','libai','dufu','wangwei','baijuyi','card'].includes(category))fail('任务分类无效');evidence(image,debug);const e=event();e.submission=true;
  if(extra){if(day!==s.today||!s.tasks[day])fail('先完成今天的每日作业，再提交额外作业');if(s.tasks[day].extra)fail('这一天的额外作业已经领取过奖励');s.tasks[day].extra={image,at:s.today,xp:40};awardXp(s,40,e);inventory(s,'small',1,e);return trace(s,e,day+' 额外作业')}
  if(s.tasks[day])fail('这一天已完成，不能重复领取');const makeup=day<s.today;if(makeup&&s.inventory.makeup<1)fail('需要一张补签卡');const settledBase=base(s,day),card=s.armed?50:0;if(makeup)s.inventory.makeup--;if(s.armed)s.armed=false;
  e.consumed={...(makeup?{makeup:1}:{}),...(card?{xpCard:1}:{})};s.tasks[day]={image:image||null,category,submittedAt:s.today,makeup,debug:!!debug,baseXp:settledBase,cardXp:card,grade:null,gradeXp:0,comment:'',voice:null,extra:null};awardXp(s,settledBase+card,e);inventory(s,'small',2,e);return trace(s,e,(debug?'开发者模拟 · ':'')+day+(makeup?' 补签作业':' 每日作业'))}
 function review(s,day,grade,comment='',voice=null){const task=s.tasks[day];if(!task)fail('找不到这份作业');if(task.grade!==null)fail('这份作业已点评，不能重复发奖');if(!Object.hasOwn(GRADES,grade))fail('评价档位无效');task.grade=grade;task.reviewedAt=s.today;task.gradeXp=GRADES[grade];task.comment=String(comment).slice(0,1000);task.voice=voice;const e=event();awardXp(s,task.gradeXp,e);return trace(s,e,day+' 教师点评 '+grade)}
 function attend(s,id,day=s.today){date(day);if(day>s.today||day<s.enrolled)fail('课程日期不在有效范围');if(!id||id.length>100)fail('请输入课时标识');if(s.attendance.some(a=>a.id===id))fail('这个课时已经记录');const count=s.attendance.filter(a=>week(a.day)===week(day)).length;if(count>=3)fail('本周已记录3节奖励课程');const e=event(),xp=[100,200,300][count],food=[2,3,4][count];s.attendance.push({id,day,xp,food});awardXp(s,xp,e);inventory(s,'small',food,e);return trace(s,e,'本周第'+(count+1)+'节课程')}
 function arm(s){if(s.armed)fail('经验卡已经启用，无需重复使用');if(s.inventory.xpCard<1)fail('经验卡不足');s.inventory.xpCard--;s.armed=true}
 function cancelArm(s){if(s.armed){s.inventory.xpCard++;s.armed=false}}
 function upgradeRenameCards(s){
  if(s.renameRevision===1)return false;
  if(s.renameRevision!==undefined)fail('改名卡档案版本无效');
  if(!s.inventory||typeof s.inventory!=='object')fail('背包档案缺失');
  if(s.inventory.renameCard===undefined)s.inventory.renameCard=1;
  integer(s.inventory.renameCard,0,10000000);s.renameRevision=1;return true;
 }
 function renamePet(s,petId,value){
  upgradeRenameCards(s);const p=s.pets.find(p=>p.id===petId);if(!p)fail('找不到这位已领养的伙伴');
  if(typeof value!=='string')fail('请输入伙伴的新名字');
  const name=value.trim().normalize('NFC');
  if(Array.from(name).length<1||Array.from(name).length>12||/[<>\p{C}\u2028\u2029]/u.test(name))fail('伙伴名字需1–12个字，不能包含特殊控制符或尖括号');
  const e=event();if(name===p.name){e.renamed={petId:p.id,name,changed:false};return e}
  if(s.inventory.renameCard<1)fail('需要一张改名卡');
  s.inventory.renameCard--;const previous=p.name;p.name=name;e.consumed={renameCard:1};e.renamed={petId:p.id,name,previous,changed:true};
  return trace(s,e,'伙伴改名 · '+previous+' → '+name);
 }
 function feed(s,key,count=1){integer(count,1,99);if(!Object.hasOwn(FOODS,key))fail('不是可投喂的食物');if(s.inventory[key]<count)fail('食物数量不足');const p=active(s),before=petLevel(p.xp);if(before===100)fail('这只伙伴已满级，请把食物留给其他伙伴');const value=FOODS[key].xp*count,need=petTotal(100)-p.xp;if(value>need)fail('本次食物经验超过满级所需，还差'+need+' XP；请减少数量或使用「刚好喂满」');s.inventory[key]-=count;p.xp+=value;const e=event();for(let n=before+1;n<=petLevel(p.xp);n++)e.petLevels.push(n);syncUnlocks(s,e);e.feed={key,count,xp:value,pet:p.id};return trace(s,e,'投喂'+p.name+' · '+value+'宠物经验')}
 function feedToMax(s,key){if(!Object.hasOwn(FOODS,key)||s.inventory[key]<1)fail('食物不足');const p=active(s),need=petTotal(100)-p.xp;if(need<=0)fail('宠物已满级');if(need>FOODS[key].xp)fail('这颗食物不足以喂满');s.inventory[key]--;const before=petLevel(p.xp);p.xp+=need;const remainder=FOODS[key].xp-need;const e=event();for(let n=before+1;n<=100;n++)e.petLevels.push(n);e.feed={key,count:1,xp:need,pet:p.id};if(remainder){inventory(s,'small',Math.floor(remainder/50),e);s.foodRemainder=(s.foodRemainder||0)+remainder%50;while(s.foodRemainder>=50){inventory(s,'small',1,e);s.foodRemainder-=50}}syncUnlocks(s,e);return trace(s,e,'刚好喂满，剩余经验退回香香汉堡/食物余量')}
 function achievementCount(s,a){return Object.values(s.tasks).filter(t=>a.type==='daily'||t.category==='libai'&&t.grade!==null).length}
 function claimAchievement(s,id){if(ACH_DATA.LEGACY[id]){const [series,target]=ACH_DATA.LEGACY[id];return claimSeriesTier(s,series,target)}const a=ACHIEVEMENTS.find(a=>a.id===id);if(!a)fail('未知成就');if(s.achievements.includes(id))fail('成就奖励已领取');if(achievementCount(s,a)<a.count)fail('还没有完成这个成就');s.achievements.push(id);const e=event();awardXp(s,a.xp,e);inventory(s,a.food,a.amount,e);return trace(s,e,'成就 · '+a.name)}

 function longestChain(tasks){let longest=0,run=0,previous=null;for(const day of Object.keys(tasks).sort()){run=previous&&addDays(previous,1)===day?run+1:1;longest=Math.max(longest,run);previous=day}return longest}
 function seriesById(id){const f=ACHIEVEMENT_SERIES.find(f=>f.id===id);if(!f)fail('未知成就系列');return f}
 function tierKey(f,target){return f+':'+target}
 function ensureAchievementFields(s){s.achievementRecords??={};s.achievementMetrics??={bestStreak:0,highestPetLevel:1,adoptedCount:1};s.achievementTestProgress??={};s.achievementLegacyRecords??={}}
 function seriesMetric(s,f){
  const m=s.achievementMetrics||{},tasks=Object.values(s.tasks);let n=0;
  if(f.kind==='total')n=tasks.length;
  if(f.kind==='works')n=tasks.filter(t=>t.category===f.poet&&t.grade!==null).length+(s.confirmedWorks||[]).filter(t=>t.category===f.poet).length;
  if(f.kind==='streak')n=Math.max(m.bestStreak||0,longestChain(s.tasks));
  if(f.kind==='petLevel')n=Math.max(m.highestPetLevel||1,...s.pets.map(p=>petLevel(p.xp)));
  if(f.kind==='adoption')n=Math.max(m.adoptedCount||1,s.pets.length);
  return Math.max(n,s.achievementTestProgress?.[f.id]||0);
 }
 function historicalCompletion(s,f,target){
  if(f.kind==='total'){const rows=Object.entries(s.tasks).sort((a,b)=>a[1].submittedAt.localeCompare(b[1].submittedAt)||a[0].localeCompare(b[0]));return {at:rows[target-1]?.[1].submittedAt||null,estimated:false}}
  if(f.kind==='works'){const rows=Object.entries(s.tasks).filter(([,t])=>t.category===f.poet&&t.grade!==null).map(([day,t])=>{const old=s.events.find(e=>e.label.startsWith(day+' 教师点评'));return {at:t.reviewedAt||old?.at||t.submittedAt,estimated:!t.reviewedAt&&!old}}).concat((s.confirmedWorks||[]).filter(t=>t.category===f.poet).map(t=>({at:t.reviewedAt,estimated:false}))).sort((a,b)=>a.at.localeCompare(b.at));return rows[target-1]||{at:null,estimated:true}}
  if(f.kind==='streak'){const rows=Object.entries(s.tasks).sort((a,b)=>a[1].submittedAt.localeCompare(b[1].submittedAt)||a[0].localeCompare(b[0])),seen={};for(const [day,t]of rows){seen[day]=t;if(longestChain(seen)>=target)return {at:t.submittedAt,estimated:false}}return {at:null,estimated:true}}
  if(f.kind==='petLevel'){if(target===1)return {at:s.enrolled,estimated:false};const events=s.events.filter(e=>e.petLevels.some(l=>l>=target)).sort((a,b)=>a.at.localeCompare(b.at));return {at:events[0]?.at||null,estimated:!events.length}}
  if(f.kind==='adoption'){if(target===1)return {at:s.enrolled,estimated:false};const known=s.pets[target-1]?.adoptedAt;return {at:known||null,estimated:!known}}
  return {at:null,estimated:true};
 }
 function syncAchievements(s,{backfill=false,test=false}={}){
  ensureAchievementFields(s);const m=s.achievementMetrics;
  m.bestStreak=Math.max(m.bestStreak||0,longestChain(s.tasks));m.highestPetLevel=Math.max(m.highestPetLevel||1,...s.pets.map(p=>petLevel(p.xp)));m.adoptedCount=Math.max(m.adoptedCount||1,s.pets.length);
  for(const f of ACHIEVEMENT_SERIES){const n=seriesMetric(s,f);for(const tier of f.tiers){const key=tierKey(f.id,tier.target);if(f.comingSoon||tier.future||n<tier.target||s.achievementRecords[key])continue;const stamp=backfill?historicalCompletion(s,f,tier.target):{at:s.today,estimated:false};s.achievementRecords[key]={completedAt:stamp.at,completedEstimated:stamp.estimated,claimed:false,claimedAt:null,test:test||!!s.achievementTestProgress[f.id]}}}
 }
 function upgradeAchievements(s){
  ensureAchievementFields(s);if(s.achievementRevision===1)return s;
  syncAchievements(s,{backfill:true});
  for(const oldId of s.achievements){const old=ACHIEVEMENTS.find(a=>a.id===oldId);if(!old)continue;const log=s.events.find(e=>e.label==='成就 · '+old.name);if(ACH_DATA.LEGACY[oldId]){const [id,target]=ACH_DATA.LEGACY[oldId],key=tierKey(id,target);s.achievementRecords[key]??={completedAt:null,completedEstimated:true,test:false};Object.assign(s.achievementRecords[key],{claimed:true,claimedAt:log?.at||null,legacy:oldId})}else{s.achievementLegacyRecords[oldId]={name:old.name,claimedAt:log?.at||null}}}
  s.achievementRevision=1;return s;
 }
 function seriesStatus(s,id){
  const f=seriesById(id),value=seriesMetric(s,f);const tiers=f.tiers.map((t,i)=>{const record=s.achievementRecords?.[tierKey(id,t.target)]||null,locked=!!(f.comingSoon||t.future),completed=!locked&&(!!record||value>=t.target),claimed=!!record?.claimed;return {...t,index:i,key:tierKey(id,t.target),record,locked,completed,claimed,ready:completed&&!claimed,progress:Math.min(value,t.target)}});
  const firstReady=tiers.findIndex(t=>t.ready),firstIncomplete=tiers.findIndex(t=>!t.completed);return {family:f,value,tiers,focus:firstReady>=0?firstReady:firstIncomplete>=0?firstIncomplete:tiers.length-1,completedCount:tiers.filter(t=>t.completed).length,claimedCount:tiers.filter(t=>t.claimed).length,readyCount:tiers.filter(t=>t.ready).length};
 }
 function claimSeriesTier(s,id,target){
  upgradeAchievements(s);syncAchievements(s);const status=seriesStatus(s,id),tier=status.tiers.find(t=>t.target===target);if(!tier)fail('未知成就阶段');if(tier.locked)fail('这一阶段尚未开放');if(tier.claimed)fail('这一阶段的奖励已经领取');if(!tier.ready)fail('还没有达成这个阶段');
  const key=tierKey(id,target),record=s.achievementRecords[key];record.claimed=true;record.claimedAt=s.today;if(!s.achievements.includes(key))s.achievements.push(key);
  for(const [old,[family,n]]of Object.entries(ACH_DATA.LEGACY))if(family===id&&n===target&&!s.achievements.includes(old))s.achievements.push(old);
  const e=event();awardXp(s,tier.xp,e);if(tier.food&&tier.amount)inventory(s,tier.food,tier.amount,e);for(const [card,n]of Object.entries(tier.cards))inventory(s,card,n,e);
  e.achievement={seriesId:id,name:status.family.name,category:status.family.category,target,stageIndex:tier.index,totalStages:status.tiers.length,completedAt:record.completedAt,test:record.test};
  return trace(s,e,'成就 · '+status.family.name+' · 第'+(tier.index+1)+'阶段');
 }
 function confirmWork(s,{id,category,day,xp=50,food='small',amount=1}){date(day);if(!['regular','libai','dufu','wangwei','baijuyi','card'].includes(category)||typeof id!=='string'||!id||id.length>150)fail('作品资料无效');integer(xp,0,300);integer(amount,0,3);if(!['small','medium'].includes(food))fail('作品奖励无效');s.confirmedWorks??=[];if(s.confirmedWorks.some(w=>w.id===id))fail('作品已确认');const e=event();awardXp(s,xp,e);inventory(s,food,amount,e);s.confirmedWorks.push({id,category,day,reviewedAt:s.today});return trace(s,e,'作品确认 · '+id)}
 function gift(s,key,n,reason){integer(n,1,99);if(![...Object.keys(FOODS),'xpCard','makeup','renameCard'].includes(key)||typeof reason!=='string'||!reason.trim())fail('鼓励资料无效');const e=event();inventory(s,key,n,e);return trace(s,e,'老师特别鼓励 · '+reason.slice(0,500))}
 function debugAchievementProgress(s,id,n){integer(n,0,10000);upgradeAchievements(s);const f=seriesById(id);if(f.comingSoon)fail('徽章规则待确定，暂不模拟实际获得');s.achievementTestProgress[id]=Math.max(s.achievementTestProgress[id]||0,n);syncAchievements(s,{test:true});return trace(s,event(),'开发者成就进度 · '+f.name+' '+n)}
 function equip(s,id){if(id===null){active(s).hat=null;return}if(!['cap','crown','tophat'].includes(id)||!s.unlocked.includes(id))fail('这件装扮尚未解锁');active(s).hat=id}
 function setScene(s,id){if(!['home','garden','soccer'].includes(id))fail('未知场景');if(id!=='home'&&!s.unlocked.includes(id))fail('场景尚未解锁');s.scene=id;s.activity='idle'}
 function activity(s,id){if(!['idle','bed','trampoline','dance','kick'].includes(id))fail('未知互动');const gate={bed:'bed',trampoline:'trampoline',dance:'expressions',kick:'soccer'}[id];if(gate&&!s.unlocked.includes(gate))fail('互动尚未解锁');if(id==='dance'&&petLevel(active(s).xp)<60)fail('这只伙伴还未达到Lv.60');if(id==='kick'&&s.scene!=='soccer')fail('先进入足球场');if(['bed','trampoline'].includes(id)&&s.scene!=='home')fail('请先回到阳光小屋使用设施');s.activity=id}
 function adopt(s,flavor){if(!s.unlocked.includes('pet2'))fail('主人公Lv.25解锁第二位伙伴');if(s.pets.length>=2)fail('本版最多领养两只伙伴');if(!['strawberry','blueberry','fox','corgi','seal','robot','bot-one','bot-two','bot-three','sharpei','panther'].includes(flavor))fail('请选择伙伴');const p={id:flavor,name:({fox:'小栗',corgi:'小柯',seal:'团团',robot:'小机灵','bot-one':'星仔','bot-two':'小朵','bot-three':'跃跃',sharpei:'小褶',panther:'夜影',strawberry:'莓莓',blueberry:'蓝蓝'})[flavor],flavor,xp:0,hat:null};p.adoptedAt=s.today;s.pets.push(p);s.selected=p.id;s.activity='idle';trace(s,event(),'领养伙伴 · '+p.name);return p}
 function debugFeed(s,level){integer(level,2,100);const p=active(s),before=petLevel(p.xp),needed=petTotal(level)-p.xp;if(needed<=0)fail('这只伙伴已经达到目标等级');p.xp+=needed;const e=event();e.feed={key:'developer',count:1,xp:needed,pet:p.id};for(let n=before+1;n<=level;n++)e.petLevels.push(n);syncUnlocks(s,e);return trace(s,e,'开发者测试食物 · '+needed+'宠物经验')}
 function debugXp(s,n){integer(n,1,1000000);const e=event();awardXp(s,n,e);return trace(s,e,'开发者增加主人公经验')}
 function debugItem(s,key,n){integer(n,1,999);const e=event();inventory(s,key,n,e);return trace(s,e,'开发者发放道具')}
 function validate(s){
  if(!s||s.version!==3)fail('档案版本不兼容');date(s.today);date(s.enrolled);integer(s.heroXp,0,1000000000);
  if(!Array.isArray(s.pets)||!s.pets.length||s.pets.length>2||new Set(s.pets.map(p=>p.id)).size!==s.pets.length)fail('宠物档案异常');
  if(!s.pets.some(p=>p.id===s.selected))fail('当前宠物无效');
  for(const p of s.pets){integer(p.xp,0,petTotal(100));if(!['lime','strawberry','blueberry','fox','corgi','seal','robot','bot-one','bot-two','bot-three','sharpei','panther'].includes(p.flavor)||p.id!==p.flavor||typeof p.name!=='string'||p.name.length>30||![null,'cap','crown','tophat'].includes(p.hat))fail('宠物资料无效')}
  if(!s.inventory||!s.tasks||typeof s.tasks!=='object'||Array.isArray(s.tasks))fail('背包或任务档案缺失');
  upgradeRenameCards(s);
  for(const k of [...Object.keys(FOODS),'xpCard','makeup','renameCard'])integer(s.inventory[k],0,10000000);
  const imageValid=x=>x===null||typeof x==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(x);
  for(const [d,t] of Object.entries(s.tasks)){date(d);date(t.submittedAt);if(!Number.isInteger(t.baseXp)||t.baseXp<100||t.baseXp>200||t.baseXp%10!==0||![0,50].includes(t.cardXp)||![null,...Object.keys(GRADES)].includes(t.grade)||t.gradeXp!==(t.grade===null?0:GRADES[t.grade])||!['regular','libai','dufu','wangwei','baijuyi','card'].includes(t.category)||!imageValid(t.image)||typeof t.comment!=='string')fail('作业记录异常');if(t.voice!==null&&(typeof t.voice!=='string'||!/^data:audio\/[a-z0-9.+;=\-]+;base64,[A-Za-z0-9+/=]+$/i.test(t.voice)))fail('录音格式无效');if(t.extra&&(!imageValid(t.extra.image)||t.extra.xp!==40))fail('额外作业记录异常')}
  if(!Array.isArray(s.attendance)||!Array.isArray(s.achievements)||!Array.isArray(s.unlocked)||!Array.isArray(s.events)||s.events.length>150)fail('档案记录缺失');
  for(const a of s.attendance){date(a.day);if(typeof a.id!=='string'||![100,200,300].includes(a.xp)||![2,3,4].includes(a.food))fail('课程记录异常')}
  if(s.unlocked.some(id=>!CATALOG.some(i=>i.id===id))||s.achievements.some(id=>!ACHIEVEMENTS.some(i=>i.id===id)&&!ACHIEVEMENT_SERIES.some(f=>f.tiers.some(t=>tierKey(f.id,t.target)===id))))fail('收藏记录异常');
  if(!s.settings||typeof s.settings.sound!=='boolean'||typeof s.settings.animation!=='boolean'||!Number.isFinite(s.settings.volume)||s.settings.volume<0||s.settings.volume>1||typeof s.armed!=='boolean')fail('体验设置异常');
  if(!['home','garden','soccer'].includes(s.scene)||!['idle','bed','trampoline','dance','kick'].includes(s.activity))fail('场景记录异常');
  for(const e of s.events){if(typeof e.label!=='string'||!e.foods||!Array.isArray(e.heroLevels)||!Array.isArray(e.petLevels)||!Array.isArray(e.unlocks))fail('收支记录异常');date(e.at);integer(e.xp,0,1000000);for(const [k,n] of Object.entries(e.foods)){if(!Object.hasOwn(FOODS,k))fail('收支道具无效');integer(n,0,10000000)}for(const [k,n] of Object.entries(e.cards||{})){if(!['xpCard','makeup','renameCard'].includes(k))fail('收支卡片无效');integer(n,0,10000000)}for(const l of e.heroLevels)integer(l,2,1000000);for(const l of e.petLevels)integer(l,2,100);}
  if(s.foodRemainder!==undefined)integer(s.foodRemainder,0,49);
  upgradeAchievements(s);
  if(!s.achievementRecords||typeof s.achievementRecords!=='object'||Array.isArray(s.achievementRecords))fail('成就档案格式无效');
  if(s.confirmedWorks!==undefined){if(!Array.isArray(s.confirmedWorks)||new Set(s.confirmedWorks.map(w=>w.id)).size!==s.confirmedWorks.length)fail('作品记录无效');for(const w of s.confirmedWorks){if(typeof w.id!=='string'||!['regular','libai','dufu','wangwei','baijuyi','card'].includes(w.category))fail('作品记录无效');date(w.day);date(w.reviewedAt)}}
  for(const [key,rec]of Object.entries(s.achievementRecords)){if(!ACHIEVEMENT_SERIES.some(f=>f.tiers.some(t=>tierKey(f.id,t.target)===key))||typeof rec.claimed!=='boolean')fail('成就阶段记录无效');if(rec.completedAt!==null)date(rec.completedAt);if(rec.claimedAt!==null)date(rec.claimedAt)}
  for(const [id,n]of Object.entries(s.achievementTestProgress)){seriesById(id);integer(n,0,10000)}
  for(const k of ['bestStreak','highestPetLevel','adoptedCount'])integer(s.achievementMetrics[k],0,1000000);return s;
 }

 const api={upgradeRenameCards,renamePet,confirmWork,gift,syncAchievements,levelPack,FOODS,GRADES,CATALOG,ACHIEVEMENTS,ACHIEVEMENT_SERIES,ACHIEVEMENT_CATEGORIES,seriesStatus,seriesMetric,claimSeriesTier,debugAchievementProgress,upgradeAchievements,longestChain,fresh,date,addDays,week,heroCost,heroTotal,heroLevel,petCost,petTotal,petLevel,active,streak,currentStreak,base,progress,available,displayProgress,claim,review,attend,arm,cancelArm,feed,feedToMax,claimAchievement,achievementCount,equip,setScene,activity,adopt,debugXp,debugFeed,debugItem,validate};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.MoyaRewards=api;
})(typeof globalThis!=='undefined'?globalThis:this);
