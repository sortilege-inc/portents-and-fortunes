# Portents & Fortunes × sortilege-vtt-l5r5e — plan and decision log

Merging the campaign site into an instance of the L5R5e VTT, so that the campaign material
(the character, the dramatis personae, the chronicle, the atlas, the GM's notes, encounters)
lives inside the VTT's framing, and homebrew extends the VTT the way a book does. This is the
first instance; `INSTANCE-PLAYBOOK.md` beside this file is the process it proves, written for
the next campaign.

Status words: **PROPOSED** (awaiting the owner), **(owner)** decided, **landed** built and
proven in the browser through the real controls.

Two repos take part:

- **here** — `sortilege-inc/portents-and-fortunes` (public, portents.sortilege.online). Becomes
  the instance.
- **upstream** — `sortilege-inc/sortilege-vtt-l5r5e` (private). Everything generic is built
  there and pulled here.

## Owner decisions (2026-09-23)

**O1 — Public (owner).** The instance stays public and publishes the VTT's `data/` — the 30
books verbatim, 11 MB — as the TEETH, Troika! and Invisible Sun VTTs already do. To be
revisited once it is working. The first push carrying `data/` is the point of publication and
cannot be taken back (M8).

**O2 — Fork (owner).** This repo gains `sortilege-vtt-l5r5e` as the `upstream` remote and
merges it once, at the root. Updates arrive by `git pull upstream main`. Upstream-owned files
are not edited here, so pulls stay clean.

**O3 — The VTT owns `/` and `/gm/` (owner).** The campaign material is integrated within the
VTT's framing rather than beside it. No redirects from the old paths: nothing links to them.

**O4 — One character sheet (owner).** The VTT's sheet becomes the single record for Norikage.
Portents' features it lacks are added; generic ones are built upstream.

**O5 — No auto-keep, anywhere (owner).** The player and the GM always pick their keeps. The
VTT's *Keep the best* is removed upstream.

**O6 — Homebrew is a campaign DSL layer (owner).** NPCs, the PC and house rules are written in
the Titterpig DSL under `campaign/dsl/` and built by the VTT's own build, through the same
two-way gate as the books.

**O7 — House rules (owner: "understood", read as accepting the recommendation; correct here if
not).** Every rule in the Behind the Veil §10 is a `MODIFY` shown beside the rule it changes.
Enforced by the tool: *off-approach distinctions* (one reroll die off-approach, two on) and the
*session boundary* (strife to half Composure, rounded up, with a per-character "carry the full
total" override). Prompted, never automatic: *Elemental Deficiency (Fire)* on Fire-stance
checks, applied or dismissed by the GM. Displayed only: *pick a door*, *the informal duel*,
*decisive rules information*, *work beneath station*. One default follows from *decisive rules
information*: an NPC's conditions and their rules text are visible to a player engaged with it.
Enforcement is built upstream as a generic ability — the sheet honours a number a `MODIFY`
changes — so a campaign supplies only the `MODIFY`.

**O8 — A loose arc in three panes (owner).** The GM's table opens on three panes: **Notes** —
the authored state document rendered, with a free-notes area below it for live jotting, saved
to the pack; **Scenes** — the campaign's arc, authored in the pack, loose and editable (add,
reorder, edit, mark played); **Threads · Encounters · NPCs** — open threads, an encounter
builder, and the cast. The split (owner): anything that must pass the gate is DSL; the arc,
the threads and the notes are pack state.

**O9 — The process is written here first (owner).** `INSTANCE-PLAYBOOK.md` records it as it is
proven; once the instance works, the generalizable parts are encoded upstream (M9).

## Layout after the merge

```
index.html  gm/  engine/  system/  data/  build/  worker/  assets/     UPSTREAM-OWNED
                                                                       (never edited here)
engine/config.js  worker/wrangler.jsonc  README.md  CNAME
.claude/launch.json                                                    INSTANCE-OWNED root files
                                                                       (resolved "ours" on pull)
campaign/                                                              INSTANCE-OWNED
  PLAN.md  INSTANCE-PLAYBOOK.md       this plan; the process
  dsl/                                the homebrew layer (NPCs, the PC, house rules) → data/campaign.js
  pack/                               campaign.json + snapshots/ (the arc, threads, notes, party)
  docs/                               authored prose: the state document, the chronicle, the atlas
  site/                               what the campaign registers into the VTT (tabs, panels, css)
  assets/                             portraits, the region maps, the art
  source/                             records kept verbatim (Norikage's Portents JSON)
.claude/skills/rokugan-voice/         instance-owned, unchanged
```

## Milestones

| # | Where | Milestone | Proof required |
|---|---|---|---|
| M0 | here | This plan and `INSTANCE-PLAYBOOK.md` | **landed 2026-09-23** — approved by the owner; `71f030b` on `main` |
| M1 | here | **The fork.** `upstream` remote; merge at the root with unrelated histories; every Portents file moved under `campaign/` unchanged (still served, at `/campaign/…`); the instance-owned root files; `.gitattributes` `merge=ours` on them and the one-time `git config merge.ours.driver true`; `engine/config.js` (title, storage prefix, Worker 8794); launch entries | Both histories in `git log`; a second `git pull upstream main` merges clean; browser on 8733: the site and the GM table as upstream proved them, 0 console errors; every moved Portents page renders with its assets. **landed 2026-09-23** on branch `vtt-instance`, pushed by the owner (the publication point, O1; `main` and the live site untouched). Git and disk: `b78cbee` the move — 74 files, every one `R100`, 0 insertions / 0 deletions; `ec001f2` the merge of `upstream/main` `63489c8` — two root commits in `git log`, the only collision after the move `.gitignore`; `fc818b7` the boundary. Proven in a throwaway clone with a fake upstream commit touching `engine/config.js` and `index.html`: **without** the driver the merge conflicts on `config.js`; **with** it the title stays *Portents & Fortunes* and `index.html` takes upstream's edit. A real `git pull upstream main`: *Already up to date*. Every `href`/`src` in both sites and every asset path in the campaign's scripts resolved on disk: 260 checked, 0 missing. **Browser on 8733**, through the real controls, errors captured per page: `/` is the VTT — *30 books, generated from their corpus: 4,666 entries out of 238 files*, `VttConfig` reads *Portents & Fortunes* / `portents-vtt`, all ten site tabs open with their content, 0 errors; `/gm/` brands *Portents & Fortunes*, all eight panels open, the Adventure picker offers the 16 arcs, storage under `portents-vtt:`, 0 errors; `gm/vtt.html` titled *Portents & Fortunes — Table* with the Rokugan map offered, 0 errors; `gm/play.html` *Join the table*, 0 errors. Under `/campaign/`: the home on its parchment; the Chronicle's six sessions and its rail; Dramatis Personae drawing 18 of 18; the sheet at *Earned 11* with its three versions; the Dragon map at 2200 px with its five pins; the Atlas's seven entries; Lore, the characters, the dossier; the veil's two strata and its rail — 0 broken images anywhere. The server log's only 404s are the browser's `/favicon.ico` probe and three old root asset paths requested by the **cached** old home before a forced reload |
| M2 | upstream | **The campaign layer and the extension hook.** `build.sh` takes a campaign DSL root and writes `data/campaign.js` through the same gate; an instance registers site tabs and GM panels from `campaign/site/` without editing an upstream file | A one-file test layer builds and gates both ways; a registered test tab and panel appear; upstream's own gate still 0 / 0 / 0. **landed 2026-09-23** upstream on branch `instance-hooks`, `5f2a9ce`, pushed; the full proof is upstream's `PLAN.md` § *Instances*, milestone I1. In short: the fixture layer passes three gates (two-way strings, ids, references), each made to fail; in the browser a temporary instance's tab, panel, shelf entry and NPC appeared where a campaign's will, the NPC's book loading only when opened; with no instance declared every page is as before; upstream's gate unchanged and `data/` byte-identical after a rebuild. Not yet in this repo: it arrives when `instance-hooks` is merged upstream and pulled here |
| M3 | here | **The homebrew in DSL.** The 18 NPCs (each a full statblock on the corpus's NPC chassis — decision 16), Norikage as an actor, the seven house rules as `MODIFY`s; presentation metadata (reveal, portrait, `statNote`) as a campaign file keyed by entity id | Gate green; Cast lists the 18 beside the corpus's 389; Kaito Juri's statblock matches `npcs.js` field by field; each `MODIFY` shows beside its target. **landed 2026-09-23.** `campaign/dsl/` (three files) built by `bash build/build_layer.sh campaign/dsl campaign "Portents & Fortunes" campaign/data`: *19 entities; strings 403 (1074 occurrences) — 0 / 0 / 0; ids 19, none the corpus's; every id resolves; 12 references by name, every one an entity* (one note: *Brushwork* names two, resolved to the core Passion). **Method proven on one before scaling:** Kaito Juri alone, read back from the built data, *27 fields and 4 abilities match*; a planted Honor 47 → 46 made the check fail (exit 1). Then all 18: `campaign/source/check_npcs.py` → *18 of 18*, 27 fields each plus every ability. In the browser on 8733: the shelf opens on *This campaign → Portents & Fortunes · 3 chapters · 19 entries*; the site's NPCs and the GM's Cast count **407** with the campaign's 18 first (row 19 *Loyal Bushi · Core Rulebook*); Kaito Juri's page draws her rings as the corpus's NPCs are drawn (*AIR 1 · EARTH 3 · FIRE 2 · WATER 1 · VOID 3*), *Way of the Void* verbatim, and *One within the Void* — referenced by name — opens the corpus's own inversion; each of the 8 targets carries its house rule, and *Portentous Birth*, opened through the site's search, shows its corpus text then **HOUSE RULE** *Off-approach distinctions…*; Norikage is listed among the characters and his sheet draws *1 AIR · 3 EARTH · 2 FIRE · 2 WATER · 3 VOID*, Honor 52, Composure 10, his techniques and traits. 0 console errors |
| M4 | upstream | **The sheet and the dice.** *Keep the best* removed (O5); version history (archive first, read-only view, a picker); an XP ledger; the Portents sheet features the VTT lacks, **audited feature by feature before porting**; the sheet honours a `MODIFY`'d number; a disadvantage prompt on matching checks; *End scene* / *End session* strife recovery with a per-character carry; an engaged NPC's conditions visible to the player | Each through the real controls; 0 console errors |
| H1 | corpus → upstream → here | **Hash the unhashed** (owner, 2026-09-23). The 0.5 corpus leaves **2,088 of the 4,666** entities the VTT builds without a `#hash` — 1,721 in `.ttrpg`, 158 `.codex`, 132 `.actor`, 77 `.arc`; among them 95 schools, 331 NPCs, 237 advantages and disadvantages (*Portentous Birth*, *Elemental Deficiency (Fire)*) — so the VTT gives them build ids (`u:…`) and a layer can reach them only by name. In the corpus (`titterpig-dsl-l5r5e/0.5`, the source of truth): one opaque hash minted per unhashed DEF in the corpus's existing form (22 random alphanumerics), by an idempotent script that writes the assignments to a file; every by-name reference to a newly hashed entity given the §5d long form; a VERSION patch bump per touched file. Upstream: rebuild; any stored state keyed by a `u:` id (packs, table, player storage) found and carried over. Here: the layer's 12 name references rewritten as hashes | Piloted on one file first: its diff is **only** added hashes, nothing else changed. Then: validator 0 / 0; §5d 0 hashless; upstream `data/` still 4,666 entities, **0 `u:` ids** left (or each remaining one named with its reason), strings gate 0 / 0 / 0; the layer's names gate reports 0 references by name; the site and table in the browser as before, 0 console errors |
| M5 | here | **Norikage on the VTT sheet.** Current, Session Five and Session Three versions, every value checked field by field against the Portents JSON (kept verbatim in `campaign/source/`); off-approach rerolls enforced for his two distinctions; the player's trackers imported once from `pf-sheet-norikage`; `play/` retired | Each version shows what the Portents picker showed; the rerolls offer 2 on-approach, 1 off |
| M6 | upstream | **The GM's three panes (O8).** Notes (an authored document rendered + free notes in the pack); Scenes (an arc authored in the pack); Threads · Encounters · NPCs (a thread list; an encounter builder summing conflict ranks against the Group Rank; the scene's cast) | Through the real controls; the pack round-trips |
| M7 | here | **The campaign in the VTT's framing.** Site tabs for the Chronicle, Dramatis Personae (with discovery), the Atlas, the Map, Lore and the character; the state document in the Notes pane behind its spoiler gate; the arc seeded from the Session Seven prep; the old top-level pages removed | Through every tab and pane; 0 console errors. **landed 2026-09-23** (upstream I10 `37929e2`, pulled `8ebc32d`). **Documents:** `campaign/source/migrate_docs.py` moved the nine pages' content into `campaign/docs/` — page chrome dropped, links rewritten to tabs — and proved each: its text identical to the old page's content region (home 1,803 chars … state 63,562), every href/src resolving (a tab, an anchor in its document, an NPC, a file); a planted one-letter change and a planted bad link both failed it (exit 1). **Styles:** `scope_css.py` → 588 rules, every declaration block kept, every selector under `.pf-doc`. **Seed:** `build_seed.py` → 2 scenes and 1 encounter, every line the state document's own. **Browser on 8733**, with cache-busted files: the site opens on *Portents & Fortunes*, the campaign's seven tabs ahead of the VTT's ten; every tab and deep link drew its heading with 0 broken images (the map's hidden region layer excepted, as on the old page); `#atlas/reisui-ji` and `#rokugan/togashi-order` scrolled to their entries; the Chronicle's rail mounted; `#map/dragon` showed 5 pins. The Dramatis Personae: 18 cards from the DSL layer; as a player, Kaito Juri's sheet showed the 5 facts the campaign has revealed and blurred 45; one clicked, it stayed revealed after a reload (key `pf-dp-revealed`, the old page's); the GM switch showed all 50; her rings *Air 1 Earth 3 Fire 2 Water 1 Void 3* and skills as the DSL; *One within the Void* opened its Celestial Realms entry. At 375 px no tab scrolls sideways. **GM page:** the campaign had no arc and no encounters; the seed filled both and kept its party of 4; an edited scene title survived a reload; the Notes gate drew the old page's text (verbatim, checked) and *Bow & Enter*; passed, the state document rendered with its 228 tags inside the pane; the gate stood again after a reload; at 1500 px the three panes side by side. 0 console errors. **Removed:** `campaign/index.html`, `chronicle/`, `atlas/`, `map/`, `lore/`, `character/`, `dramatis-personae/`, `gm/` (their content is in `docs/`; `npcs.js` kept in `source/` for `check_npcs.py`). After: layer build OK (4 gates), check_npcs 18/18, check_norikage 124 fields 0 differ, the §10 house rules extract identically from `docs/state.html` |
| M8 | here | **Deploy.** The push that publishes `data/` (O1); Pages; the Worker deployed for this origin — confirmed with the owner at that step; a session with a player from a second origin | The player joins, claims Norikage, rolls; the GM sees it. **landed 2026-09-24 — LIVE** (owner: "Deploy all four"). **Pre-flight, local:** Worker bundle 20.56 KiB with every op of `system/l5r5e/ops.js`; `wrangler dev` 8794: the GM's *Start session* → room UNGLP; a player at `127.0.0.1:8733` joined by the link, claimed Norikage, rolled Theology (Void), kept a die, resolved; the GM's log got the roll and *Strife 0 → 1*, the member's strife 1 on the GM's copy. Found on the way and fixed: `import-old-sheet.js` on an unclaimed player page (`d501a0c`). **Worker** `portents-vtt` → `https://portents-vtt.sortilege.workers.dev` (version `832b167c`), `ALLOWED_ORIGIN` the custom domain and `sortilege-inc.github.io`: a room created from each (200), a foreign origin refused (403). **Site:** `engine/config.js` names it (`f3bece6`); `main` fast-forwarded to `vtt-instance` and pushed; Pages built `f3bece6`; **Enforce HTTPS on** — `https://` 200, `http://` 301 to it, certificate `CN=portents.sortilege.online` to 2026-11-05; the old paths 404 (O3). **Live, in the browser:** 17 tabs; the home, Chronicle, `#personae/kaito-juri` (18 cards), `#map/dragon` (5 pins), `#atlas/reisui-ji`, NPCs — 0 broken images. The GM page on a first visit: the seed filled the arc (2 scenes) and the encounter; Norikage added from the Party panel (2 archived versions); *Start session* → room 5W6KN on the deployed Worker; a player in a second browser context (the `127.0.0.1` page, its session base set by hand to the deployed Worker — the only live origin is the custom domain, and one browser's tabs share its storage) got the room's snapshot, claimed Norikage, rolled Meditation (Earth), kept, resolved; the GM's page showed *1 claimed* and the roll in its log. 0 console errors on both; session ended |
| M9 | upstream | **The pattern upstream.** PLAYBOOK §4 rewritten for the fork model; the general parts of `INSTANCE-PLAYBOOK.md` moved upstream | — |

One commit per milestone, in whichever repo it belongs to, pushed; each proven in the browser
through the real controls before the next begins. Upstream milestones are pulled here before
the instance milestone that needs them. H1 runs after M4 and before M5, so Norikage's version
history is built on hashed references.

## M4 audit — the Portents sheet against the VTT's

Every feature of `campaign/play/sheet.js` (1,611 lines, read in full) and its hand-typed rules data
`l5rdata.js`, set against upstream's `system/l5r5e/sheet.js` and `dice.js`. **Used** = Norikage's
sheet exercises it in any of his three versions. **Source** = where the VTT would read it, since
upstream types nothing the corpus can supply.

| # | Portents feature | VTT today | Used | Source | Proposal |
|---|---|---|---|---|---|
| 1 | Nothing kept for you | *Keep the best* | yes | — | **decided (O5)** — remove |
| 2 | Reroll marking: a distinction rerolls up to 2 dice; an adversity must reroll 2 success dice; a GM free reroll of any number; each reroll logged from → to | none | yes | Distinction / Adversity types | **port** — the mechanic O7's off-approach rule sits on |
| 3 | Off-approach distinctions: 1 die, not 2 | none | yes | the house-rule `MODIFY` | **decided (O7)** |
| 4 | Assistance: skilled or unskilled, each adds a die and a keep | none | yes | *Assistance* (core-systems) | **port** |
| 5 | Unknown TN: +1 Void point, to the maximum | none | yes | Void Points | **port** |
| 6 | Strife taken from a roll is chosen at *Keep* (default the kept (st); 0 in Void stance) | kept (st) applied automatically | yes | Void stance | **port** |
| 7 | Roll provenance in the log: note, source technique, dice first rolled, rerolls, explosions, kept, *kept fewer than allowed* | kept dice + tally | yes | — | **port** |
| 8 | Every change logged as an event: trackers, conditions, social, XP, gear, stakes | rolls only | yes | — | **port**, into the session log |
| 9 | Technique activation: a button carrying action, TN, skill and ring that sets up the roll; uses per scene / session counted | names linking to the corpus | yes | each technique's **ACTIVATION** text, parsed (*"As an Attack and Support action, make a TN 1 Martial Arts [Unarmed] (Fire) check"*); Portents hand-typed it | **port**; no button where the text does not parse |
| 10 | *Blood of the Kami*: a tattoo kihō that succeeds gains bonus successes equal to school rank, added automatically | none | yes | his school ability's text | **owner's call** — see below |
| 11 | Conditions: 13 toggles, logged | *Compromised* only, derived | yes | the corpus's `Condition` entities | **port** — O7's engaged-NPC conditions need it |
| 12 | Scene reset: strife and fatigue to half (rounded up) when over; not while Exhausted; per-scene uses recharge; per-scene Void claims reset; conflict ends | none | yes | — | **decided** (*End scene* / *End session*, carry) |
| 13 | Adversity: after its reroll, a failed check claims +1 Void (once per scene per adversity). Anxiety: the first strife it causes in a scene claims +1 Void | none | yes | Adversity / Anxiety types | **port** |
| 14 | One-click strife from a passion (−3) or anxiety (+3) | none | yes | Passion / Anxiety types | **port** |
| 15 | Honor, Glory, Status adjusted ± and **staked**, logged | read-only | yes | — | **port** |
| 16 | XP earned / spent / available, ± logged, and a *spent on* ledger (cost, what, note, date) | one number | yes | — | **decided** |
| 17 | Version history: a picker; archived versions read-only, with their trackers; a banner; export, import and reset withheld while viewing one | none | yes | — | **decided** |
| 18 | Conflict: enter / end; type; stance with its rule; initiative set up (TN 1, the type's skill); the type's actions with their rules text, each declared to the log and setting up its check | none on the sheet | yes | *Conflict Type*, the actions in core-systems, *Stance* | **port** |
| 19 | Stances enforced: Void takes no strife from (st); Fire adds a bonus success per kept (st) to damage | none | yes | *Stance* | **port**, with 18 |
| 20 | Gear: equip weapon / armour; the readied weapon sets Strike's skill; a damage calculator; critical strike severity and its tier | gear as lines | yes | the corpus's weapons; *Critical Strike* `SEVERITY_TABLE` | **port** |
| 21 | Opportunity spends at roll time: 8 contexts × the ring, plus the character's technique opportunities | none | yes | *Opportunity* (core-base) | **port** |
| 22 | Portrait and clan mon in the header; the deficient ring marked | none | yes | instance portrait; the clan | **port** |
| 23 | Export / import state + log; a local reset | character file carries `live`, not the log | yes | — | **port** the log into the character file; no local reset (the VTT's state is the table's) |
| 24 | Titles and bonds with *Use* buttons (Void cost, strife ± by rank, uses) | Titles / Bonds as linked names | **no** | — | **not ported** — no character here holds one; the VTT's linked names stay |
| 25 | Standing wounds (afflictions) | none | **no** | — | **not ported** — conditions (11) and notes cover it |
| 26 | Side rails (section nav, live trackers) and the collapsible roller | the VTT's own layout | yes | — | **not ported** — presentation |

**Corpus gap found by the audit.** The rules behind 2, 6, 13, 14 and 19 — the standard mechanical
effect of Distinction, Passion, Adversity and Anxiety, and the five stances — are **comments** in
`core-character.ttrpg` and `core-base.ttrpg`, so no build carries them (checked: `data/core.js` has
none of *"do not suffer strife from"*, *"must reroll two dice"*). Proposed: the VTT names each number
as a constant citing its sentence (as `dice.js` already does), and the sentences themselves are lifted
into the corpus as data from the book's own text in H1.

**Proposed order:** M4a the roller and log (1–8, 13, 14); M4b the record (11, 15–17, 22, 23);
M4c techniques and scenes (9, 10, 12); M4d conflict, gear and opportunities (18–21). One upstream
commit each, each proven through the real controls.

**M4a landed 2026-09-23** — upstream `b43f6dd` (+ `340e99a`), proof in upstream PLAN I2; pulled
here in `84dfeab` / `55bef5c`. Items 1–8, 13, 14 ported. Item 3 enforced from this layer: the two
off-approach `MODIFY`s carry `^"Off-Approach Reroll Dice" INTEGER 1` (`9f513c0`), and in the
browser on 8733 Norikage (added from the pregen picker) offers *Portentous Birth · up to 2* on a
Fire check and *· up to 1* on Water (*Affect of Harmlessness* 1 on both), marking stops at one die
off-ring, and the reroll logs *via Portentous Birth (fire)*; 0 console messages. *Brushwork −3
strife* and *Tip of the Tongue +3 strife, +1 Void* read from their rules. Not yet: the Void-stance
strife default (19, M4d), the scene boundary that resets an anxiety's once-per-scene Void (12, M4c
— the claim is keyed to `live.scene`, which *End scene* will advance).

**M4b landed 2026-09-23** — upstream `590550e` / `2a5e2c9`, proof in upstream PLAN I3; pulled here in
`ee60043`. Items 11, 15–17, 22, 23 ported. Item 22 from this instance: `campaign/site/portraits.js`
registers Norikage's portrait for upstream's header hook (`window.L5RPortraits`), loaded at the `data`
stage. In the browser on 8733 Norikage's header shows his portrait (`norikage.webp`, loaded), the
Dragon mon, and **Fire marked deficient** (his *Elemental Deficiency (Fire)*); 14 condition toggles;
Honor 52 · Glory 50 · Status 30 with − / + / stake; XP earned 11, spent 0; 0 console messages.
**For M5:** his Portents record spent 9 XP (*Breaking Blow* 3, *Water 1 → 2* 6, 26 Aug 2026), which
his actor does not carry yet (`convert_norikage.py` wrote only `Experience` = earned) — M5 carries
spent and the ledger with his versions. Not yet: an engaged NPC's conditions visible to the player
(O7) — with M4d's conflict, where engagement is. Upstream found and fixed an M4a defect on the way:
a live sheet threw when a character's passions and anxieties were not yet loaded.

**M4c landed 2026-09-23** — upstream `b09ba1b` / `5f2333a` (+ `932b387`: a character's own DEF field
arrives as its fields), proof in upstream PLAN I4; pulled here in `0d28080`. Items 9, 10, 12. From this
layer: **Blood of the Kami** is Norikage's (decision 28) — his actor records `^"Mystical Tattoos" DEF
{ ^"Spider" STRING "Earth Needs No Eyes" }` and `campaign/site/blood-of-the-kami.js` registers a check
hook quoting the school ability; the **session boundary** house rule carries `^"Removed At Session End"
BOOLEAN true` on `^"Strife"`. In the browser on 8733, Norikage fresh from the picker: *Earth Needs No
Eyes · Breaking Blow · Lord Togashi's Insight (once per game session · Shūji)* as buttons; *Earth Needs
No Eyes* succeeding read *+1 bonus success — Blood of the Kami (the spider tattoo)*, 2 successes, logged
with it; failing, and *Breaking Blow* succeeding, no bonus; *Lord Togashi's Insight* used → disabled,
*used (1 of 1 this session)*; **End session** offered the carry for each character — the one ticked
kept Strife 9 (*strife carried in full*), the other *Strife 9 → 5 (house rule)*; the insight available
again; 0 console messages.

**M4d landed 2026-09-23 — M4 is complete.** Upstream `b973d64` / `0959919`, proof in upstream PLAN I5;
pulled here in `364d18f`. Items 18–21, and O7's two remaining defaults: an engaged NPC's conditions
visible to the player, and *Elemental Deficiency (Fire)* prompted, never automatic. In the browser on
8733, Norikage: his **Bō** readied from his Equipment (*Martial Arts [Melee] · range 1-2 · damage 6 ·
deadliness 2*), Common Clothes offered; Skirmish → Fire → **Strike** set up Martial Arts [Melee] TN 2
in Fire; the Fire check **prompted** *Elemental Deficiency (Fire) — does it apply? The GM's call*, and
*Apply* entered its reroll; 0 console messages. O7's prompt fires on any check in the adversity's ring
(the house rule's *"limited to checks made in Fire stance"* is the GM's Dismiss outside a conflict).

**Weapons equipped or readied (owner, 2026-09-23)** — upstream I6 (`a1a028c`), pulled here: a weapon on
the sheet is *equipped (sheathed)* or *readied* with a grip, the grip's hands counted against two; Strike
uses the readied weapon the player names. Norikage's Bō is 2-hand only (*"2-hand: –"*).

**M5 landed 2026-09-23 — Norikage on the VTT sheet** (run before H1 at the owner's word, decision 39).
`convert_norikage.py` now reads the byte-for-byte record (`source/norikage-sheets/`: the three sheets and
the old page's `SHEET_HISTORY`, `sheet-history.js`, copied byte-identical before `play/` went) and writes
the live sheet and both archives as DEFs, each archive `^"Version Of"` the live one (upstream I7), with his
stance, XP spent, ledger and tattoo. **`check_norikage.py`: 124 fields across the three sheets, 0 differ**
(made to fail: Session Three's Honor 55 → 54 reported `social.honor old=55 built=54`, exit 1). Layer
0 / 0 / 0; check_npcs 18 of 18. In the browser on 8733, Norikage from the picker (listed once): the picker
shows *Current*, *Session Five · 9 XP spent · 9 Sep 2026*, *Session Three · 0 XP · 18 Aug 2026*; Current
XP 11 / 9 with its two ledger lines; Session Five 9 / 9, Strife 0 / 10, Void 3 / 3; Session Three Water 1,
Strife 0 / 8, Honor 55, XP 6 / 0, no *Breaking Blow* — each with his portrait and the banner; the rerolls
*Portentous Birth · up to 2* on Fire, *· up to 1* on Water. **The one-time import**
(`site/import-old-sheet.js`, gm and play stages): with the old page's keys seeded in this browser (test
values, removed after), a fresh Norikage took Strife 4, Fatigue 2, Void 2, Water stance, Glory 51, Dazed,
the Bō readied, Common Clothes, XP 11 / 9, and the old log's two entries oldest first, then *Imported from
the old sheet: …*; a reload imported nothing again (log 23 → 23). The real keys live in the player's own
browser at the site's origin; the import runs there the first time the player opens the VTT. **`play/`
retired**: removed; the character pages and the GM notes link to `/gm/play.html`; the old Dramatis
Personae no longer loads `play/l5rdata.js` (it already fell back without it; M7 rebuilds it). 0 console
messages on the GM's page and the player's.

**H1 landed 2026-09-23 — the corpus hashes every entity.** titterpig-dsl-l5r5e `c7abe91`, `20e07df`,
`014ef18`; tool `titterpig-audit/l5r5e/hash_unhashed/` (`hash.py` survey · assign · apply;
`assignments.json` maps each old build id to its hash). **2,035 entities hashed** (1,668 `.ttrpg`, 132
`.actor`, 77 `.arc`, 31 codex DEFs, 127 codex ENTITYs) in 122 files; the pilot (*core-distinctions*) first,
34 of 34 lines changed only by the added hash, then all 2,035. Kitsune Ryōsei takes back the hash of the
duplicate retired in `2792b99`. **§5d backfill**: 183 references by a unique name now carry the hash (list
items, keyword subjects); 73 that begin a statement (curriculum rows) stay names — a leading hash there reads
as a definition, which the VTT's parser caught. Gates: validator 164 files 0/0; REFERENCES 44, 0 errors;
§5d 2,291 sites 0/0; mend and lift PASS. **Proof that nothing changed but ids:** the VTT's build of the
corpus before and after, entity by entity with the old ids renamed — 4,610 = 4,610, the same ids, 4,574
identical, 36 differing only by a reference that gained its hash, **0 otherwise**. Upstream (I8, `c611ccb`):
**0 `u:` ids**; stored state renamed on read (`renamed-ids.js` + `engine/state.js renameIds`) — the 8740
campaign's 16 old ids and this browser's all carried over, 0 left. Here (`3937cc0` + this commit): the
layer's references by name rewritten as hashes — **names gate: 0 references by name**; check_norikage 124 / 0,
check_npcs 18 / 18; in the browser the off-approach rerolls (2 on Fire, 1 on Water), the house-rule notes
joined by hash and the session rule all hold, 0 console messages.

**Found on the way and repaired first (titterpig-dsl-l5r5e `3417932`):** my data-strings mend (`2792b99`)
had broken 4 REFERENCES and dropped 3 — check_references' REFERENCES line read *44 refs, 4 errors*, which my
reports had not quoted (they quoted only its §5d line). Now 44 refs, 0 errors (decision 42).

**M6 landed 2026-09-23 — the GM's three panes** (upstream I9, `7e9c846`; pulled in `355d4d1`). The corpus
first gained the *Gauging an Encounter* comparison its *building-encounters* entry had cut off at *"consult
the following:"* (titterpig-dsl-l5r5e `ef396b2`, core p. 310, verified). Notes (an authored document the
instance names, rendered, and free notes); Scenes (the arc — add, edit, reorder, mark played, remove);
Threads · Encounters · NPCs (threads; the encounter builder summing conflict ranks against the Group Rank
with the book's paragraphs and the band marked; saved encounters put in the scene; the scene's cast). GM-only
pack state, never sent to players; the pack round-trips (proof in upstream I9). Here: **the GM's table opens
on the three panes** (`engine/config.js defaultSlots`, O8) — in the browser at 1500 px, with no layout chosen
yet, *Notes · Scenes · Threads · Encounters · NPCs*; 0 console messages. The state document as the Notes
document, behind its spoiler gate, and the arc seeded from the Session Seven prep are M7.

## Decision log

| # | Decision | Why |
|---|---|---|
| 1 | The corpus is `titterpig-dsl-l5r5e/0.5`, the one upstream is built on | The owner's rule: the highest spec unless told otherwise. |
| 2 | Both maps are kept: Portents' map is navigation (Rokugan → clan regions → pins into the Atlas), the VTT's is a table (tokens, fog, grid) | Different jobs; neither replaces the other. |
| 3 | The instance-owned root files are `engine/config.js`, `worker/wrangler.jsonc`, `README.md`, `CNAME`, `.claude/launch.json`; `.gitattributes` marks them `merge=ours` | `config.js` is upstream's declared deployment file; the rest are per-origin. The `ours` driver is not stored in the repo, so every clone needs `git config merge.ours.driver true`. |
| 4 | This instance's Worker runs locally on **8794** | 8787–8793 belong to siblings (8793 to TOR2e). |
| 5 | M1 moves the Portents files under `campaign/` unchanged; integration is M7 | The merge commit stays a pure move, reviewable apart from any change of content. |
| 6 | Norikage's Portents JSON is kept verbatim in `campaign/source/`, and each VTT version is checked against it field by field | A change of format cannot be byte-identical; the original is the record the check runs against. |
| 7 | O7 was read from "understood" as accepting the recommendation | Recorded so it can be corrected. |
| 8 | The player's live trackers are imported once from `pf-sheet-norikage` | Same origin, so the key is readable; nothing resets under the player. |
| 9 | The state document keeps its spoiler gate in the Notes pane | The same exposure as today's Behind the Veil. |
| 10 | M1 is built on a branch, `vtt-instance`, and not pushed | Pushing it — even as a branch of this public repo — publishes `data/`; O1 places that at M8. `main` keeps serving the old site to the player meanwhile. |
| 11 | The move is its own commit, before the merge | A pure-rename commit is provable (all `R100`, zero lines), and it leaves the merge only `.gitignore` to reconcile. Corrects the playbook's draft, which folded both into one step. |
| 12 | `.gitignore` is instance-owned: upstream's lines, plus `!.claude/skills/` and `ingest/` | Upstream ignores `.claude/*`, which would stop the campaign's project skills (`rokugan-voice`) from being tracked when they change. |
| 13 | **Finding for M2 (upstream):** `build/build_art.sh` copies the art from `…/portents-and-fortunes/assets`, which is now `campaign/assets` | An upstream script coupled to this campaign's layout; the art it produced is committed, so nothing breaks until it is re-run. Fixed upstream in M2. |
| 14 | **Finding for M2 (upstream):** the site's `<title>` and the player's page heading are printed as *Legend of the Five Rings* in upstream HTML, while the table reads `VttConfig.title` | An instance should be able to name every page from its config without editing an upstream file. |
| 15 | The aegean VTT's dev server (8739) was stopped to free a slot, at the owner's word | The preview harness allows five servers per folder, all five held by other chats. |
| 16 | **Each NPC is a full statblock on the corpus's `NPC` chassis**, not an `EXTENDS` of another NPC; what it was built on stays in its `statNote` | The VTT lists as NPCs only entities whose type is `NPC`, and follows `EXTENDS` chains for type declarations only — an Ujiyasu extending the Brotherhood Monk would drop out of every list and lose the stats he inherits. `npcs.js` already stored full statblocks. Corrects the plan's first wording ("templates as `EXTENDS`"). |
| 17 | A one-line ability is a `RULES` line carrying the **0.5 corpus's own line**; a multi-paragraph ability that is a corpus technique is a **reference** to that technique | `RULES` lines are lifted verbatim, so a paragraph break cannot be written in one; and the seven such abilities (the Moon Cultist's four invocations, three of Juri's) are corpus techniques, so the reference renders 0.5's own Activation and Effects instead of the old site's 0.4 copy. |
| 18 | Six abilities keep the old cards' one adaptation: the corpus text with the chassis NPC's name replaced by the campaign NPC's | Proven, not assumed: with the name restored each is identical to 0.5 — *Two Heavens Style* (Kichiru → Fusae), *Herbalist* (Dai → Nui), *Attuned to the Way* (Jun → Ujiyasu, Kenzan; "this monk" on the template), *Blood of the Kami* and *Drawing From Within* (Remmu → Oharu). The owner had accepted these on the old cards. |
| 19 | Epithet, Affiliation, Campaign Status, Biography and Template are DSL properties; portrait, reveal, `statNote` and the old cards' ability tags (*Niten*, *Perfect Land*, *Abbot*…) are presentation, in `campaign/site/npc-meta.js` | The corpus's `NPC` type declares no fields, so an NPC may carry the campaign's own record of the person through the gate; what only governs display stays out of it. |
| 20 | No resistance field | The corpus prints resistance inside the Gear line (*"Scaled hide (Physical 1, Supernatural 1)"*); `npcs.js`'s `resist` was derived from it. |
| 21 | The house rules are one `MODIFY` + `GUIDANCE` per rule and target — 7 rules, 8 `MODIFY`s — their text **extracted** from the state document's §10, never retyped; targets: *Portentous Birth* and *Affect of Harmlessness* (by name), *Check*, *Strife* (it carries the corpus's `strife_removal_between_scenes`), *Elemental Deficiency (Fire)* (by name), *Duel*, *Compromised* (the condition, `#EJSWW92HPvejHQLZakLnjP`: *Vigilance counts as 1*), *Honor* | The VTT shows a `MODIFY`'s `GUIDANCE` beside its target exactly as it shows the errata, and joins it by hash or by name. |
| 22 | Norikage's actor carries every field the Samurai ACTOR declares; the stance, live tracks, XP ledger and archived versions are the sheet's (M4, M5). The three original sheets are kept **byte for byte** in `campaign/source/norikage-sheets/` | Checked: *sheet-data*, *sheet-s5*, *sheet-s3* identical to the page (11,962 / 11,690 / 10,345 bytes). |
| 23 | Found and fixed **upstream** while building M3: the layer's **names** gate (upstream I-8); a bug in its `MODIFY`/`CONCERNS` path, which the fixture had not exercised — the fixture now covers every path (`d559466`); the campaign layer **loads with every book**, or its house rules appear beside their rules only when it happens to be loaded (upstream I-9) | Generic, so upstream; each proven there first and pulled. |
| 24 | **Corpus finding:** *Disciple of Secret Lore* (Scholarly Shugenja, `core-npcs` 0.5.0) opens a parenthesis it never closes | Reported as item 3 in `titterpig-dsl-l5r5e/TODO.md` (`b48980d`, page corrected to 314 in `a754c1f`); the layer carries 0.5 as printed. |
| 25 | Pulling upstream is `git fetch upstream && git merge upstream/main` | `git pull` refuses with no strategy configured, and an instance must **merge**, never rebase — a rebase would rewrite the campaign's own history. `merge=ours` keeps the instance's whole `config.js`, so upstream's documented `instance: null` did not arrive: config changes upstream are carried by hand. |
| 26 | **The corpus's rules were comments; fixed at the source before M4 (owner: "fix the corpus and then update the VTT and then this project").** 980 text-less RULES placeholders across 82 files — the 0.1 hand pass's spec §12 "named rule placeholders", with a paraphrase in the comments — resolved: 664 carry the book's text verbatim, 316 removed with reasons, 477 added for content that lived only in comments; 4,359 comment lines dropped, 1,575 kept as encoding notes | The audit found the stances' and the advantage types' rules only in comments. Proof: every text verified at its cited page; the corpus-wide gate PASS, 0 files open; validator 164 files 0/0; titterpig-dsl-l5r5e `a2bfdf7`. Upstream `d65ef64` rebuilt from it (31,886 strings 0/0/0) and renders a rule's paragraphs; pulled here in `6304c19`; *Initiative* shows its three rules as 7, 4 and 2 paragraphs in the browser, 0 errors |
| 27 | Three corpus rules were not the book's and went: a default TN of 2 (upstream's `DEFAULT_TN` is now none — the roller opens on *TN ?*), "focus breaks initiative ties" (the book: lowest honor acts first, p. 250), "melee requires range 0" | Each checked against the page it would come from. |
| 28 | **Blood of the Kami is Norikage's own customization, in the campaign layer (owner)** — not an upstream feature, and not a prompt | Owner's answer to the M4 audit's question. |
| 29 | **The retailer's buyer watermark** (the owner's name and order number) had reached the corpora and this repo's built data; removed from every corpus and every rebuilt data file as an explicit owner override of the verbatim rule (titterpig-dsl-l5r5e `a42bd48`, titterpig-dsl-vtm5e `a31138f`, sortilege-vtt-vtm5e `f6a442b`, upstream `d65ef64`, pulled here). Earlier commits in public history still carry it | Removing it from history is a rewrite of published branches — the owner's decision. |
| 30 | M4's audit item 14 (one-click strife for passions and anxieties) and the stances now read the corpus's own rules — the standard effects on p. 24 and Table 6–1 — instead of constants | The corpus gap the audit reported is closed at the source. |
| 31 | **An adversity's Void point follows the book, not Portents' old sheet: every failed check it was resolved on, no once-per-scene limit** (upstream I-11). Only an anxiety is once per scene | The corpus's Void Points RECOVERY prints *"After failing a check on which one of their adversities was resolved"* beside *"Once per scene, after one of their anxieties caused their strife to rise"*; Portents' sheet had capped the adversity at once per scene per adversity with no rule behind it. Not a house rule in §10, so the book's reading stands; a `MODIFY` would restore the cap if the table wants it. |
| 32 | Off-approach enforcement is a property the house-rule `MODIFY` introduces (`^"Off-Approach Reroll Dice"`), read by upstream's generic `L5RData.modified` (upstream I-14) | O7: *"a campaign supplies only the `MODIFY`"*. |
| 33 | **Dark Tides' check outcomes (owner: "delete the Dark Tides outcomes")**: the 9 flagged ON_FAILUREs **and 17 more the gate had never measured** — the mend gate checks strings of 40+ characters, and these were shorter (*"Door holds"*, *"Enemies fight on"*) — 26 outcomes the adventure never states, deleted; 11 short outcomes that paraphrased checks the book does print (*"PC catches a fleeing ruffian"*) now carry its sentence (*"If the PC wins, they have caught one of the ruffians."*, p. 26). titterpig-dsl-l5r5e `30bcf53`; upstream rebuilt `0c663c8` (31,539 strings, 0/0/0 — 26 fewer, the deleted outcomes) | Applying the owner's ruling to every instance of it in the file, not only the nine the report listed. A corpus-wide scan of `ON_SUCCESS` / `ON_FAILURE` / `OUTCOME` strings under 40 characters finds no other: the only one left is Dark Tides' *"If the ruffian wins, they keep running."*, verified verbatim. |
| 34 | **Dark Tides' and The Lost Writer's checks, as printed (owner: "fix Dark Tides' checks … the TN changes based on the ring used")** — spec: `RING_TN "Ring" n` (the ring's own TN; `TN` is any other ring's), `ALTERNATIVE { … }`, `RING` only when the text requires it and repeated for *either* (titterpig-dsl `7e704ee`, `de0fcf7`). Dark Tides: all 42 printed checks (pp. 10–29) as 43 CHECKs, 13 new, every invented `RING` gone, wrong TNs fixed, three clue pointers now naming their check (`f4e9849`). The Lost Writer, the only other adventure with CHECKs: 17 (pp. 162–171), skill groups replaced by the skills printed, 4 new (`cbb7ad1`). Gates: mend and lift PASS 0 open, validator 164 files 0/0; upstream rebuilt `e84ce80` (31,572 strings 0/0/0) | The core's own definition (p. 297): *"a TN 3 Fitness check (Earth 1, Fire 4)"* is TN 4 with Fire, 1 with Earth, *"and a TN of 3 for any other ring"*. Fixing only the 30 existing checks would have left 12 printed checks out — a subset. The Lost Writer carried the same defect (a group and one ring for "Games [Water or Air]"); fixed with it rather than left for a later catch. One reading recorded: *"a TN 2 Skulduggery or Medicine (Fire 1) check"* gives Fire 1 to Medicine only, as the kit prints ring TNs after each skill (*"Command (Water 1) or Skulduggery (Earth 3)"*) |
| 35 | The conditions on the sheet are the corpus's 16 (less the two the ACTOR derives), not Portents' 13 | Upstream I-18: the sheet reads what the corpus defines; *Dying* and *Wounded* were missing from Portents' hand list. |
| 36 | **Owner (2026-09-23): in "a TN 2 Skulduggery or Medicine (Fire 1) check" the Fire 1 applies to both skills.** Dark Tides' *Deduce When Suzaku Died* is now one check, both skills at TN 2, Fire 1 (titterpig-dsl-l5r5e `4670783`; upstream rebuilt `96765c7`, 31,572 strings 0/0/0) | Replaces decision 34's reading. No other check in either adventure has that shape (scanned). |
| 37 | Blood of the Kami keys on Norikage's recorded tattoo (motif → kihō) and the technique's category *Kihō*; the bonus is his school rank, automatic on a success, nothing on a failure | The school ability's text; the linked kihō and motif from his Portents sheet (`sheet-data.json`: spider, *Earth Needs No Eyes*). |
| 38 | M4 is complete: all 23 ported audit items (1–23) are upstream and pulled; 24–26 were decided not ported | M4a–M4d, each proven through the real controls (upstream PLAN I2–I5; this plan's M4a–M4d paragraphs). Next is H1 (hash the unhashed), then M5. |
| 39 | **M5 ran before H1 (owner: "Then m5")**, reversing the plan's order | The plan put H1 first so the version history would be built on hashed references. M5's versions hold names and the layer's own hashes, not `u:` ids, so H1 remains a corpus-and-rebuild step with nothing of M5's to migrate but the layer's name references (still 22, now across the three sheets). |
| 40 | Norikage's archived sheets are DSL (two DEFs `^"Version Of"` the live one), not pack state | O6: homebrew is DSL; the archives are records to check field by field, and the layer's gates cover them. Archives the table makes in play (*Archive this version…*) stay pack state. |
| 41 | The one-time import takes the old sheet's trackers, standing, XP, conditions, gear and log; not its per-scene technique uses or Void claims | Those reset at the next scene anyway, and the old keys do not map onto the VTT's. |
| 42 | **2792b99's REFERENCES repaired**: Hiniku → Mazoku Bureaucrat removed (Deathly Turns p. 11 gives that profile to the Gatekeeper, and her verbatim text names neither); Masashige → Mountain Song Temple removed (his verbatim profile does not name it); Teru and Sugai take the word their prose uses as the surface; Kichiru → Dragon Clan and Sadao → Dragonfly Clan restored on the kept copies; Koma → Furthest Fortress could not be (its only anchor was the misfiled sidebar the retirement removed; the text lives in the temples `.lore`/`.codex`) | A reference's surface must be in its DEF's prose, and it may point only at a declared anchor. From now on a corpus report quotes every line of check_references, not only §5d. |
| 43 | **H1's reference backfill stops at the unique**: 284 references in 41 ambiguous names are left by name (`hash_unhashed/ambiguous.json`) for the owner | §5d: *"Ambiguous sites cannot be backfilled mechanically: they need the intended target chosen."* Most are a core technique or skill that a supplement or adventure reprints under its own entity (*Martial Arts [Melee]* core and Path of Waves; *Commune with the Spirits* core and Wedding at Kyōtei); the rest an arc's cast line beside the NPC's own stat block. The VTT resolves them today as it always has (same book, then the core). |
| 44 | Codex `IS` tags and relationship objects stay names | §25 defines them as caret names resolved by name; neither the spec nor the corpus writes a hash there. |
| 45 | **A character's copy of an entity defined elsewhere keeps its text and `EXTENDS` the original by hash** (55 copies: NPC and pregen printings of core and sourcebook techniques, advantages, disadvantages, anxieties, passions; corpus b399e66). Three same-named abilities are *not* copies and stay unlinked: Kitsu Ginchiyo's *Possession* (possessed by an ancestor, vs the GM-tools spirit rule), Shosuro Hyobu's *Web of Lies* (a once-per-session ability, vs the Courts of Stone disadvantage), Airi's *Flight* (a one-line form ability, vs the Writ of the Wilds kata) | Owner call: keep text, link to core. `EXTENDS`, not `REFERENCES`: a surface must be in the prose and copies read "When Haya makes…"; §6 makes the copy inherit the original and override its text, which is what a printing is. The VTT builds a same-name `EXTENDS` as `copyOf`, not as a type, so records stay 3047 and no type list gains the copies; the entity reads *As printed here; defined in …* (upstream 6b171e7). |
| 46 | The Lost Writer's 7 arc NPCs keep their own DEFs and carry `REFERENCES` to the Children of the Five Winds GM-tools NPCs | Owner call: keep both, linked. Surfaces are the names their Descriptions print (*Haya*, *Shin*, *ifrit* where the full name is not printed). |
| 47 | **Cross-product reprints: only Miya Tetsua's *Emerald Authority* is unchanged**, and it `EXTENDS` the Emerald Empire printing (first published). Every other same-named or near-identical pair is a different version and stays: Writ of the Wilds' Questions 2/7/8 and four upbringings add paragraphs to Path of Waves'; Outcast Nezumi is a Minion in Knotted Tails and an Adversary in Shadowlands; Hiramori Kasami, Daidoji Shin, Lady Mazoku and Miya Tetsua are profiled differently in each book; per-NPC abilities (*Sworn Protector*, *Whispering Winds*, …) name their own NPC and have no standalone definition to point at | Owner call: reprints to the first book, where each product prints its own version both stay. Measured by word diff of every string, children included. No entity was removed, so no id is renamed and no name became unique for the backfill. |
| 48 | **The old pages move into `campaign/docs/` as they stand**: the content region only (the nav, breadcrumb, footer, scripts and the Behind the Veil gate dropped — the VTT draws its own), links rewritten to the tabs, text proven identical. One link the old site had broken is repaired to what its own text names: the dossier's *"His abbot, Togashi Oharu"* pointed at `#the-abbot`, which no NPC ever was → `#personae/togashi-oharu` | A method call (rule 7). Moving, not rewriting: the documents are the owner's prose. The repair is to where a link goes, not to any word. |
| 49 | **The old stylesheets are scoped to `.pf-doc`, generated** (`scope_css.py` from `source/css/`); `pf.css` is the only hand-written fit | The VTT's stylesheet defines the same custom properties (`--paper`, `--ink`, `--edge`, `--jade`) and styles the same elements; unscoped, each would restyle the other. |
| 50 | **Seven campaign tabs, first, the site opening on the campaign**: *Portents & Fortunes* (the old home: its premise and section cards), *Norikage* (the characters page; his dossier at `#norikage/dossier`), *Chronicle*, *Dramatis Personae*, *Map*, *Atlas*, *Lore of Rokugan* | The plan named six; the home is a seventh because its premise paragraphs exist nowhere else. *Lore of Rokugan* (the old page's own title) and *Norikage* because the VTT already has *Lore* (the corpus's lore graph) and *Characters* (every book's pregens). Reversible: each is one line of `campaign/site/site.js`. |
| 51 | **The Dramatis Personae is drawn from the DSL layer**, not the old `npcs.js`; discovery as the old page had it, on its keys (`pf-dp-gm`, `pf-dp-revealed`) and fact ids, so a player's reveals carry over — **except an ability's**, now keyed by its name (`<id>:abil:<name>`) where the old page used its place in a list the DSL does not keep. **The old page's scene tools** (table bar, roster, roller, conflict turn, trackers, scene log) **are not ported**: the GM's table does each | O6: the DSL is the record of the 18 (M3); drawing the page from `npcs.js` would keep a second one. The scene tools are the VTT's Cast, Encounters, Dice and Log now (M3–M6). |
| 52 | **The arc is seeded, not stored**: `campaign/pack/seed.json` (generated from the state document's prep) fills the campaign's `arc` and `encounters` once, where it has none (upstream I10) | Pack state is the GM's to edit (O8); a seed that overwrote it would undo the GM's play. The two scenes are the prep's two scene headings, their text its own lines and sub-heads; the encounter is the prep's ambush — 3 Desperate Bandits + 1 Experienced Bandit, Encounter Rank 6. |
| 53 | `convert_house_rules.py` now reads `docs/state.html`, and is marked **do not re-run**: run, it would write the M3 house rules back over H1's hashes and M4's `Off-Approach Reroll Dice` | Found by running it: it rewrote the file (restored at once, `dsl/` unchanged against HEAD). Its extraction is proven the same from the new document (7 rules, identical). |
| 54 | The Worker admits `https://portents.sortilege.online` and `https://sortilege-inc.github.io` (and localhost, always, for `wrangler dev`) | The sibling pattern (Troika D3): the github.io address is the one behind the custom domain. |
| 55 | The live session was proven with the player in a second **browser context** (the local page, pointed at the deployed Worker by hand), not a second live origin | Pages redirects the github.io address to the custom domain, so a browser can reach only one live origin; two tabs of one browser share the session's storage and would overwrite each other. Every message went through the deployed Worker. The owner's own first live session with the player is the real proof, from two browsers. |
| 56 | **The player's sheet works on a phone** (owner, 2026-09-24): built upstream (I11) and pulled — at phone width the sheet is four panes (Play · Roll · Gear · XP · Sheet) behind a bottom bar, touch-sized controls, the roller one tap away | Generic, so upstream (O2). Proven with Norikage on a phone-sized player page: 0 controls under 40px in any pane, a technique opens *Roll*, the house-rule rerolls offered, the GM saw the roll. The Worker is unchanged (no op changed), so not redeployed. |
| 57 | **The player's sheet is compact** (owner, 2026-09-24: "looks like shit … unnecessary explanatory text … numbers in text boxes"): upstream I12, pulled — no working shown, the roll log only the player's rolls (the old sheet's import changelog no longer appears there), taps instead of typed numbers, a designed phone layout | Generic, so upstream. The Worker is unchanged. |
