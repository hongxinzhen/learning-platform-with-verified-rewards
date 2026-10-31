const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../reward-engine.js');
test('rename cards migrate once and are awarded only at declared ten-level milestones',()=>{
 const s=R.fresh('2026-10-01');assert.equal(s.inventory.renameCard,1);assert.equal(R.upgradeRenameCards(s),false);
 const old=JSON.parse(JSON.stringify(s));delete old.renameRevision;delete old.inventory.renameCard;
 assert.equal(R.upgradeRenameCards(old),true);assert.equal(old.inventory.renameCard,1);old.inventory.renameCard=0;
 assert.equal(R.upgradeRenameCards(old),false);R.validate(old);assert.equal(old.inventory.renameCard,0);
 const retained=JSON.parse(JSON.stringify(s));delete retained.renameRevision;retained.inventory.renameCard=4;R.upgradeRenameCards(retained);assert.equal(retained.inventory.renameCard,4);
 assert.equal(R.levelPack(9).renameCard,undefined);assert.equal(R.levelPack(10).renameCard,1);
 R.debugXp(s,R.heroTotal(20));assert.equal(s.inventory.renameCard,3);R.debugXp(s,1);assert.equal(s.inventory.renameCard,3);R.validate(s);
});
test('renaming requires an owned pet and one card; replay and same-name submissions never spend another card',()=>{
 const s=R.fresh('2026-10-01'),before={hero:s.heroXp,pet:s.pets[0].xp};
 assert.throws(()=>R.renamePet(s,'fox','新名字'));assert.equal(s.inventory.renameCard,1);
 for(const name of ['', '  ', '<小禾>', '小\u0000禾', '十三个字十三个字十三个字十三个字'])assert.throws(()=>R.renamePet(s,'lime',name));
 assert.equal(s.inventory.renameCard,1);const e=R.renamePet(s,'lime','  糯米  ');assert.equal(s.pets[0].name,'糯米');assert.equal(s.inventory.renameCard,0);assert.equal(e.consumed.renameCard,1);
 const replay=R.renamePet(s,'lime','糯米');assert.equal(replay.renamed.changed,false);assert.equal(s.inventory.renameCard,0);
 assert.throws(()=>R.renamePet(s,'lime','团子'),/改名卡/);assert.equal(s.pets[0].name,'糯米');assert.deepEqual({hero:s.heroXp,pet:s.pets[0].xp},before);R.validate(s);
});
