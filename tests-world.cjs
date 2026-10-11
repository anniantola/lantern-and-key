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
 renderWorldMap,renderParty,renderWorldBattle,worldBattleAction,worldBeat,startWorldBattle,worldCompanionBonus,worldMapTravel,worldQuestLedger,renderSheet,worldRestChoices,skillBonus,upgradeSave,initialSave
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
 const t=seeded();for(const key of ['begin','camp','recruit:mara','recruit:tamsin','market','gate','challenge:wayInvestigation','continue:wayInvestigation','beacon:waygate:claimed'])use(t,key);
 const w=t.get().frontier;assert.equal(w.beacons.waygate,'claimed');assert.equal(w.gold,34);assert.equal(w.dominion,1);assert.equal(w.reputation.keepers,-2+(t.get().checks.at(-1)?.success?1:0));
 use(t,'beacon:waygate:claimed');assert.equal(w.gold,34);
});
test('Repeated private claims can prompt active companions to leave',()=>{
 const t=seeded();for(const key of ['begin','camp','recruit:mara','recruit:tamsin','market','gate','challenge:wayInvestigation','continue:wayInvestigation','beacon:waygate:claimed','moor','moorTop','challenge:moorPass','continue:moorPass','beacon:moor:claimed'])use(t,key);
 const w=t.get().frontier;assert.deepEqual(Array.from(w.active),[]);assert.equal(w.dominion,2);assert.equal(w.gold,50);
});
test('Public restoration rewards community trust and a smaller payment',()=>{
 const t=seeded();for(const key of ['begin','camp','market','gate','challenge:wayInvestigation','continue:wayInvestigation','beacon:waygate:spark'])use(t,key);
 const w=t.get().frontier;assert.equal(w.beacons.waygate,'restored');assert.equal(w.gold,23);assert.equal(w.mercy,1);assert.equal(w.reputation.keepers,2+(t.get().checks.at(-1)?.success?1:0));
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
  const t=seeded('worldheart');const save=t.get();save.unlocked=16;save.frontier=t.freshWorld();if(choice==='finalRule')save.frontier.reputation.syndicate=2;save.storyResult=null;
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
 const t=seeded();for(const key of ['begin','camp','market','gate','challenge:wayInvestigation','continue:wayInvestigation','beacon:waygate:claimed'])use(t,key);
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

// v3.1 expansion: consequences, persistence, encounter gates and class progression.
test('Every new waylight obstacle presents noncombat, payment and combat alternatives',()=>{
 for(const [stage,chapter] of Object.entries({wayInvestigation:10,moorPass:11,fenCauseway:12,harborTribunal:13,cryptThreshold:14,citadelDebate:15,heartTrial:16})){
  const t=seeded(stage);t.get().unlocked=chapter;t.get().frontier=t.freshWorld();
  const sc=t.worldScene();assert.equal(sc.chapter,chapter);assert.ok(sc.text.length>=4,stage);
  assert.ok(sc.choices.some(x=>x.key==='w:challenge:'+stage),stage);
  assert.ok(sc.choices.some(x=>x.key.startsWith('w:encounter:')),stage);
  assert.ok(sc.choices.some(x=>x.key==='w:bribe:'+stage),stage);
 }
});
test('Each nonviolent challenge fails forward without a forbidden dice reroll',()=>{
 for(const [stage,next] of Object.entries({wayInvestigation:'waygate',moorPass:'moorBeacon',fenCauseway:'fenBeacon',harborTribunal:'harborBeacon',cryptThreshold:'cryptArchive',citadelDebate:'citadelSpire',heartTrial:'worldheart'})){
  const t=seeded(stage);t.get().unlocked=16;t.get().frontier=t.freshWorld();
  use(t,'challenge:'+stage);assert.ok(t.get().frontier.done[stage+'Resolved'],stage);
  assert.ok(t.worldScene().choices.every(x=>!x.key.startsWith('w:challenge:')),stage);
  use(t,'continue:'+stage);assert.equal(t.get().stage,next,stage);
 }
});
test('Homebrew lantern passage consumes a spark, not the inventory artifact',()=>{
 const t=seeded('cryptThreshold');t.get().unlocked=14;t.get().frontier=t.freshWorld();
 use(t,'lantern:cryptThreshold');assert.equal(t.get().lanternSparks,2);assert.equal(t.get().inventory.lantern,1);
 assert.ok(t.get().frontier.done.cryptThresholdResolved);
 use(t,'lantern:cryptThreshold');assert.equal(t.get().lanternSparks,2);
});
test('A paid passage deducts gold exactly once, without replaying the same transaction',()=>{
 const t=seeded('fenCauseway');t.get().unlocked=12;t.get().frontier=t.freshWorld();
 use(t,'bribe:fenCauseway');assert.equal(t.get().frontier.gold,10);
 use(t,'bribe:fenCauseway');assert.equal(t.get().frontier.gold,10);
});
test('Act II travel consistently consumes one provision even on automatic chapter changes',()=>{
 const t=seeded();for(const k of ['begin','camp','market'])use(t,k);
 const s=t.get();const before=s.inventory.rations;use(t,'gate'); // intra-chapter scene, no travel day
 assert.equal(s.inventory.rations,before);
 use(t,'challenge:wayInvestigation');use(t,'continue:wayInvestigation');use(t,'beacon:waygate:spark');
 const day=s.frontier.day;use(t,'moor');assert.equal(s.frontier.day,day+1);assert.equal(s.inventory.rations,Math.max(0,before-1));
});
test('Milestone levels 3 and 4 unlock across the expanded campaign and survive save validation',()=>{
 const t=seeded('moorBeacon');const s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.beacons.moor='restored';s.level=2;
 use(t,'fen');assert.equal(s.level,3);assert.ok(s.hp<=34);assert.equal(s.hitDice,3);
 s.stage='cryptArchive';s.storyResult=null;s.frontier.done.archiveChoice=true;
 use(t,'toCitadel');assert.equal(s.level,4);assert.equal(s.hitDice,4);
 assert.equal(validateSave(JSON.parse(JSON.stringify(s))).level,4);
});
test('Wizard level-2 slots and Fighter Champion subclass progression are available from level 3',()=>{
 const t=seeded('moorBeacon');const s=t.get();s.classId='wizard';s.level=2;s.frontier=t.freshWorld();s.frontier.beacons.moor='restored';s.unlocked=11;
 use(t,'fen');assert.equal(s.level,3);assert.equal(s.frontier.slots2,2);
 const f=seeded('moorBeacon');const fs=f.get();fs.classId='fighter';fs.unlocked=11;fs.frontier=f.freshWorld();fs.frontier.beacons.moor='restored';use(f,'fen');
 assert.equal(fs.level,3);
});
test('Resting recovers resources and consumes time plus food or gold',()=>{
 const t=seeded('northmoor');const s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.hp=6;s.hitDice=1;s.inventory.rations=1;
 const before=s.frontier.day;use(t,'rest:long');assert.equal(s.hp,20);assert.equal(s.inventory.rations,0);
 assert.equal(s.frontier.day,before+1);assert.equal(s.hitDice,2);
 s.hp=4;s.frontier.gold=6;use(t,'rest:long');assert.equal(s.frontier.gold,1);assert.equal(s.hp,20);
});
test('Roadside foraging provides a non-paid recovery path but is limited to once per day',()=>{
 const t=seeded('northmoor');const s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.inventory.rations=0;s.frontier.gold=0;
 use(t,'rest:forage');assert.equal(s.inventory.rations,1);
 use(t,'rest:forage');assert.equal(s.inventory.rations,1);
});
test('Port delivery pays only after a real journey to a named waypoint',()=>{
 const t=seeded('harbor');const s=t.get();s.unlocked=13;s.frontier=t.freshWorld();
 use(t,'portDelivery');assert.equal(s.frontier.gold,18);assert.equal(s.frontier.cargo,true);
 t.worldMapTravel('wtravel:northmoor');assert.equal(s.frontier.cargo,false);
 assert.equal(s.frontier.gold,32);assert.equal(s.frontier.done.portDelivery,true);
});
test('Companions can only change active roles at real, safe waystations',()=>{
 const t=seeded('roadCamp');const s=t.get();s.unlocked=9;s.frontier=t.freshWorld();
 use(t,'recruit:mara');use(t,'recruit:tamsin');use(t,'recruit:corvin');
 s.stage='northmoor';t.worldPartyAction('wparty:corvin');assert.deepEqual(Array.from(s.frontier.active),['mara','tamsin']);
 s.stage='waymarket';t.worldPartyAction('wparty:corvin');assert.deepEqual(Array.from(s.frontier.active),['tamsin','corvin']);
});
test('Every companion personal quest contains a meaningful moral choice and updates trust',()=>{
 for(const [id,source,stage] of [['mara','northmoor','maraMemory'],['tamsin','glassfen','tamsinShelter'],['corvin','harbor','corvinLedger']]){
  const t=seeded(source);const s=t.get();s.unlocked=15;s.frontier=t.freshWorld();s.frontier.recruited=[id];s.frontier.active=[id];
  use(t,'personal:'+id);assert.equal(s.stage,stage);assert.ok(t.worldScene().text.length>=3);
  use(t,'personalResolve:'+id+':support');assert.equal(s.frontier.trust[id],3);
  use(t,'personalReturn:'+id);assert.equal(s.stage,source);
 }
});
test('Bought armor increases AC; private investment consumes gold and is single use',()=>{
 const t=seeded('waymarket');const s=t.get();s.unlocked=10;s.frontier=t.freshWorld();s.frontier.gold=35;
 use(t,'shop:open');use(t,'buy:armor');assert.equal(s.frontier.gold,15);assert.equal(s.frontier.gear.armor,1);
 use(t,'buy:armor');assert.equal(s.frontier.gold,15);
});
test('Worldheart restoration reconciles privately held beacons and actually pays the buyout',()=>{
 const t=seeded('worldheart');const s=t.get();s.unlocked=16;s.frontier=t.freshWorld();
 s.frontier.gold=80;s.frontier.dominion=4;for(const k in s.frontier.beacons)s.frontier.beacons[k]='claimed';
 use(t,'finalRestore');assert.equal(s.stage,'roadFinale');assert.equal(s.frontier.gold,0);
 assert.deepEqual(Array.from(Object.values(s.frontier.beacons)),['restored','restored','restored','restored']);assert.equal(s.frontier.dominion,0);
});
test('Without buyout or public mandate, public restoration remains locked',()=>{
 const t=seeded('worldheart');const s=t.get();s.unlocked=16;s.frontier=t.freshWorld();s.frontier.gold=0;s.frontier.dominion=4;
 for(const k in s.frontier.beacons)s.frontier.beacons[k]='claimed';
 assert.ok(t.worldScene().choices.find(x=>x.key==='w:finalRestore').locked);
 use(t,'finalRestore');assert.equal(s.stage,'worldheart');
 assert.ok(t.worldScene().choices.some(x=>x.key==='w:prepareCommons'));
});
test('Private rule and local independence each reconcile all four beacon states',()=>{
 for(const [choice,status] of [['finalRule','claimed'],['finalFree','independent']]){
  const t=seeded('worldheart');const s=t.get();s.unlocked=16;s.frontier=t.freshWorld();s.frontier.reputation.syndicate=3;
  use(t,choice);assert.equal(s.stage,'roadFinale');assert.ok(Object.values(s.frontier.beacons).every(x=>x===status));
  const serialized=JSON.parse(JSON.stringify(s));assert.equal(validateSave(serialized).stage,'roadFinale');
 }
});
test('New encounter imports preserve paused result, current enemy and turn expenditure',()=>{
 const t=seeded('moorPass');const s=t.get();s.unlocked=11;s.frontier=t.freshWorld();
 use(t,'encounter:moorWolves');assert.equal(s.frontier.battle.encounter,'moorWolves');
 s.frontier.battle.phase='result';s.frontier.battle.next='enemy';s.frontier.battle.actionUsed=true;
 s.frontier.battle.result={title:'A blow lands',story:'The wolves circle.',math:'d20 12'};
 const t2=seeded('moorPass');t2.get().unlocked=11;t2.get().frontier=t2.normalizeWorld(JSON.parse(JSON.stringify(s.frontier)));
 assert.equal(t2.get().frontier.battle.encounter,'moorWolves');assert.equal(t2.get().frontier.battle.actionUsed,true);
});
test('New SVG illustrations exist for each distinct expanded location',()=>{
 for(const p of ['campfire','waycross','moor','fen','harbor','archive2','citadel','worldheart']){
  const svg=fs.readFileSync(require('node:path').join(__dirname,'assets',p+'.svg'),'utf8');
  assert.match(svg,/<svg /);assert.match(svg,/<\/svg>/);
 }
});

test('Champion level 3 attacks can score critical on natural 19 in regional combat',()=>{
 const t=seeded('moorPass'),s=t.get();s.unlocked=11;s.level=3;s.hp=28;s.frontier=t.freshWorld();
 t.startWorldBattle('moorWolves');s.storyResult=null;s.frontier.battle.phase='player';
 const prev=Math.random;Math.random=()=>.91;
 try{t.worldBattleAction('wb:attack');assert.match(s.frontier.battle.result.math,/CRITICAL/);
 assert.equal(s.frontier.battle.phase,'result');}finally{Math.random=prev;}
});
test('Rogue level 3 Fast Hands grants a tactical bonus action, preserving the next normal action',()=>{
 const t=seeded('fenCauseway'),s=t.get();s.classId='rogue';s.level=3;s.hp=24;s.unlocked=12;s.frontier=t.freshWorld();
 t.startWorldBattle('fenGuardian');s.storyResult=null;s.frontier.battle.phase='player';
 t.worldBattleAction('wb:thief');assert.equal(s.frontier.battle.bonus,true);
 assert.equal(s.frontier.battle.hidden,true);assert.equal(s.frontier.battle.phase,'result');
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle.phase,'player');
 t.worldBattleAction('wb:attack');assert.equal(s.frontier.battle.actionUsed,true);
});
test('Wizard level 3 Shatter uses a separate level-2 spell slot and pauses the result',()=>{
 const t=seeded('cryptThreshold'),s=t.get();s.classId='wizard';s.level=3;s.hp=17;s.unlocked=14;s.frontier=t.freshWorld();s.frontier.slots2=2;
 t.startWorldBattle('cryptShade');s.storyResult=null;s.frontier.battle.phase='player';
 t.worldBattleAction('wb:shatter');assert.equal(s.frontier.slots2,1);
 assert.match(s.frontier.battle.result.math,/Shatter/);assert.equal(s.frontier.battle.phase,'result');
});
test('Fighter Action Surge is a once-per-rest extra non-Magic action within one round',()=>{
 const t=seeded('moorPass'),s=t.get();s.level=3;s.unlocked=11;s.frontier=t.freshWorld();
 t.startWorldBattle('moorWolves');s.storyResult=null;s.frontier.battle.phase='player';
 const prev=Math.random;Math.random=()=>.2;
 try{t.worldBattleAction('wb:attack');assert.equal(s.frontier.battle.next,'surge');
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle.actionUsed,true);
 t.worldBattleAction('wb:surge');assert.equal(s.actionSurge,0);
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle.phase,'player');
 assert.equal(s.frontier.battle.actionUsed,false);assert.equal(s.frontier.battle.extra,true);
 t.worldBattleAction('wb:attack');assert.notEqual(s.frontier.battle.next,'surge');
 }finally{Math.random=prev;}
});
test('Winning an expansion encounter unlocks only its own obstacle and pays its reward once',()=>{
 const t=seeded('wayInvestigation'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();
 t.startWorldBattle('gateRaid');s.storyResult=null;s.frontier.battle.phase='result';
 s.frontier.battle.next='victory';s.frontier.battle.result={title:'Last blow',story:'The guard surrenders',math:''};
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle,null);
 assert.ok(s.frontier.done.wayInvestigationResolved);assert.equal(s.frontier.gold,25);
 assert.equal(s.frontier.encountersWon,1);
 assert.equal(s.frontier.done.moorPassResolved,undefined);
});
test('A hero fighting without companions retreats without inventing an absent rescuer',()=>{
 const t=seeded('heartTrial'),s=t.get();s.unlocked=16;s.frontier=t.freshWorld();
 t.startWorldBattle('heartEcho');s.storyResult=null;s.frontier.battle.phase='result';
 s.frontier.battle.next='defeat';s.frontier.battle.result={title:'Fallen',story:'The hero staggers.',math:''};
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle,null);
 assert.match(s.storyResult.body,/behind a fallen marker/);
 assert.doesNotMatch(s.storyResult.body,/companion draws/);
});
test('An encounter can be fled without magically resolving the unresolved location',()=>{
 const t=seeded('heartTrial'),s=t.get();s.unlocked=16;s.frontier=t.freshWorld();
 t.startWorldBattle('heartEcho');s.storyResult=null;s.frontier.battle.phase='player';
 t.worldBattleAction('wb:retreat');assert.equal(s.frontier.battle.phase,'result');
 t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle,null);
 assert.equal(s.frontier.done.heartTrialResolved,undefined);
});
test('Current save parser rejects unknown future stages while accepting all v3.1 scenes',()=>{
 const t=seeded();const base=JSON.parse(JSON.stringify(t.get()));
 for(const stage of ['wayInvestigation','moorPass','maraMemory','fenCauseway','tamsinShelter','harborTribunal','corvinLedger','cryptThreshold','citadelDebate','heartTrial']){
  const saved={...base,stage};assert.equal(validateSave(saved).stage,stage);
 }
 assert.throws(()=>validateSave({...base,stage:'madeUpStoryStage'}));
});
test('Old late Act II saves are migrated to levels 3–4 without resetting their choices',()=>{
 const t=seeded();const raw=JSON.parse(JSON.stringify(t.get()));raw.stage='citadel';raw.level=2;raw.unlocked=15;
 raw.frontier=t.freshWorld();raw.frontier.beacons.waygate='claimed';raw.frontier.gold=39;
 const upgraded=t.upgradeSave(raw);
 assert.equal(upgraded.level,4);assert.equal(upgraded.frontier.gold,39);
 assert.equal(upgraded.frontier.beacons.waygate,'claimed');assert.equal(upgraded.inventory.lantern,1);
});
test('New world combat action state survives normalization of an imported paused save',()=>{
 const t=seeded('fenCauseway'),w=t.freshWorld();w.battle={active:true,origin:'fenCauseway',encounter:'fenGuardian',enemyHp:16,enemyMax:23,enemyAc:13,round:3,phase:'result',guard:false,bonus:true,started:true,actionUsed:true,extra:true,allyUsed:true,next:'enemy',result:{title:'Attack',story:'Damage',math:'d20'}};
 const norm=t.normalizeWorld(w);assert.equal(norm.battle.phase,'result');assert.equal(norm.battle.encounter,'fenGuardian');assert.equal(norm.battle.actionUsed,true);assert.equal(norm.battle.extra,true);
 assert.equal(norm.battle.allyUsed,true);
});


