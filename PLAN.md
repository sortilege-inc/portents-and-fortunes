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

**D3 — PROPOSED: the deployment origin, and the repo's visibility** (owner's call). The
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
| M1 | `build/` generates `data/` from the corpus, one file per book, losslessly; `verify_data.py` both directions **and by count**; `check_shape.py` against counts grepped from the corpus; `build.sh` | |
| M2 | The site: the books (outline, reader, sidebars, tables, errata beside their targets), schools, techniques, NPCs, pregens, the adventures, the lore graph, the dice, search | |
| M3 | The GM's page: Adventure (the 16 arcs as modules), Party, Inspector, Cast (NPCs into a scene), Dice, Rules & Book, Log, Campaign; the table and the player's page wired | |
| M4 | The character sheet derived from `ACTOR "Samurai"`, the creator (the Twenty Questions walked over the clan / family / school data), the live sheet (strife, fatigue, Void points, conditions) and Roll & Keep checks | |
| M5 | Sessions proven with `wrangler dev` on 8792; deploy is the owner's step (D3) | |

One commit per milestone, pushed; each proven in the browser by the main session through the
real controls (PLAYBOOK §5) before the next begins.

## Decision log

| # | Decision | Why |
|---|---|---|
| 1 | The engine, parser and Worker are copied whole from the VtM5e repo (the latest derivation, with the on-demand data loader); the Worker renamed, `ALLOWED_ORIGIN` the github.io origin until D3; local ports **8740 / 8792** | 8735–8739 and 8787–8790 belong to the siblings (8791 to two campaign sites). |
| 2 | D2 above | — |
| 3 | The parser's five extensions (above) are written into `build/parse_dsl.py` here, not back-ported to the siblings | Read-only reference; each sibling's corpus parses with its own copy. |
