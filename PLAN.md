# sortilege-vtt-l5r5e — plan and decision log

A virtual tabletop for **Legend of the Five Rings, 5th Edition** (Fantasy Flight Games / Edge
Studio), built on the Titterpig corpus `titterpig-dsl-l5r5e/0.5`. Its shape follows
`sortilege-vtt-teeth`'s `PLAYBOOK.md` and the Troika! and VtM5e builds that applied it most
recently; all three are read-only reference — nothing in them is modified here. Ninth in the
line — Wyldwolf Axis, NOVA Open, City of Winter, TEETH, Invisible Sun, Troika!, VtM5e, Aegean.

Status words: **PROPOSED** (awaiting the owner), **(owner)** decided, **landed** built and
verified in the browser by the main session.

## Ground rules (inherited, 2026-09-23)

- The sibling repos are read-only reference. What is reused is the system-agnostic code only:
  `engine/*.js` (no game words), the generic DSL parser, the shape of the gate and of the
  build, the Worker. No other system's data, `system/` module, css, book map or namespace comes
  across. Every word of rules text this site shows is from `titterpig-dsl-l5r5e/0.5`.
- `data/` is generated; regenerating is the only way to change it. Corpus gaps found while
  building are reported to `titterpig-dsl-l5r5e/TODO.md`, never patched in the tool.
- Rules text is verbatim. The tool's own words are labels and connective prose only. A number
  the rules state only in prose is a named constant citing its sentence.
