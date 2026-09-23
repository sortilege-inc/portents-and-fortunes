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
| M3 | here | **The homebrew in DSL.** The 18 NPCs (templates as `EXTENDS`), Norikage as an actor, the seven house rules as `MODIFY`s; presentation metadata (reveal, portrait, `statNote`) as a campaign file keyed by entity id | Gate green; Cast lists the 18 beside the corpus's 389; Kaito Juri's statblock matches `npcs.js` field by field; each `MODIFY` shows beside its target |
| M4 | upstream | **The sheet and the dice.** *Keep the best* removed (O5); version history (archive first, read-only view, a picker); an XP ledger; the Portents sheet features the VTT lacks, **audited feature by feature before porting**; the sheet honours a `MODIFY`'d number; a disadvantage prompt on matching checks; *End scene* / *End session* strife recovery with a per-character carry; an engaged NPC's conditions visible to the player | Each through the real controls; 0 console errors |
| M5 | here | **Norikage on the VTT sheet.** Current, Session Five and Session Three versions, every value checked field by field against the Portents JSON (kept verbatim in `campaign/source/`); off-approach rerolls enforced for his two distinctions; the player's trackers imported once from `pf-sheet-norikage`; `play/` retired | Each version shows what the Portents picker showed; the rerolls offer 2 on-approach, 1 off |
| M6 | upstream | **The GM's three panes (O8).** Notes (an authored document rendered + free notes in the pack); Scenes (an arc authored in the pack); Threads · Encounters · NPCs (a thread list; an encounter builder summing conflict ranks against the Group Rank; the scene's cast) | Through the real controls; the pack round-trips |
| M7 | here | **The campaign in the VTT's framing.** Site tabs for the Chronicle, Dramatis Personae (with discovery), the Atlas, the Map, Lore and the character; the state document in the Notes pane behind its spoiler gate; the arc seeded from the Session Seven prep; the old top-level pages removed | Through every tab and pane; 0 console errors |
| M8 | here | **Deploy.** The push that publishes `data/` (O1); Pages; the Worker deployed for this origin — confirmed with the owner at that step; a session with a player from a second origin | The player joins, claims Norikage, rolls; the GM sees it |
| M9 | upstream | **The pattern upstream.** PLAYBOOK §4 rewritten for the fork model; the general parts of `INSTANCE-PLAYBOOK.md` moved upstream | — |

One commit per milestone, in whichever repo it belongs to, pushed; each proven in the browser
through the real controls before the next begins. Upstream milestones are pulled here before
the instance milestone that needs them.

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
