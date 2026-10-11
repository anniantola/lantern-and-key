## v3.2.1 — Paid Work & Optional Quest fixes

Caravan, moor, and cargo help now require a skill check or a won encounter before payout; cargo also requires physical delivery. Expedition rewards are withheld on failed skill checks, including companion and lantern-assisted approaches. Companion monetary dealings now require checks. Optional-site stages are included in save validation. One-time rewards cannot be farmed by retries.

---

# Lantern & Key v3.2 — Roads Worth Traveling

This release deepens Act II with activities that connect narrative choices to exploration, combat, equipment, lantern magic, and companion relationships.

## Spoiler-light overview

- **Five optional adventures** at Waycross, North Moor, Glassfen, Saltmere, and the Citadel. Each has a distinct multi-paragraph scene and offers a skill-based path, an encounter, a lantern solution, and sometimes help from a relevant active companion.
- **Five additional optional fights**, with enemy HP, separate results and Continue controls. Combat wins provide site rewards and mark the location completed, while retreating preserves the option to return later.
- **Shops** in Waycross, Saltmere and the Citadel, now entered as dedicated story scenes. Purchase a balanced weapon, defensive ward buckle, flashpowder, bandages, and emberglass, as well as existing potions and provisions. Weapon and defensive upgrades affect Act II combat calculations, not just inventory labels.
- **Last Lantern recharging** at established shrines, with emberglass found on expeditions or purchased from merchants. There is also a one-time free attunement at each repaired side site. The lantern's flare can be used in Act II combat. Sparks are spent; the physical lantern is never consumed.
- **Companion conversations** branch into listening, joint planning, and commanding. Listening deepens trust; planning grants one-use aid to a relevant skill check; pressuring an ally damages trust and can drive them away. Active companions may also intervene in site challenges or in combat.
- **Continuity:** Completed side adventures are acknowledged when returning to the region and in the ending. Gold, equipment, supplies, conversation outcomes, trust, new quest flags and lantern fuel persist through saves and chapter replay.

The main 16-chapter route remains available, and the new sites are optional. The expanded choices do not force fighting: there are multiple approaches to each encounter. Existing saves from the previous campaign retain their original choices and items, including the Dangerous Souvenir lantern.

## The four regional waylights: a consistent choice framework

Each waylight in Chapters 10–13 now follows the same principles as the original vault. After clearing the local obstacle, choose how the mechanism is resolved:

- **Last Lantern spark:** Spend one spark to rekindle the old shared conductor, if you carry the lantern. The item stays in your Pack. An empty lantern cannot offer this choice until recharged at a shrine or rest.
- **Silver wolf-key:** If you earned the key in Chapter 1, reuse its maker's socket to repair the mechanism mechanically. The key is not consumed.
- **Delegate:** Work for one full day with the named local people who agree to maintain the beacon. It becomes **independently stewarded**, costs time and optionally a ration, and gives no personal bounty. Available without the lantern or key.
- **Private claim:** Accept exclusive guild control for gold and influence, with social and companion consequences. This keeps the morally self-interested path intact.

These are not four cosmetic labels: each records an individual method, resources and time are updated, the Map reports stewardship, and later scene descriptions acknowledge the method. Existing saves with earlier restored, claimed or independent beacons retain their decisions; they are never rerolled or charged retroactively.

## Updating GitHub Pages

Use the update ZIP. At the repository root replace `game.js`, `sw.js`, `tests-world.cjs`, `README.md`, and `RULES-AUDIT.md`, and add this `RELEASE-v3.2.md` file if you want a readable changelog. **No new asset folders or artwork** are needed. Leave `.github/workflows/deploy.yml` unchanged.

Before updating, export your JSON save from Settings. Your existing GitHub Actions workflow runs the test suite automatically and deploys if it passes.

## Test results and limits

Automated suite: `node --test tests-core.cjs` (the core suite includes `tests-world.cjs`). Script syntax: `node --check game.js`, `node --check logic.js`, `node --check sw.js`. Browser interaction walkthroughs at 320 px, 390 px and 1024 px use the real game scripts, an in-memory save and a stubbed storage origin, because navigation to a local HTTP server was blocked by the browser environment.

As with prior versions, these are targeted tests, not exhaustive verification of every choice permutation. The installed Android PWA and physical offline transitions have not been tested on an actual device.

