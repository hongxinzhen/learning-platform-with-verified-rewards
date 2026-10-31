import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export default {root:path.join(here,'source'),base:'./',resolve:{alias:[{find:/^three$/,replacement:path.join(here,'../vendor/jelly-mobile/node_modules/three/build/three.module.js')},{find:/^three.quarks$/,replacement:path.join(here,'../companion-viewer/node_modules/three.quarks/dist/three.quarks.esm.js')}]},build:{outDir:here,emptyOutDir:false,assetsInlineLimit:0,target:'es2020',rollupOptions:{output:{entryFileNames:'assets/item-viewer.js',assetFileNames:'assets/[name]-[hash][extname]'}}}};
