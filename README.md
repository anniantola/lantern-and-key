# Lantern & Key — a beginner tabletop-RPG tutorial

A complete, **single-player, mobile-friendly HTTPS website** that teaches core D&D-compatible mechanics through an original branching fantasy adventure. Version 1.2.

## Deploy to GitHub Pages — via GitHub Actions

This uses the **same GitHub Actions workflow as your other website projects**. Do **not** choose “Deploy from a branch.” There is no build step or external server.

1. Create a GitHub repository (or open the existing game's repository) with default branch `main`.
2. Upload the **contents** of this folder to the **repository root**, including the hidden file `.github/workflows/deploy.yml`. The repository root should contain `index.html`, `game.js`, `style.css`, `assets/`, and `.github/workflows/deploy.yml`. Do **not** upload the outer `lantern-and-key` directory as one nested folder.
3. Go to **Settings → Pages → Build and deployment** and select **Source → GitHub Actions** (not “Deploy from a branch”).
4. Commit to `main`. In the **Actions** tab, the **Deploy GitHub Pages** workflow should run automatically. Wait for the green check mark.
5. Open `https://YOUR-USERNAME.github.io/REPO-NAME/` on your phone or computer. After the first successful online visit, supported browsers can cache the game for offline use.

For later updates, just commit changed files to `main`; the same workflow redeploys automatically. You can also manually trigger it using **Actions → Deploy GitHub Pages → Run workflow**.

**If uploading through GitHub's website:** Check that `.github/workflows/deploy.yml` actually appears in the repository after upload. Hidden folders are easy to omit. If necessary, create the file using **Add file → Create new file** and type `.github/workflows/deploy.yml` as its name, then paste the workflow from the package.

To test locally, run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Gameplay

- Choose a Fighter, Rogue or Wizard starter character; rename the character if desired.
- Explore a branching story: talk to people, examine clues, find alternate routes, and decide whether to negotiate or fight.
- Roll actual random d20s for checks and saving throws; see DCs, proficiency, advantage/disadvantage and outcomes.
- Learn turn order, AC, attack rolls, critical hits, HP, optional Bonus Actions, spell slots, Dodge and Disengage in a mini combat encounter.
- View the character sheet, beginner rules reference and adventure journal.
- Save automatically in browser storage. Export/import a JSON save in Settings. No network account, tokens or backend required.

## Deliberate v1 limitations

This is a **guided, curated teaching adventure**, not an AI Dungeon Master, multiplayer service, complete character builder, general tabletop VTT, or official D&D product. The simplified teaching characters do **not** implement every feature or equipment choice in the tabletop rules (e.g., death saves, all skill checks, full spellcasting rules, movement on a tactical grid, rests, experience points, and inventory weight). The adventure makes several DM-like rulings appropriate to its scenes. After a character reaches 0 HP it offers an explicit reset rather than applying death-saving rules. Designed for solo discovery before trying a human-led tabletop session.

## Install on phone / desktop

Open **Settings (⚙) → Install / find installed app**. If the browser makes a PWA installation prompt available, the button will offer **Install Lantern & Key**. Otherwise, the button provides device-specific installation instructions. If the browser reports that Lantern & Key is already installed, launch it from the Android app drawer or the device's Apps settings. There is no web API to force a second installation of the same PWA.

**Important: export a JSON save before uninstalling the app or clearing site data.** Installing, uninstalling and clearing app data are controlled by your browser/operating system, not by the game. This update includes PNG icons for more consistent install support on Android. Note that pressing the Settings install button cannot forcibly reinstall an app that Android already considers installed.

## Offline and update behavior

A service worker caches the complete local site after the first online HTTPS visit. An installed update waits and is offered via a notice; the app does **not** silently take control or forcibly reload while you are playing. Accepting an update saves state before reloading. Older cached assets may persist until you choose to update.

## License and attribution

The original story and application code are copyright 2026 and may be modified by the project owner. Some game mechanics are adapted from **System Reference Document 5.2.1** by Wizards of the Coast, licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**: https://www.dndbeyond.com/srd and https://creativecommons.org/licenses/by/4.0/. Rules text is substantially rewritten and simplified for educational purposes. Not affiliated with, sponsored by or endorsed by Wizards of the Coast. The name “Dungeons & Dragons” is used only descriptively in documentation.

No external gameplay libraries or APIs. Three local original SVG illustrations, SVG icon, webmanifest, stylesheet, one JS file. Optional Google Fonts download on first load; system fallbacks work offline.

## Version 1.2 — clearer combat feedback

Combat now pauses after **every resolved action**. A result card explains the action, dice rolls, damage/healing, and the before/after HP. Press **Continue** to advance to the opponent's response or your next action. Both combatants have prominent, labeled HP bars, visible on small screens. Existing version-1 saves and JSON exports remain compatible.
