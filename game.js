/* Lantern & Key: a self-contained, intentionally scoped D&D-learning adventure.
   Mechanics are an educational subset inspired by the SRD 5.2.1 (CC BY 4.0).
   No API key, tracking or third-party resources are needed. */
(() => {
'use strict';
const SAVE_KEY = 'lantern-and-key.save.v1';
const REPLAY_KEY = 'lantern-and-key.replay.v1';
const GOOD_KEY = 'lantern-and-key.lastgood.v1';
const GOOD_REPLAY_KEY = 'lantern-and-key.lastgood.replay.v1';
const PREIMPORT_KEY = 'lantern-and-key.preimport.v1';
let loadIssue = '';
const {validateSave,shortestRoute,dashMovement,rangedDisadvantage,opposingRolls}=window.LanternCore;
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
const TITLES = {tavern:'The Forgotten Tavern',tavernHub:'A Question of Trust',stranger:'The Hooded Traveler',keeper:'The Tavern Keeper',door:'The Locked Door',passage:'Beneath the Floorboards',passageChoice:'The Pressure Plates',vault:'The Chamber of Echoes',vaultAlert:'The Warden Stirs',combat:'The Echo Warden',reveal:'The Last Lantern',ending:'The Road Ahead',defeat:'A Temporary Setback',forest:'A Night in Blackwood',camp:'The Woodland Camp',trail:'Into the Trees',crossing:'The Broken Crossing',crossingBattle:'The Bridge Skirmish',crossingAfter:'The Other Bank',village:'Briar Hollow',market:'The Market Square',witness:'The Miller’s Testimony',council:'The Council Meeting',trial:'The Arcane Trial',archive:'The Spell Archive',altar:'The Trial of Focus',ascent:'The Beacon Road',levelup:'Becoming an Adventurer',epilogue:'Beyond the Lantern',beaconTest:'The Beacon Test'};
let s;
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
const maxHp = () => hero().hp + ((s.level||1)-1)*({fighter:8,rogue:7,wizard:5}[s.classId]||0);
const fmt = text => esc(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
function load(){
 try{
  const replay=localStorage.getItem(REPLAY_KEY),main=localStorage.getItem(SAVE_KEY);
  const raw=replay||main;if(!raw)return initialSave();
  const saved=upgradeSave(validateSave(JSON.parse(raw)));
  if(replay)saved.replay=saved.replay||{chapter:1};
  return saved;
 }catch(error){loadIssue=error.message||'The saved game could not be opened.';console.error('Save recovery required:',error);return initialSave();}
}
function persist(){
 try{
  const key=s.replay?REPLAY_KEY:SAVE_KEY;
  const raw=JSON.stringify(s);
  localStorage.setItem(s.replay?GOOD_REPLAY_KEY:GOOD_KEY,raw);
  localStorage.setItem(key,raw);
 }catch(e){console.warn('Local save unavailable',e);}
}
function commit(scroll=true){persist();render();if(scroll)window.scrollTo({top:0,behavior:'instant'});}
function recoveryView(){return `<div class="recovery-veil" role="alertdialog" aria-modal="true" aria-label="Save recovery"><section class="recovery-card"><h2>We couldn't open your save safely</h2><p>${esc(loadIssue)}</p><p>Your existing data has <strong>not</strong> been overwritten. Export it for safekeeping, restore the last good autosave, or start fresh.</p><button class="primary" data-act="recover:backup">Restore last good save</button><button class="secondary" data-act="recover:export">Download damaged save</button><button class="secondary" data-act="recover:reset">Start a new adventure</button></section></div>`;}
function restoreRecovery(){try{const backup=localStorage.getItem(localStorage.getItem(REPLAY_KEY)?GOOD_REPLAY_KEY:GOOD_KEY)||localStorage.getItem(GOOD_KEY);if(!backup)throw Error('No valid automatic backup was found.');const normalized=upgradeSave(validateSave(JSON.parse(backup)));s=normalized;localStorage.removeItem(REPLAY_KEY);loadIssue='';modal=null;commit();}catch(err){alert('Recovery failed: '+err.message);}}
function rawSaveDownload(raw,name){const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function restorePreImport(){try{const raw=localStorage.getItem(PREIMPORT_KEY);if(!raw)throw Error('There is no pre-import backup.');const previous=upgradeSave(validateSave(JSON.parse(raw)));if(previous.replay)throw Error('This older backup contains a replay rather than a main campaign and cannot safely replace your progress.');if(!confirm('Restore the main campaign from before your last import?'))return; s=previous;localStorage.removeItem(REPLAY_KEY);modal=null;commit();}catch(err){alert('Restore failed: '+err.message);}}

function record(text,kind='story') { s.journal.push({text,kind,time:new Date().toISOString()}); if(s.journal.length>120) s.journal=s.journal.slice(-120); }
// Every story decision resolves into a serialisable pause screen; no new scene leaks
// until the player explicitly presses Continue. Existing v1 save files still load.
function outcome(title,body,success=null,roll=null) {
 s.outcome={title,body,success,roll};
 const cue=s.actionCue || {};
 s.storyResult={action:cue.label||'Continue the adventure',fromStage:cue.fromStage||s.stage,title,body,success,roll,hpBefore:cue.hpBefore??s.hp,hpAfter:s.hp};
 s.actionCue=null;
 record(title+': '+body,success===null?'story':success?'success':'failure');
 if(s.classId) trackStage();
}
function continueStory() {
 if(!s.storyResult||s.restSession)return;
 s.storyResult=null;
 s.outcome=null; // Don't repeat the previous result above the newly unveiled story.
 s.actionCue=null;
 commit();
}
function go(stage,clear=true) {
 s.stage=stage;
 if(clear) s.outcome=null;
 // Moving to another character/location is an action, even without a die roll.
 outcome('You follow the next lead',`You make your way toward ${TITLES[stage].toLowerCase()}. What you find there remains to be seen.`);
 commit();
}
function begin() {
 const cls = document.querySelector('input[name="classChoice"]:checked')?.value || 'fighter';
 const name=(document.querySelector('#heroName')?.value||'').trim().slice(0,28) || DEFAULT_NAME[cls];
 s=upgradeSave({...initialSave(),stage:'tavern',heroName:name,classId:cls,hp:CLASSES[cls].hp,slots:CLASSES[cls].spellSlots});
 s.checkpoints[1]=JSON.parse(JSON.stringify({...s,checkpoints:{}}));record(`${name} the ${CLASSES[cls].name} enters the Forgotten Tavern.`); commit();
}
function skillBonus(skill) { if(skill==='dexsave') return hero().dexSave; if(skill==='consave') return Math.floor((hero().stats.CON-10)/2)+(s.classId==='fighter'?2:0); if(skill==='thieves') return s.classId==='rogue'?5:null; return (hero().skills[skill]??0)+(s.level===2&&s.classId==='wizard'&&skill===s.scholarSkill?2:0); }
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
 s.outcome=null; // Do not display an old imported-save result beneath a fresh check.
 const disadvantaged=(s.classId==='fighter' && ['sneakDoor','wardSneak'].includes(key));
 const advantaged=(key==='wardTalk' && (s.flags.password||s.flags.key)) || (key==='wardSneak' && s.flags.trapSeen && !s.flags.alerted);
 s.pending={key, ...c, bonus:skillBonus(c.skill),mode: disadvantaged?'disadvantage':advantaged?'advantage':'normal',actionCue:s.actionCue||{label:c.why,fromStage:s.stage,hpBefore:s.hp}};
 s.actionCue=null;
 commit();
}
function rollCheck() {
 if(!s.pending) return;
 const c=s.pending; const die1=rand(20), die2=c.mode==='normal'?null:rand(20);
 const die=die2===null?die1:c.mode==='advantage'?Math.max(die1,die2):Math.min(die1,die2);
 const total=die+c.bonus, success=total>=c.dc;
 const roll={name:c.name,die1,die2,die,total,modifier:c.bonus,dc:c.dc,mode:c.mode,success};
 s.checks.push(roll); s.actionCue=c.actionCue||{label:c.why,fromStage:s.stage,hpBefore:s.hp}; s.pending=null;
 record(`Rolled ${c.name}: ${die1}${die2===null?'':` / ${die2} (kept ${die})`} ${signed(c.bonus)} = ${total} against DC ${c.dc} — ${success?'success':'failure'}.`,'roll');
 if(!success && s.classId==='fighter' && s.level===2 && s.secondWind>0 && c.name!=='Dexterity Saving Throw' && c.name!=='Constitution Saving Throw'){s.mindOffer={key:c.key,roll};s.actionCue=c.actionCue;commit();return;}
 if(!campaignHandleCheck(c.key,success,roll)) handleCheckResult(c.key,success,roll);
 learnForCheck(c.key);
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
 case 'wardSneak':s.flags.triedSneak=true;if(win){s.flags.sneaked=true;apply('Silent as moonlight','You cross the chamber behind the columns. The guardian turns too late; you are already beside the unguarded lantern.','reveal');}else{setupCombat('The guardian hears your approach. The chamber rings with the sound of stone stepping toward you.',roll);}break;
 }
}
function act(key) {
 if(s.pending||s.storyResult) return;
 if(campaignAct(key))return;
 const selected=scene().choices.find(c=>c.key===key);
 s.actionCue={label:selected?.title||({retryFight:'Retry the encounter',stepIn:'Continue through the corridor',advanceHall:'Advance down the corridor'}[key])||key,fromStage:s.stage,hpBefore:s.hp};
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
function finish(which){
 s.ending=which;s.stage='ending';let title,desc;
 // This is a real inventory decision, not merely an ending label.
 // Store the unique story artifact so Pack and later chapters reflect the choice.
 s.inventory.lantern=which==='take'?1:0;
 if(which==='take')learn('inventory');
 if(which==='restore'){title='The lantern shines again';desc='You place the silver key in the lantern’s socket. Blue light floods the chamber. The guardian bows as warmth returns to the forgotten vault.';}
 else if(which==='take'){title='A dangerous souvenir';desc='You lift the enchanted lantern and wrap it carefully in your cloak. Its fading glow follows you into the night. The mystery is far from over.';}
 else{title='A promise kept';desc='You return upstairs and entrust the lantern to the hooded traveler. They take it with trembling hands. “You have given us a chance,” they whisper.';}
 outcome(title,desc);record(`Adventure completed: ${which}.`);commit();}
function setupCombat(intro,roll=null) {
 s.stage='combat';s.pending=null;
 s.combat={phase:'initiative',enemyHp:11,enemyMax:11,enemyAc:12,round:1,firstAdv:!!s.flags.weakness,hidden:false,dodging:false,bonusUsed:false,secondWindUsed:false,initiative:null,last:null,result:null,next:null,log:[intro],ended:false};
 s.outcome=null; record('Combat begins: the Echo Warden approaches.','combat');
 outcome(roll?'Your stealth attempt alerts the Warden':'The Warden accepts your challenge',intro,roll?false:null,roll);commit();
}
function clog(text) { s.combat.log.unshift(text);s.combat.log=s.combat.log.slice(0,35);record(text,'combat'); }
// A combat event is shown by itself before any further turn can resolve.
// 'next' is a serialisable transition, so JSON saves work even mid-combat.
function combatResult({title,story,math='',type='neutral',number='',from='',before=null,after=null,next='player',teaching=''}) {
 const c=s.combat;
 c.phase='result'; c.next=next;
 c.result={title,story,math,type,number,from,before,after,teaching};
 commitCombat();
}
function commitCombat() {
 commit(false);
 requestAnimationFrame(()=>{
  const target=document.querySelector('.combat-card');
  if(target?.scrollIntoView)target.scrollIntoView({block:'start',behavior:'smooth'});
 });
}
function enemyAttack() {
 const c=s.combat;if(!c || c.enemyHp<=0 || s.hp<=0) return;
 const before=s.hp;
 const a=rand(20),b=c.dodging?rand(20):null,die=b===null?a:Math.min(a,b),total=die+3;
 const hits=(die===20 || (die!==1 && total>=hero().ac));
 const dmg=hits?rand(4)+1+(die===20?rand(4):0):0;
 if(hits) s.hp=clamp(s.hp-dmg,0,maxHp());
 c.last={side:'enemy',a,b,die,total,ac:hero().ac,damage:dmg,hit:hits};
 const dodged=c.dodging;c.dodging=false;
 const result=`Echo Warden: ${a}${b===null?'':` / ${b} (disadvantage → ${die})`} + 3 = ${total} vs AC ${hero().ac}. ${hits?`Hit for ${dmg} damage.`:'Miss!'}`;
 clog(result);
 combatResult({
  title:hits?(die===20?'The Warden lands a critical blow!':'The Warden strikes you!'):'The Warden misses!',
  story:hits?`The stone guardian's fist connects${die===20?' with devastating force':''}. You take ${dmg} damage.`:dodged?'You weave out of the way. Your Dodge action made its attack less accurate.':'You step clear as the guardian’s stone fist crashes past you.',
  math:`Attack: ${a}${b===null?'':` and ${b} → ${die} (disadvantage)`} + 3 = ${total} vs your AC ${hero().ac} · ${hits?'HIT':'MISS'}`,
  type:hits?'hurt':'defended',number:hits?`−${dmg} HP`:'MISS',from:'hero',before,after:s.hp,
  next:s.hp<=0?'defeat':'player',
  teaching:'The Warden rolled a d20 against your Armor Class. Damage changes your Hit Points only on a hit.'
 });
}
function rollInitiative(){
 const c=s.combat;if(!c||c.phase!=='initiative')return;
 const p=rand(20),e=rand(20),playerBonus=Math.floor((hero().stats.DEX-10)/2);
 const playerTotal=p+playerBonus,enemyTotal=e+1,first=playerTotal>=enemyTotal;
 c.initiative={p,e,playerBonus,playerTotal,enemyTotal,first};
 clog(`Initiative: you rolled ${p} ${signed(playerBonus)} = ${playerTotal}; Warden rolled ${e} +1 = ${enemyTotal}. ${first?'You act first.':'The Warden acts first.'}`);
 combatResult({title:first?'You act first!':'The Warden acts first!',story:first?'You react faster than the guardian. Choose your opening move.':'The guardian is faster. See what it does before choosing your move.',math:`You: ${p} ${signed(playerBonus)} = ${playerTotal} · Warden: ${e} +1 = ${enemyTotal}`,type:first?'defended':'neutral',number:first?'FIRST':'SECOND',next:first?'player':'enemy',teaching:'Initiative decides turn order. Your initiative modifier comes from Dexterity.'});
}
function finishCombatVictory(){
 s.combat=null;s.flags.victory=true;s.stage='reveal';
 outcome('The enchantment shatters','The Echo Warden collapses into harmless dust. Its last words are barely audible: “Keep the light alive.”',true);s.storyResult=null;commit();
}
function finishCombatDefeat(){
 s.flags.defeatSource='combat';s.stage='defeat';s.combat=null;
 outcome('You fall to the ground','Your HP have reached 0. In a normal D&D game, this usually means unconsciousness and death saving throws. For this tutorial, you can retry the encounter from a safe checkpoint.',false);s.storyResult=null;commit();
}
function advanceCombat() {
 const c=s.combat;if(!c||c.phase!=='result')return;
 const next=c.next;c.result=null;c.next=null;
 if(next==='victory'){finishCombatVictory();return;}
 if(next==='defeat'){finishCombatDefeat();return;}
 if(next==='enemy'){
  if(c.hidden){
   clog('The Warden searches the fallen crates but cannot find you.');
   combatResult({title:'The Warden cannot find you',story:'The guardian swings blindly at the shadows. Your hiding place holds, and you remain unseen.',type:'defended',number:'SAFE',next:'player',teaching:'Your successful Hide check makes the Warden lose track of you. Your next attack can gain advantage.'});
  }else enemyAttack();
  return;
 }
 if(next==='player'){
  // Begin a new round after the enemy reaction, not after a healing bonus action.
  if(c.resultRoundDone){c.round++;c.bonusUsed=false;c.resultRoundDone=false;}
  c.phase='player';commitCombat();return;
 }
 if(next==='bonus'){c.phase='player';commitCombat();return;}
}
function useBonus(kind) {
 const c=s.combat;if(!c||c.phase!=='player'||c.bonusUsed)return;
 if(kind==='potion' && s.potions>0 && s.hp<maxHp()){
  const r1=rand(4),r2=rand(4),n=r1+r2+2,old=s.hp;
  s.hp=clamp(s.hp+n,0,maxHp());s.potions--;c.bonusUsed=true;
  clog(`Bonus Action — Healing Potion: 2d4 + 2 = ${r1} + ${r2} + 2 = ${n}; HP ${old} → ${s.hp}. You still have your action.`);
  combatResult({title:'Your potion restores health',story:`You recover ${s.hp-old} HP and still have your main action this turn.`,math:`Healing: ${r1} + ${r2} + 2 = ${n} (capped at ${maxHp()} maximum HP)`,type:'heal',number:`+${s.hp-old} HP`,from:'hero',before:old,after:s.hp,next:'bonus',teaching:'Under the 2024 rules, a Potion of Healing uses a Bonus Action.'});
 }
 if(kind==='secondWind' && s.classId==='fighter'&&s.secondWind>0 && s.hp<maxHp()){
  const n=rand(10)+(s.level||1),old=s.hp;s.hp=clamp(s.hp+n,0,maxHp());c.secondWindUsed=true;s.secondWind--;c.bonusUsed=true;
  clog(`Bonus Action — Second Wind: 1d10 + ${s.level||1} = ${n}; HP ${old} → ${s.hp}. You still have your action.`);
  combatResult({title:'You catch your second wind',story:`You steady yourself and regain ${s.hp-old} HP. You still have your main action.`,math:`Second Wind: 1d10 + ${s.level||1} = ${n} (capped at ${maxHp()} HP)`,type:'heal',number:`+${s.hp-old} HP`,from:'hero',before:old,after:s.hp,next:'bonus',teaching:'Second Wind is a Fighter feature that restores HP without consuming your Action.'});
 }
}
function combatAction(kind) {
 const c=s.combat;if(!c||c.phase!=='player')return;
 if(kind==='flee'){s.actionCue={label:'Disengage and escape',fromStage:'combat',hpBefore:s.hp};s.combat=null;s.stage='ending';s.ending='escape';outcome('A tactical retreat','You take the Disengage action and escape the chamber without provoking an opportunity attack. The lantern remains beneath the tavern.');commit();return;}
 if(kind==='dodge'){
  c.dodging=true;c.resultRoundDone=true;
  clog('You take the Dodge action. The Warden has disadvantage on its next attack against you.');
  combatResult({title:'You brace for the attack',story:'You shift your weight, ready to evade the Warden. Its next attack will use disadvantage.',type:'defended',number:'DODGE',next:'enemy',teaching:'Dodge uses your Action. The Warden will roll two d20s and keep the lower one.'});return;
 }
 if(kind==='hide'&&s.classId==='rogue') {
  const die=rand(20),total=die+hero().skills.stealth,success=total>=15;c.hidden=success;c.resultRoundDone=true;
  clog(`Hide: ${die} + ${hero().skills.stealth} = ${total} vs DC 15. ${success?'You disappear behind the crates. Your next attack can have advantage.':'The Warden spots you.'}`);
  combatResult({title:success?'You vanish into the shadows':'The Warden spots you',story:success?'You slip behind the fallen crates. The guardian loses sight of you.':'A loose stone shifts underfoot; the guardian tracks your movement.',math:`Stealth: ${die} + ${hero().skills.stealth} = ${total} vs DC 15`,type:success?'defended':'neutral',number:success?'HIDDEN':'SPOTTED',next:'enemy',teaching:'Hiding uses your Action here. If the guardian loses you, your next attack can have advantage.'});return;
 }
 if(kind==='missile'&&s.classId==='wizard'&&s.slots>0){
  const before=c.enemyHp,rolls=[rand(4)+1,rand(4)+1,rand(4)+1],damage=rolls.reduce((a,b)=>a+b,0);s.slots--;
  c.enemyHp=Math.max(0,c.enemyHp-damage);c.hidden=false;c.resultRoundDone=true;
  clog(`Magic Missile (1 spell slot): three darts hit automatically for ${rolls.join(' + ')} = ${damage} force damage.`);
  combatResult({title:c.enemyHp===0?'Your magic breaks the Warden!':'Three bolts strike the Warden!',story:`Three glowing darts slam into the stone guardian, dealing ${damage} force damage.`,math:`Magic Missile: ${rolls.join(' + ')} = ${damage} · 1 spell slot used`,type:'damage',number:`−${damage} HP`,from:'enemy',before,after:c.enemyHp,next:c.enemyHp===0?'victory':'enemy',teaching:'Magic Missile hits automatically. It consumes one level-1 spell slot and does not require an attack roll.'});return;
 }
 if(kind==='attack') {
  const before=c.enemyHp;
  const extraAdv=c.firstAdv||c.hidden,p=rand(20),q=extraAdv?rand(20):null,die=q===null?p:Math.max(p,q),critical=die===20,hit=critical||(die!==1&&die+hero().attack>=c.enemyAc);
  const damageDice=hit?[rand(hero().damageDie)]:[];
  if(hit&&critical)damageDice.push(rand(hero().damageDie));
  let sneak=[];
  if(hit&&s.classId==='rogue'&&(extraAdv||c.allyAdjacent)){sneak=[rand(6)];if(critical)sneak.push(rand(6));}
  const dmg=hit?damageDice.reduce((a,b)=>a+b,0)+hero().damageMod+sneak.reduce((a,b)=>a+b,0):0;
  c.enemyHp=Math.max(0,c.enemyHp-dmg);
  const math=`Attack: ${p}${q===null?'':` / ${q} → ${die} (advantage)`} ${signed(hero().attack)} = ${die+hero().attack} vs AC ${c.enemyAc} · ${hit?'HIT':'MISS'}${hit?` · Damage: ${damageDice.join(' + ')} ${hero().damageMod?signed(hero().damageMod):''}${sneak.length?` + Sneak Attack ${sneak.join(' + ')}`:''} = ${dmg}`:''}`;
  clog(`${hero().attackName}: ${math}${critical?' CRITICAL HIT!':''}`);
  c.hidden=false;c.firstAdv=false;c.resultRoundDone=true;
  combatResult({title:hit?(critical?'Critical hit!':c.enemyHp===0?'The Warden is defeated!':'You hit the Warden!'):'Your attack misses',story:hit?`${hero().attackName} ${s.classId==='wizard'?'erupts against':'strikes'} the stone guardian for ${dmg} damage${critical?' — a devastating critical hit!':'.'}`:'The guardian turns just in time. Your blow glances harmlessly off its armor.',math,type:hit?'damage':'neutral',number:hit?`−${dmg} HP`:'MISS',from:'enemy',before,after:c.enemyHp,next:c.enemyHp===0?'victory':'enemy',teaching:critical?'A natural 20 is a critical hit: roll your damage dice twice.':hit?'Your d20 + attack bonus met or exceeded the Warden’s AC. Roll damage only after a hit.':'Attacks miss when their result is below Armor Class (or the d20 shows a natural 1).'});return;
 }
}
function art(stage) { if(CAMPAIGN_ART[stage])return CAMPAIGN_ART[stage]; return stage==='tavern'||stage==='tavernHub'||stage==='stranger'||stage==='keeper'||stage==='door'?'tavern':stage==='passage'||stage==='passageChoice'?'passage':'vault'; }
function chapter(stage){if(CAMPAIGN_CHAPTER[stage])return CAMPAIGN_CHAPTER[stage];return ['tavern','tavernHub','stranger','keeper','door'].includes(stage)?1:['passage','passageChoice'].includes(stage)?2:3;}
function choice(key,title,detail,icon='→',locked=false){return {key,title,detail,icon,locked};}
function scene() {
 if(CAMPAIGN_CHAPTER[s.stage])return campaignScene();
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
 return `<div class="welcome"><div class="welcome-hero"><div class="welcome-overlay"><div class="eyebrow">AN INTERACTIVE BEGINNER ADVENTURE <span class="dot"></span> VERSION 2.2</div><div class="ornament">✧ &nbsp; ◇ &nbsp; ✧</div><h1>Lantern <em>&</em> Key</h1><p class="welcome-subtitle">Your first steps into a world of dice, decisions, and dangerous doors.</p><div class="intro-tags"><span>◈ Solo adventure</span><span>♧ Learn as you play</span><span>◷ Eight chapters</span></div></div></div>
 <div class="welcome-content"><div class="section-top"><span class="tiny-index">01 / THE HERO</span><h2>Who walks into the tavern?</h2><p>Start with a ready-to-play level 1 character. The mechanics are simplified to teach the essentials without a long setup.</p></div>
 <div class="class-grid">${Object.entries(CLASSES).map(([id,c],i)=>`<label class="class-card"><input type="radio" name="classChoice" value="${id}" ${i===0?'checked':''}/><div class="class-inner"><span class="class-icon">${c.icon}</span><span class="class-name">${c.name}</span><span class="class-tag">${c.tag}</span><span class="class-desc">${c.description}</span><span class="class-stats">${c.hp} HP <span>·</span> ${c.ac} AC</span><span class="class-select">Choose ${c.name} <span aria-hidden="true">↗</span></span></div></label>`).join('')}</div>
 <div class="name-row"><label for="heroName">CHARACTER NAME <span>(optional)</span></label><input id="heroName" maxlength="28" autocomplete="off" placeholder="Choose a name or use the default"/></div>
 <button class="primary big" data-act="begin">Begin your adventure <span>→</span></button><p class="fine-print">No account. No AI subscription. Progress saves on this device automatically.</p>
 <div class="welcome-footer"><span>HOW THIS WORKS</span><p>Choose actions, roll a virtual d20 when prompted, and discover why each rule matters. This is an original, guided teaching adventure—not a complete replacement for a tabletop Dungeon Master.</p><button class="inline-link" data-modal="rules">Browse the beginner rules ↗</button></div></div></div>`;
}
function renderSidebar() {
 const h=hero(); const c=s.combat;
 return `<aside class="sidebar"><div class="side-card character"><div class="side-head"><span class="small-caps">YOUR CHARACTER</span><span class="level-tag">LVL ${s.level||1}</span></div><div class="avatar">${h.icon}</div><h3>${esc(s.heroName)}</h3><p class="side-class">${h.name} <span>·</span> Adventurer</p><div class="health-row"><div class="health-heading"><span>HIT POINTS</span><strong>${s.hp} / ${maxHp()}</strong></div><div class="health-track"><span style="width:${100*s.hp/maxHp()}%"></span></div></div><div class="stat-columns"><div><span class="stat-num">${h.ac}</span><span class="stat-label">ARMOR CLASS</span></div><div><span class="stat-num">${signed(h.attack)}</span><span class="stat-label">ATTACK BONUS</span></div><div><span class="stat-num">+2</span><span class="stat-label">PROFICIENCY</span></div></div><div class="sidebar-section"><div class="small-caps">ABILITY SCORES <span class="question" title="The modifier is what you usually add to a roll.">?</span></div><div class="abilities">${Object.entries(h.stats).map(([key,score])=>`<div><span>${key}</span><strong>${score}</strong><small>${signed(Math.floor((score-10)/2))}</small></div>`).join('')}</div></div><div class="sidebar-section"><div class="small-caps">PACK & RESOURCES</div><div class="resource"><span>⚗ Healing potion</span><strong>× ${s.potions}</strong></div>${s.classId==='wizard'?`<div class="resource"><span>✦ Spell slots (level 1)</span><strong>${s.slots} / ${s.level===2?3:2}</strong></div>`:''}<div class="resource"><span>${s.flags.key?'✧':'◇'} Silver wolf-key</span><strong>${s.flags.key?'Found':'—'}</strong></div>${s.classId==='fighter'?`<div class="resource"><span>✚ Second Wind</span><strong>${s.secondWind} / 2</strong></div>`:''}<div class="resource"><span>◈ Hit Dice</span><strong>${s.hitDice} / ${s.level||1}</strong></div></div><button class="side-action" data-modal="sheet">View full character sheet →</button><button class="side-action" data-modal="inventory">Open inventory →</button></div>
 <div class="side-card learning"><div class="small-caps">THE LEARNING PATH</div>${CHAPTER_NAMES.map((t,i)=>`<div class="learning-item ${(s.unlocked||1)>i?'completed':''}"><span>${(s.unlocked||1)>i?'✓':String(i+1).padStart(2,'0')}</span><p>${t}</p></div>`).join('')}<div class="side-divider"></div><button class="side-action" data-modal="chapters">Chapter checkpoints ↗</button><button class="side-action" data-modal="learn">Learning journal ↗</button><button class="side-action" data-modal="practice">Practice without risk ↗</button><button class="side-action" data-modal="rules">Quick rules reference ↗</button></div></aside>`;
}
function renderCheck() {
 const p=s.pending;
 return `<div class="check-card" aria-live="polite"><div class="check-heading"><span class="die-small">◈</span><div><span class="small-caps">THE DUNGEON MASTER CALLS FOR A ROLL</span><h3>${esc(p.name)}</h3></div></div><p>${esc(p.why)}</p><div class="roll-formula"><div><span>YOUR DIE</span><strong>d20</strong></div><b>+</b><div><span>YOUR BONUS</span><strong>${signed(p.bonus)}</strong></div><b>≥</b><div><span>TARGET DC</span><strong>${s.mode==='tabletop'?'?':p.dc}</strong></div></div>${p.mode!=='normal'?`<div class="mode-notice">${p.mode==='advantage'?'✦ Advantage: roll twice and keep the higher die.':'◇ Disadvantage: roll twice and keep the lower die.'} ${p.mode==='disadvantage'?'Heavy chain mail makes sneaking harder.':'The story has given you a favorable position.'}</div>`:''}<div class="dice-wrap"><div class="die20" aria-hidden="true"><span>20</span></div><button class="primary roll-btn" data-act="rollCheck">Roll ${p.mode==='normal'?'the d20':'two d20s'} <span>✧</span></button><span class="roll-hint">${s.mode==='tabletop'?'The DM reveals the DC after the roll.':p.mode==='normal'?`You need ${clamp(p.dc-p.bonus,1,21)} or higher on the die.`:'The chosen die gets your bonus added to it.'}</span></div><div class="teaching-inline"><span>✦ A LITTLE D&D KNOWLEDGE</span><p>For a check, add the listed bonus to the die. **Meeting** the DC is enough. A natural 20 does not automatically succeed on an ability check.</p></div></div>`;
}
function renderOutcome(){const o=s.outcome;if(!o)return '';const r=o.roll;return `<div class="outcome ${o.success===null?'neutral':o.success?'positive':'negative'}"><div class="outcome-line"><span>${o.success===null?'✧':o.success?'✓':'◇'} ${esc(o.title)}</span>${r?`<span class="result-pill">${r.success?'SUCCESS':'FAILURE'} · ${r.total} / ${r.dc}</span>`:''}</div><p>${fmt(o.body)}</p>${r?`<div class="outcome-math">${r.mode!=='normal'?`d20 ${r.die1} / ${r.die2} → ${r.die}`:`d20 ${r.die}`} &nbsp; ${signed(r.modifier)} &nbsp; = <strong>${r.total}</strong> &nbsp; vs DC ${r.dc}</div>`:''}</div>`;}
function renderCombat() {
 const c=s.combat;if(!c)return '';
 const heroPercent=clamp(100*s.hp/maxHp(),0,100),enemyPercent=clamp(100*c.enemyHp/c.enemyMax,0,100);
 const health=(side,label,name,hp,maximum,ac,percentage,meta)=>`<div class="combat-health ${side} ${percentage<=30?'critical':''}"><div class="combat-health-title"><span>${label}</span><strong>${esc(name)}</strong></div><div class="combat-health-numbers"><strong>${hp}<small> / ${maximum} HP</small></strong><span>AC ${ac}</span></div><div class="combat-health-track" role="progressbar" aria-label="${label} hit points" aria-valuemin="0" aria-valuemax="${maximum}" aria-valuenow="${hp}"><span style="width:${percentage}%"></span></div><div class="combat-health-caption">${esc(meta)}</div></div>`;
 const r=c.result;
 const result=r?`<div class="combat-result ${esc(r.type)}" role="status" aria-live="polite"><div class="combat-result-tag">✦ &nbsp; ACTION RESOLVED · ROUND ${c.round}</div><div class="combat-result-heading"><h3>${esc(r.title)}</h3><strong class="combat-result-number">${esc(r.number)}</strong></div><p class="combat-result-story">${esc(r.story)}</p>${r.from?`<div class="combat-result-hp">${r.from==='hero'?'YOUR HP':'WARDEN HP'} &nbsp; <b>${r.before}</b> <span>→</span> <strong>${r.after}</strong></div>`:''}${r.math?`<div class="combat-result-math">⚄ &nbsp; ${esc(r.math)}</div>`:''}<div class="combat-result-lesson"><strong>WHY?</strong> ${esc(r.teaching)}</div><button class="primary combat-continue" data-act="combatContinue">${c.next==='victory'?'See what happens next':c.next==='defeat'?'See what happens next':c.next==='enemy'?'Continue → Warden’s response':c.next==='bonus'?'Continue → Choose your action':c.next==='player'?'Continue → Your turn':'Continue → Start combat'} <span>→</span></button><p class="combat-result-hint">Your next action is paused until you continue.</p></div>`:'';
 return `<div class="combat-card"><div class="combat-phase-line"><span>⚔ &nbsp; BATTLE · ECHO WARDEN</span><strong>ROUND ${c.round}</strong></div><div class="combat-health-grid">${health('hero','YOUR CHARACTER',s.heroName,s.hp,maxHp(),hero().ac,heroPercent,`${hero().name}${c.hidden?' · Hidden':''}${c.dodging?' · Dodging':''}`)}${health('enemy','OPPONENT','Echo Warden',c.enemyHp,c.enemyMax,c.enemyAc,enemyPercent,c.enemyHp===0?'Defeated':c.enemyHp<=3?'Barely standing':'Stone guardian')}</div>${c.phase==='initiative'?`<div class="combat-initiative"><span class="your-turn">✦ INITIATIVE</span><h3>Who moves first?</h3><p>Roll a d20 and add your Dexterity modifier. The Warden will roll too.</p><button class="primary combat-continue" data-act="rollInitiative">Roll initiative <span>⚄</span></button></div>`:c.phase==='result'?result:`<div class="combat-turn"><span class="your-turn">● YOUR TURN</span><p>You have <strong>one main action</strong>. You may use one available Bonus Action first.</p><div class="combat-actions"><button class="move-btn" data-act="combat:attack"><span class="move-glyph">⚔</span><span><strong>Attack · ${esc(hero().attackName)}</strong><small>${signed(hero().attack)} to hit · ${s.classId==='wizard'?'1d10 fire':`1d${hero().damageDie} ${signed(hero().damageMod)} damage`}${c.hidden||c.firstAdv?' · advantage':''}</small></span><span class="move-arrow">→</span></button>${s.classId==='wizard'&&s.slots>0?`<button class="move-btn" data-act="combat:missile"><span class="move-glyph">✦</span><span><strong>Magic Missile</strong><small>Auto-hit · 3 × (1d4 + 1) · costs 1 slot</small></span><span class="move-arrow">→</span></button>`:''}${s.classId==='rogue'?`<button class="move-btn" data-act="combat:hide"><span class="move-glyph">↝</span><span><strong>Hide behind the crates</strong><small>Stealth DC 15 · set up advantage</small></span><span class="move-arrow">→</span></button>`:''}<button class="move-btn" data-act="combat:dodge"><span class="move-glyph">◇</span><span><strong>Dodge</strong><small>Warden attacks at disadvantage this round</small></span><span class="move-arrow">→</span></button><button class="move-btn" data-act="combat:flee"><span class="move-glyph">↶</span><span><strong>Disengage and escape</strong><small>Withdraw safely; leave the lantern behind</small></span><span class="move-arrow">→</span></button></div><div class="bonus-actions"><span class="small-caps">BONUS ACTIONS · ${c.bonusUsed?'USED THIS TURN':'OPTIONAL'}</span><div class="bonus-row">${s.potions>0?`<button ${c.bonusUsed||s.hp===maxHp()?'disabled':''} data-act="bonus:potion">⚗ Drink healing potion <small>2d4+2 HP</small></button>`:''}${s.classId==='fighter'&&s.secondWind>0?`<button ${c.bonusUsed||s.hp===maxHp()?'disabled':''} data-act="bonus:secondWind">✚ Second Wind <small>1d10+${s.level||1} HP</small></button>`:''}${s.potions===0&&(s.classId!=='fighter'||s.secondWind<=0)?'<span class="muted">No remaining Bonus Actions available.</span>':''}</div></div></div>`}<details class="combat-history"><summary>Previous dice rolls & combat events (${c.log.length})</summary><div class="combat-log">${c.log.slice(0,20).map((t,i)=>`<div class="combat-log-entry ${i===0?'latest':''}">${esc(t)}</div>`).join('')}</div></details></div>`;
}
function renderStoryResult() {
 const r=s.storyResult;
 if(!r)return '';
 const stage=TITLES[r.fromStage]?r.fromStage:'tavern';
 const label=TITLES[stage];
 const roll=r.roll;
 const hpChange=Number(r.hpAfter)-Number(r.hpBefore);
 const outcomeType=r.success===null?'neutral':r.success?'positive':'negative';
 return `<section class="story-screen story-pause" aria-label="Your action result">
  <div class="chapter-strip"><span>CHAPTER ${String(chapter(stage)).padStart(2,'0')}</span><div class="chapter-progress">${chapterTicks(stage)}</div><span>${esc(label)}</span></div>
  <div class="story-pause-art"><img src="assets/${art(stage)}.svg" alt="A scene from the current chapter"/></div>
  <div class="story-pause-inner"><span class="story-pause-eyebrow">✦ &nbsp; YOUR LAST ACTION</span><h2>${esc(r.action)}</h2>
   <div class="story-pause-result ${outcomeType}" role="status">
    <div class="story-pause-status"><span>THE RESULT</span>${roll?`<strong class="story-pause-pill ${roll.success?'passed':'failed'}">${roll.success?'✓ SUCCESS':'◇ FAILED CHECK'}</strong>`:r.success!==null?`<strong class="story-pause-pill ${r.success?'passed':'failed'}">${r.success?'✓ SUCCESS':'◇ CONSEQUENCE'}</strong>`:'<strong class="story-pause-pill">STORY CHOICE</strong>'}</div>
    <h3>${esc(r.title)}</h3><p>${fmt(r.body)}</p>
    ${roll?`<div class="story-pause-dice"><span>${esc(roll.name)}</span><strong>${roll.mode!=='normal'?`${roll.die1} / ${roll.die2} → ${roll.die}`:`${roll.die}`} ${signed(roll.modifier)}${roll.tacticalMind?` + Tactical Mind ${roll.tacticalMind}`:''} = ${roll.total}</strong><small>Target DC ${roll.dc}${roll.mode!=='normal'?` · ${roll.mode}`:''}</small></div>`:''}
    ${hpChange?`<div class="story-pause-hp"><span>♥ YOUR HP</span><strong>${r.hpBefore} → ${r.hpAfter} / ${maxHp()}</strong><b class="${hpChange<0?'hurt':'heal'}">${hpChange>0?'+':''}${hpChange} HP</b></div>`:''}
   </div>
   ${s.restSession?`<div class="rest-controls"><strong>Short Rest · ${s.hitDice} Hit Dice left</strong><p>HP ${s.hp}/${maxHp()}. ${s.restSession.spent} dice spent this rest.</p><button class="secondary" data-act="rest:spend" ${s.hitDice<=0||s.hp>=maxHp()?'disabled':''}>⚄ Spend another Hit Die</button><button class="secondary" data-act="rest:finish">Finish resting →</button></div>`:''}<button class="primary story-pause-next" data-act="continueStory" ${s.restSession?'disabled':''}>${s.stage==='ending'?'See your adventure ending':s.stage==='defeat'?'See what happens next':s.stage==='combat'?'Continue to combat':'Continue the story'} <span>→</span></button>
   <p class="story-pause-footnote">The next scene is paused until you continue.</p>
  </div>
 </section>`;
}
function renderScene() {
 if(s.mindOffer)return renderMindOffer();
 if(s.storyResult)return renderStoryResult();
 if(s.stage==='crossingBattle')return renderTactics();
 if(s.finalTest?.active)return renderBeaconTest();

 const v=scene();const isSpecial=['ending','defeat'].includes(s.stage);
 if(isSpecial)return renderEnding();
 if(s.stage==='combat')return `<section class="story-screen battle-screen"><div class="chapter-strip"><span>CHAPTER 03</span><div class="chapter-progress"><i class="lit"></i><i class="lit"></i><i class="lit"></i></div><span>THE CHAMBER OF ECHOES</span></div><div class="combat-banner"><span>✦ THE CHAMBER OF ECHOES</span><h2>The Echo Warden awakens</h2><p>Stone grinds against stone. The guardian raises its fists.</p></div><div class="combat-body">${renderCombat()}</div></section>`;
 return `<section class="story-screen"><div class="chapter-strip"><span>CHAPTER ${String(v.chapter).padStart(2,'0')}</span><div class="chapter-progress">${chapterTicks(s.stage)}</div><span>${v.label}</span></div><div class="story-art"><img src="assets/${art(s.stage)}.svg" alt="${({tavern:'A candlelit tavern with a mysterious traveler',passage:'An ancient stone passage',vault:'A blue-glowing underground sanctuary',forest:'A campfire in a moonlit forest',crossing:'An old ruined stone bridge',village:'A lively medieval village market',arcane:'An enchanted library with arcane glyphs',summit:'Adventurers overlooking distant mountains'})[art(s.stage)]||'Fantasy adventure scene'}"/><span class="art-corner">✧ AN ORIGINAL ADVENTURE</span></div><div class="story-body"><span class="tiny-index">${esc(v.label)}</span><h2>${esc(v.heading)}</h2><div class="prose">${v.text.map(p=>`<p>${fmt(p)}</p>`).join('')}</div>${renderOutcome()}${s.pending?renderCheck():s.stage==='combat'?renderCombat():`<div class="choice-panel"><div class="choice-label"><span>WHAT DO YOU DO?</span><small>There is no wrong way to be curious.</small></div><div class="choice-list">${v.choices.filter(Boolean).map((c,i)=>`<button class="choice-btn" data-act="${c.key}" ${c.locked?'disabled':''}><span class="choice-icon">${c.icon}</span><span class="choice-description"><strong>${esc(c.title)}</strong><small>${s.mode==='tabletop'?esc(c.detail.replace(/ · (?:[^·]*?(?:DC|check|advantage|saving throw)[^·]*)/gi,'').replace(/DC \d+/g,'').trim()):esc(c.detail)}</small></span><span class="choice-chevron">↗</span></button>`).join('')}</div></div>${s.mode==='guided'?`<div class="lesson"><div>✦ &nbsp; DM'S NOTE</div><p>${esc(v.lesson||'Your decisions can change the outcome.')}</p></div>`:''}`}</div></section>`;
}
function renderEnding(){const won=s.stage==='ending';const escape=s.ending==='escape';const total=s.checks.length;const successes=s.checks.filter(x=>x.success).length;
 return `<div class="end-screen"><div class="end-art"><img src="assets/vault.svg" alt="A mystical vault with a glowing lantern"/><div class="end-seal">${won&&!escape?'✦':'◇'}</div></div><div class="end-content"><span class="tiny-index">${won?'ADVENTURE COMPLETE':'CHECKPOINT REACHED'}</span><h2>${won?'Your story is just beginning':'Every hero has setbacks'}</h2>${renderOutcome()}<p class="end-main">${won?(escape?'You learned that a retreat is a meaningful choice too. There will be other adventures.':'The tavern slowly returns to silence, but you leave knowing that your choices changed the world, even in a small way.'):'You can safely try the final encounter again. D&D is not about perfection; it is about discovering a story together.'}</p><div class="end-stats"><div><strong>${total}</strong><span>CHECKS MADE</span></div><div><strong>${successes}</strong><span>CHECKS PASSED</span></div><div><strong>${s.journal.filter(x=>x.kind==='combat').length}</strong><span>COMBAT EVENTS</span></div></div>${won?`<div class="next-chapter"><span>✧ &nbsp; WHAT YOU LEARNED</span><p>Exploration, skill checks, difficulty classes, roleplaying, ${s.flags.trapPassed?'saving throws, ':''}${s.flags.victory?'combat, ':''}and how different choices lead to different outcomes.</p></div>`:''}<div class="end-buttons">${!won?`<button class="primary" data-act="retryFight">${s.flags.defeatSource==='trap'?'Retry from the corridor':'Retry encounter with a hint'} <span>↻</span></button>`:''}${won?`<button class="primary" data-act="enterForest">Continue to Chapter 4 — Blackwood <span>→</span></button>`:''}<button class="${won?'secondary':'secondary'}" data-act="restart">Start a new adventure <span>→</span></button><button class="secondary" data-modal="journal">Read your adventure journal</button></div></div></div>`;
}
function renderSheet(){
 const h=hero(),lvl=s.level||1;
 const classFeatures=s.classId==='fighter'
  ?`<div class="resource"><span>Second Wind</span><strong>${s.secondWind} / 2</strong></div>${lvl===2?`<div class="resource"><span>Action Surge</span><strong>${s.actionSurge} / 1</strong></div><p>Level 2: Tactical Mind may turn a failed ability check into success.</p>`:''}<p>Level 1: Fighting Style (preset) and Second Wind. Weapon Mastery is not fully simulated in this tutorial.</p>`
  :s.classId==='rogue'
  ?`<p>Sneak Attack: +1d6 once per turn with a qualifying Finesse attack when you have advantage or the target is distracted by your ally.</p><p>Expertise: Stealth and Sleight of Hand in this preset build.${lvl===2?' Cunning Action: Dash, Disengage or Hide as a Bonus Action.':''}</p>`
  :`<div class="resource"><span>Level-1 spell slots</span><strong>${s.slots} / ${lvl===2?3:2}</strong></div><p>Cantrips cost no spell slots. Arcane Recovery is available once per Long Rest and after a Short Rest.${lvl===2?' Scholar Expertise: '+(s.scholarSkill?esc(s.scholarSkill):'choose Arcana or Investigation')+'.':''}</p>`;
 return `<div class="sheet"><div class="sheet-hero"><span class="sheet-icon">${h.icon}</span><div><strong>${esc(s.heroName)}</strong><p>Level ${lvl} ${h.name} · Training character</p></div></div><div class="sheet-tiles"><div>Hit Points <strong>${s.hp} / ${maxHp()}</strong></div><div>Armor Class <strong>${h.ac}</strong></div><div>Proficiency <strong>+2</strong></div><div>Initiative <strong>${signed(Math.floor((h.stats.DEX-10)/2))}</strong></div><div>Hit Dice <strong>${s.hitDice} / ${lvl}</strong></div><div>Healing potions <strong>${s.potions}</strong></div></div><h4>Ability scores</h4><div class="sheet-abilities">${Object.entries(h.stats).map(([key,n])=>`<div><span>${key}</span><strong>${n}</strong><small>${signed(Math.floor((n-10)/2))}</small></div>`).join('')}</div><h4>Skills used in this adventure</h4><div class="sheet-skills">${Object.entries(h.skills).map(([key])=>`<div><span>${key==='sleight'?'Sleight of Hand':key.charAt(0).toUpperCase()+key.slice(1)}</span><strong>${signed(skillBonus(key))}${lvl===2&&s.classId==='wizard'&&s.scholarSkill===key?' ★':''}</strong></div>`).join('')}</div><h4>Class features and remaining resources</h4><div class="sheet-features">${classFeatures}</div><p class="muted">These are curated level 1–2 practice builds with selected class features, not complete SRD character sheets. Listed skill bonuses already include proficiency or Expertise where applicable.</p></div>`;
}
function renderModal(){if(!modal)return '';let title,content;
 if(modal==='rules'){title='A pocket rulebook';content=`<p class="modal-lead">The essentials you'll use on this adventure. Tap a topic to expand.</p><div class="glossary">${GLOSSARY.map(([name,text],i)=>`<details ${i===1?'open':''}><summary>${esc(name)}</summary><p>${esc(text)}</p></details>`).join('')}</div><div class="attribution">Based on portions of the <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">System Reference Document 5.2.1</a> by Wizards of the Coast, available under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Rules simplified/adapted for teaching. Not affiliated with or endorsed by Wizards of the Coast.</div>`;}
 else if(modal==='sheet'){title='Character sheet';content=renderSheet();}
 else if(modal==='journal'){title='Adventure journal';content=`<p class="modal-lead">A record of your choices and dice rolls, kept locally on this device.</p><div class="journal-items">${s.journal.length?s.journal.map(entry=>`<div class="journal-entry ${esc(entry.kind)}"><span>✧</span><p>${esc(entry.text)}</p></div>`).reverse().join(''):'<p class="muted">Your journal will fill as you play.</p>'}</div>`;}
 else if(modal==='chapters'){title='Chapter checkpoints';content=renderChapters();}
 else if(modal==='learn'){title='Learning journal';content=renderLearning();}
 else if(modal==='inventory'){title='Equipment & inventory';content=renderInventory();}
 else if(modal==='practice'){title='Practice arena';content=renderPractice();}
 else if(modal==='settings'){title='Save & settings';content=`<p class="modal-lead">Your progress is saved automatically in this browser. No account or server is involved.</p>${installPanel()}<div class="mode-setting"><strong>Teaching mode</strong><p>Guided shows rules and target numbers before choices. Tabletop hides advance hints, but explains dice results afterward.</p><button class="${s.mode==='guided'?'chosen-mode':''}" data-act="mode:guided">Guided</button><button class="${s.mode==='tabletop'?'chosen-mode':''}" data-act="mode:tabletop">Tabletop</button></div><div class="settings-actions"><button data-act="export">↓ Export save as JSON</button><button data-act="import">↑ Import save from JSON</button><button data-act="restorePreImport" ${localStorage.getItem(PREIMPORT_KEY)?'':'disabled'}>↶ Restore pre-import backup</button><input id="importFile" type="file" accept=".json,application/json" hidden/><button class="danger" data-act="restart">↻ Erase save and start over</button></div><div class="attribution"><strong>Offline play:</strong> After your first successful visit via HTTPS, this app can work offline on supported browsers. Updates are never applied while you are editing or playing without choosing to reload.<br/><br/>Rules adapted from <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">SRD 5.2.1</a> (Wizards of the Coast, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>); original adventure and code. Not an official D&D product.</div>`;}
 return `<div class="modal-backdrop" data-act="closeModalBackdrop"><div role="${s.classId&&s.stage!=='welcome'?'region':'dialog'}" ${s.classId&&s.stage!=='welcome'?'':'aria-modal="true"'} aria-label="${esc(title)}" class="modal"><div class="modal-heading"><div><span class="small-caps">LANTERN & KEY</span><h2>${esc(title)}</h2></div><button class="modal-back-button" data-act="closeModal" aria-label="${s.stage==='welcome'?'Close dialog':'Return to the story'}">← <span>${s.stage==='welcome'?'Close':'Story'}</span></button></div><div class="modal-content">${content}</div></div></div>`;}
const ADVENTURE_NAV = [
 ['story','◈','Story'], ['sheet','♜','Character'], ['inventory','♢','Pack'],
 ['learn','✦','Lessons'], ['chapters','▤','Chapters'],
 ['practice','⚔','Practice'], ['journal','☷','Journal'], ['rules','?','Rules']
];
function renderAdventureNav(){
 const active=ADVENTURE_NAV.some(([id])=>id===modal)?modal:'story';
 return `<nav class="game-tool-nav" aria-label="Adventure tabs">${ADVENTURE_NAV.map(([id,icon,label])=>`<button type="button" class="game-tool ${id===active?'current':''}" ${id==='story'?'data-act="backStory"':`data-modal="${id}"`} ${id===active?'aria-current="page"':''} aria-label="${label}" title="${label}"><span class="game-tool-icon" aria-hidden="true">${icon}</span><span class="game-tool-label">${label}</span></button>`).join('')}</nav>`;
}
function render(){
 const playing=Boolean(s.classId&&s.stage!=='welcome');
 app.innerHTML=`<header class="app-header"><div class="header-inside"><button class="brand" data-act="home" aria-label="Return to the adventure"><span class="brand-logo">✧</span><span>LANTERN <em>&</em> KEY</span></button><div class="header-actions">${playing?`<span class="header-hp" aria-label="Your current health is ${s.hp} of ${maxHp()} hit points">♥ <b>${s.hp}</b> / ${maxHp()} HP</span>`:`<button class="header-rules" data-modal="rules">? Rules</button>`}<button class="settings-button" data-modal="settings" aria-label="Open settings"><span aria-hidden="true">⚙</span><span>Settings</span></button></div></div></header>${playing?renderAdventureNav():''}<div class="shell ${playing?'playing':''}">${playing?`<div class="game-layout"><main class="game-main">${renderScene()}</main>${renderSidebar()}</div>`:renderWelcome()}</div><footer class="site-footer ${playing?'playing-footer':''}"><span>✧ LANTERN & KEY</span><span>An independent tabletop-fantasy learning adventure · v2.3.2</span><button data-modal="rules">Rules & attribution ↗</button></footer>${renderModal()}${loadIssue?recoveryView():''}${updateWorker?`<div class="update-banner"><span>A new version is ready. Your progress is saved.</span><button data-act="applyUpdate">Update when ready →</button><button data-act="dismissUpdate" aria-label="Dismiss update">×</button></div>`:''}`;
}
function restart(){if(s.replay){if(!confirm('Discard this replay and return to your original campaign?'))return;return returnToMain();}if(!confirm('Start a new adventure? Your current progress will be replaced. Export a backup first if you want to keep it.'))return;s=initialSave();modal=null;commit();}
function returnToMain(){try{const main=localStorage.getItem(SAVE_KEY);if(!main)throw Error('No main campaign save found.');const original=upgradeSave(validateSave(JSON.parse(main)));localStorage.removeItem(REPLAY_KEY);s=original;modal=null;commit();}catch(e){alert('Unable to restore the main campaign: '+e.message);}}

function exportSave(){rawSaveDownload(JSON.stringify(s,null,2),s.replay?'lantern-and-key-replay.json':'lantern-and-key-save.json');}
async function importSave(file){
 if(!file)return;
 try{
  if(file.size>1500000)throw Error('Save exceeds the 1.5 MB import limit.');
  const obj=validateSave(JSON.parse(await file.text()));
  const incoming=upgradeSave(obj);
  if(!confirm('Replace the current campaign save with this imported game? The existing save will be backed up first.'))return;
  // Import always replaces the MAIN campaign, even if a chapter replay is on screen.
  // Back up the actual main slot, never the temporary replay in `s`.
  const mainBeforeImport=localStorage.getItem(SAVE_KEY);
  const backup=mainBeforeImport??JSON.stringify({...s,replay:null});
  try{localStorage.setItem(PREIMPORT_KEY,backup);}catch(err){throw Error('Could not create a pre-import backup. Free browser storage and retry.');}
  s=incoming;delete s.replay;localStorage.removeItem(REPLAY_KEY);loadIssue='';modal=null;commit();
 }catch(e){alert('Import rejected safely: '+e.message);}
}

app.addEventListener('click',event=>{
 const button=event.target.closest('[data-act],[data-modal]');if(!button)return;
 const action=button.dataset.act;
 if(button.dataset.modal){modal=button.dataset.modal;render();return;}
 if(!action)return;
 if(action==='recover:backup'){restoreRecovery();return;}
 if(action==='recover:export'){rawSaveDownload(localStorage.getItem(REPLAY_KEY)||localStorage.getItem(SAVE_KEY)||'{}','lantern-and-key-damaged-save.json');return;}
 if(action==='recover:reset'){if(confirm('Discard the damaged local save and start over? Download it first if needed.')){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(REPLAY_KEY);loadIssue='';s=initialSave();commit();}return;}
 if(loadIssue)return;
 if(action==='returnMain'){returnToMain();return;}
 if(action==='restorePreImport'){restorePreImport();return;}
 if(action==='closeModal'){modal=null;render();return;}
 if(action==='closeModalBackdrop'){if(event.target===button){modal=null;render();}return;}
 if(action==='begin')begin();
 else if(action==='home'){modal=null;render();window.scrollTo({top:0,behavior:'smooth'});}
 else if(action==='backStory'){modal=null;render();}
 else if(action==='rollCheck')rollCheck();
 else if(action==='rollInitiative')rollInitiative();
 else if(action==='combatContinue')advanceCombat();
 else if(action==='continueStory')continueStory();
 else if(campaignEvent(action))return;
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
// v2 guided campaign: all chapters share the legacy save key and paused result UI.
const CHAPTER_NAMES=['Exploration & checks','Hazards & saving throws','Dialogue & combat','Resting & recovery','Movement & positioning','Roleplaying & evidence','Magic & concentration','Leveling up'];
const CAMPAIGN_CHAPTER={forest:4,camp:4,trail:4,crossing:5,crossingBattle:5,crossingAfter:5,village:6,market:6,witness:6,council:6,trial:7,archive:7,altar:7,ascent:8,levelup:8,beaconTest:8,epilogue:8};
const CAMPAIGN_ART={forest:'forest',camp:'forest',trail:'forest',crossing:'crossing',crossingBattle:'crossing',crossingAfter:'crossing',village:'village',market:'village',witness:'village',council:'village',trial:'arcane',archive:'arcane',altar:'arcane',ascent:'summit',levelup:'summit',beaconTest:'summit',epilogue:'summit'};
const CHAPTER_START={1:'tavern',2:'passage',3:'vault',4:'forest',5:'crossing',6:'village',7:'trial',8:'ascent'};
const LESSONS={
 checks:['Ability checks','A skill check is a d20 plus the applicable ability and proficiency modifier, compared against a DM-set DC. Natural 20s do not automatically succeed on ordinary ability checks.'],
 advantage:['Advantage & disadvantage','Roll two d20s and use the higher (advantage) or lower (disadvantage). They cancel rather than stacking.'],
 saves:['Saving throws','Saving throws let characters resist incoming hazards, spells, and harmful effects. The relevant ability depends on the threat.'],
 combat:['Initiative & combat','Initiative orders turns. Each turn normally gives movement, an Action, one Bonus Action when available, and one Reaction when triggered.'],
 sneak:['Sneak Attack','Once per turn, a Rogue can add 1d6 damage on a qualifying Finesse or Ranged attack when they have advantage or a non-incapacitated ally is within 5 feet of the target without disadvantage. Being hidden is not required.'],
 rests:['Short and long rests','A Short Rest lasts an hour and can expend Hit Point Dice; a Long Rest usually takes 8 hours, restores HP and spent Hit Point Dice, and recharges many abilities. Both can be interrupted.'],
 resources:['Limited resources','Healing potions, Hit Point Dice, class features and spell slots have separate pools. Spending them now changes later options.'],
 movement:['Movement & tactical position','A creature may move up to its Speed (commonly 30 feet) on its turn, splitting movement before and after its Action. Difficult terrain costs extra movement.'],
 cover:['Cover','Half Cover gives +2 AC and Dexterity saves against effects originating across the cover. Three-quarters cover gives +5; Total Cover prevents direct targeting.'],
 reactions:['Reactions & opportunity attacks','A creature typically can take one Reaction until the start of its next turn. Leaving an enemy’s reach without Disengaging can provoke an opportunity attack.'],
 social:['Roleplaying & social checks','Choose approaches based on what a character wants and knows. Persuasion, Deception, and Intimidation have different consequences; Insight helps assess motives.'],
 evidence:['Information changes choices','Clues are useful even without rolls. A persuasive argument can work better when supported by evidence instead of demanding obedience.'],
 spells:['Spell attacks & saving throws','Some spells require the caster to roll against AC. Other spells require the target to roll a saving throw against spell save DC. These are different mechanics.'],
 slots:['Cantrips & spell slots','Cantrips can be cast without slots. Leveled spells usually expend a slot; a first-level Wizard has two level-1 slots, three at level 2.'],
 concentration:['Concentration','Only one concentration spell can be maintained at a time. When you take damage, make a Constitution saving throw: DC 10 or half the damage, whichever is higher.'],
 conditions:['Conditions','Conditions such as Prone, Restrained, and Frightened change what creatures can do. Effects say exactly when the condition ends.'],
 level:['Level 2 progression','On reaching level 2, each class gains more HP and class-specific abilities: Fighter Action Surge/Tactical Mind; Rogue Cunning Action; Wizard Scholar Expertise.'],
 inventory:['Inventory & equipment','Objects can offer alternatives to dice checks. Drinking a Potion of Healing is a Bonus Action in the 2024 rules; you can also use it outside combat.']
};

const QUIZZES={
 checks:['A skill check total equals its DC. What happens?','It succeeds','It fails',0],
 advantage:['You have advantage and disadvantage together. How many d20s do you roll?','One','Three',0],
 saves:['A spell asks for a Dexterity saving throw. Who rolls?','The affected target','The caster rolls against AC',0],
 combat:['Which normally uses your Action?','Dodge','Second Wind',0],
 sneak:['Does a Rogue always need to Hide to deal Sneak Attack?','No; other qualifying circumstances exist','Yes, always',0],
 rests:['Can you decide to spend another Hit Die after your first Short Rest roll?','Yes','No',0],
 resources:['Does Fire Bolt consume a level-1 spell slot?','No, it is a cantrip','Yes',0],
 movement:['How much movement does entering a difficult-terrain grid square cost?','10 feet','5 feet',0],
 cover:['How much AC does Half Cover usually add?','+2','+5',0],
 reactions:['What can trigger an opportunity attack?','Leaving an enemy’s reach without Disengaging','Moving closer to an enemy',0],
 social:['Can evidence change how an NPC reacts to persuasion?','Yes','Never',0],
 evidence:['Can an investigation succeed without a skill check?','Yes, some clues are simply discovered','No, every clue needs a roll',0],
 spells:['Who rolls when a spell requires its target to make a saving throw?','Target','Spellcaster',0],
 slots:['Which can be cast without spending a spell slot?','Cantrip','Magic Missile',0],
 concentration:['After taking 3 damage, what is the usual concentration save DC?','10','3',0],
 conditions:['Is being Prone identical to being Restrained?','No, each condition has different effects','Yes',0],
 level:['Can a level-2 Fighter Action Surge be used for a Magic action?','No','Yes',0],
 inventory:['When can a 2024 Potion of Healing be drunk in combat?','As a Bonus Action','Only after combat',0]
};
function initialSave(){return {version:1,stage:'welcome',flags:{},journal:[],checks:[],heroName:'',classId:null,hp:null,potions:1,slots:0,outcome:null,combat:null,ending:null,replay:null,mastery:{},quizFeedback:null,finalTest:null,restSession:null,level:1,hitDice:1,secondWind:2,arcaneRecovery:false,actionSurge:1,mode:'guided',inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:0},equipped:'primary',learned:{},checkpoints:{},unlocked:1,practice:null,tactics:null,storyResult:null};}
function upgradeSave(raw){
 const d=initialSave(),x={...d,...raw};
 x.flags=(raw.flags && typeof raw.flags==='object' && !Array.isArray(raw.flags))?raw.flags:{};
 x.mode=raw.mode==='tabletop'?'tabletop':'guided';x.level=raw.level===2?2:1;
 x.hitDice=clamp(Number.isFinite(raw.hitDice)?raw.hitDice:x.level,0,x.level);
 x.secondWind=clamp(Number.isFinite(raw.secondWind)?raw.secondWind:2,0,2);
 x.inventory={...d.inventory,...(raw.inventory||{})};
 for(const item of Object.keys(x.inventory))x.inventory[item]=clamp(Number(x.inventory[item])||0,0,20);
 // v2.3.1 and earlier stored the 'take' decision but never granted the lantern.
 // Repair those saves automatically, including imported JSON and chapter replays.
 // Respect an explicit lantern count in newer saves.
 if(raw.ending==='take' && raw.inventory?.lantern===undefined)x.inventory.lantern=1;
 x.inventory.lantern=clamp(x.inventory.lantern,0,1);
 x.learned=(raw.learned&&typeof raw.learned==='object'&&!Array.isArray(raw.learned))?raw.learned:{};x.mastery=(raw.mastery&&typeof raw.mastery==='object'&&!Array.isArray(raw.mastery))?raw.mastery:{};x.replay=(raw.replay&&typeof raw.replay==='object'&&!Array.isArray(raw.replay))?raw.replay:null;
 x.checkpoints=(raw.checkpoints&&typeof raw.checkpoints==='object'&&!Array.isArray(raw.checkpoints))?raw.checkpoints:{};
 x.unlocked=clamp(Number(raw.unlocked)|| (CAMPAIGN_CHAPTER[x.stage]||chapter(x.stage)),1,8);
 x.journal=Array.isArray(raw.journal)?raw.journal.slice(-120).map(e=>({text:String(e.text||'').slice(0,5000),kind:['story','roll','success','failure','combat'].includes(e.kind)?e.kind:'story',time:typeof e.time==='string'?e.time.slice(0,40):''})):[];
 x.checks=Array.isArray(raw.checks)?raw.checks.slice(-200):[];
 x.potions=clamp(Number(x.potions)||0,0,20);
 x.slots=clamp(Number(x.slots)||0,0,x.level===2?3:2);
 x.hp=Number.isFinite(raw.hp)?clamp(raw.hp,0,(CLASSES[x.classId]?.hp||0)+ (x.level-1)*({fighter:8,rogue:7,wizard:5}[x.classId]||0)):x.hp;
 x.actionCue=null;
 return x;
}
function learn(id){if(LESSONS[id]&&!s.learned[id])s.learned[id]=new Date().toISOString();}
function learnForCheck(key){learn('checks');if(key.includes('Save')||key==='trapSave'||key==='runTrap')learn('saves');if(key.includes('talk')||key.includes('Talk')||key.includes('Persuasion')||['keeperHelp','wardTalk','c:persuade','c:deceive'].includes(key))learn('social');}
function trackStage(){const ch=CAMPAIGN_CHAPTER[s.stage]||chapter(s.stage);s.unlocked=Math.max(s.unlocked||1,ch);if(ch<=3 && s.stage!=='welcome' && !s.checkpoints[ch]){s.checkpoints[ch]=JSON.parse(JSON.stringify({...s,checkpoints:{},storyResult:null,actionCue:null,practice:null}));}if(ch===2)learn('saves');if(ch===3)learn('combat');}
function chapterTicks(stage){return Array.from({length:8},(_,i)=>`<i class="${chapter(stage)>i?'lit':''}"></i>`).join('');}
function cue(label){s.actionCue={label,fromStage:s.stage,hpBefore:s.hp};}
function newChapter(stage,title,body){
 const idx=CAMPAIGN_CHAPTER[stage];
 s.stage=stage;s.pending=null;s.combat=null;s.outcome=null;s.tactics=null;
 s.unlocked=Math.max(s.unlocked||1,idx);
 if(!s.checkpoints[idx]){let snap=JSON.parse(JSON.stringify({...s,checkpoints:{},practice:null,storyResult:null,actionCue:null}));s.checkpoints[idx]=snap;}
 outcome(title,body);commit();
}
function moveScene(stage,title,body,success=null){s.stage=stage;outcome(title,body,success);commit();}
function usablePotion(){if(s.potions<=0||s.hp>=maxHp())return false;const before=s.hp,d=rand(4)+rand(4)+2;s.potions--;s.hp=clamp(s.hp+d,0,maxHp());learn('resources');learn('inventory');outcome('A little strength returns',`You drink a Potion of Healing: 2d4 + 2 = ${d}. Your HP changes from ${before} to ${s.hp}.`);return true;}
Object.assign(CHECKS,{
 'c:campShelter':{name:'Wisdom (Survival)',skill:'survival',dc:12,why:'Find a sheltered camp before sleeping.'},
 'c:forestScout':{name:'Wisdom (Perception)',skill:'perception',dc:12,why:'Spot signs of animals and a safe path.'},
 'c:bridgeInspect':{name:'Intelligence (Investigation)',skill:'investigation',dc:13,why:'Find the bridge’s safest footing.'},
 'c:bridgeParley':{name:'Charisma (Persuasion)',skill:'persuasion',dc:14,why:'Negotiate with the hostile toll keeper.'},
 'c:marketInsight':{name:'Wisdom (Insight)',skill:'insight',dc:12,why:'Decide whether the merchant is being truthful.'},
 'c:interview':{name:'Charisma (Persuasion)',skill:'persuasion',dc:12,why:'Earn the miller’s trust without threats.'},
 'c:mislead':{name:'Charisma (Deception)',skill:'deception',dc:13,why:'Bluff your way toward the truth, with future consequences.'},
 'c:confront':{name:'Charisma (Intimidation)',skill:'intimidation',dc:13,why:'Pressure the accused to answer.'},
 'c:council':{name:'Charisma (Persuasion)',skill:'persuasion',dc:14,why:'Make a persuasive case to the village council.'},
 'c:arcana':{name:'Intelligence (Arcana)',skill:'arcana',dc:13,why:'Identify the rune pattern and its associated spell.'},
 'c:focus':{name:'Constitution Saving Throw',skill:'consave',dc:10,why:'Maintain concentration after taking a magical shock.'},
 'c:final':{name:'Wisdom (Insight)',skill:'insight',dc:13,why:'Read the intentions of the figure at the mountain beacon.'}
});
// Ability and save modifiers are derived for campaign checks rather than assuming proficiency.
const originalSkillBonus=skillBonus;
// (skillBonus is declared above and resolves these added keys through the helper below.)
function campaignCheck(key,label){
 cue(label);startCheck(key);
 const p=s.pending;
 if(p){
  if(p.skill==='survival')p.bonus=Math.floor((hero().stats.WIS-10)/2);
  if(p.skill==='deception')p.bonus=Math.floor((hero().stats.CHA-10)/2);
  if(key==='c:council'&&s.flags.villageEvidence)p.mode='advantage';
  if(key==='c:interview'&&s.flags.marketTruth)p.mode='advantage';
  if(key==='c:final'&&s.flags.villageSolved)p.mode='advantage';
  commit();
 }
}
function campaignHandleCheck(key,success,roll){
 if(key==='retryFight'&&s.stage==='defeat'&&s.flags.defeatSource==='bridge'){s.hp=Math.max(1,Math.ceil(maxHp()/2));s.stage='crossing';s.tactics=null;cue('Try the bridge again');outcome('Another way across','You regain your footing at the bridge and can choose a safer path or face the sentry again.');commit();return true;}
 if(!key.startsWith('c:'))return false;
 const label=(x,y,positive=success)=>outcome(x,y,positive,roll);
 switch(key){
 case 'c:campShelter':s.flags.shelter=success;label(success?'A safe hollow':'Tracks around camp',success?'You locate a sheltered hollow, suitable for an uninterrupted Long Rest.':'You choose a clearing, but fresh wolf tracks reveal that a Long Rest here may be interrupted.');break;
 case 'c:forestScout':s.flags.trailSafe=success;s.stage='trail';label(success?'The forest reveals its path':'A twisted detour',success?'You follow deer tracks around the thickest thorn bushes. A broken crossing is visible through the pines.':'You find the bridge after a muddy detour. The detour costs one ration if you have one.');if(!success&&s.inventory.rations>0)s.inventory.rations--;break;
 case 'c:bridgeInspect':s.flags.bridgeSafe=success;label(success?'A stable line across':'Cracked stones everywhere',success?'A row of darker stones leads to a safe foothold across the bridge. The rocky bank also offers half cover.':'You cannot identify a safe crossing. You can still negotiate or fight for passage.');break;
 case 'c:bridgeParley':s.flags.bridgeParley=success;if(success){s.stage='crossingAfter';label('Terms of passage','The toll keeper lowers their bow when you offer to repair a broken signpost. They allow you across without a fight.');}else label('A refused bargain','“No more promises,” the toll keeper snaps, drawing their sword. You can defend yourself or attempt another route.');break;
 case 'c:marketInsight':s.flags.marketTruth=success;label(success?'An overlooked contradiction':'Difficult to tell',success?'The merchant’s account contradicts the miller’s delivery records. Someone altered the supply ledger.':'The merchant keeps a steady face; you do not yet know which story is true.');break;
 case 'c:interview':s.flags.millerTrust=success;if(success)s.flags.villageEvidence=true;label(success?'A witness comes forward':'A closed door',success?'The miller shows you a seal from the missing shipment: it bears the council treasurer’s crest.':'The miller hesitates to speak openly, but offers you a look at the delivery ledger if you return later.');break;
 case 'c:mislead':s.flags.bluffed=true;s.flags.villageEvidence=success||s.flags.villageEvidence;label(success?'Your bluff works':'The lie spreads',success?'The merchant believes your invented credentials and reveals a hidden invoice. It is a clue, though trust may suffer later.':'The merchant recognizes the bluff and warns others not to trust your account.');break;
 case 'c:confront':s.flags.intimidated=true;s.flags.villageEvidence=success||s.flags.villageEvidence;label(success?'A hasty confession':'A wary silence',success?'Under pressure, the treasurer admits diverting goods to the bridge guard. You have an admission, but villagers dislike the threat.':'The treasurer refuses to speak and the villagers become suspicious of your methods.');break;
 case 'c:council':s.flags.villageSolved=success||!!s.flags.villageEvidence;s.stage='trial';s.unlocked=Math.max(s.unlocked,7);if(!s.checkpoints[7])s.checkpoints[7]=JSON.parse(JSON.stringify({...s,checkpoints:{},storyResult:null,actionCue:null}));label(success?'A fair verdict':'The truth needs more work',success?'Your evidence convinces the council to restore the missing supplies and reconcile the bridge guard with the village.':'The council cannot accept all your claims. It agrees to investigate the ledger, and you leave with a lead to the old arcane school.');break;
 case 'c:arcana':s.flags.runesKnown=success;label(success?'You recognize the glyph':'An unfamiliar spell',success?'These runes are linked to an illusion and a ward. You can distinguish the spell’s attack from a saving throw.':'The glyph remains unfamiliar, but the instructor offers a demonstration.');break;
 case 'c:focus':{s.flags.focusHeld=success;label(success?'Your concentration holds':'Your concentration breaks',success?'You steady your breathing despite the pulse of force. Your single concentration effect remains active.':'The pulse distracts you. You lose concentration and the demonstration spell ends.');break;}
 case 'c:final':s.flags.finalInsight=success;s.stage='epilogue';label(success?'The pattern is clear':'No easy certainty',success?'You see that the guardian seeks a promise, not a fight, and remember the lantern’s first keeper.':'You cannot tell whether the guardian is friend or foe, but can still make a decision.');break;
 }
 return true;
}
function campaignScene(){
 const n=s.heroName, q=choice;
 switch(s.stage){
 case 'forest':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'The woods remember',text:[`The tavern is behind you, ${esc(n)}. ${s.inventory.lantern?'The enchanted lantern you kept casts a faint blue glow from your pack.':'Whatever became of the lantern, a blue spark follows the road into Blackwood.'}`,`Your wounds and supplies carry forward from the first adventure. Beyond the trees, wolves call to one another.`, 'A trail marker points to a campsite and a ruined crossing.'],lesson:'A resource spent now might not be available for the next encounter. Different classes replenish features at different times.',choices:[q('c:camp','Make camp','Explore resting, recovery and Hit Point Dice','☾'),q('c:forestScout','Scout the winding road','Perception DC 12 · find a safer route','◎'),q('c:forestPotion','Use a healing potion','Restore 2d4+2 HP · if injured','⚗',s.hp===maxHp()||s.potions<1)]};
 case 'camp':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'Shelter, silence, and rest',text:['You find a circle of standing stones, half protected from the wind. A long night is ahead.',`You have ${s.hitDice} unspent Hit Point Dice, ${s.potions} potions, and ${s.inventory.rations} rations.`,s.flags.shelter===true?'A sheltered hollow nearby looks safe enough for sleep.':s.flags.shelter===false?'Fresh tracks warn that the exposed clearing is dangerous.':'You have not yet assessed whether this is a safe place to rest.'],lesson:'A Short Rest is one hour. Spend one or more Hit Point Dice to heal (die + CON modifier). A Long Rest lasts at least eight hours; it can be interrupted. Neither begins at 0 HP.',choices:[q('c:shortRest','Take a Short Rest','Spend one Hit Point Die if injured · regain some class resources','☕',s.hp<=0),q('c:campShelter','Search for a sheltered campsite','Wisdom (Survival) DC 12','◎'),q('c:longRest','Attempt a Long Rest','Restore HP, Hit Dice and class resources if uninterrupted','☾',s.hp<=0||!!s.flags.longRested),q('c:campPotion','Drink a Potion of Healing','2d4+2 HP, uses a consumable','⚗',s.hp===maxHp()||s.potions<=0),q('c:toTrail','Break camp and follow the road','Continue to the broken crossing','↝')]};
 case 'trail':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'The path through brambles',text:['The forest thins into a gorge where a ruined bridge crosses swift black water.',s.flags.trailSafe?'Your scouting spared you the worst of the brambles.':'The muddy detour reminded you that even a journey has costs.','A sentry stands on the broken bridge, guarding the only easy passage.'],lesson:'Exploration works through specific actions and consequences; clever preparations can remove the need for a roll.',choices:[q('c:toBridge','Approach the broken bridge','Begin tactical movement and cover lessons','↝'),q('c:backCamp','Return to the campsite','You may still rest before crossing','↶')]};
 case 'crossing':return {chapter:5,label:'THE BROKEN CROSSING',heading:'A narrow path, a watchful guard',text:['The bridge hangs above a fast, black stream. A wounded sentry blocks the far end and points a crossbow your way.','“No travelers. Not after what the village did,” they warn. Shattered stone and waist-high parapets offer different routes across.'],lesson:'Movement uses feet and squares on a tactical grid (one square = 5 feet here). Cover and difficult terrain can change tactics. Disengage prevents opportunity attacks during your movement.',choices:[!s.flags.bridgeSafe?q('c:bridgeInspect','Study the ruined masonry','Investigation DC 13 · locate safe stones','◎'):null,q('c:bridgeParley','Negotiate with the guard','Persuasion DC 14 · avoid the fight','◇'),s.inventory.rope>0?q('c:ropeCross','Secure your rope along the parapet','Use an item to cross without a roll','⌘'):null,q('c:startTactics','Defend yourself on the bridge','Interactive grid battle · cover, range, reactions','⚔')].filter(Boolean)};
 case 'crossingAfter':return {chapter:5,label:'THE BROKEN CROSSING',heading:'Across the water',text:['You stand on the far bank, where a path winds toward Briar Hollow. A torn supply banner lies beneath the stones.',s.flags.bridgeParley?'The guard seems relieved not to have fought you.':'The cost of crossing is written in broken cobblestones.', 'The banner bears the same three-eyed wolf seen at the tavern.'],lesson:'Combat was one solution. Negotiation, planning, or equipment might have achieved the same objective without initiative.',choices:[q('c:toVillage','Follow the supply trail','Continue to Chapter 6','↝'),q('c:restRoad','Take a moment to drink a healing potion','Use a consumable outside combat','⚗',s.potions<=0||s.hp===maxHp())]};
 case 'village':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'A village with two stories',text:['Briar Hollow should be preparing for a harvest feast. Instead, market stalls are empty.','The merchant says supplies vanished at the mill. The miller claims the council redirected them. The bridge sentry fears starving travelers.','The council will meet before dusk. You have time to gather testimony.'],lesson:'Insight does not act as an infallible lie detector; it helps read behavior. Social choices change trust as well as information.',choices:[q('c:toMarket','Speak to the merchant','Investigate a missing shipment','☷'),q('c:toWitness','Visit the mill','Listen to another account','◇'),q('c:toCouncil','Present your case to the council','Persuasion DC 14; evidence may help','✦')]};
 case 'market':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'The merchant’s ledger',text:['The merchant points to a nearly empty grain cart. “I sent what I could. The miller signed for it all.”','A ledger lies open beside the till. The ink on one page is much fresher than the rest.'],lesson:'Persuasion is a sincere request; Deception is an intentional lie. The choice matters narratively even if the dice total is the same.',choices:[!s.flags.marketTruth?q('c:marketInsight','Study the merchant’s manner','Insight DC 12 · look for contradictions','◎'):null,!s.flags.bluffed?q('c:mislead','Pretend to be a royal auditor','Deception DC 13 · risk trust','♢'):null,q('c:toWitness','Compare the miller’s account','Seek corroboration','↝'),q('c:toCouncil','Take your findings to the council','Speak with or without evidence','✦')]};
 case 'witness':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'At the watermill',text:['Inside the mill, a weary worker tends a broken wheel. “We received half our order,” they say, “and were told to be grateful.”','The worker is afraid to anger the council treasurer. A sealed ledger sits behind them.'],lesson:'People have goals and limits. A DM may provide clues without requiring one magic “correct” social skill.',choices:[!s.flags.millerTrust?q('c:interview','Promise the miller a fair hearing','Persuasion DC 12 · gain trust','◇'):null,!s.flags.intimidated?q('c:confront','Threaten to expose the treasurer','Intimidation DC 13 · causes tension','⚑'):null,q('c:toMarket','Cross-check the market accounts','Try another lead','↶'),q('c:toCouncil','Bring what you know to the council','Present your case','✦')]};
 case 'council':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'The council must decide',text:['The village hall falls quiet as you step forward.',s.flags.villageEvidence?'You have a seal or invoice that connects the supplies to the council treasurer.':'You have little physical evidence, but the villagers are willing to hear you.',s.flags.bluffed||s.flags.intimidated?'A few villagers remember the forceful methods you used.':'Your approach has left the villagers willing to listen.'],lesson:'A convincing argument is not automatic control of an NPC. Circumstances, evidence and trust can change whether a roll is appropriate.',choices:[q('c:council','Explain what really happened','Persuasion DC 14 · advantage with evidence','✦'),q('c:backVillage','Gather more evidence','Return to the village','↶')]};
 case 'trial':return {chapter:7,label:'THE ARCANE TRIAL',heading:'A school of patient magic',text:['An ancient school stands beyond the village. Its tutor, Elowen, waits beside a circle of glowing runes.','“Magic is more than flashy effects. You must know when you roll to hit, when the target resists, and when concentration can be broken.”'],lesson:'A spell attack is rolled by the caster against AC. A spell with a saving throw makes the target roll against your spell save DC. Not every class can cast spells.',choices:[q('c:toArchive','Examine the spell archive','Discover spellcasting basics','◎'),q('c:toAltar','Enter the demonstration circle','Practice attacks, saves, concentration','✦')]};
 case 'archive':return {chapter:7,label:'THE ARCANE TRIAL',heading:'The language of spells',text:[s.classId==='wizard'?'Your spellbook warms as it meets the archive’s light.':'Elowen lets you study a page from a borrowed spellbook. You cannot cast Wizard spells, but you can still learn how to resist them.','A record describes Fire Bolt (a cantrip with a spell attack) and Burning Hands (a level-1 spell with a Dexterity save).','A glowing bowl demonstrates Detect Magic: a concentration spell with a limited duration.'],lesson:'Wizards prepare spells and can cast cantrips without spending slots. Detect Magic can also be cast as a ritual if prepared as an eligible Wizard ritual from a spellbook, adding 10 minutes.',choices:[q('c:arcana','Decode a runic inscription','Arcana DC 13','◎'),q('c:toAltar','Enter the trial circle','Demonstrate the mechanics','✦')]};
 case 'altar':return {chapter:7,label:'THE ARCANE TRIAL',heading:'A choice of magic',text:['A hovering practice target waits inside the circle. Elowen gestures, showing the difference between an attack roll and a forced saving throw.',s.flags.magicAttack!==undefined?'You have already seen a spell attack in action.':'The target bears a painted AC value of 12.',s.flags.magicSave!==undefined?'You have also tested a spell with a saving throw.':'The tutor can demonstrate Burning Hands and ask the target to resist.',s.flags.focusHeld!==undefined?'You understand how damage can break concentration.':'A pulsing ward is ready to test concentration.'],lesson:'Concentration breaks when you cast a different concentration spell, become incapacitated, or fail a Constitution saving throw after taking damage (DC at least 10).',choices:[q('c:spellAttack',s.classId==='wizard'?'Cast Fire Bolt at the target':'Watch a Fire Bolt attack roll','Spell attack against AC 12 · free cantrip','✦'),q('c:spellSave',s.classId==='wizard'?'Cast Burning Hands':'Observe Burning Hands and a Dexterity save',s.classId==='wizard'?'3d6 fire · half on successful save · 1 slot':'Target makes a saving throw versus spell DC','✧',s.classId==='wizard'&&s.slots<1),q('c:concentrate','Maintain a concentration effect','Take a small shock and make a CON save','◇'),q('c:toAscent','Finish the trial and follow the beacon road','Continue to Chapter 8','↝')]};
 case 'ascent':return {chapter:8,label:'BECOMING AN ADVENTURER',heading:'The road above the clouds',text:['The path winds toward a mountain beacon. Your travels have changed you. You can now advance to level 2.',`You have faced mysteries, tactical choices, and magic as a ${hero().name}.`,`Elowen's words echo: “Growth means new possibilities, not just stronger numbers.”`],lesson:'When leveling up, HP maximum and class features change. Different classes develop in very different ways.',choices:[q('c:toLevel','Level up to 2','Unlock your next class features','✦',s.level===2),s.level===2?q('c:toFinal','Approach the mountain beacon','Apply what you learned','↝'):null].filter(Boolean)};
 case 'levelup':return {chapter:8,label:'BECOMING AN ADVENTURER',heading:'A new kind of adventurer',text:[`You are now a level ${s.level} ${hero().name}.`,s.classId==='fighter'?'You can use Action Surge to take an extra action (not the Magic action) once per Short or Long Rest. Tactical Mind can add 1d10 to a failed ability check by spending Second Wind.':s.classId==='rogue'?'Your Cunning Action lets you Dash, Disengage or Hide as a Bonus Action. Sneak Attack stays at 1d6 until level 3.':'Scholar grants Expertise in one known scholarly skill. Choose Arcana or Investigation to double your proficiency bonus for that skill.',`You have ${s.hp}/${maxHp()} HP, and ${s.hitDice} remaining Hit Point Dice.`],lesson:'Level 2 does not mean every class gets another attack. Features have specific triggers and resource limitations.',choices:[s.classId==='wizard'&&!s.scholarSkill?q('c:scholar:arcana','Choose Arcana Expertise','Gain an extra +2 to Arcana checks','✦'):null,s.classId==='wizard'&&!s.scholarSkill?q('c:scholar:investigation','Choose Investigation Expertise','Gain an extra +2 to Investigation checks','◎'):null,(s.classId!=='wizard'||s.scholarSkill)?(s.flags.beaconPassed?q('c:toFinal','Approach the final beacon','Your training is complete','↝'):q('c:beaconTest','Prove your new abilities at the beacon','A final encounter applies your level-2 features','⚔')):null].filter(Boolean)};
 case 'beaconTest':return {chapter:8,label:'THE BEACON TEST',heading:'A living lesson',text:['An echo made of starlight steps between you and the final beacon. “The trial is not to destroy me,” it says. “Demonstrate how your new training changes your choices.”','You can face the echo in a brief training duel. Its blows are nonlethal; your existing inventory and class resources remain relevant.'],lesson:'Try your level-2 ability in a real story challenge. Fighter: Action Surge. Rogue: Bonus-Action Hide. Wizard: Scholar expertise helps in the alternate, noncombat solution.',choices:[q('c:beginBeacon','Challenge the echo to a duel','Use your abilities in combat','⚔'),q('c:beaconInsight','Study the echo and negotiate','Use Insight or scholarly Expertise','✦')]};
 case 'epilogue':return {chapter:8,label:'BEYOND THE LANTERN',heading:'A story you can bring to the table',text:['The mountain beacon flares to life as the valley answers with hundreds of tiny lanterns.',s.inventory.lantern?'The Last Lantern glows warmly in your pack, answering the lights across the valley.':'The light of the valley reminds you of the choice you made in the vault.',s.flags.finalInsight?'Your careful reading of the guardian allowed you to avoid another unnecessary fight.':'You chose to act even without perfect certainty. The outcome belongs to your character.',`You leave Blackwood as ${esc(s.heroName)}, a level ${s.level} ${hero().name}, knowing enough to join a real tabletop group.`],lesson:'At the table, your next step is to tell the DM what your character attempts. The DM responds with consequences, and the shared story continues.',choices:[q('c:review','Review your learning journal','See all the rules you have encountered','✦'),q('c:practice','Open the practice arena','Train checks and combat safely','⚔'),q('c:chapters','Replay a chapter checkpoint','Explore a different path','↶')]};
 default: return {chapter:8,label:'THE ADVENTURE',heading:'Continue',text:[],choices:[]};
 }
}
function campaignAct(key){
 if(key==='enterForest'){cue('Continue beyond the tavern');newChapter('forest','Into Blackwood','You set off beneath the last light of evening. Your equipment and wounds accompany you.');learn('resources');return true;}
 if(key==='retryFight'&&s.stage==='defeat'&&s.flags.defeatSource==='bridge'){s.hp=Math.max(1,Math.ceil(maxHp()/2));s.stage='crossing';s.tactics=null;cue('Try the bridge again');outcome('Another way across','You regain your footing at the bridge and can choose a safer path or face the sentry again.');commit();return true;}
 if(!key.startsWith('c:'))return false;
 if(s.storyResult||s.pending)return true;
 const v=campaignScene(),action=v.choices.find(x=>x?.key===key);
 if(!action||action.locked)return true;
 cue(action.title);
 if(CHECKS[key]){campaignCheck(key,action.title);return true;}
 const advance=(stage,title,desc)=>moveScene(stage,title,desc);
 switch(key){
 case 'c:camp':advance('camp','A circle of standing stones','You find a place to make camp as the forest grows dark.');break;
 case 'c:forestPotion':case 'c:campPotion':case 'c:restRoad':if(usablePotion())commit();break;
 case 'c:shortRest':{
  if(s.hp<=0)return true;
  s.restSession={spent:0,total:0};
  if(s.classId==='fighter')s.secondWind=Math.min(2,s.secondWind+1);
  if(s.classId==='fighter'&&s.level>=2)s.actionSurge=1;
  if(s.classId==='wizard'&&!s.arcaneRecovery&&s.slots<(s.level===2?3:2)){s.slots++;s.arcaneRecovery=true;}
  learn('rests');learn('resources');
  outcome('Your short rest begins','You rest for one hour. You can now spend Hit Point Dice one at a time, deciding after each roll whether to spend another. Short Rest class features have recovered as appropriate.');commit();break;
 }
 case 'c:longRest':{
  if(s.hp<=0)return true;
  learn('rests');learn('resources');
  if(s.flags.shelter!==true&&!s.flags.longInterrupted){s.flags.longInterrupted=true;
   // One long-rest interruption; after at least 1 hour, short-rest features can recharge.
   if(s.classId==='fighter')s.secondWind=Math.min(2,s.secondWind+1);
   outcome('Wolves interrupt your rest','A pack howls nearby. You wake before your Long Rest can finish, so you do not receive its full benefits. Having rested for an hour, you may use Short Rest benefits. Search for better shelter before trying again.',false);
  }else {
   const before=s.hp;s.hp=maxHp();s.hitDice=s.level;s.secondWind=2;s.arcaneRecovery=false;s.actionSurge=1;
   if(s.classId==='wizard')s.slots=s.level===2?3:2;
   s.flags.longRested=true;s.flags.longInterrupted=false;
   s.restSession=null;outcome('A full night of safety',`Eight hours later, you wake with ${s.hp}/${maxHp()} HP (previously ${before}). All Hit Point Dice, your Wizard slots, and Long Rest class resources are restored.`,true);
  }commit();break;
 }
 case 'c:toTrail':advance('trail','The grey light of morning','At first light, you gather your things and follow the winding road.');break;
 case 'c:backCamp':advance('camp','Back among the stones','The camp is still quiet enough for a moment of rest.');break;
 case 'c:toBridge':newChapter('crossing','The bridge looms','A guard raises their crossbow above the rushing water. Your next decisions will change how you cross.');learn('movement');break;
 case 'c:ropeCross':if(s.inventory.rope>0){s.flags.usedRope=true;advance('crossingAfter','A rope-secured passage','You tie your rope to the parapet and cross carefully under the ruined arch. The sentry sees you, but lets you pass after you call out your peaceful intentions.');learn('inventory');}break;
 case 'c:startTactics':startTactics(false);break;
 case 'c:toVillage':newChapter('village','An empty market square','You arrive in Briar Hollow and hear conflicting accounts of the missing grain.');learn('social');break;
 case 'c:toMarket':advance('market','A ledger on the counter','The merchant welcomes your questions without quite meeting your eyes.');break;
 case 'c:toWitness':advance('witness','The mill wheel turns','At the mill, you find the witness preparing for the evening meeting.');break;
 case 'c:toCouncil':advance('council','The hall falls quiet','The village council agrees to hear your account.');break;
 case 'c:backVillage':advance('village','More questions than answers','You return to the square, ready to gather another lead.');break;
 case 'c:toArchive':advance('archive','Dust and spellbooks','The archive’s runes shimmer with protective magic.');break;
 case 'c:toAltar':advance('altar','The spell circle awakens','Elowen raises a spell ward and invites you to observe the mechanics.');break;
 case 'c:spellAttack':{
  const d=rand(20),bonus=5,total=d+bonus,success=d===20||(d!==1&&total>=12);
  s.flags.magicAttack=success;learn('spells');learn('slots');
  const caster=s.classId==='wizard'?'you':'Elowen';
  outcome(success?'A bright hit':'The bolt misses',`${caster==='you'?'You cast':'Elowen casts'} Fire Bolt, a cantrip using a spell attack: d20 ${d} + ${bonus} = ${total} against AC 12. ${success?`Hit! The target takes ${rand(10)} fire damage.`:'The bolt skims past the target.'} No spell slot is spent.`,success);commit();break;
 }
 case 'c:spellSave':{
  if(s.classId==='wizard'&&s.slots<=0)return true;
  const d=rand(20),save=d+2,dc=13,success=save>=dc,rolls=[rand(6),rand(6),rand(6)],full=rolls.reduce((a,b)=>a+b,0),dealt=success?Math.floor(full/2):full;
  if(s.classId==='wizard')s.slots--;
  s.flags.magicSave=success;learn('spells');learn('slots');
  outcome(success?'The target resists some fire':'The target takes the full blast',`${s.classId==='wizard'?'You cast':'Elowen demonstrates'} Burning Hands. The target rolls d20 ${d} + DEX save +2 = ${save} versus spell save DC ${dc}. Three d6 (${rolls.join(' + ')}) total ${full} fire damage; the target takes ${dealt} (${success?'half on a successful save':'full on a failed save'}). ${s.classId==='wizard'?'You spend a level-1 slot.':'Your own spell slots are untouched.'}`,success);commit();break;
 }
 case 'c:concentrate':{
  learn('concentration');learn('conditions');
  // Demonstration: tutor casts a concentration spell; player can maintain an effect using the training focus.
  s.flags.concentrationTrial=true;
  const dmg=3,before=s.hp;
  campaignCheck('c:focus','Maintain concentration after a shock');
  s.hp=Math.max(1,s.hp-dmg);
  s.flags.concentrationDamage=dmg;
  // The shock is nonlethal and the pending check remembers HP before the shock.
  record(`A controlled magical pulse deals ${before-s.hp} damage while the training focus sustains concentration.`,'story');
  learn('saves');commit();break;
 }
 case 'c:toAscent':newChapter('ascent','Up toward the final beacon','With the arcane trial behind you, you climb into bright mountain air.');learn('level');break;
 case 'c:toLevel':{
  if(s.level===2)return true;
  const extra={fighter:8,rogue:7,wizard:5}[s.classId];s.level=2;s.hp+=extra;s.hitDice=Math.min(2,s.hitDice+1);
  if(s.classId==='fighter')s.actionSurge=1;
  if(s.classId==='wizard')s.slots=Math.min(3,s.slots+1);
  learn('level');advance('levelup','You reach level 2!',`Your maximum HP increases by ${extra}. You now have ${s.hp}/${maxHp()} HP. Your new ${hero().name} feature is explained in the next scene.`);break;
 }
 case 'c:scholar:arcana':case 'c:scholar:investigation':if(s.classId==='wizard'&&!s.scholarSkill){s.scholarSkill=key.split(':').pop();outcome('Scholar expertise gained',`You choose ${s.scholarSkill}: your proficiency is doubled for that skill, adding a further +2 at level 2.`);commit();}break;
 case 'c:beaconTest':newChapter('beaconTest','A challenge at the mountain beacon','An echo blocks the last path and asks you to demonstrate what you have learned.');break;
 case 'c:beginBeacon':beginBeaconTest();break;
 case 'c:beaconInsight':{
  const die=rand(20),skill=s.classId==='wizard'?(s.scholarSkill||'arcana'):'insight',bonus=skillBonus(skill),result=die+bonus;
  learn('social');learn('level');
  if(result>=13){s.flags.beaconPassed=true;s.flags.beaconPeace=true;outcome('The echo acknowledges your insight',`d20 ${die} ${signed(bonus)} = ${result} vs DC 13. You understand the echo seeks proof of growth, not violence. It allows you to approach the beacon.`,true);s.stage='levelup';}
  else outcome('A question remains',`d20 ${die} ${signed(bonus)} = ${result} vs DC 13. Your explanation isn't quite enough. You can try the training duel instead.`,false);
  commit();break;
 }
 case 'c:toFinal':{
  if(!s.flags.beaconPassed){outcome('One test remains','Complete the echo’s level-2 challenge before approaching the beacon.',false);commit();break;}

  s.flags.finalSeen=true;campaignCheck('c:final','Study the intentions of the final guardian');break;
 }
 case 'c:review':modal='learn';render();break;
 case 'c:practice':modal='practice';render();break;
 case 'c:chapters':modal='chapters';render();break;
 default:return false;
 }
 return true;
}
function renderMindOffer(){const m=s.mindOffer;if(!m)return '';return `<section class="story-screen story-pause"><div class="story-pause-inner"><span class="story-pause-eyebrow">✦ FIGHTER · LEVEL 2</span><h2>Tactical Mind</h2><div class="story-pause-result negative"><h3>Your check initially failed</h3><p>${esc(m.roll.name)}: d20 ${m.roll.die} ${signed(m.roll.modifier)} = ${m.roll.total} versus DC ${m.roll.dc}.</p><p>You may spend a Second Wind use to roll 1d10 and add it to your check. If the total still fails, the use is not spent.</p></div><button class="primary" data-act="mind:use">Try Tactical Mind (${s.secondWind} uses) →</button><button class="secondary" data-act="mind:accept">Accept the original failure</button></div></section>`;}
function resolveTacticalMind(use){const m=s.mindOffer;if(!m)return;let r=m.roll;if(use){const d=rand(10);r={...r,total:r.total+d,success:r.total+d>=r.dc,tacticalMind:d};if(r.success)s.secondWind--;record(`Tactical Mind: d10 ${d}; new total ${r.total} vs DC ${r.dc}. ${r.success?'Second Wind use spent.':'Use preserved after failure.'}`,'roll');}s.mindOffer=null;s.checks[s.checks.length-1]=r;if(!campaignHandleCheck(m.key,r.success,r))handleCheckResult(m.key,r.success,r);commit();}
function renderChapters(){
 const starts=[{n:1,name:'The Forgotten Tavern',desc:'NPCs and ability checks'},{n:2,name:'Beneath the Floorboards',desc:'Hazards and saving throws'},{n:3,name:'The Chamber of Echoes',desc:'Dialogue and early combat'},{n:4,name:'A Night in Blackwood',desc:'Resting, limited resources and recovery'},{n:5,name:'The Broken Crossing',desc:'Tactical maps, cover, opportunity attacks'},{n:6,name:'Secrets of Briar Hollow',desc:'Insight, persuasion, evidence and trust'},{n:7,name:'The Arcane Trial',desc:'Spell attacks, saves, slots and concentration'},{n:8,name:'Becoming an Adventurer',desc:'Level 2 features and final reflection'}];
 return `<p class="modal-lead">Replay chapters in a separate save slot. Your original campaign, inventory and choices remain untouched.</p>${s.replay?`<div class="replay-banner"><b>REPLAYING CHAPTER ${s.replay.chapter}</b><p>Your main adventure is safe.</p><button class="primary" data-act="returnMain">← Return to main campaign</button></div>`:''}<div class="chapter-list">${starts.map(({n,name,desc})=>`<div class="chapter-entry"><div><b>${String(n).padStart(2,'0')} · ${name}</b><p>${desc}</p></div>${s.checkpoints[n]?`<button data-act="checkpoint:${n}">Replay ↻</button>`:n===1?`<span>Start a new adventure to replay</span>`:`<span>${s.unlocked>=n?'Unavailable in this older save':'Locked'}</span>`}</div>`).join('')}</div>`;
}
function renderLearning(){
 const found=Object.keys(s.learned||{}).filter(k=>LESSONS[k]).length;
 const mastered=Object.keys(s.mastery||{}).filter(k=>LESSONS[k]&&s.mastery[k]).length;
 return `<p class="modal-lead">${found} / ${Object.keys(LESSONS).length} lessons discovered · ${mastered} demonstrated in a knowledge check. Discovering a rule isn't the same as applying it.</p><div class="lesson-progress"><i style="width:${Math.round(100*found/Object.keys(LESSONS).length)}%"></i></div><div class="glossary">${Object.entries(LESSONS).map(([k,[title,desc]])=>{
  const unlocked=Boolean(s.learned?.[k]),q=QUIZZES[k],done=Boolean(s.mastery?.[k]);
  const f=s.quizFeedback?.id===k?s.quizFeedback:null;
  return `<details ${unlocked?'':'class="lesson-locked"'}><summary>${done?'★':unlocked?'✓':'◇'} ${esc(title)}${done?' · mastered':unlocked?' · try a check':' · not yet encountered'}</summary><p>${unlocked?esc(desc):'Continue the campaign to unlock this lesson.'}</p>${unlocked&&q?`<div class="lesson-quiz"><strong>CHECK YOUR UNDERSTANDING</strong><p>${esc(q[0])}</p><div class="practice-buttons"><button data-act="quiz:${k}:0">${esc(q[1])}</button><button data-act="quiz:${k}:1">${esc(q[2])}</button></div>${f?`<p role="status" class="${f.correct?'quiz-correct':'quiz-wrong'}">${f.correct?'✓ Correct — applied successfully.':'Try again. Revisit the explanation above.'}</p>`:''}</div>`:''}</details>`;}).join('')}</div>`;
}
const ITEM_INFO={rope:['50 ft rope','Secure a climb or make a bridge crossing safer. Rope is useful even without combat.'],rations:['Travel rations','Food for travel. In a longer campaign, the DM may track food and water during journeys.'],torch:['Torch','Illuminates darkness. Carrying light can also reveal your position.'],smoke:['Smoke pellet','A training consumable: can create visual concealment in the bridge duel. Not a standard SRD item.']};
function renderInventory(){return `<p class="modal-lead">Your supplies carry across chapters. Healing and equipment work independently of the story dialogue.</p><div class="inventory-list">${s.inventory.lantern?'<div class="inventory-entry"><div><b>✧ The Last Lantern ×1</b><small>The enchanted blue-flame lantern you chose to keep in the vault. A unique story item; it stays in your pack and does not get consumed during combat.</small></div></div>':''}<div class="inventory-entry"><div><b>⚗ Potion of Healing</b><small>2d4+2 HP · 2024 Bonus Action · ×${s.potions}</small></div><button data-act="item:potion" ${s.potions<=0||s.hp>=maxHp()?'disabled':''}>Drink</button></div>${Object.entries(ITEM_INFO).map(([id,[name,desc]])=>`<div class="inventory-entry"><div><b>${esc(name)} ×${s.inventory[id]||0}</b><small>${esc(desc)}</small></div>${id==='smoke'?`<button data-act="item:smoke" ${s.inventory.smoke<=0||s.stage!=='crossingBattle'?'disabled':''}>Use</button>`:id==='rations'?`<button data-act="item:rations" ${!s.inventory.rations?'disabled':''}>Eat</button>`:id==='torch'?`<button data-act="item:torch">${s.flags.torchLit?'Put out':'Light'}</button>`:''}</div>`).join('')}<div class="inventory-entry"><div><b>⚔ Equipped weapon</b><small>${s.equipped==='alternate'?(s.classId==='fighter'?'Javelin':s.classId==='rogue'?'Shortbow':'Quarterstaff'):hero().weapon} · change range in bridge battles</small></div><button data-act="item:equip">Swap</button></div>${s.flags.key?'<div class="inventory-entry"><div><b>✧ Silver wolf-key</b><small>An ancient key connected with the beacon.</small></div></div>':''}</div>`;}
function renderPractice(){
 const p=s.practice||{},isDuel=p.mode==='duel',paused=p.phase==='result';
 return `<p class="modal-lead">Repeat skills, spells and combat without spending adventure resources. Every action result stays visible until you continue.</p><div class="practice-buttons"><button data-act="practice:check">Practice a skill check</button><button data-act="practice:combat">Start / restart combat</button><button data-act="practice:spell">Practice spells & saves</button><button data-act="practice:reset">Clear practice</button></div>${isDuel?`<div class="practice-hp"><span>♥ You <b>${p.heroHp}/${maxHp()}</b></span><span>⚔ Training sentry <b>${p.enemyHp}/18</b></span></div>`:''}${p.text?`<div class="practice-feedback" role="status"><span class="small-caps">${paused?'ACTION RESULT · PAUSED':'TRAINING FEEDBACK'}</span><p>${fmt(p.text)}</p>${p.math?`<p>${esc(p.math)}</p>`:''}</div>`:''}${isDuel?(paused?`<button class="primary" data-act="practice:continue">Continue → ${p.next==='enemy'?'Sentry response':p.next==='round'?'New turn':'Choose next action'}</button>`:p.heroHp<=0||p.enemyHp<=0?`<p>Practice battle complete. Restart to try a different approach.</p>`:`<span class="small-caps">ROUND ${p.round} · ${p.usedAction?'Action spent':'Action available'} · ${p.usedBonus?'Bonus Action spent':'Bonus Action available'}</span><div class="practice-buttons"><button data-act="practice:attack" ${p.usedAction?'disabled':''}>⚔ Attack</button><button data-act="practice:dodge" ${p.usedAction?'disabled':''}>◇ Dodge</button><button data-act="practice:heal" ${p.usedBonus||p.heroHp>=maxHp()?'disabled':''}>⚗ Bonus: Potion</button>${s.level===2&&s.classId==='fighter'?`<button data-act="practice:surge" ${!p.usedAction||p.surged?'disabled':''}>✦ Action Surge</button>`:''}${s.level===2&&s.classId==='rogue'?`<button data-act="practice:hide" ${p.usedBonus?'disabled':''}>↟ Cunning Hide</button>`:''}${s.classId==='wizard'?`<button data-act="practice:missile" ${p.usedAction||p.surgeOnly?'disabled':''}>✦ Magic Missile</button>`:''}<button data-act="practice:end">End turn →</button></div>`):''}`;
}
// Compact 5-foot square battlemap. This is a deliberate teaching encounter rather than a full VTT.
const SQUARES=[[2,2]];const coverSquare=(x,y)=>x===1&&y===1;const deepCover=(x,y)=>x===0&&y===1;
const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
function startTactics(practice=false){
 s.tactics={phase:'player',hero:{x:0,y:2},enemy:{x:4,y:1},enemyHp:14,enemyMax:14,round:1,usedMove:0,moveLimit:6,usedAction:false,usedBonus:false,disengaged:false,dodging:false,hidden:false,concentrating:false,reactionReady:true,result:null,next:null,log:[],practice};
 s.stage='crossingBattle';learn('movement');learn('cover');learn('reactions');learn('combat');
 outcome('The bridge becomes a battlefield','The sentry blocks the bridge. Each square is 5 feet. You can move and attack, Dash or Disengage, or use cover. Watch each result before the next turn.');commit();
}
function tacticalResult(title,body,{math='',kind='neutral',number='',next='enemy',hpBefore=null,hpAfter=null}={}){
 const t=s.tactics;t.phase='result';t.next=next;t.result={title,body,math,kind,number,hpBefore,hpAfter};t.log.unshift(title+': '+body);record(title+': '+body,'combat');commit();
}
function tacticalEnemy(){
 const t=s.tactics;if(!t||t.enemyHp<=0)return tacticalWin();
 if(t.concentrating){t.concentrating=false;}// smoke/concentration resolved when enemy begins if needed
 const start={...t.enemy}; const gap=distance(t.enemy,t.hero);
 if(t.hidden){const perception=rand(20)+1;if(perception<(t.hideDC||15)){tacticalResult('The guard searches for you',`Sentry Perception ${perception} does not find your hiding place. While you remain hidden, it cannot target you by sight.`,{kind:'defended',number:'HIDDEN',next:'player'});return;}t.hidden=false;record(`The guard locates you with Perception ${perception}.`,'combat');}
 if(gap>1){
  const steps=Math.min(4,gap-1);
  for(let i=0;i<steps;i++){
   if(t.enemy.x>t.hero.x)t.enemy.x--;else if(t.enemy.y>t.hero.y)t.enemy.y--;else if(t.enemy.y<t.hero.y)t.enemy.y++;
  }
 }
 const melee=distance(t.enemy,t.hero)<=1;
 const d1=rand(20),d2=t.dodging?rand(20):null,d=d2===null?d1:Math.min(d1,d2),atk=d+3,cover=!melee?(deepCover(t.hero.x,t.hero.y)?5:coverSquare(t.hero.x,t.hero.y)?2:0):0;
 const a=melee?hero().ac:hero().ac+cover;
 const hit=d===20||(d!==1&&atk>=a),damage=hit?(rand(6)+1+(d===20?rand(6):0)):0;
 const hpBefore=s.hp;
 s.hp=Math.max(0,s.hp-damage);t.dodging=false;
 tacticalResult(hit?'The sentry hits you':'The sentry misses',`The sentry moves from (${start.x+1},${start.y+1}) to (${t.enemy.x+1},${t.enemy.y+1}) and ${melee?'strikes with a sword':'fires a crossbow'}. ${hit?`You take ${damage} damage.`:'Your defenses hold.'}${cover?` Cover gives +${cover} AC against the shot.`:''}`,{math:`d20 ${d1}${d2===null?'':` / ${d2} → ${d} (disadvantage)`} + 3 = ${atk} vs AC ${a} · ${hit?'HIT':'MISS'}`,kind:hit?'hurt':'defended',number:hit?`−${damage} HP`:'MISS',next:s.hp<=0?'defeat':'player',hpBefore,hpAfter:s.hp});
}
function tacticalWin(){s.flags.bridgeFought=true;s.tactics=null;s.stage='crossingAfter';outcome('The sentry yields','The sentry drops their weapon. You offer mercy, and they tell you the village cut off their food supplies. You cross the bridge and find the lost shipment banner.',true);commit();}
function tacticalDefeat(){s.stage='defeat';s.flags.defeatSource='bridge';s.tactics=null;outcome('The bridge is lost','You fall to 0 HP during the tutorial encounter. In actual D&D, unconsciousness and Death Saving Throws apply; here you can retry from your saved bridge checkpoint.',false);commit();}
function tacticalContinue(){const t=s.tactics;if(!t||t.phase!=='result')return;const next=t.next;t.next=null;t.result=null;if(next==='victory')return tacticalWin();if(next==='defeat')return tacticalDefeat();if(next==='enemy')return tacticalEnemy();t.phase='player';t.round++;t.usedMove=0;t.moveLimit=6;t.usedAction=false;t.usedBonus=false;t.disengaged=false;t.reactionReady=true;commit();}
function tacticalMove(x,y){
 const t=s.tactics;if(!t||t.phase!=='player'||x<0||x>=5||y<0||y>=4||(x===t.enemy.x&&y===t.enemy.y))return;
 const a=t.hero,b={x,y},route=shortestRoute(a,b,t.enemy),cost=route?.cost??Infinity,steps=route?route.path.length-1:0;
 if(cost<1||cost+t.usedMove>(t.moveLimit||6))return;
 const wasNear=distance(a,t.enemy)<=1,willNear=distance(b,t.enemy)<=1;
 const triggersReaction=route.path.slice(1).some((square,i)=>distance(route.path[i],t.enemy)<=1&&distance(square,t.enemy)>1);
 t.hero=b;t.usedMove+=cost;
 if(triggersReaction&&!t.disengaged&&t.reactionReady){const d=rand(20),hit=d===20||(d!==1&&d+3>=hero().ac),dmg=hit?rand(6)+1:0,before=s.hp;s.hp=Math.max(0,s.hp-dmg);
  learn('reactions');t.reactionReady=false;
  tacticalResult('An opportunity attack!',`You leave the sentry's reach without Disengaging. The sentry uses its Reaction: d20 ${d} + 3 ${hit?'hits':'misses'}. ${hit?`You lose ${dmg} HP.`:'You escape unharmed.'}`,{kind:hit?'hurt':'defended',number:hit?`−${dmg} HP`:'MISS',hpBefore:before,hpAfter:s.hp,next:s.hp<=0?'defeat':'move'});return;
 }
 // Moving alone doesn't end your Action, but still shows the pause requested by the player.
 tacticalResult('You reposition',`You move along ${steps} squares (${cost*5} feet of movement used)${cost>steps?' including difficult terrain':''}. Route: ${route.path.slice(1).map(p=>'('+ (p.x+1)+','+(p.y+1)+')').join(' → ')}. Remaining movement: ${((t.moveLimit||6)-t.usedMove)*5} feet. Your Action is still available.`,{kind:'defended',number:`${Math.max(0,(t.moveLimit||6)-t.usedMove)*5} FT`,next:'move'});
}
function tacticalAction(kind){
 const t=s.tactics;if(!t||t.phase!=='player')return;
 if(kind==='potion'){
  if(s.potions<=0||t.usedBonus||s.hp>=maxHp())return;
  const before=s.hp,n=rand(4)+rand(4)+2;s.hp=Math.min(maxHp(),s.hp+n);s.potions--;t.usedBonus=true;
  tacticalResult('Healing potion',`Your Bonus Action restores ${s.hp-before} HP. You still have an Action.`,{kind:'heal',number:`+${s.hp-before} HP`,hpBefore:before,hpAfter:s.hp,next:'bonus'});return;
 }
 if(kind==='wind'){
  if(s.classId!=='fighter'||s.secondWind<=0||t.usedBonus||s.hp>=maxHp())return;
  const before=s.hp,n=rand(10)+s.level;s.hp=Math.min(maxHp(),s.hp+n);s.secondWind--;t.usedBonus=true;
  tacticalResult('Second Wind',`You restore ${s.hp-before} HP using a Bonus Action. ${s.secondWind} uses remain.`,{kind:'heal',number:`+${s.hp-before} HP`,hpBefore:before,hpAfter:s.hp,next:'bonus'});return;
 }
 if(kind==='surge'){
  if(s.classId!=='fighter'||s.level<2||s.actionSurge<=0||!t.usedAction)return;
  s.actionSurge--;t.usedAction=false;t.surgeOnly=true;
  tacticalResult('Action Surge!', 'You gain one additional Action this turn (not the Magic action). Your Action Surge use is now spent.',{kind:'defended',number:'+1 ACTION',next:'bonus'});return;
 }
 if(kind.startsWith('cunning')&&s.classId==='rogue'&&s.level>=2&&!t.usedBonus){t.usedBonus=true;learn('level');if(kind==='cunningDash'){t.moveLimit=dashMovement(t.moveLimit??6);tacticalResult('Cunning Action: Dash','You spend a Bonus Action to gain 30 feet of movement and still keep your main Action.',{kind:'defended',number:'+30 FT',next:'bonus'});}else if(kind==='cunningHide'){if(!deepCover(t.hero.x,t.hero.y)){t.usedBonus=false;tacticalResult('You need deeper cover','To attempt Hide in the 2024 rules, you must be heavily obscured or behind three-quarters or total cover and out of enemy sight. Move to the stacked crates (▥).',{next:'bonus'});return;}const d=rand(20),total=d+hero().skills.stealth;t.hidden=total>=15;t.hideDC=total;tacticalResult(t.hidden?'You conceal yourself':'You remain visible',`Cunning Action (Bonus Action): d20 ${d} + ${hero().skills.stealth} = ${total} vs DC 15.`,{next:'bonus'});}else{t.disengaged=true;tacticalResult('Cunning Action: Disengage','Your Rogue spends a Bonus Action to Disengage, avoiding opportunity attacks during movement.',{kind:'defended',number:'BONUS',next:'bonus'});}return;}
 if(kind==='smoke'){
  if(s.inventory.smoke<1||t.usedBonus)return;
  s.inventory.smoke--;t.usedBonus=true;t.dodging=true;learn('inventory');
  tacticalResult('Smoke clouds the parapet','A house-rule practice item makes the sentry less accurate on its next attack. Smoke pellets are not standard SRD equipment.',{kind:'defended',number:'COVER',next:'bonus'});return;
 }
 if(t.usedAction)return;
 if(kind==='dash'){t.moveLimit=dashMovement(t.moveLimit??6);t.usedAction=true;tacticalResult('Dash','You gain extra movement equal to your Speed this turn. You still must avoid an enemy’s reach unless you Disengage.',{kind:'defended',number:'+30 FT',next:'afterAction'});return;}
 if(kind==='disengage'){t.disengaged=true;t.usedAction=true;tacticalResult('Disengage','Your movement for the rest of this turn does not provoke opportunity attacks. You can still move using remaining movement.',{kind:'defended',number:'SAFE',next:'afterAction'});return;}
 if(kind==='dodge'){t.dodging=true;t.usedAction=true;tacticalResult('Dodge','You focus on defense; visible enemies have disadvantage on attacks against you until your next turn, while you can still dodge.',{kind:'defended',number:'DODGE',next:'afterAction'});return;}
 if(kind==='hide'&&s.classId==='rogue'){
  if(!deepCover(t.hero.x,t.hero.y)){tacticalResult('No hiding place here','Under the 2024 rules, the Hide action needs sufficient concealment. Move behind the stacked crates (▥) before you try.',{kind:'neutral',next:'bonus'});return;}
  const d=rand(20),total=d+hero().skills.stealth,success=total>=15;t.hidden=success;t.hideDC=total;t.usedAction=true;
  tacticalResult(success?'You are hidden':'The guard spots you',`Stealth: ${d} + ${hero().skills.stealth} = ${d+hero().skills.stealth} vs DC 15. ${success?'Your next attack will have advantage if you remain unseen.':'You can retry in better cover.'}`,{kind:success?'defended':'neutral',number:success?'HIDDEN':'SPOTTED',next:'enemy'});return;
 }
 if(kind==='attack'||kind==='missile'){
  const dist=distance(t.hero,t.enemy),close=dist<=1,isWizard=s.classId==='wizard',ranged=s.equipped==='alternate'||isWizard||kind==='missile';
  if(kind==='missile'&&(!isWizard||s.slots<=0||dist>6||t.surgeOnly))return;
  if(!ranged&&dist>1)return;
  if(ranged&&dist>6)return;
  const before=t.enemyHp;
  let damage=0,text='',math='',hit=true;
  if(kind==='missile'){
   const dice=[rand(4)+1,rand(4)+1,rand(4)+1];damage=dice.reduce((a,b)=>a+b,0);s.slots--;
   text=`Three Magic Missile darts strike for ${dice.join(' + ')} = ${damage} force damage. One level-1 slot is spent.`;math='Magic Missile hits automatically; no attack roll.';learn('slots');
  }else{
   const dis=rangedDisadvantage(ranged,close),mode=opposingRolls(t.hidden,dis),adv=mode==='advantage',d1=rand(20),d2=mode==='normal'?null:rand(20),d=d2===null?d1:mode==='advantage'?Math.max(d1,d2):Math.min(d1,d2);
   const bonus=hero().attack,ac=12+(ranged&&coverSquare(t.enemy.x,t.enemy.y)?2:0),crit=d===20;hit=crit||(d!==1&&d+bonus>=ac);
   const dieType=isWizard?10:(s.classId==='fighter'&&ranged?6:hero().damageDie);
   if(hit){damage=rand(dieType)+(crit?rand(dieType):0)+(isWizard?0:3);
    if(s.classId==='rogue'&&adv){const sneak=rand(6)+(crit?rand(6):0);damage+=sneak;learn('sneak');}
   }
   text=`${isWizard?'Fire Bolt':ranged?(s.classId==='fighter'?'Javelin':'Shortbow'):hero().weapon} ${hit?'hits':'misses'}${hit?` for ${damage} damage`:''}.`;
   math=`d20 ${d1}${d2===null?'':` / ${d2} → ${d} (${mode})`} + ${bonus} = ${d+bonus} vs AC ${ac}${crit?' · CRITICAL':''}${dis?' · Ranged attack within 5 ft: disadvantage':''}`;
  }
  t.enemyHp=Math.max(0,t.enemyHp-damage);t.usedAction=true;t.hidden=false;
  tacticalResult(hit?'Your attack connects':'Your attack misses',text,{math,kind:hit?'damage':'neutral',number:hit?`−${damage} HP`:'MISS',hpBefore:before,hpAfter:t.enemyHp,next:t.enemyHp<=0?'victory':'afterAction'});return;
 }
}
// Patch tactical events that preserve the player's remaining Action and movement.
const tacticalNext=tacticalContinue;
function advanceTactical(){const t=s.tactics;if(!t||t.phase!=='result')return;const next=t.next;t.next=null;t.result=null;
 if(next==='move'||next==='bonus'||next==='afterAction'){t.phase='player';commit();return;}
 if(next==='victory'){tacticalWin();return;}if(next==='defeat'){tacticalDefeat();return;}if(next==='enemy'){tacticalEnemy();return;}
 t.phase='player';t.round++;t.usedMove=0;t.moveLimit=6;t.usedAction=false;t.usedBonus=false;t.disengaged=false;t.reactionReady=true;commit();
}
function renderTactics(){
 const t=s.tactics;if(!t)return '';
 const health=(title,hp,max,color)=>`<div class="tactical-health ${color}"><span>${title}</span><strong>${hp} / ${max} HP</strong><div><i style="width:${100*hp/max}%"></i></div></div>`;
 const tile=(x,y)=>{const h=t.hero.x===x&&t.hero.y===y,e=t.enemy.x===x&&t.enemy.y===y,cover=coverSquare(x,y),deep=deepCover(x,y),rough=SQUARES.some(([a,b])=>a===x&&b===y)&&!cover;return `<button class="tactical-tile ${h?'player':e?'opponent':cover?'cover':deep?'deep-cover':rough?'rough':''}" data-act="tile:${x}:${y}" ${t.phase!=='player'||h||e?'disabled':''} aria-label="Square ${x+1},${y+1}${h?' your character':e?' enemy':''}">${h?'♞':e?'♜':cover?'▤':deep?'▥':rough?'≈':'·'}</button>`;};
 const r=t.result;
 return `<section class="story-screen"><div class="chapter-strip"><span>CHAPTER 05 · THE BROKEN CROSSING</span>${chapterTicks(s.stage)}<span>Round ${t.round}</span></div><div class="combat-banner"><span>⚔ TACTICAL ENCOUNTER</span><h2>The Broken Crossing</h2><p>Each square represents 5 feet. Your speed is 30 feet per turn.</p></div><div class="combat-body"><div class="tactical-hps">${health('♥ '+esc(s.heroName),s.hp,maxHp(),'ally')}${health('⚔ Bridge sentry',t.enemyHp,t.enemyMax,'foe')}</div><div class="tactical-map" aria-label="Five by four square tactical battle map">${Array.from({length:4},(_,y)=>Array.from({length:5},(_,x)=>tile(x,y)).join('')).join('')}</div><div class="map-legend">♞ You &nbsp; ♜ Sentry &nbsp; ▤ Half cover (+2 AC) &nbsp; ▥ Three-quarters (+5 AC; allows Hide) &nbsp; ≈ Difficult terrain (extra 5 ft)</div>${r?`<div class="tactical-result ${r.kind}" role="status"><span class="small-caps">ACTION RESULT · READ BEFORE CONTINUING</span><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p>${r.math?`<div class="outcome-math">${esc(r.math)}</div>`:''}${r.number?`<b class="tactic-delta">${esc(r.number)}</b>`:''}${r.hpBefore!==null?`<p>HP: ${r.hpBefore} → ${r.hpAfter}</p>`:''}<button class="primary" data-act="tactic:continue">Continue →</button></div>`:`<div class="tactical-actions"><span class="your-turn">● YOUR TURN · ${Math.max(0,(t.moveLimit||6)-t.usedMove)*5} FT REMAINING</span><p>Select a square to move; then choose your Action. Movement can happen before or after attacking, and may trigger reactions.</p><div class="practice-buttons"><button data-act="tactic:attack" ${t.usedAction?'disabled':''}>⚔ Attack</button>${s.classId==='wizard'&&s.slots>0?`<button data-act="tactic:missile" ${t.usedAction?'disabled':''}>✦ Magic Missile (${s.slots})</button>`:''}<button data-act="tactic:dodge" ${t.usedAction?'disabled':''}>◇ Dodge</button><button data-act="tactic:disengage" ${t.usedAction?'disabled':''}>↝ Disengage</button><button data-act="tactic:dash" ${t.usedAction?'disabled':''}>↠ Dash</button>${s.classId==='rogue'?`<button data-act="tactic:hide" ${t.usedAction?'disabled':''}>↟ Hide</button>`:''}${s.classId==='rogue'&&s.level>=2?`<button data-act="tactic:cunning" ${t.usedBonus?'disabled':''}>Cunning Disengage</button><button data-act="tactic:cunningDash" ${t.usedBonus?'disabled':''}>Cunning Dash</button><button data-act="tactic:cunningHide" ${t.usedBonus?'disabled':''}>Cunning Hide</button>`:''}${s.classId==='fighter'&&s.level>=2&&t.usedAction&&s.actionSurge>0?`<button data-act="tactic:surge">Action Surge</button>`:''}</div><div class="bonus-actions"><span class="small-caps">BONUS ACTIONS</span><div class="practice-buttons"><button data-act="tactic:potion" ${t.usedBonus||s.potions<=0||s.hp>=maxHp()?'disabled':''}>⚗ Potion (${s.potions})</button>${s.classId==='fighter'?`<button data-act="tactic:wind" ${t.usedBonus||s.secondWind<=0||s.hp>=maxHp()?'disabled':''}>✚ Second Wind (${s.secondWind})</button>`:''}${s.inventory.smoke>0?`<button data-act="tactic:smoke" ${t.usedBonus?'disabled':''}>◈ Smoke (${s.inventory.smoke})</button>`:''}</div></div><p class="tactic-note">${distance(t.hero,t.enemy)<=1?'The sentry is within 5 feet (melee reach).':'The sentry is not in melee reach. Move close for a melee attack, or use a ranged option from your Pack.'} Your equipped weapon: ${s.equipped==='alternate'?(s.classId==='fighter'?'Javelin':s.classId==='rogue'?'Shortbow':'Staff'):hero().weapon}.</p><button class="secondary" data-modal="inventory">Pack / change weapon ↗</button><button class="secondary" data-act="tactic:end">End turn without attacking →</button></div>`}<details class="combat-history"><summary>Battle log (${t.log.length})</summary>${t.log.slice(0,20).map(a=>`<p>${esc(a)}</p>`).join('')}</details></div></section>`;
}