test('Foraging uses a Wisdom Survival roll rather than the previously mismatched Perception skill',()=>{
 const t=seeded();for(const step of ['begin','camp'])use(t,step);
 assert.equal(t.skillBonus('survival'),1);
 use(t,'rest:forage');
 assert.equal(t.get().checks.at(-1).name,'Wisdom (Survival)');
 assert.ok(t.get().frontier.done['forageDay'+t.get().frontier.day]);
});
test('A level-3 wizard sheet shows both spell-slot levels, subclass magic and Scholar expertise',()=>{
 const t=seeded();const s=t.get();s.classId='wizard';s.level=3;s.slots=4;s.scholarSkill='arcana';s.frontier={...t.freshWorld(),slots2:2};
 const html=t.renderSheet();
 assert.match(html,/Level-2 spell slots/);assert.match(html,/Shatter/);assert.match(html,/Scholar Expertise/);
 assert.equal(t.skillBonus('arcana'),7);
});
test('A level-4 Fighter sheet retains Action Surge and shows Champion',()=>{
 const t=seeded();const s=t.get();s.level=4;s.actionSurge=1;s.secondWind=3;
 const html=t.renderSheet();
 assert.match(html,/Action Surge/);assert.match(html,/Champion/);
 assert.match(html,/level 1–4 practice builds/i);
});
test('A level-3 Rogue sheet lists updated Sneak Attack and Cunning Action',()=>{
 const t=seeded();const s=t.get();s.classId='rogue';s.level=3;
 const html=t.renderSheet();
 assert.match(html,/Sneak Attack: \+2d6/);assert.match(html,/Cunning Action/);assert.match(html,/Fast Hands/);
});

