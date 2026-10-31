/* Original MoYa achievement series. Rewards are configuration, not a new currency. */
(function(root){
 const CATEGORIES=[{id:'works',name:'墨迹作品',short:'作品',symbol:'book',desc:'把喜欢的诗句，写成自己的作品',color:'#bc8258'},{id:'practice',name:'日日成长',short:'坚持',symbol:'flame',desc:'每一天的认真，都值得被记住',color:'#79945c'},{id:'companions',name:'伙伴旅程',short:'伙伴',symbol:'pet',desc:'和每一位小伙伴一起慢慢长大',color:'#819eae'},{id:'badges',name:'徽章收藏',short:'徽章',symbol:'badge',desc:'收藏属于你的成长印记',color:'#ac92b2'}];
 const stage=(target,xp,food,amount=1,cards={})=>({target,xp,food,amount:food?amount:0,cards});
 const workTiers=()=>[stage(1,50,'medium'),stage(5,150,'rare'),stage(10,200,'rare'),stage(20,300,'rare',2),stage(30,400,'rare',2),stage(50,500,'rare',3)];
 const SERIES=[
  ...[['libai','诗仙的笔墨','李白','明月、远山与少年心事。'],['dufu','诗圣的书卷','杜甫','把诗句里的温度留在纸上。'],['wangwei','山水入墨','王维','在一笔一画里，看见山水。'],['baijuyi','诗里的日常','白居易','把身边的故事写得清清楚楚。']].map(([poet,name,author,intro])=>({id:'works-'+poet,category:'works',name,author,poet,kind:'works',symbol:'book',intro,verb:'完成并经老师确认的'+author+'诗词作品',unit:'幅',tiers:workTiers()})),
  {id:'practice-total',category:'practice',name:'一笔一日，慢慢长大',kind:'total',symbol:'calendar',intro:'无需连续，每一份完成的每日作业都会留下足迹。',verb:'累计完成每日作业',unit:'天',tiers:[stage(1,20,'small'),stage(10,60,'medium'),stage(20,80,'medium',2),stage(30,100,'rare'),stage(40,120,'medium',3),stage(50,150,'rare'),stage(60,160,'medium',4),stage(80,180,'rare'),stage(100,200,'rare',2),stage(150,250,'rare',2),stage(200,300,'rare',2),stage(300,400,'rare',3),stage(365,450,'rare',3)]},
  {id:'practice-streak',category:'practice',name:'认真，连成一条线',kind:'streak',symbol:'flame',intro:'保存曾经达成的最高连续纪录。中断不会抹去已获得的成就；补签可以修复连续状态。',verb:'连续完成每日作业',unit:'天',tiers:Array.from({length:21},(_,i)=>stage(i+1,10+5*i,i<10?'small':i<20?'medium':'rare',i<5?1:i<10?2:i<15?1:i<20?2:1))},
  {id:'pet-level',category:'companions',name:'小小伙伴，大大成长',kind:'petLevel',symbol:'pet',intro:'看任意一只伙伴达到的最高等级，不把多只宠物的等级相加。奖励是果实与道具，不会反向增加主人公经验。',verb:'任意一只伙伴达到',unit:'级',tiers:[1,10,20,30,40,50,60,70,80,90,100].map((n,i)=>stage(n,0,i<3?'small':i<7?'medium':'rare',i===0?1:i<3?2:i<7?1:1,{...(n===50?{xpCard:1}:{}),...(n===100?{makeup:1}:{})}))},
  {id:'pet-adoption',category:'companions',name:'小屋里的新朋友',kind:'adoption',symbol:'pet',intro:'每一次相遇都值得纪念。当前原型支持两位伙伴，后续领养阶段可预览，暂不开放领取。',verb:'累计领养伙伴',unit:'位',tiers:Array.from({length:10},(_,i)=>({...stage(i+1,0,i<2?'small':'medium',i+1),future:i>=2}))},
  {id:'badge-collection',category:'badges',name:'八枚成长印记',kind:'badges',symbol:'badge',intro:'徽章主题、取得条件与奖励由我们下一轮商定。先保留收藏位置，不预先认定已经获得。',verb:'收集不同的成长徽章',unit:'枚',comingSoon:true,tiers:[1,3,5,8].map(n=>({...stage(n,0,null,0),future:true}))}
 ];
 const LEGACY={first:['practice-total',1],month:['practice-total',30],libai1:['works-libai',1],libai5:['works-libai',5]};
 const api={CATEGORIES,SERIES,LEGACY};root.MoyaAchievementData=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
