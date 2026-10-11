# Lantern & Key v3.2.3 — Combat Resume & Distinct Evidence

This is a focused continuity and save-safety update for the 16-chapter Watchroad campaign. It retains all v3.2.2 story chapters, existing optional adventures, lantern systems, money, companion relationships, mobile tabs, and GitHub Actions configuration.

- **Fighter save/reload:** A regional battle paused just after a Fighter's attack, when the result offers **Action Surge**, survives saving, importing and reloading. Continuing the result returns to the same encounter with the correct turn state; it no longer silently drops the fight.
- **Unique companion evidence:** Listening to Mara's patrol testimony produces **one distinct clue overall**, not another clue each time the same story is retold in a later chapter. You can still listen again to build trust. Conversations with other companions remain unchanged.
- **Older saves:** If an older journal unambiguously records multiple copies of Mara's listen-result text, the excess clue count is reconciled once. Where the historical record is incomplete, unrelated evidence is preserved and further duplicate awards are blocked. Existing quests, items, HP and choices are untouched.
- **Tests:** Five new focused regression tests cover saving during the paused Action Surge window, continuing the turn, repeated conversations, conversations without evidence, and one-time older-save migration. **194** tests run as part of the existing Node test command (the exact count is shown below).

**Update your GitHub Pages repository:** Replace the root-level files `game.js`, `tests-world.cjs`, `sw.js`, `README.md` and optionally `RULES-AUDIT.md`. There are no new assets or folders. The existing `.github/workflows/deploy.yml` works unchanged. Run `node --test tests-core.cjs` before publishing.

**Before replacing files:** Export a JSON save from Settings. Existing save data remains compatible, and no new save format is required.

---

# Lantern & Key v3.2.2 — Narrative Integrity Patch

This update repairs the continuity and consequence issues identified in the v3.2.1 full-campaign audit. The 16 chapters, optional dungeons, companion quests, four waylight resolutions, skill checks, shops, and Last Lantern remain playable. The existing JSON save format and GitHub Pages installation are preserved.

**Fixes:** Glassfen rescue completion now persists after either a clean or costly rescue; a failed rescue check still brings the stranded barge ashore but never awards success-only gold. Negotiating a public mandate at the Worldheart takes a day (and a ration or fatigue), records an actual signed mandate rather than fabricating ledger clues or relief donations, and cannot be retried with the same offer after failure. You can gather real evidence or offer real aid and then return to negotiate. The Waycross story distinguishes a paid pass from exposing the fraudulent books. Optional and frontier narration no longer presumes companions who are not traveling with you. The independent Worldheart route requires time and resources to reconcile privately claimed lights, with the cost reflected in the outcome. Long rests and foraging are unavailable in sealed ruins and Worldheart chambers; safe settlements and appropriate wilderness camps still offer them. Short rests remain available where a pause is plausible.

**Older saves:** Completed Glassfen rescue states migrate on load, including costly rescues. Existing inventory, quests, companions, waylight decisions and previous endings stay intact. The new independent-settlement cost is recorded on newly completed endings; prior completed endings are not retroactively charged. Older Worldheart saves that already acquired sufficient support retain their access to public restoration. Save export/import still works as before.

**Update existing GitHub repository:** Replace `game.js`, `sw.js`, `tests-world.cjs`, `README.md` and (optionally) `RULES-AUDIT.md` in the repository root. No folders or `.github/workflows/deploy.yml` changes are required. Existing workflow uses `node --test tests-core.cjs`, which already loads `tests-world.cjs`.

**Before updating:** Export your current JSON save from Settings. The service worker update is non-forcing; reopen the app or accept the update prompt when offered. Run `node --test tests-core.cjs` on Node 22+ to verify all core and narrative regression tests.

---

# Lantern & Key v3.2.1 — Paid Work & Optional Adventure Reliability

This corrective update audits Act II's optional quests and keeps the Watchroad story, existing characters, lantern powers, companion trust, weapon shops, and four waylight resolutions intact.

