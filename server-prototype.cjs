const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.wav':'audio/wav'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
  if(pathname==='/')pathname='/index.html';
  const allowed=['/index.html','/style.css','/app.js','/mobile-v3.css','/reward-engine.js','/visuals.js','/app-v3.js','/design/reward-simulator.html','/THIRD_PARTY_NOTICES.md','/achievement-data.js','/achievement-ui.js','/achievements.css','/audio.js','/sound-audition.html','/sound-audition.js','/journey-ui.js','/journey.css'].includes(pathname)||pathname.startsWith('/pet-3d/')||pathname.startsWith('/assets/audio/');
  const target=path.resolve(root,'.'+pathname);
  const petRoot=path.resolve(root,'pet-3d')+path.sep;
  const audioRoot=path.resolve(root,'assets/audio')+path.sep;
  const audioAllowed=!pathname.startsWith('/assets/audio/')||target.startsWith(audioRoot)&&!target.slice(audioRoot.length).includes(path.sep)&&['.wav','.json','.txt','.md'].includes(path.extname(target));
  if(!allowed||!audioAllowed||!target.startsWith(root+path.sep)||(pathname.startsWith('/pet-3d/')&&!target.startsWith(petRoot))){res.writeHead(404).end('Not found');return;}
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(target).pipe(res);
  });
}).listen(4173,'127.0.0.1',()=>console.log('墨芽已启动：http://localhost:4173/ （关闭此进程即可停止）'));
