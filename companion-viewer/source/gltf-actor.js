/**
 * Imported, licensed glTF actors for the shared MoYa stage.
 * The renderer, scene, camera, environment and reward rules belong to the caller.
 * Geometry and textures remain in the source cache; each live actor owns its rig,
 * animation mixer and cloned materials.
 */
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from '../../vendor/jelly-mobile/node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import '../../pet-platform-config.js';

// Keep these imports explicit: Vite must include every selected local binary.
const MODEL_URLS = Object.freeze({
  fox: new URL('../../assets/models/fox/Fox.glb', import.meta.url).href,
  corgi: new URL('../../assets/models/corgi/Corgi.glb', import.meta.url).href,
  seal: new URL('../../assets/models/seal/Seal.glb', import.meta.url).href,
  robot: new URL('../../assets/models/robot/RobotExpressive.glb', import.meta.url).href,
  cuteRobot1: new URL('../../assets/selected-pets/cuteRobots/model.glb', import.meta.url).href,
  cuteRobot2: new URL('../../assets/selected-pets/cuteRobots/model.glb', import.meta.url).href,
  cuteRobot3: new URL('../../assets/selected-pets/cuteRobots/model.glb', import.meta.url).href,
  sharpei: new URL('../../assets/selected-pets/sharpei/model.glb', import.meta.url).href,
  panther: new URL('../../assets/selected-pets/panther/model.glb', import.meta.url).href,
});
const HEIGHTS = Object.freeze({ fox: 1.4, corgi: 1.2, seal: 1.0, robot: 1.65, cuteRobot1: 1.45, cuteRobot2: 1.45, cuteRobot3: 1.45, sharpei: 1.1, panther: 1.3 });
const SOURCES = new Map();
const BLOCKED = new Set(['attack', 'dead', 'death', 'punch']);
const THREE_SECONDS = new Set(['walk', 'run']);
const ONE_SHOT = new Set(['wave', 'nod', 'thumbs', 'jump', 'dance']);

function loadSource(id) {
  if (!Object.hasOwn(MODEL_URLS, id)) return Promise.reject(new Error('Unknown imported partner: ' + id));
  const cacheKey = MODEL_URLS[id];
  if (!SOURCES.has(cacheKey)) {
    const promise = new GLTFLoader().loadAsync(MODEL_URLS[id]).catch(error => {
      SOURCES.delete(cacheKey); // A transient load error must not poison later retries.
      throw error;
    });
    SOURCES.set(cacheKey, promise);
  }
  return SOURCES.get(cacheKey);
}

// The selected source contains three distinct rigs. Keep only the chosen root
// branch in a clone: hiding the others would still pollute its normalized bounds.
function isolateSelectedRig(model, subtree) {
  if (!subtree) return;
  const clean = name => THREE.PropertyBinding.sanitizeNodeName(name);
  const selected = model.getObjectByName(clean(subtree)) || model.getObjectByName(subtree);
  if (!selected?.parent) throw new Error('Selected robot rig is missing: ' + subtree);
  const owner = selected.parent;
  for (const child of [...owner.children]) {
    if (child === selected) continue;
    child.traverse(object => { if (object.isSkinnedMesh) object.skeleton.dispose(); });
    owner.remove(child);
  }
  model.userData.selectedRig = subtree;
}

// The public Panther FBX conversion has three malformed helper meshes:
// Sphere/clows vertices are thousands of units wide, while its original body
// and armour use single-digit units under the same skin. Their missing bind
// shape transforms cannot be reconstructed reliably. Omit ONLY those corrupt
// overlays at runtime; preserve the original authored body, armour and animation.
// This does not edit the original GLB or substitute any generated geometry.
function repairPantherHelpers(model) {
  const removed=[];
  for(const name of ['Object_15','Object_17','Object_18']) {
    const object=model.getObjectByName(name);
    if(!object?.isSkinnedMesh)throw new Error('Panther helper layout changed: '+name);
    object.skeleton.dispose();object.removeFromParent();removed.push(name);
  }
  model.userData.compatibilityRepair='omit-malformed-Sphere-and-clows-overlays';
  model.userData.omittedSourceMeshes=removed;
}