**Paid jobs now require a challenge.** At Waycross, repair the damaged wagon with an Investigation check or fight its saboteurs. In North Moor, deliver Isolde's supplies with a Survival check or defeat the raiders, spending a ration. At Saltmere, accept a parcel, then secure its shipping route with a Survival check or confront the thieves; the 14 gp fee is only paid after an actual journey to Waycross or North Moor. Failed checks pay **zero** gold and leave a combat alternative available. Rewards can only be claimed once.

**Optional sites:** All five expedition locations were reviewed. Failed skill checks no longer award the site's full gold and emberglass. A successful skill check or fight earns the reward. A companion's assistance or a lantern spark can make a *skill check* easier, but cannot automatically win money; an unsuccessful lantern attempt still consumes the spark. One-time approaches disappear after being attempted, but an unresolved encounter remains open to combat or withdrawal.

**Companion money:** Corvin's 8 gp repayment and the lucrative 18 gp offers tied to exploiting a companion now require an actual Persuasion check. A failed deal never pays. Trust consequences still apply.

**Save reliability:** The save validator now recognizes the five optional dungeon stages. Valid saves from inside those locations can be reloaded or imported rather than rejected as an unknown story stage. Existing Act II saves remain supported. Any old Saltmere parcel that was already accepted but not delivered must be secured using the new route options before receiving payment; this deliberately removes the previous free-money shortcut.

**To update GitHub Pages:** Replace `game.js`, `logic.js`, `tests-world.cjs`, `sw.js`, and `README.md` in the repository root. You may also replace `RELEASE-v3.2.md` to keep the changelog updated. No new directories, artwork, or workflow changes are required. Export a JSON backup first.

**Testing:** Run `node --test tests-core.cjs` (Node.js 22+) and `node --check game.js && node --check logic.js && node --check sw.js`. The workflow already runs these checks before deploying.

---

# Lantern & Key v3.2 — Roads Worth Traveling

**New in v3.2:** The four regional beacons now offer repeatable repair logic—spend a lantern spark, reuse the silver wolf-key, entrust the work to local keepers, or claim private control. Each choice records distinct costs and stewardship.

**Also in v3.2:** Five optional dungeon and wilderness sites with additional fights and alternate resolutions; dedicated weapon and equipment shops in three settlements; usable flashpowder and bandages; Last Lantern recharge shrines and combat flare; branching companion conversations with trust and one-use skill support; quest and ending acknowledgment for completed detours. Details and upgrade instructions: `RELEASE-v3.2.md`.

---

# Lantern & Key v3.1 — The Shattered Watchroad: Expanded Campaign

A mobile-friendly, offline-capable **16-chapter, single-player, browser-based D&D learning adventure**. Chapters 1–8 form the introductory tutorial; Chapters 9–16 form the larger Watchroad campaign. No paid services or AI API keys are required. This is an educational adaptation of selected SRD 5.2.1 (2024) principles, **not** a complete tabletop D&D rules engine.

## v3.1: Substantial expansion of the Watchroad campaign

The original eight tutorial chapters and existing save format are preserved. The expanded second act includes:

