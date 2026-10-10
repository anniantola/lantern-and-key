# Rules audit — Lantern & Key v2.0

This document records the intended tabletop rules baseline, corrections since v1.3 and the known boundaries of the learning simulation. Reference ruleset: **SRD 5.2.1**, corresponding to the 2024 fifth-edition revision, not SRD 5.1 (2014).

**Official source:** https://www.dndbeyond.com/srd (download *SRD 5.2.1*, licensed CC BY 4.0).

## Checked and corrected

| Area | SRD 5.2.1 principle | Implementation / correction |
|---|---|---|
| Ability checks and saves | d20 + relevant ability and proficiency, if applicable, against a DC; advantage/disadvantage use two d20s | Rolls remain visible in result cards; bonuses are not double-added. The Fighter's level-2 Tactical Mind is offered on failed ability checks, **not** saving throws. |
| Fighter Second Wind | **Two uses** at level 1; regain 1d10 + Fighter level HP as a Bonus Action; regain one use on Short Rest and all uses on Long Rest | Resource tracked across scenes; earlier one-use style was corrected. Cannot heal above maximum HP. |
| Fighter level 2 | Action Surge provides one extra action (not the Magic action), replenished after a Short or Long Rest; Tactical Mind adds 1d10 to a failed ability check and does **not** expend Second Wind if the check still fails | Added to Level-2 progression and practice/tactical modules. |
| Rogue Sneak Attack | +1d6 once per turn at levels 1–2, on a qualifying Finesse/ranged attack when there is advantage, or when the target has an eligible adjacent enemy of its own and the Rogue has no disadvantage | Being hidden is **not** itself a universal prerequisite. Sneak Attack damage dice double on critical hits. Solo scenes most commonly provide advantage; eligible ally situations are explained as rules but not fully simulated. |
| Rogue level 2 | Cunning Action provides Bonus Action Dash, Disengage, or Hide | Implemented in tactical/practice teaching, with cover requirements for Hide. |
| Wizard spell slots | 2 level-1 slots at Wizard level 1; 3 at level 2; cantrips do not use slots | Spell-slot consumption and displays updated; Magic Missile deals automatic force damage; Fire Bolt is an attack-roll cantrip. |
| Wizard Arcane Recovery | Once per Long Rest, following a Short Rest, recover an eligible spell slot (level 1 in this introductory range) | Added to Chapter 4 recovery. Wizard level-2 Scholar can choose Arcana or Investigation Expertise in these preset builds. |
| Rests | A Short Rest is at least 1 hour; Hit Point Dice can be spent for healing. A Long Rest is at least 8 hours and restores HP and expended Hit Point Dice; interruptions can prevent completion | Short/Long Rest options with resources, interrupted night and long-rest recovery in Chapter 4. Rest challenge is a *specific story event*, not a guaranteed interruption of all long rests. |
| Potions of Healing | Standard Potion of Healing restores 2d4+2 HP; 2024 rules permit drinking one as a Bonus Action | The former house-rule description was removed; limited campaign inventory tracked. |
| Movement and terrain | Typical speed 30 ft/turn; distance in 5-ft squares; difficult terrain costs extra movement | A compact 5×4 square bridge encounter teaches movement, Dash, proximity and difficult terrain. Diagonal movement and detailed line of sight are intentionally simplified. |
| Cover and opportunity attacks | Half cover grants +2 AC, three-quarters cover grants +5 AC; leaving a hostile creature's reach can provoke an opportunity attack unless Disengaging | Implemented on the tactical map, with visible results and paused turns. Encounter AI and geometry are deliberately limited. |
| Hiding | Hide requires sufficient concealment/cover and a successful Stealth check, not simply pressing a button in plain sight | Tactical training requires the designated deep-cover square before Hide. Chapter-3 abstract crates are a scripted terrain allowance. |
| Attacks, criticals, initiative | Attack roll vs AC, natural 1 misses, natural 20 critical; initiative generally Dexterity; double attack damage dice on a critical | Implemented in encounters. No complete spell targeting/resistance engine. |
| Saving throw spells and concentration | Some spells call for a target saving throw rather than the caster's attack roll. Damage while concentrating can prompt a Constitution save; concentration can break | Chapter 7 contains independent teaching examples of attack spells, saving-throw spells and a controlled concentration check. |
| Character advancement | Leveling grants new class features, hit die and Hit Point maximum increase | Chapter 8 increases HP, Hit Dice, remaining resource ceilings and features, and supports class-specific practice. |

