# Original Jelly Baby WebGL adapter

SPDX-License-Identifier: GPL-3.0-only.

Original project: Jelly Baby, by Scott Sun, https://github.com/scottstts/Jelly-Baby . Original source and full GPLv3 license remain in vendor/jelly-mobile and pet-3d/LICENSE.

The adapter loads the original jelly-baby.bin + jelly-baby.json mesh/FEM cage, uses the original SoftBody solver, Locomotion rig, surface grab bindings, face patches, expression and sleep-bubble code. It does not create a replacement body sphere. Copied facial source files retain GPLv3 attribution headers.

MoYa changes: Three.js standard WebGL materials replace WebGPU NodeMaterial/TSL optical rendering; local actor normalization; a scene-independent update/play/drag/dispose interface; simplified runtime hat props and level adornments. The previous full WebGPU refractive optical transport, exact wearable table meshes and facility physics are not claimed to be identical in this WebGL adaptation.

Actions observe/jump/dance/rest use the existing physical rig/face expression. Trampoline/ball reuse the existing jump impulse as a scene cue; the main scene owns facilities/ball props and enforces capabilities and levels. No action grants learning XP or fruit.
