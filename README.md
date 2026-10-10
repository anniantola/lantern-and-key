# Lantern & Key — Complete learning campaign (v2.4)

**A playable, offline-capable, single-player fantasy adventure for first-time tabletop D&D players.** Designed to work on Android, desktop, and other modern browsers via GitHub Pages. This version expands the previous three-chapter demonstration to **eight connected chapters** with authentic beginner-friendly 2024 / SRD 5.2.1 rules instruction.

## v2.4 — The Last Lantern matters (no story spoilers)

**The most important compatibility fix:** If an older save records the **Dangerous Souvenir** / `ending: "take"` decision, the game guarantees **The Last Lantern ×1** appears in the Pack — even when an older `inventory.lantern` field explicitly says `0`. This applies to local saves, imported JSON backups, and isolated replay saves. Very early saves with only the Dangerous Souvenir journal entry are also recovered. The update will not take away the lantern after you have kept it, and does not overwrite your campaign choices.

**New choices without spoilers:** The lantern now influences multiple later chapters, including encounters, resource use and a consequential late-campaign decision. It has **three sparks** to begin with; you choose when (and whether) to spend them. A full Long Rest restores one spark, up to three. Opportunities to learn about the item may also restore one. **The item itself is never consumed**, even if you spend all its sparks.

Its abilities are clearly labeled as an **original homebrew quest artifact**; they are not official SRD spells or class features. Players who restored or returned the lantern still have fully playable story routes and meaningful decisions. Old saves that already reached the campaign ending can access the new artifact continuation without restarting their character or losing earlier progress.

**Update your existing GitHub Pages repository:** Replace the seven existing **root-level** files `game.js`, `logic.js`, `style.css`, `sw.js`, `tests-core.cjs`, `README.md` and `RULES-AUDIT.md`. No new folders, images, icons, or workflow changes. Leave `.github/workflows/deploy.yml` as-is. Export a JSON save backup before updating; your existing saves use the same storage key and JSON schema.

**Testing:** The automated suite now covers keeping and migrating the lantern, including old saves containing `lantern: 0`, importing those saves, spent resources, decision branches, and preserving the item throughout the campaign. Run `node --test tests-core.cjs` with Node 22+.

---

## v2.3 — Stability, rules & learning update

**Before upgrading:** use **Settings → Export save as JSON**. This version preserves the `lantern-and-key.save.v1` schema and v2.2 progress. Older imported saves are validated more strictly; malformed files are rejected instead of rendering potentially unsafe data.

### Changes

- **Safer importing:** bounded, sanitized save objects, validation of dice and combat state, a pre-import backup, and a recovery screen if local saved data becomes invalid. Never import JSON backups from unknown sources.
- **Protected chapter replay:** Chapters → Replay creates a separate replay save without touching the original campaign. Return with **Chapters → Return to main campaign**. The main and replay timelines have separate storage slots.
- **Corrected tactical movement:** chooses a traversable least-cost path across 5-ft squares, accounts for difficult terrain along the route and reactions along the path, supports diagonal adjacency, and displays the chosen route in results. The map still uses simplified tutorial targeting and cover.
- **Ranged attacks:** apply disadvantage when an eligible hostile creature is within 5 ft; advantage and disadvantage cancel. Fighter Action Surge cannot be spent to cast a Magic action. Dodge allows moving afterward on the bridge.
- **Practice combat:** your action and the sentry response have separate Continue screens; the simulated turn has Action / Bonus Action distinctions and level-2 Action Surge remains part of the same turn.
- **Resting:** each Short Rest offers repeated Hit Die rolls, decided one at a time. Features that recharge during the rest are still tracked.
- **Learning journal:** each discovered lesson offers a two-answer knowledge check. A separate "mastered" marker distinguishes practice from merely finding a lesson.
- **Chapter 8:** new Beacon Test encounter after reaching level 2, with Fighter Action Surge, Rogue Cunning Action, Wizard magic and a nonviolent skill-based solution. It does not replace the existing ending.
- **Offline reliability:** web pages, JS and CSS check the network first and fall back to cached copies while offline. A new service-worker version never forces a reload; the game presents its existing update prompt.
- **Phone readability:** slightly larger bottom-tab labels. External Google Fonts removed so the app uses the same system-font fallbacks online and offline.
- **Build safety:** a dependency-free `node --test` suite runs in GitHub Actions before GitHub Pages deployment. The game's rules, routing, and import validator are partly separated into `logic.js` for independent testing.

### Update an existing GitHub Pages repository from v2.2

At the **repository root**, replace `game.js`, `style.css`, `sw.js`, `index.html`, `README.md`, and `RULES-AUDIT.md`. Upload **two new root-level files**, `logic.js` and `tests-core.cjs`. In your existing `.github/workflows` folder replace **`deploy.yml`**. Commit to `main`; **Settings → Pages → Source** stays **GitHub Actions**. **No new asset folders or illustrations** are required.

