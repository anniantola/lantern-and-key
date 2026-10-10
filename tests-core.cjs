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
function simulateGame(saved, extraStore={}){
 const store={'lantern-and-key.save.v1':JSON.stringify(saved),...extraStore};
 const handlers={};
 const app={innerHTML:'',addEventListener:(type,cb)=>handlers[type]=cb};
 const doc={querySelector:selector=>selector==='#app'?app:null,addEventListener:()=>{}};
 const sandbox={
  window:{LanternCore:require('./logic.js'),matchMedia:()=>({matches:false}),addEventListener:()=>{},scrollTo:()=>{}},
  document:doc,localStorage:{getItem:key=>store[key]||null,setItem:(key,value)=>store[key]=String(value),removeItem:key=>delete store[key]},
  navigator:{userAgent:'Node automated test'},location:{protocol:'file:'},confirm:()=>true,alert:message=>{throw new Error(message)},
  requestAnimationFrame:fn=>fn(),console,Math,Date,JSON,Number,String,Array,Object,Promise,setTimeout:()=>{},
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
  const game=simulateGame({...base,stage:'reveal',ending:null,inventory:{rope:1,rations:2,torch:1,smoke:1}});
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