function updateBones(model) {
  model.updateMatrixWorld(true);
  model.traverse(object => {
    if (object.isSkinnedMesh) object.skeleton.update();
  });
}

// Linear motion over a complete walking cycle is removed without discarding
// the bone's per-step bounce or the model's original bind offsets.
function stationaryClip(source, action) {
  const clip = source.clone();
  if (!THREE_SECONDS.has(action)) return clip;
  for (const track of clip.tracks) {
    if (!track.name.endsWith('.position') || track.getValueSize() !== 3 || track.times.length < 2) continue;
    const last = track.times.length - 1;
    const span = track.times[last] - track.times[0];
    if (!(span > 0)) continue;
    for (let axis = 0; axis < 3; axis++) {
      const delta = track.values[last * 3 + axis] - track.values[axis];
      if (Math.abs(delta) < 1e-7) continue;
      for (let i = 0; i <= last; i++) {
        const phase = (track.times[i] - track.times[0]) / span;
        track.values[i * 3 + axis] -= delta * phase;
      }
    }
  }
  return clip;
}

export async function createGLTFActor(modelId) {
  const definition = globalThis.MoyaPetPlatform?.MODELS?.[modelId];
  if (!definition || !Object.hasOwn(MODEL_URLS, modelId)) throw new Error('Unsupported glTF partner: ' + modelId);
  const source = await loadSource(modelId);
  const root = new THREE.Group();
  root.name = 'moya-actor-' + modelId;
  const motion = new THREE.Group();
  motion.name = 'moya-runtime-response';
  const normalizer = new THREE.Group();
  normalizer.name = 'moya-model-normalizer';
  const model = cloneSkeleton(source.scene);
  isolateSelectedRig(model, definition.subtree);
  if(modelId==='panther')repairPantherHelpers(model);
  root.add(motion);
  root.userData.modelId = modelId;
  root.userData.selectedRig = definition.subtree || null;
  root.userData.nativeActions = Object.keys(definition.clips || {});
  motion.add(normalizer);
  normalizer.add(model);

  const materials = new Map();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = false;
    const own = material => {
      if (!materials.has(material)) materials.set(material, material.clone());
      return materials.get(material);
    };
    object.material = Array.isArray(object.material) ? object.material.map(own) : own(object.material);
    // Animated limbs must not disappear because a rest-pose bounding box is stale.
    if (object.isSkinnedMesh) object.frustumCulled = false;
  });

  const mixer = new THREE.AnimationMixer(model);
  const nativeClips = source.animations.map(clip => clip.name);
  const byName = new Map(source.animations.map(clip => [clip.name, clip]));
  const actions = new Map();
  for (const [action, clipName] of Object.entries(definition.clips || {})) {
    if (BLOCKED.has(clipName.toLowerCase())) continue;
    const original = byName.get(clipName);
    if (original) actions.set(action, mixer.clipAction(stationaryClip(original, action)));
  }
  const idle = actions.get('observe');
  if (!idle) {
    mixer.uncacheRoot(model);
    for (const material of materials.values()) material.dispose();
    throw new Error('Partner is missing its declared idle clip: ' + modelId);
  }
  let active = idle, activeName = 'observe', elapsed = 0, until = Infinity;
  let jumpStart = -Infinity, jumpDuration = .68, disposed = false;
  idle.reset().setLoop(THREE.LoopRepeat, Infinity).play();
  mixer.update(0);
  updateBones(model);
  const bounds = new THREE.Box3().setFromObject(model, true);
  const size = bounds.getSize(new THREE.Vector3());
  if (bounds.isEmpty() || !Number.isFinite(size.y) || size.y <= 0) {
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    for (const material of materials.values()) material.dispose();
    throw new Error('Partner has no measurable geometry: ' + modelId);
  }
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.add(new THREE.Vector3(-center.x, -bounds.min.y, -center.z));
  // Fit the longest horizontal dimension too: long quadrupeds must not fill the camera.
  normalizer.scale.setScalar(Math.min(HEIGHTS[modelId] / size.y,2.05/Math.max(size.x,size.z)));
  updateBones(root);

  // Pelvis/body positions anchor walks to this platform. Arms, ears, tail and
  // vertical footfall remain animated; no imported clip can move the actor root.
  let anchor = null;
  for (const name of ['b_Hip_01', 'Hips', 'Body']) {
    anchor = model.getObjectByName(name);
    if (anchor) break;
  }
  const restingAnchor = new THREE.Vector3();
  const worldAnchor = new THREE.Vector3();
  if (anchor) {
    anchor.getWorldPosition(worldAnchor);
    motion.worldToLocal(restingAnchor.copy(worldAnchor));
  }

  function transition(name, oneShot = false) {
    const next = actions.get(name);
    if (!next) return false;
    if (active !== next) active?.fadeOut(.18);
    active = next;
    activeName = name;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
    next.clampWhenFinished = oneShot;
    next.fadeIn(.18).play();
    return true;
  }
  function observe() {
    until = Infinity;
    activeName = 'observe';
    normalizer.position.set(0, 0, 0);
    return transition('observe');
  }
  const finished = event => {
    if (disposed || event.action !== active || activeName === 'rest') return;
    if (ONE_SHOT.has(activeName)) observe();
  };
  mixer.addEventListener('finished', finished);

  function play(action) {
    if (disposed || typeof action !== 'string') return false;
    if (action === 'observe' || action === 'idle' || action === 'survey') return observe();
    if (!(definition.actions || []).includes(action)) return false;
    if (action === 'jump' && !actions.has('jump')) {
      observe();
      jumpStart = elapsed;
      return true;
    }
    if (action === 'rest' || action === 'sit') {
      jumpStart = -Infinity;
      motion.position.y = 0;
      if (actions.has(action)) {
        transition(action, true);
        until = Infinity; // Sitting remains seated until another explicit action.
      } else observe();
      return true;
    }
    if (!actions.has(action) || !(definition.actions || []).includes(action)) return false;
    jumpStart = -Infinity;
    motion.position.y = 0;
    const oneShot = ONE_SHOT.has(action);
    transition(action, oneShot);
    until = elapsed + (THREE_SECONDS.has(action) ? 3 : Math.max(.3, active.getClip().duration + .15));
    return true;
  }

  function update(dt, timeMs) {
    if (disposed) return;
    // timeMs is intentionally not used as an animation clock: paused/background
    // time must not fast-forward a pet when its scene becomes visible again.
    const delta = Math.min(.1, Math.max(0, Number(dt) || 0));
    elapsed += delta;
    mixer.update(delta);
    if (elapsed >= until) observe();
    const phase = (elapsed - jumpStart) / jumpDuration;
    motion.position.y = phase >= 0 && phase < 1 ? Math.sin(Math.PI * phase) * .32 : 0;
    normalizer.position.set(0, 0, 0);
    if (anchor && THREE_SECONDS.has(activeName)) {
      updateBones(root);
      anchor.getWorldPosition(worldAnchor);
      motion.worldToLocal(worldAnchor);
      normalizer.position.x = restingAnchor.x - worldAnchor.x;
      normalizer.position.z = restingAnchor.z - worldAnchor.z;
    }
    root.updateMatrixWorld(true);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    mixer.removeEventListener('finished', finished);
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    model.traverse(object => {
      if (object.isSkinnedMesh) object.skeleton.dispose();
    });
    for (const material of materials.values()) material.dispose();
    materials.clear();
    actions.clear();
    root.removeFromParent();
    root.clear();
    // No geometry/texture disposal: those immutable resources belong to SOURCES.
  }
  return {
    root, update, play, nativeClips,
    setHat() { return false; },
    setGrowth() {},
    grabStart() { return false; },
    grabMove() {},
    grabEnd() {},
    dispose,
  };
}