## Intentional omissions / approximations

- **Guided branching story**, not open-text free-form roleplay or AI Dungeon Master. “Tabletop mode” hides some advance hints but still uses the same fixed story choices.
- Three preset Level-1/2 characters; not all starting traits (species, backgrounds, feats, Fighting Styles, Weapon Mastery, Wizard spellbook, complete weapon proficiencies and every skill) are available for selection. Those omissions should not be taken as indicating the features do not exist in tabletop D&D.
- Chapter 3 is abstract turn-based combat; Chapter 5 uses an intentionally small grid, deterministic encounter geometry, 30-ft tutorial speed and basic monster decisions. No multiplayer, vertical spaces, diagonal movement variant, spell areas, full line of sight or comprehensive conditions.
- Chapter-5 cover/Hide and target selection are scripted examples to teach the concept, not a general-purpose VTT or rules arbiter.
- Potion drinking from the inventory outside combat is a basic interaction; the Bonus Action distinction applies in combat.
- In Chapter 7, non-Wizard characters **observe the tutor** cast Wizard spells. The training focus illustrates concentration for all classes but does not grant permanent spellcasting.
- A character at 0 HP can retry a nearby story checkpoint; formal unconsciousness, stabilization and death-saving throws are not simulated. This is a **learning safety net**, not the tabletop rule.
- A homemade **smoke pellet** is a narrative/training consumable, not an officially listed standard SRD item. Other items are narrowed to explicit scene uses and do not cover improvised unlimited actions.
- Chapter selection restores snapshots and rewinds later events; it is a replay feature, not an in-world ability to undo time.

## Compatibility and testing

The stored JSON retains the old `version: 1` shape and local-storage key deliberately, adding optional fields through safe defaults during migration. Tests cover a save from before Chapter 4, new story chapters, a bridge battle and noncombat crossing, Wizard and Fighter feature paths, mobile UI, rule lookup, and result pauses. These tests are **targeted browser-flow checks**, not a formal exhaustive proof of every possible decision combination.


## v2.3 follow-up (2026-10-10)

- **Rests:** players may decide to spend a further available Hit Die after each roll on the same uninterrupted Short Rest. Each roll adds the CON modifier, with a minimum of 1 HP.
- **Movement:** each entered 5-ft square costs one movement unit, or two on difficult terrain, with eight-neighbor diagonal movement, tutorial-specific blocked-space restrictions, a least-cost path, and opportunity attacks checked along the route. Explicit freehand path drawing is not yet implemented.
- **Ranged attacks:** disadvantage if an eligible hostile creature is within 5 ft, including spell attack rolls; opposing advantage and disadvantage cancel.
- **Action Surge:** one additional Action on the turn, excluding the Magic action (2024 rules). The revised practice duel now pauses before the sentry responds.
- **Chapter 8 challenge:** a brief training duel and an alternative noncombat resolution to demonstrate new class abilities before the ending. Nonlethal training strikes and simplified NPC behavior are intentional house rules.
- **Character creation:** the preset characters still omit full origin, feat, weapon mastery, and prepared-spell selection. These remain labeled simplifications; this project does not assert full SRD simulation.

Primary references: D&D Beyond 2024 Basic Rules, **Playing the Game**, **Character Classes**, and **Rules Glossary**, available via https://www.dndbeyond.com/sources/dnd/br-2024/ .

## v2.4 — Original artifact, not an official class feature

**The Last Lantern** is a fictional campaign-specific item created for this tutorial, not a named magic item from SRD 5.2.1. Its three sparks, story applications, rest-based replenishment, and distinct ending choices are **homebrew adventure rules**. They are intended to teach resource tradeoffs, roleplay consequences and informed decisions, not to represent an official D&D spell, magic-item template or class feature. Players without the artifact still have appropriate alternatives.

A migration deliberately treats `ending: "take"` as authoritative and grants the carried item even if earlier backups contained `inventory.lantern: 0`; its unique item persists after sparks are spent. New save fields default safely to preserve old data.

Chapter replays are separate from the main campaign, rather than rewinding the main slot.


## v2.4.1 — Story-state integrity

Causal-prerequisite checks for the original vault, village evidence versus outcome, camp shelter, travel routes and the ending. These are **narrative correctness changes**, not modifications to official D&D rules. The manual-repair alternative is an original tutorial skill challenge, and the lantern is an original artifact. Old saves with contradictory council-state flags are reconciled using recorded verdicts where available.
