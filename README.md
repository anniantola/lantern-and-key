# Lantern & Key — Complete learning campaign (v2.1)

**A playable, offline-capable, single-player fantasy adventure for first-time tabletop D&D players.** Designed to work on Android, desktop, and other modern browsers via GitHub Pages. This version expands the previous three-chapter demonstration to **eight connected chapters** with authentic beginner-friendly 2024 / SRD 5.2.1 rules instruction.

## What's new in v2.0 (included in v2.1)

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

**Phone navigation (v2.1):** All eight adventure tools are permanently visible in a two-row bottom navigation bar: Story, Character, Pack, Lessons, Chapters, Practice, Journal and Rules. On desktop the same tools appear below the header. Each opens directly; **Story** returns to the game. The large **⚙ Settings** button stays in the top-right and contains only install guidance, teaching mode, save export/import and reset. The dialog also has a clear **← Story** control. The bottom bar respects phone safe areas and does not cover story actions.

## Update from v2.0 to v2.1 (navigation only)

Replace these four root-level files in your existing GitHub repository: `game.js`, `style.css`, `sw.js`, `README.md`. No assets or folder changes. Your GitHub Actions workflow deploys automatically. The save key and format remain unchanged, so your progress is preserved; exporting a JSON backup first is still recommended. The complete v2.1 package includes all files for a fresh installation.

## Upgrade from v1.3 (GitHub website, no folder upload required)

Use **`lantern-and-key-v2.1-complete.zip`**, not the complete package, for the smallest update:

1. Download and extract the update ZIP.
2. In the repository root, replace **`game.js`**, **`style.css`**, **`sw.js`** and **`README.md`**. Upload the optional reference file **`RULES-AUDIT.md`** to the root.
3. In your already-existing **`assets`** folder upload the **five new SVGs**: `forest.svg`, `crossing.svg`, `village.svg`, `arcane.svg`, `summit.svg`.
4. Commit to `main`. The existing **GitHub Actions** workflow deploys automatically. You do not need to change `.github`, `index.html`, or `manifest.webmanifest`.
5. Open the site. When the game notices an update, use its **Update when ready** button. If the game still looks old, close and reopen it, and check that all new assets were uploaded.

The **complete ZIP** is suitable for a fresh repository or a full replacement. It includes the same GitHub Actions workflow, all original and added assets, manifest, and app icons. The archive has no parent folder, so upload its contents to the repository root.

**Important:** Before a major update, make a safety copy using **Settings → Export save as JSON**. v2.0 intentionally keeps the existing `lantern-and-key.save.v1` local-storage key and `version: 1` JSON data format so older saves remain loadable. The *game* is v2.0; the **save schema** stays v1 for compatibility.

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
