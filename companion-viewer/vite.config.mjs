import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export default {root:path.join(here,'source'),base:'./',resolve:{alias:[{find:/^three\/webgpu$/,replacement:path.join(here,'../vendor/jelly-mobile/node_modules/three/build/three.module.js')},{find:/^three$/,replacement:path.join(here,'../vendor/jelly-mobile/node_modules/three/build/three.module.js')}]},build:{outDir:here,emptyOutDir:false,assetsInlineLimit:0,target:'es2020',rollupOptions:{output:{entryFileNames:'assets/companion.js',chunkFileNames:'assets/[name]-[hash].js',assetFileNames:'assets/[name]-[hash][extname]'}}}};
