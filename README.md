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
