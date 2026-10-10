const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validateSave,shortestRoute,rangedDisadvantage,opposingRolls} = require('./logic.js');
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
function simulateGame(saved){
 const store={'lantern-and-key.save.v1':JSON.stringify(saved)};
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
 return {app,act,modal,read:()=>JSON.parse(store['lantern-and-key.save.v1']),store};
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
