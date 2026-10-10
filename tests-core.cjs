const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validateSave,shortestRoute,dashMovement,rangedDisadvantage,opposingRolls} = require('./logic.js');
const root=__dirname;
const base={version:1,stage:'camp',flags:{},journal:[],checks:[],heroName:'Hero',classId:'fighter',hp:7,potions:1,slots:0};
test('Legacy v1 saves are still accepted',()=>{assert.equal(validateSave({...base}).stage,'camp');});
test('Malformed story records are rejected before rendering',()=>{assert.throws(()=>validateSave({...base,checks:[null]}));assert.throws(()=>validateSave({...base,storyResult:{title:'x',body:'y',roll:{mode:'normal',die:'<img onerror=alert(1)>',total:20,dc:12,modifier:0,die1:20}}}));});
test('Imported strings cannot inject HTML markup',()=>{const clean=validateSave({...base,journal:[{text:'<img src=x onerror=alert(1)>',kind:'story'}],heroName:'<svg onload=alert(1)>'});assert.doesNotMatch(clean.journal[0].text,/[<>&"`]/);assert.doesNotMatch(clean.heroName,/[<>&"`]/);});
test('Unusual objects and nested malicious keys cannot alter prototypes',()=>{let save=JSON.parse(JSON.stringify(base));save.flags=JSON.parse('{"__proto__":{"polluted":true},"valid":true}');const clean=validateSave(save);assert.equal({}.polluted,undefined);assert.equal(clean.flags.valid,true);assert.equal(Object.prototype.hasOwnProperty.call(clean.flags,'__proto__'),false);});
test('Nonfinite or nonsensical values are rejected',()=>{assert.throws(()=>validateSave({...base,hp:NaN}));assert.throws(()=>validateSave({...base,stage:'fake'}));assert.throws(()=>validateSave({...base,combat:{phase:'player',enemyHp:'gone'}}));});
test('Shortest-path movement avoids costly terrain when an alternate route exists',()=>{const route=shortestRoute({x:0,y:2},{x:3,y:2},{x:4,y:1});assert.equal(route.cost,3);assert.equal(route.path.at(-1).x,3);});
test('Direct movement onto rough terrain costs two grid units',()=>{const route=shortestRoute({x:1,y:2},{x:2,y:2},{x:4,y:1});assert.equal(route.cost,2);});
test('Movement never passes through opponent square',()=>{const route=shortestRoute({x:0,y:2},{x:4,y:1},{x:4,y:1});assert.equal(route,null);});
test('Adjacent hostile creature imposes ranged attack disadvantage',()=>{assert.equal(rangedDisadvantage(true,true),true);assert.equal(rangedDisadvantage(false,true),false);assert.equal(rangedDisadvantage(true,true,false),false);assert.equal(opposingRolls(true,true),'normal');assert.equal(opposingRolls(false,true),'disadvantage');});
test('Game includes pause-to-continue, separate replay and knowledge checks',()=>{const game=fs.readFileSync(path.join(root,'game.js'),'utf8');for(const part of ['returnToMain','renderBeaconTest','practice:continue','rest:spend','quiz:','validateSave','recoveryView','shortestRoute','rangedDisadvantage'])assert.ok(game.includes(part),part);});
test('Deployable assets and script references exist',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/logic\.js/);assert.match(html,/game\.js/);for(const item of ['sw.js','manifest.webmanifest','style.css','logic.js','assets/forest.svg','assets/crossing.svg','assets/summit.svg'])assert.ok(fs.existsSync(path.join(root,item)),item);});
const vm=require('node:vm');
function simulateGame(saved, extraStore={}, fixedRoll=null){
 const store={'lantern-and-key.save.v1':JSON.stringify(saved),...extraStore};
 const handlers={};
 const app={innerHTML:'',addEventListener:(type,cb)=>handlers[type]=cb};
 const doc={querySelector:selector=>selector==='#app'?app:null,addEventListener:()=>{}};
 const mockMath=Object.create(Math);if(fixedRoll!==null)mockMath.random=()=>fixedRoll;
 const sandbox={
  window:{LanternCore:require('./logic.js'),matchMedia:()=>({matches:false}),addEventListener:()=>{},scrollTo:()=>{}},
  document:doc,localStorage:{getItem:key=>store[key]||null,setItem:(key,value)=>store[key]=String(value),removeItem:key=>delete store[key]},
  navigator:{userAgent:'Node automated test'},location:{protocol:'file:'},confirm:()=>true,alert:message=>{throw new Error(message)},
  requestAnimationFrame:fn=>fn(),console,Math:mockMath,Date,JSON,Number,String,Array,Object,Promise,setTimeout:()=>{},
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox,{timeout:5000});
 const act=key=>handlers.click({target:{dataset:{act:key},closest(){return this}}});
 const modal=key=>handlers.click({target:{dataset:{modal:key},closest(){return this}}});
 return {app,act,modal,importFile:file=>handlers.change({target:{id:'importFile',files:[file]}}),read:()=>JSON.parse(store['lantern-and-key.save.v1']),store};
}
test('Navigation opens tabs and returns to the same story without overwriting progress',()=>{
 const game=simulateGame({...base,stage:'forest'});
 assert.match(game.app.innerHTML,/game-tool-nav/);
 game.modal('inventory');assert.match(game.app.innerHTML,/Equipment &amp; inventory/);
 game.modal('learn');assert.match(game.app.innerHTML,/Learning journal/);
 game.act('backStory');assert.doesNotMatch(game.app.innerHTML,/modal-backdrop/);
 assert.equal(game.read().stage,'forest');
});
test('Choosing an action pauses the story and continues without losing the stage',()=>{
 const game=simulateGame({...base,stage:'camp',hp:2,hitDice:1});
 game.act('c:shortRest');assert.match(game.app.innerHTML,/rest-controls/);
 game.act('rest:spend');assert.equal(game.read().hitDice,0);
 game.act('rest:finish');game.act('continueStory');assert.equal(game.read().stage,'camp');
 assert.match(game.app.innerHTML,/story-screen/);
});

// v2.3.1 regression cases: stage-correct imports, replay-aware backups, and stacked Dash.
test('Incomplete encounter saves are rejected before rendering',()=>{
 const combat={phase:'initiative',enemyHp:11,enemyMax:11,enemyAc:12,round:1,log:[]};
 const tactics={phase:'player',hero:{x:0,y:2},enemy:{x:4,y:1},enemyHp:14,enemyMax:14,round:1};
 const beacon={active:true,phase:'player',enemyHp:16,enemyMax:16,round:1};
 for(const stage of ['combat','crossingBattle','beaconTest'])assert.throws(()=>validateSave({...base,stage}));
 assert.equal(validateSave({...base,stage:'combat',combat}).stage,'combat');
 assert.equal(validateSave({...base,stage:'crossingBattle',tactics}).stage,'crossingBattle');
 assert.equal(validateSave({...base,stage:'beaconTest',finalTest:beacon}).stage,'beaconTest');
 assert.throws(()=>validateSave({...base,stage:'combat',combat:{...combat,phase:'result',result:null,next:'player'}}));
 assert.throws(()=>validateSave({...base,stage:'crossingBattle',tactics:{...tactics,phase:'result',result:null,next:'player'}}));
 assert.throws(()=>validateSave({...base,stage:'beaconTest',finalTest:{...beacon,phase:'result',result:null,next:'player'}}));
 // A result must have the transition and fields actually read by the renderer.
 assert.throws(()=>validateSave({...base,stage:'combat',combat:{...combat,phase:'result',result:{title:'oops'},next:'enemy'}}));
});
test('Both Dash actions each add 30 feet of movement',()=>{
 assert.equal(dashMovement(6),12);
 assert.equal(dashMovement(dashMovement(6)),18);
 assert.equal(dashMovement(12),18);
 assert.throws(()=>dashMovement(-1));
});
test('Rogue Cunning Dash plus normal Dash yields 90 feet in the bridge encounter',()=>{
 const tactics={phase:'player',hero:{x:0,y:2},enemy:{x:4,y:1},enemyHp:14,enemyMax:14,round:1,
  usedMove:0,moveLimit:6,usedAction:false,usedBonus:false,disengaged:false,dodging:false,hidden:false,reactionReady:true,result:null,next:null,log:[]};
 const game=simulateGame({...base,stage:'crossingBattle',classId:'rogue',level:2,hp:17,tactics});
 game.act('tactic:cunningDash');assert.equal(game.read().tactics.moveLimit,12);
 game.act('tactic:continue');
 game.act('tactic:dash');assert.equal(game.read().tactics.moveLimit,18);
 assert.equal(game.read().tactics.usedAction,true);
});
test('Importing from replay backs up the main campaign, and restores the main campaign',async()=>{
 const main={...base,stage:'forest',heroName:'MAIN HERO',hp:5};
 const replay={...base,stage:'camp',heroName:'REPLAY HERO',hp:2,replay:{chapter:4}};
 const incoming={...base,stage:'trail',heroName:'IMPORTED HERO',hp:6};
 const game=simulateGame(main,{'lantern-and-key.replay.v1':JSON.stringify(replay)});
 assert.match(game.app.innerHTML,/REPLAY HERO/);
 game.importFile({size:400,text:async()=>JSON.stringify(incoming)});
 await new Promise(setImmediate);await new Promise(setImmediate);
 const backup=JSON.parse(game.store['lantern-and-key.preimport.v1']);
 assert.equal(backup.heroName,'MAIN HERO');
 assert.equal(backup.stage,'forest');
 assert.equal(game.read().heroName,'IMPORTED HERO');
 assert.equal(game.store['lantern-and-key.replay.v1'],undefined);
 game.act('restorePreImport');
 assert.equal(game.read().heroName,'MAIN HERO');
 assert.equal(game.read().stage,'forest');
});
test('Combat explanation for level-2 Second Wind uses the correct level bonus',()=>{
 const combat={phase:'player',enemyHp:11,enemyMax:11,enemyAc:12,round:1,log:[],bonusUsed:false};
 const game=simulateGame({...base,stage:'combat',level:2,hp:6,secondWind:2,combat});
 assert.match(game.app.innerHTML,/1d10\+2 HP/);
 game.act('bonus:secondWind');
 assert.match(game.app.innerHTML,/Second Wind: 1d10 \+ 2 =/);
});

// v2.3.2 regression: Chapter 3 choice must grant a tangible inventory item.
test('Keeping the lantern immediately adds The Last Lantern to the Pack',()=>{
 const game=simulateGame({...base,stage:'reveal',ending:null,flags:{key:true},inventory:{rope:1,rations:2,torch:1,smoke:1}});
 game.act('take');
 assert.equal(game.read().ending,'take');
 assert.equal(game.read().inventory.lantern,1);
 game.modal('inventory');
 assert.match(game.app.innerHTML,/The Last Lantern ×1/);
});
test('Existing saves that already kept the lantern gain it automatically',()=>{
 const oldSave={...base,stage:'forest',ending:'take',inventory:{rope:1,rations:2,torch:1,smoke:1}};
 const game=simulateGame(oldSave);
 game.modal('inventory');
 assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 // Once any ordinary action saves the upgraded data, the migration persists.
 game.act('backStory');game.act('c:camp');
 assert.equal(game.read().inventory.lantern,1);
});
test('Restoring or returning the lantern never creates an inventory copy',()=>{
 for(const action of ['restore','return']){
  const game=simulateGame({...base,stage:'reveal',ending:null,flags:action==='restore'?{key:true}:{},inventory:{rope:1,rations:2,torch:1,smoke:1}});
  game.act(action);
  assert.equal(game.read().inventory.lantern,0);
  game.modal('inventory');
  assert.doesNotMatch(game.app.innerHTML,/The Last Lantern ×1/);
 }
});
test('An imported older save with a keep decision repairs the lantern item',async()=>{
 const game=simulateGame({...base,stage:'forest',ending:null});
 const oldSave={...base,stage:'forest',ending:'take',inventory:{rope:1,rations:2,torch:1,smoke:1}};
 game.importFile({size:500,text:async()=>JSON.stringify(oldSave)});
 await new Promise(setImmediate);await new Promise(setImmediate);
 assert.equal(game.read().inventory.lantern,1);
 game.modal('inventory');assert.match(game.app.innerHTML,/The Last Lantern ×1/);
});

// v2.4 regression: carried artifact is recovered from *explicit zero* old saves.
test('Dangerous Souvenir saves with inventory lantern explicitly zero migrate to a real Pack item',()=>{
 const old={...base,stage:'camp',ending:'take',inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:0}};
 const game=simulateGame(old);
 game.modal('inventory');
 assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 assert.match(game.app.innerHTML,/3 \/ 3 sparks remaining/);
 game.act('backStory');game.act('c:shortRest');
 assert.equal(game.read().inventory.lantern,1);
 assert.equal(game.read().lanternSparks,3);
});
test('Older Dangerous Souvenir journal records also migrate when ending is missing',()=>{
 const old={...base,stage:'forest',ending:null,inventory:{lantern:0},journal:[{kind:'story',text:'A dangerous souvenir: you carry it'}]};
 const game=simulateGame(old);game.modal('inventory');
 assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 game.act('backStory');game.act('c:camp');
 assert.equal(game.read().ending,'take');
});
test('An imported legacy Dangerous Souvenir save recovers lantern even if inventory explicitly contains zero',async()=>{
 const game=simulateGame({...base,stage:'forest'});
 const incoming={...base,stage:'crossing',ending:'take',inventory:{lantern:0},flags:{}};
 game.importFile({size:200,text:async()=>JSON.stringify(incoming)});
 await new Promise(setImmediate);await new Promise(setImmediate);
 assert.equal(game.read().inventory.lantern,1);
 assert.equal(game.read().lanternSparks,3);
 game.modal('inventory');assert.match(game.app.innerHTML,/The Last Lantern ×1/);
});
test('Lantern ward consumes one spark and changes long rest safety, but does not consume the item',()=>{
 const game=simulateGame({...base,stage:'camp',ending:'take',inventory:{lantern:0},hp:4,flags:{}});
 game.act('c:lanternWard');
 const after=game.read();
 assert.equal(after.inventory.lantern,1);
 assert.equal(after.lanternSparks,2);
 assert.equal(after.flags.shelter,true);
 assert.ok(after.storyResult);
 game.act('continueStory');
 game.act('c:longRest');
 assert.equal(game.read().hp,12);
 assert.equal(game.read().lanternSparks,3);
 assert.equal(game.read().flags.longRested,true);
});
test('Lantern bridge choice gives a distinct crossing and updates campaign choices',()=>{
 const game=simulateGame({...base,stage:'crossing',ending:'take',inventory:{lantern:0}});
 game.act('c:lanternCross');
 assert.equal(game.read().stage,'crossingAfter');
 assert.equal(game.read().flags.lanternBridge,true);
 assert.equal(game.read().lanternSparks,2);
 assert.equal(game.read().inventory.lantern,1);
});
test('Using the lantern on the village ledger grants meaningful evidence at a cost',()=>{
 const game=simulateGame({...base,stage:'market',ending:'take',inventory:{lantern:0}});
 game.act('c:lanternLedger');
 assert.equal(game.read().flags.villageEvidence,true);
 assert.equal(game.read().flags.lanternLedger,true);
 assert.equal(game.read().lanternSparks,2);
 game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/data-act="c:lanternLedger"/);
});
test('The arcane study may replenish a depleted lantern, but can be used only once',()=>{
 const game=simulateGame({...base,stage:'archive',ending:'take',inventory:{lantern:1},lanternSparks:0});
 game.act('c:lanternStudy');
 assert.equal(game.read().lanternSparks,1);
 assert.equal(game.read().flags.lanternStudied,true);
 game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/data-act="c:lanternStudy"/);
});
test('The final lantern choice branches the ending and preserves the artifact',()=>{
 const game=simulateGame({...base,stage:'lanternOath',ending:'take',inventory:{lantern:0},lanternSparks:2});
 assert.match(game.app.innerHTML,/c:lanternShare/);
 game.act('c:lanternShare');
 assert.equal(game.read().stage,'epilogue');
 assert.equal(game.read().flags.lanternResolve,'share');
 assert.equal(game.read().lanternSparks,1);
 assert.equal(game.read().inventory.lantern,1);
 game.act('continueStory');
 assert.match(game.app.innerHTML,/chain of watch-lights/);
});
test('The final choice never traps a player who has spent every lantern spark',()=>{
 const game=simulateGame({...base,stage:'lanternOath',ending:'take',inventory:{lantern:1},lanternSparks:0});
 assert.match(game.app.innerHTML,/c:lanternGuard/);
 game.act('c:lanternShare');assert.equal(game.read().stage,'lanternOath');
 game.act('c:lanternGuard');assert.equal(game.read().stage,'epilogue');
 assert.equal(game.read().inventory.lantern,1);
});
test('An existing completed souvenir save can unlock the added final chapter without restarting',()=>{
 const game=simulateGame({...base,stage:'epilogue',ending:'take',inventory:{lantern:0}});
 assert.match(game.app.innerHTML,/c:lanternAfterword/);
 game.act('c:lanternAfterword');
 assert.equal(game.read().stage,'lanternOath');
 assert.equal(game.read().inventory.lantern,1);
});
test('Other vault decisions keep working and cannot acquire the lantern',()=>{
 for(const ending of ['return','restore','escape']){
  const game=simulateGame({...base,stage:'lanternOath',ending,inventory:{lantern:0}});
  game.modal('inventory');assert.doesNotMatch(game.app.innerHTML,/The Last Lantern ×1/);
  game.act('backStory');game.act('c:lanternCommunity');
  assert.equal(game.read().stage,'epilogue');
  assert.equal(game.read().flags.lanternResolve,'community');
  assert.equal(game.read().inventory.lantern,0);
 }
});
test('Replay keeps the artifact, while the separate main timeline remains unchanged',()=>{
 const main={...base,stage:'village',ending:'take',inventory:{lantern:0},heroName:'Main'};
 const replay={...base,stage:'camp',ending:'take',inventory:{lantern:0},heroName:'Replay',replay:{chapter:4}};
 const game=simulateGame(main,{'lantern-and-key.replay.v1':JSON.stringify(replay)});
 game.modal('inventory');assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 game.act('backStory');game.act('c:lanternWard');
 assert.equal(JSON.parse(game.store['lantern-and-key.replay.v1']).inventory.lantern,1);
 assert.equal(JSON.parse(game.store['lantern-and-key.save.v1']).inventory.lantern,0);
 game.act('returnMain');game.modal('inventory');assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 // Opening the main timeline migrates and persists the kept item there, too.
 assert.equal(JSON.parse(game.store['lantern-and-key.save.v1']).inventory.lantern,1);
 assert.equal(JSON.parse(game.store['lantern-and-key.save.v1']).stage,'village');
});
test('Finishing the final check leads to the expanded lantern decision, not straight to epilogue',()=>{
 const game=simulateGame({...base,stage:'levelup',ending:'take',inventory:{lantern:0},level:2,classId:'rogue',hp:17,flags:{beaconPassed:true},unlocked:8});
 game.act('c:toFinal');
 assert.match(game.app.innerHTML,/data-act="rollCheck"/);
 game.act('rollCheck');
 assert.equal(game.read().stage,'lanternOath');
 assert.equal(game.read().inventory.lantern,1);
});

// v2.4.1 narrative-integrity regressions. The browser-facing code is exercised
// through its own event handlers and localStorage, not isolated fake state reducers.
test('Restoring the vault without the key requires a successful improvised-repair check',()=>{
 const fail=simulateGame({...base,stage:'reveal',flags:{},ending:null}, {}, 0);
 assert.doesNotMatch(fail.app.innerHTML,/data-act="restore"/);
 assert.match(fail.app.innerHTML,/data-act="improviseBeacon"/);
 fail.act('restore');assert.equal(fail.read().stage,'reveal');
 fail.act('improviseBeacon');assert.equal(fail.read().pending.key,'improviseBeacon');
 fail.act('rollCheck');assert.equal(fail.read().flags.triedBeaconRepair,true);
 assert.equal(fail.read().stage,'reveal');assert.equal(fail.read().flags.key,undefined);
 fail.act('continueStory');assert.doesNotMatch(fail.app.innerHTML,/data-act="improviseBeacon"/);
 assert.match(fail.app.innerHTML,/data-act="take"/);
 const pass=simulateGame({...base,stage:'reveal',flags:{},ending:null}, {}, .99);
 pass.act('improviseBeacon');pass.act('rollCheck');
 assert.equal(pass.read().stage,'ending');assert.equal(pass.read().ending,'restore');
 assert.equal(pass.read().flags.repairedWithoutKey,true);
 assert.equal(pass.read().storyResult.roll.success,true);
 assert.match(pass.read().storyResult.body,/align the mechanism by hand/);
 assert.equal(pass.read().inventory.lantern,0);
});
test('Silver key unlocks the direct restoration action without a repair roll',()=>{
 const g=simulateGame({...base,stage:'reveal',flags:{key:true},ending:null});
 assert.match(g.app.innerHTML,/data-act="restore"/);
 assert.doesNotMatch(g.app.innerHTML,/data-act="improviseBeacon"/);
 g.act('restore');assert.equal(g.read().ending,'restore');
 assert.match(g.read().storyResult.body,/silver key in the lantern/);
});
test('Existing keyless restoration saves migrate to a coherent alternative',()=>{
 const old={...base,stage:'ending',ending:'restore',flags:{},outcome:{title:'The lantern shines again',body:'You place the silver key in the lantern’s socket. Blue light floods the chamber.'},storyResult:{title:'The lantern shines again',body:'You place the silver key in the lantern’s socket. Blue light floods the chamber.',action:'Restore',fromStage:'reveal'},journal:[{text:'The lantern shines again: You place the silver key in the lantern’s socket.',kind:'story'}]};
 const g=simulateGame(old);
 assert.match(g.app.innerHTML,/align the old mechanism by hand/);
 g.act('continueStory');assert.equal(g.read().flags.repairedWithoutKey,true);
 assert.doesNotMatch(g.read().journal[0].text,/place the silver key/);
});
test('Lantern camp protection survives a later failed Survival check',()=>{
 const g=simulateGame({...base,stage:'camp',ending:'take',inventory:{lantern:1,rations:2},lanternSparks:2,flags:{lanternWard:true,shelter:true},pending:{key:'c:campShelter',name:'Wisdom (Survival)',skill:'survival',dc:12,bonus:1,mode:'normal',actionCue:{label:'Find shelter',fromStage:'camp',hpBefore:7}}}, {}, 0);
 g.act('rollCheck');assert.equal(g.read().flags.shelter,true);
 assert.match(g.read().storyResult.body,/lantern ward still keeps your camp safe/);
 g.act('continueStory');g.act('c:longRest');assert.equal(g.read().flags.longRested,true);
 assert.equal(g.read().lanternSparks,3);
});
test('A failed village council roll does not convert collected evidence into a solved case',()=>{
 const g=simulateGame({...base,stage:'council',flags:{villageEvidence:true},level:1}, {}, 0);
 g.act('c:council');g.act('rollCheck');
 assert.equal(g.read().stage,'trial');assert.equal(g.read().flags.villageSolved,false);
 assert.match(g.read().storyResult.body,/cannot accept all your claims/);
});
test('An old failed council verdict is reconciled from the save journal, leaving successes intact',()=>{
 for(const [verdict,solved] of [['The truth needs more work: The council investigates.',false],['A fair verdict: The villagers agree.',true]]){
  const g=simulateGame({...base,stage:'trial',flags:{villageEvidence:true,villageSolved:!solved},journal:[{text:verdict,kind:'story'}]});
  g.act('c:toArchive');assert.equal(g.read().flags.villageSolved,solved);
 }
});
test('Merchant observations are based on the merchant ledger before the mill is visited',()=>{
 const g=simulateGame({...base,stage:'market',flags:{}}, {}, .99);
 g.act('c:marketInsight');g.act('rollCheck');
 const result=g.read().storyResult.body;
 assert.match(result,/merchant’s own ledger/);assert.match(result,/not yet seen the miller’s records/);
 assert.equal(g.read().flags.villageEvidence,undefined);
});
test('Watermill confrontation addresses a present worker, not an absent treasurer',()=>{
 const g=simulateGame({...base,stage:'witness',flags:{}}, {}, .99);
 assert.match(g.app.innerHTML,/Press the mill worker/);
 g.act('c:confront');g.act('rollCheck');
 assert.match(g.read().storyResult.body,/mill worker/);
 assert.doesNotMatch(g.read().storyResult.body,/treasurer admits/);
 assert.equal(g.read().flags.villageEvidence,true);
});
test('Unscouted and rope-secured travel no longer claims the player took other routes',()=>{
 const g=simulateGame({...base,stage:'camp',flags:{},inventory:{rope:1,rations:2}});
 g.act('c:toTrail');g.act('continueStory');
 assert.match(g.app.innerHTML,/without scouting/);
 assert.doesNotMatch(g.app.innerHTML,/muddy detour reminded/);
 assert.equal(g.read().inventory.rations,2);
 g.act('c:toBridge');g.act('continueStory');g.act('c:ropeCross');g.act('continueStory');
 assert.match(g.app.innerHTML,/rope still stretches/);
 assert.doesNotMatch(g.app.innerHTML,/cost of crossing is written/);
 assert.equal(g.read().flags.bridgeFought,undefined);
});
test('An unsafe Long Rest cannot succeed by repeating it; relocating camp resolves the obstacle',()=>{
 const g=simulateGame({...base,stage:'camp',flags:{},inventory:{rope:1,rations:2},hp:7});
 g.act('c:longRest');assert.equal(g.read().flags.longInterrupted,true);
 assert.equal(g.read().flags.longRested,undefined);
 g.act('continueStory');g.act('c:longRest');assert.equal(g.read().flags.longRested,undefined);
 g.act('continueStory');assert.match(g.app.innerHTML,/data-act="c:relocateCamp"/);
 g.act('c:relocateCamp');assert.equal(g.read().flags.shelter,true);
 assert.equal(g.read().inventory.rations,1);
 g.act('continueStory');g.act('c:longRest');assert.equal(g.read().flags.longRested,true);
});
test('Final resolution alternatives have distinct consequences in prose and preserved ownership',()=>{
 const seen=[];
 for(const [choiceKey,ending,cost] of [['c:lanternGuard','take',0],['c:lanternShare','take',1],['c:lanternReveal','take',2],['c:lanternHonor','restore',0],['c:lanternCommunity','return',0]]){
  const g=simulateGame({...base,stage:'lanternOath',level:2,hp:20,ending,flags:{villageSolved:true,key:true},inventory:{lantern:ending==='take'?1:0},lanternSparks:ending==='take'?3:0});
  g.act(choiceKey);assert.equal(g.read().stage,'epilogue');
  if(ending==='take')assert.equal(g.read().lanternSparks,3-cost);
  g.act('continueStory');seen.push(g.app.innerHTML.match(/<div class="prose"><p>(.*?)<\/p>/)?.[1]);
 }
 assert.equal(seen.length,5);assert.equal(new Set(seen).size,5);
});

test('v2.4 saves repair overwritten lantern shelter without consuming another spark',()=>{
 const save={...base,stage:'camp',ending:'take',inventory:{lantern:0,rations:2},lanternSparks:1,flags:{lanternWard:true,shelter:false}};
 const g=simulateGame(save);
 assert.match(g.app.innerHTML,/lantern ward still encloses the camp/);
 g.act('c:longRest');
 assert.equal(g.read().flags.longRested,true);
 assert.equal(g.read().lanternSparks,2);
 assert.equal(g.read().inventory.lantern,1);
});


// v2.4.2: one-time story actions vanish after resolving, not just when successful.
test('A failed bridge investigation disappears but alternatives remain',()=>{
 const game=simulateGame({...base,stage:'crossing',flags:{},hp:8}, {}, 0);
 assert.match(game.app.innerHTML,/Study the ruined masonry/);
 game.act('c:bridgeInspect');game.act('rollCheck');
 assert.match(game.app.innerHTML,/The next scene is paused/);
 game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/Study the ruined masonry/);
 assert.match(game.app.innerHTML,/Negotiate with the guard/);
 assert.match(game.app.innerHTML,/Defend yourself on the bridge/);
 assert.equal(game.read().flags.storyActions['c:bridgeInspect'],true);
});
test('A failed attempt to negotiate can not be rerolled without new circumstances',()=>{
 const game=simulateGame({...base,stage:'crossing',flags:{},hp:8}, {}, 0);
 game.act('c:bridgeParley');game.act('rollCheck');game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/Negotiate with the guard/);
 assert.match(game.app.innerHTML,/Defend yourself on the bridge/);
});
test('Failed investigation in market disappears while navigation remains',()=>{
 const game=simulateGame({...base,stage:'market',flags:{},hp:8}, {}, 0);
 game.act('c:marketInsight');game.act('rollCheck');game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/Study the merchant’s manner/);
 assert.match(game.app.innerHTML,/Compare the miller’s account/);
 assert.match(game.app.innerHTML,/Take your findings to the council/);
});
test('Successful and failed magical demonstrations are one-time story choices',()=>{
 const game=simulateGame({...base,stage:'altar',flags:{},hp:8}, {}, 0);
 game.act('c:spellAttack');game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/Watch a Fire Bolt attack roll/);
 assert.match(game.app.innerHTML,/Observe Burning Hands/);
 game.act('c:concentrate');game.act('rollCheck');game.act('continueStory');
 assert.doesNotMatch(game.app.innerHTML,/Maintain a concentration effect/);
 assert.match(game.app.innerHTML,/Finish the trial and follow the beacon road/);
});
test('Old failed investigation saves hide repeated choices using journal history',()=>{
 const game=simulateGame({...base,stage:'crossing',hp:8,flags:{},journal:[{kind:'failure',text:'Cracked stones everywhere: You cannot identify a safe crossing.',time:'2026-10-10'}]});
 assert.doesNotMatch(game.app.innerHTML,/Study the ruined masonry/);
 assert.match(game.app.innerHTML,/Negotiate with the guard/);
});
test('Old failed social checks are also recognized when the stored result is false',()=>{
 const game=simulateGame({...base,stage:'witness',hp:8,flags:{millerTrust:false}});
 assert.doesNotMatch(game.app.innerHTML,/Promise the miller a fair hearing/);
 assert.match(game.app.innerHTML,/Bring what you know to the council/);
});
test('Tavern dialogue options vanish after their one-time conversation finishes',()=>{
 const game=simulateGame({...base,stage:'tavernHub',hp:8,flags:{triedStranger:true,triedKeeper:true}});
 assert.doesNotMatch(game.app.innerHTML,/Speak to the stranger/);
 assert.doesNotMatch(game.app.innerHTML,/Talk to the tavern keeper/);
 assert.match(game.app.innerHTML,/Approach the locked door/);
});
test('Consumables, rests, and travel options remain repeatable',()=>{
 const game=simulateGame({...base,stage:'camp',hp:7,hitDice:1,potions:2,flags:{},inventory:{rations:2,rope:1}});
 game.act('c:shortRest');game.act('rest:finish');game.act('continueStory');
 assert.match(game.app.innerHTML,/Take a Short Rest/);
 assert.match(game.app.innerHTML,/Drink a Potion of Healing/);
 assert.match(game.app.innerHTML,/Break camp and follow the road/);
});
test('Older bridge save remembers a failed check even when its journal was truncated',()=>{
 const game=simulateGame({...base,stage:'crossing',hp:8,flags:{bridgeSafe:false,bridgeParley:false},journal:[]});
 assert.doesNotMatch(game.app.innerHTML,/Study the ruined masonry/);
 assert.doesNotMatch(game.app.innerHTML,/Negotiate with the guard/);
 assert.match(game.app.innerHTML,/Defend yourself on the bridge/);
});

// v2.5.0: narrative expansion must respect saved state, secrets and pause pacing.
test('All eight chapters have connective lore without revealing later field notes',()=>{
 const src=fs.readFileSync(path.join(root,'game.js'),'utf8');
 for(const stage of ['tavern','passage','vault','forest','camp','trail','crossing','crossingAfter','village','market','witness','council','trial','archive','altar','ascent','levelup','beaconTest','lanternOath','epilogue']){
  assert.match(src,new RegExp('\\b'+stage+':\\['));
 }
 assert.match(src,/function narrativeText\(stage,original\)/);
 assert.match(src,/function storyBridge\(from,to\)/);
 assert.match(src,/number<=reached/);
});
test('New scene lore does not alter story decisions or the save schema',()=>{
 const game=simulateGame({...base,stage:'forest',ending:'restore',flags:{},inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:0}});
 assert.match(game.app.innerHTML,/watchroad/);
 assert.match(game.app.innerHTML,/restored light/);
 game.act('c:camp');assert.match(game.app.innerHTML,/YOUR LAST ACTION/);
 game.act('continueStory');assert.equal(game.read().stage,'camp');
 assert.match(game.app.innerHTML,/standing stones/);
 assert.equal(game.read().inventory.lantern,0);
});
test('Lantern holder sees distinct forest narration; older dangerous-souvenir save keeps item',()=>{
 const game=simulateGame({...base,stage:'forest',ending:'take',inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:0}});
 assert.match(game.app.innerHTML,/Carry(?:ing| it)/);
 game.modal('inventory');assert.match(game.app.innerHTML,/The Last Lantern ×1/);
 game.modal('journal');
 assert.match(game.app.innerHTML,/Field notes from the watchroad/);
 assert.doesNotMatch(game.app.innerHTML,/The mountain watchtower/);
});
test('Field notes unlock progressively and journal preserves spoiler boundaries',()=>{
 const early=simulateGame({...base,stage:'tavern',unlocked:1});
 early.modal('journal');
 assert.match(early.app.innerHTML,/The three-eyed wolf/);
 assert.doesNotMatch(early.app.innerHTML,/The mountain watchtower/);
 const late=simulateGame({...base,stage:'epilogue',unlocked:8,level:2,flags:{beaconPassed:true}});
 late.modal('journal');
 assert.match(late.app.innerHTML,/The mountain watchtower/);
});
test('The council decision connects its outcome to the next destination',()=>{
 for(const roll of [0.99,0.01]){
  const game=simulateGame({...base,stage:'council',unlocked:6,flags:{villageEvidence:true}}, {},roll);
  game.act('c:council');
  game.act('rollCheck');
  // Both success and failure should offer an in-world reason to travel onward.
  assert.match(game.app.innerHTML,/Elowen|watchtower|watchroad|school/);
 }
});
test('Transitions add the appropriate interlude while keeping result pause',()=>{
 const game=simulateGame({...base,stage:'crossingAfter',unlocked:5});
 game.act('c:toVillage');
 assert.equal(game.read().stage,'village');
 assert.match(game.app.innerHTML,/The banner on the far bank bears a grain tally/);
 game.act('continueStory');
 assert.match(game.app.innerHTML,/Briar Hollow/);
 assert.doesNotMatch(game.app.innerHTML,/The banner on the far bank bears a grain tally/);
});
