/* Lantern & Key: deterministic, independently testable rules and save-validation helpers. */
(function(root,factory){ const api=factory(); if(typeof module==='object' && module.exports) module.exports=api; root.LanternCore=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES=['welcome','tavern','tavernHub','stranger','keeper','door','passage','passageChoice','vault','vaultAlert','combat','reveal','ending','defeat','forest','camp','trail','crossing','crossingBattle','crossingAfter','village','market','witness','council','trial','archive','altar','ascent','levelup','epilogue','beaconTest','lanternOath','roadMap','roadCamp','roadFireside','waymarket','wayInvestigation','waygate','northmoor','moorPass','maraMemory','moorBeacon','glassfen','fenCauseway','tamsinShelter','fenBeacon','harbor','harborTribunal','corvinLedger','harborBeacon','undercrypt','cryptThreshold','cryptArchive','citadel','citadelDebate','citadelSpire','heartTrial','worldheart','roadFinale'];
 const CLASSES=['fighter','rogue','wizard'];
 function plain(obj){return obj!==null && typeof obj==='object' && !Array.isArray(obj) && (Object.getPrototypeOf(obj)===Object.prototype || Object.getPrototypeOf(obj)===null);}
 function safeTree(value,depth=0){
  if(depth>13)throw Error('Save nesting exceeds allowed depth.');
  if(value===null || typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value)||Math.abs(value)>1e8)throw Error('Save contains an invalid number.');return value;}
  if(typeof value==='string')return value.slice(0,5000).replace(/[<>&"`]/g,'').replace(/[\u0000-\u0008\u000b-\u001f]/g,'');
  if(Array.isArray(value)){if(value.length>300)throw Error('Save array is too large.');return value.map(v=>safeTree(v,depth+1));}
  if(!plain(value))throw Error('Save has an invalid object.');
  const keys=Object.keys(value);if(keys.length>150)throw Error('Save has too many fields.');
  const dest=Object.create(null);
  for(const key of keys){if(!/^[a-zA-Z0-9_:-]{1,70}$/.test(key)||['__proto__','prototype','constructor'].includes(key))continue;dest[key]=safeTree(value[key],depth+1);}
  return dest;
 }
 const inRange=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 function validateSave(raw){
  if(!plain(raw) || raw.version!==1)throw Error('Not a Lantern & Key save (schema v1).');
  if(!TYPES.includes(raw.stage))throw Error('Unknown saved story chapter.');
  if(raw.stage!=='welcome'&&!CLASSES.includes(raw.classId))throw Error('Unknown character class.');
  if(!plain(raw.flags)||!Array.isArray(raw.journal)||!Array.isArray(raw.checks))throw Error('Save is missing story records.');
  if(raw.journal.length>300||raw.checks.length>300)throw Error('Save history exceeds safety limits.');
  if(raw.stage!=='welcome'&&!inRange(raw.hp,0,200))throw Error('Invalid hit points.');
  if(raw.level!==undefined && ![1,2,3,4].includes(raw.level))throw Error('Invalid character level.');
  for(const entry of raw.journal){if(!plain(entry)||typeof entry.text!=='string')throw Error('Invalid journal entry.');}
  for(const entry of raw.checks){if(!plain(entry)||typeof entry.success!=='boolean')throw Error('Invalid check history entry.');}
  if(raw.checkpoints!==undefined&&!plain(raw.checkpoints))throw Error('Invalid checkpoints.');
  if(raw.inventory!==undefined&&!plain(raw.inventory))throw Error('Invalid inventory.');
  if(raw.combat!==undefined&&raw.combat!==null){
   const c=raw.combat;
   if(!plain(c)||!['initiative','result','player'].includes(c.phase)||!inRange(c.enemyHp,0,200)||!inRange(c.enemyMax,1,200)||!inRange(c.enemyAc,1,50)||!Number.isInteger(c.round)||!inRange(c.round,1,500)||!Array.isArray(c.log))throw Error('Invalid combat state.');
   if(c.phase==='result'&&(!plain(c.result)||typeof c.result.title!=='string'||typeof c.result.story!=='string'||!['player','enemy','bonus','victory','defeat'].includes(c.next)))throw Error('Incomplete combat action result.');
  }
  if(raw.tactics!==undefined&&raw.tactics!==null){
   const t=raw.tactics;
   if(!plain(t)||!plain(t.hero)||!plain(t.enemy)||!Number.isInteger(t.hero.x)||!Number.isInteger(t.hero.y)||!Number.isInteger(t.enemy.x)||!Number.isInteger(t.enemy.y)||!inRange(t.hero.x,0,4)||!inRange(t.hero.y,0,3)||!inRange(t.enemy.x,0,4)||!inRange(t.enemy.y,0,3)||!inRange(t.enemyHp,0,200)||!inRange(t.enemyMax,1,200)||!Number.isInteger(t.round)||!inRange(t.round,1,500)||!['player','result'].includes(t.phase))throw Error('Invalid tactical state.');
   if(t.phase==='result'&&(!plain(t.result)||typeof t.result.title!=='string'||typeof t.result.body!=='string'||!['victory','defeat','enemy','player','bonus','move','afterAction'].includes(t.next)))throw Error('Incomplete tactical action result.');
  }
  if(raw.pending!==undefined&&raw.pending!==null&&!plain(raw.pending))throw Error('Invalid pending check.');
  if(raw.storyResult!==undefined&&raw.storyResult!==null&&(!plain(raw.storyResult)||typeof raw.storyResult.title!=='string'||typeof raw.storyResult.body!=='string'))throw Error('Invalid action result.');
  if(raw.outcome!==undefined&&raw.outcome!==null&&(!plain(raw.outcome)||typeof raw.outcome.title!=='string'||typeof raw.outcome.body!=='string'))throw Error('Invalid outcome.');
  if(raw.finalTest!==undefined&&raw.finalTest!==null){
   const t=raw.finalTest;
   if(!plain(t)||typeof t.active!=='boolean'||!inRange(t.enemyHp,0,200)||!inRange(t.enemyMax,1,200)||!['player','result'].includes(t.phase)||!Number.isInteger(t.round)||!inRange(t.round,1,500))throw Error('Invalid final encounter.');
   if(t.phase==='result'&&(!plain(t.result)||typeof t.result.title!=='string'||typeof t.result.body!=='string'||!['win','enemy','round','player'].includes(t.next)))throw Error('Incomplete final-encounter result.');
  }
  // Each battle-specific story stage requires its own active encounter. Do not let
  // apparently valid but incomplete imports render an empty or broken battle view.
  if(raw.stage==='combat'&&!plain(raw.combat))throw Error('The Warden encounter is missing its combat state.');
  if(raw.stage==='crossingBattle'&&!plain(raw.tactics))throw Error('The bridge encounter is missing its tactical state.');
  if(raw.stage==='beaconTest'&&(!plain(raw.finalTest)||raw.finalTest.active!==true))throw Error('The beacon encounter is missing its active state.');
  // Validate nested UI values that were previously interpolated as trusted numbers.
  function roll(r){if(!r)return;if(!plain(r)||!inRange(r.die,1,20)||!inRange(r.total,-100,200)||!inRange(r.dc,0,100)||!inRange(r.modifier,-50,50)||!['advantage','disadvantage','normal'].includes(r.mode))throw Error('Invalid die-roll record.');if(!inRange(r.die1,1,20)||(r.die2!==null&&r.die2!==undefined&&!inRange(r.die2,1,20)))throw Error('Invalid dice.');}
  if(raw.storyResult?.roll)roll(raw.storyResult.roll);
  if(raw.outcome?.roll)roll(raw.outcome.roll);
  if(raw.pending?.bonus!==undefined&&!inRange(raw.pending.bonus,-50,50))throw Error('Invalid pending check modifier.');
  if(raw.storyResult){for(const field of ['hpBefore','hpAfter'])if(raw.storyResult[field]!==undefined&&!inRange(raw.storyResult[field],0,200))throw Error('Invalid result HP.');}
  const result=safeTree(raw);
  if(result.heroName!==undefined)result.heroName=String(result.heroName).slice(0,28);
  return result;
 }
 const isRough=(x,y)=>x===2&&y===2;
 function stepCost(x,y){return isRough(x,y)?2:1;}
 // Find the minimum movement spent on a 5x4 grid, using 8-neighbor movement.
 // Stepping diagonally past two blocked orthogonal squares is excluded for this tutorial.
 function shortestRoute(start,dest,blocked){
  if(!start||!dest||!Number.isInteger(dest.x)||!Number.isInteger(dest.y)||dest.x<0||dest.x>=5||dest.y<0||dest.y>=4)return null;
  const key=(x,y)=>x+','+y;const startKey=key(start.x,start.y),endKey=key(dest.x,dest.y);
  const costs=new Map([[startKey,0]]),paths=new Map([[startKey,[{x:start.x,y:start.y}]]]),visited=new Set();
  while(true){let current=null,minimum=Infinity;
   for(const [k,v] of costs)if(!visited.has(k)&&v<minimum){minimum=v;current=k;}
   if(current===null)break;if(current===endKey)return {cost:minimum,path:paths.get(current)};
   visited.add(current);const [cx,cy]=current.split(',').map(Number);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const x=cx+dx,y=cy+dy;if(x<0||x>=5||y<0||y>=4||blocked?.x===x&&blocked?.y===y)continue;
    if(dx&&dy&&blocked&&((blocked.x===cx+dx&&blocked.y===cy)||(blocked.x===cx&&blocked.y===cy+dy)))continue;
    const k=key(x,y),cost=minimum+stepCost(x,y);
    if(cost<(costs.get(k)??Infinity)){costs.set(k,cost);paths.set(k,[...paths.get(current),{x,y}]);}
   }
  }
  return null;
 }
 function dashMovement(current,speed=6){if(!Number.isInteger(current)||current<0||current>60||!Number.isInteger(speed)||speed<=0||speed>60)throw Error('Invalid movement allowance.');return current+speed;}
 function rangedDisadvantage(ranged,adjacentHostile,canSee=true,incapacitated=false){return Boolean(ranged&&adjacentHostile&&canSee&&!incapacitated);}
 function opposingRolls(adv,dis){return adv&&dis?'normal':adv?'advantage':dis?'disadvantage':'normal';}
 return {validateSave,shortestRoute,stepCost,dashMovement,rangedDisadvantage,opposingRolls};
});
