import {GLTFLoader} from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
// Old Sketchfab glTF exports may use the retired specular/glossiness extension.
// Preserve original hand-painted color/emissive textures; approximate the gloss scalar
// in Three's current metallic/roughness material. Original GLB bytes stay untouched.
export function createSelectedItemLoader(){
 const loader=new GLTFLoader();
 loader.register(parser=>({name:'KHR_materials_pbrSpecularGlossiness',beforeRoot(){
  for(const material of parser.json.materials||[]){
   const old=material.extensions?.KHR_materials_pbrSpecularGlossiness;if(!old)continue;
   material.pbrMetallicRoughness={baseColorFactor:old.diffuseFactor||[1,1,1,1],metallicFactor:0,roughnessFactor:Math.max(.15,Math.min(1,1-(old.glossinessFactor??.35))),...(old.diffuseTexture?{baseColorTexture:old.diffuseTexture}:{})};
   material.extras={...material.extras,moyaMaterialAdaptation:'Original diffuse retained; retired specular/glossiness approximated as metallic/roughness.'};
  }
 }}));
 return loader;
}