**Important:** `logic.js` must be uploaded together with the modified `index.html` and `game.js`; the new version will not start without it. The `tests-core.cjs` file is also needed for the updated deployment workflow to pass. If you prefer a clean replacement, use the *complete* package; it includes all preexisting assets and GitHub Actions files.

For local test runs with Node 22+: `node --test tests-core.cjs` and `node --check game.js`.

**Limitations:** This remains a guided 8-chapter educational simulator, not a full virtual tabletop or AI Dungeon Master. The bridge has a small tutorial map and simplified enemy tactics. Automated coverage exercises the shared rules and import safety, with additional manual browser walkthroughs, but does not exhaustively verify all possible story/state combinations or every device's PWA caching.

---

## v2.3.2 — Lantern inventory correction

When you choose **Keep the mysterious lantern** in Chapter 3, **The Last Lantern** now appears as a unique, nonconsumable quest item in the **Pack** tab. The story in Chapters 4 and 8 acknowledges carrying it. Saves created with v2.3.1 or earlier that already record `ending: "take"` are corrected on load, without restarting or importing again. In v2.4, this story artifact also has optional homebrew abilities with limited resources.

**Update existing GitHub Pages installations:** Replace the root-level `game.js`, `tests-core.cjs`, `sw.js`, and `README.md`. The existing deployment workflow, artwork, and other source files can stay unchanged. Export a save backup before any update as usual.

## What's new in v2.0 (included in v2.3)

| Chapter | Setting | Core lesson |
| --- | --- | --- |
| 1. The Forgotten Tavern | A mysterious traveler and a cellar | Character introductions, skills, conversations and decisions |
| 2. Beneath the Floorboards | A trapped corridor | Investigation, difficulty classes, Dexterity saves |
| 3. The Chamber of Echoes | A lantern and a guardian | Initiative, HP, AC, attacks, magic, combat and diplomacy |
| 4. A Night in Blackwood | A forest camp | Short and Long Rests, Hit Dice, healing, interrupted rests, supplies |
| 5. The Broken Crossing | A guarded bridge | Tactical 5-ft grid, movement, distance, Dash, Dodge, Disengage, cover, difficult terrain, opportunity attacks, ranged and melee attacks |
| 6. Secrets of Briar Hollow | A village dispute | Insight, persuasion, truthfulness, clues, NPC trust and social consequences |
| 7. The Arcane Trial | An enchanted school | Spell attacks vs. enemy saving throws, slots, cantrips, concentration and effects |
| 8. Becoming an Adventurer | A mountain beacon | Level-2 advancement, class features, reflection and further practice |

Each story choice and combat action pauses on a **readable result card** with a **Continue** button. Your character's wounds, items, spells, discoveries and decisions carry between chapters. You can cross the bridge by negotiation, clever item use or tactical battle.

### Extra tools

- **Chapter checkpoints:** Replay any chapter for which your save has a recorded entry checkpoint. Replay rewinds the story from that point; export your current save first to preserve that timeline. Previously completed chapters without historical checkpoints may not be replayable from a legacy imported save.
- **Learning journal:** Check off concepts encountered, revisit explanations, see progress through the curriculum.
- **Interactive inventory:** Drink a healing potion, consume rations, toggle a torch, swap weapon, use a smoke pellet where appropriate, and inspect quest items.
- **Class differences:** The preset Fighter, Rogue, and Wizard builds have unique abilities and resources. At level 2, try **Action Surge/Tactical Mind**, **Cunning Action**, or **Scholar Expertise** respectively. Use the Practice arena after advancing to test new mechanics.
- **Practice arena:** Repeat skill checks, dummy combat, and spell/saving throw demonstrations **without consuming campaign resources or changing your story**.
- **Guided and Tabletop modes:** Guided reveals target DCs and tutorial reminders in advance. Tabletop hides some hints/target numbers until after the action, but keeps prewritten choices and a fully explained result. **Neither mode is an open-ended AI Dungeon Master.**
- **Character sheet:** Current HP, max HP, hit dice, skills, spells, class feature uses, and the level-2 specialization.
- **Save and install:** Auto-save in local browser storage; export/import JSON under Settings. Settings also has the optional Android PWA installation helper.

**Phone navigation (v2.2):** All eight adventure tools are permanently visible in a two-row bottom navigation bar: Story, Character, Pack, Lessons, Chapters, Practice, Journal and Rules. On desktop the same tools appear below the header. Each opens directly; **Story** returns to the game. The large **⚙ Settings** button stays in the top-right and contains only install guidance, teaching mode, save export/import and reset. The dialog also has a clear **← Story** control. The bottom bar respects phone safe areas and does not cover story actions.

## Update from v2.1 to v2.2 (persistent tab bar)

Replace these root-level files: `game.js`, `style.css`, and `sw.js`. **No new folders or artwork.** On phones the eight-button bottom bar stays available while viewing Story, Character, Pack, Lessons, Chapters, Practice, Journal and Rules. You can switch straight from one to another. The selected tab is highlighted, Settings stays in the header, and returning to Story does not intentionally scroll you to the top. The tab's content scrolls in the area between the header and bottom bar, so no controls should be hidden. Existing saves are unaffected.

