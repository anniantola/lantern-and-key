/* Lantern & Key: a self-contained, intentionally scoped D&D-learning adventure.
   Mechanics are an educational subset inspired by the SRD 5.2.1 (CC BY 4.0).
   No API key, tracking or third-party resources are needed. */
(() => {
'use strict';
const SAVE_KEY = 'lantern-and-key.save.v1';
const CLASSES = {
  fighter: { name:'Fighter', icon:'⚔', tag:'Sturdy · straightforward', description:'An armored defender with a reliable sword and a little emergency healing.', hp:12, ac:16, stats:{STR:16,DEX:12,CON:14,INT:10,WIS:12,CHA:10}, skills:{perception:3,persuasion:0,insight:1,stealth:1,athletics:5,investigation:0,arcana:0,sleight:1}, dexSave:1, attack:5, damageDie:8, damageMod:3, weapon:'Longsword', attackName:'Longsword', spellSlots:0 },
  rogue: { name:'Rogue', icon:'◆', tag:'Clever · discreet', description:'A nimble investigator who can pick locks, hide, and strike from an advantage.', hp:10, ac:14, stats:{STR:10,DEX:16,CON:14,INT:12,WIS:14,CHA:12}, skills:{perception:4,persuasion:1,insight:2,stealth:5,athletics:0,investigation:1,arcana:1,sleight:5}, dexSave:5, attack:5, damageDie:6, damageMod:3, weapon:'Shortsword', attackName:'Shortsword', spellSlots:0 },
  wizard: { name:'Wizard', icon:'✦', tag:'Magic · discovery', description:'A curious spellcaster with powerful, limited spells and a weaker defense.', hp:7, ac:12, stats:{STR:8,DEX:14,CON:12,INT:16,WIS:12,CHA:10}, skills:{perception:1,persuasion:0,insight:1,stealth:2,athletics:-1,investigation:5,arcana:5,sleight:2}, dexSave:2, attack:5, damageDie:10, damageMod:0, weapon:'Fire Bolt', attackName:'Fire Bolt', spellSlots:2 }
};
const GLOSSARY = [
 ['Dungeon Master (DM)','The storyteller and referee. The DM describes what happens, plays other characters, and decides when a roll is needed.'],
 ['Ability check','A d20 roll plus your relevant ability modifier. Add proficiency bonus if you are proficient in the relevant skill. Meet or exceed the Difficulty Class (DC) to succeed.'],
 ['DC — Difficulty Class','A target number set by the DM for a check or saving throw. A total equal to the DC succeeds.'],
 ['Proficiency','A bonus for training. At level 1 it is +2, already included in your listed proficient skill and attack bonuses. It is not added twice.'],
 ['Advantage / disadvantage','Roll two d20s, keeping the higher number with advantage or the lower with disadvantage. They do not stack.'],
 ['Saving throw','A d20 test to resist a harmful effect, such as a trap. The DM or effect specifies which ability to use.'],
 ['Armor Class (AC)','The number an attacker must match or beat with an attack roll to hit you. Higher AC makes you harder to hit.'],
 ['Initiative','At the beginning of combat, creatures roll Dexterity checks to determine turn order. Higher totals act first.'],
 ['Attack roll','Roll a d20 + attack bonus against AC. A natural 1 always misses; a natural 20 always hits and is a critical hit, rolling damage dice twice.'],
 ['Action and Bonus Action','On your combat turn you normally have movement and one action. You can also take a Bonus Action if a feature permits it; taking one does not replace your action.'],
 ['Dodge / Disengage','Dodge is an action that gives visible attackers disadvantage against you until the start of your next turn (if you can see them). Disengage prevents opportunity attacks when you move for that turn.'],
 ['Hit Points (HP)','Your capacity to withstand harm. At 0 HP, characters typically fall unconscious and death-saving rules apply. This introductory adventure offers a checkpoint instead.'],
 ['Spell slots','A limited resource for casting certain spells. Cantrips such as Fire Bolt do not consume slots; Magic Missile does.'],
 ['Roleplaying','You can say what your character tries to do, not only choose from a menu. This first version offers curated choices; a human DM could adjudicate almost anything.']
];
const DEFAULT_NAME = {fighter:'Rowan',rogue:'Ash',wizard:'Lyra'};
const TITLES = {tavern:'The Forgotten Tavern',tavernHub:'A Question of Trust',stranger:'The Hooded Traveler',keeper:'The Tavern Keeper',door:'The Locked Door',passage:'Beneath the Floorboards',passageChoice:'The Pressure Plates',vault:'The Chamber of Echoes',vaultAlert:'The Warden Stirs',combat:'The Echo Warden',reveal:'The Last Lantern',ending:'The Road Ahead',defeat:'A Temporary Setback'};
let s = load();
let modal = null;
let updateWorker = null;
let updateRequested = false;
// The browser only provides an install prompt when installation is currently eligible.
// It cannot detect whether an app is installed elsewhere on the device or force a reinstall.
let deferredInstallPrompt = null;
let installGuideOpen = false;
let installFeedback = '';
let installedThisSession = false;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function installGuide() {
 const agent=navigator.userAgent || '';
 if (/iPhone|iPad|iPod/i.test(agent)) return 'On iPhone or iPad, open this website in Safari, tap Share, then Add to Home Screen. If you already added it, open it from your Home Screen or App Library.';
 if (/Android/i.test(agent)) return 'In Chrome, open the ⋮ menu and choose Add to Home screen or Install app. If Android says it is already installed, find Lantern & Key in your app drawer or Settings → Apps. Open the existing app instead of installing another copy.';
 return 'Use your browser menu and choose Install app or Add to Home screen. If it is already installed, launch the existing app from your applications list.';
}
function installPanel() {
 const installed=isStandalone() || installedThisSession;
 const label=installed ? '✓ App is installed' : deferredInstallPrompt ? '↧ Install Lantern & Key' : '↧ Install / find installed app';
 return `<div class="install-panel"><div class="install-heading">PLAY AS AN APP</div><p class="modal-lead">Use Lantern & Key from your home screen, with its own window and offline access after caching.</p><button class="install-action" data-act="installApp" ${installed?'disabled':''}>${label}</button>${installed?'<p class="install-status">You are using the installed app, or you just installed it.</p>':''}${installFeedback?`<p class="install-status" role="status">${esc(installFeedback)}</p>`:''}${(!installed&&(installGuideOpen || !deferredInstallPrompt))?`<div class="install-guide"><strong>How to install or find it</strong><p>${esc(installGuide())}</p><p><strong>Already installed, but missing from your home screen?</strong> Check your app drawer and your phone’s Settings → Apps. Before uninstalling or clearing app data, export your save as JSON below. Removing an installed PWA can delete its local progress.</p></div>`:''}</div>`;
}
function requestInstall() {
 if(isStandalone() || installedThisSession) return;
 if (!deferredInstallPrompt) {
  installGuideOpen=!installGuideOpen;
  installFeedback='Your browser has not offered an install prompt. This can happen when the app is already installed or when installation is not supported in this browser.';
  render();
  return;
 }
 const prompt=deferredInstallPrompt;
 deferredInstallPrompt=null; // A browser prompt can be used only once.
 installFeedback='';
 try {
  Promise.resolve(prompt.prompt()).then(()=>prompt.userChoice).then(choice=>{
   if(choice?.outcome==='accepted') installFeedback='Installation requested. Look for Lantern & Key on your home screen or in the app drawer.';
   else {installFeedback='Installation was dismissed. You can also use your browser menu to install or open the app.';installGuideOpen=true;}
   if(modal==='settings')render();
  }).catch(()=>{
   installFeedback='The browser could not start installation. Use the steps below instead.';
   installGuideOpen=true;
   if(modal==='settings')render();
  });
 } catch(e) {
  installFeedback='The install prompt is unavailable. Use the steps below instead.';
  installGuideOpen=true;
  render();
 }
}
window.addEventListener('beforeinstallprompt', event=>{
 event.preventDefault();
 deferredInstallPrompt=event;
 installFeedback='';
 if(modal==='settings')render();
});
window.addEventListener('appinstalled',()=>{
 installedThisSession=true;
 deferredInstallPrompt=null;
 installGuideOpen=false;
 installFeedback='Lantern & Key has been installed.';
 if(modal==='settings')render();
});
const app = document.querySelector('#app');
const rand = n => Math.floor(Math.random()*n)+1;
const signed = n => n>=0 ? '+'+n : String(n);
const clamp = (n,lo,hi) => Math.min(hi,Math.max(lo,n));
const esc = value => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hero = () => CLASSES[s.classId] || CLASSES.fighter;
const maxHp = () => hero().hp;
const fmt = text => esc(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
function load() { try { const saved=JSON.parse(localStorage.getItem(SAVE_KEY)); if(saved?.version===1 && saved.classId in CLASSES && typeof saved.stage==='string' && TITLES[saved.stage] && typeof saved.flags==='object' && Array.isArray(saved.journal)) return saved; }catch(e){} return {version:1,stage:'welcome',flags:{},journal:[],checks:[],heroName:'',classId:null,hp:null,potions:1,slots:0,outcome:null,combat:null,ending:null}; }
function persist() { try { localStorage.setItem(SAVE_KEY,JSON.stringify(s)); } catch(e) { console.warn('Local save unavailable',e); } }
function commit(scroll=true) { persist(); render(); if(scroll) window.scrollTo({top:0,behavior:'instant'}); }
function record(text,kind='story') { s.journal.push({text,kind,time:new Date().toISOString()}); if(s.journal.length>120) s.journal=s.journal.slice(-120); }
function outcome(title,body,success=null,roll=null) { s.outcome={title,body,success,roll}; record(title+': '+body,success===null?'story':success?'success':'failure'); }
function go(stage,clear=true) { s.stage=stage; if(clear) s.outcome=null; commit(); }
function begin() {
 const cls = document.querySelector('input[name="classChoice"]:checked')?.value || 'fighter';
 const name=(document.querySelector('#heroName')?.value||'').trim().slice(0,28) || DEFAULT_NAME[cls];
 s={version:1,stage:'tavern',flags:{},journal:[],checks:[],heroName:name,classId:cls,hp:CLASSES[cls].hp,potions:1,slots:CLASSES[cls].spellSlots,outcome:null,combat:null,ending:null};
 record(`${name} the ${CLASSES[cls].name} enters the Forgotten Tavern.`); commit();
}
function skillBonus(skill) { if(skill==='dexsave') return hero().dexSave; if(skill==='thieves') return s.classId==='rogue'?5:null; return hero().skills[skill]??0; }
const CHECKS={
 observe:{name:'Wisdom (Perception)',skill:'perception',dc:13,why:'Notice clues without approaching the stranger.'},
 keeperIntro:{name:'Charisma (Persuasion)',skill:'persuasion',dc:12,why:'Ask the keeper for information without alarming anyone.'},
 insightIntro:{name:'Wisdom (Insight)',skill:'insight',dc:12,why:'Read the stranger’s expression and intentions.'},
 strangerTrust:{name:'Charisma (Persuasion)',skill:'persuasion',dc:12,why:'Convince the traveler you genuinely want to help.'},
 keeperHelp:{name:'Charisma (Persuasion)',skill:'persuasion',dc:11,why:'Persuade the keeper to share the old cellar password.'},
 sneakDoor:{name:'Dexterity (Stealth)',skill:'stealth',dc:12,why:'Cross the room without attracting attention.'},
 forceDoor:{name:'Strength (Athletics)',skill:'athletics',dc:14,why:'Force the rusted door open by applying leverage.'},
 inspectDoor:{name:'Intelligence (Investigation)',skill:'investigation',dc:12,why:'Examine the door for a hidden release.'},
 pickDoor:{name:'Dexterity (Thieves’ Tools)',skill:'thieves',dc:14,why:'Use the Rogue’s thieves’ tools to pick the old lock.'},
 scanHall:{name:'Wisdom (Perception)',skill:'perception',dc:12,why:'Spot the trap before walking into it.'},
 disarmTrap:{name:'Dexterity (Sleight of Hand)',skill:'sleight',dc:12,why:'Wedge the pressure plate in place with a metal pin.'},
 trapSave:{name:'Dexterity Saving Throw',skill:'dexsave',dc:12,why:'Dodge the swinging stone trap before it hits you.'},
 runTrap:{name:'Dexterity Saving Throw',skill:'dexsave',dc:14,why:'Sprint through the chamber before the trap can strike.'},
 studyRunes:{name:'Intelligence (Arcana)',skill:'arcana',dc:12,why:'Understand the arcane runes around the guardian.'},
 wardTalk:{name:'Charisma (Persuasion)',skill:'persuasion',dc:14,why:'Convince the enchanted guardian you are not here to destroy the lantern.'},
 wardSneak:{name:'Dexterity (Stealth)',skill:'stealth',dc:14,why:'Use pillars as cover and slip past the guardian.'}
};
function startCheck(key) {
 const c=CHECKS[key]; if(!c) return;
 const disadvantaged=(s.classId==='fighter' && ['sneakDoor','wardSneak'].includes(key));
 const advantaged=(key==='wardTalk' && (s.flags.password||s.flags.key)) || (key==='wardSneak' && s.flags.trapSeen && !s.flags.alerted);
 s.pending={key, ...c, bonus:skillBonus(c.skill),mode: disadvantaged?'disadvantage':advantaged?'advantage':'normal'};
 commit();
}
function rollCheck() {
 if(!s.pending) return;
 const c=s.pending; const die1=rand(20), die2=c.mode==='normal'?null:rand(20);
 const die=die2===null?die1:c.mode==='advantage'?Math.max(die1,die2):Math.min(die1,die2);
 const total=die+c.bonus, success=total>=c.dc;
 const roll={name:c.name,die1,die2,die,total,modifier:c.bonus,dc:c.dc,mode:c.mode,success};
 s.checks.push(roll); s.pending=null;
 record(`Rolled ${c.name}: ${die1}${die2===null?'':` / ${die2} (kept ${die})`} ${signed(c.bonus)} = ${total} against DC ${c.dc} — ${success?'success':'failure'}.`,'roll');
 handleCheckResult(c.key,success,roll);
 commit();
}
function handleCheckResult(key,win,roll) {
 const apply=(title,text,stage,ok=win) => { s.stage=stage; outcome(title,text,ok,roll); };
 switch(key) {
 case 'observe':
 s.flags.observed=true; s.flags.sawDoor=true;
 if(win){s.flags.sawKey=true; s.flags.sawGlow=true; apply('You notice something strange','The metallic glint is a silver key shaped like a three-eyed wolf. A blue glow flickers beneath the cloak. The traveler keeps glancing toward a locked door behind the counter.','tavernHub');}
 else apply('The firelight deceives you','A passing server blocks your view. When you look again, the metallic object has vanished beneath the cloak. You do notice the traveler watching the door behind the counter.','tavernHub'); break;
 case 'keeperIntro': s.flags.askedKeeper=true; if(win){s.flags.heardRumor=true; apply('A whispered warning','The keeper quietly tells you that the cellar was locked years ago. “Whatever lives down there,” she says, “responds to a promise, not a threat.”','tavernHub');} else apply('Not here, not now','The keeper stiffens. “We don’t discuss the cellar in front of guests.” She glances at the locked door, revealing more than she intended.','tavernHub'); break;
 case 'insightIntro':s.flags.metStranger=true; if(win){s.flags.strangerNervous=true;apply('Fear, not menace','You catch a flash of worry in the traveler’s expression. They seem protective of something, not ready to attack. Perhaps a kind approach will help.','stranger');} else apply('An unreadable face','You cannot make out the stranger’s intentions. They turn toward you. “Have we met?”','stranger'); break;
 case 'strangerTrust':s.flags.triedStranger=true;if(win){s.flags.key=true;apply('A gesture of trust','“Then perhaps you can help.” The traveler places a silver wolf-shaped key in your palm. “The lantern below has been fading. Please don’t break it.”','tavernHub');}else apply('A promise unproven','The traveler shakes their head. “I can’t risk handing it to a stranger.” Their eyes drift toward the cellar. You will need another way in.','tavernHub');break;
 case 'keeperHelp':s.flags.triedKeeper=true;if(win){s.flags.password=true;apply('The keeper relents','“Say ‘I come to mend the light’ at the cellar door,” she whispers. “Those words were written on the original lock.”','tavernHub');}else apply('A different kind of help','The keeper will not share the old password, but quietly points out the narrow servants’ hatch beside the counter.','tavernHub');break;
 case 'sneakDoor':s.flags.sneakDoorTried=true;if(!win)s.flags.alerted=true;apply(win?'A quiet crossing':'A chair scrapes loudly',win?'You pass the tables unnoticed and reach the cellar door.':'Everyone looks up when you brush against a chair. The cellar door is within reach, but something beyond it may now be listening.','door');break;
 case 'forceDoor':s.flags.alerted=!win||s.flags.alerted;apply(win?'Wood gives way':'A deafening crash',win?'You lever the rusty door until its hinges yield. The passage beyond smells of wet stone.':'The wood splits with a crash and you stumble through. You are inside, but any guardian below has surely heard you.','passage');break;
 case 'inspectDoor':s.flags.inspectedDoor=true;if(win){s.flags.secretLatch=true;apply('A hidden release','You find a spring latch behind a carved wolf emblem. A small click, and the heavy door opens without a sound.','passage');}else apply('An old lock, no easy answer','The carvings are worn beyond recognition. You cannot find a release, though the servants’ hatch nearby seems just large enough to crawl through.','door');break;
 case 'pickDoor':s.flags.pickedDoor=true;if(win){apply('Click','A satisfying click rings from the lock. Your thieves’ tools have done their job. The door swings inward.','passage');}else{s.flags.alerted=true;apply('A broken pick','The old mechanism snags your pick with a sharp metallic snap. You may need a less delicate way inside.','door');}break;
 case 'scanHall':s.flags.scanned=true;s.flags.trapSeen=win;apply(win?'A hairline in the stone':'No obvious danger',win?'A pressure plate runs across the corridor. Above it, a carved stone block is poised to swing down. You can step around it or try to disable it.':'The air feels stale, but nothing appears out of place. The strange blue light continues farther down the passage.','passageChoice');break;
 case 'disarmTrap':s.flags.disarmAttempted=true; if(win){s.flags.trapSafe=true;apply('The mechanism jams','You wedge the pressure plate securely in place. No hidden blades, no collapsing floor. The way ahead is safe.','vault');} else {s.flags.trapSafe=false;apply('A dangerous click','Your pin slips and the pressure plate moves beneath your fingers. The stone above begins to fall—react quickly!','passageChoice');s.flags.triggeredTrap=true;}break;
 case 'trapSave':case 'runTrap': {
 const dmg=win?0:rand(4);s.hp=clamp(s.hp-dmg,0,maxHp());s.flags.trapPassed=true;
 if(s.hp<=0)s.flags.defeatSource='trap';
 apply(win?'A narrow escape':'The trap connects',win?'You twist away just as the heavy stone swings past. Beyond it, a pale light pulses from a hidden chamber.':`The slab clips your shoulder for ${dmg} damage. You stumble free and find yourself at the entrance to a vast chamber.`,s.hp>0?'vault':'defeat');break; }
 case 'studyRunes':s.flags.studied=true;if(win){s.flags.weakness=true;apply('An opening in the enchantment','You decipher a rune: the guardian weakens when distracted by the lantern. You can exploit this for **advantage on your first attack** if a fight begins.','vault');}else apply('The symbols resist you','You recognize the runes as protective magic but cannot determine how to disable them.','vault');break;
 case 'wardTalk':s.flags.triedTalk=true;if(win){s.flags.peaceful=true;apply('The guardian bows','The echoing voice softens: “Then mend what was broken.” The guardian withdraws to allow you to approach the lantern.','reveal');}else{s.flags.wardAngry=true;apply('An unconvincing answer','“Words are easily spoken,” the guardian replies. Its pale eyes flare. “Prove your purpose—or leave.”','vaultAlert');}break;
 case 'wardSneak':s.flags.triedSneak=true;if(win){s.flags.sneaked=true;apply('Silent as moonlight','You cross the chamber behind the columns. The guardian turns too late; you are already beside the unguarded lantern.','reveal');}else{setupCombat('The guardian hears your approach. The chamber rings with the sound of stone stepping toward you.');}break;
 }
}
function act(key) {
 if(s.pending) return;
 switch(key) {
 case 'observe':case 'keeperIntro':case 'insightIntro':case 'strangerTrust':case 'keeperHelp':case 'sneakDoor':case 'forceDoor':case 'inspectDoor':case 'pickDoor':case 'scanHall':case 'disarmTrap':case 'trapSave':case 'runTrap':case 'studyRunes':case 'wardTalk':case 'wardSneak':startCheck(key);return;
 case 'goStranger':go('stranger');return;
 case 'goKeeper':go('keeper');return;
 case 'goDoor':go('door');return;
 case 'keyDoor':s.flags.usedKey=true; s.stage='passage';outcome('The wolf-key turns','The key fits perfectly. With a low metallic hum, the cellar door swings open.');commit();return;
 case 'passwordDoor':s.flags.usedPassword=true;s.stage='passage';outcome('An ancient promise','You speak the old words. The carved wolf on the door flashes blue and the lock releases.');commit();return;
 case 'hatch':s.flags.usedHatch=true;s.stage='passage';outcome('Through the servants’ hatch','You squeeze through a dusty service tunnel and drop into the corridor below. Your cloak catches on a nail, but you are unharmed.');commit();return;
 case 'stepOverTrap':s.flags.trapSafe=true;s.stage='vault';outcome('A careful crossing','Knowing where the plate lies, you edge around it safely and continue toward the blue light.');commit();return;
 case 'advanceHall':act('trapSave');return;
 case 'stepIn':if(s.flags.triggeredTrap)act('trapSave');else act('trapSave');return;
 case 'openVault':go('vault');return;
 case 'startCombat':setupCombat('The guardian raises its stone hands and steps between you and the lantern.');return;
 case 'leaveEmpty':s.ending='escape';s.stage='ending';outcome('You choose caution','You retreat safely to the tavern. The lantern remains below, but sometimes surviving is its own victory.');commit();return;
 case 'useKeyOnWarden':s.flags.peaceful=true;s.stage='reveal';outcome('The key remembers','You raise the wolf-shaped key. The guardian recognizes its ancient maker and lowers its hands.');commit();return;
 case 'restore':finish('restore');return;
 case 'take':finish('take');return;
 case 'return':finish('return');return;
 case 'retryFight':s.hp=Math.max(s.hp,Math.ceil(maxHp()/2));s.potions=Math.max(s.potions,1);s.slots=Math.max(s.slots,s.classId==='wizard'?1:0);if(s.flags.defeatSource==='trap'){s.flags.triggeredTrap=false;s.flags.trapPassed=false;s.stage='passageChoice';outcome('Another chance','You catch your breath and approach the corridor again. This time you can choose a different approach.');commit();}else{s.flags.weakness=true;setupCombat('A moment passes. You gather your courage and try the encounter again. This time you notice an opening in the guardian’s defense.');}return;
 }
}
function finish(which){s.ending=which;s.stage='ending';let title,desc;
 if(which==='restore'){title='The lantern shines again';desc='You place the silver key in the lantern’s socket. Blue light floods the chamber. The guardian bows as warmth returns to the forgotten vault.';}
 else if(which==='take'){title='A dangerous souvenir';desc='You lift the enchanted lantern and wrap it carefully in your cloak. Its fading glow follows you into the night. The mystery is far from over.';}
 else{title='A promise kept';desc='You return upstairs and entrust the lantern to the hooded traveler. They take it with trembling hands. “You have given us a chance,” they whisper.';}
 outcome(title,desc);record(`Adventure completed: ${which}.`);commit();}
function setupCombat(intro) {
 s.stage='combat';s.pending=null;
 s.combat={phase:'initiative',enemyHp:11,enemyMax:11,enemyAc:12,round:1,firstAdv:!!s.flags.weakness,hidden:false,dodging:false,bonusUsed:false,secondWindUsed:false,initiative:null,last:null,log:[intro],ended:false};
 s.outcome=null; record('Combat begins: the Echo Warden approaches.','combat');commit();
}
function clog(text) { s.combat.log.unshift(text);s.combat.log=s.combat.log.slice(0,35);record(text,'combat'); }
function enemyAttack() {
 const c=s.combat;if(!c || c.enemyHp<=0 || s.hp<=0) return;
 const a=rand(20),b=c.dodging?rand(20):null,die=b===null?a:Math.min(a,b),total=die+3;
 const hits=(die===20 || (die!==1 && total>=hero().ac));
 const dmg=hits?rand(4)+1+(die===20?rand(4):0):0;
 if(hits) s.hp=clamp(s.hp-dmg,0,maxHp());
 c.last={side:'enemy',a,b,die,total,ac:hero().ac,damage:dmg,hit:hits};
 clog(`Echo Warden: ${a}${b===null?'':` / ${b} (disadvantage → ${die})`} + 3 = ${total} vs AC ${hero().ac}. ${hits?`Hit for ${dmg} damage.`:'Miss!'}`);
 c.dodging=false;
 if(s.hp<=0){s.flags.defeatSource='combat';s.stage='defeat';s.combat=null;outcome('You fall to the ground','Your HP have reached 0. In a normal D&D game, this usually means unconsciousness and death saving throws. For this tutorial, you can retry the encounter from a safe checkpoint.',false);}
}
function rollInitiative(){
 const c=s.combat;if(!c || c.phase!=='initiative')return;
 const p=rand(20),e=rand(20),playerBonus=hero().stats.DEX===16?3:hero().stats.DEX===14?2:1;
 const playerTotal=p+playerBonus,enemyTotal=e+1,first=playerTotal>=enemyTotal;
 c.initiative={p,e,playerBonus,playerTotal,enemyTotal,first};
 clog(`Initiative: you rolled ${p} ${signed(playerBonus)} = ${playerTotal}; Warden rolled ${e} +1 = ${enemyTotal}. ${first?'You act first.':'The Warden acts first.'}`);
 c.phase='player';if(!first)enemyAttack();commit(false);
}
function nextTurn() {
 const c=s.combat;if(!c)return;
 if(c.enemyHp<=0){s.combat=null;s.flags.victory=true;s.stage='reveal';outcome('The enchantment shatters','The Echo Warden collapses into harmless dust. Its last words are barely audible: “Keep the light alive.”',true);commit();return;}
 if(!c.hidden) enemyAttack(); else {clog('The Warden searches the fallen crates for you, but cannot find you.');}
 if(s.hp<=0){commit(false);return;}
 c.round++;c.bonusUsed=false;c.phase='player';commit(false);
}
function useBonus(kind) {
 const c=s.combat;if(!c||c.phase!=='player'||c.bonusUsed)return;
 if(kind==='potion' && s.potions>0){const r1=rand(4),r2=rand(4),n=r1+r2+2,old=s.hp;s.hp=clamp(s.hp+n,0,maxHp());s.potions--;c.bonusUsed=true;clog(`Bonus Action — Healing Potion: 2d4 + 2 = ${r1} + ${r2} + 2 = ${n}; HP ${old} → ${s.hp}. You still have your action.`);commit(false);}
 if(kind==='secondWind' && s.classId==='fighter'&&!c.secondWindUsed){const n=rand(10)+1,old=s.hp;s.hp=clamp(s.hp+n,0,maxHp());c.secondWindUsed=true;c.bonusUsed=true;clog(`Bonus Action — Second Wind: 1d10 + 1 = ${n}; HP ${old} → ${s.hp}. You still have your action.`);commit(false);}
}
function combatAction(kind) {
 const c=s.combat;if(!c||c.phase!=='player')return;
 if(kind==='flee'){s.combat=null;s.stage='ending';s.ending='escape';outcome('A tactical retreat','You take the Disengage action and escape the chamber without provoking an opportunity attack. The lantern remains beneath the tavern.');commit();return;}
 if(kind==='dodge'){c.dodging=true;clog('You take the Dodge action. The Warden has disadvantage on its next attack against you.');nextTurn();return;}
 if(kind==='hide'&&s.classId==='rogue') {
 const die=rand(20),total=die+hero().skills.stealth,success=total>=15;
 c.hidden=success;clog(`Hide: ${die} + ${hero().skills.stealth} = ${total} vs DC 15. ${success?'You disappear behind the crates. Your next attack can have advantage.':'The Warden spots you.'}`);nextTurn();return;
 }
 if(kind==='missile'&&s.classId==='wizard'&&s.slots>0){
 const rolls=[rand(4)+1,rand(4)+1,rand(4)+1],damage=rolls.reduce((a,b)=>a+b,0);s.slots--;
 c.enemyHp=Math.max(0,c.enemyHp-damage);c.hidden=false;
 clog(`Magic Missile (1 spell slot): three darts hit automatically for ${rolls.join(' + ')} = ${damage} force damage.`);
 nextTurn();return;
 }
 if(kind==='attack') {
 const extraAdv=c.firstAdv||c.hidden;const p=rand(20),q=extraAdv?rand(20):null,die=q===null?p:Math.max(p,q),critical=die===20, hit=critical||(die!==1&&die+hero().attack>=c.enemyAc);
 const damageDice=hit?[rand(hero().damageDie)]:[];
 if(hit&&critical)damageDice.push(rand(hero().damageDie));
 let sneak=[];
 if(hit&&s.classId==='rogue'&&c.hidden){sneak=[rand(6)];if(critical)sneak.push(rand(6));}
 const dmg=hit?damageDice.reduce((a,b)=>a+b,0)+hero().damageMod+sneak.reduce((a,b)=>a+b,0):0;
 c.enemyHp=Math.max(0,c.enemyHp-dmg);
 clog(`${hero().attackName}: ${p}${q===null?'':` / ${q} (advantage → ${die})`} ${signed(hero().attack)} = ${die+hero().attack} vs AC ${c.enemyAc}. ${hit?`${critical?'Critical hit! ':''}${damageDice.join(' + ')}${hero().damageMod?` ${signed(hero().damageMod)}`:''}${sneak.length?` + Sneak Attack ${sneak.join(' + ')}`:''} = ${dmg} damage.`:'Miss.'}${die===1?' Natural 1 always misses.':''}`);
 c.hidden=false;c.firstAdv=false;
 nextTurn();return;
 }
}
function art(stage) { return stage==='tavern'||stage==='tavernHub'||stage==='stranger'||stage==='keeper'||stage==='door'?'tavern':stage==='passage'||stage==='passageChoice'?'passage':'vault'; }
function chapter(stage){return ['tavern','tavernHub','stranger','keeper','door'].includes(stage)?1:['passage','passageChoice'].includes(stage)?2:3;}
function choice(key,title,detail,icon='→',locked=false){return {key,title,detail,icon,locked};}
function scene() {
 const name=esc(s.heroName);
 switch(s.stage){
 case 'tavern':return {chapter:1,label:'THE FORGOTTEN TAVERN',heading:'Every adventure begins somewhere',text:[`Rain taps against the windows of the Forgotten Tavern. ${name}, you have come seeking an old story—and perhaps an easy meal.`,`Across the room, a hooded stranger sits alone by the fireplace. Something metallic glints beneath their cloak. They keep glancing toward a locked door behind the bar.`,`**The Dungeon Master asks:** What do you do?`],lesson:'In tabletop D&D, the DM describes a scene and you decide what your character attempts. There is no single “correct” choice.',choices:[choice('observe','Observe the stranger discreetly','Look for clues · Perception check','◎'),choice('keeperIntro','Ask the keeper about the stranger','Try a careful conversation · Persuasion check','☷'),choice('insightIntro','Approach the hooded traveler','Read their intentions · Insight check','◇'),choice('sneakDoor','Slip toward the cellar door','Avoid drawing attention · Stealth check','↝')]};
 case 'tavernHub':return {chapter:1,label:'THE FORGOTTEN TAVERN',heading:'The room is yours to explore',text:['The fire settles into a low crackle. The traveler remains at the same table, and the cellar door stands closed.','You can investigate other leads before going downstairs. The story will remember what you have discovered.'],lesson:'A failed check does not always stop the story. A good DM can offer a consequence, partial information, or a different approach.',choices:[choice('goStranger','Speak to the stranger',s.flags.key?'You already have the silver key; you can still ask questions.':'Ask directly about the mysterious key.','◇'),choice('goKeeper','Talk to the tavern keeper',s.flags.password?'You already know the cellar password.':'Learn what the tavern keeper knows.','☷'),choice('goDoor','Approach the locked door','Follow the trail into the cellar.','↝')]};
 case 'stranger':return {chapter:1,label:'THE FORGOTTEN TAVERN',heading:'The hooded traveler',text:[`The traveler looks up as ${name} approaches. Rainwater gleams on the clasp of their cloak.`,`“If you are curious about the door,” they murmur, “know that what lies below is important. I came to make certain it does not go dark.”`,s.flags.sawKey?'Your eyes flick to the **wolf-shaped silver key** you noticed earlier.':'Their gloved hand closes around a small object under the table.'],lesson:'Persuasion is not mind control. It represents a sincere attempt to influence someone. The DM decides whether the person is open to the argument.',choices:[!s.flags.key&&!s.flags.triedStranger?choice('strangerTrust','Offer to help protect the lantern','Make a sincere promise · Persuasion DC 12','✦'):null,choice('goDoor','Head to the cellar door','Perhaps there is another way inside.','↝'),choice('goKeeper','Ask the tavern keeper instead','Gather another perspective.','☷')].filter(Boolean)};
 case 'keeper':return {chapter:1,label:'THE FORGOTTEN TAVERN',heading:'A keeper of secrets',text:['The tavern keeper, Mira, polishes a cup that is already clean. She studies you over the rim.','“People used to tend the old light in the cellar. Not anymore. The lock is older than the tavern.”',s.flags.heardRumor?'She glances nervously toward the hooded traveler.':'Her expression suggests she knows more than she has said.'],lesson:'Talking to characters is as much a part of D&D as rolling dice. Sometimes a conversation provides a route that avoids combat entirely.',choices:[!s.flags.password&&!s.flags.triedKeeper?choice('keeperHelp','Ask for the cellar password','Appeal to her concern · Persuasion DC 11','◇'):null,choice('goStranger','Return to the traveler','See what the stranger has to say.','↶'),choice('goDoor','Go to the cellar door','Time to investigate.','↝')].filter(Boolean)};
 case 'door':return {chapter:1,label:'THE FORGOTTEN TAVERN',heading:'A door that remembers',text:['Behind the counter, a heavy oak door is set into the wall. Its lock has the faint outline of a **three-eyed wolf**.','Cold air slips through the cracks. Something pulses softly on the other side.',s.flags.alerted?'The room fell quiet when you approached. Whatever is below may have heard you.':'Nobody seems to be watching closely.'],lesson:'D&D often allows several solutions to one obstacle: tools, strength, information, or an entirely different route. This is not a puzzle with only one key.',choices:[s.flags.key?choice('keyDoor','Use the silver wolf-key','Open the door without a roll.','✧'):null,s.flags.password?choice('passwordDoor','Speak the keeper’s password','Open the magical lock without a roll.','✦'):null,s.classId==='rogue'&&!s.flags.pickedDoor?choice('pickDoor','Pick the lock','Thieves’ tools · Dexterity DC 14','⌘'):null,!s.flags.inspectedDoor?choice('inspectDoor','Search for a hidden latch','Investigation DC 12','◎'):null,choice('forceDoor','Force the door open','Athletics DC 14 · could make noise','⚒'),choice('hatch','Crawl through the servants’ hatch','No roll required, but a rather dusty approach.','↝'),choice('goKeeper','Back away and talk to Mira','You can always gather more information.','↶')].filter(Boolean)};
 case 'passage':return {chapter:2,label:'BENEATH THE FLOORBOARDS',heading:'The descent',text:['Steep stone steps wind beneath the tavern. You follow a thin ribbon of blue light to a corridor lined with old masonry.','A faint clicking noise comes from somewhere ahead. The floor looks almost too neatly fitted.'],lesson:'When the outcome is uncertain, the DM may ask for a check. If you simply walk into danger, the DM may instead ask for a saving throw to resist its effects.',choices:[choice('scanHall','Examine the floor for traps','Perception DC 12 · could reveal a safer path','◎'),choice('runTrap','Rush down the corridor','Dexterity saving throw DC 14 · higher risk','↝')]};
 case 'passageChoice':return {chapter:2,label:'BENEATH THE FLOORBOARDS',heading:'A corridor of consequences',text:[s.flags.triggeredTrap?'A stone slab swings loose above you. You have an instant to react!':s.flags.trapSeen?'The mechanism is plain now: a pressure plate, a counterweight, and a swinging stone.':'You stand halfway along the corridor. A soft creak comes from the ceiling.'],lesson:s.flags.triggeredTrap?'Saving throws are reactions to danger. A Dexterity save represents a last-second dodge.':s.flags.trapSeen?'Sometimes succeeding on a check lets you avoid further rolls entirely. Using information intelligently is a real D&D skill.':'You can keep moving, but unknown dangers might require saving throws.',choices:s.flags.triggeredTrap?[choice('trapSave','Dodge the falling stone','Dexterity saving throw DC 12','↝')]:[s.flags.trapSeen?choice('stepOverTrap','Step safely around the pressure plate','No roll necessary, because you spotted the trap.','✦'):null,s.flags.trapSeen&&!s.flags.disarmAttempted?choice('disarmTrap','Disarm the mechanism','Sleight of Hand DC 12','⌘'):null,choice('trapSave','Press forward carefully','Dexterity saving throw DC 12 if the trap activates','↝')].filter(Boolean)};
 case 'vault':return {chapter:3,label:'THE CHAMBER OF ECHOES',heading:'Keeper of the last light',text:['The passage opens into a round vault. Floating above a stone pedestal is a lantern full of dim, blue fire.','A towering figure of fractured stone rises between you and the pedestal. The **Echo Warden** speaks with the sound of many voices:','“WHO WALKS INTO THE DARK? STATE YOUR PURPOSE.”',s.flags.alerted?'Its pale eyes are already fixed on you. The noise upstairs did not go unnoticed.':'The runes along its shoulders pulse, but its hands remain open.'],lesson:'Not every monster encounter requires a fight. You can negotiate, hide, gather clues, or fight. Your choices can change the outcome.',choices:[!s.flags.studied?choice('studyRunes','Study the runes on the Warden','Arcana DC 12 · discover a weakness','◎'):null,!s.flags.triedTalk?choice('wardTalk','Explain that you came to protect the light',`Persuasion DC 14${s.flags.key||s.flags.password?' · advantage from what you learned':''}`,'◇'):null,!s.flags.triedSneak?choice('wardSneak','Sneak past the Warden',`Stealth DC 14${s.classId==='fighter'?' · disadvantage in chain mail':''}`,'↝'):null,choice('startCombat','Draw your weapon and fight','Learn initiative, attacks and combat actions.','⚔'),choice('leaveEmpty','Retreat to the tavern','Survival is an acceptable choice.','↶')].filter(Boolean)};
 case 'combat':return {chapter:3,label:'THE CHAMBER OF ECHOES',heading:'The Echo Warden awakens',text:['Stone grinds against stone as the guardian steps forward. The air pulses with old magic.','You are about to learn how turns, attacks, and defenses work in D&D.'],lesson:'Combat is turn-based: roll initiative, then decide what your character does on each turn.',choices:[]};
 case 'vaultAlert':return {chapter:3,label:'THE CHAMBER OF ECHOES',heading:'The Warden is losing patience',text:['The Warden steps forward, stone scraping stone. “THE LANTERN MUST NOT FALL.”','Its hands glow with pale runes, but it has not struck yet.'],lesson:'A failed social roll can change a situation without instantly starting combat. The DM decides what the other character does next.',choices:[s.flags.key?choice('useKeyOnWarden','Show the Warden the ancient key','Offer proof that you can be trusted.','✧'):null,choice('startCombat','Stand your ground and fight','Roll initiative and learn combat.','⚔'),choice('leaveEmpty','Withdraw while you can','Leave the lantern where it is.','↶')].filter(Boolean)};
 case 'reveal':return {chapter:3,label:'THE LAST LANTERN',heading:'The lantern is fading',text:['At last, you stand before the ancient light. The blue flame seems to recognize you.','On the pedestal, a carved message reads: **“What is guarded must also be cared for.”**','The lantern is not a treasure to be won. It is a beacon that keeps the surrounding woods safe. The silver key can restore its failing mechanism.'],lesson:'Good adventures give you choices that matter beyond winning a fight. Your character can decide what they value—and live with the consequences.',choices:[choice('restore','Restore the beacon here','Leave the woods safer than you found them.','✦'),choice('return','Take the lantern to the traveler','Trust someone else to care for the beacon.','◇'),choice('take','Keep the mysterious lantern','Carry its secrets into your next adventure.','↝')]};
 default:return {chapter:3,label:'THE END',heading:'Your story continues',text:[],choices:[]};
 }
}
function renderWelcome() {
 return `<div class="welcome"><div class="welcome-hero"><div class="welcome-overlay"><div class="eyebrow">AN INTERACTIVE BEGINNER ADVENTURE <span class="dot"></span> VERSION 1.0</div><div class="ornament">✧ &nbsp; ◇ &nbsp; ✧</div><h1>Lantern <em>&</em> Key</h1><p class="welcome-subtitle">Your first steps into a world of dice, decisions, and dangerous doors.</p><div class="intro-tags"><span>◈ Solo adventure</span><span>♧ Learn as you play</span><span>◷ 10–20 minutes</span></div></div></div>
 <div class="welcome-content"><div class="section-top"><span class="tiny-index">01 / THE HERO</span><h2>Who walks into the tavern?</h2><p>Start with a ready-to-play level 1 character. The mechanics are simplified to teach the essentials without a long setup.</p></div>
 <div class="class-grid">${Object.entries(CLASSES).map(([id,c],i)=>`<label class="class-card"><input type="radio" name="classChoice" value="${id}" ${i===0?'checked':''}/><div class="class-inner"><span class="class-icon">${c.icon}</span><span class="class-name">${c.name}</span><span class="class-tag">${c.tag}</span><span class="class-desc">${c.description}</span><span class="class-stats">${c.hp} HP <span>·</span> ${c.ac} AC</span><span class="class-select">Choose ${c.name} <span aria-hidden="true">↗</span></span></div></label>`).join('')}</div>
 <div class="name-row"><label for="heroName">CHARACTER NAME <span>(optional)</span></label><input id="heroName" maxlength="28" autocomplete="off" placeholder="Choose a name or use the default"/></div>
 <button class="primary big" data-act="begin">Begin your adventure <span>→</span></button><p class="fine-print">No account. No AI subscription. Progress saves on this device automatically.</p>
 <div class="welcome-footer"><span>HOW THIS WORKS</span><p>Choose actions, roll a virtual d20 when prompted, and discover why each rule matters. This is an original, guided teaching adventure—not a complete replacement for a tabletop Dungeon Master.</p><button class="inline-link" data-modal="rules">Browse the beginner rules ↗</button></div></div></div>`;
}
function renderSidebar() {
 const h=hero(); const c=s.combat;
 return `<aside class="sidebar"><div class="side-card character"><div class="side-head"><span class="small-caps">YOUR CHARACTER</span><span class="level-tag">LVL 01</span></div><div class="avatar">${h.icon}</div><h3>${esc(s.heroName)}</h3><p class="side-class">${h.name} <span>·</span> Adventurer</p><div class="health-row"><div class="health-heading"><span>HIT POINTS</span><strong>${s.hp} / ${h.hp}</strong></div><div class="health-track"><span style="width:${100*s.hp/h.hp}%"></span></div></div><div class="stat-columns"><div><span class="stat-num">${h.ac}</span><span class="stat-label">ARMOR CLASS</span></div><div><span class="stat-num">${signed(h.attack)}</span><span class="stat-label">ATTACK BONUS</span></div><div><span class="stat-num">+2</span><span class="stat-label">PROFICIENCY</span></div></div><div class="sidebar-section"><div class="small-caps">ABILITY SCORES <span class="question" title="The modifier is what you usually add to a roll.">?</span></div><div class="abilities">${Object.entries(h.stats).map(([key,score])=>`<div><span>${key}</span><strong>${score}</strong><small>${signed(Math.floor((score-10)/2))}</small></div>`).join('')}</div></div><div class="sidebar-section"><div class="small-caps">PACK & RESOURCES</div><div class="resource"><span>⚗ Healing potion</span><strong>× ${s.potions}</strong></div>${s.classId==='wizard'?`<div class="resource"><span>✦ Spell slots (level 1)</span><strong>${s.slots} / 2</strong></div>`:''}<div class="resource"><span>${s.flags.key?'✧':'◇'} Silver wolf-key</span><strong>${s.flags.key?'Found':'—'}</strong></div></div><button class="side-action" data-modal="sheet">View full character sheet →</button></div>
 <div class="side-card learning"><div class="small-caps">THE LEARNING PATH</div>${['Exploration & checks','Hazards & saving throws','Dialogue & combat'].map((t,i)=>`<div class="learning-item ${chapter(s.stage)>i?'completed':''}"><span>${chapter(s.stage)>i?'✓':String(i+1).padStart(2,'0')}</span><p>${t}</p></div>`).join('')}<div class="side-divider"></div><button class="side-action" data-modal="rules">Quick rules reference ↗</button></div></aside>`;
}
function renderCheck() {
 const p=s.pending;
 return `<div class="check-card" aria-live="polite"><div class="check-heading"><span class="die-small">◈</span><div><span class="small-caps">THE DUNGEON MASTER CALLS FOR A ROLL</span><h3>${esc(p.name)}</h3></div></div><p>${esc(p.why)}</p><div class="roll-formula"><div><span>YOUR DIE</span><strong>d20</strong></div><b>+</b><div><span>YOUR BONUS</span><strong>${signed(p.bonus)}</strong></div><b>≥</b><div><span>TARGET DC</span><strong>${p.dc}</strong></div></div>${p.mode!=='normal'?`<div class="mode-notice">${p.mode==='advantage'?'✦ Advantage: roll twice and keep the higher die.':'◇ Disadvantage: roll twice and keep the lower die.'} ${p.mode==='disadvantage'?'Heavy chain mail makes sneaking harder.':'The story has given you a favorable position.'}</div>`:''}<div class="dice-wrap"><div class="die20" aria-hidden="true"><span>20</span></div><button class="primary roll-btn" data-act="rollCheck">Roll ${p.mode==='normal'?'the d20':'two d20s'} <span>✧</span></button><span class="roll-hint">${p.mode==='normal'?`You need ${clamp(p.dc-p.bonus,1,21)} or higher on the die.`:'The chosen die gets your bonus added to it.'}</span></div><div class="teaching-inline"><span>✦ A LITTLE D&D KNOWLEDGE</span><p>For a check, add the listed bonus to the die. **Meeting** the DC is enough. A natural 20 does not automatically succeed on an ability check.</p></div></div>`;
}
function renderOutcome(){const o=s.outcome;if(!o)return '';const r=o.roll;return `<div class="outcome ${o.success===null?'neutral':o.success?'positive':'negative'}"><div class="outcome-line"><span>${o.success===null?'✧':o.success?'✓':'◇'} ${esc(o.title)}</span>${r?`<span class="result-pill">${r.success?'SUCCESS':'FAILURE'} · ${r.total} / ${r.dc}</span>`:''}</div><p>${fmt(o.body)}</p>${r?`<div class="outcome-math">${r.mode!=='normal'?`d20 ${r.die1} / ${r.die2} → ${r.die}`:`d20 ${r.die}`} &nbsp; ${signed(r.modifier)} &nbsp; = <strong>${r.total}</strong> &nbsp; vs DC ${r.dc}</div>`:''}</div>`;}
function renderCombat() {
 const c=s.combat;if(!c)return '';
 return `<div class="combat-card"><div class="combat-head"><div><span class="small-caps">COMBAT ENCOUNTER</span><h3>Echo Warden <span class="enemy-lvl">AC ${c.enemyAc}</span></h3></div><div class="enemy-symbol">◇</div></div><div class="enemy-bar"><span style="width:${100*c.enemyHp/c.enemyMax}%"></span></div><div class="combat-meta"><span>WARDEN HP <strong>${c.enemyHp} / ${c.enemyMax}</strong></span><span>ROUND <strong>${c.round}</strong></span></div>${c.phase==='initiative'?`<p class="combat-blurb">Before combat begins, everyone rolls <strong>initiative</strong> (a Dexterity check) to decide turn order.</p><button class="primary" data-act="rollInitiative">Roll initiative <span>⚄</span></button>`:`<div class="combat-turn"><span class="your-turn">● YOUR TURN</span><p>You have <strong>one action</strong>. Bonus Actions are separate if you have an ability that uses them.</p><div class="combat-actions"><button class="move-btn" data-act="combat:attack"><span class="move-glyph">⚔</span><span><strong>Attack · ${esc(hero().attackName)}</strong><small>${signed(hero().attack)} to hit · ${s.classId==='wizard'?'1d10 fire':`1d${hero().damageDie} ${signed(hero().damageMod)} damage`}${c.hidden||c.firstAdv?' · advantage':''}</small></span><span class="move-arrow">→</span></button>${s.classId==='wizard'&&s.slots>0?`<button class="move-btn" data-act="combat:missile"><span class="move-glyph">✦</span><span><strong>Magic Missile</strong><small>Auto-hit · 3 × (1d4 + 1) · costs 1 slot</small></span><span class="move-arrow">→</span></button>`:''}${s.classId==='rogue'?`<button class="move-btn" data-act="combat:hide"><span class="move-glyph">↝</span><span><strong>Hide behind the crates</strong><small>Stealth DC 15 · set up advantage</small></span><span class="move-arrow">→</span></button>`:''}<button class="move-btn" data-act="combat:dodge"><span class="move-glyph">◇</span><span><strong>Dodge</strong><small>Warden attacks at disadvantage this round</small></span><span class="move-arrow">→</span></button><button class="move-btn" data-act="combat:flee"><span class="move-glyph">↶</span><span><strong>Disengage and escape</strong><small>Withdraw safely; leave the lantern behind</small></span><span class="move-arrow">→</span></button></div><div class="bonus-actions"><span class="small-caps">BONUS ACTIONS · ${c.bonusUsed?'USED THIS TURN':'OPTIONAL'}</span><div class="bonus-row">${s.potions>0?`<button ${c.bonusUsed||s.hp===maxHp()?'disabled':''} data-act="bonus:potion">⚗ Drink healing potion <small>2d4+2 HP</small></button>`:''}${s.classId==='fighter'&&!c.secondWindUsed?`<button ${c.bonusUsed||s.hp===maxHp()?'disabled':''} data-act="bonus:secondWind">✚ Second Wind <small>1d10+1 HP</small></button>`:''}${s.potions===0&&(s.classId!=='fighter'||c.secondWindUsed)?'<span class="muted">No remaining Bonus Actions available.</span>':''}</div></div></div>`}<div class="combat-log"><div class="small-caps">RECENT DICE & ACTIONS</div>${c.log.slice(0,5).map((t,i)=>`<div class="combat-log-entry ${i===0?'latest':''}">${esc(t)}</div>`).join('')}</div><div class="teaching-inline"><span>✦ COMBAT TUTORIAL</span><p>${c.phase==='initiative'?'Higher initiative acts first. Ties can be resolved by the DM; this demo favors your character.':'An attack is a d20 + your attack bonus against the target’s AC. A natural 1 misses, a natural 20 critically hits. On your turn you may choose to Dodge, flee, or use a class feature instead.'}</p></div></div>`;
}
function renderScene() {
 const v=scene();const isSpecial=['ending','defeat'].includes(s.stage);
 if(isSpecial)return renderEnding();
 return `<section class="story-screen"><div class="chapter-strip"><span>CHAPTER ${String(v.chapter).padStart(2,'0')}</span><div class="chapter-progress"><i class="${v.chapter>=1?'lit':''}"></i><i class="${v.chapter>=2?'lit':''}"></i><i class="${v.chapter>=3?'lit':''}"></i></div><span>${v.label}</span></div><div class="story-art"><img src="assets/${art(s.stage)}.svg" alt="${art(s.stage)==='tavern'?'A dim tavern with a cloaked stranger':art(s.stage)==='passage'?'An ancient stone passage':'A blue-glowing underground sanctuary'}"/><span class="art-corner">✧ AN ORIGINAL ADVENTURE</span></div><div class="story-body"><span class="tiny-index">${esc(v.label)}</span><h2>${esc(v.heading)}</h2><div class="prose">${v.text.map(p=>`<p>${fmt(p)}</p>`).join('')}</div>${renderOutcome()}${s.pending?renderCheck():s.stage==='combat'?renderCombat():`<div class="choice-panel"><div class="choice-label"><span>WHAT DO YOU DO?</span><small>There is no wrong way to be curious.</small></div><div class="choice-list">${v.choices.map((c,i)=>`<button class="choice-btn" data-act="${c.key}" ${c.locked?'disabled':''}><span class="choice-icon">${c.icon}</span><span class="choice-description"><strong>${esc(c.title)}</strong><small>${esc(c.detail)}</small></span><span class="choice-chevron">↗</span></button>`).join('')}</div></div><div class="lesson"><div>✦ &nbsp; DM'S NOTE</div><p>${esc(v.lesson)}</p></div>`}</div></section>`;
}
function renderEnding(){const won=s.stage==='ending';const escape=s.ending==='escape';const total=s.checks.length;const successes=s.checks.filter(x=>x.success).length;
 return `<div class="end-screen"><div class="end-art"><img src="assets/vault.svg" alt="A mystical vault with a glowing lantern"/><div class="end-seal">${won&&!escape?'✦':'◇'}</div></div><div class="end-content"><span class="tiny-index">${won?'ADVENTURE COMPLETE':'CHECKPOINT REACHED'}</span><h2>${won?'Your story is just beginning':'Every hero has setbacks'}</h2>${renderOutcome()}<p class="end-main">${won?(escape?'You learned that a retreat is a meaningful choice too. There will be other adventures.':'The tavern slowly returns to silence, but you leave knowing that your choices changed the world, even in a small way.'):'You can safely try the final encounter again. D&D is not about perfection; it is about discovering a story together.'}</p><div class="end-stats"><div><strong>${total}</strong><span>CHECKS MADE</span></div><div><strong>${successes}</strong><span>CHECKS PASSED</span></div><div><strong>${s.journal.filter(x=>x.kind==='combat').length}</strong><span>COMBAT EVENTS</span></div></div>${won?`<div class="next-chapter"><span>✧ &nbsp; WHAT YOU LEARNED</span><p>Exploration, skill checks, difficulty classes, roleplaying, ${s.flags.trapPassed?'saving throws, ':''}${s.flags.victory?'combat, ':''}and how different choices lead to different outcomes.</p></div>`:''}<div class="end-buttons">${!won?`<button class="primary" data-act="retryFight">${s.flags.defeatSource==='trap'?'Retry from the corridor':'Retry encounter with a hint'} <span>↻</span></button>`:''}<button class="${won?'primary':'secondary'}" data-act="restart">Start a new adventure <span>→</span></button><button class="secondary" data-modal="journal">Read your adventure journal</button></div></div></div>`;
}
function renderSheet(){const h=hero();return `<div class="sheet"><div class="sheet-hero"><span class="sheet-icon">${h.icon}</span><div><strong>${esc(s.heroName)}</strong><p>Level 1 ${h.name} · Training character</p></div></div><div class="sheet-tiles"><div>Hit Points <strong>${s.hp} / ${h.hp}</strong></div><div>Armor Class <strong>${h.ac}</strong></div><div>Proficiency <strong>+2</strong></div><div>Initiative <strong>${signed(Math.floor((h.stats.DEX-10)/2))}</strong></div></div><h4>Ability scores</h4><div class="sheet-abilities">${Object.entries(h.stats).map(([key,n])=>`<div><span>${key}</span><strong>${n}</strong><small>${signed(Math.floor((n-10)/2))}</small></div>`).join('')}</div><h4>Skills used in this adventure</h4><div class="sheet-skills">${Object.entries(h.skills).map(([key,bonus])=>`<div><span>${key==='sleight'?'Sleight of Hand':key.charAt(0).toUpperCase()+key.slice(1)}</span><strong>${signed(bonus)}</strong></div>`).join('')}</div><p class="muted">These are curated level 1 practice builds with a limited selection of class features, not complete SRD character sheets. The bonuses shown already include proficiency where relevant.</p></div>`;}
function renderModal(){if(!modal)return '';let title,content;
 if(modal==='rules'){title='A pocket rulebook';content=`<p class="modal-lead">The essentials you'll use on this adventure. Tap a topic to expand.</p><div class="glossary">${GLOSSARY.map(([name,text],i)=>`<details ${i===1?'open':''}><summary>${esc(name)}</summary><p>${esc(text)}</p></details>`).join('')}</div><div class="attribution">Based on portions of the <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">System Reference Document 5.2.1</a> by Wizards of the Coast, available under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Rules simplified/adapted for teaching. Not affiliated with or endorsed by Wizards of the Coast.</div>`;}
 else if(modal==='sheet'){title='Character sheet';content=renderSheet();}
 else if(modal==='journal'){title='Adventure journal';content=`<p class="modal-lead">A record of your choices and dice rolls, kept locally on this device.</p><div class="journal-items">${s.journal.length?s.journal.map(entry=>`<div class="journal-entry ${esc(entry.kind)}"><span>✧</span><p>${esc(entry.text)}</p></div>`).reverse().join(''):'<p class="muted">Your journal will fill as you play.</p>'}</div>`;}
 else if(modal==='settings'){title='Save & settings';content=`<p class="modal-lead">Your progress is saved automatically in this browser. No account or server is involved.</p>${installPanel()}<div class="settings-actions"><button data-act="export">↓ Export save as JSON</button><button data-act="import">↑ Import save from JSON</button><input id="importFile" type="file" accept=".json,application/json" hidden/><button class="danger" data-act="restart">↻ Erase save and start over</button></div><div class="attribution"><strong>Offline play:</strong> After your first successful visit via HTTPS, this app can work offline on supported browsers. Updates are never applied while you are editing or playing without choosing to reload.<br/><br/>Rules adapted from <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">SRD 5.2.1</a> (Wizards of the Coast, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>); original adventure and code. Not an official D&D product.</div>`;}
 return `<div class="modal-backdrop" data-act="closeModalBackdrop"><div role="dialog" aria-modal="true" aria-label="${esc(title)}" class="modal"><div class="modal-heading"><div><span class="small-caps">LANTERN & KEY</span><h2>${esc(title)}</h2></div><button class="icon-btn" data-act="closeModal" aria-label="Close dialog">×</button></div><div class="modal-content">${content}</div></div></div>`;}
function render(){const playing=s.classId&&s.stage!=='welcome';app.innerHTML=`<header class="app-header"><div class="header-inside"><button class="brand" data-act="home" aria-label="Lantern and Key home"><span class="brand-logo">✧</span><span>LANTERN <em>&</em> KEY</span></button><div class="header-actions">${playing?`<span class="header-hp">♥ <b>${s.hp}</b> / ${maxHp()} HP</span><button class="nav-button" data-modal="journal">Journal</button>`:''}<button class="nav-button" data-modal="rules">Rules</button><button class="nav-button" data-modal="settings" aria-label="Settings">⚙</button></div></div></header><div class="shell ${playing?'playing':''}">${playing?`<div class="game-layout"><main class="game-main">${renderScene()}</main>${renderSidebar()}</div>`:renderWelcome()}</div><footer class="site-footer"><span>✧ LANTERN & KEY</span><span>An independent tabletop-fantasy learning adventure · v1.1</span><button data-modal="rules">Rules & attribution ↗</button></footer>${renderModal()}${updateWorker?`<div class="update-banner"><span>A new version is ready. Your progress is saved.</span><button data-act="applyUpdate">Update when ready →</button><button data-act="dismissUpdate" aria-label="Dismiss update">×</button></div>`:''}`;}
function restart(){if(!confirm('Start a new adventure? Your current progress will be replaced. Export a backup first if you want to keep it.'))return;s={version:1,stage:'welcome',flags:{},journal:[],checks:[],heroName:'',classId:null,hp:null,potions:1,slots:0,outcome:null,combat:null,ending:null};modal=null;commit();}
function exportSave(){const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lantern-and-key-save.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importSave(file){if(!file)return;try{const obj=JSON.parse(await file.text());if(!obj || obj.version!==1 || !Object.prototype.hasOwnProperty.call(CLASSES,obj.classId) || !TITLES[obj.stage] || !Array.isArray(obj.journal) || !Array.isArray(obj.checks) || !obj.flags || typeof obj.flags!=='object'||!Number.isFinite(obj.hp)||obj.journal.length>1000)throw Error('Not a compatible Lantern & Key v1 save.');if(!confirm('Replace current progress with the imported save?'))return;s={...obj,heroName:String(obj.heroName||'Adventurer').slice(0,28),hp:clamp(obj.hp,0,CLASSES[obj.classId].hp),potions:clamp(Number(obj.potions)||0,0,99),slots:clamp(Number(obj.slots)||0,0,2),journal:obj.journal.slice(-120),pending:obj.pending&&CHECKS[obj.pending.key]?obj.pending:null};modal=null;commit();}catch(e){alert('Import failed: '+e.message);}}
app.addEventListener('click',event=>{
 const button=event.target.closest('[data-act],[data-modal]');if(!button)return;
 const action=button.dataset.act;
 if(button.dataset.modal){modal=button.dataset.modal;render();return;}
 if(!action)return;
 if(action==='closeModal'){modal=null;render();return;}
 if(action==='closeModalBackdrop'){if(event.target===button){modal=null;render();}return;}
 if(action==='begin')begin();
 else if(action==='home'){if(s.stage==='welcome'){scrollTo({top:0,behavior:'smooth'});}else{modal='settings';render();}}
 else if(action==='rollCheck')rollCheck();
 else if(action==='rollInitiative')rollInitiative();
 else if(action.startsWith('combat:'))combatAction(action.split(':')[1]);
 else if(action.startsWith('bonus:'))useBonus(action.split(':')[1]);
 else if(action==='restart')restart();
 else if(action==='installApp')requestInstall();
 else if(action==='export')exportSave();
 else if(action==='import')document.querySelector('#importFile')?.click();
 else if(action==='applyUpdate'&&updateWorker){persist();updateRequested=true;updateWorker.postMessage({type:'SKIP_WAITING'});}
 else if(action==='dismissUpdate'){updateWorker=null;render();}
 else act(action);
});
app.addEventListener('change',event=>{if(event.target.id==='importFile')importSave(event.target.files?.[0]);});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && modal){modal=null;render();}});
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js').then(reg=>{
   if(reg.waiting){updateWorker=reg.waiting;render();}
   reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){updateWorker=w;render();}});});
  }).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested){persist();location.reload();}});
 });
}
render();
})();
