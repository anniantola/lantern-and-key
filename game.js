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
const TITLES = {tavern:'The Forgotten Tavern',tavernHub:'A Question of Trust',stranger:'The Hooded Traveler',keeper:'The Tavern Keeper',door:'The Locked Door',passage:'Beneath the Floorboards',passageChoice:'The Pressure Plates',vault:'The Chamber of Echoes',vaultAlert:'The Warden Stirs',combat:'The Echo Warden',reveal:'The Last Lantern',ending:'The Road Ahead',defeat:'A Temporary Setback',forest:'A Night in Blackwood',camp:'The Woodland Camp',trail:'Into the Trees',crossing:'The Broken Crossing',crossingBattle:'The Bridge Skirmish',crossingAfter:'The Other Bank',village:'Briar Hollow',market:'The Market Square',witness:'The Miller’s Testimony',council:'The Council Meeting',trial:'The Arcane Trial',archive:'The Spell Archive',altar:'The Trial of Focus',ascent:'The Beacon Road',levelup:'Becoming an Adventurer',epilogue:'Beyond the Lantern',beaconTest:'The Beacon Test',lanternOath:'The Lightkeeper’s Choice'};
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
const hero = () => {
 const base=CLASSES[s.classId] || CLASSES.fighter;
 if((s?.level||1)<4)return {...base,ac:base.ac+Number(s?.frontier?.gear?.armor||0)};
 const primary={fighter:'STR',rogue:'DEX',wizard:'INT'}[s.classId]||'STR';
 const stats={...base.stats,[primary]:base.stats[primary]+2};
 const skills={...base.skills};
 for(const skill of (s.classId==='fighter'?['athletics']:s.classId==='rogue'?['stealth','sleight']:['arcana','investigation']))skills[skill]++;
 return {...base,stats,skills,attack:base.attack+1,damageMod:base.damageMod+(s.classId==='wizard'?0:1),dexSave:base.dexSave+(s.classId==='rogue'?1:0),ac:base.ac+Number(s.frontier?.gear?.armor||0)};
};
const carriesLantern = () => s?.ending==='take' && s?.inventory?.lantern===1;
const lanternSparks = () => carriesLantern() ? s.lanternSparks||0 : 0;
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
 const leads={
  stranger:'You cross the tavern to the traveler’s table. Around you, conversations falter and resume; the stranger is studying a faded map of the road that disappears into Blackwood.',
  keeper:'Mira waits until you are near the counter before she sets aside her cup. You can see the strain of someone guarding a secret that has ceased to feel safe.',
  door:'The cellar door stands just beyond the counter. Its three-eyed wolf emblem matches the road markings on the traveler’s old map.'
 };
 outcome('You follow the next lead',leads[stage]||`You make your way toward ${TITLES[stage].toLowerCase()}.`);
 commit();
}
function begin() {
 const cls = document.querySelector('input[name="classChoice"]:checked')?.value || 'fighter';
 const name=(document.querySelector('#heroName')?.value||'').trim().slice(0,28) || DEFAULT_NAME[cls];
 s=upgradeSave({...initialSave(),stage:'tavern',heroName:name,classId:cls,hp:CLASSES[cls].hp,slots:CLASSES[cls].spellSlots});
 s.checkpoints[1]=JSON.parse(JSON.stringify({...s,checkpoints:{}}));record(`${name} the ${CLASSES[cls].name} enters the Forgotten Tavern.`); commit();
}
function skillBonus(skill) { if(skill==='survival')return Math.floor((hero().stats.WIS-10)/2); if(skill==='dexsave') return hero().dexSave; if(skill==='consave') return Math.floor((hero().stats.CON-10)/2)+(s.classId==='fighter'?2:0); if(skill==='thieves') return s.classId==='rogue'?5:null; return (hero().skills[skill]??0)+(s.level>=2&&s.classId==='wizard'&&skill===s.scholarSkill?2:0); }
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
 wardSneak:{name:'Dexterity (Stealth)',skill:'stealth',dc:14,why:'Use pillars as cover and slip past the guardian.'},
 improviseBeacon:{name:'Intelligence (Investigation)',skill:'investigation',dc:13,why:'Repair the delicate lantern mechanism without its missing silver key.'}
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
 s.checks.push(roll); rememberChoice(c.key); s.actionCue=c.actionCue||{label:c.why,fromStage:s.stage,hpBefore:s.hp}; s.pending=null;
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
 case 'improviseBeacon':s.flags.triedBeaconRepair=true;
  if(win){s.flags.repairedWithoutKey=true;finish('restore',roll);}
  else apply('The mechanism will not turn','You locate the missing key’s socket, but cannot align its delicate contacts without a proper tool. You can still decide what to do with the lantern.','reveal');
  break;
 }
}
function act(key) {
 if(s.pending||s.storyResult) return;
 if(campaignAct(key))return;
 const selected=scene().choices.find(c=>c.key===key && availableStoryChoice(c));
 if(SINGLE_USE_STORY_ACTIONS.has(key)&&!selected)return;
 s.actionCue={label:selected?.title||({retryFight:'Retry the encounter',stepIn:'Continue through the corridor',advanceHall:'Advance down the corridor'}[key])||key,fromStage:s.stage,hpBefore:s.hp};
 switch(key) {
 case 'observe':case 'keeperIntro':case 'insightIntro':case 'strangerTrust':case 'keeperHelp':case 'sneakDoor':case 'forceDoor':case 'inspectDoor':case 'pickDoor':case 'scanHall':case 'disarmTrap':case 'trapSave':case 'runTrap':case 'studyRunes':case 'wardTalk':case 'wardSneak':case 'improviseBeacon':startCheck(key);return;
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
 case 'restore':if(!s.flags.key)return;finish('restore');return;
 case 'take':finish('take');return;
 case 'return':finish('return');return;
 case 'retryFight':s.hp=Math.max(s.hp,Math.ceil(maxHp()/2));s.potions=Math.max(s.potions,1);s.slots=Math.max(s.slots,s.classId==='wizard'?1:0);if(s.flags.defeatSource==='trap'){s.flags.triggeredTrap=false;s.flags.trapPassed=false;s.stage='passageChoice';outcome('Another chance','You catch your breath and approach the corridor again. This time you can choose a different approach.');commit();}else{s.flags.weakness=true;setupCombat('A moment passes. You gather your courage and try the encounter again. This time you notice an opening in the guardian’s defense.');}return;
 }
}
function finish(which,roll=null){
 s.ending=which;s.stage='ending';let title,desc;
 // This is a real inventory decision, not merely an ending label.
 // Store the unique story artifact so Pack and later chapters reflect the choice.
 s.inventory.lantern=which==='take'?1:0;
 s.lanternSparks=which==='take'?3:0;
 if(which==='take'){learn('inventory');learn('artifact');}
 if(which==='restore'){title='The lantern shines again';const repair=s.flags.repairedWithoutKey?'You carefully align the mechanism by hand, in place of the missing silver key.':'You place the silver key in the lantern’s socket.';desc=repair+' Blue light floods the chamber. '+(s.flags.victory?'The Warden’s scattered dust glimmers for a moment; its last request to keep the light alive has been answered.':'The guardian bows as warmth returns to the forgotten vault.');}
 else if(which==='take'){title='A dangerous souvenir';desc='You lift the enchanted lantern and wrap it carefully in your cloak. Its fading glow follows you into the night. '+(s.flags.victory?'Only the Warden’s silent remains are left behind.':'The Warden watches without moving.')+' For the first time, you wonder how many other roads depend on lights like this one—and whether taking it makes you their keeper, or merely their newest traveler.';}
 else{title='A promise kept';desc='You return upstairs and entrust the lantern to the hooded traveler. They take it with trembling hands. “You have given us a chance,” they whisper. Mira clears a space near the hearth while the traveler spreads an old road map across the table. Caring for one flame will require many more hands.';}
 outcome(title,desc,roll?true:null,roll);record(`Adventure completed: ${which}.`);commit();}
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
function art(stage) { if(WORLD_ART[stage])return WORLD_ART[stage]; if(CAMPAIGN_ART[stage])return CAMPAIGN_ART[stage]; return stage==='tavern'||stage==='tavernHub'||stage==='stranger'||stage==='keeper'||stage==='door'?'tavern':stage==='passage'||stage==='passageChoice'?'passage':'vault'; }
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
 case 'reveal':return {chapter:3,label:'THE LAST LANTERN',heading:'The lantern is fading',text:['At last, you stand before the ancient light. The blue flame seems to recognize you.','On the pedestal, a carved message reads: **“What is guarded must also be cared for.”**','The lantern is not a treasure to be won. It is a beacon that keeps the surrounding woods safe. The silver key can restore its failing mechanism; without it, you would have to attempt a delicate repair.'],lesson:'Good adventures give you choices that matter beyond winning a fight. Your character can decide what they value—and live with the consequences.',choices:[s.flags.key?choice('restore','Use the silver key to restore the beacon','Repair the lantern with the key you earned.','✦'):null,!s.flags.key&&!s.flags.triedBeaconRepair?choice('improviseBeacon','Try to repair the lantern without the key','Investigation DC 13 · risk an unsuccessful repair','◎'):null,choice('return','Take the lantern to the traveler','Trust someone else to care for the beacon.','◇'),choice('take','Keep the mysterious lantern','Carry its secrets into your next adventure.','↝')].filter(Boolean)};
 default:return {chapter:3,label:'THE END',heading:'Your story continues',text:[],choices:[]};
 }
}
function renderWelcome() {
 return `<div class="welcome"><div class="welcome-hero"><div class="welcome-overlay"><div class="eyebrow">AN INTERACTIVE FANTASY CAMPAIGN <span class="dot"></span> VERSION 3.1</div><div class="ornament">✧ &nbsp; ◇ &nbsp; ✧</div><h1>Lantern <em>&</em> Key</h1><p class="welcome-subtitle">A world of dice, allies, hidden roads and consequences.</p><div class="intro-tags"><span>◈ Solo adventure</span><span>♧ Learn as you play</span><span>◷ 16 chapters</span></div></div></div>
 <div class="welcome-content"><div class="section-top"><span class="tiny-index">01 / THE HERO</span><h2>Who walks into the tavern?</h2><p>Start with a ready-to-play level 1 character. Learn the rules in the eight-chapter opening act, then continue into a wider regional campaign.</p></div>
 <div class="class-grid">${Object.entries(CLASSES).map(([id,c],i)=>`<label class="class-card"><input type="radio" name="classChoice" value="${id}" ${i===0?'checked':''}/><div class="class-inner"><span class="class-icon">${c.icon}</span><span class="class-name">${c.name}</span><span class="class-tag">${c.tag}</span><span class="class-desc">${c.description}</span><span class="class-stats">${c.hp} HP <span>·</span> ${c.ac} AC</span><span class="class-select">Choose ${c.name} <span aria-hidden="true">↗</span></span></div></label>`).join('')}</div>
 <div class="name-row"><label for="heroName">CHARACTER NAME <span>(optional)</span></label><input id="heroName" maxlength="28" autocomplete="off" placeholder="Choose a name or use the default"/></div>
 <button class="primary big" data-act="begin">Begin your adventure <span>→</span></button><p class="fine-print">No account. No AI subscription. Progress saves on this device automatically.</p>
 <div class="welcome-footer"><span>HOW THIS WORKS</span><p>Choose actions, roll a virtual d20 when prompted, and discover why each rule matters. This is an original, guided teaching adventure—not a complete replacement for a tabletop Dungeon Master.</p><button class="inline-link" data-modal="rules">Browse the beginner rules ↗</button></div></div></div>`;
}
function renderSidebar() {
 const h=hero(); const c=s.combat;
 return `<aside class="sidebar"><div class="side-card character"><div class="side-head"><span class="small-caps">YOUR CHARACTER</span><span class="level-tag">LVL ${s.level||1}</span></div><div class="avatar">${h.icon}</div><h3>${esc(s.heroName)}</h3><p class="side-class">${h.name} <span>·</span> Adventurer</p><div class="health-row"><div class="health-heading"><span>HIT POINTS</span><strong>${s.hp} / ${maxHp()}</strong></div><div class="health-track"><span style="width:${100*s.hp/maxHp()}%"></span></div></div><div class="stat-columns"><div><span class="stat-num">${h.ac}</span><span class="stat-label">ARMOR CLASS</span></div><div><span class="stat-num">${signed(h.attack)}</span><span class="stat-label">ATTACK BONUS</span></div><div><span class="stat-num">+2</span><span class="stat-label">PROFICIENCY</span></div></div><div class="sidebar-section"><div class="small-caps">ABILITY SCORES <span class="question" title="The modifier is what you usually add to a roll.">?</span></div><div class="abilities">${Object.entries(h.stats).map(([key,score])=>`<div><span>${key}</span><strong>${score}</strong><small>${signed(Math.floor((score-10)/2))}</small></div>`).join('')}</div></div>${s.unlocked>=9?`<div class="sidebar-section"><div class="small-caps">WATCHROAD COMPANY</div><div class="resource"><span>Gold pieces</span><strong>${world().gold} gp</strong></div><div class="resource"><span>Active allies</span><strong>${world().active.length}/2</strong></div><button class="side-action" data-modal="worldmap">Open road map →</button></div>`:''}<div class="sidebar-section"><div class="small-caps">PACK & RESOURCES</div><div class="resource"><span>⚗ Healing potion</span><strong>× ${s.potions}</strong></div>${s.classId==='wizard'?`<div class="resource"><span>✦ Level-1 slots</span><strong>${s.slots} / ${s.level>=3?4:s.level===2?3:2}</strong></div>${s.level>=3?`<div class="resource"><span>✦ Level-2 slots</span><strong>${world().slots2} / ${s.level>=4?3:2}</strong></div>`:''}`:''}<div class="resource"><span>${s.flags.key?'✧':'◇'} Silver wolf-key</span><strong>${s.flags.key?'Found':'—'}</strong></div>${s.classId==='fighter'?`<div class="resource"><span>✚ Second Wind</span><strong>${s.secondWind} / ${s.level>=4?3:2}</strong></div>`:''}<div class="resource"><span>◈ Hit Dice</span><strong>${s.hitDice} / ${s.level||1}</strong></div></div><button class="side-action" data-modal="sheet">View full character sheet →</button><button class="side-action" data-modal="inventory">Open inventory →</button></div>
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
// Long-form narrative is presentation-only: it observes established flags and never
// changes choices, dice outcomes, resources, or save structure. Old saves gain it too.
function narrativeDetail(stage) {
 const f=s.flags||{}, kept=carriesLantern();
 const details={
  tavern:[
   'The Forgotten Tavern stands where the old watchroad once met the merchant road. In better years, wayfarers followed blue lamps through Blackwood; these days the lamps have gone dark one by one. Even the locals disagree about who kept them burning.',
   'Behind the counter, Mira watches the storm with the distracted patience of someone waiting for a visitor who is already late. Each time the wind rattles the cellar door, her hand moves toward a ring of keys she no longer wears.'
  ],
  tavernHub:[
   f.key?'The wolf-shaped key now rests in your possession. The traveler watches you carefully, hoping you understand what its trust requires.':f.sawKey?'The traveler keeps one hand closed around the wolf-shaped key; they have noticed your interest but have not yet asked you to leave.':'The stranger folds a rain-damp map with the practiced care of someone trying to keep a journey secret.',
   'Mira sets a fresh candle by the cellar door. Its flame turns blue for half a heartbeat, then ordinary gold. The tavern conversations continue, but nobody seems eager to explain what you saw.'
  ],
  stranger:[
   'On the table lies a weathered map. Its road markings do not match any modern milestone: tiny circles connect the tavern, a bridge, a village, and a final point high among the mountains.',
   f.key?'The traveler is relieved that you now carry the key, though they remind you that a key opens a door; it does not decide what you should do beyond it.':'“My family once answered the watchlights,” the traveler says quietly. “Now people remember the stories but not the work. I came because the last light below this tavern is weakening.”'
  ],
  keeper:[
   'Mira explains that the cellar was here before her grandmother inherited the inn. In the old days, every keeper on the road had a duty: leave bread for travelers, shelter those caught by the weather, and report when a blue waylight dimmed.',
   '“No one delivers those reports anymore,” she adds. “The road grew quiet, the posts were abandoned, and everyone assumed someone else would keep watch.”'
  ],
  door:[
   'The wolf bears three eyes, one turned toward the road, one toward the house, and one toward the dark beneath the earth. Under the handle, generations of nervous thumbs have polished the oak smooth.',
   f.alerted?'Something heavy scrapes far below. The noise you made has not gone unanswered.':'When you bring your ear close, you hear the slow, steady ticking of a machine rather than a voice. Whatever waits inside has endured longer than the tavern above it.'
  ],
  passage:[
   'The steps were built for people carrying supplies, not treasure: there are shallow grooves where wooden crates were dragged down, and tiny blue tiles set at regular intervals to guide a lantern bearer.',
   'One cracked tablet names the road beyond the tavern and warns that a light left unattended is a danger to everyone who trusts it. The last words have been worn away by water.'
  ],
  passageChoice:[
   f.trapSeen?'Beside the mechanism you notice a maker’s inscription: these stones were intended to close the passage during an emergency, not hunt careless travelers. The old safeguard has become a hazard without anyone to maintain it.':'The carved blocks above the corridor appear to be part of an old security system. A cautious traveler would want to know who was meant to be kept out—and why no one now tends the machinery.',
   f.triggeredTrap?'Dust falls in thick sheets as the ancient counterweight tears free. For a moment you understand why Mira was so reluctant to open this door.':'From beyond the corridor comes a sound like a distant bell under water. Each pulse grows weaker.'
  ],
  vault:[
   'An inscription circles the floor: **A light is a promise between the watcher and the traveler.** Beneath the words are the shapes of a bridge, a mill wheel, and a mountain ridge. This chamber once belonged to a much larger chain of waystations.',
   f.peaceful?'The guardian lowers its arms, but it does not look at ease.':'The Warden watches your hands, not your weapon. It was made to distinguish care from theft, though age and long silence may have made its judgment less certain.'
  ],
  vaultAlert:[
   'The great chamber rings with the guardian’s footfalls. Each movement sends dust drifting from centuries-old mosaics of travelers finding their way by a line of blue lights.',
   'There is still space between you and the Warden. Whatever you do next will be understood as a choice, not a misunderstanding.'
  ],
  reveal:[
   'A narrow brass ring around the lantern holds several empty sockets. Beneath the pedestal you find old maintenance records: one keeper repaired the flame, another carried news to the next watch, and a third brought supplies from the village. The light depended on more than magic.',
   f.victory?'The chamber is quiet now. Where the Warden stood, a layer of harmless stone dust settles around the pedestal.':f.peaceful?'The Warden stands aside, its hands lowered in acknowledgment of your promise.':f.sneaked?'You keep to the pillars; the Warden has not noticed you beside the pedestal.':'The chamber is silent except for the weak flame.',
   'Beyond this chamber lie roads whose travelers have forgotten the bargain. You cannot settle every part of that history tonight, but the decision you make here will travel with you into Blackwood.'
  ],
  forest:[
   'The old watchroad crosses a landscape that once depended on the blue waylights. At intervals, iron brackets protrude from the trees, empty now except for moss. Travelers must choose between an uncertain path through the woods and a broken bridge farther east.',
   kept?'The lantern answers the empty brackets with a trembling reflection. Carrying it feels less like owning a prize and more like becoming the person who must decide where its light is needed.':s.ending==='restore'?'Behind you, the tavern’s restored light holds steady. Ahead, the forest still has other neglected waystations; mending one did not mend the whole road.':s.ending==='return'?'The traveler remained to tend the light, trusting you to find out why the road beyond the tavern has been forgotten.':'You left the underground light in the hands of its guardian. Ahead, the problem of the abandoned road remains unsolved.'
  ],
  camp:[
   'Someone placed the standing stones to form a windbreak beside the road, and someone else later carved a small wolf into the tallest one. The carving points travelers toward the bridge. This was once a safe stopping place, maintained by people who expected strangers to arrive.',
   f.lanternWard?'A thin boundary of blue light now rests between the stones. You can see the forest moving beyond it, but the small circle feels held apart from the danger.':f.relocatedCamp?'From the new ledge you can see why the old camp was exposed: animal trails converge below, where the ruined waylight no longer marks safe ground.':'The stones are cold and the surrounding soil is soft with recent rain. Wolves are not monsters in a storybook; they are simply hungry creatures with a reason to avoid or enter a camp.'
  ],
  trail:[
   'Broken glass crunches beneath the moss. The pieces are the same pale blue as the lantern chamber’s tiles, and a few still cling to a rusted post. For a hundred paces the path is obvious, then it vanishes under thorn and rain.',
   f.trailSafe===true?'The safer route you spotted runs beside old drainage ditches. Whoever designed the road knew how quickly these hills could flood.':f.trailSafe===false?'Your detour brings you around a stretch of washed-out paving. The lost time makes the crossing ahead feel more urgent.':'The marks left by earlier travelers make the route possible, if not comfortable. Someone is still using this forgotten road.'
  ],
  crossing:[
   'The guard wears the faded blue thread once used by watchroad couriers. Their left sleeve is tied around a bandaged arm, and a cracked grain seal hangs from the bridge rail. They are protecting the crossing with equipment that has seen too many winters.',
   '“My village sent us stores,” the sentry says without lowering the crossbow. “Nothing came. Then wagons stopped. If I leave this bridge unguarded, whoever takes the road will have nobody to warn them.” Their anger sounds as much like fear as a threat.'
  ],
  crossingAfter:[
   'The torn banner is not merely a village emblem: it marked the deliveries that once supplied the bridge watch. Under its frayed edge you find a stamped tally for grain and lamp oil. Someone was still keeping this post going long after the waylights failed.',
   f.lanternBridge?'The sentry keeps looking back at the blue glow, not with greed but recognition. “If that old light answers you,” they say, “find out who stopped answering us.”':f.bridgeFought?'The struggle is over, but the sentry’s fear was real. You leave knowing that winning a passage does not answer why anyone felt they had to fight for it.':'You are allowed to leave, though the question of the missing deliveries follows you down the road.'
  ],
  village:[
   'Every painted shutter in Briar Hollow carries the same three-eyed wolf you saw beneath the tavern. The villagers once traded flour, lamp oil, and repairs for the watchroad’s protection. Now the watch posts are short of supplies and the town is arguing over whose accounts to believe.',
   'A mill wheel turns slowly beside the river. At the market, sacks are stacked where full stalls used to stand. The shortage has changed more than the harvest feast: people are beginning to suspect neighbors they have known all their lives.'
  ],
  market:[
   'The merchant’s counter holds lists of rope, grain, oil, and blue glass for the old road lamps. Some deliveries are years out of date; others were entered only last week. The watchroad may be forgotten, but its supplies are still being counted.',
   f.marketTruth?'You know one total was altered. The difficult question is who benefits from the altered figures, and what you can prove before the council meets.':'The merchant folds their hands over the newest page whenever a villager passes. Their worry might be guilt, or it might be fear of being blamed.'
  ],
  witness:[
   'The watermill shakes with every turn of the wheel. Flour dust coats a narrow desk beneath a window, where a second ledger lists sacks meant for the bridge watch and oil meant for the road lamps.',
   f.millerTrust?'The worker now knows you have listened without promising an easy answer. They might be willing to stand by what they told you when the council calls.':'The worker looks from the ledger to the door before speaking. Testifying here could cost them work, shelter, and the protection of their neighbors.'
  ],
  council:[
   'The benches are crowded with mill workers, traders, and families whose stores have dwindled. No one cheers your arrival. They have heard enough confident explanations that did not put grain back in the storehouse.',
   'Across the table sits the village treasurer, flanked by those who keep the supply books. The bridge watch has sent no representative; its post is too far away to leave unattended. Your task is to make the people in this room see how their choices reach beyond the walls.'
  ],
  trial:[
   'The school stands on a hill beyond Briar Hollow, built into an older watchtower. Elowen teaches the few students who still study the wards that powered the waylights. The village can debate supplies; she has spent years trying to understand why the beacon system itself has weakened.',
   '“A promise needs people, but it also needs knowledge,” Elowen says as she leads you through a courtyard of broken blue glass. “If you intend to climb to the mountain beacon, you should know what its magic can and cannot do.”'
  ],
  archive:[
   'The archive is full of ordinary things among the magical volumes: bridge repair invoices, travelers’ petitions, inventories of oil, and letters between keepers. The oldest books do not describe the lights as gifts from a king. They describe a network that survived because someone was always willing to do the next necessary task.',
   kept?'Elowen notices the lantern in your pack and pauses. “The light knows the old school,” she says. “That does not mean it belongs to us. We can learn from it without deciding its fate for you.”':'Elowen traces a diagram of a lantern-shaped ward. Even without the original artifact, you can learn why some spells protect a place and others protect a person.'
  ],
  altar:[
   'This room was once used to train the road’s keepers. The practice target is shaped like a cracked beacon lens, and faded chalk marks show where generations of students stood to try the same exercises.',
   'Elowen does not ask you to memorize a list of incantations. Instead she asks what a spell demands of the caster, what it demands of the target, and what happens when the caster is hurt. The distinction matters when real people depend on magic.'
  ],
  ascent:[
   'Beyond the school, the watchroad narrows to a stair cut directly into the mountain. Small niches mark places where signal lamps once carried messages down the valley. The blue flame from the tavern was only one part of a system reaching far beyond the woods.',
   s.flags.villageSolved?'Below, Briar Hollow has begun repairing the damage to its supply route. The people have work ahead of them, but they are no longer waiting for an outsider to do all of it.':'Below, the question of the village supplies remains unsettled. You can still carry what you learned forward; not every human problem yields to one successful roll.'
  ],
  levelup:[
   'The final climb requires you to use what the road has already taught: recognize a danger, choose your approach, and decide when to spend what strength you have left. You are not stronger because a mysterious voice declared you worthy; you have changed through what you chose to do.',
   'High above the clouds, the last watchtower shines faintly against the stone. Its door bears the three-eyed wolf, worn nearly smooth by weather.'
  ],
  beaconTest:[
   'The echo resembles the figures carved at every waystation: neither a soldier nor a king, but a cloaked traveler carrying a light for those behind them. It waits at the threshold where the old road meets the final beacon.',
   '“You have crossed stone, heard the village’s dispute, and studied the flame,” it says. “Strength matters. So does restraint. Show me which of those lessons you will carry onward.”'
  ],
  lanternOath:[
   'Beyond the threshold is a room open to the sky. From here you can see the tavern, the broken crossing, Briar Hollow, and Elowen’s school reduced to points along one winding road. The same wolf sigil marks the beacon’s heart.',
   kept?'The lantern hums in answer. You remember every time you chose to spend a spark, and every time you kept one in reserve. Nobody here can make that decision on your behalf.':'There is no lantern in your hands. Still, the road has shown you that protecting something need not mean possessing it. The people living beneath the beacons will have to decide what they owe one another.'
  ],
  epilogue:[
   'Morning reaches the watchroad from the mountain down. Smoke rises from the tavern chimney; the bridge appears as a fine dark thread; roofs in Briar Hollow catch the first gold light. The road is not suddenly perfect, but it is once again a place where people can imagine traveling.',
   s.flags.villageSolved?'You know that the people of Briar Hollow will remember both the evidence you brought and the work they still owe their neighbors.':'You know that unanswered questions remain in Briar Hollow. Helping a place does not require pretending that every dispute was resolved before you left.'
  ]
 };
 return (details[stage]||[]).filter(Boolean);
}

// Rest timing is per camp visit, not a permanent "has ever rested" flag.
// Older saves without visit-specific fields retain their earlier behavior until the next arrival.
function restedOnThisCampVisit(){return s.flags.campRestedThisVisit===undefined?!!s.flags.longRested:!!s.flags.campRestedThisVisit;}
function interruptedOnThisCampVisit(){return s.flags.campInterruptedThisVisit===undefined?!!s.flags.longInterrupted:!!s.flags.campInterruptedThisVisit;}
// Travel interludes are appended to the action-result card, never shown before Continue.
function storyBridge(from,to){
 const beats={
  'ending>forest':'At the inn door Mira hands you a weather-worn map of the old watchroad. Its ink follows the blue-light stations toward a ruined crossing, the village of Briar Hollow, and a watchtower somewhere above the clouds. “The lamp below was not the only one,” she says. “You should know what the others have been living without.”',
  'forest>camp':'You follow the wolf-marked stones away from the main road. Dusk gathers under the branches, and an abandoned ring of standing stones offers the first shelter you have seen for miles.',
  'camp>trail':restedOnThisCampVisit()?'After a full night of rest, dawn spreads through the forest. Past the standing stones the road is marked by broken brackets where blue lamps once burned.':interruptedOnThisCampVisit()?'With sleep interrupted, you leave the stones under a cold night sky. Broken brackets of old blue lamps mark the way through the dark.':'You leave the standing stones while the forest is still dim. The fading evening light catches broken brackets where blue lamps once burned.',
  'trail>crossing':'The sound of running water rises long before the bridge comes into view. Old courier signs warn travelers to keep their footing and announce themselves to the watch; the stones ahead are cracked and the watch is desperate.',
  'crossingAfter>village':'The banner on the far bank bears a grain tally for the bridge post. You follow its stamped village mark through the fields, hoping someone in Briar Hollow can explain why food meant for the watch never arrived.',
  'village>market':'A child points you toward the merchant’s stall, then asks whether the bridge watch still has anything to eat. The question stays with you as you reach the market.',
  'village>witness':'The mill stands a short walk along the river. Workers avert their eyes when you ask about the missing shipment, but one points silently toward the waterwheel.',
  'market>witness':s.flags.marketTruth?'The figures you noticed in the merchant’s ledger cannot both be true. You go to ask whether the miller has records to explain them.':s.flags.lanternLedger?'The lantern exposed writing beneath the ledger ink. You go to ask the miller what its hidden figures mean.':'You leave the merchant’s stall without a confirmed contradiction. The miller may offer a different perspective on what happened to the missing supplies.',
  'witness>market':s.flags.millerTrust||s.flags.villageEvidence?'You leave the watermill with the smell of damp flour in your clothes and a lead worth comparing against the market records.':'You leave the watermill with questions still unanswered. Perhaps the merchant’s accounts will provide a clearer lead.',
  'village>council':'The hall bell rings before dusk. Arguments spill out through the open door; people have come because their families and the distant bridge watch both need an answer.',
  'market>council':s.flags.marketTruth||s.flags.lanternLedger?'You leave the ledger on the merchant’s counter and head to the hall with questions about its entries. The council will expect an explanation.':'You leave the market and head toward the village hall. Your suspicions alone may not persuade the people gathered there.',
  'witness>council':'The river sounds behind you as you approach the crowded hall. Whatever the miller shared with you, the council must still be persuaded to take responsibility.',
  'trial>archive':'Elowen leads you down a winding stair into a library that holds the practical history of the waylights beside its spellbooks. Here, magic was never separate from the people who tended it.',
  'trial>altar':'The training circle is carved into the stone of an earlier watchtower. Its lines were designed to teach careful use of magic, not display raw power.',
  'archive>altar':'You carry the questions raised by the archives into the demonstration circle: when is power useful, and who bears the cost when it is misused?',
  'altar>ascent':'Elowen presses a hand against the old blue-glass map by the school gate. A thread of light marks the mountain road. “Everything you have learned is preparation for the choices ahead,” she says. You start climbing.',
  'ascent>levelup':'With every turning of the trail you find yourself measuring danger differently. You notice where you could have spent less, asked more, or chosen another path. The climb itself becomes a measure of what you have learned.',
  'levelup>beaconTest':'Above the final bend, a pale figure waits against the beacon’s extinguished glass. It is not another thief or guard; this challenge asks you to demonstrate judgment as well as technique.',
  'lanternOath>epilogue':'The last light reaches outward across the valley. It does not rebuild the bridge or refill a granary by magic. Instead it gives the people below a signal they can answer, with work and trust of their own.'
 };
 return beats[from+'>'+to]||'';
}
function narrativeText(stage,original){
 if(!original?.length)return original||[];
 return [original[0],...narrativeDetail(stage),...original.slice(1)].filter(Boolean);
}
const WORLD_NOTES=[
 [1,'The three-eyed wolf','The sign marks the old watchroad. Its three eyes stand over road, hearth, and darkness; it appears on waystations rather than on a noble family’s banner.'],
 [2,'Why the cellar has a corridor','The passages below the tavern were built as part of a working waystation. Worn crate tracks, blue tiles, and failing safety mechanisms show that the place once needed regular maintenance.'],
 [3,'The chain of waylights','The lantern in the vault belonged to a network of signals, supply stops, and safe crossings. Light alone could not protect a traveler; keepers, roads, and supplies were part of the promise.'],
 [4,'Blackwood’s standing stones','The campsites were maintained for travelers following the watchroad. Even shelter is an inherited piece of infrastructure, and an abandoned site can be dangerous.'],
 [5,'The bridge watch','Couriers and sentries once received village deliveries of grain, oil, and repair materials. The broken crossing reflects both physical damage and a breakdown in trust.'],
 [6,'Briar Hollow’s accounts','The village’s supply records connect daily life to the watchroad. Disputes over deliveries affect real people, even when no monster is responsible.'],
 [7,'Elowen’s school','The school preserves both ward magic and practical records of the waylight keepers. It teaches restraint, maintenance, and the responsibilities that come with power.'],
 [8,'The mountain watchtower','The highest beacon overlooks the same roads and settlements you traveled through. What happens here matters because many people must live with its consequences.']
];
function renderWorldNotes(){
 const reached=Math.max(1,Math.min(16,s.unlocked||1));
 return `<section class="world-notes"><h3>✧ Field notes from the watchroad</h3><p class="muted">Lore discovered by reaching each part of the adventure. These notes never reveal later chapters.</p>${WORLD_NOTES.filter(([number])=>number<=reached).map(([number,title,body])=>`<details><summary><small>CHAPTER ${String(number).padStart(2,'0')}</small> ${esc(title)}</summary><p>${esc(body)}</p></details>`).join('')}</section>`;
}

function renderScene() {
 if(s.mindOffer)return renderMindOffer();
 if(s.storyResult)return renderStoryResult();
 if(s.stage==='crossingBattle')return renderTactics();
 if(s.finalTest?.active)return renderBeaconTest();
 if(WORLD_STAGES[s.stage]&&world().battle?.active)return renderWorldBattle();

 const v=scene();const isSpecial=['ending','defeat'].includes(s.stage);
 if(isSpecial)return renderEnding();
 if(s.stage==='combat')return `<section class="story-screen battle-screen"><div class="chapter-strip"><span>CHAPTER 03</span><div class="chapter-progress"><i class="lit"></i><i class="lit"></i><i class="lit"></i></div><span>THE CHAMBER OF ECHOES</span></div><div class="combat-banner"><span>✦ THE CHAMBER OF ECHOES</span><h2>The Echo Warden awakens</h2><p>Stone grinds against stone. The guardian raises its fists.</p></div><div class="combat-body">${renderCombat()}</div></section>`;
 return `<section class="story-screen"><div class="chapter-strip"><span>CHAPTER ${String(v.chapter).padStart(2,'0')}</span><div class="chapter-progress">${chapterTicks(s.stage)}</div><span>${v.label}</span></div><div class="story-art"><img src="assets/${art(s.stage)}.svg" alt="${({tavern:'A candlelit tavern with a mysterious traveler',passage:'An ancient stone passage',vault:'A blue-glowing underground sanctuary',forest:'A campfire in a moonlit forest',crossing:'An old ruined stone bridge',village:'A lively medieval village market',arcane:'An enchanted library with arcane glyphs',summit:'Adventurers overlooking distant mountains'})[art(s.stage)]||'Fantasy adventure scene'}"/><span class="art-corner">✧ AN ORIGINAL ADVENTURE</span></div><div class="story-body"><span class="tiny-index">${esc(v.label)}</span><h2>${esc(v.heading)}</h2><div class="prose">${narrativeText(s.stage,v.text).map(p=>`<p>${fmt(p)}</p>`).join('')}</div>${renderOutcome()}${s.pending?renderCheck():s.stage==='combat'?renderCombat():`<div class="choice-panel"><div class="choice-label"><span>WHAT DO YOU DO?</span><small>There is no wrong way to be curious.</small></div><div class="choice-list">${v.choices.filter(availableStoryChoice).map((c,i)=>`<button class="choice-btn" data-act="${c.key}" ${c.locked?'disabled':''}><span class="choice-icon">${c.icon}</span><span class="choice-description"><strong>${esc(c.title)}</strong><small>${s.mode==='tabletop'?esc(c.detail.replace(/ · (?:[^·]*?(?:DC|check|advantage|saving throw)[^·]*)/gi,'').replace(/DC \d+/g,'').trim()):esc(c.detail)}</small></span><span class="choice-chevron">↗</span></button>`).join('')}</div></div>${s.mode==='guided'?`<div class="lesson"><div>✦ &nbsp; DM'S NOTE</div><p>${esc(v.lesson||'Your decisions can change the outcome.')}</p></div>`:''}`}</div></section>`;
}
function renderEnding(){const won=s.stage==='ending';const escape=s.ending==='escape';const total=s.checks.length;const successes=s.checks.filter(x=>x.success).length;
 return `<div class="end-screen"><div class="end-art"><img src="assets/vault.svg" alt="A mystical vault with a glowing lantern"/><div class="end-seal">${won&&!escape?'✦':'◇'}</div></div><div class="end-content"><span class="tiny-index">${won?'ADVENTURE COMPLETE':'CHECKPOINT REACHED'}</span><h2>${won?'Your story is just beginning':'Every hero has setbacks'}</h2>${renderOutcome()}<p class="end-main">${won?(escape?'You learned that a retreat is a meaningful choice too. There will be other adventures.':'The tavern slowly returns to silence, but you leave knowing that your choices changed the world, even in a small way.'):'You can safely try the final encounter again. D&D is not about perfection; it is about discovering a story together.'}</p><div class="end-stats"><div><strong>${total}</strong><span>CHECKS MADE</span></div><div><strong>${successes}</strong><span>CHECKS PASSED</span></div><div><strong>${s.journal.filter(x=>x.kind==='combat').length}</strong><span>COMBAT EVENTS</span></div></div>${won?`<div class="next-chapter"><span>✧ &nbsp; WHAT YOU LEARNED</span><p>Exploration, skill checks, difficulty classes, roleplaying, ${s.flags.trapPassed?'saving throws, ':''}${s.flags.victory?'combat, ':''}and how different choices lead to different outcomes.</p></div>`:''}<div class="end-buttons">${!won?`<button class="primary" data-act="retryFight">${s.flags.defeatSource==='trap'?'Retry from the corridor':'Retry encounter with a hint'} <span>↻</span></button>`:''}${won?`<button class="primary" data-act="enterForest">Continue to Chapter 4 — Blackwood <span>→</span></button>`:''}<button class="${won?'secondary':'secondary'}" data-act="restart">Start a new adventure <span>→</span></button><button class="secondary" data-modal="journal">Read your adventure journal</button></div></div></div>`;
}
function renderSheet(){
 const h=hero(),lvl=s.level||1;
 const classFeatures=s.classId==='fighter'
  ?`<div class="resource"><span>Second Wind</span><strong>${s.secondWind} / ${s.level>=4?3:2}</strong></div>${lvl>=2?`<div class="resource"><span>Action Surge</span><strong>${s.actionSurge} / 1</strong></div><p>Level 2: Tactical Mind may turn a failed ability check into success.</p>`:''}<p>Level 1: Fighting Style (preset) and Second Wind.${lvl>=3?' Champion: critical weapon hits on 19–20 in Watchroad encounters.':''} Weapon Mastery is not fully simulated in this tutorial.</p>`
  :s.classId==='rogue'
  ?`<p>Sneak Attack: +${lvl>=3?'2d6':'1d6'} once per turn with a qualifying Finesse attack when you have advantage or the target is distracted by your ally.</p><p>Expertise: Stealth and Sleight of Hand in this preset build.${lvl>=2?' Cunning Action: Dash, Disengage or Hide as a Bonus Action.':''}${lvl>=3?' Thief Fast Hands (adventure-specific distraction).':''}</p>`
  :`<div class="resource"><span>Level-1 spell slots</span><strong>${s.slots} / ${lvl>=3?4:lvl===2?3:2}</strong></div>${lvl>=3?`<div class="resource"><span>Level-2 spell slots</span><strong>${world().slots2} / ${lvl>=4?3:2}</strong></div>`:''}<p>Cantrips cost no spell slots. Arcane Recovery is available once per Long Rest and after a Short Rest.${lvl>=2?' Scholar Expertise: '+(s.scholarSkill?esc(s.scholarSkill):'choose Arcana or Investigation')+'.':''}${lvl>=3?' Evoker training: Shatter costs one level-2 slot.':''}</p>`;
 return `<div class="sheet"><div class="sheet-hero"><span class="sheet-icon">${h.icon}</span><div><strong>${esc(s.heroName)}</strong><p>Level ${lvl} ${h.name} · Training character</p></div></div><div class="sheet-tiles"><div>Hit Points <strong>${s.hp} / ${maxHp()}</strong></div><div>Armor Class <strong>${h.ac}</strong></div><div>Proficiency <strong>+2</strong></div><div>Initiative <strong>${signed(Math.floor((h.stats.DEX-10)/2))}</strong></div><div>Hit Dice <strong>${s.hitDice} / ${lvl}</strong></div><div>Healing potions <strong>${s.potions}</strong></div></div><h4>Ability scores</h4><div class="sheet-abilities">${Object.entries(h.stats).map(([key,n])=>`<div><span>${key}</span><strong>${n}</strong><small>${signed(Math.floor((n-10)/2))}</small></div>`).join('')}</div><h4>Skills used in this adventure</h4><div class="sheet-skills">${Object.entries(h.skills).map(([key])=>`<div><span>${key==='sleight'?'Sleight of Hand':key.charAt(0).toUpperCase()+key.slice(1)}</span><strong>${signed(skillBonus(key))}${lvl>=2&&s.classId==='wizard'&&s.scholarSkill===key?' ★':''}</strong></div>`).join('')}</div><h4>Class features and remaining resources</h4><div class="sheet-features">${classFeatures}${carriesLantern()?`<div class="resource"><span>The Last Lantern · Sparks</span><strong>${lanternSparks()} / 3</strong></div>`:''}</div><p class="muted">These are curated level 1–4 practice builds with selected class features, not complete SRD character sheets. Listed skill bonuses already include proficiency or Expertise where applicable.</p></div>`;
}
function renderModal(){if(!modal)return '';let title,content;
 if(modal==='rules'){title='A pocket rulebook';content=`<p class="modal-lead">The essentials you'll use on this adventure. Tap a topic to expand.</p><div class="glossary">${GLOSSARY.map(([name,text],i)=>`<details ${i===1?'open':''}><summary>${esc(name)}</summary><p>${esc(text)}</p></details>`).join('')}</div><div class="attribution">Based on portions of the <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">System Reference Document 5.2.1</a> by Wizards of the Coast, available under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Rules simplified/adapted for teaching. Not affiliated with or endorsed by Wizards of the Coast.</div>`;}
 else if(modal==='sheet'){title='Character sheet';content=renderSheet();}
 else if(modal==='journal'){title='Adventure journal';content=`<p class="modal-lead">A record of your choices, dice rolls, and discovered history, kept locally on this device.</p>${renderWorldNotes()}<div class="journal-items">${s.journal.length?s.journal.map(entry=>`<div class="journal-entry ${esc(entry.kind)}"><span>✧</span><p>${esc(entry.text)}</p></div>`).reverse().join(''):'<p class="muted">Your journal will fill as you play.</p>'}</div>`;}
 else if(modal==='chapters'){title='Chapter checkpoints';content=renderChapters();}
 else if(modal==='learn'){title='Learning journal';content=renderLearning();}
 else if(modal==='inventory'){title='Equipment & inventory';content=renderInventory();}
 else if(modal==='practice'){title='Practice arena';content=renderPractice();}
 else if(modal==='worldmap'){title='Regional map';content=s.unlocked>=9?renderWorldMap():'<p class="modal-lead">The larger Watchroad map is revealed after Chapter 8. Continue the story to discover it.</p>'; }
 else if(modal==='party'){title='Travel companions';content=s.unlocked>=9?renderParty():'<p class="modal-lead">Travel companions appear when the second act begins. Continue through the tutorial first.</p>'; }
 else if(modal==='settings'){title='Save & settings';content=`<p class="modal-lead">Your progress is saved automatically in this browser. No account or server is involved.</p>${installPanel()}<div class="mode-setting"><strong>Teaching mode</strong><p>Guided shows rules and target numbers before choices. Tabletop hides advance hints, but explains dice results afterward.</p><button class="${s.mode==='guided'?'chosen-mode':''}" data-act="mode:guided">Guided</button><button class="${s.mode==='tabletop'?'chosen-mode':''}" data-act="mode:tabletop">Tabletop</button></div><div class="settings-actions"><button data-act="export">↓ Export save as JSON</button><button data-act="import">↑ Import save from JSON</button><button data-act="restorePreImport" ${localStorage.getItem(PREIMPORT_KEY)?'':'disabled'}>↶ Restore pre-import backup</button><input id="importFile" type="file" accept=".json,application/json" hidden/><button class="danger" data-act="restart">↻ Erase save and start over</button></div><div class="attribution"><strong>Offline play:</strong> After your first successful visit via HTTPS, this app can work offline on supported browsers. Updates are never applied while you are editing or playing without choosing to reload.<br/><br/>Rules adapted from <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">SRD 5.2.1</a> (Wizards of the Coast, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>); original adventure and code. Not an official D&D product.</div>`;}
 return `<div class="modal-backdrop" data-act="closeModalBackdrop"><div role="${s.classId&&s.stage!=='welcome'?'region':'dialog'}" ${s.classId&&s.stage!=='welcome'?'':'aria-modal="true"'} aria-label="${esc(title)}" class="modal"><div class="modal-heading"><div><span class="small-caps">LANTERN & KEY</span><h2>${esc(title)}</h2></div><button class="modal-back-button" data-act="closeModal" aria-label="${s.stage==='welcome'?'Close dialog':'Return to the story'}">← <span>${s.stage==='welcome'?'Close':'Story'}</span></button></div><div class="modal-content">${content}</div></div></div>`;}
const ADVENTURE_NAV = [
 ['story','◈','Story'], ['sheet','♜','Character'], ['inventory','♢','Pack'],
 ['learn','✦','Lessons'], ['chapters','▤','Chapters'],
 ['practice','⚔','Practice'], ['worldmap','⌖','Map'], ['party','♟','Party'], ['journal','☷','Journal'], ['rules','?','Rules']
];
function renderAdventureNav(){
 const active=ADVENTURE_NAV.some(([id])=>id===modal)?modal:'story';
 return `<nav class="game-tool-nav" aria-label="Adventure tabs">${ADVENTURE_NAV.map(([id,icon,label])=>`<button type="button" class="game-tool ${id===active?'current':''}" ${id==='story'?'data-act="backStory"':`data-modal="${id}"`} ${id===active?'aria-current="page"':''} aria-label="${label}" title="${label}"><span class="game-tool-icon" aria-hidden="true">${icon}</span><span class="game-tool-label">${label}</span></button>`).join('')}</nav>`;
}
function render(){
 const playing=Boolean(s.classId&&s.stage!=='welcome');
 app.innerHTML=`<header class="app-header"><div class="header-inside"><button class="brand" data-act="home" aria-label="Return to the adventure"><span class="brand-logo">✧</span><span>LANTERN <em>&</em> KEY</span></button><div class="header-actions">${playing?`<span class="header-hp" aria-label="Your current health is ${s.hp} of ${maxHp()} hit points">♥ <b>${s.hp}</b> / ${maxHp()} HP</span>`:`<button class="header-rules" data-modal="rules">? Rules</button>`}<button class="settings-button" data-modal="settings" aria-label="Open settings"><span aria-hidden="true">⚙</span><span>Settings</span></button></div></div></header>${playing?renderAdventureNav():''}<div class="shell ${playing?'playing':''}">${playing?`<div class="game-layout"><main class="game-main">${renderScene()}</main>${renderSidebar()}</div>`:renderWelcome()}</div><footer class="site-footer ${playing?'playing-footer':''}"><span>✧ LANTERN & KEY</span><span>An independent tabletop-fantasy campaign · v3.2.2</span><button data-modal="rules">Rules & attribution ↗</button></footer>${renderModal()}${loadIssue?recoveryView():''}${updateWorker?`<div class="update-banner"><span>A new version is ready. Your progress is saved.</span><button data-act="applyUpdate">Update when ready →</button><button data-act="dismissUpdate" aria-label="Dismiss update">×</button></div>`:''}`;
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
const CAMPAIGN_CHAPTER={forest:4,camp:4,trail:4,crossing:5,crossingBattle:5,crossingAfter:5,village:6,market:6,witness:6,council:6,trial:7,archive:7,altar:7,ascent:8,levelup:8,beaconTest:8,lanternOath:8,epilogue:8};
// One-off story initiatives should not be offered again after a resolved attempt.
// The result pause still shows the action; only the *next* choice list is filtered.
const SINGLE_USE_STORY_ACTIONS = new Set([
 'c:forestScout','c:campShelter','c:bridgeInspect','c:bridgeParley',
 'c:marketInsight','c:interview','c:mislead','c:confront','c:arcana',
 'c:spellAttack','c:spellSave','c:concentrate','c:beaconInsight'
]);
// Earlier saves did not record attempted actions directly. Existing state flags,
// including false results, and the outcome journal are enough to restore them.
const LEGACY_ACTION_FLAGS = {
 'c:forestScout':'trailSafe','c:campShelter':'campShelterAttempted',
 'c:bridgeInspect':'bridgeSafe','c:bridgeParley':'bridgeParley',
 'c:marketInsight':'marketTruth','c:interview':'millerTrust',
 'c:mislead':'bluffed','c:confront':'intimidated','c:arcana':'runesKnown',
 'c:spellAttack':'magicAttack','c:spellSave':'magicSave',
 'c:concentrate':'concentrationTrial'
};
const LEGACY_ACTION_RESULTS = {
 'c:bridgeInspect':['A stable line across','Cracked stones everywhere'],
 'c:bridgeParley':['Terms of passage','A refused bargain'],
 'c:beaconInsight':['The echo acknowledges your insight','A question remains']
};
function chosenOnce(key){
 if(!SINGLE_USE_STORY_ACTIONS.has(key))return false;
 if(s.flags?.storyActions?.[key]===true)return true;
 const flag=LEGACY_ACTION_FLAGS[key];
 if(flag&&Object.prototype.hasOwnProperty.call(s.flags||{},flag))return true;
 const titles=LEGACY_ACTION_RESULTS[key];
 return !!titles&&s.journal.some(entry=>titles.some(title=>entry.text.startsWith(title+':')));
}
function rememberChoice(key){
 if(!SINGLE_USE_STORY_ACTIONS.has(key))return;
 if(!s.flags.storyActions||typeof s.flags.storyActions!=='object'||Array.isArray(s.flags.storyActions))s.flags.storyActions={};
 s.flags.storyActions[key]=true;
}
function availableStoryChoice(c){
 if(!c||chosenOnce(c.key))return false;
 // Once the one-time conversation has concluded, don't keep sending the
 // player back to a character who has no new dialogue or discoveries.
 if(c.key==='goStranger'&&s.flags.triedStranger)return false;
 if(c.key==='goKeeper'&&s.flags.triedKeeper)return false;
 return true;
}
const CAMPAIGN_ART={forest:'forest',camp:'forest',trail:'forest',crossing:'crossing',crossingBattle:'crossing',crossingAfter:'crossing',village:'village',market:'village',witness:'village',council:'village',trial:'arcane',archive:'arcane',altar:'arcane',ascent:'summit',levelup:'summit',beaconTest:'summit',lanternOath:'summit',epilogue:'summit'};
const CHAPTER_START={1:'tavern',2:'passage',3:'vault',4:'forest',5:'crossing',6:'village',7:'trial',8:'ascent'};
const LESSONS={
 checks:['Ability checks','A skill check is a d20 plus the applicable ability and proficiency modifier, compared against a DM-set DC. Natural 20s do not automatically succeed on ordinary ability checks.'],
 advantage:['Advantage & disadvantage','Roll two d20s and use the higher (advantage) or lower (disadvantage). They cancel rather than stacking.'],
 saves:['Saving throws','Saving throws let characters resist incoming hazards, spells, and harmful effects. The relevant ability depends on the threat.'],
 combat:['Initiative & combat','Initiative orders turns. Each turn normally gives movement, an Action, one Bonus Action when available, and one Reaction when triggered.'],
 sneak:['Sneak Attack','Once per turn, a Rogue can add 1d6 damage on a qualifying Finesse or Ranged attack when they have advantage or a non-incapacitated ally is within 5 feet of the target without disadvantage. Being hidden is not required.'],
 rests:['Short and long rests','A Short Rest lasts an hour and can expend Hit Point Dice; a Long Rest usually takes 8 hours, restores HP and spent Hit Point Dice, and recharges many abilities. Both can be interrupted.'],
 artifact:['Homebrew quest artifacts','The Last Lantern is an original, story-specific magic item, not an official D&D class ability. It holds up to three sparks. Using a spark changes later possibilities, and spending the last spark has consequences.'],
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
function initialSave(){return {frontier:null,version:1,stage:'welcome',flags:{},journal:[],checks:[],heroName:'',classId:null,hp:null,potions:1,slots:0,outcome:null,combat:null,ending:null,replay:null,mastery:{},quizFeedback:null,finalTest:null,restSession:null,level:1,hitDice:1,secondWind:2,arcaneRecovery:false,actionSurge:1,mode:'guided',inventory:{rope:1,rations:2,torch:1,smoke:1,lantern:0},lanternSparks:0,equipped:'primary',learned:{},checkpoints:{},unlocked:1,practice:null,tactics:null,storyResult:null};}
function upgradeSave(raw){
 const d=initialSave(),x={...d,...raw};
 x.frontier=raw.frontier?normalizeWorld(raw.frontier):null;
 // v3.2.3: older conversations gave another clue every time Mara repeated the
 // same patrol story. Reconcile only duplicates proven by journal records; keep
 // unrelated evidence and never run this migration more than once.
 if(x.frontier&&!x.frontier.done['migration:maraEvidenceV323']){
  const journal=Array.isArray(raw.journal)?raw.journal:[];
  const maraListenCount=journal.filter(entry=>typeof entry?.text==='string'&&entry.text.startsWith('You listen before deciding: Mara shares another part of the story')).length;
  if(maraListenCount>1)x.frontier.clues=Math.max(0,x.frontier.clues-(maraListenCount-1));
  if(maraListenCount||Object.keys(x.frontier.done).some(key=>/^talk:mara:(?:9|10|11|12|13|14|15|16)$/.test(key)))x.frontier.done['evidence:maraPatrol']=true;
  x.frontier.done['migration:maraEvidenceV323']=true;
 }
 if(x.frontier?.battle&&x.frontier.battle.origin!==raw.stage)x.frontier.battle=null;
 x.flags=(raw.flags && typeof raw.flags==='object' && !Array.isArray(raw.flags))?raw.flags:{};
 // Preserve a paid-for lantern ward in v2.4 saves even if a later failed
 // Survival check overwrote the shared shelter flag.
 if(x.flags.lanternWard===true)x.flags.shelter=true;
 x.mode=raw.mode==='tabletop'?'tabletop':'guided';x.level=[1,2,3,4].includes(raw.level)?raw.level:1;
 x.hitDice=clamp(Number.isFinite(raw.hitDice)?raw.hitDice:x.level,0,x.level);
 x.secondWind=clamp(Number.isFinite(raw.secondWind)?raw.secondWind:2,0,x.level>=4?3:2);
 x.inventory={...d.inventory,...(raw.inventory||{})};
 for(const item of Object.keys(x.inventory))x.inventory[item]=clamp(Number(x.inventory[item])||0,0,20);
 // A Dangerous Souvenir is the source of truth, even if a v2.3-era save
 // already contains inventory.lantern: 0. Recover on load, import and replay.
 // Some very early backups have only the ending in their journal.
 const olderSouvenir=!raw.ending && Array.isArray(raw.journal) && raw.journal.some(e=>
  typeof e?.text==='string' && /A dangerous souvenir|Adventure completed: take/i.test(e.text));
 if(olderSouvenir)x.ending='take';
 if(x.ending==='take')x.inventory.lantern=1;
 else if(['restore','return','escape'].includes(x.ending))x.inventory.lantern=0;
 x.inventory.lantern=clamp(x.inventory.lantern,0,1);
 // v2.5 and earlier left the bridge rope in the Pack after tying it off.
 // Apply this migration exactly once so repeat loads never consume more rope.
 if(x.flags.usedRope===true && x.flags.ropeSecured!==true){
  x.inventory.rope=Math.max(0,x.inventory.rope-1);
  x.flags.ropeSecured=true;
 }
 x.lanternSparks=x.inventory.lantern
  ?clamp(Number.isInteger(raw.lanternSparks)?raw.lanternSparks:3,0,3):0;
 x.learned=(raw.learned&&typeof raw.learned==='object'&&!Array.isArray(raw.learned))?raw.learned:{};x.mastery=(raw.mastery&&typeof raw.mastery==='object'&&!Array.isArray(raw.mastery))?raw.mastery:{};x.replay=(raw.replay&&typeof raw.replay==='object'&&!Array.isArray(raw.replay))?raw.replay:null;
 x.checkpoints=(raw.checkpoints&&typeof raw.checkpoints==='object'&&!Array.isArray(raw.checkpoints))?raw.checkpoints:{};
 x.unlocked=clamp(Number(raw.unlocked)|| (CAMPAIGN_CHAPTER[x.stage]||chapter(x.stage)),1,16);
 x.journal=Array.isArray(raw.journal)?raw.journal.slice(-120).map(e=>({text:String(e.text||'').slice(0,5000),kind:['story','roll','success','failure','combat'].includes(e.kind)?e.kind:'story',time:typeof e.time==='string'?e.time.slice(0,40):''})):[];
 // Old lantern-assisted crossings can still carry a failed negotiation in the journal.
 // Recover that social history even if the successful crossing later set bridgeParley=true.
 if(x.flags.lanternBridge && !x.flags.bridgeRefused && x.journal.some(e=>e.text.startsWith('A refused bargain:')))x.flags.bridgeRefused=true;
 // v2.4 marked a failed council vote as solved when the hero merely had evidence.
 // The actual recorded verdict takes precedence; no existing successful vote is changed.
 const verdicts=x.journal.filter(e=>/^(A fair verdict|The truth needs more work):/.test(e.text));
 if(verdicts.length) x.flags.villageSolved=verdicts.at(-1).text.startsWith('A fair verdict:');
 // Early saves could restore the beacon despite never obtaining the silver key.
 // Keep that ending valid, but describe a careful manual repair rather than a key that never existed.
 if(x.ending==='restore'&&!x.flags.key){
  x.flags.repairedWithoutKey=true;
  const oldText='You place the silver key in the lantern’s socket.';
  const newText='You align the old mechanism by hand, without the missing wolf-key.';
  for(const rec of [x.outcome,x.storyResult]) if(rec?.body?.includes(oldText))rec.body=rec.body.replace(oldText,newText);
  for(const rec of x.journal)if(rec.text.includes(oldText))rec.text=rec.text.replace(oldText,newText);
 }
 x.checks=Array.isArray(raw.checks)?raw.checks.slice(-200):[];
 x.potions=clamp(Number(x.potions)||0,0,20);
 x.slots=clamp(Number(x.slots)||0,0,x.level>=3?4:x.level===2?3:2);
 x.hp=Number.isFinite(raw.hp)?clamp(raw.hp,0,(CLASSES[x.classId]?.hp||0)+ (x.level-1)*({fighter:8,rogue:7,wizard:5}[x.classId]||0)):x.hp;
 // Migrate established v3 campaign saves to the milestone level appropriate for
 // the furthest reached chapter, preserving damage and older consumables.
 const chapterLevel=x.unlocked>=15?4:x.unlocked>=12?3:Math.min(2,x.level);
 if(x.frontier&&x.level<chapterLevel){
  const oldLevel=x.level;x.level=chapterLevel;
  const gain=(chapterLevel-oldLevel)*({fighter:8,rogue:7,wizard:5}[x.classId]||0);
  x.hp=Math.min((CLASSES[x.classId]?.hp||0)+(chapterLevel-1)*({fighter:8,rogue:7,wizard:5}[x.classId]||0),(x.hp||0)+gain);
  x.hitDice=Math.min(chapterLevel,x.hitDice+chapterLevel-oldLevel);
  if(x.classId==='fighter')x.secondWind=Math.min(chapterLevel>=4?3:2,x.secondWind+1);
  if(x.classId==='wizard'){x.slots=Math.min(4,x.slots+1);x.frontier.slots2=chapterLevel>=4?3:2;}
 }
 x.actionCue=null;
 return x;
}
function learn(id){if(LESSONS[id]&&!s.learned[id])s.learned[id]=new Date().toISOString();}
function learnForCheck(key){learn('checks');if(key.includes('Save')||key==='trapSave'||key==='runTrap')learn('saves');if(key.includes('talk')||key.includes('Talk')||key.includes('Persuasion')||['keeperHelp','wardTalk','c:persuade','c:deceive'].includes(key))learn('social');}
function trackStage(){const ch=CAMPAIGN_CHAPTER[s.stage]||chapter(s.stage);s.unlocked=Math.max(s.unlocked||1,ch);if(ch<=3 && s.stage!=='welcome' && !s.checkpoints[ch]){s.checkpoints[ch]=JSON.parse(JSON.stringify({...s,checkpoints:{},storyResult:null,actionCue:null,practice:null}));}if(ch===2)learn('saves');if(ch===3)learn('combat');}
function chapterTicks(stage){const ch=chapter(stage);return Array.from({length:8},(_,i)=>`<i class="${ch>(ch>8?i+8:i)?'lit':''}"></i>`).join('');}
function cue(label){s.actionCue={label,fromStage:s.stage,hpBefore:s.hp};}
function newChapter(stage,title,body){
 const previousStage=s.stage;
 const idx=CAMPAIGN_CHAPTER[stage];
 s.stage=stage;s.pending=null;s.combat=null;s.outcome=null;s.tactics=null;
 s.unlocked=Math.max(s.unlocked||1,idx);
 if(!s.checkpoints[idx]){let snap=JSON.parse(JSON.stringify({...s,checkpoints:{},practice:null,storyResult:null,actionCue:null}));s.checkpoints[idx]=snap;}
 const bridge=storyBridge(previousStage,stage);
 outcome(title,bridge?body+' '+bridge:body);commit();
}
function moveScene(stage,title,body,success=null){const bridge=storyBridge(s.stage,stage);s.stage=stage;outcome(title,bridge?body+' '+bridge:body,success);commit();}
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
  if(key==='c:council'){
   const evidence=!!s.flags.villageEvidence;
   const mistrust=!!(s.flags.bluffed||s.flags.intimidated);
   p.mode=evidence&&mistrust?'normal':evidence?'advantage':mistrust?'disadvantage':'normal';
  }
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
 case 'c:campShelter':{
  s.flags.campShelterAttempted=true;
  // A failed scouting check cannot dispel an already-paid-for lantern ward.
  s.flags.shelter=success||!!s.flags.shelter||!!s.flags.lanternWard;
  label(success?'A safe hollow':s.flags.shelter?'Tracks outside the circle':'Tracks around camp',success?'You locate a sheltered hollow, suitable for an uninterrupted Long Rest.':s.flags.shelter?'You spot fresh wolf tracks outside your campsite. You do not find a better hollow, but the existing lantern ward still keeps your camp safe.':'The clearing is exposed and marked by wolves. You should change camps or secure shelter before a Long Rest.');break;
 }
 case 'c:forestScout':s.flags.trailSafe=success;s.stage='trail';label(success?'The forest reveals its path':'A twisted detour',success?'You follow deer tracks around the thickest thorn bushes. A broken crossing is visible through the pines.':'You find the bridge after a muddy detour. The detour costs one ration if you have one.');if(!success&&s.inventory.rations>0)s.inventory.rations--;break;
 case 'c:bridgeInspect':s.flags.bridgeSafe=success;label(success?'A stable line across':'Cracked stones everywhere',success?'A row of darker stones leads to a safe foothold across the bridge. The rocky bank also offers half cover.':'You cannot identify a safe crossing. You can still negotiate or fight for passage.');break;
 case 'c:bridgeParley':s.flags.bridgeParley=success;if(success){s.stage='crossingAfter';label('Terms of passage','The toll keeper lowers their bow when you offer to repair a broken signpost. They allow you across without a fight.');}else {s.flags.bridgeRefused=true;label('A refused bargain','“No more promises,” the toll keeper snaps, drawing their sword. You can defend yourself or attempt another route.');}break;
 case 'c:marketInsight':s.flags.marketTruth=success;label(success?'An overlooked contradiction':'Difficult to tell',success?'Two entries in the merchant’s own ledger assign different totals to the same shipment, and one is written in much fresher ink. Someone altered the tally. You have not yet seen the miller’s records.':'The merchant keeps a steady face; you do not yet know which story is true.');break;
 case 'c:interview':s.flags.millerTrust=success;if(success)s.flags.villageEvidence=true;label(success?'A witness comes forward':'A closed door',success?'The miller shows you a seal from the missing shipment: it bears the council treasurer’s crest.':'The miller hesitates to speak openly. They glance at the sealed delivery ledger but are not willing to share it with you.');break;
 case 'c:mislead':s.flags.bluffed=true;s.flags.villageEvidence=success||s.flags.villageEvidence;label(success?'Your bluff works':'The lie spreads',success?'The merchant believes your invented credentials and reveals a hidden invoice. It is a clue, though trust may suffer later.':'The merchant recognizes the bluff and warns others not to trust your account.');break;
 case 'c:confront':s.flags.intimidated=true;s.flags.villageEvidence=success||s.flags.villageEvidence;label(success?'A reluctant disclosure':'A wary silence',success?'The mill worker admits the treasurer ordered them to hide a delivery slip meant for the bridge guard. They show you the slip, but resent being pressured. You have evidence, though trust may suffer.':'The mill worker refuses to show you the sealed papers. Word of your threat may undermine your credibility with the council.');break;
 case 'c:council':s.flags.villageSolved=success;s.flags.councilHadMistrust=!!(s.flags.bluffed||s.flags.intimidated);s.stage='trial';s.unlocked=Math.max(s.unlocked,7);if(!s.checkpoints[7])s.checkpoints[7]=JSON.parse(JSON.stringify({...s,checkpoints:{},storyResult:null,actionCue:null}));label(success?'A fair verdict':'The truth needs more work',success?'Your testimony convinces the council to restore the missing supplies and reconcile the bridge guard with the village. '+(s.flags.councilHadMistrust?'Some villagers still distrust your methods, and their caution will take time to overcome. ':'')+'An elder shows you the mountain watchroad and recommends Elowen’s school: the supply dispute was only one part of the fading network.':'The council cannot accept all your claims. '+(s.flags.councilHadMistrust?'Questions about how you gathered testimony have made people reluctant to trust your account. ':'')+'It agrees to investigate the ledger, and you leave with a lead to the old arcane school. An elder suggests speaking with Elowen at the old watchtower school: even if the people here are divided, the failing beacon network still needs understanding.');break;
 case 'c:arcana':s.flags.runesKnown=success;label(success?'You recognize the glyph':'An unfamiliar spell',success?'These runes are linked to an illusion and a ward. You can distinguish the spell’s attack from a saving throw.':'The glyph remains unfamiliar, but the instructor offers a demonstration.');break;
 case 'c:focus':{s.flags.focusHeld=success;label(success?'Your concentration holds':'Your concentration breaks',success?'You steady your breathing despite the pulse of force. Your single concentration effect remains active.':'The pulse distracts you. You lose concentration and the demonstration spell ends.');break;}
 case 'c:final':s.flags.finalInsight=success;s.stage='lanternOath';label(success?'The pattern is clear':'No easy certainty',success?'You see that the guardian seeks a promise, not a fight. Its three-eyed wolf mark recalls the promises carved along the watchroad; the waylights were promises to protect those who traveled after their keepers.':'You cannot tell whether the guardian is friend or foe, but can still make a decision.');break;
 }
 return true;
}
function campaignScene(){
 if(WORLD_STAGES[s.stage])return worldScene();
 const n=s.heroName, q=choice;
 switch(s.stage){
 case 'forest':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'The woods remember',text:[`The tavern is behind you, ${esc(n)}. ${s.inventory.lantern?'The enchanted lantern you kept casts a faint blue glow from your pack.':'Whatever became of the lantern, a blue spark follows the road into Blackwood.'}`,`Your wounds and supplies carry forward from the first adventure. Beyond the trees, wolves call to one another.`, 'A trail marker points to a campsite and a ruined crossing.'],lesson:'A resource spent now might not be available for the next encounter. Different classes replenish features at different times.',choices:[q('c:camp','Make camp','Explore resting, recovery and Hit Point Dice','☾'),q('c:forestScout','Scout the winding road','Perception DC 12 · find a safer route','◎'),q('c:forestPotion','Use a healing potion','Restore 2d4+2 HP · if injured','⚗',s.hp===maxHp()||s.potions<1)]};
 case 'camp':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'Shelter, silence, and rest',text:[s.flags.relocatedCamp?'You have relocated above the wolf tracks to a sheltered ledge. The standing stones are now some distance below.':'You find a circle of standing stones, half protected from the wind. A long night is ahead.',`You have ${s.hitDice} unspent Hit Point Dice, ${s.potions} potions, and ${s.inventory.rations} rations.`,s.flags.lanternWard?'The lantern ward still encloses the camp, regardless of any other clues you find.':s.flags.shelter===true?'A sheltered hollow nearby looks safe enough for sleep.':s.flags.shelter===false?'Fresh tracks warn that the exposed clearing is dangerous.':'You have not yet assessed whether this is a safe place to rest.'],lesson:'A Short Rest is one hour. Spend one or more Hit Point Dice to heal (die + CON modifier). A Long Rest lasts at least eight hours; it can be interrupted. Neither begins at 0 HP.',choices:[q('c:shortRest','Take a Short Rest','Spend one Hit Point Die if injured · regain some class resources','☕',s.hp<=0),!s.flags.shelter&&!s.flags.campShelterAttempted?q('c:campShelter','Search for a sheltered campsite','Wisdom (Survival) DC 12','◎'):null,carriesLantern()&&!s.flags.lanternWard?q('c:lanternWard','Ask the lantern to guard your camp',`Spend 1 spark (${lanternSparks()}/3) · create protective shelter`,'✧',lanternSparks()<1):null,s.flags.longInterrupted&&!s.flags.shelter?q('c:relocateCamp','Move your camp away from the wolves','Choose higher sheltered ground · costs time and 1 ration if available','↝'):null,q('c:longRest','Attempt a Long Rest','Restore HP, Hit Dice and class resources if uninterrupted','☾',s.hp<=0||restedOnThisCampVisit()),q('c:campPotion','Drink a Potion of Healing','2d4+2 HP, uses a consumable','⚗',s.hp===maxHp()||s.potions<=0),q('c:toTrail','Break camp and follow the road','Continue to the broken crossing','↝')].filter(Boolean)};
 case 'trail':return {chapter:4,label:'A NIGHT IN BLACKWOOD',heading:'The path through brambles',text:['The forest thins into a gorge where a ruined bridge crosses swift black water.',s.flags.trailSafe===true?'Your scouting spared you the worst of the brambles.':s.flags.trailSafe===false?'Your scouting led through an unexpected muddy detour; you paid for the misstep in supplies.':'You followed the marked road without scouting. The brambles caught at your cloak, but you did not take the muddy detour.','A sentry stands on the broken bridge, guarding the only easy passage.'],lesson:'Exploration works through specific actions and consequences; clever preparations can remove the need for a roll.',choices:[q('c:toBridge','Approach the broken bridge','Begin tactical movement and cover lessons','↝'),q('c:backCamp','Return to the campsite','You may still rest before crossing','↶')]};
 case 'crossing':return {chapter:5,label:'THE BROKEN CROSSING',heading:'A narrow path, a watchful guard',text:['The bridge hangs above a fast, black stream. A wounded sentry blocks the far end and points a crossbow your way.','“No travelers. Not after what the village did,” they warn. Shattered stone and waist-high parapets offer different routes across.'],lesson:'Movement uses feet and squares on a tactical grid (one square = 5 feet here). Cover and difficult terrain can change tactics. Disengage prevents opportunity attacks during your movement.',choices:[!s.flags.bridgeSafe?q('c:bridgeInspect','Study the ruined masonry','Investigation DC 13 · locate safe stones','◎'):null,q('c:bridgeParley','Negotiate with the guard','Persuasion DC 14 · avoid the fight','◇'),carriesLantern()?q('c:lanternCross','Invoke the lantern at the crossing',`Spend 1 spark (${lanternSparks()}/3) · approach with its old light`,'✧',lanternSparks()<1):null,s.inventory.rope>0?q('c:ropeCross','Secure your rope along the parapet','Use an item to cross without a roll','⌘'):null,q('c:startTactics','Defend yourself on the bridge','Interactive grid battle · cover, range, reactions','⚔')].filter(Boolean)};
 case 'crossingAfter':return {chapter:5,label:'THE BROKEN CROSSING',heading:'Across the water',text:['You stand on the far bank, where a path winds toward Briar Hollow. A torn supply banner lies beneath the stones.',s.flags.lanternBridge?(s.flags.bridgeRefused===true?'After refusing your first bargain, the guard recognized the old blue light and reconsidered their stance.':'The guard recognized the blue light and let you pass peacefully.'):s.flags.usedRope?(s.flags.bridgeParley===false?'Your rope remains tied to the ruined parapet. You crossed despite the guard’s earlier refusal, without obtaining their trust.':'Your rope remains tied to the parapet, a route that may help later travelers.'):s.flags.bridgeParley?'The guard seems relieved that you negotiated rather than fought.':s.flags.bridgeFought?'The sentry has yielded and you gave them a chance to explain themselves.':'The far bank lies quiet; your route past the sentry brought you safely across.', 'The banner bears the same three-eyed wolf seen at the tavern.'],lesson:'Combat was one solution. Negotiation, planning, or equipment might have achieved the same objective without initiative.',choices:[q('c:toVillage','Follow the supply trail','Continue to Chapter 6','↝'),q('c:restRoad','Take a moment to drink a healing potion','Use a consumable outside combat','⚗',s.potions<=0||s.hp===maxHp())]};
 case 'village':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'A village with two stories',text:['Briar Hollow should be preparing for a harvest feast. Instead, market stalls are empty.','The merchant says supplies vanished at the mill. The miller claims the council redirected them. The bridge sentry fears starving travelers.','The council will meet before dusk. You have time to gather testimony.',s.flags.lanternLedger?'A trace of blue fire still outlines something important in your evidence.':''],lesson:'Insight does not act as an infallible lie detector; it helps read behavior. Social choices change trust as well as information.',choices:[q('c:toMarket','Speak to the merchant','Investigate a missing shipment','☷'),q('c:toWitness','Visit the mill','Listen to another account','◇'),q('c:toCouncil','Present your case to the council','Persuasion DC 14; evidence may help','✦')]};
 case 'market':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'The merchant’s ledger',text:['The merchant points to a nearly empty grain cart. “I sent what I could. The miller signed for it all.”','A ledger lies open beside the till. The ink on one page is much fresher than the rest.'],lesson:'Persuasion is a sincere request; Deception is an intentional lie. The choice matters narratively even if the dice total is the same.',choices:[!s.flags.marketTruth?q('c:marketInsight','Study the merchant’s manner','Insight DC 12 · look for contradictions','◎'):null,carriesLantern()&&!s.flags.lanternLedger?q('c:lanternLedger','Illuminate the erased ledger',`Spend 1 spark (${lanternSparks()}/3) · reveal an overlooked clue`,'✧',lanternSparks()<1):null,!s.flags.bluffed?q('c:mislead','Pretend to be a royal auditor','Deception DC 13 · risk trust','♢'):null,q('c:toWitness','Compare the miller’s account','Seek corroboration','↝'),q('c:toCouncil','Take your findings to the council','Speak with or without evidence','✦')].filter(Boolean)};
 case 'witness':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'At the watermill',text:['Inside the mill, a weary worker tends a broken wheel. “We received half our order,” they say, “and were told to be grateful.”','The worker is afraid to anger the council treasurer. A sealed ledger sits behind them.'],lesson:'People have goals and limits. A DM may provide clues without requiring one magic “correct” social skill.',choices:[!s.flags.millerTrust?q('c:interview','Promise the miller a fair hearing','Persuasion DC 12 · gain trust','◇'):null,!s.flags.intimidated?q('c:confront','Press the mill worker for the concealed delivery slip','Intimidation DC 13 · damages trust','⚑'):null,q('c:toMarket','Cross-check the market accounts','Try another lead','↶'),q('c:toCouncil','Bring what you know to the council','Present your case','✦')]};
 case 'council':return {chapter:6,label:'SECRETS OF BRIAR HOLLOW',heading:'The council must decide',text:['The village hall falls quiet as you step forward.',s.flags.villageEvidence?'You have a seal or invoice that connects the supplies to the council treasurer.':'You have little physical evidence, but the villagers are willing to hear you.',s.flags.bluffed||s.flags.intimidated?'A few villagers remember your deception or threats. Their mistrust makes your case harder to deliver; evidence can cancel that disadvantage.':'Your approach has left the villagers willing to listen.'],lesson:'A convincing argument is not automatic control of an NPC. Circumstances, evidence and trust can change whether a roll is appropriate.',choices:[q('c:council','Explain what really happened',s.flags.villageEvidence?(s.flags.bluffed||s.flags.intimidated?'Persuasion DC 14 · evidence and mistrust cancel':'Persuasion DC 14 · advantage from evidence'):(s.flags.bluffed||s.flags.intimidated?'Persuasion DC 14 · disadvantage from mistrust':'Persuasion DC 14'),'✦'),q('c:backVillage','Gather more evidence','Return to the village','↶')]};
 case 'trial':return {chapter:7,label:'THE ARCANE TRIAL',heading:'A school of patient magic',text:['An ancient school stands beyond the village. Its tutor, Elowen, waits beside a circle of glowing runes.','“Magic is more than flashy effects. You must know when you roll to hit, when the target resists, and when concentration can be broken.”'],lesson:'A spell attack is rolled by the caster against AC. A spell with a saving throw makes the target roll against your spell save DC. Not every class can cast spells.',choices:[q('c:toArchive','Examine the spell archive','Discover spellcasting basics','◎'),q('c:toAltar','Enter the demonstration circle','Practice attacks, saves, concentration','✦')]};
 case 'archive':return {chapter:7,label:'THE ARCANE TRIAL',heading:'The language of spells',text:[s.classId==='wizard'?'Your spellbook warms as it meets the archive’s light.':'Elowen lets you study a page from a borrowed spellbook. You cannot cast Wizard spells, but you can still learn how to resist them.','A record describes Fire Bolt (a cantrip with a spell attack) and Burning Hands (a level-1 spell with a Dexterity save).','A glowing bowl demonstrates Detect Magic: a concentration spell with a limited duration.'],lesson:'Wizards prepare spells and can cast cantrips without spending slots. Detect Magic can also be cast as a ritual if prepared as an eligible Wizard ritual from a spellbook, adding 10 minutes.',choices:[q('c:arcana','Decode a runic inscription','Arcana DC 13','◎'),carriesLantern()&&!s.flags.lanternStudied?q('c:lanternStudy','Ask Elowen to study the lantern',`Inspect the flame · recover a spark if spent (${lanternSparks()}/3)`,'✧'):null,q('c:toAltar','Enter the trial circle','Demonstrate the mechanics','✦')].filter(Boolean)};
 case 'altar':return {chapter:7,label:'THE ARCANE TRIAL',heading:'A choice of magic',text:['A hovering practice target waits inside the circle. Elowen gestures, showing the difference between an attack roll and a forced saving throw.',s.flags.magicAttack!==undefined?'You have already seen a spell attack in action.':'The target bears a painted AC value of 12.',s.flags.magicSave!==undefined?'You have also tested a spell with a saving throw.':'The tutor can demonstrate Burning Hands and ask the target to resist.',s.flags.focusHeld!==undefined?'You understand how damage can break concentration.':'A pulsing ward is ready to test concentration.'],lesson:'Concentration breaks when you cast a different concentration spell, become incapacitated, or fail a Constitution saving throw after taking damage (DC at least 10).',choices:[q('c:spellAttack',s.classId==='wizard'?'Cast Fire Bolt at the target':'Watch a Fire Bolt attack roll','Spell attack against AC 12 · free cantrip','✦'),q('c:spellSave',s.classId==='wizard'?'Cast Burning Hands':'Observe Burning Hands and a Dexterity save',s.classId==='wizard'?'3d6 fire · half on successful save · 1 slot':'Target makes a saving throw versus spell DC','✧',s.classId==='wizard'&&s.slots<1),q('c:concentrate','Maintain a concentration effect','Take a small shock and make a CON save','◇'),q('c:toAscent','Finish the trial and follow the beacon road','Continue to Chapter 8','↝')]};
 case 'ascent':return {chapter:8,label:'BECOMING AN ADVENTURER',heading:'The road above the clouds',text:['The path winds toward a mountain beacon. Your travels have changed you. You can now advance to level 2.',`You have faced mysteries, tactical choices, and magic as a ${hero().name}.`,`Elowen's words echo: “Growth means new possibilities, not just stronger numbers.”`],lesson:'When leveling up, HP maximum and class features change. Different classes develop in very different ways.',choices:[q('c:toLevel','Level up to 2','Unlock your next class features','✦',s.level===2),s.level===2?q('c:toFinal','Approach the mountain beacon','Apply what you learned','↝'):null].filter(Boolean)};
 case 'levelup':return {chapter:8,label:'BECOMING AN ADVENTURER',heading:'A new kind of adventurer',text:[`You are now a level ${s.level} ${hero().name}.`,s.classId==='fighter'?'You can use Action Surge to take an extra action (not the Magic action) once per Short or Long Rest. Tactical Mind can add 1d10 to a failed ability check by spending Second Wind.':s.classId==='rogue'?'Your Cunning Action lets you Dash, Disengage or Hide as a Bonus Action. Sneak Attack stays at 1d6 until level 3.':'Scholar grants Expertise in one known scholarly skill. Choose Arcana or Investigation to double your proficiency bonus for that skill.',`You have ${s.hp}/${maxHp()} HP, and ${s.hitDice} remaining Hit Point Dice.`],lesson:'Level 2 does not mean every class gets another attack. Features have specific triggers and resource limitations.',choices:[s.classId==='wizard'&&!s.scholarSkill?q('c:scholar:arcana','Choose Arcana Expertise','Gain an extra +2 to Arcana checks','✦'):null,s.classId==='wizard'&&!s.scholarSkill?q('c:scholar:investigation','Choose Investigation Expertise','Gain an extra +2 to Investigation checks','◎'):null,(s.classId!=='wizard'||s.scholarSkill)?(s.flags.beaconPassed?q('c:toFinal','Approach the final beacon','Your training is complete','↝'):q('c:beaconTest','Prove your new abilities at the beacon','A final encounter applies your level-2 features','⚔')):null].filter(Boolean)};
 case 'beaconTest':return {chapter:8,label:'THE BEACON TEST',heading:'A living lesson',text:['An echo made of starlight steps between you and the final beacon. “The trial is not to destroy me,” it says. “Demonstrate how your new training changes your choices.”','You can face the echo in a brief training duel. Its blows are nonlethal; your existing inventory and class resources remain relevant.'],lesson:'Try your level-2 ability in a real story challenge. Fighter: Action Surge. Rogue: Bonus-Action Hide. Wizard: Scholar expertise helps in the alternate, noncombat solution.',choices:[q('c:beginBeacon','Challenge the echo to a duel','Use your abilities in combat','⚔'),q('c:beaconInsight','Study the echo and negotiate','Use Insight or scholarly Expertise','✦')]};
 case 'lanternOath':return {chapter:8,label:'THE LIGHTKEEPER’S CHOICE',heading:'The weight of a promise',text:[
   carriesLantern()?'The lantern becomes heavier as you approach the final threshold. Its light reaches beyond the glass. Every spark you saved—or spent—has brought you here.':s.ending==='return'?'The traveler’s promise follows you, even though the lantern is no longer in your hands.':s.ending==='restore'?'You remember repairing the first beacon rather than carrying it away. That choice still carries weight.':'You reach the final threshold without the old lantern, but your actions have brought you here.',
   s.flags.lanternLedger?'You remember what the lantern revealed in the village.':'You remember the people who made this journey possible.',
   carriesLantern()?`There are ${lanternSparks()} of 3 sparks remaining. What will you do with the power entrusted to you?`:'You are asked what kind of protector you want to be.'
 ],lesson:'This artifact is homebrew: a story-bound magic item designed to teach resource tradeoffs and consequences, not a published D&D rule.',choices:carriesLantern()?[
   q('c:lanternGuard','Keep the lantern and take responsibility','Preserve what remains for an uncertain future','✧'),
   q('c:lanternShare','Offer one spark to the surrounding valley',`Spend 1 spark (${lanternSparks()}/3) · share the light while keeping the lantern`,'✦',lanternSparks()<1),
   q('c:lanternReveal','Unseal a memory hidden in the flame',`Spend 2 sparks (${lanternSparks()}/3) · seek deeper understanding`,'◎',lanternSparks()<2)
 ]:[q('c:lanternHonor','Honor the promise made in the vault','Stand by the consequences of that choice','◇'),q('c:lanternCommunity','Invite others to protect the beacons','Share the responsibility without possessing the lantern','✦')]};
 case 'epilogue':return {chapter:8,label:'BEYOND THE LANTERN',heading:'A story you can bring to the table',text:[
   s.flags.lanternResolve==='share'?'The mountain beacon ignites a chain of watch-lights along the old trade road. The spark you offered is now a signal others can follow.':
   s.flags.lanternResolve==='truth'?'The mountain beacon projects an archive of names into the valley sky. The first keepers were ordinary people; their forgotten history is restored.':
   s.flags.lanternResolve==='guard'?'The mountain beacon burns steadily, but one ember remains in your care. You take the road knowing the lantern must be watched as carefully as it is wielded.':
   s.flags.lanternResolve==='community'?'Lights kindle in distant homes as neighbors agree to share watch duties. No single carrier will be responsible for the whole valley again.':
   s.flags.lanternResolve==='honor'&&s.ending==='restore'?'The old beacon remains repaired in its chamber. It lights a sure path through the woods, answering the promise you made there.':
   s.flags.lanternResolve==='honor'&&s.ending==='return'?'The traveler tends the lantern at the tavern, and a steady light returns to the windows of Blackwood.':
   'The mountain beacon flares to life as the valley answers with hundreds of tiny lanterns.',
   s.flags.lanternResolve==='share'?`You still carry The Last Lantern with ${lanternSparks()} ${lanternSparks()===1?'spark':'sparks'}; its gift has made the crossing safer for future travelers.`:
   s.flags.lanternResolve==='truth'?'You leave with the lantern and the recovered testimony, ready to help others learn how the beacons were first kept.':
   s.flags.lanternResolve==='guard'?`The Last Lantern remains in your pack (${lanternSparks()}/3 sparks). Its future rests on the choices you make as its keeper.`:
   s.flags.lanternResolve==='community'?'The village, the traveler and Elowen appoint a rotating watch, so the beacons no longer depend on one adventurer.':
   s.flags.lanternResolve==='honor'?'You honor your original choice without taking the lantern into your possession.':
   carriesLantern()?`The Last Lantern rests in your pack, ${lanternSparks()} sparks still guarded for the road ahead.`:'Your choice in the vault still shapes the valley.',
   s.flags.villageSolved?'The village council has acted on your case, and the missing supplies are being redistributed.':'The council’s inquiry into the missing supplies is still underway; your evidence may yet help them.',
   s.flags.finalInsight?'Your careful reading of the guardian helped you approach its intentions without another needless fight.':'You chose to act even without perfect certainty. The outcome belongs to your character.',
   `You leave Blackwood as ${esc(s.heroName)}, a level ${s.level} ${hero().name}. The road beyond the valley is calling.`],lesson:'At the table, your next step is to tell the DM what your character attempts. The DM responds with consequences, and the shared story continues.',choices:[q('c:review','Review your learning journal','See all the rules you have encountered','✦'),q('c:practice','Open the practice arena','Train checks and combat safely','⚔'),q('c:chapters','Replay a chapter checkpoint','Explore a different path','↶'),q('w:begin','Follow the newly revealed blue network','Begin Act II · a full regional campaign with companions, gold and choices','✧'),carriesLantern()&&!s.flags.lanternResolve?q('c:lanternAfterword','Follow the lantern’s final call','Experience the new lantern story without restarting','✧'):null].filter(Boolean)};
 default: return {chapter:8,label:'THE ADVENTURE',heading:'Continue',text:[],choices:[]};
 }
}
function campaignAct(key){
 if(key==='enterForest'){cue('Continue beyond the tavern');newChapter('forest','Into Blackwood','You set off beneath the last light of evening. Your equipment and wounds accompany you.');learn('resources');return true;}
 if(key==='retryFight'&&s.stage==='defeat'&&s.flags.defeatSource==='bridge'){s.hp=Math.max(1,Math.ceil(maxHp()/2));s.stage='crossing';s.tactics=null;cue('Try the bridge again');outcome('Another way across','You regain your footing at the bridge and can choose a safer path or face the sentry again.');commit();return true;}
 if(!key.startsWith('c:'))return false;
 if(s.storyResult||s.pending)return true;
 const v=campaignScene(),action=v.choices.find(x=>availableStoryChoice(x)&&x.key===key);
 if(!action||action.locked)return true;
 cue(action.title);
 if(CHECKS[key]){campaignCheck(key,action.title);return true;}
 rememberChoice(key);
 const advance=(stage,title,desc)=>moveScene(stage,title,desc);
 switch(key){
 case 'c:lanternWard':{
  if(!carriesLantern()||s.flags.lanternWard||lanternSparks()<1)return true;
  s.lanternSparks--;s.flags.lanternWard=true;s.flags.shelter=true;learn('artifact');learn('resources');
  outcome('The watchful flame','The lantern gives one spark to a ring of quiet blue light around your camp. The wolf tracks turn away from the stones. This shelter now supports an uninterrupted Long Rest, but you have fewer sparks for the journey.');commit();break;
 }
 case 'c:lanternCross':{
  if(!carriesLantern()||lanternSparks()<1)return true;
  const refused=s.flags.bridgeRefused===true||s.flags.bridgeParley===false;
  s.lanternSparks--;s.flags.lanternBridge=true;s.flags.bridgeParley=true;s.flags.bridgeRefused=refused;learn('artifact');
  advance('crossingAfter','An old signal rekindled',refused?'Your first request was refused, but when you lift the old lantern the sentry recognizes its signal. They lower their weapon cautiously, without pretending the earlier refusal did not happen. The spark is spent, and they ask you to tell the village their post still needs help.':'You hold out the lantern. The sentry recognizes its light and lowers their weapon, asking only that you tell the village the crossing still needs help. The spent spark cannot be used later.');break;
 }
 case 'c:lanternLedger':{
  if(!carriesLantern()||s.flags.lanternLedger||lanternSparks()<1)return true;
  s.lanternSparks--;s.flags.lanternLedger=true;s.flags.villageEvidence=true;learn('artifact');learn('evidence');
  outcome('Writing beneath the ink','A lantern spark traces a different set of entries under the ledger’s fresh ink. You now have credible evidence for the council, though the merchant watches your unusual light with apprehension.');commit();break;
 }
 case 'c:lanternStudy':{
  if(!carriesLantern()||s.flags.lanternStudied)return true;
  s.flags.lanternStudied=true;const was=s.lanternSparks;s.lanternSparks=Math.min(3,s.lanternSparks+1);learn('artifact');learn('spells');
  outcome('The flame remembers','Elowen helps you trace the lantern’s protective runes. '+(s.lanternSparks>was?'You recover one spark.':'The lantern is already fully charged.')+' The lantern now holds '+s.lanternSparks+'/3 sparks. Its power is a story artifact, not a regular Wizard spell or a class feature.');commit();break;
 }
 case 'c:lanternGuard':case 'c:lanternShare':case 'c:lanternReveal':case 'c:lanternHonor':case 'c:lanternCommunity':{
  if(s.stage!=='lanternOath'||s.flags.lanternResolve)return true;
  if(key.startsWith('c:lantern') && ['c:lanternGuard','c:lanternShare','c:lanternReveal'].includes(key) && !carriesLantern())return true;
  const cost=key==='c:lanternShare'?1:key==='c:lanternReveal'?2:0;
  if(lanternSparks()<cost)return true;
  s.lanternSparks-=cost;
  const outcomes={
   'c:lanternGuard':['guard','A guardian of embers','You close the lantern’s shutter and promise to carry its light responsibly. Keeping a powerful object means protecting the people who depend on it.'],
   'c:lanternShare':['share','A light offered freely','You offer a spark to the valley. The lantern remains yours to safeguard, but something far below answers in blue.'],
   'c:lanternReveal':['truth','The hidden testament','The flame reveals an old memory: its first guardians were ordinary people who chose to help one another. You carry their message, and the lantern remains with you.'],
   'c:lanternHonor':['honor','A promise remembered','You reaffirm the decision you made in the vault. An artifact need not be carried to have changed your journey.'],
   'c:lanternCommunity':['community','A circle of keepers','You ask the village, traveler and Elowen to form a rotating watch. Responsibility will be shared by those who live beside the beacons.']
  };
  const [resolution,title,desc]=outcomes[key];s.flags.lanternResolve=resolution;learn('artifact');
  advance('epilogue',title,desc);break;
 }
 case 'c:lanternAfterword':{
  if(!carriesLantern()||s.stage!=='epilogue'||s.flags.lanternResolve)return true;
  advance('lanternOath','A call from the pack','You turn toward a faint pulse from the lantern. Your earlier adventure remains complete, but one more choice is yours to make.');break;
 }
 case 'c:camp':s.flags.campRestedThisVisit=false;s.flags.campInterruptedThisVisit=false;advance('camp','A circle of standing stones','You find a place to make camp as the forest grows dark.');break;
 case 'c:relocateCamp':{
  if(!s.flags.longInterrupted||s.flags.shelter)return true;
  const used=s.inventory.rations>0;
  if(used)s.inventory.rations--;
  s.flags.relocatedCamp=true;s.flags.shelter=true;
  outcome('A safer place for the night','You break camp and move beyond the wolf tracks to a rocky ledge sheltered from the wind. The climb costs time'+(used?' and one ration':'')+', but your next Long Rest has a defensible place to finish.');commit();break;
 }
 case 'c:forestPotion':case 'c:campPotion':case 'c:restRoad':if(usablePotion())commit();break;
 case 'c:shortRest':{
  if(s.hp<=0)return true;
  s.restSession={spent:0,total:0};
  if(s.classId==='fighter')s.secondWind=Math.min(2,s.secondWind+1);
  if(s.classId==='fighter'&&s.level>=2)s.actionSurge=1;
  if(s.classId==='wizard'&&!s.arcaneRecovery&&s.slots<(s.level>=3?4:s.level===2?3:2)){s.slots++;s.arcaneRecovery=true;}
  learn('rests');learn('resources');
  outcome('Your short rest begins','You rest for one hour. You can now spend Hit Point Dice one at a time, deciding after each roll whether to spend another. Short Rest class features have recovered as appropriate.');commit();break;
 }
 case 'c:longRest':{
  if(s.hp<=0)return true;
  learn('rests');learn('resources');
  if(s.flags.shelter!==true){s.flags.longInterrupted=true;s.flags.campInterruptedThisVisit=true;
   // One long-rest interruption; after at least 1 hour, short-rest features can recharge.
   if(s.classId==='fighter')s.secondWind=Math.min(2,s.secondWind+1);
   outcome('Wolves interrupt your rest','A pack howls nearby and you wake before the Long Rest can finish. Resting an additional night in this exposed clearing would not change that risk: find shelter, move camp or use a protective resource first. You can still use Short Rest benefits.',false);
  }else {
   const before=s.hp;s.hp=maxHp();s.hitDice=s.level;s.secondWind=2;s.arcaneRecovery=false;s.actionSurge=1;
   if(s.classId==='wizard')s.slots=s.level>=3?4:s.level===2?3:2;
   if(carriesLantern())s.lanternSparks=Math.min(3,s.lanternSparks+1);
   s.flags.longRested=true;s.flags.longInterrupted=false;s.flags.campRestedThisVisit=true;s.flags.campInterruptedThisVisit=false;
   s.restSession=null;outcome('A full night of safety',`Eight hours later, you wake with ${s.hp}/${maxHp()} HP (previously ${before}). All Hit Point Dice, your Wizard slots, and Long Rest class resources are restored.`,true);
  }commit();break;
 }
 case 'c:toTrail':advance('trail',restedOnThisCampVisit()?'The grey light of morning':interruptedOnThisCampVisit()?'A road through the night':'Onward before dawn',restedOnThisCampVisit()?'After a full night of rest, you gather your things and follow the winding road.':interruptedOnThisCampVisit()?'Your rest was interrupted. Rather than claim you slept until morning, you gather your supplies and follow the dark road.':'You gather your supplies and follow the road without waiting for a full night’s rest.');break;
 case 'c:backCamp':s.flags.campRestedThisVisit=false;s.flags.campInterruptedThisVisit=false;advance('camp','Back among the stones','The camp is still quiet enough for a moment of rest.');break;
 case 'c:toBridge':newChapter('crossing','The bridge looms','A guard raises their crossbow above the rushing water. Your next decisions will change how you cross.');learn('movement');break;
 case 'c:ropeCross':if(s.inventory.rope>0){s.inventory.rope--;s.flags.usedRope=true;s.flags.ropeSecured=true;advance('crossingAfter','A rope-secured passage',s.flags.bridgeParley===false?'The sentry has already refused your offer, so you do not ask for their trust again. You secure your rope to the far parapet, take the damaged side passage, and keep your distance. The guard watches warily but stays at their post rather than pursue you. The rope remains tied in place.':'You tie your rope to the parapet and cross carefully under the ruined arch. After you announce your peaceful intentions, the sentry stands aside to let you pass. You leave the rope tied securely for the next traveler.');learn('inventory');}break;
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
 const starts=[{n:1,name:'The Forgotten Tavern',desc:'NPCs and ability checks'},{n:2,name:'Beneath the Floorboards',desc:'Hazards and saving throws'},{n:3,name:'The Chamber of Echoes',desc:'Dialogue and early combat'},{n:4,name:'A Night in Blackwood',desc:'Resting, limited resources and recovery'},{n:5,name:'The Broken Crossing',desc:'Tactical maps, cover, opportunity attacks'},{n:6,name:'Secrets of Briar Hollow',desc:'Insight, persuasion, evidence and trust'},{n:7,name:'The Arcane Trial',desc:'Spell attacks, saves, slots and concentration'},{n:8,name:'Becoming an Adventurer',desc:'Level 2 features and final reflection'},...WORLD_CHAPTERS.map(([n,name,desc])=>({n,name,desc}))];
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
function renderInventory(){return `<p class="modal-lead">Your supplies carry across chapters. Healing and equipment work independently of the story dialogue.</p><div class="inventory-list">${s.unlocked>=9?`<div class="inventory-entry"><div><b>◉ Gold pieces · ${world().gold} gp</b><small>Earn rewards, buy supplies and pay for choices across the wider region.</small></div></div>`:''}${carriesLantern()?`<div class="inventory-entry lantern-item"><div><b>✧ The Last Lantern ×1</b><small>Storybound magical artifact · ${lanternSparks()} / 3 sparks remaining. Its light can change situations and unlock unique story choices. Sparks are spent only when you explicitly choose an action; a Long Rest restores one, and you may find other ways to rekindle it.</small><div class="lantern-sparks" aria-label="${lanternSparks()} of 3 lantern sparks remaining">${[0,1,2].map(i=>`<span class="${i<lanternSparks()?'filled':''}">✦</span>`).join('')}</div></div></div>`:''}${s.unlocked>=9?`<div class="inventory-entry"><div><b>⚔ Watchroad weapon upgrade</b><small>${world().gear.weapon?'Equipped: +1 to weapon attacks and damage in Act II':'Not purchased · visit Waycross, Saltmere or Citadel'}</small></div></div><div class="inventory-entry"><div><b>▣ Protective ward buckle</b><small>${world().gear.shield?'Equipped: +1 AC in Act II':'Not purchased'}</small></div></div><div class="inventory-entry"><div><b>✧ Emberglass ×${world().emberglass}</b><small>Recharge the Last Lantern at regional shrines. Found in optional ruins or bought from merchants.</small></div></div><div class="inventory-entry"><div><b>✦ Flashpowder ×${world().flashpowder}</b><small>Use during regional combat to injure and disorient an enemy.</small></div></div><div class="inventory-entry"><div><b>♡ Field bandages ×${world().bandages}</b><small>Heal 1d6+2 HP outside combat.</small></div></div>`:''}<div class="inventory-entry"><div><b>⚗ Potion of Healing</b><small>2d4+2 HP · 2024 Bonus Action · ×${s.potions}</small></div><button data-act="item:potion" ${s.potions<=0||s.hp>=maxHp()?'disabled':''}>Drink</button></div>${Object.entries(ITEM_INFO).map(([id,[name,desc]])=>`<div class="inventory-entry"><div><b>${esc(name)} ×${s.inventory[id]||0}</b><small>${esc(desc)}</small></div>${id==='smoke'?`<button data-act="item:smoke" ${s.inventory.smoke<=0||s.stage!=='crossingBattle'?'disabled':''}>Use</button>`:id==='rations'?`<button data-act="item:rations" ${!s.inventory.rations?'disabled':''}>Eat</button>`:id==='torch'?`<button data-act="item:torch">${s.flags.torchLit?'Put out':'Light'}</button>`:''}</div>`).join('')}<div class="inventory-entry"><div><b>⚔ Equipped weapon</b><small>${s.equipped==='alternate'?(s.classId==='fighter'?'Javelin':s.classId==='rogue'?'Shortbow':'Quarterstaff'):hero().weapon} · change range in bridge battles</small></div><button data-act="item:equip">Swap</button></div>${s.flags.key?'<div class="inventory-entry"><div><b>✧ Silver wolf-key</b><small>A reusable master maintenance key for the old waylights; it can repair multiple beacons without being consumed.</small></div></div>':''}</div>`;}
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
 if(action.startsWith('wb:'))return worldBattleAction(action);
 if(action.startsWith('wtravel:'))return worldMapTravel(action);
 if(action.startsWith('wparty:'))return worldPartyAction(action);
 if(action.startsWith('w:'))return worldAction(action);
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


// ACT II — THE SHATTERED WATCHROAD: self-contained quest/party/economy state.
const WORLD_STAGES = {
 roadMap:9, roadCamp:9, roadFireside:9, waymarket:10, wayInvestigation:10, waygate:10,
 northmoor:11, moorPass:11, maraMemory:11, moorBeacon:11, glassfen:12, fenCauseway:12, tamsinShelter:12, fenBeacon:12,
 harbor:13, harborTribunal:13, corvinLedger:13, harborBeacon:13, undercrypt:14, cryptThreshold:14, cryptArchive:14,
 citadel:15, citadelDebate:15, citadelSpire:15, heartTrial:16, worldheart:16, roadFinale:16
};
const WORLD_ART = {roadMap:'summit',roadCamp:'forest',roadFireside:'campfire',waymarket:'village',wayInvestigation:'waycross',waygate:'crossing',northmoor:'forest',moorPass:'moor',maraMemory:'moor',moorBeacon:'summit',glassfen:'forest',fenCauseway:'fen',tamsinShelter:'fen',fenBeacon:'vault',harbor:'harbor',harborTribunal:'harbor',corvinLedger:'harbor',harborBeacon:'summit',undercrypt:'passage',cryptThreshold:'archive2',cryptArchive:'arcane',citadel:'village',citadelDebate:'citadel',citadelSpire:'summit',heartTrial:'worldheart',worldheart:'worldheart',roadFinale:'worldheart'};
const WORLD_CHAPTERS = [
 [9,'The Map Beneath the Light','The network is revealed; choose companions'],
 [10,'Waycross','Earn gold, trade and establish a foothold'],
 [11,'The North Moor','The first remote waylight'],
 [12,'Glassfen','A dangerous crossing and a second signal'],
 [13,'Saltmere Harbor','Trade, witnesses and an endangered harbor light'],
 [14,'The Buried Archive','The network’s forgotten history'],
 [15,'The Citadel of Bells','Choose whom you are willing to trust'],
 [16,'The Heart of the Road','Decide the fate of the entire network']
];

// Optional regional adventures: each is a location with multiple solutions, its own
// challenge, remembered loot, and a reason to return to the main road.
const SIDE_SITES={
 oldDepot:{chapter:10,hub:'waymarket',title:'The Unpaid Caravan Depot',enemy:'depotThugs',skill:'investigation',dc:14,rewardGold:12,shards:1,companion:'corvin',intro:[
  'Behind the main market stands an abandoned distribution depot whose doors have been nailed shut with fresh iron. Chalk tally marks cover every beam, but someone has scratched out the names of the people who were owed grain.',
  'You hear movement between stacked wagon frames. A courier has been hiding here rather than deliver the missing cargo, frightened of the guards collecting debts for a merchant who died three winters ago.',
  'The problem is not simply a locked storehouse: a false debt is being used to keep food from reaching the northern road. You can expose the books, talk with those involved, or face the enforcers still guarding the door.'
 ], success:'You recover the authentic account book and release the withheld grain. A cartwright pays you for bringing the depot back into service.',fail:'You force a way through the rotting records and take a bruise from falling timbers, but the missing grain is freed. You cannot identify every person responsible.',loot:'A cartwright gives you a small emberglass lens recovered from a ruined waylight, along with road wages.'},
 moorWatch:{chapter:11,hub:'northmoor',title:'The Watchtower Above the Wind',enemy:'watchRavagers',skill:'survival',dc:14,rewardGold:8,shards:1,companion:'mara',intro:[
  'A ruined signal tower leans over a mile of empty heather. Its ladder is gone and bird nests hang from the parapet, but there is fresh smoke rising from the keepers’ cellar.',
  'A patrol knot is tied to the door. Someone has been using the old emergency stores, and the broken signal prism upstairs is sending travelers directly toward a dangerous ravine.',
  'At twilight you hear hungry scavengers among the stones. Restoring the tower means reaching the prism, recovering the remaining stores, and deciding how to deal with the creatures that now shelter here.'
 ],success:'You cross the wind-scoured parapet, reset the route prism, and rescue the wayfarers approaching the ravine.',fail:'You find the emergency signal only after slipping on the ruined steps. The tower is safe again, but the fall costs you strength.',loot:'A clear emberglass sliver falls from the restored prism. The pattern cut into its rim identifies it as a reservoir for lantern fire.'},
 fenReliquary:{chapter:12,hub:'glassfen',title:'The Chapel Beneath the Reeds',enemy:'reedWights',skill:'arcana',dc:15,rewardGold:7,shards:2,companion:'tamsin',intro:[
  'At low tide the fen exposes the bronze roof of a chapel, its ancient bells muffled under black water. Families once left lights here so lost children could follow the sound home.',
  'A healer’s boat has run aground outside the entrance. The boatman will not leave without a reliquary chest containing the only fever medicine this season, but strange figures move beneath the flooded floor.',
  'The blue network flickers through the murk. Its old sanctification marks might calm the guardians; brute force and careful navigation are also possible, though every hour matters to the patients waiting upriver.'
 ],success:'You decipher the submerged ward and bring the medicine chest into daylight without destroying the chapel.',fail:'The old wards resist your attempt and the cold water burns your skin, but you recover the medicine before the flood rises.',loot:'Inside the medicine chest lies a pair of emberglass fragments preserved for emergencies, now entrusted to your company.'},
 saltCistern:{chapter:13,hub:'harbor',title:'The Smugglers’ Salt Cistern',enemy:'cisternBlades',skill:'insight',dc:15,rewardGold:18,shards:1,companion:'corvin',intro:[
  'Beneath Saltmere’s drying warehouses, a tunnel follows the forgotten aqueduct toward the sea. The tide carries crushed shells into chambers once meant to keep drinking water clean.',
  'A dockworker tells you her brother disappeared after refusing to sign a false shipping manifest. In the cistern you find newly painted guild seals—and voices arguing about a ledger that no one was supposed to read.',
  'The false shipping manifests use an old debt-shifting trick. The people guarding the passage are not all professional criminals, but they have every reason to fear the owners of the docks.'
 ],success:'You catch the contradictions in the smugglers’ story, secure the stolen wages and escort the missing dockworker back to daylight.',fail:'The discussion turns ugly; you fight through darkness and confusion to save the dockworker, but you leave with injuries and fewer answers.',loot:'The rescued workers contribute part of their recovered wages and a lantern component taken from the smuggler’s hoard.'},
 bellCatacomb:{chapter:15,hub:'citadel',title:'The Silent Bell Catacombs',enemy:'bellSentinel',skill:'investigation',dc:16,rewardGold:10,shards:2,companion:'mara',intro:[
  'Under the Citadel an older city sleeps: arched vaults, drowned clockworks and bells that were buried instead of melted. The old keepers carved their names where no council could erase them.',
  'The great bell is silent because its counterweight was chained to a private charter lock. When you touch the rusted mechanism, an armored figure of dust and bronze rises to defend an agreement that nobody living remembers signing.',
  'Breaking the guardian may silence the bell forever. You could instead read the founding marks, persuade an ally to help, or spend a lantern spark to reveal how the lock was meant to open.'
 ],success:'You align the bell with its original keepers’ names. Its voice carries through the Citadel, calling witnesses to the square.',fail:'You force open the ancient mechanism at considerable effort. The bell rings, but its broken gears cut your hands.',loot:'The bell chamber releases two emberglass shards and a small maintenance stipend kept by the old stewards.'}
};
Object.assign(WORLD_STAGES,Object.fromEntries(Object.entries(SIDE_SITES).map(([id,v])=>[id,v.chapter])));
Object.assign(WORLD_ART,{oldDepot:'waycross',moorWatch:'moor',fenReliquary:'fen',saltCistern:'harbor',bellCatacomb:'citadel'});
const WORLD_START={9:'roadMap',10:'waymarket',11:'northmoor',12:'glassfen',13:'harbor',14:'undercrypt',15:'citadel',16:'worldheart'};
const COMPANIONS={
 mara:{name:'Mara',role:'Ranger · scout',tag:'Tracks, routes and safe camps',skill:'perception',bio:'A watchroad scout who refuses to abandon travelers. She believes a repaired network belongs to everyone.',ideal:'repair'},
 tamsin:{name:'Tamsin',role:'Healer · herbalist',tag:'Medicine, supplies and care',skill:'survival',bio:'An apothecary who treats travelers regardless of faction. She has little patience for needless cruelty.',ideal:'repair'},
 corvin:{name:'Corvin',role:'Ex-keeper · negotiator',tag:'Deals, history and influence',skill:'persuasion',bio:'A former waylight accountant who knows what the network can buy for the ambitious. His loyalty must be earned.',ideal:'claim'}
};
function freshWorld(){return {gold:18,day:1,hour:8,active:[],recruited:[],trust:{mara:0,tamsin:0,corvin:0},reputation:{keepers:0,syndicate:0},beacons:{waygate:'dark',moor:'dark',fen:'dark',harbor:'dark'},done:{},clues:0,mercy:0,dominion:0,relief:0,ending:null,gear:{armor:0,focus:0,boots:0,weapon:0,shield:0},slots2:0,travelSpent:0,location:'roadCamp',cargo:false,cargoReady:false,appealBasis:null,encountersWon:0,emberglass:0,flashpowder:0,bandages:0,skillAid:null,dialogue:null,shopOpen:false};}
function normalizeWorld(data){const fresh=freshWorld();if(!data||typeof data!=='object'||Array.isArray(data))return fresh;
 const clean={...fresh,...data};
 clean.gold=clamp(Number.isFinite(data.gold)?Math.trunc(data.gold):18,0,9999);
 clean.day=clamp(Number.isFinite(data.day)?Math.trunc(data.day):1,1,500);
 clean.hour=clamp(Number.isFinite(data.hour)?Math.trunc(data.hour):8,0,23);
 clean.slots2=clamp(Number.isFinite(data.slots2)?Math.trunc(data.slots2):0,0,3);
 clean.travelSpent=clamp(Number.isFinite(data.travelSpent)?Math.trunc(data.travelSpent):0,0,500);
 clean.location=typeof data.location==='string'&&/^[a-zA-Z]{3,25}$/.test(data.location)?data.location:'roadCamp';
 clean.cargo=data.cargo===true;
 clean.cargoReady=data.cargoReady===true;
 clean.encountersWon=clamp(Number.isFinite(data.encountersWon)?Math.trunc(data.encountersWon):0,0,20);
 clean.gear={armor:clamp(Number(data.gear?.armor)||0,0,1),focus:clamp(Number(data.gear?.focus)||0,0,1),boots:clamp(Number(data.gear?.boots)||0,0,1),weapon:clamp(Number(data.gear?.weapon)||0,0,1),shield:clamp(Number(data.gear?.shield)||0,0,1)};
 for(const k of ['emberglass','flashpowder','bandages'])clean[k]=clamp(Number.isFinite(data[k])?Math.trunc(data[k]):0,0,30);
 clean.skillAid=data.skillAid&&['mara','tamsin','corvin'].includes(data.skillAid.id)&&['perception','survival','persuasion'].includes(data.skillAid.skill)?{id:data.skillAid.id,skill:data.skillAid.skill}:null;
 clean.shopOpen=data.shopOpen===true;
 clean.dialogue=data.dialogue&&COMPANIONS[data.dialogue.id]&&WORLD_STAGES[data.dialogue.stage]&&Number.isInteger(data.dialogue.chapter)?{id:data.dialogue.id,stage:data.dialogue.stage,chapter:clamp(data.dialogue.chapter,9,16)}:null;
 clean.active=Array.isArray(data.active)?[...new Set(data.active.filter(x=>COMPANIONS[x]))].slice(0,2):[];
 clean.recruited=Array.isArray(data.recruited)?[...new Set(data.recruited.filter(x=>COMPANIONS[x]))]:[];
 clean.active=clean.active.filter(id=>clean.recruited.includes(id));
 clean.trust=Object.fromEntries(Object.keys(COMPANIONS).map(id=>[id,clamp(Number.isFinite(data.trust?.[id])?data.trust[id]:0,-3,5)]));
 clean.reputation={keepers:clamp(Number.isFinite(data.reputation?.keepers)?data.reputation.keepers:0,-10,10),syndicate:clamp(Number.isFinite(data.reputation?.syndicate)?data.reputation.syndicate:0,-10,10)};
 clean.beacons=Object.fromEntries(Object.keys(fresh.beacons).map(id=>[id,['dark','restored','claimed','independent'].includes(data.beacons?.[id])?data.beacons[id]:'dark']));
 clean.done={};if(data.done&&typeof data.done==='object'&&!Array.isArray(data.done))for(const [k,v] of Object.entries(data.done)){if(/^[a-zA-Z0-9_:-]{1,50}$/.test(k)&&v===true)clean.done[k]=true;}
 if(clean.done.fenRescue)clean.done.fenRescueSafe=true; // Both historic outcomes reached shore, even on a costly failed check.
 clean.appealBasis=typeof data.appealBasis==='string'&&/^[0-9|:-]{1,80}$/.test(data.appealBasis)?data.appealBasis:null;
 clean.freeAccordCost=data.freeAccordCost&&typeof data.freeAccordCost==='object'&&!Array.isArray(data.freeAccordCost)?Object.fromEntries(['claims','days','spentGold','spentRations','spentHp'].map(k=>[k,clamp(Number.isFinite(data.freeAccordCost[k])?Math.trunc(data.freeAccordCost[k]):0,0,9999)])):null;
 for(const k of ['clues','mercy','dominion','relief'])clean[k]=clamp(Number.isFinite(data[k])?Math.trunc(data[k]):0,0,50);
 clean.ending=['restore','rule','free'].includes(data.ending)?data.ending:null;
 const b=data.battle;clean.battle=b&&b.active===true&&[...Object.keys(WORLD_STAGES)].includes(b.origin)&&Number.isFinite(b.enemyHp)&&Number.isFinite(b.enemyMax)&&['initiative','player','result'].includes(b.phase)?{active:true,origin:b.origin,encounter:typeof b.encounter==='string'&&/^[a-zA-Z]{3,22}$/.test(b.encounter)?b.encounter:null,enemyHp:clamp(b.enemyHp,0,60),enemyMax:clamp(b.enemyMax,1,60),enemyAc:clamp(Number(b.enemyAc)||12,1,30),round:clamp(Number(b.round)||1,1,100),phase:b.phase,guard:!!b.guard,bonus:!!b.bonus,started:!!b.started,allyUsed:!!b.allyUsed,actionUsed:!!b.actionUsed,extra:!!b.extra,hidden:!!b.hidden,next:['player','enemy','victory','defeat','flee','bonus','start','surge'].includes(b.next)?b.next:null,result:b.result&&typeof b.result==='object'?{title:String(b.result.title||'').slice(0,200),story:String(b.result.story||'').slice(0,1000),math:String(b.result.math||'').slice(0,400)}:null}:null;
 if(clean.battle?.phase==='result'&&(!clean.battle.result||!clean.battle.next))clean.battle=null;
 return clean;
}
function world(){if(!s.frontier)s.frontier=freshWorld();return s.frontier;}
function wDone(key){return world().done[key]===true;}
function worldHeroLabel(){return `${esc(s.heroName)} · ${esc(hero().name)}`;}
function wChoice(key,title,detail,icon='✧',locked=false){return choice('w:'+key,title,detail,icon,locked);}
function wTrusted(id){return world().active.includes(id)&&world().trust[id]>-2;}
function worldCompanionBonus(skill){return Object.values(COMPANIONS).some(c=>c.skill===skill&&wTrusted(Object.keys(COMPANIONS).find(id=>COMPANIONS[id]===c)))?2:0;}
function worldDescribeParty(){const names=world().active.map(id=>COMPANIONS[id].name);return names.length?`${names.join(' and ')} ${names.length===1?'travels':'travel'} beside you.`:'For now you walk without companions; the road can be braved alone.';}
function worldCanSpend(n){return world().gold>=n;}
function worldGain(amount){world().gold=Math.max(0,Math.min(9999,world().gold+amount));}
function worldLoyalty(keepers=0,syndicate=0,trustChange={}){const w=world();w.reputation.keepers=clamp(w.reputation.keepers+keepers,-10,10);w.reputation.syndicate=clamp(w.reputation.syndicate+syndicate,-10,10);
 for(const id of Object.keys(trustChange))if(COMPANIONS[id])w.trust[id]=clamp(w.trust[id]+trustChange[id],-3,5);
 for(const id of [...w.active])if(w.trust[id]<=-2){w.active=w.active.filter(x=>x!==id);record(`${COMPANIONS[id].name} refuses to take part in the party's current methods and stays at the nearest safe waypoint.`);}
}
function worldBeat(title,body,success=null,roll=null){outcome(title,body,success,roll);commit();}
function worldTravel(stage,title,body){
 const old=s.stage;world().shopOpen=false;world().dialogue=null; const ch=WORLD_STAGES[stage]||9;
 const travel=worldTravelCost(old,stage);
 worldAdvanceLevel(ch);
 newChapter(stage,title,`${body} ${travel}`);
}
function worldTravelCost(origin,destination){
 const w=world(); w.day=Math.min(500,w.day+1); w.hour=8; w.travelSpent++;
 let expense='You eat one ration during the journey.';
 if(s.inventory.rations>0)s.inventory.rations--;
 else {const before=s.hp;s.hp=Math.max(1,s.hp-(w.gear?.boots?1:2));expense=`Without a ration, fatigue costs ${before-s.hp} HP (minimum 1 HP).`;}
 w.location=destination;
 if(w.cargo&&(destination==='northmoor'||destination==='waymarket')){
  if(w.cargoReady){w.cargo=false;w.cargoReady=false;w.done.portDelivery=true;worldGain(14);worldLoyalty(1,0,{tamsin:1});record('The Saltmere cargo arrives safely after you secured the route. You earn the agreed 14 gp.');expense+=' Your guarded cargo arrives safely, earning the contracted 14 gp.';}
  else expense+=' The courier accepts your arrival but not the unsecured crate: its seal and manifest remain disputed. No fee is paid. Return to Saltmere to settle the delivery with a skill check or a fight.';
 }
 return expense;
}
function worldAdvanceLevel(ch){
 const target=ch>=15?4:ch>=12?3:2;
 if((s.level||2)>=target)return;
 while((s.level||2)<target){const before=maxHp();s.level++;s.hitDice=Math.min(s.level,s.hitDice+1);
  s.hp=Math.min(maxHp(),s.hp+(maxHp()-before));
  if(s.classId==='fighter')s.secondWind=Math.min(s.level>=4?3:2,(s.secondWind||0)+1);
  if(s.classId==='wizard'){s.slots=Math.max(s.slots,4);world().slots2=s.level>=4?3:2;}
 }
 record(`Milestone advancement: level ${s.level}. ${s.classId==='fighter'?'Champion training improves critical hits.':s.classId==='rogue'?'Thief training strengthens Sneak Attack.':'Evoker training grants access to level-2 spells.'} Level 4 grants a preset +2 primary Ability Score Improvement.`);
}
function worldStep(stage,title,body){world().shopOpen=false;world().dialogue=null;moveScene(stage,title,body);}
function worldCheck(skill,dc,title,winText,failText,apply){
 const score=(skillBonus(skill)??0)+(skill==='arcana'?Number(world().gear.focus||0):0),extra=worldCompanionBonus(skill);const aid=world().skillAid?.skill===skill&&wTrusted(world().skillAid?.id)?2:0;if(aid)world().skillAid=null;const die=rand(20),total=die+score+extra+aid,passed=total>=dc;
 const roll={name:skill==='perception'?'Wisdom (Perception)':skill==='persuasion'?'Charisma (Persuasion)':skill==='investigation'?'Intelligence (Investigation)':skill==='arcana'?'Intelligence (Arcana)':skill==='insight'?'Wisdom (Insight)':'Wisdom (Survival)',die1:die,die2:null,die,total,modifier:score+extra+aid,dc,mode:'normal',success:passed};
 s.checks.push(roll);record(`Watchroad check: ${title}: d20 ${die} + ${score}${extra?' + '+extra+' companion':''}${aid?' + 2 prepared advice':''} = ${total} vs ${dc}.`,'roll');
 if(typeof apply==='function')apply(passed);
 worldBeat(title,`${passed?winText:failText} Roll: ${die} ${signed(score+extra+aid)} = ${total} against DC ${dc}.${extra?' A companion contributed +2.':''}`,passed,roll);
}
// The same four approaches are available at every regional waylight. The
// original silver wolf-key is reusable; a spark is spent but the lantern is not.
// Delegation is a complete local solution only after a day's actual repair work.
const BEACON_KEEPERS={
 waygate:{town:'Waycross',keeper:'Seret and the gatehouse volunteers',stage:'waygate'},
 moor:{town:'North Moor',keeper:'Isolde and the moorland shepherds',stage:'moorBeacon'},
 fen:{town:'Glassfen',keeper:'the ferrymasters from both banks',stage:'fenBeacon'},
 harbor:{town:'Saltmere',keeper:'the lighthouse keeper and the sailors’ council',stage:'harborBeacon'}
};
function beaconMethod(id){const w=world();return ['spark','key','delegate','claimed','legacy'].find(method=>w.done['beaconMethod:'+id+':'+method])||null;}
function worldBeaconChoices(id){const b=BEACON_KEEPERS[id];if(!b)return [];
 return [
  carriesLantern()?wChoice('beacon:'+id+':spark','Rekindle the waylight with the Last Lantern',`Spend 1 spark (${lanternSparks()}/3) · awaken the public signal without removing your lantern`,'✧',lanternSparks()<1):null,
  s.flags.key?wChoice('beacon:'+id+':key','Repair the waylight with the silver wolf-key','Use the reusable old maintenance key · restore the public signal','⚒'):null,
  wChoice('beacon:'+id+':delegate','Entrust the repair to local keepers',`Help ${b.keeper} finish the work · spend 1 day`,'♡'),
  wChoice('beacon:'+id+':claimed','Bind the waylight to a private seal','Accept guild backing · earn 16 gp · restrict travelers','♛')
 ].filter(Boolean);
}
function worldBeacon(id,approach){
 const w=world(),b=BEACON_KEEPERS[id];
 if(!b||s.stage!==b.stage||w.beacons[id]!=='dark')return;
 if(!['spark','key','delegate','claimed','restored'].includes(approach))return;
 if(approach==='spark'&&(!carriesLantern()||lanternSparks()<1))return;
 if(approach==='key'&&!s.flags.key)return;
 // Earlier v3.1 test/save actions are accepted as ordinary public restoration.
 const method=approach==='restored'?'legacy':approach;
 if(method==='spark')s.lanternSparks--;
 w.done['beaconMethod:'+id+':'+method]=true;
 if(method==='delegate'){
  w.beacons[id]='independent';w.mercy++;
  w.day=Math.min(500,w.day+1);w.hour=8;
  const supplied=s.inventory.rations>0;
  if(supplied)s.inventory.rations--;
  worldLoyalty(1,0,{mara:1,tamsin:1});
  worldBeat('The light passes into local hands',`You ask ${b.keeper} to take responsibility, and listen to what materials and labor they actually need. You stay to help for a full day${supplied?', contributing one ration':''}. By evening, they have repaired the ${b.town} waylight and established their own rotating watch. The signal shines for travelers, but the keepers—not you or the guild—control its maintenance. No gold reward is collected.`,true);
  return;
 }
 if(method==='claimed'){
  w.beacons[id]='claimed';w.dominion++;worldGain(16);
  worldLoyalty(-2,2,{mara:-1,tamsin:-1,corvin:1});
  worldBeat('Power under a new seal',`You use the guild's proprietary binding apparatus to redirect the ${b.town} waylight to a personal charter. A broker pays you 16 gp for preferential access. People who previously traveled freely may now have to pay. This is a decision about control, not a lantern repair, and any companions travelling with you will remember it.`,true);
  return;
 }
 w.beacons[id]='restored';w.mercy++;worldLoyalty(2,-1,{mara:1,tamsin:1,corvin:-1});worldGain(5);
 const text=method==='spark'
  ?`You lift the Last Lantern and offer one of its sparks to the ${b.town} waylight. The failing crystal catches the blue flame and its ancient self-aligning conductor wakes. The public signal stabilizes across the road. ${lanternSparks()} of 3 sparks remain, and the lantern stays in your Pack.`
  :method==='key'
  ?`The silver wolf-key fits a maintenance socket marked by the same three-eyed wolf as the first beacon. You turn it and realign the damaged mechanism by hand. The ${b.town} signal burns steadily for every traveler. The master key is reusable and remains in your Pack.`
  :`You restore the ${b.town} public conductor and return the light to every traveler.`;
 worldBeat(method==='spark'?'One spark, another road relit':method==='key'?'The old mechanism remembers':'A light for everyone',`${text} The local keepers contribute 5 gp to your travel fund, while the guild loses its claim to exclusive passage.`,true);
}
function worldSceneLegacy(){const w=world(),status=(id)=>w.beacons[id]==='dark'?'unresolved':w.beacons[id]==='restored'?'freely restored':w.beacons[id]==='independent'?'repaired under local stewardship':'under private control';
 switch(s.stage){
 case 'roadMap':return {chapter:9,label:'THE MAP BENEATH THE LIGHT',heading:'A thousand roads in one flame',text:[
 'Your journey through Blackwood was only the beginning. High above Blackwood, the mountain light opens like an eye, tracing blue lines through the hills and beyond the borders of the familiar valley.',
 'The glass beneath your hand is not a window. It is a map: roads, waystations and hundreds of linked flames. Many are dark. Others are lit with a color that suggests someone has changed their purpose.',
 carriesLantern()?'The Last Lantern answers with a pulse from your pack. Its sparks belong to a system vastly older than the tavern; what you carry could help repair that system—or put its power in private hands.':'You chose not to keep the old lantern. The mountain beacon nonetheless recognizes the promises you made on the road. You can still shape the network through people, labor and hard decisions.',
 s.flags.key?'The silver wolf-key you earned in the tavern bears the same maker’s mark as several of the distant waylights. Perhaps its purpose was never limited to a single lock.':'The three-eyed wolf maker’s mark appears at more than one distant light. Someone once maintained this entire network with a common system of tools.',
 'An old bell rings from the valley. Three travelers waiting at a ruined camp have seen the same lines appear in the sky. They ask whether you intend to follow them.'
 ],lesson:'A campaign is more than an encounter. Travel, equipment, alliances, money and moral consequences can alter who you become.',choices:[!wDone('survey')?wChoice('survey','Study the blue map','Investigation DC 12 · discover a hidden connection','◎'):null,wChoice('camp','Follow the map to the travelers’ camp','Meet people who may join your journey','↝')].filter(Boolean)};
 case 'roadCamp':return {chapter:9,label:'THE FIRST COMPANY',heading:'Three strangers at the dying fire',text:[
 'The campsite is an old maintenance post. In its center sits a stone showing the same three-eyed wolf you saw at the tavern; a loose block of blue glass lies nearby.',
 'Mara, a ranger, wants the roads reopened without tolls. Tamsin, a healer, wants the forgotten villages supplied before winter. Corvin, a former keeper, speaks of the fortunes waiting in a network no ruler understands.',
 'Each has reasons to travel with you, and reasons to leave. A party is not simply an extra set of attack bonuses.',worldDescribeParty()
 ],lesson:'Companions have goals and relationships. You can recruit up to two active allies; their trust may change as you make difficult choices.',choices:[...Object.keys(COMPANIONS).filter(id=>!w.recruited.includes(id)).map(id=>wChoice('recruit:'+id,`Invite ${COMPANIONS[id].name}`,COMPANIONS[id].tag,'♟')),wChoice('market','Travel together toward Waycross','Chapter 10 · Trade and work along the road','↝')]};
 case 'waymarket':return {chapter:10,label:'WAYCROSS',heading:'Where every road has its price',text:[
 'Waycross grew around four intersections of the old blue road. Its square is filled with wagons waiting for signals that no longer come; a tin bell hangs above the market, ringing whenever someone pays another toll.',
 `You have ${w.gold} gp. A merchant sells remedies and rations; a guild broker offers payment for private passage through the first gate. Families sheltering beneath the aqueduct ask for help reopening it.`,
 'The town seems to have two prices for everything: what the traveler pays, and what the person who controls the road earns.',worldDescribeParty()
 ],lesson:'Paid work is not automatic: investigate a hazard or defeat its opposition. Rewards require completed jobs, and unsuccessful checks do not pay.',choices:[!wDone('cartJob')&&!wDone('job:cart:tried')?wChoice('job:cart:check','Repair the sabotaged caravan axle','Investigation DC 13 · 10 gp only on success','🎲'):null,!wDone('cartJob')?wChoice('job:cart:fight','Defend the caravan from the saboteurs','Combat alternative · 10 gp on victory','⚔'):null,wChoice('potion','Buy a Potion of Healing','Cost 8 gp · 2d4+2 HP','⚗',!worldCanSpend(8)),wChoice('rations','Buy two travel rations','Cost 4 gp · useful on the road','♢',!worldCanSpend(4)),wChoice('gate','Investigate the western waygate','Decide how the first public signal should work','↝')]};
 case 'waygate':return {chapter:10,label:'THE WESTERN WAYGATE',heading:'A toll written in blue fire',text:[
 'On the old stone archway, a half-lit beacon throws a narrow blue path across the road. A guild clerk has fastened a brass lock to its control wheel. Only caravans bearing stamped passes may continue after dark.',
 w.reputation.syndicate>0?'The clerk knows you have spoken to the guild. An offer waits on the table, but it comes with conditions.':'The local keepers ask you to make the path safe for everyone, not simply for the wealthiest wagons.',
 `The waygate is ${status('waygate')}.`
 ],lesson:'A shared challenge may be solved with magic, a reusable tool, delegated repair or a private bargain. Each path has different costs and consequences.',choices:w.beacons.waygate==='dark'?worldBeaconChoices('waygate'):[wChoice('moor','Follow the northern line onto the moor','Chapter 11 · Trace the signal','↝')]};
 case 'northmoor':return {chapter:11,label:'THE NORTH MOOR',heading:'The road that has forgotten its name',text:[
 'Beyond Waycross, dry stone walls disappear beneath pale grass. Survey stakes pierce the hills where towers once stood. In the dusk, faint blue lines appear on the earth only when the clouds cover the stars.',
 'A widow named Isolde tends a roofless waystation. She says travelers have vanished because their lamps were diverted to a private estate. The northern light must be reached before the next storm.',
 wDone('moorClue')&&wDone('moorClueSuccess')?'You have identified the marks leading to the keeper’s old maintenance stair.':'The hillside gives no obvious indication of where the light can be repaired.',worldDescribeParty()
 ],lesson:'Exploration and your companions’ skills can reveal safer ways to complete a quest.',choices:[!wDone('moorClue')?wChoice('moorClue','Read the old trail markers','Perception DC 13 · Mara can help','◎'):null,!wDone('moorAid')&&!wDone('job:moor:tried')?wChoice('job:moor:check','Deliver supplies across the damaged moor road','1 ration · Survival DC 13 · 9 gp on success','🎲',s.inventory.rations<1&&!wDone('job:moor:supplied')):null,!wDone('moorAid')?wChoice('job:moor:fight','Drive raiders away from Isolde’s supply route','Combat alternative · 1 ration · 9 gp on victory','⚔',s.inventory.rations<1&&!wDone('job:moor:supplied')):null,wChoice('moorTop','Climb to the moor beacon','Face the choice at the signal tower','↝')]};
 case 'moorBeacon':return {chapter:11,label:'THE NORTHERN LIGHT',heading:'The beacon beneath the storm',text:[
 'The tower hums in the rain. Its core still carries enough energy to mark a safe crossing, but the old control wheel can send the light over the commons or narrow it toward a private road.',
 wDone('moorClueSuccess')?'The signs you traced show exactly where the public conductor should be reconnected.':'Without the old markers, you must work from the exposed conduits and trust your judgment.',
 `The North Moor beacon is ${status('moor')}.`
 ],lesson:'The same wolf-key fits multiple waylights. A spark, careful mechanical repair, or work with local stewards can all restore an accessible route.',choices:w.beacons.moor==='dark'?worldBeaconChoices('moor'):[wChoice('fen','Track the next line into Glassfen','Chapter 12 · The drowned waystation','↝')]};
 case 'glassfen':return {chapter:12,label:'GLASSFEN',heading:'A causeway beneath the water',text:[
 'At the marsh edge the road is visible only as glowing stones below black water. Whole villages once crossed on this causeway, guided by a beacon whose reflections now point travelers in circles.',
 'A barge has grounded among the reeds. Its crew can be rescued, but time and supplies are precious. Beyond them, a derelict tower leans over a pool as still as polished glass.',
 wDone('fenRescueSafe')?(wDone('fenRescueSuccess')?'The rescued crew waits by the lantern posts, grateful and ready to help with supplies.':'The barge crew has reached shore, though damaged provisions and bruised shoulders mark how hard the rescue was. They are no longer stranded.'):'The boat crew calls from the mist; you can still hear them over the water.',worldDescribeParty()
 ],lesson:'Time, equipment and care for other people shape the reputation your character earns.',choices:[!wDone('fenRescue')?wChoice('fenRescue','Help the stranded barge','Survival DC 12 · rescue may have a cost','♧'):null,!wDone('fenFight')?wChoice('fenFight','Confront the toll sentinels in the mist','Optional combat · companions can assist','⚔'):null,wChoice('fenTop','Approach the sunken beacon','Follow the light into the mist','↝')]};
 case 'fenBeacon':return {chapter:12,label:'THE DROWNED LIGHT',heading:'What the water remembers',text:[
 'An ancient mechanism churns below the surface. A fracture splits the brass housing, and the glow has been captured by a lattice of glass designed to divert light to one favored shore.',
 'The marsh folk tell you that their children have lost their way home. The private traders insist they need exclusive light to protect their boats.',
 `The Glassfen beacon is ${status('fen')}.`
 ],lesson:'A choice can be costly even when it feels easy. Companion loyalties react to the reasons behind it.',choices:w.beacons.fen==='dark'?worldBeaconChoices('fen'):[wChoice('port','Follow the river down to Saltmere','Chapter 13 · The harbor petitions','↝')]};
 case 'harbor':return {chapter:13,label:'SALTMERE HARBOR',heading:'The city of bells and ledgers',text:[
 'The harbor’s cranes silhouette a pale-blue dusk. Each dock has its own warning bell, but the central lighthouse is dark. Without it, captains rely on costly pilots employed by a single trading house.',
 'Guild scribes debate prices beneath a painted map of the coastline. A harbor worker brings you a sealed request for supplies from the villages upriver. The request is stamped with the same three-eyed wolf.',
 `Your purse holds ${w.gold} gp. Your deeds are becoming known: some call you a restorer, others an investor.`,worldDescribeParty()
 ],lesson:'Rewards, reputation and party ethics give social decisions lasting consequences.',choices:[!wDone('portDeliveryAccepted')?wChoice('portDelivery','Accept an upriver delivery','Secure the crate by skill check or fighting smugglers, then deliver it for 14 gp','♢'):null,w.cargo&&!w.cargoReady&&!wDone('job:port:tried')?wChoice('job:port:check','Secure the manifest and select a safe courier route','Survival DC 14 · enables delivery payment','🎲'):null,w.cargo&&!w.cargoReady?wChoice('job:port:fight','Defend the shipment against charter thieves','Combat alternative · enables delivery payment','⚔'):null,!wDone('portBroker')?wChoice('portBroker','Listen to a guild broker’s offer','Gain information about the lighthouse · Insight DC 12','◎'):null,wChoice('portTop','Enter the lighthouse','Find the third regional beacon','↝')]};
 case 'harborBeacon':return {chapter:13,label:'THE HARBOR LIGHT',heading:'Where the ships choose their shore',text:[
 'On the lighthouse steps, an old keeper points to shipwreck names carved into the wall. The harbor guild offers legal control of the beam in exchange for a substantial payment.',
 wDone('portBrokerSuccess')?'You caught contradictions in the broker’s explanation; their priorities are now easier to recognize.':'The guild proposal offers wealth without explaining who will be turned away.',
 `The Saltmere beacon is ${status('harbor')}.`
 ],lesson:'The lighthouse can be maintained by you, by the common road or by local sailors. Control determines whose needs come first.',choices:w.beacons.harbor==='dark'?worldBeaconChoices('harbor'):[wChoice('crypt','Seek the buried origin of the map','Chapter 14 · The hidden records','↝')]};
 case 'undercrypt':return {chapter:14,label:'THE BURIED ARCHIVE',heading:'Beneath the city’s founding stone',text:[
 'The path below the harbor passes through tunnels of blue tile and dark basalt. Here the road map ceases to be metaphor: glass filaments run through the stone, connecting every old signal to a hidden center.',
 'You find the records of people who built the beacons without crowns or charters. Later authorities wrote new names over the old ones. A ledger lies sealed behind a mechanism that listens for the familiar three-eyed wolf.',
 carriesLantern()?'The lantern in your pack flickers at the sealed mechanism, but it does not choose for you.':'The seal also responds to the record of your actions across the watchroad. Carrying the lantern is not a requirement.',worldDescribeParty()
 ],lesson:'History, evidence and power can become campaign resources. A secret need not be sold just because it is valuable.',choices:[!wDone('cryptSolve')?wChoice('cryptSolve','Read the founders’ account','Investigation DC 14 · discover the network’s central pact','◎'):null,wChoice('archive','Follow the glass filaments to the records','Decide what should happen to them','↝')]};
 case 'cryptArchive':return {chapter:14,label:'THE FOUNDERS’ ARCHIVE',heading:'A truth with a buyer',text:[
 'The book explains how the waylights began as a promise among villages: every keeper could use the light, but none was permitted to own every route. Over time the promise became a profitable monopoly.',
 'A sealed copy could prove that the private tolls are based on a later forgery. It could also be sold to those who want the truth buried.',
 w.clues>0?'Your earlier discoveries lend credibility to the founders’ account.':'You understand the broad history but lack some of the specific corroborating names and dates.'
 ],lesson:'Evidence gives access to later social options. Gold from selling it may come at a moral cost.',choices:[!wDone('archiveChoice')?wChoice('archivePublish','Copy the records for the public','Protect the evidence · gain keepers’ trust','✦'):null,!wDone('archiveChoice')?wChoice('archiveSell','Sell exclusive rights to the records','Receive 25 gp; others cannot inspect your copy','♛'):null,wDone('archiveChoice')?wChoice('toCitadel','Take your findings to the Citadel of Bells','Chapter 15 · Alliances are tested','↝'):null].filter(Boolean)};
 case 'citadel':return {chapter:15,label:'THE CITADEL OF BELLS',heading:'An invitation on two seals',text:[
 'Two summons await you at the Citadel gate. The public keepers want the network governed by a council of towns. The Syndicate wants a single steward, paid to keep the roads safe—or to keep its rivals out.',
 'You can accept the protection of either faction, or remain unaligned and risk being heard by neither. Your companions have their own thoughts about what has happened along the road.',
 `Keepers’ standing: ${w.reputation.keepers}. Syndicate standing: ${w.reputation.syndicate}.`,worldDescribeParty()
 ],lesson:'Your allies and previous deeds affect your credibility. Negotiation is not an automatic success regardless of context.',choices:[!wDone('citadelPledge')?wChoice('pledgeKeepers','Stand with the public keepers','Support a council of towns','✦'):null,!wDone('citadelPledge')?wChoice('pledgeGuild','Seek a charter from the Syndicate','Support a powerful single steward','♛'):null,!wDone('citadelPledge')?wChoice('pledgeNone','Remain independent','Answer only to your own conscience','◇'):null,wDone('citadelPledge')?wChoice('spire','Enter the Citadel spire','Face the consequences of your alliances','↝'):null].filter(Boolean)};
 case 'citadelSpire':return {chapter:15,label:'THE CITADEL SPIRE',heading:'The price of a final invitation',text:[
 'At the highest room, a great glass globe displays every road you have traveled. Behind its blue lines are villages, waystations and names that cannot be reduced to marks on a map.',
 `The signals now read: ${Object.entries(w.beacons).map(([id,state])=>`${id} (${state})`).join(', ')}.`,
 'The two factions wait for your answer. You may bargain for a mandate, but legitimate evidence and relief donations must be earned separately. No promise automatically rewrites previous deeds.',worldDescribeParty()
 ],lesson:'Your group can disagree. Companions are people with preferences, not just equipment.',choices:[!wDone('relief')?wChoice('relief','Fund a village relief caravan','Spend 12 gp; aid people left without light','♡',!worldCanSpend(12)):null,!wDone('spireFight')?wChoice('spireFight','Face the charter enforcers','Optional tactical duel before reaching the heart','⚔'):null,wChoice('heart','Follow the final blue line','Chapter 16 · The Worldheart','↝')]};
 case 'worldheart':return {chapter:16,label:'THE HEART OF THE ROAD',heading:'The light beneath all roads',text:[
 'You reach the chamber where the blue lines meet. Its vast mirror reflects towns you have helped, towns you profited from, and those whose names never reached the official records.',
 'A voice asks not what kind of hero you claim to be, but what your actions have permitted others to do. You may reconnect the network for everyone, take its authority, or release it from central control entirely.',
 `You restored ${w.mercy} public waylights and claimed ${w.dominion} for private control. ${worldDescribeParty()}`,
 'This decision cannot be undone on your main save except by importing an earlier backup; chapter replays remain separate.'
 ],lesson:'This is the campaign’s final moral choice. Its consequences draw on what you did, whom you helped, and who still trusts you.',choices:[wChoice('finalRestore','Rebuild the commons network','Reconcile earlier claims; requires resources or a public mandate','✦',!worldCanRestore()),wChoice('finalRule','Take the network as your own','Requires acquired influence or a paid charter','♛',!worldCanRule()),wChoice('finalFree','Break the central seal','Negotiate local stewardship · takes at least 1 day; each private claim costs time and resources','◇'),!worldCanRestore()?wChoice('prepareCommons','Negotiate a public mandate',worldCanAppeal()?'Takes one full day and a new persuasion check':'Bring new evidence, relief or support before appealing again','♧',!worldCanAppeal()):null,!worldCanRule()?wChoice('buyCharter','Purchase a charter of stewardship','Spend 30 gp to establish your claim','♛',!worldCanSpend(30)):null].filter(Boolean)};
 case 'roadFinale':return {chapter:16,label:'THE SHATTERED WATCHROAD',heading:w.ending==='restore'?'The road belongs to everyone':w.ending==='rule'?'A crown without a throne':'A thousand smaller promises',text:[
 w.ending==='restore'?'The blue lines spread like dawn over a map that no longer has a single owner. Reopened roads require maintenance, votes, wages and cooperation, but the next caravan can travel without purchasing permission from you.':w.ending==='rule'?'From the Worldheart you could direct every waylight. Wealth flows with the tolls. Your name becomes a guarantee to those you protect and a warning to those you exclude; governing the network will demand more than taking it.':`The central glass goes dark for a heartbeat. Then independent lanterns bloom across the map: smaller, fragile, but free from any single hand. Villages must learn to coordinate without the old central command. Your ${w.freeAccordCost?.days??1}-day settlement included the cost of relinquishing ${w.freeAccordCost?.claims??0} private claims.`,
 w.ending==='rule'&&w.reputation.keepers<0?'Several public keepers withdraw their support, leaving your agents to maintain roads whose communities distrust them.':w.ending==='restore'&&w.mercy>=3?'The restored waylights answer in sequence, and the first night courier reaches a village long thought unreachable.':w.ending==='free'?'Local watch committees form around surviving towers, each making different choices with their share of the light.':'The final choice does not erase the record of how you traveled here.',
 world().active.length?`At your side stand ${world().active.map(id=>COMPANIONS[id].name).join(' and ')}, each carrying their own memories of the journey.`:'You stand alone in the chamber, but every person who crossed your road remembers what you did.',
 carriesLantern()?'The Last Lantern remains in your pack, a reminder that holding power is never the same as understanding it.':'You leave without carrying the Last Lantern; the network was always larger than any one object.',
 `Your purse contains ${w.gold} gp. Your choices have been recorded in the Journal. You can review the region on your Map or safely revisit events through chapter replay. This campaign is complete.`
 ],lesson:'A tabletop campaign can conclude without every consequence being simple or happy. Your actions are the story you made.',choices:[wChoice('mapOpen','Review the full regional map','See how each waylight was left','◎'),wChoice('partyOpen','Review your traveling company','See who traveled with you','♟'),wChoice('chaptersOpen','Replay chapters safely','Keep the main ending and experiment in a separate slot','↶')]};
 default:return {chapter:9,label:'THE WATCHROAD',heading:'Follow the blue path',text:['The blue road leads onward.'],choices:[]};
 }
}
// Act II expansion: connected scenes, fair costs and consequences, and optional solutions.
const WORLD_SAFE_STAGES=new Set(['roadCamp','roadFireside','waymarket','harbor','citadel']);
function worldCanTalkHere(){return Boolean(WORLD_STAGES[s.stage]&&!['roadFinale','roadFireside','maraMemory','tamsinShelter','corvinLedger'].includes(s.stage)&&!SIDE_SITES[s.stage]&&!FRONTIER_CHALLENGES[s.stage]&&!world().shopOpen&&!world().dialogue);}
const FRONTIER_CHALLENGES={
 wayInvestigation:{chapter:10,from:'waymarket',next:'waygate',heading:'A ledger with two sets of numbers',label:'THE GATEHOUSE ACCOUNT',skill:'investigation',dc:13,enemy:'gateRaid',cost:7,
  intro:['The gatehouse clerk keeps two account books: one for paying travelers, another hidden beneath the tax seal. A child watches the queue from the shadow of an empty grain wagon. Every paid passage buys one more meal for the guard and none for the families behind the wall.','An elderly keeper called Seret offers you a place at her table. “If you want the light open,” she says, “show me whose signature closes it. If you want it for yourself, show the clerk what you can offer.”','Beyond the half-shuttered arch, men wearing a private toll badge are forcing a trader off the road. The choice of how to intervene is yours.'],
  win:'You find the forged toll entry and a witness willing to sign her name. The clerk must concede a safe route to the control wheel.',fail:'You cannot prove the entries false, but Seret teaches you a manual bypass. You lose time and two HP forcing the panel; you can still reach the beacon.',nextText:'The gatehouse passage is open. Seret leads you to the waylight, aware that access to the machinery does not itself settle the toll dispute.'},
 moorPass:{chapter:11,next:'moorBeacon',heading:'The storm and the lost shepherd',label:'A ROAD WITHOUT LANDMARKS',skill:'perception',dc:14,enemy:'moorWolves',cost:6,
  intro:['Wind lifts peat from the ground. Across the moor you see three moving lanterns, although Isolde swears only one living keeper remains. A shepherd is trapped beside a flooded cut, his sheep gathering against the wind.','Footprints reverse direction at each blue marker. Someone has moved the old patrol signs since the last map was drawn.','The tower can be reached, but choosing the wrong path will cost daylight and blood.'],
  win:'You find the safe line of markers and guide the shepherd onto firm ground. His gratitude earns you information about the tower.',fail:'The false markers pull you into a bog. You drag yourself free at the cost of two HP and find the tower from the far ridge.',nextText:'A stairway emerges through the rain. The storm continues, but you have made a route to the beacon.'},
 fenCauseway:{chapter:12,next:'fenBeacon',heading:'The reflection that moves against the tide',label:'GLASSFEN CROSSING',skill:'survival',dc:14,enemy:'fenGuardian',cost:8,
  intro:['The causeway is not simply flooded: the old crystal guides project a perfect image of a safe road one stride to the left of the real stones. A boatman shows you the scars left by a misstep.','Across the water a second bell rings, strangely out of rhythm with the first. Traders on the favored shore insist the illusion is necessary to keep smugglers away, while families on the other bank cannot even bring medicine home.','The mechanism must be approached without trusting appearances.'],
  win:'Following the deeper current, you uncover the submerged maintenance bolts and reach the beacon without losing supplies.',fail:'A false step plunges you into freezing water. You scramble onto the true path, suffering two HP and learning why the guides failed.',nextText:'With the false reflection behind you, you reach a service hatch hidden in the drowned tower.'},
 harborTribunal:{chapter:13,next:'harborBeacon',heading:'The harbor hearing',label:'SALTMERE TESTIMONY',skill:'persuasion',dc:14,enemy:'harborDuel',cost:10,
  intro:['Harbor law requires a hearing before anyone may touch the lighthouse lens. The council chamber smells of wet sails and sealing wax. Each dock guild has sent a speaker; the families of lost sailors are standing at the back because nobody offered them chairs.','A navigator lays out two charts. The official chart omits the reef where three ships sank, while the older one marks a blue signal that should have warned them. A guild advocate challenges you to produce evidence or guarantee the cost of new pilots.','You can speak for the excluded ships, negotiate with the guild, or face its hired guards after the hearing.' ],
  win:'Your testimony persuades the harbormaster to grant access to the light without placing a permanent guild veto on it.',fail:'The vote goes against you. An elderly lighthouse attendant points you toward a maintenance passage used by the old keeper, but you are bruised during the forced climb and lose two HP.',nextText:'The hearing disperses under a cloud of disagreement. You climb toward the lantern room with written authority—or with the old keeper’s instructions.'},
 cryptThreshold:{chapter:14,next:'cryptArchive',heading:'Three names, one missing vow',label:'THE ARCHIVE PUZZLE',skill:'arcana',dc:15,enemy:'cryptShade',cost:9,
  intro:['Beyond the burial shaft stands a door with three turning disks: a wolf, a shared flame, and a hand offering water. Each disk records an old obligation of the watchroad. Later masons scratched a fourth symbol—the coin—over the final verse.','A sealed memory of the original architects speaks through the stone. It does not ask whether you are good. It asks who would be left in darkness if your plan succeeds.','You can restore the old sequence, force the lock with a risky spell, or bargain with the memory that guards it.'],
  win:'You decipher the three vows and the disks turn together. The founders’ names become legible on the opposite wall.',fail:'Your answer makes the archive shudder; a shard cuts your hand for two HP. The memory reluctantly opens a service latch, but remembers your impatience.',nextText:'The disks fall still. Beyond the door waits the original register, with pages the powerful have spent centuries rewriting.'},
 citadelDebate:{chapter:15,next:'citadelSpire',heading:'The hearing of two seals',label:'A COUNCIL DIVIDED',skill:'insight',dc:15,enemy:'citadelGuards',cost:12,
  intro:['The Citadel’s high chamber has no throne, only concentric benches built so no one is meant to sit higher than anyone else. Yet one side is full of guild banners and the other is crowded with tired keepers.','A herald reads out the costs of rebuilding the Watchroad. The guild calls the poor roads unprofitable; the villages call the private tolls a famine by another name. Even those who share a destination disagree about which danger is most immediate.','For the first time, people ask not what you intend to do with magic, but how they can remove you from power if you abuse it.'],
  win:'You draw out the council’s real objection and secure a provisional hearing in the tower. Even opponents agree to let you present evidence.',fail:'Your argument leaves both factions wary. The caretaker leads you to the tower through a neglected stair, but you lose two HP in a falling-stone hazard.',nextText:'The votes have not settled the road’s future. They do, however, permit you to face the last signal without pretending that politics can be bypassed.'},
 heartTrial:{chapter:16,next:'worldheart',heading:'The toll that was never written down',label:'THE HEART’S TEST',skill:'arcana',dc:16,enemy:'heartEcho',cost:14,
  intro:['At the core of the network, four great lenses repeat what each town has done with its light. Some reflections show travelers finding shelter. Others show empty market stalls beneath a paid-for glow. No picture is flattering to everyone.','An echo of the first keepers stands across the bridge of glass. It cannot prevent you from making a decision, but it can demand that you understand its price. “Who will mend the road after your triumph?” it asks.','You must face the test of stewardship in some form. Knowledge, sacrifice, a companion’s trust or a difficult battle can carry you through.'],
  win:'You trace the network’s failing return current and identify the repair that will prevent the central seal from collapsing.',fail:'The glass burns your palm. You stabilize it only after accepting two HP of strain, and the memory of that cost stays with you.',nextText:'A circle of blue lights makes a passage to the heart. The network can now be changed, although no solution will absolve you of its consequences.'}
};
const WORLD_EXTRA_DETAIL={
 roadMap:['The light-lines do not cross distance for you. They mark roads that must still be walked, fed and defended. Some lines are smudged where villages disappeared from official maps.','Below the mountain, a caravan bell rings in answer to the beacon. The map has been seen by many people at once; you cannot keep its existence secret just by closing your hand.'],
 roadCamp:['Tamsin is boiling bandages in a battered kettle. Mara dries a map beside the fire. Corvin counts the missing nails on the old notice board—an odd concern, until he explains how a road decays when nobody pays the keepers.'],
 waymarket:['Two merchant families argue over the price of grain. Their quarrel is not theatrical; the cart behind them has been waiting three days for a pass. You hear the same three-eyed wolf symbol spoken as a promise by the old and as a trademark by the young.'],
 waygate:['An old public bell has been wrapped in felt so unpaid travelers cannot ring for help. The wheel that controls the waylight is old enough to outlast both the syndicate and the keeper who fears it.'],
 northmoor:['The moor smells of iron rain and crushed heather. The north road once had refuge markers at each mile; now some show the wrong direction. The difference between old negligence and deliberate sabotage is becoming difficult to ignore.'],
 moorBeacon:['A scratched list inside the tower records the names of children guided safely home during earlier storms. A later entry has been erased so roughly that pieces of stone are missing.'],
 glassfen:['The people of both banks use different words for the same lighthouse, and each insists the other bank abandoned its duty first. You begin to suspect the story was profitable to someone long before you arrived.'],
 fenBeacon:['A reed basket drifts past the tower with a child’s blue-painted toy inside. The beacon’s purpose has never been abstract to those who must cross the marsh at night.'],
 harbor:['The tides move even while the guild debates. A pilot who can read the old light takes you through the warehouses and explains how tariffs became law when emergency signals stopped working.'],
 harborBeacon:['Each carved wreck-name represents a family that could not afford the wrong route. The harbor keeper knows every name but refuses to tell you which policy to choose.'],
 undercrypt:['The corridor bears worn footprints in stone where generations brought repair reports to the founders’ registry. The archive was a public workplace before it became a hidden shrine.'],
 cryptArchive:['Some signatures on the founding accord are those of washerwomen, boatmen and watch children. Later copies mention only governors. You read the names aloud so they will not be lost again.'],
 citadel:['At the gates, servants carry letters between rival delegates while the same laborers prepare chairs for both sides. Whatever you decide, ordinary people will have to do the work afterward.'],
 citadelSpire:['The bells are polished, but their ropes have frayed. This city knows how to preserve appearances better than how to repair the mechanism beneath them.'],
 worldheart:['The original pact was not a spell of obedience. The central lens only magnifies the promises—or coercion—of those who maintain its outer lights. In the mirror, every small previous decision has become visible.']
};
const WORLD_LONG_REST_STAGES=new Set(['roadCamp','waymarket','northmoor','glassfen','harbor','citadel']);
const WORLD_FORAGE_STAGES=new Set(['roadCamp','northmoor','glassfen']);
function worldRestChoices(){
 const w=world();if(s.stage==='roadFinale')return [];
 return [wChoice('rest:short','Take a short rest','1 hour · spend a Hit Die and recover a short-rest feature','☾',s.hitDice<=0&&!(s.classId==='fighter'&&s.secondWind<(s.level>=4?3:2))&&!(s.classId==='wizard'&&!s.arcaneRecovery&&(s.slots<(s.level>=3?4:s.level>=2?3:2)||(s.level>=3&&w.slots2<(s.level>=4?3:2))))),
  ...(WORLD_LONG_REST_STAGES.has(s.stage)?[wChoice('rest:long',WORLD_SAFE_STAGES.has(s.stage)?'Take a long rest':'Find shelter for a long rest','8 hours · costs 1 ration or 5 gp at an inn','✧',s.inventory.rations<1&&!worldCanSpend(5))]:[]),
  ...(WORLD_FORAGE_STAGES.has(s.stage)?[wChoice('rest:forage','Forage for travel food','Survival DC 12 · gather 1 ration with risk','♧',w.done['forageDay'+w.day]===true)]:[])];
}
function frontierScene(){const info=FRONTIER_CHALLENGES[s.stage],w=world(),done=wDone(s.stage+'Resolved');
 const party=w.active.length?`You travel with ${w.active.map(id=>COMPANIONS[id].name).join(' and ')}; each sees the problem through the lens of a different life.`:'You have reached this decision alone. No companion will appear to rescue you from a choice you make.';
 return {chapter:info.chapter,label:info.label,heading:info.heading,text:[...info.intro,...(s.stage==='moorPass'&&wTrusted('mara')?['Mara kneels to compare these false markers with her patrol map. She recognizes where the route was deliberately changed.']:[]),party,done?`You have already found a way through. ${info.nextText}`:'Several approaches remain, each with a different cost or risk. You cannot simply claim the next light without dealing with the people and mechanisms that surround it.'],lesson:'Different approaches to an obstacle use dice, negotiation, resources and risk. Failure may cost time or HP, but need not stop the adventure.',choices:done?[wChoice('continue:'+s.stage,'Continue toward the next signal','The obstacle has been resolved · advance','↝')]:[
 wChoice('challenge:'+s.stage,'Attempt the difficult approach',`${info.skill} DC ${info.dc} · success or a costly setback`,'🎲'),
 wChoice('encounter:'+info.enemy,'Stand and fight the opposition','Optional combat encounter with a visible HP and result pause','⚔'),
 wChoice('bribe:'+s.stage,'Pay for passage or repair support',`Spend ${info.cost} gp · negotiate a costly solution`,'♛',!worldCanSpend(info.cost)),
 carriesLantern()?wChoice('lantern:'+s.stage,'Spend a Last Lantern spark','Use 1 spark to expose the way ahead','✧',lanternSparks()<1):null
 ].filter(Boolean).concat(worldRestChoices())};
}

function sideScene(){const id=s.stage,info=SIDE_SITES[id],w=world(),cleared=wDone('site:'+id);
 const friends=w.active.filter(x=>wTrusted(x)).map(x=>COMPANIONS[x].name);
 return {chapter:info.chapter,label:'OPTIONAL ADVENTURE · '+WORLD_CHAPTERS.find(x=>x[0]===info.chapter)[1].toUpperCase(),heading:info.title,
 text:[...info.intro,friends.length?`At your side, ${friends.join(' and ')} ${friends.length===1?'considers':'consider'} a different way to solve the danger. Their help is earned, not assumed.`:'You have come alone, so any risk is yours to manage.',cleared?`The site is now safe. ${info.loot}`:'The situation is still unresolved; you can withdraw and return with better equipment if necessary.'],
 lesson:'Optional quests reward success. Skill checks can fail, and companion or lantern assistance changes the odds rather than granting free loot. Fighting remains an alternative.',
 choices:cleared?[wChoice('site:back:'+id,'Return to the main road','Carry your discoveries back to the region','↶'),...(carriesLantern()&&lanternSparks()<3?[wChoice('shrine:attune:'+id,'Attune to the recovered emberglass','One-time free recharge · restore 1 spark','✧',wDone('attune:'+id))]:[])]:[
 ...(!wDone('site:try:'+id+':study')?[wChoice('site:study:'+id,'Investigate and resolve the danger',`${info.skill} DC ${info.dc} · earn loot on success`,'🎲')]:[]),
 wChoice('site:fight:'+id,'Fight through the opposition','A real combat encounter with separate action results','⚔'),
 ...(wTrusted(info.companion)&&!wDone('site:try:'+id+':ally')?[wChoice('site:ally:'+id,`Let ${COMPANIONS[info.companion].name} assist`,`Assisted ${info.skill} check · rewards require success`,'♡')]:[]),
 ...(carriesLantern()&&!wDone('site:try:'+id+':lamp')?[wChoice('site:lamp:'+id,'Use the Last Lantern to expose a hidden route',`Spend 1 spark · easier ${info.skill} check, not automatic success`,'✧',lanternSparks()<1)]:[]),
 wChoice('site:back:'+id,'Withdraw for now','Return to the main road; the site remains unexplored','↶')
 ]};
}
function companionDialogueScene(){const d=world().dialogue,c=COMPANIONS[d.id];const chapter=WORLD_STAGES[s.stage];
 const subjects={mara:['Mara spreads her patrol map across a dry stone. Several routes are marked not with distances but with names of those who went missing.','“I can guide us past the worst of it,” she says. “But I need to know what we are willing to risk for strangers.”'],tamsin:['Tamsin takes a quiet moment to clean her instruments. She tells you about a patient who paid for treatment by repairing a stranger’s roof.','“People remember who stayed when the danger stopped being glorious,” she says. “What sort of help do you believe in?”'],corvin:['Corvin counts a handful of copper coins, then deliberately scatters them across the table. He shows you how small tolls become impossible debts.','“I could make you wealthy,” he says, “but I would rather you understand whose money it really is.”']};
 const situated={10:'The cries of the market traders carry through the doorway.',11:'The moor wind pulls at your cloaks as you speak.',12:'Across the fen, lights flicker in distant windows.',13:'Dock bells ring while the harbor counts its losses.',14:'The archive dust settles over forgotten names.',15:'The Citadel’s delegates argue in the next hall.',16:'The blue network hums beneath your feet.'};
 return {chapter,label:'COMPANION CONVERSATION',heading:'A moment with '+c.name,text:[...subjects[d.id],situated[chapter]||'For a moment, the road is quiet enough to talk.',`Your history with ${c.name} matters: trust is currently ${signed(world().trust[d.id])}. Your answer will shape the relationship.`],lesson:'Companions have personal convictions. You may listen, prepare together, or demand obedience. Different responses affect trust and the support they offer later.',choices:[
 wChoice('bond:'+d.id+':listen','Listen and ask what they need',d.id==='mara'?(world().done['evidence:maraPatrol']?'Gain trust · revisit Mara’s story (no new evidence)':'Gain trust · uncover one distinct patrol clue'):'Gain trust and learn more of their past','♡'),
 wChoice('bond:'+d.id+':plan','Make a plan together','Gain situational help on a later ability check','◎'),
 wChoice('bond:'+d.id+':command','Demand that they follow your orders','Assert authority at a possible cost to trust','♛'),
 wChoice('bond:'+d.id+':later','Leave the conversation for another time','No decision or trust change yet','↶')]};
}
function earnSite(id,kind){const info=SIDE_SITES[id],w=world();if(!info||w.done['site:'+id])return false;
 w.done['site:'+id]=true;worldGain(info.rewardGold);w.emberglass=Math.min(30,w.emberglass+info.shards);w.clues++;
 if(kind==='ally'&&wTrusted(info.companion))w.trust[info.companion]=clamp(w.trust[info.companion]+1,-3,5);
 record(`Optional adventure completed: ${info.title}. Received ${info.rewardGold} gp and ${info.shards} emberglass fragment(s).`);
 return true;
}
function sideAction(item){const w=world();if(item.startsWith('site:enter:')){const id=item.slice(11),info=SIDE_SITES[id];if(!info||s.stage!==info.hub)return true;
 w.hour+=3;if(w.hour>=24){w.day++;w.hour-=24;}w.dialogue=null;w.shopOpen=false;
 worldStep(id,'Beyond the main road',`You spend three hours following local rumors into ${info.title.toLowerCase()}. The waylight map is no longer merely a chart of destinations; it hides places where people have been forgotten.`);return true;}
 if(item.startsWith('site:back:')){const id=item.slice(10),info=SIDE_SITES[id];if(!info||s.stage!==id)return true;
 w.dialogue=null;worldStep(info.hub,'Back to the watchroad',wDone('site:'+id)?'You return with evidence, equipment and a story that will outlast the journey.':'You step back from the hazard before committing to a final approach. You can return when you are better prepared.');return true;}
 if(item.startsWith('site:study:')||item.startsWith('site:ally:')||item.startsWith('site:lamp:')){const [site,method,id]=item.split(':');const info=SIDE_SITES[id];if(!info||s.stage!==id||wDone('site:'+id))return true;
 if(wDone('site:try:'+id+':'+method))return true;
 if(method==='study'){
  w.done['site:try:'+id+':study']=true;
  worldCheck(info.skill,info.dc,info.title,info.success,'Your first attempt fails to remove the danger. You withdraw with bruises, no payment or emberglass, and the option to confront the opposition remains.',passed=>{if(passed)earnSite(id,'study');else s.hp=Math.max(1,s.hp-2);});return true;
 }
 if(method==='lamp'){
  if(!carriesLantern()||lanternSparks()<1)return true;
  w.done['site:try:'+id+':lamp']=true;s.lanternSparks--;
  worldCheck(info.skill,Math.max(9,info.dc-4),'Lantern-guided approach: '+info.title,info.success+' Your success earns the contracted payment and recovered emberglass.','The lantern reveals a brief route, but the hazard closes before you can finish. The spark is spent; there is no payment. You can still fight through the danger.',passed=>{if(passed)earnSite(id,'lamp');else s.hp=Math.max(1,s.hp-1);});return true;
 }
 if(method==='ally'){
  if(!wTrusted(info.companion))return true;
  w.done['site:try:'+id+':ally']=true;
  worldCheck(info.skill,Math.max(10,info.dc-2),COMPANIONS[info.companion].name+' assists at '+info.title,info.success+' Your companion helps secure the reward.','Your combined attempt cannot overcome the danger. You receive no wages; the opponents still guard the site.',passed=>{if(passed)earnSite(id,'ally');else s.hp=Math.max(1,s.hp-1);});return true;
 }}
 if(item.startsWith('site:fight:')){const id=item.slice(11),info=SIDE_SITES[id];if(info&&s.stage===id&&!wDone('site:'+id))startWorldBattle(info.enemy);return true;}
 if(item.startsWith('shrine:attune:')){const id=item.slice(14);if(s.stage!==id||!SIDE_SITES[id]||!wDone('site:'+id)||wDone('attune:'+id)||!carriesLantern()||lanternSparks()>=3)return true;
 w.done['attune:'+id]=true;s.lanternSparks=Math.min(3,s.lanternSparks+1);worldBeat('The flame answers the old signal',`The repaired lantern catches one quiet spark from a recovered shrine mechanism. ${lanternSparks()} / 3 sparks remain. The lantern itself remains in your Pack.`,true);return true;}
 return false;
}

const SHOP_STAGES=new Set(['waymarket','harbor','citadel']);
function worldShopScene(){const w=world();return {chapter:WORLD_STAGES[s.stage],label:'MERCHANTS OF THE WATCHROAD',heading:s.stage==='waymarket'?'The Forgehall of Waycross':s.stage==='harbor'?'Saltmere’s Lantern Quay':'The Citadel Quartermaster',text:[
 'Behind a hammered bronze sign, a smith tests a sword edge against a hanging length of old rope. The workshop also sells supplies for travelers whose lives depend on reaching the next village, not merely impressing an audience.',
 'A small counter specializes in lantern fragments collected from abandoned waystations. The merchant warns you that emberglass is precious: once a shard is used to recharge the old flame, it cannot be recovered.',
 `You count ${w.gold} gp in your purse. Your choices here change what you can do in later fights and expeditions. You can return when you have earned more.`,
 s.stage==='harbor'?'Saltwater corrodes cheap fittings here; the docksmith charges the same fair prices to passengers and crew.':s.stage==='citadel'?'The Citadel has the best craftwork, but its official seals carry no guarantee of honesty.':'Most customers are ordinary caravan drivers preparing for hazards on the northern road.'
 ],lesson:'The gold economy has an opportunity cost: spending on equipment can make fights safer, but may leave less for relief, negotiations or recharging the lantern.',choices:[
 wChoice('shop:weapon','Commission a balanced weapon','25 gp · your existing weapon gains +1 attack and damage in regional fights','⚔',w.gear.weapon>0||!worldCanSpend(25)),
 wChoice('shop:shield','Buy a protective ward buckle','18 gp · +1 AC in regional fights','▣',w.gear.shield>0||!worldCanSpend(18)),
 wChoice('shop:flash','Buy flashpowder','9 gp · deal damage and hinder an enemy attack','✧',!worldCanSpend(9)||w.flashpowder>=10),
 wChoice('shop:bandage','Buy field bandages','6 gp · heal 1d6+2 HP between encounters','♡',!worldCanSpend(6)||w.bandages>=10),
 wChoice('shop:ember','Buy emberglass','15 gp · use at a shrine to recharge the Last Lantern','✦',!worldCanSpend(15)||w.emberglass>=10),
 wChoice('potion','Buy a Potion of Healing','8 gp · 2d4+2 HP','⚗',!worldCanSpend(8)),
 wChoice('rations','Buy two travel rations','4 gp · feed the company','♢',!worldCanSpend(4)),
 ...(s.stage==='waymarket'?[wChoice('buy:armor','Buy reinforced armor','20 gp · +1 AC in regional fights','▣',w.gear.armor>0||!worldCanSpend(20)),wChoice('buy:focus','Buy an arcane focus','16 gp · improve Arcana checks','✧',w.gear.focus>0||!worldCanSpend(16)),wChoice('buy:boots','Buy sturdy boots','12 gp · reduced fatigue','♧',w.gear.boots>0||!worldCanSpend(12)),wChoice('buy:intel','Buy a keeper’s chart','6 gp · learn a useful regional secret','◎',wDone('buy:intel')||!worldCanSpend(6))]:[]),
 wChoice('shop:close','Leave the merchants behind','Return to the town and your other options','↶')]};
}
function worldScene(){
 if(SIDE_SITES[s.stage])return sideScene();
 if(world().dialogue?.stage===s.stage)return companionDialogueScene();
 if(world().shopOpen&&SHOP_STAGES.has(s.stage))return worldShopScene();
 const personalScenes={
  maraMemory:{chapter:11,id:'mara',heading:'The patrol’s missing markers',back:'northmoor',text:['Mara follows a line of cairns to a ridge where her old patrol hid the route chart. Wind has worn the stones smooth, but she remembers the exact place where the patrol leader ordered the marker moved.','A widow who lost her family on that road is waiting. Mara can face her and restore the truthful route, or you could sell the chart to the collectors who still profit from the false one.','“Please do not tell me what a good person I am,” Mara says. “Tell me what we will do now.”']},
  tamsinShelter:{chapter:12,id:'tamsin',heading:'A clinic for both banks',back:'glassfen',text:['Tamsin takes you to a raft tied between two flooded homes. Patients from both banks are being refused medicine unless they show a guild ticket. A girl holds a feverish brother who cannot even stand.','The guild would fund a clinic if it controlled admission. Tamsin could instead run a smaller clinic herself, using whatever supplies your party can spare.','“I cannot heal a ledger,” she says, “but I can keep this child alive.”']},
  corvinLedger:{chapter:13,id:'corvin',heading:'The account Corvin falsified',back:'harbor',text:['Corvin asks you to meet him by the warehouses, where he once changed a debt figure to make a family lose its boat. The guild still holds the original ledger.','He offers to confess and work off the debt, or to help you use the same ledger to demand money from the people who ordered the change.','“I have spent years being clever,” Corvin says quietly. “I could use a day of being brave.”']}
 };
 if(personalScenes[s.stage]){
  const q=personalScenes[s.stage],done=wDone('personal:'+q.id);
  return {chapter:q.chapter,label:'A COMPANION’S PROMISE',heading:q.heading,text:[...q.text,done?'Your choice is made. '+COMPANIONS[q.id].name+' remembers it.':'You may choose what kind of help, if any, you are willing to give.'],lesson:'A companion’s personal quest can change their loyalty, relationships and future participation in the party.',choices:done?[wChoice('personalReturn:'+q.id,'Return to the main road','Continue the journey together—or apart','↝')]:[wChoice('personalResolve:'+q.id+':support','Help them make things right',q.id==='corvin'?'Build trust · Persuasion DC 13 for the optional 8 gp repayment':'Build trust and a lasting relationship','♡'),wChoice('personalResolve:'+q.id+':exploit','Turn the situation to your advantage','Persuasion DC 14 · up to 18 gp, risk their loyalty','♛')]};
 }
 if(s.stage==='roadFireside')return {chapter:9,label:'FIRST COMPANIONS',heading:'Stories that survive the winter',text:[
  'The old camp was built around a communal hearth. Its chimney stones carry the names of people who kept the road open through famine and war; the names are worn at hand height, polished by generations of travelers.',
  'Mara places a folded patrol map beside the embers. “They paid us to move markers,” she admits. “The storm took a family before I understood the reason.”',
  'Tamsin sets out labels for medicines she could not deliver. Corvin speaks last, explaining how a charter can turn a promise into an invoice. No companion offers instant loyalty, only a reason to keep traveling.',
  'Your own story joins theirs, though none of you knows what the road will ask before morning.'
 ],lesson:'Companions are independent characters with goals. Choices and personal quests influence trust, but joining a party does not remove their agency.',choices:[wChoice('backCamp','Return to camp preparations','Set out when you are ready','↝')]};
 if(FRONTIER_CHALLENGES[s.stage])return frontierScene();
 const scene=worldSceneLegacy(),w=world();
 for(const [id,b] of Object.entries(BEACON_KEEPERS))if(s.stage===b.stage&&w.beacons[id]!=='dark'){
  const method=beaconMethod(id);
  if(method==='spark')scene.text.push('You remember spending a spark to rekindle this crystal. Its self-aligning public conductor now shines without consuming the Last Lantern itself.');
  else if(method==='key')scene.text.push('The silver key has reset the old machinery. You still carry it, ready for another waylight.');
  else if(method==='delegate')scene.text.push(`The repair took a full day of shared work. ${b.keeper} now maintain this light independently of you and the guild.`);
  else if(method==='claimed')scene.text.push('The guild seal remains on the mechanism. Caravans must negotiate the terms of passage under your charter.');
 }
 if(WORLD_EXTRA_DETAIL[s.stage])scene.text=[...scene.text,...WORLD_EXTRA_DETAIL[s.stage]];
 if(s.stage==='waygate'){
  if(wDone('wayInvestigationPaid'))scene.text.push('Your payment secured access to the control wheel, but it did not expose the false toll ledger or remove the clerk’s claim. The waylight still needs a separate decision.');
  else if(wDone('wayInvestigationProven'))scene.text.push('The forged entries and the signed witness account give Seret a reason to challenge the toll collector.');
  else if(wDone('wayInvestigationResolved'))scene.text.push('You reached the control wheel by another route. The contested toll accounts have not automatically been cleared.');
 }
 if(s.stage==='roadCamp'&&!w.active.length)scene.text=scene.text.map(x=>x.includes('Mara dries a map beside the fire')?'The camp hearth carries the traces of travelers gathering here. You can invite companions to share the road, or set out alone.':x);
 // Completed expeditions leave visible, persistent consequences in their region.
 for(const [id,info] of Object.entries(SIDE_SITES))if(s.stage===info.hub&&wDone('site:'+id))
  scene.text.push(`Word has spread that ${info.title.toLowerCase()} is safe again. Caravans and local families now use the recovered routes. The expedition's rewards remain in your Pack and ledger.`);
 if(s.stage==='roadFinale'){
  const rescued=Object.keys(SIDE_SITES).filter(id=>wDone('site:'+id));
  if(rescued.length>=3)scene.text.push(`Messengers arrive from ${rescued.length} recovered watchroad sites. Repairing or ruling the central network was only part of your work; the small settlements remember the dangers you faced on their behalf.`);
  for(const id of world().active)if(world().trust[id]>=3)scene.text.push(`${COMPANIONS[id].name} chooses to remain in your company after the final decision. Their loyalty grew from conversations and the actions you took together, not from a contract.`);
 }

 if(WORLD_STAGES[s.stage]&&s.stage!=='roadFinale'){
  // Original story choices appear first, then optional personal quests, camp talk and rest.
  const extras=[];
  for(const id of w.recruited){if(w.active.includes(id)&&!wDone('talk:'+id+':'+WORLD_STAGES[s.stage]))extras.push(wChoice('talk:'+id,`Talk with ${COMPANIONS[id].name}`,`A companion conversation · Chapter ${WORLD_STAGES[s.stage]}`,'♟'));}
  if(s.stage==='northmoor'&&w.active.includes('mara')&&!wDone('personal:mara'))extras.push(wChoice('personal:mara','Help Mara confront her former patrol','Companion quest · clues and trust','♧'));
  if(s.stage==='glassfen'&&w.active.includes('tamsin')&&!wDone('personal:tamsin'))extras.push(wChoice('personal:tamsin','Help Tamsin establish a healing station','Companion quest · supplies or skills','♡'));
  if(s.stage==='harbor'&&w.active.includes('corvin')&&!wDone('personal:corvin'))extras.push(wChoice('personal:corvin','Help Corvin settle an old debt','Companion quest · loyalty and gold','♛'));
  if(s.stage==='roadCamp'&&!wDone('fireTalk'))extras.push(wChoice('fireside','Share stories around the fire','Optional character-focused scene','☾'));
  for(const [id,info] of Object.entries(SIDE_SITES))if(s.stage===info.hub)extras.push(wChoice('site:enter:'+id,`Explore: ${info.title}`,wDone('site:'+id)?'Completed adventure · revisit the site':'Optional dungeon · danger, supplies and emberglass','♜'));
  if(carriesLantern()&&['waymarket','harbor','citadel'].includes(s.stage)&&lanternSparks()<3)extras.push(wChoice('recharge:trade','Recharge lantern at a shrine','Spend 1 emberglass OR 12 gp to restore 2 sparks','✧',w.emberglass<1&&!worldCanSpend(12)));
  if(SHOP_STAGES.has(s.stage))extras.push(wChoice('shop:open','Visit the smith and equipment market','Weapons, defense, lantern fuel and provisions · prices in gp','⚒'));
  if(s.stage==='harbor')extras.push(wChoice('invest:harbor','Fund harbor rescue boats','16 gp · lasting relief and influence','♡',wDone('invest:harbor')||!worldCanSpend(16)));
  if(s.stage==='citadel')extras.push(wChoice('invest:charter','Fund independent inspectors','18 gp · improve credibility at the Worldheart','✦',wDone('invest:charter')||!worldCanSpend(18)));
  if(w.bandages>0&&s.hp<maxHp())extras.push(wChoice('use:bandage','Use a field bandage',`1d6+2 HP · ${w.bandages} remaining`,'♡'));
  scene.choices=[...(scene.choices||[]),...extras,...worldRestChoices()].filter(Boolean);
 }
 return scene;
}
function frontierEncounterResolved(id){return Object.entries(FRONTIER_CHALLENGES).find(([,info])=>info.enemy===id)?.[0]||null;}
function worldHasMandate(){const w=world();return w.done.commonsMandate===true||(w.reputation.keepers>=4&&w.clues>=3&&w.relief>=1);}
function worldCanRestore(){const w=world(),claimed=Object.values(w.beacons).filter(x=>x==='claimed').length;
 return !claimed || w.gold>=20*claimed || worldHasMandate();
}
function worldAppealBasis(){const w=world();return [w.clues,w.relief,w.reputation.keepers].join('|');}
function worldCanAppeal(){return s.stage==='worldheart'&&!worldCanRestore()&&world().appealBasis!==worldAppealBasis();}
function worldCanRule(){const w=world();return w.dominion>=2||w.reputation.syndicate>=2||w.done.paidCharter===true;}
function worldAdditionalAction(item){const w=world();
 if(sideAction(item))return true;
 if(item==='prepareCommons'&&worldCanAppeal()){
  w.appealBasis=worldAppealBasis();w.day=Math.min(500,w.day+1);w.hour=8;
  if(s.inventory.rations>0)s.inventory.rations--;else s.hp=Math.max(1,s.hp-2);
  worldCheck('persuasion',14,'A full day before the delegates',
   'After a day of negotiation, the delegates sign a limited mandate to return the disputed waylights to public use. This petition is political support: it is not physical evidence and it is not a relief donation.',
   'After a full day, the delegates refuse to sign. You must bring new evidence, provide genuine aid or win additional keepers’ support before making another appeal.',
   ok=>{w.done.commonsAppealAttempted=true;if(ok)w.done.commonsMandate=true;});return true;
 }
 if(item==='buyCharter'&&s.stage==='worldheart'&&!worldCanRule()&&worldCanSpend(30)){worldGain(-30);w.done.paidCharter=true;worldBeat('A charter purchased','You pay 30 gp to acquire a recognized claim to network stewardship. It does not automatically earn anyone’s trust, but it allows you to put a private proposal before the Worldheart.');return true;}

 if(item.startsWith('challenge:')||item.startsWith('bribe:')||item.startsWith('lantern:')){
  const [method,stage]=item.split(':');const info=FRONTIER_CHALLENGES[stage];if(!info||s.stage!==stage||wDone(stage+'Resolved'))return true;
  if(method==='bribe'){if(!worldCanSpend(info.cost))return true;worldGain(-info.cost);w.done[stage+'Resolved']=true;w.done[stage+'Paid']=true;worldLoyalty(-1,1,{corvin:1});worldBeat('A bargain with a price',`You pay ${info.cost} gp to secure cooperation. The gate is opened by people who were paid, not persuaded. Those who could not afford the fee will remember that distinction.`,true);return true;}
  if(method==='lantern'){if(lanternSparks()<1)return true;s.lanternSparks--;w.done[stage+'Resolved']=true;w.done[stage+'Lantern']=true;w.clues++;worldBeat('A spark shows the hidden way',`The Last Lantern reveals the mechanism's forgotten service marks. You use one spark, keeping the lantern itself. A safe route opens without a fight. The people nearby see what you could do, and wonder what else you may ask in return.`,true);return true;}
  w.done[stage+'Attempted']=true;worldCheck(info.skill,info.dc,info.heading,info.win,info.fail,passed=>{w.done[stage+'Resolved']=true;if(passed){w.done[stage+'Proven']=true;w.clues++;worldLoyalty(1,0);}else s.hp=Math.max(1,s.hp-2);});return true;
 }
 if(item.startsWith('encounter:')){const id=item.slice('encounter:'.length),stage=frontierEncounterResolved(id);if(stage&&stage===s.stage&&!wDone(stage+'Resolved'))startWorldBattle(id);return true;}
 if(item.startsWith('continue:')){const stage=item.slice('continue:'.length),info=FRONTIER_CHALLENGES[stage];if(info&&s.stage===stage&&wDone(stage+'Resolved'))worldStep(info.next,'The obstacle is behind you',info.nextText);return true;}
 if(item.startsWith('rest:')){
  if(item==='rest:short'){
   const before=s.hp;let healing='';if(s.hitDice>0&&s.hp<maxHp()){const die={fighter:10,rogue:8,wizard:6}[s.classId],raw=rand(die),con=Math.floor((hero().stats.CON-10)/2);s.hp=Math.min(maxHp(),s.hp+Math.max(1,raw+con));s.hitDice--;healing=`You spend a d${die} (${raw}${signed(con)} CON) and recover ${s.hp-before} HP. You may rest again if you have remaining dice.`;}
   if(s.classId==='fighter')s.secondWind=Math.min(s.level>=4?3:2,s.secondWind+1);
   if(s.classId==='wizard'&&!s.arcaneRecovery){if(s.level>=3&&w.slots2<(s.level>=4?3:2))w.slots2++;else s.slots=Math.min(s.level>=3?4:s.level===2?3:2,s.slots+1);s.arcaneRecovery=true;}
   w.hour++;if(w.hour>=24){w.hour-=24;w.day++;}
   worldBeat('An hour to recover',healing||'You pause for one hour. Limited short-rest features recover, but you have not spent a Hit Die.',true);return true;
  }
  if(item==='rest:long'){
   if(!WORLD_LONG_REST_STAGES.has(s.stage)||(s.inventory.rations<=0&&!worldCanSpend(5)))return true;
   let text;if(s.inventory.rations>0){s.inventory.rations--;text='You cook one of your travel rations.';}else{worldGain(-5);text=WORLD_SAFE_STAGES.has(s.stage)?'You pay 5 gp for food and a safe place to sleep.':'You pay 5 gp for food and shelter arranged by the local waykeepers.';}
   const hpBefore=s.hp;s.hp=maxHp();s.hitDice=s.level;s.arcaneRecovery=false;
   if(s.classId==='fighter')s.secondWind=s.level>=4?3:2;
   if(s.classId==='wizard'){s.slots=s.level>=3?4:s.level>=2?3:2;w.slots2=s.level>=4?3:s.level>=3?2:0;}
   s.actionSurge=1;if(carriesLantern())s.lanternSparks=Math.min(3,s.lanternSparks+1);
   w.day++;w.hour=8;
   worldBeat('A long rest on the Watchroad',`${text} You recover from ${hpBefore} to ${s.hp} HP, restore your Hit Dice and available class resources, and begin day ${w.day}. Rest consumes provisions or money; travel does not happen for free.`,true);return true;
  }
  if(item==='rest:forage'){
   if(!WORLD_FORAGE_STAGES.has(s.stage))return true;
   const flag='forageDay'+w.day;if(w.done[flag])return true;w.done[flag]=true;
   worldCheck('survival',12,'Food from the roadside','You collect edible roots, clean water and one travel ration.','You find edible plants only after a thorny scramble that costs one HP. You still secure one ration.',passed=>{s.inventory.rations=Math.min(20,s.inventory.rations+1);if(!passed)s.hp=Math.max(1,s.hp-1);});return true;
  }
 }
 if(item==='recharge:trade'){if(!carriesLantern()||lanternSparks()>=3||!['waymarket','harbor','citadel'].includes(s.stage))return true;
  let method;if(w.emberglass>0){w.emberglass--;method='one emberglass fragment';}else if(worldCanSpend(12)){worldGain(-12);method='12 gp paid to the shrine attendant';}else return true;
  const before=lanternSparks();s.lanternSparks=Math.min(3,s.lanternSparks+2);worldBeat('A flame restored',`The shrine channels ${method} through its old bronze mirrors. Lantern sparks: ${before} → ${lanternSparks()} of 3. The item remains permanently in your Pack.`,true);return true;}
 if(item==='shop:open'){if(!SHOP_STAGES.has(s.stage))return true;w.shopOpen=true;worldBeat('The shop bell rings','You step into the town’s workshops, where weapons, travel equipment and rare lantern supplies are displayed with their prices.');return true;}
 if(item==='shop:close'){if(!SHOP_STAGES.has(s.stage))return true;w.shopOpen=false;worldBeat('Back to the street','You leave the merchants with your purse and purchases accounted for. The rest of the town still has stories to tell.');return true;}
 if(item.startsWith('shop:')){if(!SHOP_STAGES.has(s.stage)||!w.shopOpen)return true;const id=item.slice(5),prices={weapon:25,shield:18,flash:9,bandage:6,ember:15};const cost=prices[id];if(!cost||!worldCanSpend(cost))return true;if(['weapon','shield'].includes(id)&&w.gear[id])return true;
  if(id==='flash'&&w.flashpowder>=10||id==='bandage'&&w.bandages>=10||id==='ember'&&w.emberglass>=10)return true;worldGain(-cost);
  if(id==='weapon'||id==='shield')w.gear[id]=1;else if(id==='flash')w.flashpowder++;else if(id==='bandage')w.bandages++;else w.emberglass++;
  worldBeat('A purchase for the road',`You pay ${cost} gp at the local workshop. ${id==='weapon'?'Your current class weapon is balanced and sharpened (+1 attack and damage in Act II).':id==='shield'?'A protective ward buckle adds +1 to your Armor Class during regional fights.':id==='flash'?'A flashpowder flask is ready to confuse an enemy during combat.':id==='bandage'?'Field bandages can heal you between encounters.':'An emberglass fragment can replenish the lantern at a shrine.'} Remaining gold: ${w.gold} gp.`,true);return true;}
 if(item==='use:bandage'){if(w.bandages<=0||s.hp>=maxHp())return true;w.bandages--;const old=s.hp;s.hp=Math.min(maxHp(),s.hp+rand(6)+2);worldBeat('A wound bound',`You use one bandage, healing ${s.hp-old} HP (${old} → ${s.hp}). The bandage is consumed.`,true);return true;}
 if(item.startsWith('buy:')){
  if(s.stage!=='waymarket')return true;const id=item.slice(4),cost={armor:20,focus:16,boots:12,intel:6}[id];if(!cost||!worldCanSpend(cost)||(id==='intel'?wDone('buy:intel'):w.gear[id]))return true;
  worldGain(-cost);if(id==='intel'){w.done['buy:intel']=true;w.clues++;}else w.gear[id]=1;
  worldBeat('An investment in the journey',`You pay ${cost} gp for ${id==='armor'?'reinforced armor (+1 AC)':id==='focus'?'a carefully calibrated focus (+1 to Arcana checks)':id==='boots'?'durable travel boots (lower fatigue)':'a chart of hidden waystations (one clue)'}. Your gold and equipment update immediately.`,true);return true;
 }
 if(item.startsWith('invest:')){const id=item.slice(7),cost=id==='harbor'?16:id==='charter'?18:0;if(!cost||w.done['invest:'+id]||!worldCanSpend(cost))return true;
  worldGain(-cost);w.done['invest:'+id]=true;w.relief++;worldLoyalty(2,-1,{tamsin:1});worldBeat('A lasting investment',`You commit ${cost} gp to ${id==='harbor'?'rescue boats that serve both shores':'independent inspectors who can check any future keeper’s accounts'}. People can now point to a tangible public benefit when speaking in your favor.`,true);return true;
 }
 if(item.startsWith('talk:')){const id=item.slice(5),chapter=WORLD_STAGES[s.stage];if(!COMPANIONS[id]||!wTrusted(id)||wDone('talk:'+id+':'+chapter))return true;
  w.dialogue={id,stage:s.stage,chapter};modal=null;worldBeat('A quiet word',`You ask ${COMPANIONS[id].name} to walk with you for a moment, away from the other voices. Their answer depends on what you ask next.`);return true;}
 if(item.startsWith('bond:')){const [,id,response]=item.split(':');const d=w.dialogue;if(!d||d.id!==id||d.stage!==s.stage||!COMPANIONS[id]||wDone('talk:'+id+':'+d.chapter))return true;
 if(response==='later'){w.dialogue=null;worldBeat('Words left for another day',`You give ${COMPANIONS[id].name} room to think. The conversation remains available later.`);return true;}
 if(!['listen','plan','command'].includes(response))return true;
 w.done['talk:'+id+':'+d.chapter]=true;w.dialogue=null;
 if(response==='listen'){
  w.trust[id]=clamp(w.trust[id]+2,-3,5);
  const newMaraClue=id==='mara'&&!w.done['evidence:maraPatrol'];
  if(newMaraClue){w.clues++;w.done['evidence:maraPatrol']=true;}
  const story=newMaraClue?'Mara finally explains how the vanished patrol markers were deliberately moved. You can use this single, distinct testimony as a clue.'
   :id==='mara'?'Mara talks through the patrol history with you again. You deepen your understanding and her trust, but the same testimony is not a new piece of evidence.'
   :`${COMPANIONS[id].name} shares more about the people and worries that shaped their choices.`;
  worldBeat('You listen before deciding',`${story} Trust rises to ${signed(w.trust[id])}.`,true);
 }
 if(response==='plan'){const skill=COMPANIONS[id].skill;w.skillAid={id,skill};w.trust[id]=clamp(w.trust[id]+1,-3,5);
  worldBeat('A plan made together',`${COMPANIONS[id].name} helps prepare you for a future ${skill} check. You gain a one-use +2 bonus when that skill is next rolled. Trust rises to ${signed(w.trust[id])}.`,true);}
 if(response==='command'){w.trust[id]=clamp(w.trust[id]-1,-3,5);if(w.trust[id]<=-2)w.active=w.active.filter(x=>x!==id);
  worldBeat('An order, not a promise',`${COMPANIONS[id].name} obeys for now, but the pressure damages trust. It falls to ${signed(w.trust[id])}.${w.trust[id]<=-2?' They withdraw from the active party.':''}`,false);}
 return true;}
 if(item==='backCamp'&&s.stage==='roadFireside'){worldStep('roadCamp','The fire burns low','You return to the preparations for the road.');return true;}
 if(item==='fireside'&&s.stage==='roadCamp'&&!w.done.fireTalk){w.done.fireTalk=true;worldStep('roadFireside','Words beside the embers','At the last light of the day, each traveler speaks about the reason they came to the broken road.');return true;}
 if(item.startsWith('personal:')){
  const id=item.slice(9);if(!w.active.includes(id)||w.done['personal:'+id])return true;
  const stage={mara:'maraMemory',tamsin:'tamsinShelter',corvin:'corvinLedger'}[id];
  const expected={mara:'northmoor',tamsin:'glassfen',corvin:'harbor'}[id];
  if(!stage||s.stage!==expected)return true;
  worldStep(stage,`${COMPANIONS[id].name}'s unfinished promise`,`${COMPANIONS[id].name} asks you to hear a story they have avoided telling at the campfire. It cannot be settled with a quick agreement; a real person is waiting for your answer.`);return true;
 }
 if(item.startsWith('personalResolve:')){
  const [,id,path]=item.split(':');const stages={mara:'maraMemory',tamsin:'tamsinShelter',corvin:'corvinLedger'};
  if(stages[id]!==s.stage||w.done['personal:'+id]||!['support','exploit'].includes(path))return true;
  w.done['personal:'+id]=true;w.done['personal:'+id+':'+path]=true;
  if(path==='support'){
   w.trust[id]=clamp(w.trust[id]+3,-3,5);w.clues++;worldLoyalty(1,-1);
   if(id==='tamsin'){s.potions=Math.min(20,s.potions+1);w.relief++;}
   if(id==='corvin'){
    worldCheck('persuasion',13,'An honest repayment',
      'Corvin negotiates compensation that the clerk can lawfully pay. Your party receives 8 gp in genuine earned wages.',
      'The clerk refuses to authorize a cash repayment without better records. You have helped Corvin take responsibility, but receive no money today.',passed=>{if(passed)worldGain(8);});return true;
   }
   worldBeat('An ally chooses to stay',id==='mara'?'You help Mara restore a dangerous old route marker, in full view of the family of a lost traveler. The patrol records become usable again, and she gives you a map she once feared showing anyone.':id==='tamsin'?'You commit time to keeping a neutral clinic supplied. Tamsin treats the sick first and offers you a healing potion in gratitude.':'Corvin admits his debt and negotiates restitution with the clerk he cheated. It costs him pride and time, but returns 8 gp in lawful wages to the company.',true);
  } else{
   w.trust[id]=clamp(w.trust[id]-2,-3,5);
   if(w.trust[id]<=-2)w.active=w.active.filter(x=>x!==id);
   worldCheck('persuasion',14,'An offer with consequences',
    id==='mara'?'The private wardens agree to pay 18 gp for Mara’s patrol chart. The public route remains unmarked, and her anger will follow you.':id==='tamsin'?'The toll company signs a contract for 18 gp, leaving patients subject to admission fees. Tamsin is furious.':'The guild pays 18 gp under pressure from Corvin’s ledger, but his trust in you is damaged.',
    'The potential buyer refuses the deal. You gain no money, yet your companion still witnessed what you tried to sell and loses trust in you.',passed=>{if(passed){worldGain(18);worldLoyalty(-1,2);}else worldLoyalty(-1,0);});
  }
  return true;
 }
 if(item.startsWith('personalReturn:')){
  const id=item.slice('personalReturn:'.length),stage={mara:'northmoor',tamsin:'glassfen',corvin:'harbor'}[id];
  if(stage&&s.stage==={mara:'maraMemory',tamsin:'tamsinShelter',corvin:'corvinLedger'}[id]&&w.done['personal:'+id])worldStep(stage,'Returning to the road',`The conversation with ${COMPANIONS[id].name} has changed what traveling together means. The waylight still waits.`);
  return true;
 }
 return false;
}

function worldAction(action){if(!action.startsWith('w:'))return false;
 if(s.storyResult||s.pending||s.mindOffer||world().battle?.active)return true;
 const item=action.slice(2);if(!WORLD_STAGES[s.stage]&&item!=='begin')return true;
 const w=world();
 if(s.stage==='roadFinale'&&['mapOpen','partyOpen','chaptersOpen'].includes(item)){modal=item==='mapOpen'?'worldmap':item==='partyOpen'?'party':'chapters';render();return true;}
 const current=s.stage==='epilogue'?{choices:[wChoice('begin','Follow the newly revealed network','Set out into the wider world')]}:worldScene();
 const allowed=current.choices.some(c=>c&&c.key===action&&!c.locked&&availableStoryChoice(c));
 if(!allowed)return true;
 cue(current.choices.find(c=>c&&c.key===action)?.title||'Continue along the Watchroad');
 if(worldAdditionalAction(item))return true;
 if(item==='begin'){
  if(s.stage!=='epilogue')return true;
  world();worldTravel('roadMap','A map opens beneath the blue sky','What you thought was the end of your adventure becomes a new beginning.');return true;
 }
 if(item==='fenFight'||item==='spireFight'){startWorldBattle(item);return true;}
 if(item==='survey'){
  if(wDone('survey'))return true;world().done.survey=true;
  worldCheck('investigation',12,'The pattern beneath the light','You recognize the junctions of a connected map and identify four damaged beacons leading toward a central heart.','The pattern still suggests four western waylights, although their exact history remains obscure.',ok=>{if(ok)world().clues++;});return true;
 }
 if(item==='camp'){worldStep('roadCamp','Along the blue trail','By nightfall the old waystation appears among the stones. Three strangers have already made a fire.');return true;}
 if(item.startsWith('recruit:')){
  const id=item.slice(8);if(!COMPANIONS[id]||world().recruited.includes(id))return true;
  world().recruited.push(id);if(world().active.length<2)world().active.push(id);
  worldBeat(`${COMPANIONS[id].name} joins your company`,`${COMPANIONS[id].name} agrees to travel with you. ${COMPANIONS[id].bio} ${world().active.includes(id)?'They are now active in the party.':'They will wait at safe waystations until you make room in the party.'}`);return true;
 }
 const hops={market:['waymarket','The caravan road opens','Wagon bells lead you toward Waycross, where the old path has become an expensive commodity.'],gate:['waygate','The first toll gate','The road narrows toward a ruined stone arch and its dim blue conductor.'],moor:['northmoor','North beyond the last farms','You leave Waycross beneath high clouds and follow a wavering line into the moor.'],moorTop:['moorBeacon','The tower in the rain','Broken steps climb to a mechanism that has not shone freely for years.'],fen:['glassfen','Into the marsh','Reeds and black pools swallow the old road as the blue signal bends toward Glassfen.'],fenTop:['fenBeacon','An underwater mechanism','In the tower’s shadow, the blue glow bends below the surface.'],port:['harbor','Downriver to Saltmere','The smell of salt replaces the marsh water and a city of dock bells rises ahead.'],portTop:['harborBeacon','Above the harbor','A spiral staircase carries you to the dark lantern room.'],crypt:['undercrypt','Under the founding stone','Your discoveries point beneath the harbor, where a forgotten chamber waits.'],archive:['cryptArchive','The founders’ writing','In the chamber, names appear beneath the forged seals of later rulers.'],toCitadel:['citadel','The Citadel summons','You walk inland with the records and the knowledge of every choice made on the blue road.'],spire:['citadelSpire','The bells sound for you','A chamber lined in stained glass awaits your final testimony.'],heart:['worldheart','The road converges','All the routes you have followed lead to one vast chamber below the mountain.']};
 if(hops[item]){const [legacyDestination,title,text]=hops[item];
  const diversion={gate:'wayInvestigation',moorTop:'moorPass',fenTop:'fenCauseway',portTop:'harborTribunal',archive:'cryptThreshold',spire:'citadelDebate',heart:'heartTrial'};
  const dest=diversion[item]&&!wDone(diversion[item]+'Resolved')?diversion[item]:legacyDestination;
  if(WORLD_STAGES[dest]!==WORLD_STAGES[s.stage])worldTravel(dest,title,text);else worldStep(dest,title,text);
  return true;
 }
 // Paid help requires an uncertain skill check or a completed fight; selecting a job alone never pays.
 if(item==='cartJob'||item==='moorAid')return true; // Old UI/save actions cannot mint new gold.
 if(item==='portDelivery'){
  if(s.stage!=='harbor'||wDone('portDeliveryAccepted'))return true;
  world().done.portDeliveryAccepted=true;world().cargo=true;world().cargoReady=false;
  worldBeat('A delivery, not a free reward','The Saltmere captain gives you the sealed crate. Payment is 14 gp on arrival in Waycross or North Moor, but first you must secure its passage by inspecting the manifest and navigating safely, or by defeating the charter thieves.');return true;
 }
 if(item==='job:cart:check'){
  if(s.stage!=='waymarket'||wDone('cartJob')||wDone('job:cart:tried'))return true;
  w.done['job:cart:tried']=true;
  worldCheck('investigation',13,'The caravan axle and false bolts',
   'You identify the deliberate damage, replace the damaged pin, and guide the sacks off the broken wagon. The merchant pays the promised 10 gp.',
   'A warped pin snaps under your first repair. Nobody is injured, but the wagon remains unsafe and the merchant cannot pay you. The saboteurs are still nearby; you may face them instead.',
   passed=>{if(passed){w.done.cartJob=true;worldGain(10);worldLoyalty(1,0,{mara:1,tamsin:1});}else s.hp=Math.max(1,s.hp-1);});return true;
 }
 if(item==='job:cart:fight'){
  if(s.stage==='waymarket'&&!wDone('cartJob'))startWorldBattle('cartSaboteurs');return true;
 }
 if(item==='job:moor:check'){
  if(s.stage!=='northmoor'||wDone('moorAid')||wDone('job:moor:tried'))return true;
  if(!wDone('job:moor:supplied')){if(s.inventory.rations<1)return true;s.inventory.rations--;w.done['job:moor:supplied']=true;}
  w.done['job:moor:tried']=true;
  worldCheck('survival',13,'Supplies on a dangerous road',
   'You choose a stable trail and bring Isolde the food without attracting the raiders. She pays 9 gp for the completed supply run.',
   'The waystation is in sight, but raiders force you back before the parcel can be delivered. Isolde cannot pay for an undelivered load. You can clear the route by fighting.',
   passed=>{if(passed){w.done.moorAid=true;worldGain(9);worldLoyalty(1,0,{mara:1,tamsin:1});}else s.hp=Math.max(1,s.hp-1);});return true;
 }
 if(item==='job:moor:fight'){
  if(s.stage!=='northmoor'||wDone('moorAid'))return true;
  if(!wDone('job:moor:supplied')){if(s.inventory.rations<1)return true;s.inventory.rations--;w.done['job:moor:supplied']=true;}
  startWorldBattle('moorSupplyRaiders');return true;
 }
 if(item==='job:port:check'){
  if(s.stage!=='harbor'||!w.cargo||w.cargoReady||wDone('job:port:tried'))return true;
  w.done['job:port:tried']=true;
  worldCheck('survival',14,'The cargo route and broken harbor seals',
   'You navigate the dangerous shipping lanes, identify a forged toll stamp, and register the genuine cargo seal. The crate is now ready for delivery; the fee still requires traveling to its destination.',
   'The thieves’ false trail hides the proper manifest. The captain will not recognize an unsecured load. You can confront the charter thieves and claim safe passage.',
   passed=>{if(passed)w.cargoReady=true;else s.hp=Math.max(1,s.hp-1);});return true;
 }
 if(item==='job:port:fight'){
  if(s.stage==='harbor'&&w.cargo&&!w.cargoReady)startWorldBattle('portCargoRaiders');return true;
 }
 if(item==='potion'||item==='rations'){const cost=item==='potion'?8:4;if(!worldCanSpend(cost))return true;worldGain(-cost);if(item==='potion')s.potions=Math.min(20,s.potions+1);else s.inventory.rations=Math.min(20,s.inventory.rations+2);worldBeat('A fair exchange',`You pay ${cost} gp for ${item==='potion'?'one Potion of Healing':'two travel rations'}. Your purse now contains ${world().gold} gp.`);return true;}
 if(item==='moorClue'||item==='fenRescue'||item==='portBroker'||item==='cryptSolve'){
  if(wDone(item))return true;world().done[item]=true;
  const spec={moorClue:['perception',13,'The lost maintenance stair','Your reading of the wolf marks reveals the original commons conductor, a safer route to the tower.','The symbols are eroded. You will reach the tower but without a trusted route.'],fenRescue:['survival',12,'A rescue in the marsh','You guide the barge out along the old stones. The grateful crew shares a spare lantern and fresh water.','You help the crew reach shore, but the shifting banks bruise you and damage some supplies.'],portBroker:['insight',12,'The broker’s explanation','The broker inadvertently confirms that the lighthouse controls access rather than simply warning ships.','The broker offers only polished promises; you know someone is earning from the darkness.'],cryptSolve:['investigation',14,'The founder’s cipher','You identify the original binding agreement among towns and gain a piece of evidence no faction can easily deny.','You can read the general story but not the names hidden in the cipher.']};
  const [skill,dc,title,okText,failText]=spec[item];
  worldCheck(skill,dc,title,okText,failText,success=>{if(success){world().clues++;world().done[item+'Success']=true;}if(item==='fenRescue'){world().done.fenRescueSafe=true;if(!success)s.hp=Math.max(1,s.hp-2);else worldGain(5);}});return true;
 }
 if(item.startsWith('beacon:')){const [,id,approach]=item.split(':');worldBeacon(id,approach);return true;}
 if(item==='archivePublish'||item==='archiveSell'){
  if(wDone('archiveChoice'))return true;world().done.archiveChoice=true;world().done[item]=true;
  if(item==='archivePublish'){world().clues+=2;worldLoyalty(2,-2,{mara:1,tamsin:1,corvin:-1});worldBeat('A copy for every village','You make the records available to the people whose names they contain. The Syndicate cannot fully erase the truth, and the keepers trust you to use it responsibly.');}
  else{worldGain(25);worldLoyalty(-3,3,{mara:-1,tamsin:-1,corvin:1});worldBeat('The price of a name',`The Syndicate pays 25 gp for exclusive ownership of your copy. You keep a memory of what you read, but the families named in the book cannot examine the evidence you have sold.`);}
  return true;
 }
 if(item.startsWith('pledge')){if(wDone('citadelPledge'))return true;world().done.citadelPledge=true;world().done[item]=true;
  if(item==='pledgeKeepers'){worldLoyalty(2,-1,{mara:1,tamsin:1});worldBeat('A council rather than a crown','You pledge to support shared governance of the waylights, and the keepers agree to stand beside you.');}
  else if(item==='pledgeGuild'){worldGain(15);worldLoyalty(-2,2,{corvin:1,mara:-1});worldBeat('The syndicate charter','You receive 15 gp in advance for your promise to consider private stewardship. No contract yet binds your final choice.');}
  else worldBeat('No seal above your own','You decline both invitations. The Citadel hears your refusal; the final decision will still be yours.');return true;
 }
 if(item==='relief'){if(wDone('relief')||!worldCanSpend(12))return true;world().done.relief=true;world().relief++;worldGain(-12);worldLoyalty(2,0,{tamsin:1});worldBeat('Supplies for people, not towers','You pay 12 gp to send a caravan of grain and lamp oil to the villages most affected by the dark network. The relief is real, even if every beacon cannot be repaired.');return true;}
 if(['finalRestore','finalRule','finalFree'].includes(item)){
  if(s.stage!=='worldheart'||world().ending||(item==='finalRestore'&&!worldCanRestore())||(item==='finalRule'&&!worldCanRule()))return true;
  const ending={finalRestore:'restore',finalRule:'rule',finalFree:'free'}[item];world().ending=ending;world().done.final=true;
  if(ending==='restore'){
   const count=Object.values(world().beacons).filter(x=>x==='claimed').length;
   const mandate=worldHasMandate();
   if(count&&!mandate)worldGain(-20*count);
   for(const id of Object.keys(world().beacons)){
    // A public charter honors beacons voluntarily entrusted to local keepers.
    if(world().beacons[id]!=='independent')world().beacons[id]='restored';
   }
   world().mercy=4;world().dominion=0;
   worldLoyalty(3,-2,{mara:1,tamsin:1,corvin:-1});
  }
  if(ending==='rule'){
   for(const id of Object.keys(world().beacons))world().beacons[id]='claimed';
   world().dominion=4;world().mercy=0;
   worldGain(40);worldLoyalty(-3,3,{mara:-2,tamsin:-2,corvin:1});
  }
  if(ending==='free'){
   const claims=Object.values(world().beacons).filter(state=>state==='claimed').length;
   let spentGold=0,spentRations=0,spentHp=0;
   for(let i=0;i<claims;i++){
    if(worldCanSpend(10)){worldGain(-10);spentGold+=10;}
    else if(s.inventory.rations>0){s.inventory.rations--;spentRations++;}
    else {const old=s.hp;s.hp=Math.max(1,s.hp-2);spentHp+=old-s.hp;}
   }
   const days=Math.max(1,claims*2);
   world().day=Math.min(500,world().day+days);world().hour=8;
   world().done.freeAccordSigned=true;
   world().freeAccordCost={claims,days,spentGold,spentRations,spentHp};
   for(const id of Object.keys(world().beacons))world().beacons[id]='independent';
   world().dominion=0;world().mercy=4;
   worldLoyalty(1,-1,{mara:1,tamsin:1});
  }
  worldStep('roadFinale',ending==='restore'?'The common lights answer':ending==='rule'?'The network bows to a steward':'The central seal breaks',ending==='restore'?'Your promise takes the form of a public charter.':ending==='rule'?'Every route now carries your seal, and the first toll arrives in your ledger.':`You spend ${world().freeAccordCost.days} day(s) negotiating town-by-town stewardship of ${world().freeAccordCost.claims} disputed private claim(s), paying ${world().freeAccordCost.spentGold} gp and ${world().freeAccordCost.spentRations} ration(s), with ${world().freeAccordCost.spentHp} HP lost to travel where supplies ran out. The towns now maintain their own beacons.`);return true;
 }
 return true;
}

const WORLD_ENCOUNTERS={
 fenFight:{stage:'glassfen',name:'Marsh toll sentinels',hp:16,ac:12,gold:8},
 spireFight:{stage:'citadelSpire',name:'Charter enforcers',hp:22,ac:14,gold:12},
 gateRaid:{stage:'wayInvestigation',name:'Gatehouse toll guards',hp:18,ac:12,gold:7},
 moorWolves:{stage:'moorPass',name:'Stormbound moor wolves',hp:20,ac:13,gold:0},
 fenGuardian:{stage:'fenCauseway',name:'False-light guardian',hp:23,ac:13,gold:9},
 harborDuel:{stage:'harborTribunal',name:'Dockside charter blades',hp:24,ac:14,gold:10},
 cryptShade:{stage:'cryptThreshold',name:'Memory-shard specter',hp:26,ac:13,gold:0},
 citadelGuards:{stage:'citadelDebate',name:'Citadel hired shields',hp:28,ac:15,gold:12},
 heartEcho:{stage:'heartTrial',name:'Worldheart living echo',hp:32,ac:15,gold:0},
 depotThugs:{stage:'oldDepot',name:'Depot extortionists',hp:21,ac:12,gold:0},
 watchRavagers:{stage:'moorWatch',name:'Tower scavengers',hp:23,ac:13,gold:0},
 reedWights:{stage:'fenReliquary',name:'Reed-bound guardians',hp:26,ac:13,gold:0},
 cisternBlades:{stage:'saltCistern',name:'Cistern smugglers',hp:28,ac:14,gold:0},
 bellSentinel:{stage:'bellCatacomb',name:'Bronze bell sentinel',hp:34,ac:15,gold:0},
 cartSaboteurs:{stage:'waymarket',name:'Caravan saboteurs',hp:16,ac:12,gold:0},
 moorSupplyRaiders:{stage:'northmoor',name:'Moor supply raiders',hp:18,ac:12,gold:0},
 portCargoRaiders:{stage:'harbor',name:'Charter cargo thieves',hp:22,ac:13,gold:0}
};
function startWorldBattle(id){const info=WORLD_ENCOUNTERS[id];if(!info||info.stage!==s.stage)return;
 const hp=info.hp;
 world().battle={active:true,origin:info.stage,encounter:id,enemyHp:hp,enemyMax:hp,enemyAc:info.ac,round:1,phase:'initiative',guard:false,bonus:false,started:false,next:null,result:null,allyUsed:false,actionUsed:false,extra:false,surgeReady:false,hidden:false};
 worldBeat('An encounter begins',`The ${info.name.toLowerCase()} stand between you and the next waylight. Fighting is optional: you can still retreat to attempt negotiation, investigation or a different route. Your companions may help only if they are present and loyal.`);
}
function worldBattleName(b){return WORLD_ENCOUNTERS[b.encounter]?.name|| (b.origin==='glassfen'?'Marsh toll sentinels':'Charter enforcers');}
function renderWorldBattle(){const b=world().battle;if(!b)return '';
 const phases=b.phase==='initiative'?'<p>Combat begins with initiative. Roll to determine who acts first.</p><button class="primary" data-act="wb:init">Roll initiative 🎲</button>':b.phase==='result'?`<div class="tactical-result"><span class="small-caps">ROUND ${b.round} · ACTION RESULT</span><h3>${esc(b.result.title)}</h3><p>${esc(b.result.story)}</p>${b.result.math?`<p>${esc(b.result.math)}</p>`:''}<button class="primary" data-act="wb:continue">Continue →</button></div>`:`<div class="tactical-actions"><strong>YOUR TURN · ROUND ${b.round}${b.actionUsed?' · Action spent':''}</strong><p>Choose one Action, plus an available Bonus Action. Companion assistance is available only when that companion is active and loyal. A level-3 Champion can score weapon criticals on 19–20, a Thief can distract with Fast Hands, and a level-3 Wizard can cast Shatter using a level-2 slot.</p><div class="practice-buttons"><button data-act="wb:attack" ${b.actionUsed?'disabled':''}>⚔ Attack</button>${s.classId==='wizard'?`<button data-act="wb:missile" ${s.slots<=0||b.actionUsed||b.extra?'disabled':''}>✦ Magic Missile (${s.slots})</button>`:''}<button data-act="wb:dodge" ${b.actionUsed?'disabled':''}>◇ Dodge</button>${s.classId==='wizard'&&s.level>=3?`<button data-act="wb:shatter" ${world().slots2<=0||b.actionUsed||b.extra?'disabled':''}>⚡ Shatter · level-2 slot (${world().slots2})</button>`:''}${s.classId==='rogue'&&s.level>=3&&!b.bonus?`<button data-act="wb:thief">◆ Fast Hands: distract</button>`:''}${wTrusted('tamsin')&&!b.allyUsed?`<button data-act="wb:allyHeal">♡ Tamsin: field dressing</button>`:''}${(wTrusted('mara')||wTrusted('corvin'))&&!b.allyUsed?`<button data-act="wb:allyStrike">⚔ Companion assist</button>`:''}${carriesLantern()&&lanternSparks()>0&&!b.actionUsed?`<button data-act="wb:lantern">✧ Lantern flare (${lanternSparks()} sparks)</button>`:''}${world().flashpowder>0&&!b.actionUsed?`<button data-act="wb:flashpowder">✦ Flashpowder (${world().flashpowder})</button>`:''}${s.classId==='fighter'&&s.level>=2&&b.actionUsed&&!b.extra&&s.actionSurge>0?`<button data-act="wb:surge">⚔ Action Surge (${s.actionSurge})</button>`:''}${b.actionUsed?`<button data-act="wb:endturn">End turn →</button>`:''}${s.classId==='fighter'?`<button data-act="wb:wind" ${b.bonus||s.secondWind<1||s.hp>=maxHp()?'disabled':''}>✚ Second Wind</button>`:''}<button data-act="wb:potion" ${b.bonus||s.potions<1||s.hp>=maxHp()?'disabled':''}>⚗ Potion</button><button data-act="wb:retreat">↶ Retreat safely</button></div></div>`;
 return `<section class="story-screen battle-screen"><div class="combat-banner"><span>CHAPTER ${WORLD_STAGES[b.origin]} · LIVE ENCOUNTER</span><h2>${worldBattleName(b)}</h2><p>Your story and progress are autosaved after every combat result.</p></div><div class="combat-body"><div class="tactical-hps"><div class="tactical-health ally"><span>♥ ${esc(s.heroName)}</span><strong>${s.hp}/${maxHp()} HP</strong><div><i style="width:${100*s.hp/maxHp()}%"></i></div></div><div class="tactical-health foe"><span>⚔ ${worldBattleName(b)}</span><strong>${b.enemyHp}/${b.enemyMax} HP</strong><div><i style="width:${100*b.enemyHp/b.enemyMax}%"></i></div></div></div>${phases}</div></section>`;
}
function worldBattlePause(title,story,math,next){const b=world().battle;if(!b)return;b.phase='result';b.result={title,story,math};b.next=next;commit();}
function worldBattleAction(action){const b=world().battle;if(!b?.active)return true;const key=action.slice(3);
 if(key==='init'&&b.phase==='initiative'){
  const dex=Math.floor((hero().stats.DEX-10)/2),p1=rand(20),p2=s.classId==='fighter'&&s.level>=3?rand(20):null,p=p2===null?p1:Math.max(p1,p2),e=rand(20);
  worldBattlePause(p+dex>=e+1?'You move first':'The opposition moves first',`Initiative: d20 ${p1}${p2===null?'':` / ${p2} → ${p} (Champion advantage)`} ${signed(dex)} = ${p+dex}; opponents roll ${e}+1 = ${e+1}.`,'',p+dex>=e+1?'start':'enemy');return true;
 }
 if(key==='continue'&&b.phase==='result'){
  const next=b.next;b.result=null;b.next=null;
  if(next==='victory'){
   const info=WORLD_ENCOUNTERS[b.encounter]||WORLD_ENCOUNTERS[b.origin==='glassfen'?'fenFight':'spireFight'];
   const flag=b.encounter|| (b.origin==='glassfen'?'fenFight':'spireFight');world().done[flag]=true;
   const problem=frontierEncounterResolved(flag);if(problem)world().done[problem+'Resolved']=true;
   const siteId=Object.keys(SIDE_SITES).find(id=>SIDE_SITES[id].enemy===flag);if(siteId)earnSite(siteId,'combat');
   let jobResult='';
   if(flag==='cartSaboteurs'&&!wDone('cartJob')){world().done.cartJob=true;worldGain(10);jobResult='The caravan owner pays the agreed 10 gp for defending and repairing their wagon.';}
   if(flag==='moorSupplyRaiders'&&!wDone('moorAid')&&wDone('job:moor:supplied')){world().done.moorAid=true;worldGain(9);jobResult='You recover the supplies and deliver them safely. Isolde pays the agreed 9 gp.';}
   if(flag==='portCargoRaiders'&&world().cargo){world().cargoReady=true;jobResult='The stolen shipping seal is recovered. Your crate is now secure, but the 14 gp reward will only be paid at its destination.';}
   world().battle=null;world().encountersWon++;worldGain(info.gold);worldLoyalty(1,0,{mara:1});
   worldBeat('The road is yours to walk',`You overcome ${info.name.toLowerCase()}. The road is now clear, and ${info.gold?`you recover ${info.gold} gp in usable supplies and toll money.`:'you secure the route without taking coin from its people.'} ${siteId?`Your exploration also yields ${SIDE_SITES[siteId].rewardGold} gp and ${SIDE_SITES[siteId].shards} emberglass fragment(s).`:''} ${jobResult} The encounter has consequences and will not repeat when you revisit this place.`,true);return true;
  }
  if(next==='flee'||next==='defeat'){world().battle=null;if(next==='defeat')s.hp=Math.max(s.hp,1);worldBeat('You withdraw and regroup',next==='defeat'?(world().active.length?'An ally distracts the attackers while you retreat.':'You throw yourself behind a fallen marker and crawl out of the attackers’ reach.')+' At 1 HP you can rest, heal, or take a noncombat route.':'You abandon this fight for now. Its opponents will remain until you resolve the situation or choose a different way forward.');return true;}
  if(next==='enemy'){
   const r1=rand(20),r2=b.guard?rand(20):null,die=r2===null?r1:Math.min(r1,r2),hit=die===20||(die!==1&&die+3>=hero().ac+Number(world().gear.armor||0)+Number(world().gear.shield||0)),before=s.hp,damage=hit?rand(4)+1+(die===20?rand(4):0):0;
   s.hp=Math.max(0,s.hp-damage);b.guard=false;
   worldBattlePause(hit?'An enemy strike lands':'The attack misses',hit?`${worldBattleName(b)} deal ${damage} damage. HP ${before} → ${s.hp}.`:'You avoid the blow; your Armor Class and positioning keep you safe.',`d20 ${r1}${r2===null?'':' / '+r2+' → '+die+' (Dodge)'} + 3 vs AC ${hero().ac+Number(world().gear.armor||0)+Number(world().gear.shield||0)}`,s.hp<=0?'defeat':!b.started?'start':'player');return true;
  }
  if(next==='player'||next==='bonus'||next==='start'||next==='surge'){
   b.phase='player';b.started=true;
   if(next==='player'){b.round++;b.bonus=false;b.actionUsed=false;b.hidden=false;}
   if(next==='start'){b.actionUsed=false;b.bonus=false;}
   if(next==='surge')b.actionUsed=true;
   commit();return true;
  }
 }
 if(b.phase!=='player')return true;
 if(key==='surge'&&s.classId==='fighter'&&s.level>=2&&b.actionUsed&&!b.extra&&s.actionSurge>0){s.actionSurge--;b.actionUsed=false;b.extra=true;worldBattlePause('Action Surge','You gain one additional non-Magic Action this turn. You can make another weapon attack or Dodge, but not cast Shatter or Magic Missile.','','bonus');return true;}
 if(key==='endturn'&&b.actionUsed){worldBattlePause('The exchange continues','You finish your turn after choosing your actions. The opposition prepares to move.','','enemy');return true;}
 if(key==='allyHeal'&&wTrusted('tamsin')&&!b.allyUsed&&s.hp<maxHp()){
  b.allyUsed=true;const before=s.hp;s.hp=Math.min(maxHp(),s.hp+rand(6)+2);
  worldBattlePause('Tamsin binds your wounds',`Your active companion uses a field dressing. HP ${before} → ${s.hp}. This support can be used once per encounter; it is not a player spell.`,`+${s.hp-before} HP`,'bonus');return true;
 }
 if(key==='allyStrike'&&(wTrusted('mara')||wTrusted('corvin'))&&!b.allyUsed){b.allyUsed=true;const ally=wTrusted('mara')?'Mara':'Corvin',d=rand(6)+2;b.enemyHp=Math.max(0,b.enemyHp-d);worldBattlePause(`${ally} intervenes`,`${ally} spots a vulnerable opening and deals ${d} damage. Enemy HP: ${b.enemyHp+d} → ${b.enemyHp}. Companion assistance is spent for this encounter.`,`${d} damage`,b.enemyHp<=0?'victory':'bonus');return true;}
 if(key==='lantern'&&carriesLantern()&&lanternSparks()>0&&!b.actionUsed){s.lanternSparks--;b.actionUsed=true;const d=rand(8)+2;b.enemyHp=Math.max(0,b.enemyHp-d);b.guard=true;worldBattlePause('Lantern flare',`You direct a blue flash into the enemy, dealing ${d} radiant damage and making its next attack less accurate. ${lanternSparks()} of 3 sparks remain. The lantern stays in your Pack.`,`${d} radiant damage`,b.enemyHp<=0?'victory':'enemy');return true;}
 if(key==='flashpowder'&&world().flashpowder>0&&!b.actionUsed){world().flashpowder--;b.actionUsed=true;b.guard=true;const d=rand(4)+1;b.enemyHp=Math.max(0,b.enemyHp-d);worldBattlePause('A blinding flash',`The purchased powder bursts in brilliant white light. The foe suffers ${d} damage and attacks with disadvantage. The flask is consumed.`,`${d} damage`,b.enemyHp<=0?'victory':'enemy');return true;}
 if(key==='thief'&&s.classId==='rogue'&&s.level>=3&&!b.bonus){b.bonus=true;b.hidden=true;worldBattlePause('Thief: Fast Hands','You use an improvised distraction with your quick hands. In this tutorial encounter it grants advantage on your next attack. The full tabletop feature has broader item and Sleight of Hand uses.','Bonus Action','bonus');return true;}
 if(b.actionUsed&&(key==='attack'||key==='missile'||key==='shatter'||key==='dodge'))return true;
 if(key==='retreat'){worldBattlePause('You fall back','You use the disengaging route to break contact with the sentinels. Combat ends only after you continue.','', 'flee');return true;}
 if(key==='wind'||key==='potion'){
  if(b.bonus||s.hp>=maxHp())return true;let heal=0,label='';if(key==='wind'&&s.classId==='fighter'&&s.secondWind>0){heal=rand(10)+s.level;s.secondWind--;label='Second Wind';}else if(key==='potion'&&s.potions>0){heal=rand(4)+rand(4)+2;s.potions--;label='Healing potion';}else return true;
  const before=s.hp;s.hp=Math.min(maxHp(),s.hp+heal);b.bonus=true;worldBattlePause(`${label} restores health`,`HP ${before} → ${s.hp}. Your bonus action is spent; you still have your main Action this turn.`,`${label}: +${s.hp-before} HP`,'bonus');return true;
 }
 if(key==='dodge'){b.guard=true;b.actionUsed=true;worldBattlePause('You prepare to dodge','Your Action is spent. The opposition rolls its next attack with disadvantage.','','enemy');return true;}
 if(key==='attack'||key==='missile'||key==='shatter'){
  let damage=0,math='',hit=true,crit=false;const before=b.enemyHp;
  if(key==='missile'){
   if(s.classId!=='wizard'||s.slots<=0||b.extra)return true;
   s.slots--;damage=rand(4)+rand(4)+rand(4)+3;
   math=`Magic Missile hits automatically · ${damage} force damage · ${s.slots} level-1 slot(s) left`;
  }else if(key==='shatter'){
   if(s.classId!=='wizard'||s.level<3||world().slots2<=0||b.extra)return true;
   world().slots2--;
   const dice=[rand(8),rand(8),rand(8)];const total=dice.reduce((a,z)=>a+z,0),save=rand(20)+2,dc=8+2+Math.floor((hero().stats.INT-10)/2);
   damage=save>=dc?Math.floor(total/2):total;
   math=`Shatter · CON save ${save} vs DC ${dc} · ${dice.join('+')}=${total} thunder damage · ${save>=dc?'half':'full'} · ${world().slots2} level-2 slots remaining`;
  }else{
   const die1=rand(20),help=(wTrusted('corvin')&&b.round===1)||b.hidden?rand(20):null,die=help===null?die1:Math.max(die1,help);
   crit=die===20||(s.classId==='fighter'&&s.level>=3&&die===19);hit=crit||(die!==1&&die+hero().attack+Number(world().gear.weapon||0)>=b.enemyAc);
   damage=hit?rand(hero().damageDie)+(crit?rand(hero().damageDie):0)+hero().damageMod+Number(world().gear.weapon||0):0;
   const sneak=s.classId==='rogue'&&(b.hidden||wTrusted('mara'));
   if(hit&&sneak){const dice=s.level>=3?2:1;for(let i=0;i<dice;i++){damage+=rand(6);if(crit)damage+=rand(6);}}
   if(hit&&wTrusted('mara')&&s.classId!=='rogue')damage+=rand(4);
   math=`d20 ${die1}${help===null?'':' / '+help+' (advantage)'} + ${hero().attack+Number(world().gear.weapon||0)} vs AC ${b.enemyAc}${crit?' · CRITICAL':''}${sneak?' · Sneak Attack':''}`;
  }
  b.hidden=false;b.actionUsed=true;b.enemyHp=Math.max(0,b.enemyHp-damage);
  const eligibleSurge=s.classId==='fighter'&&s.level>=2&&s.actionSurge>0&&!b.extra;
  worldBattlePause(hit?(b.enemyHp<=0?'You overcome the opposition':'Your attack strikes home'):'Your attack misses',hit?`${key==='missile'?'Magic Missile':key==='shatter'?'Shatter':hero().attackName} deals ${damage} damage. Enemy HP ${before} → ${b.enemyHp}.${wTrusted('mara')?' Mara helps cover your position.':''}`:'The attack misses. '+math,math,b.enemyHp<=0?'victory':eligibleSurge?'surge':'enemy');return true;
 }
 return true;
}

function worldAtlas(){const w=world();const nodes=[
 ['Tavern',130,415,1,null],['Briar Hollow',260,382,6,null],['Mountain beacon',351,330,8,null],['Waycross',426,310,10,'waygate'],['North Moor',504,182,11,'moor'],['Glassfen',573,402,12,'fen'],['Saltmere',710,430,13,'harbor'],['Archive',739,324,14,null],['Citadel',670,213,15,null],['Worldheart',604,273,16,null]
 ];
 const revealed=Math.max(s.unlocked||1,chapter(s.stage));
 return `<div class="atlas-wrap"><svg class="atlas-svg" viewBox="0 0 860 535" role="img" aria-label="A fantasy regional atlas of the Watchroad network, with known waylights and the current journey"><defs><linearGradient id="land" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#162c2e"/><stop offset="1" stop-color="#10171e"/></linearGradient><filter id="blueGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="860" height="535" rx="13" fill="url(#land)"/><path d="M0 98 Q180 20 345 90 T870 42 L870 0 L0 0Z" fill="#233237"/><path d="M0 520 Q175 400 285 445 T550 520 L860 480 L860 550Z" fill="#20342f"/><path d="M480 0 Q500 90 600 145 Q710 210 860 190" stroke="#35444b" stroke-width="35" fill="none" opacity=".7"/><path d="M490 0 Q515 95 610 157 Q725 220 860 208" stroke="#4c6871" stroke-width="5" fill="none" opacity=".6"/><path d="M110 422 Q185 388 260 382 L350 330 L426 310 L504 182 L670 213 L604 273 L573 402 L710 430 L739 324 L670 213" stroke="#58756e" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/><path d="M130 415 L260 382 L351 330 L426 310 L504 182 L670 213 L604 273 L573 402 L710 430 L739 324 L670 213 M426 310 L573 402 M351 330 L604 273" stroke="#6faac2" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="7 8" fill="none" filter="url(#blueGlow)"/><g opacity=".28" fill="#60807b"><path d="M205 135 l30 -60 l30 60z M233 133 l30 -78 l30 78z M286 139 l30 -53 l30 53z M360 180 l40 -95 l40 95z"/><path d="M50 265l36 -65l36 65z M110 268l40 -74l40 74z"/></g>${nodes.map(([name,x,y,minimum,id],idx)=>{const known=minimum<=revealed;const state=id?w.beacons[id]:null;const color=!known?'#39444a':state==='restored'?'#7ce4ba':state==='claimed'?'#edac70':state==='independent'?'#c5b1e8':known?'#93c9e8':'#4d5357';const title=known?name:'Unexplored region';return `<g opacity="${known?1:.65}"><circle cx="${x}" cy="${y}" r="${idx===9?11:8}" fill="#11171c" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="3" fill="${color}"/><text x="${x}" y="${y+(idx%2?29:-17)}" text-anchor="middle" fill="${known?'#e7e0d5':'#8e989b'}" stroke="#10181e" stroke-width="4" paint-order="stroke" font-size="${idx===9?15:13}" font-weight="600">${esc(title)}</text></g>`;}).join('')}<text x="30" y="42" fill="#ddc59e" font-size="20" font-family="Georgia,serif" letter-spacing="3">THE SHATTERED WATCHROAD</text><text x="31" y="63" fill="#a8aeb0" font-size="11" letter-spacing="2">BLUE ROADS · DARK WAYLIGHTS · LIVING TOWNS</text></svg></div><p class="muted">Blue lines connect the known waylights. Green beacons have been restored for public use; purple beacons are repaired and maintained by independent local keepers; amber beacons are privately controlled. Grey names remain unrevealed until you reach them.</p><div class="map-legend"><span>● Public light</span><span>● Independent local keepers</span><span>● Privately claimed</span><span>● Unexplored</span></div>`;
}
const REGIONAL_WAYPOINTS=[['roadCamp',9,'Travelers’ camp'],['waymarket',10,'Waycross market'],['northmoor',11,'North Moor'],['glassfen',12,'Glassfen'],['harbor',13,'Saltmere Harbor'],['undercrypt',14,'Buried Archive'],['citadel',15,'Citadel of Bells']];
function worldQuestLedger(){const w=world(),current=s.unlocked||1;const quests=[
 ['survey',9,'Understand the living map',()=>wDone('survey')],
 ...Object.entries(SIDE_SITES).map(([id,info])=>['site:'+id,info.chapter,`Explore ${info.title} · optional`,()=>wDone('site:'+id)]),
 ['gateObstacle',10,'Resolve the Waycross gatehouse obstacle',()=>wDone('wayInvestigationResolved')],
 ['gate',10,'Decide the fate of the Waycross beacon',()=>w.beacons.waygate!=='dark'],
 ['cartJob',10,'Help the Waycross caravan · optional',()=>wDone('cartJob')],
 ['moorObstacle',11,'Cross the moor safely',()=>wDone('moorPassResolved')],
 ['maraQuest',11,'Help Mara confront her patrol history · optional',()=>wDone('personal:mara')],
 ['moor',11,'Restore or claim the North Moor beacon',()=>w.beacons.moor!=='dark'],
 ['moorAid',11,'Deliver supplies to Isolde · optional',()=>wDone('moorAid')],
 ['fenObstacle',12,'Open a passage through the drowned causeway',()=>wDone('fenCausewayResolved')],
 ['tamsinQuest',12,'Help Tamsin with her clinic · optional',()=>wDone('personal:tamsin')],
 ['fen',12,'Resolve the Glassfen beacon',()=>w.beacons.fen!=='dark'],
 ['fenRescue',12,'Help the stranded barge · optional',()=>wDone('fenRescue')],
 ['harborObstacle',13,'Face the harbor tribunal',()=>wDone('harborTribunalResolved')],
 ['corvinQuest',13,'Help Corvin settle an old account · optional',()=>wDone('personal:corvin')],
 ['port',13,'Resolve the Saltmere harbor light',()=>w.beacons.harbor!=='dark'],
 ['portDelivery',13,'Deliver upriver provisions · optional',()=>wDone('portDelivery')],
 ['archiveObstacle',14,'Reach the original archive through its defenses',()=>wDone('cryptThresholdResolved')],
 ['archiveChoice',14,'Decide the fate of the founding charter',()=>wDone('archiveChoice')],
 ['citadelObstacle',15,'Earn a hearing in the Citadel',()=>wDone('citadelDebateResolved')],
 ['citadelPledge',15,'Choose your stance at the Citadel',()=>wDone('citadelPledge')],
 ['relief',15,'Fund a relief caravan · optional',()=>wDone('relief')],
 ['heartObstacle',16,'Pass the final Worldheart trial',()=>wDone('heartTrialResolved')],
 ['final',16,'Settle the future of the Watchroad',()=>Boolean(w.ending)]
 ].filter(([,minimum])=>minimum<=current);
 return `<section class="world-quest-section"><h3 class="world-title">Quest ledger</h3><p class="muted">Completed objectives stay recorded. Optional tasks can be revisited using the map while the campaign remains open.</p>${quests.map(([id,ch,title,done])=>`<div class="world-quest ${done()?'done':''}"><span>${done()?'✓':'◇'}</span><div><b>${esc(title)}</b><small>Chapter ${ch}${done()?' · Complete':' · Available'}</small></div></div>`).join('')}</section>`;
}
function worldMapTravel(action){const destination=action.slice(8),route=REGIONAL_WAYPOINTS.find(([stage])=>stage===destination);if(!route)return true;
 if(!WORLD_STAGES[s.stage]||s.stage==='roadFinale'||world().battle?.active||s.pending||s.storyResult||s.mindOffer||s.finalTest?.active||route[1]>(s.unlocked||1)||destination===s.stage)return true;
 const w=world();const travelSummary=worldTravelCost(s.stage,destination);
 const from=s.stage;s.stage=destination;modal=null;
 outcome('The road leads back',`You follow the known blue markers from ${WORLD_CHAPTERS.find(([n])=>n===WORLD_STAGES[from])?.[1]||TITLES[from]||'your last stop'} to ${route[2]}. Traveling takes one day. ${travelSummary} Older local quests can be continued here without changing the final choices you have already made.`);
 commit();return true;
}
function renderWorldMap(){if(!s.classId||!world())return '<p>Begin your adventure to discover the region.</p>';const w=world();return `${worldAtlas()}<div class="world-metrics"><div>Gold <b>${w.gold} gp</b></div><div>Day <b>${w.day}</b></div><div>Open lights <b>${w.mercy}</b></div><div>Claimed lights <b>${w.dominion}</b></div></div><h3 class="world-title">Your route</h3><p class="modal-lead">Your party follows the road through story choices. The map records discovered locations. Choose a known waypoint below to travel there; it costs a day and supplies.</p><div class="world-location-list">${Object.entries(w.beacons).map(([id,v])=>`<div><b>${esc(({waygate:'Waycross',moor:'North Moor',fen:'Glassfen',harbor:'Saltmere'})[id])}</b><span>${v==='dark'?'Not yet resolved':v==='restored'?'Open to everyone':v==='independent'?'Repaired by independent local keepers':'Privately controlled'}</span></div>`).join('')}</div><h3 class="world-title">Side adventures and hidden ruins</h3><p class="muted">Explore optional sites from Waycross, North Moor, Glassfen, Saltmere and the Citadel. They contain unique opponents, histories, gold and emberglass for recharging the Last Lantern. Completed sites remain marked in your quest ledger.</p><h3 class="world-title">Travel the known roads</h3><p class="muted">Known waypoints can be revisited to finish errands. Each journey takes one day and a ration, or 2 HP from fatigue if you have no rations. Your party cannot travel during combat or after the final ending.</p><div class="world-travel-list">${REGIONAL_WAYPOINTS.filter(([,level])=>level<=(s.unlocked||1)).map(([stage,level,name])=>`<button data-act="wtravel:${stage}" ${s.stage===stage||s.stage==='roadFinale'||w.battle?.active||s.storyResult||s.pending?'disabled':''}>${esc(name)} <small>Chapter ${level}</small></button>`).join('')}</div>${worldQuestLedger()}`;}
function renderParty(){const w=world();return `<p class="modal-lead">Recruit allies at the traveling camp. You can travel with two active companions; other recruits remain at the nearest safe waypoint. Allies contribute +2 to relevant story checks when active and loyal. Talk with an active companion at a safe moment to hear their concerns and choose how to respond. Joint planning can grant a one-use bonus on a later skill check.</p><div class="world-metrics"><div>Gold <b>${w.gold} gp</b></div><div>Active <b>${w.active.length}/2</b></div><div>Keepers <b>${signed(w.reputation.keepers)}</b></div><div>Syndicate <b>${signed(w.reputation.syndicate)}</b></div></div><div class="world-party">${Object.entries(COMPANIONS).map(([id,c])=>{const recruited=w.recruited.includes(id),active=w.active.includes(id),loyal=w.trust[id]>-2;return `<section class="world-person"><div><b>${esc(c.name)}</b><small>${esc(c.role)} · Trust ${signed(w.trust[id])}</small><p>${esc(c.bio)}</p></div>${recruited?`<button data-act="wparty:${id}" ${!loyal||!WORLD_SAFE_STAGES.has(s.stage)?'disabled':''}>${active?'Send to camp':w.active.length>=2?'Swap into party':'Add to party'}</button>${active&&loyal&&worldCanTalkHere()&&!wDone('talk:'+id+':'+WORLD_STAGES[s.stage])&&!s.storyResult&&!w.battle?.active?`<button data-act="w:talk:${id}">Talk</button>`:''}`:'<small>Meet at the Chapter 9 camp to recruit</small>'}</section>`;}).join('')}</div><p class="muted">Party changes are only available at established safe camps and inns (Travelers’ Camp, Waycross, Saltmere and Citadel). You must actually return to one of these places to meet waiting allies.</p>`;}
function worldPartyAction(action){const id=action.slice(7),w=world();if(!COMPANIONS[id]||!w.recruited.includes(id)||w.trust[id]<=-2||!WORLD_SAFE_STAGES.has(s.stage)||s.storyResult||s.pending||s.stage==='combat'||s.stage==='crossingBattle'||s.finalTest?.active||world().battle?.active)return true;
 if(w.active.includes(id))w.active=w.active.filter(x=>x!==id);else if(w.active.length<2)w.active.push(id);else{w.active.shift();w.active.push(id);}record(`${COMPANIONS[id].name} ${w.active.includes(id)?'joins the active traveling party':'waits at the nearest safe camp'}.`);commit(false);return true;
}

Object.assign(CAMPAIGN_CHAPTER,WORLD_STAGES);
Object.assign(CAMPAIGN_ART,WORLD_ART);
Object.assign(CHAPTER_START,WORLD_START);
for(const [n,name,desc] of WORLD_CHAPTERS)CHAPTER_NAMES.push(name);
WORLD_NOTES.push(
 [9,'The blue lines on the mountain map','The network connects many independent waystations far outside Blackwood. The map is a living record, not a magical road that teleports travelers.'],
 [10,'The markets of Waycross','Road tolls create shortages for travelers who cannot pay. Gold changes what can be bought, but not every promise can be purchased.'],
 [11,'North Moor waystations','The moor sentries once maintained shared lamps, shelters and markers. Their work became obscured when the signal was routed toward private estates.'],
 [12,'Glassfen crossings','Marsh pilots disagree on how a beacon should be controlled. The old builders intended travelers from both shores to share its guidance.'],
 [13,'Saltmere tariffs','Harbor guilds built profitable systems around the loss of public navigation lights. Repairs can threaten established incomes.'],
 [14,'The founders’ accord','The first keepers agreed that no one should own every route. Later versions of the accord were altered to justify tolls.'],
 [15,'The Citadel’s two seals','The public keepers and the Syndicate seek different structures for governing the beacons. Companions may prefer different allies.'],
 [16,'The cost of a common road','A road is not repaired by one spell alone. It needs labor, trust, supply lines, money, and people who agree to keep it open.']);

s=load();
render();
})();
