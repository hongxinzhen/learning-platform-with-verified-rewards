# Jelly Baby companion

Original project: Jelly Baby by Scott Sun / scottstts.
Source: https://github.com/scottstts/Jelly-Baby
Upstream commit: 19fc6ea487262f7a32fa8935712624ae5249db68
License: GPL-3.0-only. Full license: vendor/jelly-mobile/LICENSE.

Local modifications made on 2026-10-22: Chinese embedded bootstrap and loading/error interface; pet-only runtime using upstream character, optics, soft-body physics, sound and tabletop; removed world/facility gameplay from startup; disabled keyboard walking and omitted joystick; tap recognition for jump with drag, multi-touch and cancellation rejection; compact mobile controls; reduced initial scene to day lighting; mobile profile and relative build output. Corresponding modified sources and build configuration are retained in vendor/jelly-mobile. Compiled component lives in pet-3d. These modifications to the component are under GPL-3.0-only.

This public prototype is distributed under GPL-3.0-only for the application code and GPL-derived components. Corresponding source, build configuration and original notices are included directly in this repository. Independently licensed models, audio and dependencies retain their original CC0, CC BY or MIT licenses; see the per-asset provenance and viewer credits. This source release is not an app-store release.

The upstream assets-and-verification document describes the runtime model and textures as authored/generated project assets; a local copy is retained at vendor/jelly-mobile/asset-notes.md. No screenshot from the reference website is used as a replacement for the 3D rendering.

Three.js and delaunator are upstream dependencies under MIT licenses. Dependency versions are pinned in package-lock.json; distributed license texts are retained with the viewers and upstream notices. npm ci restores dependency packages and their licenses.

## 2026-10-23 companion integration

Additional GPLv3 component modifications: parent/iframe state protocol with origin and source checks; unlocked wearable placement using original procedural assets; original bed and trampoline facilities; lazy-loaded mini soccer stadium and scripted shot interaction; authored procedural garden, fruit feeding animation and level-based leaf/ring/star adornments; independent companion colors, pause/resume and shared sound volume. Source: vendor/jelly-mobile/src/app/moya-companion.ts, runtime.ts, sound.ts and main.ts. These are preview growth stages, not new fully remodeled species.

## 2026-10-24 local interface and achievement sounds

Kenney Interface Sounds (https://kenney.nl/assets/interface-sounds), by Kenney: CC0 1.0. Selected UI effects converted from OGG to mono 44.1kHz PCM WAV. Original license: assets/audio/Kenney-CC0.txt.

Win sound effect (https://opengameart.org/content/win-sound-effect), by Listener: the creator explicitly dedicates this effect to the public domain under CC0. Converted to mono 44.1kHz PCM WAV for upgrade and achievement celebrations. Source download retained in assets/audio/source/listener-win-original.wav.

CC0 legal terms: https://creativecommons.org/publicdomain/zero/1.0/ . Source details and hashes: assets/audio/README.md and manifest.json. No Hearthstone artwork or audio is included; the achievement organization is a reference for interaction design only. New interface crests and EXP emblem are authored SVG assets in visuals.js.

## 2026-10-24 sound audition candidates

Added Kenney UI Audio (https://kenney.nl/assets/ui-audio) and Music Jingles (https://kenney.nl/assets/music-jingles), both CC0, for user comparison only. Source licenses retained as assets/audio/Kenney-ui-CC0.txt and Kenney-jingles-CC0.txt. Candidate files are converted to mono PCM WAV with loudness processing; exact file mapping and hashes in assets/audio/audition-candidates.json. No chosen candidate is automatically applied to the learning app.


## 2026-10-29 Fox WebGL companion

Fox GLB source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox . Geometry by PixelMannen (CC0 1.0); rig and animations by tomkranis (CC BY 4.0); glTF conversion by AsoboStudio and scurest (CC BY 4.0). The bundled GLB is unmodified; MoYa adds runtime stage, camera interaction, short jump response and fruit effects. It retains three native animation clips Survey, Walk, Run. This does not imply endorsement by the original creators.

Attribution, upstream README, full CC0/CC BY license text and Three.js MIT are distributed in companion-viewer/licenses and linked by companion-viewer/credits.html. Source GLB is retained in assets/models/fox; viewer source in companion-viewer/source, built local dependencies in companion-viewer/assets. The unified viewer now incorporates GPL Jelly code and is distributed under GPL-3.0-only (companion-viewer/LICENSE), superseding the earlier standalone Fox viewer's MIT designation. No CDN runtime or third-party AI upload is used.

## 2026-10-29 unified companion habitat

RobotExpressive: model by Tomás Laulhé, modifications by Don McCurdy, CC0-1.0; sourced from the official Three.js example repository. Corgi and Seal: Gobkit, CC0-1.0; source URLs, upstream metadata, attribution and license text are retained in assets/models/{robot,corgi,seal} and companion-viewer/licenses. GLBs are unmodified; model-catalog.json records hashes and actual animation clips. The UI excludes attack and death clips. Native animation and authored procedural responses are distinguished in pet-platform-config.js and the asset audit.

The common WebGL viewer retains Jelly Baby's original FEM mesh, soft-body solver and facial components under GPLv3, with authored adapter, local scene and state protocol. It does not reproduce the original WebGPU optical pipeline. Complete corresponding source and build instructions are distributed as companion-viewer/licenses/moya-companion-source.zip, with original modified source under vendor/jelly-mobile and viewer source under companion-viewer/source. Three.js and its helpers remain MIT; separate model licenses remain applicable. Credits are available from the in-scene link.

## Selected assets integration 2026-10-30
Exact author, source URL, license and SHA-256 are retained in assets/selected-pets/manifest.json, assets/selected-items/manifest.json and assets/selected-worlds/floating-island/SOURCE.json. Originals and full licenses accompany each asset. Runtime model normalization, isolated robot rigs, material tiers and the explicitly documented mobile badge texture derivative are MoYa adaptations. These independent CC BY/CC0 assets are not relicensed by the viewer GPL. three.quarks 0.17.1 is MIT (Forrest Sun); its license is linked from both viewer credits. Source archive contains the corresponding viewer, configuration, source assets and build files; node_modules are reproducible from lockfiles.



## v0.9 runtime repairs and food assets
Grab3D burger, pizza, croissant, cake and sealed letter: CC0, original model bytes retained with source and hashes under assets/selected-items/food-* and rename-letter. The upstream production disclosure is preserved. Runtime feeding choreography is authored by MoYa, not a native animation in these static assets. Pet portraits are screenshots of the corresponding licensed models. Panther runtime removes three malformed-scale helper mesh layers (Object_15/Object_17/Object_18), retains original body/armor/idle animation, and leaves source GLB unchanged.


## Public repository source release (2026-10-31)
The complete tracked source replaces the local, generated source ZIP in the GitHub distribution. Regenerate that optional ZIP with python design/build-companion-source.py. It is not checked into Git because it exceeds the per-file GitHub size limit. Runtime school databases, uploaded work, local sessions and backups are excluded from the public repository. Screenshots use synthetic demonstration data.
