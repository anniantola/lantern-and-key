/* Dependency-free Act II integration tests using the actual game code in a stub DOM. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {validateSave}=require('./logic.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'game.js'),'utf8');
const instrumented=source.replace('s=load();\nrender();\n})();',`globalThis.__worldTest={
 get:()=>s, seed:(value)=>{s=upgradeSave(value);s.storyResult=null;s.outcome=null;s.pending=null;},
 freshWorld,normalizeWorld,world,worldAction,worldPartyAction,worldScene,worldBeacon,worldLoyalty,worldGain,worldAtlas,
 renderWorldMap,renderParty,renderWorldBattle,worldBattleAction,worldBeat,startWorldBattle,worldCompanionBonus,worldMapTravel,worldQuestLedger,upgradeSave,initialSave
};\ns=load();\nrender();\n})();`);
assert.notEqual(instrumented,source,'test hook is present');
function env(){
 let db={};const app={innerHTML:'',addEventListener(){}};
 const sandbox={
 window:{LanternCore:require('./logic.js'),addEventListener(){},matchMedia:()=>({matches:false}),scrollTo(){}},
 document:{querySelector:()=>app,addEventListener(){}},
 navigator:{userAgent:'Test'},localStorage:{getItem:k=>db[k]??null,setItem:(k,v)=>db[k]=String(v),removeItem:k=>delete db[k]},
 console:{warn(){},error(){},log(){}},requestAnimationFrame:()=>{},setTimeout:()=>0,Math,Date,JSON,alert:()=>{},confirm:()=>true
 };
 vm.runInNewContext(instrumented,sandbox,{filename:'game.js',timeout:3000});return {...sandbox.__worldTest,html:()=>app.innerHTML,save:()=>JSON.parse(db['lantern-and-key.save.v1']||'null')};
}
function seeded(stage='epilogue'){
 const t=env(); const save=t.initialSave();
 Object.assign(save,{stage,classId:'fighter',heroName:'Rhea',level:2,hp:20,hitDice:2,unlocked:8,ending:'take',lanternSparks:3,inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:1},flags:{beaconPassed:true,lanternResolve:'guard'}});
 t.seed(save);return t;
}
function use(t,key){t.worldAction('w:'+key);const s=t.get();if(s.storyResult){s.storyResult=null;s.outcome=null;}return s;}

test('Old tutorial save reaches the regional map while keeping its lantern and class',()=>{
 const t=seeded();use(t,'begin');const s=t.get();assert.equal(s.stage,'roadMap');assert.equal(s.unlocked,9);assert.equal(s.inventory.lantern,1);assert.equal(s.heroName,'Rhea');assert.equal(s.frontier.gold,18);
 assert.equal(s.checkpoints[9].stage,'roadMap');assert.equal(validateSave(JSON.parse(JSON.stringify(s))).stage,'roadMap');
});
test('Gold has safe bounds, and shopping cannot create negative balances',()=>{
 const t=seeded();for(const key of ['begin','camp','market'])use(t,key);
 let s=t.get();s.frontier.gold=3;const before=s.potions;
 use(t,'potion');assert.equal(s.frontier.gold,3);assert.equal(s.potions,before);
 s.frontier.gold=8;use(t,'potion');assert.equal(s.frontier.gold,0);assert.equal(s.potions,before+1);
 use(t,'potion');assert.equal(s.potions,before+1);
});
test('A one-time caravan job cannot print unlimited gold',()=>{
 const t=seeded();for(const key of ['begin','camp','market'])use(t,key);
 use(t,'cartJob');const n=t.get().frontier.gold;use(t,'cartJob');assert.equal(t.get().frontier.gold,n);assert.equal(n,28);
});
test('Three recruits are persistent, but only two travel actively',()=>{
 const t=seeded();for(const key of ['begin','camp','recruit:mara','recruit:tamsin','recruit:corvin'])use(t,key);
 let w=t.get().frontier;assert.equal(w.recruited.length,3);assert.equal(w.active.length,2);assert.deepEqual(Array.from(w.active),['mara','tamsin']);
 t.worldPartyAction('wparty:corvin');assert.deepEqual(Array.from(w.active),['tamsin','corvin']);
 t.worldPartyAction('wparty:corvin');assert.deepEqual(Array.from(w.active),['tamsin']);
});
test('Private capture produces real monetary and social consequences',()=>{
 const t=seeded();for(const key of ['begin','camp','recruit:mara','recruit:tamsin','market','gate','beacon:waygate:claimed'])use(t,key);
 const w=t.get().frontier;assert.equal(w.beacons.waygate,'claimed');assert.equal(w.gold,34);assert.equal(w.dominion,1);assert.equal(w.reputation.keepers,-2);
 use(t,'beacon:waygate:claimed');assert.equal(w.gold,34);
});
test('Repeated private claims can prompt active companions to leave',()=>{
 const t=seeded();for(const key of ['begin','camp','recruit:mara','recruit:tamsin','market','gate','beacon:waygate:claimed','moor','moorTop','beacon:moor:claimed'])use(t,key);
 const w=t.get().frontier;assert.deepEqual(Array.from(w.active),[]);assert.equal(w.dominion,2);assert.equal(w.gold,50);
});
test('Public restoration rewards community trust and a smaller payment',()=>{
 const t=seeded();for(const key of ['begin','camp','market','gate','beacon:waygate:restored'])use(t,key);
 const w=t.get().frontier;assert.equal(w.beacons.waygate,'restored');assert.equal(w.gold,23);assert.equal(w.mercy,1);assert.equal(w.reputation.keepers,2);
});
test('Companion skill bonus contributes only when ally is active and loyal',()=>{
 const t=seeded();for(const key of ['begin','camp','recruit:mara'])use(t,key);
 assert.equal(t.worldCompanionBonus('perception'),2);assert.equal(t.worldCompanionBonus('arcana'),0);
 t.worldLoyalty(0,0,{mara:-3});assert.equal(t.worldCompanionBonus('perception'),0);
});
test('A choice cannot be executed while an unresolved result is on screen',()=>{
 const t=seeded();t.worldAction('w:begin');assert.ok(t.get().storyResult);
 t.worldAction('w:camp');assert.equal(t.get().stage,'roadMap');
});
test('Travel cannot skip directly from an early stop to the final chapter',()=>{
 const t=seeded();for(const key of ['begin','camp','market'])use(t,key);
 use(t,'heart');assert.equal(t.get().stage,'waymarket');
});
test('Chapter checkpoint data and the current state are independent objects',()=>{
 const t=seeded();for(const key of ['begin','camp','market'])use(t,key);
 assert.equal(t.get().checkpoints[9].stage,'roadMap');assert.equal(t.get().checkpoints[10].stage,'waymarket');
 t.get().frontier.gold=100;
 assert.equal(t.get().checkpoints[9].frontier.gold,18);
});
test('World save normalization rejects counterfeit wealth, unknown allies and forged signal states',()=>{
 const t=seeded();const w=t.normalizeWorld({gold:-90,day:0,recruited:['mara','mara','fake'],active:['fake','mara'],beacons:{moor:'ROOT'},trust:{mara:500},ending:'hacked'});
 assert.equal(w.gold,0);assert.equal(w.day,1);assert.deepEqual(Array.from(w.recruited),['mara']);assert.deepEqual(Array.from(w.active),['mara']);assert.equal(w.beacons.moor,'dark');assert.equal(w.trust.mara,5);assert.equal(w.ending,null);
});
test('Final choices have three distinct outcomes and cannot be reselected',()=>{
 for(const [choice,expected] of [['finalRestore','restore'],['finalRule','rule'],['finalFree','free']]){
  const t=seeded('worldheart');const save=t.get();save.unlocked=16;save.frontier=t.freshWorld();save.storyResult=null;
  use(t,choice);assert.equal(t.get().stage,'roadFinale');assert.equal(t.get().frontier.ending,expected);assert.ok(t.worldScene().text.length>=4);
  use(t,'finalRestore');assert.equal(t.get().frontier.ending,expected);
 }
});
test('Optional encounter serializes, pauses and permits a safe retreat',()=>{
 const t=seeded('glassfen');t.get().unlocked=12;t.get().frontier=t.freshWorld();
 t.worldAction('w:fenFight');const s=t.get();assert.ok(s.frontier.battle?.active);assert.ok(s.storyResult);
 s.storyResult=null;s.outcome=null;
 t.worldBattleAction('wb:init');assert.equal(s.frontier.battle.phase,'result');assert.ok(s.frontier.battle.result.title);
 const saved=JSON.parse(JSON.stringify(s));assert.equal(validateSave(saved).stage,'glassfen');
 s.frontier.battle.phase='player';s.frontier.battle.result=null;
 t.worldBattleAction('wb:retreat');assert.equal(s.frontier.battle.next,'flee');t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle,null);assert.equal(s.stage,'glassfen');
});
test('Battle defense and bonus healing each pause before another action',()=>{
 const t=seeded('glassfen');t.get().unlocked=12;t.get().frontier=t.freshWorld();t.get().hp=8;
 t.startWorldBattle('fenFight');t.get().storyResult=null;t.get().outcome=null;t.get().frontier.battle.phase='player';
 t.worldBattleAction('wb:potion');const b=t.get().frontier.battle;assert.equal(b.next,'bonus');assert.equal(b.phase,'result');assert.equal(t.get().potions,0);
 t.worldBattleAction('wb:continue');assert.equal(b.phase,'player');assert.equal(b.bonus,true);
 t.worldBattleAction('wb:dodge');assert.equal(b.next,'enemy');
});
test('Map content is rendered from recorded signal ownership and not user-supplied strings',()=>{
 const t=seeded();for(const key of ['begin','camp','market','gate','beacon:waygate:claimed'])use(t,key);
 const html=t.worldAtlas();assert.ok(html.includes('Privately'));assert.ok(html.includes('THE SHATTERED WATCHROAD'));assert.ok(!html.includes('<script'));
});
test('Known-map travel consumes supplies and reaches earlier optional quests without rewinding the campaign',()=>{
 const t=seeded('harbor');const s=t.get();s.frontier=t.freshWorld();s.unlocked=13;s.inventory.rations=2;
 const originalLevel=s.unlocked;t.worldMapTravel('wtravel:northmoor');assert.equal(s.stage,'northmoor');assert.equal(s.frontier.day,2);assert.equal(s.inventory.rations,1);assert.equal(s.unlocked,originalLevel);
 assert.ok(s.storyResult);assert.equal(s.frontier.beacons.moor,'dark');
});
test('Map travel rejects future regions, paused results and finalized endings',()=>{
 const t=seeded('waymarket');const s=t.get();s.frontier=t.freshWorld();s.unlocked=10;
 t.worldMapTravel('wtravel:citadel');assert.equal(s.stage,'waymarket');
 s.storyResult={title:'Pending',body:'Paused'};t.worldMapTravel('wtravel:roadCamp');assert.equal(s.stage,'waymarket');
 s.storyResult=null;s.stage='roadFinale';t.worldMapTravel('wtravel:roadCamp');assert.equal(s.stage,'roadFinale');
});
test('Exhausted ration travel costs HP but never silently kills the protagonist',()=>{
 const t=seeded('glassfen');const s=t.get();s.frontier=t.freshWorld();s.unlocked=12;s.inventory.rations=0;s.hp=2;
 t.worldMapTravel('wtravel:roadCamp');assert.equal(s.stage,'roadCamp');assert.equal(s.hp,1);assert.equal(s.frontier.day,2);
});