- **Seven new major encounters** in the story flow. Each has investigation, negotiation/payment or Lantern approaches, plus a possible combat resolution. Failed checks advance the plot but impose a cost rather than producing an impossible state.
- **Nine optional combat encounters in Act II** in total, across the earlier two fights and seven newly added obstacles. Combat retains prominent HP, separately paused action results, and Continue buttons.
- **Three companion personal quests** with relationship-sensitive decisions, plus additional campfire and chapter conversations. Allies can contribute to skill checks and fights, change loyalty, or refuse to support an exploitative approach.
- **Milestone advancement to levels 3 and 4.** Fighter gains a simplified Champion critical mechanic and level-4 preset Strength improvement; Rogue gains Sneak Attack 2d6, a tutorial Thief distraction, and preset Dexterity improvement; Wizard gains second-level spell slots, Shatter, and preset Intelligence improvement. These are limited, labeled instructional implementations; see `RULES-AUDIT.md`.
- **More substantial economy:** wages, ration and travel costs, short/long rests, foraging, potions, armor, spell focus, boots, bought information, social investments, and earned delivery payments. The shipping reward arrives when goods actually reach their destination.
- **A blue-line regional map** with revisitable waypoints and a quest ledger. Moving between known waypoints costs time and resources. Party swaps are restricted to safe, inhabited locations.
- **Stronger endings:** earlier public or private waylight claims are honored. A character who changes course may need compensation, a mandate, or a charter; the conclusion updates ownership state rather than contradicting previous choices.
- **Eight new locally bundled, original SVG scenes** in the existing `assets/` folder: `campfire.svg`, `waycross.svg`, `moor.svg`, `fen.svg`, `harbor.svg`, `archive2.svg`, `citadel.svg`, and `worldheart.svg`.
- **The Last Lantern remains relevant.** Keeping it unlocks special solutions and uses its limited sparks. A previous *Dangerous Souvenir* save, including one that incorrectly recorded `lantern: 0`, is still migrated so the item appears in your Pack.
- **Story fixes:** failure text respects actual discovered clues, a solo defeat does not invent a rescuer, and the finale reconciles previously claimed lights. Result screens, persistent bottom tabs and isolated chapter replay are retained.

### Playing and saving

The game saves automatically in your browser. You can export and import JSON from **Settings**. Export a backup before updating or removing an installed app. The v3.1 package is designed to migrate valid v3.0 and older tutorial saves without resetting the character or lantern decisions. Existing story branches remain selectable only when appropriate.

### Install the update on GitHub Pages

Use `lantern-and-key-v3.1-update.zip` if you're updating your existing v3.0 repository. At your repository root, **replace**:

- `game.js`
- `logic.js`
- `tests-world.cjs`
- `sw.js`
- `README.md`
- `RULES-AUDIT.md`

In the existing `assets` folder, **add** the eight SVG illustrations named above. You do not need to create a new directory. Existing `index.html`, `style.css`, `manifest.webmanifest`, `tests-core.cjs`, the existing artwork, and `.github/workflows/deploy.yml` remain unchanged.

Alternatively, `lantern-and-key-v3.1-complete.zip` contains the full site and workflow. Upload the extracted contents, including the hidden `.github` directory. GitHub Pages **Source → GitHub Actions** remains the correct setting. Commits to `main` run the tests and deploy if they pass.

**Important:** All six changed root files and the eight new SVGs must be deployed together. Otherwise, a browser may cache an older version or show missing artwork. Your existing service worker will offer the updated version without forcibly reloading an active game.

### Test locally

With Node 22+:

```bash
node --check game.js
node --check logic.js
node --check sw.js
node --test tests-core.cjs
```

`tests-core.cjs` loads `tests-world.cjs`. The v3.1 release passed **125 automated tests** covering existing mechanics and new campaign gates, rest and resource management, companions, quests, encounter combat, save normalization, class advancement and endings. Additional Chromium walkthroughs passed on 320 px, 390 px and 1024 px viewports for the public-route finale and a separate private-route finale, including resuming paused combat after reload. This is extensive targeted coverage, not a formal proof of every state combination. An installed Android PWA and service-worker update have **not** been tested on a physical phone in this environment.

### Technical outline

- `index.html` — HTML shell, scripts and PWA manifest
- `game.js` — story, UI, game-state transitions, companion and combat encounters
- `logic.js` — shared mechanics and safe save-file validation
- `style.css` — mobile and desktop styling, persistent navigation
- `sw.js` — offline asset caching and safe updates
- `assets/` — bundled artwork and app icons
- `tests-core.cjs`, `tests-world.cjs` — automated regression tests
- `.github/workflows/deploy.yml` — tests then publishes to GitHub Pages

### Rules and attribution

Based in part on the [System Reference Document 5.2.1](https://www.dndbeyond.com/srd) from Wizards of the Coast, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Original lore, Last Lantern magic, companion abilities and some simplified encounter mechanics are homebrew. This project is independent and not endorsed by Wizards of the Coast. See `RULES-AUDIT.md` for known omissions and instructional simplifications.
