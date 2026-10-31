/* One capability source for the scene, app and API. No task rewards are granted by pet actions. */
(function(root){
 const PETS=[{id:'lime',model:'jelly',name:'芽芽',icon:'🌱',color:'#b8d681',desc:'软软的果冻，拖动身体会轻轻拉伸。'},{id:'strawberry',model:'jelly',name:'莓莓',icon:'🍓',color:'#d98b91',desc:'莓果色的果冻，和芽芽一样柔软。'},{id:'blueberry',model:'jelly',name:'蓝蓝',icon:'🫐',color:'#8aaecf',desc:'蓝莓色的果冻，有自己的成长记录。'},{id:'fox',model:'fox',name:'小栗',icon:'🦊',color:'#d9984b',desc:'林间小狐狸，喜欢观察、散步和轻快跑。'},{id:'corgi',model:'corgi',name:'小柯',icon:'🐕',color:'#c89d72',desc:'短腿小柯基，愿意陪你走一小段。'},{id:'seal',model:'seal',name:'团团',icon:'🦭',color:'#98b5bb',desc:'圆滚滚的小海豹，喜欢安静地陪着你。'},{id:'robot',model:'robot',name:'小机灵',icon:'🤖',color:'#80b6b5',desc:'会挥手、点头和跳舞的机器人朋友。'}];
 const ACTIONS={observe:{id:'observe',label:'看看你',level:1,kind:'native'},jump:{id:'jump',label:'轻跳回应',level:1,kind:'procedural'},walk:{id:'walk',label:'散步',level:5,kind:'native'},run:{id:'run',label:'轻快跑',level:10,kind:'native'},wave:{id:'wave',label:'挥挥手',level:3,kind:'native'},nod:{id:'nod',label:'点点头',level:10,kind:'native'},thumbs:{id:'thumbs',label:'给你点赞',level:20,kind:'native'},dance:{id:'dance',label:'开心舞步',level:60,kind:'native'},rest:{id:'rest',label:'歇一会儿',level:1,heroLevel:5,requires:'bed',kind:'procedural'},trampoline:{id:'trampoline',label:'弹弹蹦床',level:1,heroLevel:10,requires:'trampoline',kind:'procedural'},ball:{id:'ball',label:'踢个球',level:1,heroLevel:20,requires:'soccer',kind:'procedural'}};
 const MODELS={jelly:{id:'jelly',label:'软体果冻',actions:['observe','jump','dance','rest','trampoline','ball'],clips:{},wearables:['cap','crown','tophat']},fox:{id:'fox',label:'林间小狐',actions:['observe','jump','walk','run','rest','trampoline','ball'],clips:{observe:'Survey',walk:'Walk',run:'Run'},wearables:[]},corgi:{id:'corgi',label:'小柯基',actions:['observe','jump','walk','rest','trampoline','ball'],clips:{observe:'idle',walk:'walk'},wearables:[]},seal:{id:'seal',label:'小海豹',actions:['observe','jump','walk','rest','trampoline','ball'],clips:{observe:'idle',walk:'walk'},wearables:[]},robot:{id:'robot',label:'机器人伙伴',actions:['observe','jump','wave','walk','run','nod','thumbs','dance','rest','trampoline','ball'],clips:{observe:'Idle',jump:'Jump',wave:'Wave',walk:'Walking',run:'Running',nod:'Yes',thumbs:'ThumbsUp',dance:'Dance',rest:'Sitting'},wearables:[]}};

 // User-selected, legally mirrored GLBs. Different robots have independent growth.
 ACTIONS.sit={id:'sit',label:'坐好陪你',level:10,kind:'native'};
 PETS.push(
  {id:'bot-one',model:'cuteRobot1',name:'星仔',icon:'🤖',color:'#caa354',desc:'你选中的机械伙伴Ⅰ；有真正的待机、跑步与跳跃动画。'},
  {id:'bot-two',model:'cuteRobot2',name:'小朵',icon:'🤖',color:'#80aeb7',desc:'你选中的机械伙伴Ⅱ；独立成长，逐步学会跳跃和奔跑。'},
  {id:'bot-three',model:'cuteRobot3',name:'跃跃',icon:'🤖',color:'#b58ca6',desc:'你选中的机械伙伴Ⅲ；沿用原作者的骨骼与动作。'},
  {id:'sharpei',model:'sharpei',name:'小褶',icon:'🐕',color:'#c8ad91',desc:'你选中的沙皮狗，会散步、站着陪伴和坐好。'},
  {id:'panther',model:'panther',name:'夜影',icon:'🐈',color:'#69728f',desc:'你选中的幻想黑豹；当前原模型只有待机，不提供虚构的跑跳动作。'}
 );
 for(const [i,suffix] of ['', '.001', '.002'].entries()){
  const id='cuteRobot'+(i+1);
  MODELS[id]={id,label:'机械伙伴'+(i+1),subtree:'Armature'+suffix,actions:['observe','jump','run'],actionLevels:{jump:3,run:10},clips:{observe:'Armature'+suffix+'|Idle',jump:'Armature'+suffix+'|Jump',run:'Armature'+suffix+'|Run'},wearables:[]};
 }
 MODELS.sharpei={id:'sharpei',label:'沙皮狗',actions:['observe','walk','sit','rest'],clips:{observe:'standing_idle',walk:'walking_cycle',sit:'sitting_idle',rest:'sitting_idle'},wearables:[]};
 MODELS.panther={id:'panther',label:'幻想黑豹',actions:['observe'],clips:{observe:'idle_pose'},wearables:[]};
 const pet=id=>PETS.find(p=>p.id===id)||null;
 function capabilities(state){const p=pet(state.petId),model=p&&MODELS[p.model];if(!model)return [];const level=Math.max(1,Math.min(100,Number(state.petLevel)||1)),hero=Math.max(1,Number(state.heroLevel)||1),unlocked=Array.isArray(state.unlocked)?state.unlocked:[];return model.actions.map(id=>{const a={...ACTIONS[id],level:model.actionLevels?.[id]??ACTIONS[id].level},reason=level<a.level?'伙伴 Lv.'+a.level+' 解锁':a.heroLevel&&hero<a.heroLevel?'主人公 Lv.'+a.heroLevel+' 解锁':a.requires&&!unlocked.includes(a.requires)?'先解锁'+({bed:'小床',trampoline:'蹦床',soccer:'球场'})[a.requires]:'';return {...a,kind:model.clips[id]?'native':'procedural',clip:model.clips[id]||null,locked:!!reason,reason}})}
 function canAct(state,id){return capabilities(state).some(a=>a.id===id&&!a.locked)}
 const api={PETS,MODELS,ACTIONS,pet,capabilities,canAct};root.MoyaPetPlatform=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