## Update from v2.0 to v2.1 (navigation only)

Replace these four root-level files in your existing GitHub repository: `game.js`, `style.css`, `sw.js`, `README.md`. No assets or folder changes. Your GitHub Actions workflow deploys automatically. The save key and format remain unchanged, so your progress is preserved; exporting a JSON backup first is still recommended. The complete v2.1 package includes all files for a fresh installation.

## Upgrade from v1.3 (GitHub website, no folder upload required)

If upgrading directly from v1.3, use **`lantern-and-key-v2.2-complete.zip`** so the new chapters and artwork are included:

1. Download and extract the update ZIP.
2. In the repository root, replace **`game.js`**, **`style.css`**, **`sw.js`** and **`README.md`**. Upload the optional reference file **`RULES-AUDIT.md`** to the root.
3. In your already-existing **`assets`** folder upload the **five new SVGs**: `forest.svg`, `crossing.svg`, `village.svg`, `arcane.svg`, `summit.svg`.
4. Commit to `main`. The existing **GitHub Actions** workflow deploys automatically. You do not need to change `.github`, `index.html`, or `manifest.webmanifest`.
5. Open the site. When the game notices an update, use its **Update when ready** button. If the game still looks old, close and reopen it, and check that all new assets were uploaded.

The **complete ZIP** is suitable for a fresh repository or a full replacement. It includes the same GitHub Actions workflow, all original and added assets, manifest, and app icons. The archive has no parent folder, so upload its contents to the repository root.

**Important:** Before a major update, make a safety copy using **Settings → Export save as JSON**. v2.0 intentionally keeps the existing `lantern-and-key.save.v1` local-storage key and `version: 1` JSON data format so older saves remain loadable. The *game* is v2.3; the **save schema** stays v1 for compatibility.

## GitHub Pages configuration — GitHub Actions

1. Open your repo, e.g. `https://github.com/anniantola/lantern-and-key`.
2. Select **Settings → Pages → Build and deployment → Source: GitHub Actions**. Do **not** choose Deploy from a branch.
3. Commit files to `main`; check **Actions → Deploy GitHub Pages** for deployment.
4. Visit `https://anniantola.github.io/lantern-and-key/` using HTTPS.

The archive includes `.github/workflows/deploy.yml`; leave it where it is.

## Technical notes

- Vanilla HTML, CSS, SVG and JavaScript; no frontend framework, backend, subscriptions or AI API keys.
- The service worker caches local app assets, including the five new scene illustrations. New versions do not force-reload the page while you play; updates prompt you to reload.
- Local auto-save and JSON import/export support mobile-to-desktop transfer.
- Opening `index.html` directly as a `file://` URL may lack PWA/offline functionality. Use GitHub Pages or a local HTTP server: `python3 -m http.server 8000`.
- Mobile home-screen installation and reinstall behavior is controlled by the browser/OS. Export a save before clearing storage or uninstalling.

## Scope and rules accuracy

This is an **introductory teaching simulator**, not a complete tabletop game engine. It uses an original setting, predefined choices and three **curated starter builds**, not full character creation, ancestry, backgrounds, feats, all spells or subclasses. Chapter-3 combat is an abstract encounter; Chapter-5 combat has a limited tactical grid. Battle outcomes, single-use items and certain NPC attitudes use deliberate encounter-specific rulings. Characters do not use death-saving throws at 0 HP; they can return to a chapter checkpoint. The smoke pellet is explicitly a custom training item, **not** an SRD item.

See [RULES-AUDIT.md](RULES-AUDIT.md) for the audited rule-by-rule choices, fixes and simplifications. Mechanically this version follows the **2024-era SRD 5.2.1**, **not** older 2014 rules. Always defer to your tabletop DM and the published rules for actual sessions.

### License and attribution

Game mechanics adapted from the **System Reference Document 5.2.1**, © Wizards of the Coast LLC, available under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. Sources: https://www.dndbeyond.com/srd and https://creativecommons.org/licenses/by/4.0/ . Original adventure, design and illustrations are an independent fan/educational work. **Not an official Dungeons & Dragons product; not affiliated with or endorsed by Wizards of the Coast.** Rules are summarized and simplified, not copied wholesale.


## v2.3.1 corrective release

- Rejects Warden, bridge, and beacon saves whose required encounter objects are missing or whose paused result cannot be continued. Imports fail safely before replacing any progress.
- Importing while replaying now backs up the **main** campaign slot rather than the temporary replay, so Restore pre-import restores the correct timeline.
- Normal Dash and Cunning Action: Dash now each add the character's 30-foot Speed instead of resetting the movement allowance; both together provide 90 feet (18 grid units) on this tutorial map.
- Second Wind's die notation shows the current Fighter level; the beacon enemy's attack math shows disadvantage dice only when rolled.
- Adds regression tests for encounter saves, stacked Dash movement, and importing during chapter replay.
- Existing save schema, fixed bottom tabs, app installation, and GitHub Actions workflow remain unchanged.
