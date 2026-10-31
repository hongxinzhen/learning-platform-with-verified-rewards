// MoYa adaptation of Jelly Baby by Scott Sun. GPL-3.0-only.
import './style.css';
import './moya.css';
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<main id="viewport" aria-label="3D 果冻伙伴，拖动拉伸，轻点跳跃"></main>
<nav class="moya-controls"><button id="sound" aria-pressed="true">声音关</button><button id="reset">回到中间</button></nav>
<div class="moya-instruction">拖动果冻，看看它的弹性 · 轻点跳一跳</div>
<section id="loading" role="status" aria-live="polite"><div class="loading-card"><div class="jelly-mark"></div><h2>芽芽正在醒来</h2><p id="load-message">第一次见面，需要准备一下…</p><pre id="fatal" hidden></pre><button id="retry" hidden>重新试试</button></div></section>`;
let failed=false,game:{stop:()=>void}|undefined;
function fail(reason:unknown){
 if(failed)return;failed=true;game?.stop();if(window.parent!==window)window.parent.postMessage({type:'moya:error',message:reason instanceof Error?reason.message:String(reason)},location.origin);
 document.querySelector('#loading')!.classList.remove('hidden');
 document.querySelector('h2')!.textContent='这个浏览器暂时没能唤醒果冻';
 document.querySelector('#load-message')!.textContent='需要支持 WebGPU 的浏览器，以及 localhost 或 HTTPS。';
 const pre=document.querySelector<HTMLPreElement>('#fatal')!;pre.hidden=false;pre.textContent=reason instanceof Error?reason.message:String(reason);
 document.querySelector<HTMLButtonElement>('#retry')!.hidden=false;
}
window.addEventListener('error',e=>fail(e.error||e.message));
window.addEventListener('unhandledrejection',e=>fail(e.reason));
document.querySelector('#retry')!.addEventListener('click',()=>location.reload());
void import('./app/runtime.ts').then(({startGame})=>startGame(s=>{document.querySelector('#load-message')!.textContent=s;},fail)).then(started=>{
 game=started;if(failed){game.stop();return;}
 document.querySelector('#loading')!.classList.add('hidden');
 if(window.parent!==window)window.parent.postMessage({type:'moya:ready'},location.origin);
}).catch(fail);
