# MoYa selected-item viewer

Local Three.js viewer for the original selected GLBs. This module changes presentation only; it never calls reward APIs or mutates inventory.

Build: `npm run build --prefix item-viewer` from the repository root. Requires the existing vendor/jelly-mobile dependencies and companion-viewer/node_modules/three.quarks. `source/main.js` shares the parent's authored `companion-viewer/source/reward-fx.js` in the same Three scene.

## URLs and mappings

`/item-viewer/index.html?item=small&effect=cone`

- `small`, `medium`, `rare`, `legend`: exact Grab3D CC0 Burger / Pizza / Croissant / Two-Tier Birthday Cake. Original four game keys and reward quantities remain unchanged; food replaces crystal feeding visuals. LowlyPoly crystal source remains in the archive, no longer the food mapping.
- `renameCard`: Grab3D CC0 Sealed Letter, used as a naming card. Static source model; the app owns its one-card naming transaction.
- `xpCard`: exact Kayla Hill Arcane Spellbook.
- `makeup`: exact Antonio Gloria Sands of Time, with real native Sand Animation and morph weights.
- `chest`: exact marcosgon chest; `tier=wood|iron|bronze|silver|gold` adjusts original metal-part materials. The source is static, so the UI does not claim a native lid-opening animation.
- `trophy`: original selected Grab3D CC0 trophy, used as a collectible trophy, not a badge.
- `badge`: exact selected Game Badge, mobile texture-size derivative retaining geometry/UVs/hierarchy.
- `starBadge`: exact Microsoft Badge.
- `potion`: Moon Cube selected single potion. `potion2`: rudolfs selected single potion, with a runtime compatibility adapter preserving its original colored emissive texture.
- `amulet`: exact Benz Power Amulet; native Glow animation.
- `hourglass`: first-round selected Grab3D CC0 static hourglass, separate from the animated second-round Sands of Time.

`effect=cone|fireworks` plays authored quarks effects after the genuine model loads. `reduced=1` disables motion. `spin=1` enables slow orbit. `thumbnail=1` hides all text/buttons, creates a centered square stage with stable camera, disables auto-motion, and poses the native sand animation at 2.5 seconds for CUA screenshot generation. It is an actual 3D render, not an illustration.

## Parent/iframe protocol

All incoming messages require `event.source===parent` and `event.origin===location.origin`.

Viewer to parent:

- `{type:'moya:item-ready', item, model, animations:[{name,duration}], local:true, thumbnail}`
- `{type:'moya:item-error', item, message}`

Parent to viewer:

- `{type:'moya:item-state', paused:boolean, reduced:boolean}`
- `{type:'moya:item-fx', effect:'cone'|'fireworks'}`
- `{type:'moya:item-play', animation:'Sand Animation'|'Glow'}`

No arbitrary external URL may be loaded through query parameters or messages. Model IDs are a local whitelist.

## Provenance and runtime sources

`assets/selected-items/manifest.json` has 15 logical mappings, 16 genuine source models (including the retained crystal), sources, attribution, license, original SHA256 and actual GLB animation metadata. Per-source SOURCE.json, full CC0/CC BY license text and ATTRIBUTIONS.md are retained. `credits.html` is the user-facing attribution page. The selected crown (B2) is still pending a proper original model file and is not silently replaced.

Original GLBs are retained unmodified. Runtime normalizes scale and positions, lights models, approximates a retired glTF material extension where necessary, and tints rarity/chest metal parts. Game Badge's separately recorded mobile derivative resizes embedded textures to 512px; it does not alter geometry, hierarchy, UVs or animations. Full changes and hashes are in its MOBILE-DERIVATIVE.json.

`design/verify-selected-items.mjs` validates genuine GLTF scene/animation decoding and actual changing Sand Animation morph weights. It substitutes 1px bitmap decoders only in the Node test; **browser texture and visual quality must be verified separately**. The browser viewer uses the real embedded textures.