function beginBeaconTest(){
 s.finalTest={active:true,phase:'player',round:1,enemyHp:16,enemyMax:16,usedAction:false,usedBonus:false,extraUsed:false,hidden:false,dodging:false,result:null,next:null};
 learn('level');s.stage='beaconTest';s.storyResult=null;s.outcome=null;commit();
}
function beaconPause(title,body,next='player',kind='neutral'){
 const t=s.finalTest;t.phase='result';t.result={title,body,kind};t.next=next;record(title+': '+body,'combat');commit();
}
function beaconAction(action){
 const t=s.finalTest;if(!t||t.phase!=='player')return;
 if(action==='surge'&&s.classId==='fighter'&&s.actionSurge>0&&t.usedAction&&!t.extraUsed){s.actionSurge--;t.extraUsed=true;t.usedAction=false;beaconPause('Action Surge','You gain one additional non-Magic Action this turn. Choose another Attack.','player','heal');return;}
 if(action==='hide'&&s.classId==='rogue'&&s.level>=2&&!t.usedBonus){const d=rand(20),total=d+hero().skills.stealth;t.usedBonus=true;t.hidden=total>=15;beaconPause(t.hidden?'You vanish into the beacon light':'The echo follows your movements',`Cunning Action: d20 ${d} + ${hero().skills.stealth} = ${total} against DC 15. ${t.hidden?'Your next finesse attack has advantage and qualifies for Sneak Attack.':'Try attacking or ending your turn.'}`,'player','defended');return;}
 if(action==='potion'&&!t.usedBonus&&s.potions>0&&s.hp<maxHp()){const before=s.hp;s.hp=Math.min(maxHp(),s.hp+rand(4)+rand(4)+2);s.potions--;t.usedBonus=true;beaconPause('Potion of Healing',`Bonus Action restores ${s.hp-before} HP (${before} → ${s.hp}).`,'player','heal');return;}
 if(action==='wind'&&!t.usedBonus&&s.classId==='fighter'&&s.secondWind>0&&s.hp<maxHp()){const before=s.hp;s.hp=Math.min(maxHp(),s.hp+rand(10)+s.level);s.secondWind--;t.usedBonus=true;beaconPause('Second Wind',`You regain ${s.hp-before} HP without spending your Action.`,'player','heal');return;}
 if(action==='end'){beaconPause('You steady your stance','The echo prepares to demonstrate its next move.','enemy');return;}
 if(t.usedAction)return;
 if(action==='dodge'){t.dodging=true;t.usedAction=true;beaconPause('You Dodge','The echo has disadvantage on its next attack.','player','defended');return;}
 let damage=0,body='';
 if(action==='missile'&&s.classId==='wizard'&&s.slots>0&&!t.extraUsed){s.slots--;damage=rand(4)+rand(4)+rand(4)+3;body=`Magic Missile: three darts automatically deal ${damage} force damage. One spell slot spent.`;}
 else if(action==='attack'){
  const d1=rand(20),d2=t.hidden?rand(20):null,d=d2===null?d1:Math.max(d1,d2),crit=d===20,hit=crit||(d!==1&&d+hero().attack>=12);
  damage=hit?rand(hero().damageDie)+(crit?rand(hero().damageDie):0)+hero().damageMod:0;
  if(hit&&s.classId==='rogue'&&t.hidden){damage+=rand(6)+(crit?rand(6):0);learn('sneak');}
  body=`${hero().attackName}: d20 ${d1}${d2===null?'':' / '+d2+' → '+d} + ${hero().attack} against AC 12. ${hit?'Hit for '+damage+' damage.':'Miss.'}`;
 }else return;
 t.hidden=false;t.usedAction=true;t.enemyHp=Math.max(0,t.enemyHp-damage);
 beaconPause(t.enemyHp===0?'You pass the beacon test':'Your action resolves',`${body} Echo HP ${t.enemyHp}/${t.enemyMax}.`,t.enemyHp===0?'win':'player',damage?'damage':'neutral');
}
function beaconContinue(){
 const t=s.finalTest;if(!t||t.phase!=='result')return;const next=t.next;t.result=null;t.next=null;
 if(next==='win'){s.finalTest=null;s.flags.beaconPassed=true;s.stage='levelup';outcome('You earned the echo’s respect','The echo kneels and the path opens. You demonstrated how your class abilities can shape the same encounter differently.',true);commit();return;}
 if(next==='enemy'){
  const a=rand(20),b=t.dodging?rand(20):null,d=b===null?a:Math.min(a,b),hit=d===20||(d!==1&&d+3>=hero().ac),damage=hit?rand(4)+1:0;
  const before=s.hp;s.hp=Math.max(1,s.hp-damage);t.dodging=false;
  beaconPause(hit?'The echo strikes!':'The echo misses',`d20 ${a}${b!==null?' / '+b+' → '+d+' (disadvantage)':''} + 3 against AC ${hero().ac}. ${hit?'You take '+(before-s.hp)+' nonlethal damage.':'The echo misses.'}`,'round',hit?'hurt':'defended');return;
 }
 if(next==='round'){t.round++;t.usedAction=false;t.usedBonus=false;t.extraUsed=false;}
 t.phase='player';commit();
}
function renderBeaconTest(){
 const t=s.finalTest, r=t.result;
 return `<section class="story-screen"><div class="combat-banner"><span>CHAPTER 8 · LEVEL-2 CHALLENGE</span><h2>The Beacon’s Echo</h2><p>Demonstrate your class features; the echo will stop before you fall unconscious.</p></div><div class="combat-body"><div class="tactical-hps"><div class="tactical-health ally"><span>♥ ${esc(s.heroName)}</span><strong>${s.hp}/${maxHp()} HP</strong><div><i style="width:${100*s.hp/maxHp()}%"></i></div></div><div class="tactical-health foe"><span>✦ Echo</span><strong>${t.enemyHp}/${t.enemyMax} HP</strong><div><i style="width:${100*t.enemyHp/t.enemyMax}%"></i></div></div></div>${r?`<div class="tactical-result ${r.kind}"><span class="small-caps">ROUND ${t.round} · ACTION RESULT</span><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p><button class="primary" data-act="beacon:continue">Continue →</button></div>`:`<div class="tactical-actions"><strong>YOUR TURN · ROUND ${t.round}</strong><p>${t.usedAction?'Your main Action is spent; you can end the turn or use an available class feature.':'Choose an Action. Bonus Actions are optional.'}</p><div class="practice-buttons"><button data-act="beacon:attack" ${t.usedAction?'disabled':''}>⚔ Attack</button>${s.classId==='wizard'?`<button data-act="beacon:missile" ${t.usedAction||s.slots<=0?'disabled':''}>✦ Magic Missile (${s.slots})</button>`:''}<button data-act="beacon:dodge" ${t.usedAction?'disabled':''}>◇ Dodge</button>${s.classId==='fighter'&&s.actionSurge>0?`<button data-act="beacon:surge" ${!t.usedAction||t.extraUsed?'disabled':''}>Action Surge (${s.actionSurge})</button>`:''}${s.classId==='rogue'?`<button data-act="beacon:hide" ${t.usedBonus?'disabled':''}>Cunning Hide</button>`:''}${s.classId==='fighter'?`<button data-act="beacon:wind" ${t.usedBonus||s.secondWind<=0||s.hp>=maxHp()?'disabled':''}>Second Wind</button>`:''}<button data-act="beacon:potion" ${t.usedBonus||s.potions<=0||s.hp>=maxHp()?'disabled':''}>Healing potion</button><button data-act="beacon:end">End turn →</button></div></div>`}</div></section>`;
}
function campaignEvent(action){
 if(action.startsWith('beacon:')){const key=action.split(':')[1];if(key==='continue')beaconContinue();else beaconAction(key);return true;}
 if(action==='enterForest'){campaignAct(action);return true;}
 if(action==='mind:use'||action==='mind:accept'){resolveTacticalMind(action==='mind:use');return true;}
 if(action==='mode:guided'||action==='mode:tabletop'){s.mode=action.split(':')[1];commit(false);return true;}
 if(action.startsWith('checkpoint:')){
  const n=Number(action.split(':')[1]),snapshot=s.checkpoints[n];
  if(!snapshot||!confirm(`Start Chapter ${n} in a separate replay timeline? Your main campaign stays unchanged.`))return true;
  if(!s.replay){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));}catch(e){alert('Unable to preserve your main save. Replay canceled.');return true;}}
  const snapshots=s.checkpoints,oldMode=s.mode;
  s=upgradeSave(validateSave(JSON.parse(JSON.stringify({...snapshot,version:1}))));
  s.replay={chapter:n};s.checkpoints=Object.fromEntries(Object.entries(snapshots).filter(([k])=>Number(k)<=n));
  s.mode=oldMode;s.stage=CHAPTER_START[n]||s.stage;s.storyResult=null;s.pending=null;s.tactics=null;s.practice=null;
  modal=null;record(`Started a safe replay of Chapter ${n}.`);commit();return true;
 }
 if(action.startsWith('quiz:')){const [,id,index]=action.split(':'),q=QUIZZES[id];if(q&&s.learned[id]){const correct=Number(index)===q[3];s.quizFeedback={id,correct};if(correct)s.mastery[id]=true;commit(false);}return true;}
 if(action.startsWith('rest:')){if(!s.restSession||!s.storyResult)return true;
   if(action==='rest:finish'){s.restSession=null;commit(false);return true;}
   if(action==='rest:spend'&&s.hitDice>0&&s.hp<maxHp()){
    const dieType={fighter:10,rogue:8,wizard:6}[s.classId],r=rand(dieType),con=Math.floor((hero().stats.CON-10)/2),heal=Math.max(1,r+con),before=s.hp;
    s.hp=Math.min(maxHp(),s.hp+heal);s.hitDice--;s.restSession.spent++;s.restSession.total+=s.hp-before;
    s.storyResult.title='You spend a Hit Die';s.storyResult.body=`Hit Die d${dieType}: ${r} ${signed(con)} CON = ${heal} healing. HP ${before} → ${s.hp}. You may spend another if you have dice and missing HP.`;s.storyResult.hpBefore=before;s.storyResult.hpAfter=s.hp;
    record(s.storyResult.body,'roll');commit(false);
   }return true;}
 if(action.startsWith('item:')){const item=action.split(':')[1];if(item==='potion'&&!s.storyResult&&!s.pending&&s.stage!=='combat'&&s.stage!=='crossingBattle'&&usablePotion()){modal=null;commit();}else if(item==='rations'&&s.inventory.rations>0){s.inventory.rations--;learn('inventory');record('You eat a ration. Food replenishes your energy narratively; it does not restore HP.');commit(false);}else if(item==='torch'){s.flags.torchLit=!s.flags.torchLit;learn('inventory');record(s.flags.torchLit?'You light a torch.':'You extinguish the torch.');commit(false);}else if(item==='equip'){s.equipped=s.equipped==='alternate'?'primary':'alternate';learn('inventory');commit(false);}else if(item==='smoke'&&s.stage==='crossingBattle'){modal=null;tacticalAction('smoke');}return true;}
 if(action.startsWith('tactic:')){
  const key=action.split(':')[1];
  if(key==='continue')advanceTactical();
  else if(key==='end'&&s.tactics?.phase==='player')tacticalResult('You hold position','You end your turn without attacking. The sentry will act next.',{next:'enemy'});
  else tacticalAction(key);return true;
 }
 if(action.startsWith('tile:')){const [_,xx,yy]=action.split(':');tacticalMove(Number(xx),Number(yy));return true;}
 if(action.startsWith('practice:')){
  const key=action.split(':')[1];let p=s.practice||{};
  if(key==='reset'){s.practice=null;commit(false);return true;}
  if(key==='combat'){s.practice={mode:'duel',phase:'player',round:1,heroHp:maxHp(),enemyHp:18,usedAction:false,usedBonus:false,surged:false,hidden:false,dodging:false,text:'The training sentry approaches. You act first.',math:'',next:null};commit(false);return true;}
  if(key==='check'){const d=rand(20),bonus=hero().skills.perception,total=d+bonus;s.practice={mode:'check',text:`Perception check: d20 ${d} ${signed(bonus)} = **${total}** vs DC 13 → **${total>=13?'success':'failure'}**.`};learn('checks');commit(false);return true;}
  if(key==='spell'){const d=rand(20),save=d+2;s.practice={mode:'spell',text:`A tutor casts Burning Hands. Target saves: d20 ${d} + 2 = ${save} against DC 13 → **${save>=13?'half damage':'full damage'}**. A spell attack would instead roll against the target’s AC.`};learn('spells');commit(false);return true;}
  if(p.mode!=='duel')return true;
  if(key==='continue'&&p.phase==='result'){
   const next=p.next;p.next=null;p.phase='player';p.math='';
   if(next==='done'){p.text='You completed the practice fight. Restart to train again.';p.phase='done';}
   else if(next==='enemy'){
    const a=rand(20),b=p.dodging?rand(20):null,die=b===null?a:Math.min(a,b),hit=die===20||(die!==1&&die+2>=hero().ac),dmg=hit?rand(4)+(die===20?rand(4):0):0;
    p.heroHp=Math.max(0,p.heroHp-dmg);p.dodging=false;
    p.text=hit?`The sentry hits for ${dmg} damage.`:'The sentry misses.';
    p.math=`d20 ${a}${b!==null?' / '+b+' → '+die+' (disadvantage)':''} + 2 vs AC ${hero().ac}`;
    p.next='round';p.phase='result';
   }else if(next==='round'){
    p.round++;p.usedAction=false;p.usedBonus=false;p.surged=false;p.surgeOnly=false;p.text='New round — decide how to use your Action and Bonus Action.';
   }
   s.practice=p;commit(false);return true;
  }
  if(p.phase!=='player'||p.heroHp<=0||p.enemyHp<=0)return true;
  if(key==='end'){p.text='You end your turn. The sentry acts next.';p.math='';p.phase='result';p.next='enemy';}
  else if(key==='surge'&&s.classId==='fighter'&&s.level>=2&&p.usedAction&&!p.surged){p.usedAction=false;p.surged=true;p.surgeOnly=true;p.text='Action Surge adds one non-Magic Action to this same turn. Choose another Attack, Dodge, or other available nonmagical Action.';p.math='';p.phase='result';p.next='player';learn('level');}
  else if(key==='hide'&&s.classId==='rogue'&&s.level>=2&&!p.usedBonus){const d=rand(20);p.hidden=d+hero().skills.stealth>=15;p.usedBonus=true;p.text=`Cunning Action: Hide as a Bonus Action. d20 ${d} + ${hero().skills.stealth} = ${d+hero().skills.stealth}. ${p.hidden?'You are concealed and your next attack has advantage.':'The sentry notices you.'}`;p.phase='result';p.next='player';learn('sneak');}
  else if(key==='heal'&&!p.usedBonus&&p.heroHp<maxHp()){const h=rand(4)+rand(4)+2,before=p.heroHp;p.heroHp=Math.min(maxHp(),p.heroHp+h);p.usedBonus=true;p.text=`Potion: +${p.heroHp-before} HP (${before} → ${p.heroHp}). Your Action remains available.`;p.phase='result';p.next='player';}
  else if(key==='dodge'&&!p.usedAction){p.usedAction=true;p.dodging=true;p.text='Dodge uses your Action: the enemy rolls with disadvantage against you.';p.phase='result';p.next='player';}
  else if((key==='attack'||key==='missile')&&!p.usedAction){
   const wizard=s.classId==='wizard';if(key==='missile'&&!wizard)return true;if(key==='missile'&&p.surgeOnly)return true;
   const before=p.enemyHp;let damage=0;
   if(key==='missile'){damage=rand(4)+rand(4)+rand(4)+3;p.text=`Magic Missile strikes automatically for ${damage} force damage. Practice uses no campaign spell slots.`;p.math='Three darts × (1d4 + 1)';learn('slots');}
   else{const a=rand(20),b=p.hidden?rand(20):null,d=b===null?a:Math.max(a,b),crit=d===20,hit=crit||(d!==1&&d+hero().attack>=12);
    damage=hit?rand(hero().damageDie)+(crit?rand(hero().damageDie):0)+hero().damageMod:0;
    if(hit&&s.classId==='rogue'&&p.hidden){damage+=rand(6)+(crit?rand(6):0);learn('sneak');}
    p.math=`d20 ${a}${b===null?'':' / '+b+' → '+d} + ${hero().attack} vs AC 12${crit?' · CRITICAL':''}`;
    p.text=hit?`Attack hits for ${damage} damage.${s.classId==='rogue'&&p.hidden?' Sneak Attack applied.':''}`:'Your attack misses.';
   }
   p.enemyHp=Math.max(0,before-damage);p.hidden=false;p.usedAction=true;p.phase='result';p.next='player';
   if(p.enemyHp===0){p.text+=' Training victory!';p.next='done';}
  }
  s.practice=p;commit(false);return true;
 }
 return false;
}
// A detailed roll result always follows action resolution; chapter 8 then has an epilogue choice.
const oldContinueStory=continueStory;
// The original continues unchanged. The final Chapter 8 challenge transitions after its result.

s=load();
render();
})();