// v3.2: optional expedition content, equipment, lamp fuel and interactive party bonding.
const NEW_SITES=[['oldDepot','waymarket',10,'depotThugs'],['moorWatch','northmoor',11,'watchRavagers'],['fenReliquary','glassfen',12,'reedWights'],['saltCistern','harbor',13,'cisternBlades'],['bellCatacomb','citadel',15,'bellSentinel']];
for(const [id,hub,chapter,enemy] of NEW_SITES){
 test(`Optional adventure ${id} can be visited and resolved without combat, rewarding loot once`,()=>{
  const t=seeded(hub),s=t.get();s.unlocked=chapter;s.frontier=t.freshWorld();
  assert(t.worldScene().choices.some(x=>x.key==='w:site:enter:'+id));
  use(t,'site:enter:'+id);assert.equal(s.stage,id);
  const gold=s.frontier.gold,glass=s.frontier.emberglass;
  use(t,'site:study:'+id);assert.equal(s.frontier.done['site:'+id],true);assert(s.frontier.gold>gold);assert(s.frontier.emberglass>glass);
  const finalGold=s.frontier.gold;use(t,'site:study:'+id);assert.equal(s.frontier.gold,finalGold);
  assert(t.worldScene().choices.some(x=>x.key==='w:site:back:'+id));use(t,'site:back:'+id);assert.equal(s.stage,hub);
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).stage,hub);
 });
 test(`Optional adventure ${id} has a live combat route and is not replayed after victory`,()=>{
  const t=seeded(hub),s=t.get();s.unlocked=chapter;s.frontier=t.freshWorld();
  use(t,'site:enter:'+id);use(t,'site:fight:'+id);const b=s.frontier.battle;
  assert.equal(b.active,true);assert.equal(b.encounter,enemy);
  b.phase='result';b.enemyHp=0;b.result={title:'Defeated',story:'Victory',math:''};b.next='victory';
  t.worldBattleAction('wb:continue');assert.equal(s.frontier.battle,null);assert.equal(s.frontier.done['site:'+id],true);
  const n=s.frontier.emberglass;use(t,'site:fight:'+id);assert.equal(s.frontier.emberglass,n);
 });
}
test('New shop opens as dedicated scene and purchases affect purse and equipment',()=>{
 const t=seeded('waymarket'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();s.frontier.gold=160;
 assert(t.worldScene().choices.some(x=>x.key==='w:shop:open'));
 use(t,'shop:open');assert.equal(s.frontier.shopOpen,true);assert(t.worldScene().choices.some(x=>x.key==='w:shop:weapon'));
 use(t,'shop:weapon');use(t,'shop:shield');use(t,'shop:flash');use(t,'shop:bandage');use(t,'shop:ember');
 assert.equal(s.frontier.gold,160-25-18-9-6-15);
 assert.equal(s.frontier.gear.weapon,1);assert.equal(s.frontier.gear.shield,1);
 assert.equal(s.frontier.flashpowder,1);assert.equal(s.frontier.bandages,1);assert.equal(s.frontier.emberglass,1);
 const balance=s.frontier.gold;use(t,'shop:weapon');assert.equal(s.frontier.gold,balance);
 use(t,'shop:close');assert.equal(s.frontier.shopOpen,false);
});
test('Field bandage can heal and cannot be used at full HP',()=>{
 const t=seeded('waymarket'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();
 s.frontier.bandages=1;s.hp=3;
 use(t,'use:bandage');assert.equal(s.frontier.bandages,0);assert(s.hp>3);
 s.frontier.bandages=1;s.hp=999;const previous=s.hp;use(t,'use:bandage');assert.equal(s.frontier.bandages,1);assert.equal(s.hp,previous);
});
test('Shrine attunement recharges one spark once and never consumes the lantern',()=>{
 const t=seeded('moorWatch'),s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.done['site:moorWatch']=true;
 s.lanternSparks=1;
 use(t,'shrine:attune:moorWatch');assert.equal(s.lanternSparks,2);
 assert.equal(s.inventory.lantern,1);use(t,'shrine:attune:moorWatch');assert.equal(s.lanternSparks,2);
});
test('Shrine trade consumes emberglass before gold and restores up to three sparks',()=>{
 const t=seeded('harbor'),s=t.get();s.unlocked=13;s.frontier=t.freshWorld();s.frontier.emberglass=1;s.lanternSparks=0;
 use(t,'recharge:trade');assert.equal(s.frontier.emberglass,0);assert.equal(s.lanternSparks,2);assert.equal(s.frontier.gold,18);
 use(t,'recharge:trade');assert.equal(s.lanternSparks,3);assert.equal(s.frontier.gold,6);
});
test('Companion dialogue allows listening and changes persistent trust',()=>{
 const t=seeded('northmoor'),s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.recruited=['mara'];s.frontier.active=['mara'];
 use(t,'talk:mara');assert.equal(s.frontier.dialogue.id,'mara');
 assert(t.worldScene().choices.some(c=>c.key==='w:bond:mara:listen'));
 use(t,'bond:mara:listen');assert.equal(s.frontier.dialogue,null);assert.equal(s.frontier.trust.mara,2);assert.equal(s.frontier.done['talk:mara:11'],true);
 assert(!t.worldScene().choices.some(c=>c.key==='w:talk:mara'));
 const oldTrust=s.frontier.trust.mara;use(t,'bond:mara:listen');assert.equal(s.frontier.trust.mara,oldTrust);
});
test('Companion joint planning creates one-time skill help that is consumed when checked',()=>{
 const t=seeded('northmoor'),s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.recruited=['mara'];s.frontier.active=['mara'];
 use(t,'talk:mara');use(t,'bond:mara:plan');assert.equal(s.frontier.skillAid.skill,'perception');
 use(t,'moorClue');assert.equal(s.frontier.skillAid,null);
});
test('A companion can be asked for help at their matching optional site, earning trust',()=>{
 const t=seeded('northmoor'),s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.recruited=['mara'];s.frontier.active=['mara'];
 use(t,'site:enter:moorWatch');assert(t.worldScene().choices.some(c=>c.key==='w:site:ally:moorWatch'));
 use(t,'site:ally:moorWatch');assert.equal(s.frontier.done['site:moorWatch'],true);assert.equal(s.frontier.trust.mara,1);
});
test('Commanding a companion too often can drive them out of the traveling party',()=>{
 const t=seeded('northmoor'),s=t.get();s.unlocked=11;s.frontier=t.freshWorld();s.frontier.recruited=['mara'];s.frontier.active=['mara'];s.frontier.trust.mara=-1;
 use(t,'talk:mara');use(t,'bond:mara:command');assert.equal(s.frontier.trust.mara,-2);assert.deepEqual(Array.from(s.frontier.active),[]);
});
test('Lantern power resolves an optional expedition with a persistent quest reward',()=>{
 const t=seeded('glassfen'),s=t.get();s.unlocked=12;s.frontier=t.freshWorld();s.lanternSparks=2;
 use(t,'site:enter:fenReliquary');use(t,'site:lamp:fenReliquary');
 assert.equal(s.lanternSparks,1);assert.equal(s.inventory.lantern,1);assert.equal(s.frontier.emberglass,2);
 assert.equal(s.frontier.done['site:fenReliquary'],true);
});
test('A purchased flashpowder flask affects enemy HP and is spent in combat',()=>{
 const t=seeded('oldDepot'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();s.frontier.flashpowder=1;
 t.startWorldBattle('depotThugs');const b=s.frontier.battle;b.phase='player';
 t.worldBattleAction('wb:flashpowder');assert.equal(s.frontier.flashpowder,0);assert(b.enemyHp<b.enemyMax);assert.equal(b.phase,'result');assert.equal(b.guard,true);
});
test('Last Lantern flare works in regional combat and keeps the physical artifact',()=>{
 const t=seeded('oldDepot'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();s.lanternSparks=3;
 t.startWorldBattle('depotThugs');const b=s.frontier.battle;b.phase='player';
 t.worldBattleAction('wb:lantern');assert.equal(s.lanternSparks,2);assert.equal(s.inventory.lantern,1);assert(b.enemyHp<b.enemyMax);assert.equal(b.phase,'result');
});
test('New gear and companion dialogue state survive a JSON save/import normalization',()=>{
 const t=seeded('harbor'),s=t.get();s.unlocked=13;s.frontier=t.freshWorld();s.frontier.gear.weapon=1;s.frontier.gear.shield=1;s.frontier.emberglass=4;s.frontier.flashpowder=2;s.frontier.dialogue={id:'corvin',stage:'harbor',chapter:13};s.frontier.recruited=['corvin'];s.frontier.active=['corvin'];
 const json=JSON.parse(JSON.stringify(s));assert.equal(validateSave(json).stage,'harbor');
 const restored=t.upgradeSave(json);assert.equal(restored.frontier.gear.weapon,1);assert.equal(restored.frontier.emberglass,4);assert.equal(restored.frontier.dialogue.id,'corvin');
});
test('Party tab only exposes Talk when the current scene can actually accept it',()=>{
 const t=seeded('waymarket'),s=t.get();s.unlocked=10;s.frontier=t.freshWorld();s.frontier.recruited=['mara'];s.frontier.active=['mara'];
 assert(t.renderParty().includes('w:talk:mara'));
 use(t,'shop:open');assert(!t.renderParty().includes('w:talk:mara'));
 use(t,'shop:close');assert(t.renderParty().includes('w:talk:mara'));
 use(t,'site:enter:oldDepot');assert(!t.renderParty().includes('w:talk:mara'));
});

// Shared four-way resolution choices, with separate resource and save effects.
const REGIONAL_BEACONS=[['waygate','waygate'],['moorBeacon','moor'],['fenBeacon','fen'],['harborBeacon','harbor']];
function beaconSeed(stage,{key=false,lantern=true,sparks=3,rations=2}={}){
 const t=seeded(stage),s=t.get();s.frontier=t.freshWorld();s.unlocked=13;
 s.flags.key=key;s.ending=lantern?'take':'restore';s.inventory.lantern=lantern?1:0;
 s.lanternSparks=lantern?sparks:0;s.inventory.rations=rations;
 return t;
}
test('All four waylights offer the same repair, delegation and personal-control choices',()=>{
 for(const [stage,id] of REGIONAL_BEACONS){const t=beaconSeed(stage,{key:true});const keys=t.worldScene().choices.map(c=>c.key);
  for(const method of ['spark','key','delegate','claimed'])assert(keys.includes('w:beacon:'+id+':'+method),stage+': '+method);
 }
});
test('Without lantern or wolf-key, delegation and private control remain available',()=>{
 for(const [stage,id] of REGIONAL_BEACONS){const t=beaconSeed(stage,{key:false,lantern:false});const keys=t.worldScene().choices.map(c=>c.key);
  assert(keys.includes('w:beacon:'+id+':delegate'));assert(keys.includes('w:beacon:'+id+':claimed'));
  assert(!keys.includes('w:beacon:'+id+':spark'));assert(!keys.includes('w:beacon:'+id+':key'));
 }
});
test('An empty Last Lantern cannot rekindle a beacon, and keyless characters cannot use the key',()=>{
 const t=beaconSeed('waygate',{key:false,lantern:true,sparks:0});const w=t.get().frontier;
 const spark=t.worldScene().choices.find(c=>c.key==='w:beacon:waygate:spark');assert(spark.locked);
 use(t,'beacon:waygate:spark');use(t,'beacon:waygate:key');assert.equal(w.beacons.waygate,'dark');
});
test('Each beacon can be rekindled once for one spark, preserving the lantern and recording the method',()=>{
 for(const [stage,id] of REGIONAL_BEACONS){const t=beaconSeed(stage),s=t.get(),w=s.frontier;
  use(t,'beacon:'+id+':spark');assert.equal(w.beacons[id],'restored');assert.equal(s.lanternSparks,2);
  assert.equal(s.inventory.lantern,1);assert.equal(w.done['beaconMethod:'+id+':spark'],true);
  const gold=w.gold;use(t,'beacon:'+id+':spark');assert.equal(w.gold,gold);assert.equal(s.lanternSparks,2);
  assert(!t.worldScene().choices.some(c=>c.key==='w:beacon:'+id+':spark'));
 }
});
test('Wolf-key repairs all four beacons without being consumed',()=>{
 const t=beaconSeed('waygate',{key:true});const s=t.get();for(const [stage,id] of REGIONAL_BEACONS){s.stage=stage;s.storyResult=null;
  const sparks=s.lanternSparks;use(t,'beacon:'+id+':key');assert.equal(s.frontier.beacons[id],'restored');
  assert.equal(s.flags.key,true);assert.equal(s.lanternSparks,sparks);
  assert.equal(s.frontier.done['beaconMethod:'+id+':key'],true);
 }
 assert.equal(s.frontier.mercy,4);
});
test('Entrusting a waylight takes a day, may contribute supplies, and records independent local governance',()=>{
 for(const [stage,id] of REGIONAL_BEACONS){const t=beaconSeed(stage,{lantern:false,rations:2}),s=t.get(),w=s.frontier;
  const before=w.day;use(t,'beacon:'+id+':delegate');assert.equal(w.beacons[id],'independent');
  assert.equal(w.day,before+1);assert.equal(s.inventory.rations,1);assert.equal(w.mercy,1);
  assert.equal(w.gold,18);assert.equal(w.done['beaconMethod:'+id+':delegate'],true);
  assert(t.worldScene().text.some(x=>x.includes('full day of shared work')));
  const day=w.day;use(t,'beacon:'+id+':delegate');assert.equal(w.day,day);
 }
});
test('Entrusting remains possible with no lantern, key, rations or gold; never softlocks progression',()=>{
 const t=beaconSeed('moorBeacon',{lantern:false,key:false,rations:0}),s=t.get();s.frontier.gold=0;
 use(t,'beacon:moor:delegate');assert.equal(s.frontier.beacons.moor,'independent');assert.equal(s.frontier.gold,0);
 assert.equal(s.inventory.rations,0);
 assert(t.worldScene().choices.some(c=>c.key==='w:fen'));
});
test('Claimed waylights still grant private rewards and cannot be overwritten through repair',()=>{
 for(const [stage,id] of REGIONAL_BEACONS){const t=beaconSeed(stage,{key:true}),s=t.get(),w=s.frontier;
  use(t,'beacon:'+id+':claimed');assert.equal(w.beacons[id],'claimed');assert.equal(w.gold,34);
  assert.equal(w.dominion,1);assert.equal(w.done['beaconMethod:'+id+':claimed'],true);
  use(t,'beacon:'+id+':key');assert.equal(w.beacons[id],'claimed');
 }
});
test('Beacon method flags and independent ownership survive save normalization',()=>{
 const t=beaconSeed('fenBeacon',{key:true}),s=t.get();use(t,'beacon:fen:delegate');
 const copy=JSON.parse(JSON.stringify(s));assert.equal(validateSave(copy).stage,'fenBeacon');
 const loaded=t.upgradeSave(copy);assert.equal(loaded.frontier.beacons.fen,'independent');
 assert.equal(loaded.frontier.done['beaconMethod:fen:delegate'],true);
});
test('Commons ending respects waylights previously placed in the hands of independent keepers',()=>{
 const t=beaconSeed('waygate',{key:true}),s=t.get();use(t,'beacon:waygate:delegate');
 s.stage='worldheart';s.unlocked=16;s.storyResult=null;s.frontier.beacons.moor='restored';
 use(t,'finalRestore');assert.equal(s.frontier.ending,'restore');
 assert.equal(s.frontier.beacons.waygate,'independent');assert.equal(s.frontier.beacons.moor,'restored');
 assert.equal(s.frontier.mercy,4);
});
