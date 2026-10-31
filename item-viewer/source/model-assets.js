// Explicit URLs ensure Vite packages only genuine selected models as local files.
export const MODELS=Object.freeze({
 'food-burger':new URL('../../assets/selected-items/food-burger/model.glb',import.meta.url).href,
 'food-pizza':new URL('../../assets/selected-items/food-pizza/model.glb',import.meta.url).href,
 'food-croissant':new URL('../../assets/selected-items/food-croissant/model.glb',import.meta.url).href,
 'food-cake':new URL('../../assets/selected-items/food-cake/model.glb',import.meta.url).href,
 'rename-letter':new URL('../../assets/selected-items/rename-letter/model.glb',import.meta.url).href,

 crystal:new URL('../../assets/selected-items/crystal/model.glb',import.meta.url).href,
 spellbook:new URL('../../assets/selected-items/spellbook/model.glb',import.meta.url).href,
 chest:new URL('../../assets/selected-items/chest/model.glb',import.meta.url).href,
 'sands-of-time':new URL('../../assets/selected-items/sands-of-time/model.glb',import.meta.url).href,
 hourglass:new URL('../../assets/selected-items/hourglass/model.glb',import.meta.url).href,
 trophy:new URL('../../assets/selected-items/trophy/model.glb',import.meta.url).href,
 'potion-moon':new URL('../../assets/selected-items/potion-moon/model.glb',import.meta.url).href,
 'potion-rudolfs':new URL('../../assets/selected-items/potion-rudolfs/model.glb',import.meta.url).href,
 amulet:new URL('../../assets/selected-items/amulet/model.glb',import.meta.url).href,
 'game-badge':new URL('../../assets/selected-items/game-badge/model-mobile.glb',import.meta.url).href,
 'star-badge':new URL('../../assets/selected-items/star-badge/model.glb',import.meta.url).href
});