- The art (`assets/art/`) is copied from the owner's Portents & Fortunes site by
  `build/build_art.sh` (owner, 2026-09-23: "you can use the icons, etc from … 2026 Portents &
  Fortunes"); regenerate, never hand-edit.

## What is on disk (read 2026-09-23)

| Input | State |
|---|---|
| `~/Sortilege/VTT/sortilege-vtt-l5r5e` | cloned empty 2026-09-23; remote `sortilege-inc/sortilege-vtt-l5r5e` (**PRIVATE**); identity Jordan Peacock <jordan@sortilege.online> set per repo |
| `~/Sortilege/Titterpig/DSL/titterpig-dsl-l5r5e/0.5` | 238 files, 8.6 MB, clean at `76e3d05`: 66 `.ttrpg`, 5 `.actor`, 16 `.arc`, 8 `.frame`, 69 `.codex`, 74 `.lore`; atlas: validator 164 files 0/0, 2,313 §5d sites 0 hashless, 386 GUIDANCE |
| The art | `~/Sortilege/Campaigns/2026 Portents & Fortunes/portents-and-fortunes/assets`: 14 Roll & Keep dice faces, 5 ring glyphs, 8 clan mon, favicon, the map of Rokugan |

**The inherited parser needed five extensions** (pilot, 2026-09-23: 136 of 164 DSL files parsed
unchanged); every one is 0.5 syntax no earlier corpus used, and all 164 now parse:

1. `^"Rushing Avalanche Style" [kata]` — a CURRICULUM entry, a name and its tags (`TAGGED`);
2. `1 "Blank"` — a numbered row (FACES, STEPS, DIFFICULTY_SCALE, the Twenty Questions' PHASES);
3. `^"leads" { INVERSE ^"led-by" … }` — a codex RELATIONS predicate (`BLOCK`);
4. `"3-4" { DESCRIPTION … EFFECT … }` — a row keyed by its printed label (SEVERITY_TABLE);
5. a RULES line whose id carries a macron (`#L5Rnpc03IdeYūto…`) — the lift regex was ASCII-only;
   and `^"Starting Honor" INTEGER DEFAULT 40` — the DEFAULT now binds to its property (282 of
   them; left loose it read as a keyword of its own beside it).

`.codex` joins the DSL extensions (spec §25).

### The corpus, by what the tool needs

The BASE is rich — this is the best-typed corpus the line has met — so, unlike Troika! and
VtM5e, **the player character is already declared**: `ACTOR "Samurai"` EXTENDS `ACTOR "Entity"`
(Name, Rings Air/Earth/Fire/Water/Void 1–5), with Clan, Family, School, School Rank, Skills
(`LIST OF ^"Skill"`), Techniques, Advantages, Disadvantages, Honor/Glory/Status 0–100,
Endurance, Composure, Focus, Vigilance, Fatigue, Strife, Void Points, Ninjō, Giri, Demeanor,
Equipment, Roles, Titles, Bonds, Bushidō and Experience. No D1 is needed.

| Need | In the corpus | Shape |
|---|---|---|
| The rules | 19 core `BASE` files and the sourcebooks' mechanics, 386 GUIDANCE sidebars, errata as 69 `MODIFY` blocks | typed DEFs; most of them **unhashed** `^"Name" DEF` |
| The dice | `^"Ring Die"` and `^"Skill Die"` with their `FACES` (6 and 12 rows), `^"Dice Symbols"` with its `RESOLUTION_ORDER`, `^"Check"`'s seven `STEPS`, `^"Target Number"`'s `DIFFICULTY_SCALE` 1–8 | the roller is read from these |
| Character creation | `^"Game of Twenty Questions"` (seven Parts, each question a DEF with `Question` and `Question Text`), `^"Starting Values"`, 16 Clans (`Clan Ring Bonus`, `Clan Skill Bonus`, `Clan Status`, `FAMILIES`), 42 Families (`Ring Increase` CHOOSE 1 of 2, `Skill Increases`, `Glory`, `Wealth`), 110 Schools (`Ring Increase`, `Starting Skills` CHOOSE n, `Starting Honor`, `STARTING_TECHNIQUES`, `SCHOOL_ABILITY`, `MASTERY_ABILITY`, `STARTING_OUTFIT`, `CURRICULUM` by rank), skills with `SKILL_GROUP`, 238 advantages and disadvantages by type | typed |
| Techniques | the core's 175 nested under their category (Kata, Kihō, Invocation, Ritual, Shūji, Mahō, Ninjutsu) with a `RANK`; 121 in the supplements `APPLIES TO ^"Technique"` with `Type`/`Technique Type` and `Rank` | two encodings |
| NPCs | 389 `EXTENDS ^"NPC"`: Type (Adversary/Minion), conflict ranks, Rings, Endurance/Composure/Focus/Vigilance, Honor/Glory/Status, skill groups, abilities as RULES lines | typed |
| Pregens | five `.actor` files, 27 characters `EXTENDS ^"Samurai"` | ACTOR instances |
| Adventures | 16 `.arc`: 14 as `PARTS { PART n "…" { SCENES [names] DESCRIPTION } }`, 2 (*Dark Tides*, *The Lost Writer*) as `SCENE` blocks with OBJECTIVES and CLUES; `LOCATIONS`, `KEY_NPCS`; the narrative in each adventure's `.lore` | the table's modules |
| The lore | 74 `.lore` (Markdown) and 69 `.codex` over them: 1,496 `ENTITY` nodes, `IS` a category, `RELATIONSHIPS` with verbatim `FROM` evidence, `SOURCE … AT` a heading of the lore | a graph |

## Decisions

**D1 — not needed.** The corpus declares `ACTOR "Samurai"`; the sheet derives from it.

**D2 — the books are the shelf; a book's chapters are its files** (autonomous, tool/method).
`build/build_data.py` maps each corpus file to its book by the file-name prefix
(`l5r5e-0.5-<book>-…`); the map (30 books) is the only hand list in the build and it refuses to
run if a corpus file is claimed by no book. Each book is its own data file, loaded on demand.

**D3 — (owner, 2026-09-23) private for now; the deployment origin and visibility are deferred.** The
siblings are served by GitHub Pages from `main`, which on this plan needs a **public** repo;
public publishes `data/` (the books' text verbatim, as the siblings do) and `assets/art/` (the
owner's L5R art from Portents & Fortunes). Options: public + a custom domain (e.g.
`l5r.sortilege.online` — the owner picks the name), or private and served only locally. Nothing
in the repo hard-codes an origin; the Worker admits localhost and, until D3, only
`sortilege-inc.github.io`.

## Layout (the inherited three-layer shape; everything game-specific written here)

```
index.html               the site: the books, schools, techniques, NPCs, pregens, adventures,
                         the lore, the dice, making a character, search
build/                   the generators and their gates (data and art)
data/                    GENERATED — window.L5R5E.books / .entities / .index / .records
assets/art/              COPIED from the owner's Portents & Fortunes art
engine/                  system-agnostic, copied whole from VtM5e
system/l5r5e/            accessors, the entity renderer, the dice, the sheet, the creator, the
                         site's tabs; for the table: ops, the table adapter, panels
gm/                      the GM's page, the table (vtt.html), the player's page (play.html)
worker/                  the session rooms (Cloudflare Worker + Durable Object); not deployed
assets/css/              the look (Portents & Fortunes' palette and faces)
```

## Milestones

| # | Milestone | Proof required |
|---|---|---|
| M0 | Repo skeleton: `engine/*.js`, `build/parse_dsl.py` (+5 extensions), `worker/` from VtM5e, renamed; `engine/config.js`; launch entries (`vtt-l5r5e` 8740, `vtt-l5r5e-worker` 8792); the art copied; this plan | **landed 2026-09-23** — `grep -rni 'vtm\|vampire\|troika' engine worker/src build/parse_dsl.py` matches nothing; the pilot parse reads 164 of 164 DSL files; `build_art.sh` copies 29 files |
| M1 | `build/` generates `data/` from the corpus, one file per book, losslessly; `verify_data.py` both directions **and by count**; `check_shape.py` against counts grepped from the corpus; `build.sh` | **landed 2026-09-23** — `bash build/build.sh`: 238 corpus files → 30 books, 4,666 entities (2,088 of them unhashed in the corpus, ids written here), 3,065 records; `verify_data: 31713 strings (74137 occurrences) — 0 uncovered · 0 short · 0 unsourced`; `check_shape: OK (73 assertions)`, every count from a line scan of the raw corpus (110 schools, 16 clans, 42 families, 389 NPCs, 26 pregens, 175 + 121 techniques, 61 arc PARTs, 17 SCENEs, 1,496 codex ENTITYs, 69 MODIFYs, 449 GUIDANCE ENTRYs, the Samurai ACTOR's 27 fields, the dice's 6 + 12 faces, the Twenty Questions 1–20); `node --check` on every data file. 11 MB of data; the build runs in 1.2 s |
| M2 | The site: the books (outline, reader, sidebars, tables, errata beside their targets), schools, techniques, NPCs, pregens, the adventures, the lore graph, the dice, search | **landed 2026-09-23** — browser on 8740 at 1400 px, through the real controls: the shelf lists the 30 books in four groups from `index.js`; **Schools** lists 110 in 20 groups (the 27 with no Clan grouped by their `APPLIES TO` — Gaijin 5, Ronin/Peasant/Gaijin 7 — or *No clan* 15) and *Hida Defender* opens with its Ring Increase, Starting Skills (choose 5 of 7), Starting Honor 40 (its DEFAULT), Starting Techniques, *Way of the Crab*, *The Mountain Does Not Fall*, Starting Outfit and the Curriculum as a table rank 1–6; **Techniques** 296 (Kata 75), *Battle in the Mind* reads rank 3 with its Activation and two Void ◈ opportunities; **NPCs** 389, *Loyal Bushi* shows Rings with the five glyphs, Endurance 12 … Status 39 and *Crescent Moon Style* verbatim; **Characters** 26 pregens in four adventures plus Blood of the Lioness's six *Historical personas*; **Adventures** 16 — *Mask of the Oni*'s five Parts, *The Kaiu Wall* with its Part's text and the lore section *Part Two: Arriving at the Kaiu Wall* (read-aloud as a blockquote); *Dark Tides*' SCENE *Briefing from Doji Hiroka* with its Location (*Slow Tide Harbor*), Objectives and Checks; **Lore** 1,496 codex nodes, *Kitsu Sokori* IS Person, member-of Kitsu with its evidence, *Gaku* bound to it as student-of; **Dice**: Fire 3 + Void point rolled 4 Ring + 2 Skill dice with a keep limit of 4, *Keep the best* kept 4 → *1 success · 3 opportunity · 1 strife — fails by 1*, logged; a kept (ex) (st) Ring die rolled its bonus Ring die, kept outside the limit → *2 successes · 1 strife — succeeds*; the corpus's 6 + 12 faces and the Check's seven STEPS shown; the Errata's 2019 CURRICULUM beside *Kakita Duelist*; **Search** "Striking as Earth" over all 30 books → 19 hits. A fresh tab through every tab: 0 console errors |
| M3 | The GM's page: Adventure (the 16 arcs as modules), Party, Inspector, Cast (NPCs into a scene), Dice, Rules & Book, Log, Campaign; the table and the player's page wired | **landed 2026-09-23** — browser at 1400 px, through the real controls: the shell opens on Adventure · Party · Inspector; the Adventure picker lists the 16 and choosing *Mask of the Oni* stored `campaign.modules = [mask-of-the-oni]` and drew *0 of 23 scenes done* by its five Parts; clicking *The Kaiu Wall* made it current (`current['mask-of-the-oni'] = mask-of-the-oni/2.1`) with its Part's text; **Cast** listed the arc's own cast first (Hida Nagahide, Kitsu Sokori, Atsumari no Oni — resolved from KEY_NPCS / LOCATIONS' NPCS) and **+** stored `cast['mask-of-the-oni/2.1']`; *Hida Nagahide* opens with no roller (her profile is *Loyal Bushi (core rulebook page 312)*, no Rings of her own); *Kitsu Sokori*'s printed skill groups became buttons (Artisan 0 … Trade 2), Fire took 3 from her Rings and the check logged as *GM · Kitsu Sokori · Artisan (Fire 3) TN 2*; **Party** › *add a pregenerated character* made *Ahuja Mishti* a member from the corpus entity (11 skills; Region, Upbringing, Ninjo, Past, Relationships carried as printed); on the live sheet Theology + Void 2 + a Void point rolled 3 Ring + 2 Skill dice, keep limit 3, and **Resolve** left Strife 0 → 1 (the kept (st)), Void points 2 → 1, stance Void, logged with her `memberId`. `gm/vtt.html` opened titled *The Kaiu Wall* with the 23 scenes, the Rokugan map offered and set (2200 px), tokens for the party, the scene's cast and the adventure's cast; Ahuja's token reads *Strife 1 · Fatigue 0*. `gm/play.html` shows *Join the table*. A fresh tab through every panel, the table and the player's page: 0 console errors. Under node the system op applies and the role rule holds (GM permits `setSceneCast`, a player does not) |
| M4 | The character sheet derived from `ACTOR "Samurai"`, the creator (the Twenty Questions walked over the clan / family / school data), the live sheet (strife, fatigue, Void points, conditions) and Roll & Keep checks | **landed 2026-09-23** — browser, through the real controls. *The creator* (site tab *Make a character*) lists the corpus's 20 questions under its five Parts, each with its `^"Twenty Questions"` summary row and its GUIDANCE walkthrough verbatim, the controls bound to its rule ids: Q1 offers the 16 clans of 12 books, *Crab Clan* → Earth +1, Fitness +1, Status 30; Q2 offers Crab's five families (Hida, Hiruma, Kaiu, Kuni, Yasuki), *Hida* + Earth (its Ring Increase choose 1 of Earth/Fire) → Command, Tactics +1, Glory 44, 4 koku; Q3 *Hida Defender* → Earth, Water +1, the five of seven Starting Skills chosen, Honor 40 (its DEFAULT), *Lord Hida's Grip* + the chosen *Striking as Earth*, the 7-item outfit; Q4 Fire +1; Q7 *+5 glory* (read out of the summary row); Q8 two of the seven TENETS and *+10 honor* with its six skills (read out of the walkthrough); Q9–Q13 picks from the typed Distinctions / Adversities / Passions / Anxieties; Q14, Q16 items to the equipment; Q17 Games +1; Q18 **Roll 1d10 twice** → 2 and 10, *Glorious Sacrifice* (Honor +5, Glory +5) and its d10 → 4 *A set of armor*; Q19 *Tomoe* → **Hida Tomoe**. The sheet: Honor 40+10+5 = 55, Glory 44+5+5 = 54, Status 30, Endurance 12 / Composure 12 / Focus 3 / Vigilance 1 from the corpus's formulas, and *Earth is 4 — above 3 during creation* (the Starting Values rule id). The character file round-trips byte-identically (`templateId` = the Samurai ACTOR's hash). *The table:* the file loaded through the Party panel's file input became *Hida Tomoe · Crab Clan, Hida · Hida Defender 1*; Strife raised past Composure (13 / 12) shows *compromised* on the sheet and the party card, from the ACTOR's own rule. *The site's* pregen page shows *Ide Yuina*'s sheet with a roller. 0 console errors |
| M5 | Sessions proven with `wrangler dev` on 8792; deploy is the owner's step (D3) | **landed 2026-09-23** — `wrangler dev` on **8792** (launch entry `vtt-l5r5e-worker`; `npx wrangler deploy --dry-run` bundles `system/l5r5e/ops.js`'s `setSceneCast` beside the engine's): the GM's real **Start session** went live as room **BQNVL** (status live, join link shown); a scene note written *GM ONLY: …*; a player at a second origin (`http://127.0.0.1:8740/gm/play.html?s=BQNVL`) joined by the link as role *player* and took the room's snapshot — the party, the adventure, the scene's cast — with **no GM notes** (progress reduced to `done`, party notes blank, the string *GM ONLY* nowhere in its state); **Claim** gave Hida Tomoe's live sheet (*compromised*, carried from the GM's page); Tactics + Earth 4 rolled, kept four, **Resolve** → Strife 13 → 15 on the player's page and on the GM's, the roll in the GM's Log with the same kept dice under *Hida Tomoe*, the GM's panel *1 claimed*; the player's `setSceneDone` (a GM-only op) left the GM's progress untouched; the GM's `setSceneCast` (+ Kitsu Sokori) reached the player. 0 console errors on both pages. **Deploy is the owner's step (D3):** `cd worker && npx wrangler deploy`, set `worker.deployed` in `engine/config.js`, and the origin in `wrangler.jsonc` `ALLOWED_ORIGIN` |

One commit per milestone, pushed; each proven in the browser by the main session through the
real controls (PLAYBOOK §5) before the next begins.

## Decision log

| # | Decision | Why |
|---|---|---|
| 1 | The engine, parser and Worker are copied whole from the VtM5e repo (the latest derivation, with the on-demand data loader); the Worker renamed, `ALLOWED_ORIGIN` the github.io origin until D3; local ports **8740 / 8792** | 8735–8739 and 8787–8790 belong to the siblings (8791 to two campaign sites). |
| 2 | D2 above | — |
| 3 | The parser's five extensions (above) are written into `build/parse_dsl.py` here, not back-ported to the siblings | Read-only reference; each sibling's corpus parses with its own copy. |
| 4 | **The build is a lossless shaped dump.** Any DEF that is not a property value is an entity (hashed or not — 2,088 unhashed get an id `u:` + a digest of file, parent and name); DESCRIPTION, PROPERTIES, EXTENDS, APPLIES TO, RULES, TABLE, GUIDANCE and REFERENCES are lifted to named fields **only when they have exactly the spec's shape**, and every other node — over a hundred keywords — is carried generically in `blocks` in corpus order. The system layer interprets the blocks (CURRICULUM, FACES, PARTS…) at runtime | The corpus is typed by its schema rather than by a fixed field set; a build that picks fields drops what it does not name, and the string gate cannot see a drop of a name printed thousands of times elsewhere. |
| 5 | **The gate counts.** `verify_data.py` requires each corpus string to reach the book data at least as many times as the corpus prints it (74,137 occurrences), not merely once | `CHOOSE 1 [^"Earth", ^"Fire"]` dropped would pass a presence check: "Earth" is printed thousands of times. The first build passed it with 0 short. |
| 6 | A lore chapter keeps its H1 line as written (`# Mask of the Oni — …`); the reader drops the `# ` | The first build stripped it and the gate reported 71 strings the corpus never prints. |
| 8 | `engine/render.js`'s `el()` flattens children nested to any depth (it flattened one level) | Generic, names no game; the renderer passes runs of arguments with their separators. Found by the first entity render throwing. |
| 9 | The Errata book (97 KB) loads with every book (`L5RData.ensure`) | A correction shows beside its target only when both are loaded; the 44 MODIFY targets are in eleven books. |
| 10 | A school with no `Clan` property (27 — monastic orders, Path of Waves' rōnin, peasant and gaijin schools) is grouped by whom its `APPLIES TO` names when that is not simply Samurai, else under *No clan* | The corpus prints no clan for them; the grouping words are its own. |
| 11 | In a list, a chapter's title drops the prefix the core's files share (*Legend of the Five Rings 5th Edition - *); the chapter's own page keeps the whole NAME | Presentation of the corpus's own string, not new words. |
| 12 | A bare `#hash` that names a block rather than an entity (an arc's `LOCATION ^"Slow Tide Harbor" #slow_tide_… { … }`) is shown by that block's name (`L5RData.blockNamed`) | The arc points at its own location blocks by hash; without this the link was empty. |
| 13 | Blood of the Lioness's six Advisors are listed apart, as *Historical personas* | Its `.actor` declares them an overlay a player's own samurai takes on, not `Samurai` instances; the tool keeps that distinction. |
| 14 | A codex node's IS / SOURCE / AT / RELATIONSHIPS are read into one summary (what it is, who it is bound to either way, where the lore tells it) and not repeated as raw blocks | Rendering both showed every relationship twice. |
| 15 | **The module in play is one of the sixteen arcs**, picked in the Adventure panel (`campaign.modules[0]`); a scene's id is the module id and its SCENE hash, or its Part and place (`mask-of-the-oni/2.1`); a Part with no SCENES list is itself the scene (*The Topaz Championship*'s nine) | The arc prints two shapes; ids from the corpus's own numbering survive a rebuild. |
| 16 | `gm/vtt.html` and `gm/play.html` start through `system/l5r5e/boot.js`, which loads the core and the campaign's adventure book, then the engine page; the engine is unchanged. A book loaded later asks the page to redraw with a local-only `state:remote` | The engine pages read the adventure and the sheet synchronously at start; this corpus's books load on demand. |
| 17 | A scene's cast is the GM's (`setSceneCast`), beside the arc's own named cast (KEY_NPCS, CAST, a location's NPCS, resolved to NPC entities by name); cast ids may be unhashed entities' build ids (`u:…`), stable while the file, parent and name are | As Troika; the arc names NPCs but never per scene. |
| 18 | **The sheet is derived from `ACTOR "Samurai"`** (with Entity's fields through EXTENDS); Endurance, Composure, Focus, Vigilance and the Void-point start and cap are the corpus's own FORMULA / STARTING_VALUE / MAXIMUM strings, evaluated; Compromised and Incapacitated are the ACTOR's own `WHEN [^"A" > ^"B"] THEN … IS state` RULES. A sheet's printed value wins over the formula | Nothing hand-listed. The formulas reproduce 89 of the pregens' 104 printed derived values; of the 15 that differ, 11 are Vigilance on an odd Air + Water (reported: the FORMULA's added "rounded down"), 4 are hand-authored printed values (the corpus TODO's own note). |
| 19 | A roll on the live sheet adds its kept (st) to Strife and spends 1 Void point for Seize the Moment; the stance is the ring rolled | The corpus's own sentences (Dice Symbols, Void Points USES), cited as constants in `dice.js`. |
| 20 | **The parser binds a caret to the property name before it only on the same line** — `FAMILIES { ^"Hida" ^"Hiruma" … }` is five names, not a name and its type. check_shape asserts the names in FAMILIES blocks (from a raw-text scan) and the codex's 1,282 relationships (`^"p" -> ^"x"`, one line each) | Found by the creator: Crab offered three families of five. The string gate could not see it — every string arrived, on the wrong field. |
| 21 | A numbered row that is a named DEF (`1 ^"Famous Deed" DEF { … }`, the Samurai Heritage Table) is one row with a body (`def: true`) | It parsed as a row and a loose `DEF` keyword beside it; lossless either way, but the creator needs them together. |
| 22 | **The creator binds each question to its rule ids** (`q4_choose_any_ring_plus_one` …) and reads every number from the corpus — the clan / family / school properties, "+5 glory" from Q7's summary row, "+10 honor" and six skills from Q8's walkthrough, the Heritage Table's MODIFIERS and SUB_TABLE — and the creation limits from Starting Values' rule ids. It keeps the answers and recomputes the sheet from the Starting Values, so an early answer re-flows the rest; a question's own words are kept as a field named by the question | The question DEFs carry their effects only as rule ids and comments; the ids are the corpus's statement, the comments are not read. |
| 23 | The creator loads every book (11 MB) | Clans, families, schools and advantages are spread over twelve books. |
| 24 | **(owner, 2026-09-23: "the rule should be round up anywhere that needs to be rounded, not round down") — fixed in the corpus**, not here: `core-traits` `^"Vigilance"` FORMULA → `"(Air + Water) / 2 (rounded up)"` (VERSION 0.5.1; corpus gates green). The Path of Waves kami strife followed in decision 25. The sheet reads the new FORMULA unchanged; printed and computed Vigilance now agree on 22 of 26 pregens (was 15): three print an odd sum rounded down (Iuchi Minoru, Kaeru Akiara, Tonbo Goro), Turgen's 5 is hand-authored — printed values stay as printed | The formula was the conversion's only round-down; the owner's rule is round up. |
| 25 | **(owner, 2026-09-23: "round up the Path of Waves kami strife too")** — fixed in the corpus: the four tiny-kami rules and their four lore paragraphs now read "half as much strife (rounded up)" (both files 0.5.1), a deliberate departure from the printed "(rounded down)", recorded in the corpus TODO so a verbatim check does not revert it. The corpus now contains no "rounded down" | The owner's house rule is round up everywhere; decision 24 had left the printed text alone. |
| 7 | Four shape assertions were scoped wrong at first and were corrected to what the corpus writes: CURRICULUM and STARTING_TECHNIQUES also sit on titles, a pregen and 13 errata MODIFYs of schools; a `Ring Increase` writes its CHOOSE after a fixed field or on the next line; GUIDANCE sits at a file's top level (449 ENTRYs, 386 with CONCERNS), never inside the DEF it concerns | The data was right each time; the independent scan was too narrow. |

## STOPPED HERE — to resume

**M0–M5 landed 2026-09-23**, each committed and pushed. Nothing is deployed: the repo is private,
`engine/config.js worker.deployed` is empty (D3, the owner's call).

To resume: `bash build/build.sh` (gate green), start the launch entry `vtt-l5r5e` (8740) and open
`/` and `/gm/`; for sessions also `vtt-l5r5e-worker` (8792; `worker/` has `node_modules`) and test
a player from `http://127.0.0.1:8740/gm/play.html?s=CODE`.

**D3 (owner, 2026-09-23): keep it private for now** — nothing deployed. When that changes: `cd worker && npx wrangler deploy`, set `worker.deployed` and the Worker's
`ALLOWED_ORIGIN`, make the repo public, enable Pages from `main`, add the CNAME (Troika's decision
16 is the recipe).

**Corpus defects found while building** are in `titterpig-dsl-l5r5e/TODO.md`: the Vigilance
FORMULA's "(rounded down)" — **resolved** by the owner's round-up rule (decision 24); the pregens'
`Ninjo` spelling against the ACTOR's `Ninjō` — **resolved** (owner, 2026-09-23): all 33 renamed in the five pregen files, each 0.5.1; all 26 pregens now show Ninjō in the sheet's own slot. (Three pregens' Focus also differ from Fire + Air — the corpus TODO already records
that printed derived values are hand-authored, so those are not reported; printed values win here.)
