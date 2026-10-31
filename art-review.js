'use strict';
(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=['全部','道具','伙伴','地图','徽章与路线','动效'];
 let data=[],round=Number(new URLSearchParams(location.search).get('round'))===1?1:2,group='全部',index=0,votes={};
 try{const stored=JSON.parse(localStorage.getItem('moya-art-review-v1')||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))votes=stored}catch{}
 const inRound=()=>data.filter(c=>(c.round||1)===round),filtered=()=>inRound().filter(c=>group==='全部'||c.group===group),current=()=>filtered()[index];
 function save(){try{localStorage.setItem('moya-art-review-v1',JSON.stringify(votes))}catch{}$('#count').textContent=Object.keys(votes).length}
 function render(){
  const list=filtered(),c=list[index];
  $('#rounds').innerHTML=`<button data-round="2" class="${round===2?'active':''}">第二轮 · 功能与单件</button><button data-round="1" class="${round===1?'active':''}">第一轮 · 历史选择</button><button id="direction">已确认方向</button>`;
  $('#categories').innerHTML=groups.filter(g=>g==='全部'||inRound().some(c=>c.group===g)).map(g=>`<button data-category="${g}" class="${group===g?'active':''}">${g}</button>`).join('');
  if(!c){$('#card').innerHTML='<div class="info"><h2>正在准备本轮候选…</h2><p>第一轮选择完整保留，可切回查看。</p></div>';$('#position').textContent='暂未发布';$('#previous').disabled=$('#next').disabled=true;return}
  $('#card').innerHTML=`<div class="visual ${c.image?'':'broken'}"><span class="tag">${esc(c.id)} · ${esc(c.style)}</span>${c.image?`<img src="${esc(c.image)}" alt="${esc(c.title)}，原作者公开预览" referrerpolicy="no-referrer">`:''}<div class="fallback">${esc(c.noImage||'请打开原作者页面，查看完整模型和动态演示。')}<br><small>作者原始预览</small></div><button class="preview" id="preview">${c.embed?(c.nativeAnimations?.length?'▶ 旋转查看 / 原生动画':'▶ 旋转查看 3D'):'↗ 打开作者预览'}</button></div><div class="info"><div class="eyebrow"><span>${esc(c.use)}</span><span>${esc(c.licenseShort)}</span></div><h2>${esc(c.title)}</h2><p>${esc(c.pitch)}</p>${c.functionality?`<div class="functionality ${esc(c.readiness||'partial')}"><b>${esc(c.functionality)}</b>${c.evolution?`<small>${esc(c.evolution)}</small>`:''}</div>`:''}<div class="links"><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">作者原页 ↗</a><button id="more">动作、成长与许可 ›</button></div></div>`;
  const img=$('#card img');if(img)img.addEventListener('error',()=>img.parentElement.classList.add('broken'));
  $('#position').textContent=`${index+1} / ${list.length} · 第${round}轮${group==='全部'?'':group}`;
  $('#previous').disabled=index===0;$('#next').disabled=index===list.length-1;
  for(const b of document.querySelectorAll('[data-vote]'))b.classList.toggle('active',votes[c.ratingId||c.id]?.vote===b.dataset.vote);
  save();
 }
 function open(html){$('#detailBody').innerHTML=html;$('#detail').showModal()}
 function details(c){open(`<h2>${esc(c.id)} · ${esc(c.title)}</h2><h3>适合放在哪里</h3><p>${esc(c.use)}。${esc(c.pitch)}</p>${c.functionality?`<h3>功能结论</h3><p>${esc(c.functionality)}</p>`:''}${c.evolution?`<h3>成长形态</h3><p>${esc(c.evolution)}</p>`:''}${c.nativeAnimations?.length?`<h3>核验到的原生动画</h3><ul>${c.nativeAnimations.map(a=>`<li>${esc(typeof a==='string'?a:(a.name||a.title||'未命名'))}${typeof a==='object'&&a.duration!=null?' · '+esc(a.duration)+' 秒':''}</li>`).join('')}</ul>`:''}<h3>仍要做的适配</h3><p>${esc(c.limits)}</p><h3>许可与免费范围</h3><p class="license">${esc(c.license)}</p><a class="action" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">到作者页面查看 ↗</a>${c.licenseUrl?`<p><a href="${esc(c.licenseUrl)}" target="_blank" rel="noopener noreferrer">许可依据 ↗</a></p>`:''}${c.evidenceUrl?`<p><a href="${esc(c.evidenceUrl)}" target="_blank" rel="noopener noreferrer">作者的动画 / 成长说明 ↗</a></p>`:''}<p class="note">本轮是审美与功能筛选。尚未下载验证的项目，不视为已完成手机接入；原生动作、需要补的动作、成套形态分别说明。网页的渲染效果也需在统一灯光与手机预算下再验证。</p><p>核验：2026-10-29。按你本次非商业用途筛选；CC0、CC BY、CC BY-NC或其他条款逐项标注。</p>`)}
 function direction(){open(`<h2>这一轮，已经对齐。</h2><h3>道具的主风格</h3><p>手绘魔晶作为质感基准；保留奥术手册、沙漏、宝箱。寻找单件模型，补齐真正徽章与更合适的药瓶。金杯是收藏奖杯，皇冠是装扮候选。</p><h3>宝箱五档</h3><p>木 → 铁 → 铜 → 银 → 金。先确定材质和开箱演出；具体奖励仍沿用已经商定的系统，不擅自修改。</p><h3>主人公成长路线</h3><p>二维背景 + 曲线路径 + 等级地标 + 每级奖励。保留游戏地图的气氛与重点，不采用立体六边形路线。</p><h3>已经选中的特效</h3><p><a href="https://demo.quarks.art/vanilla.html#Jn" target="_blank" rel="noopener noreferrer">阶段奖励：Trail Renderer and Physics ↗</a><br>烟花在宝箱、阶段奖励后方短时播放。</p><p><a href="https://demo.quarks.art/vanilla.html#rs" target="_blank" rel="noopener noreferrer">普通道具：Different Emitter Shapes · Cone ↗</a><br>锥形金色粒子围绕奖品，重点仍是看清拿到了什么。</p><p class="note">两个直达地址已在2026-10-29实际打开核对名称。上游构建可能改变地址片段；若跳回默认，点页面左右箭头选择上述名称。</p><h3>伙伴功能要求</h3><p>你喜欢两种幼龙、机器人、沙皮狗、幻想黑豹，不喜欢大耳兔。外形选择保留；核对原生动作后再决定首发角色。成套幼体→青年→英雄若没有明确来源，不用放大变色或拼两只无关角色冒充。</p><p>地图方向保留，下一步在角色可活动的样片中比较。当前没有将这些新素材、特效或流沙直接应用到正式奖励。</p>`)}
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.round){round=Number(b.dataset.round);group='全部';index=0;render()}
  if(b.dataset.category){group=b.dataset.category;index=0;render()}
  if(b.dataset.vote){const c=current();if(!c)return;const ratingId=c.ratingId||c.id;if(votes[ratingId]?.vote===b.dataset.vote)delete votes[ratingId];else votes[ratingId]={vote:b.dataset.vote,title:c.title,group:c.group,url:c.url,round};render()}
  if((b.id==='previous'||b.id==='next')&&!b.disabled){index+=b.id==='next'?1:-1;render()}
  if(b.id==='more')details(current());
  if(b.id==='direction')direction();
  if(b.id==='preview'){const c=current();if(c.embed)open(`<h2>${esc(c.title)}</h2><iframe title="${esc(c.title)} 官方3D预览" src="${esc(c.embed)}" allow="fullscreen" allowfullscreen referrerpolicy="no-referrer"></iframe><p>${c.nativeAnimations?.length?'可在官方播放器底部选择已列出的原生动画。':'这项没有核验到原生动画，可旋转观察外观。'}若网络受限，<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">打开原页 ↗</a>。没有动画的模型不会显示出不存在的动作。</p>`);else window.open(c.url,'_blank','noopener,noreferrer')}
  if(b.classList.contains('close')){$('#detail').close();$('#detailBody').innerHTML=''}
  if(b.id==='summary'){const labels={yes:'喜欢',maybe:'备选',no:'不合适'},lines=['墨芽美术筛选 · 2026-10-29',...Object.entries(votes).map(([id,v])=>`${id} · ${v.title}：${labels[v.vote]||v.vote}`)];open(`<h2>你的选择，完整保留。</h2><p>第一轮与第二轮一起保存；没有替你重选角色。选择保存在当前浏览器，不会自动发送；复制清单回复即可。</p><textarea aria-label="我的素材选择清单" readonly>${esc(lines.join('\n'))}</textarea><p class="note">第二轮请同时看外观与功能标签。更喜欢外观但缺动作，也可以标备选，我们会明确评估补动作与成长形态的工作。</p>`)}
 });
 $('#detail').addEventListener('cancel',()=>{$('#detailBody').innerHTML=''});
 document.addEventListener('keydown',e=>{if($('#detail').open||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'&&index<filtered().length-1){index++;render()}if(e.key==='ArrowLeft'&&index>0){index--;render()}});
 fetch('/art-review-data.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(x=>{data=x;render()}).catch(()=>{$('#card').innerHTML='<div class="info"><h2>候选目录暂未载入</h2><p>请刷新页面，或查看design目录里的素材报告。</p></div>'});
})();
