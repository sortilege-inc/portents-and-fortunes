# Portents & Fortunes

A solo **Legend of the Five Rings (5th Edition)** campaign site — the chronicle of
**Togashi Norikage**, a Dragon Clan monk of the Togashi Tattooed Order, born the winter
the *Wrath of the Kami* fell silent.

Styled after [legendofthefiverings.com](https://www.legendofthefiverings.com): parchment
ground, Imperial crimson (`#B62432`), a high-contrast display serif (Cormorant) with
condensed-sans furniture (Barlow Condensed), and clan *mon*.

## Structure

The campaign is an instance of the L5R5e VTT (`PLAN.md`, `INSTANCE-PLAYBOOK.md`): the VTT owns the
site at `/` and the GM's table at `/gm/`, and the campaign lives inside them — its pages as site
tabs, its GM material (what was Behind the Veil) in the GM's own tabs, in the campaign pack. No
build step for the pages; the scripts in
`source/` regenerate what is generated.

| Path | What it is |
|------|------------|
| `docs/` | The campaign's documents, drawn by the site tabs: `home`, `characters` and `norikage` (the *Norikage* tab), `chronicle`, `map`, `atlas` (map-pin targets are its `id`s), `lore`, `personae` (the cast's masthead). Player-facing only: the GM's material is in the pack |
| `site/` | What the campaign adds to the VTT's pages (`engine/config.js` → `instance`): `site.js` (the tabs), `personae.js` (the Dramatis Personae, drawn from the DSL layer with discovery), `map.js` (the interactive map), `rail.js` (the Chronicle's rail), `npc-meta.js` (portraits, reveals, build notes), `campaign.css` (generated: the old stylesheets scoped to `.pf-doc`) and `pf.css` (hand-written fit) |
| `dsl/` | The homebrew layer: the 18 NPCs, Norikage, the house rules → `data/` by `build/build_layer.sh` |
| `pack/seed.json` | The GM's material — Behind the Veil, moved into the GM tabs by `source/absorb_state.py` (decision 67) — and the arc and encounters. It fills what the GM's campaign has never had, entry by entry; from then on the pack, edited in the tabs, is the source. Later additions (a new session's prep) go in as new entries |
| `assets/` | Maps, portraits, location art, clan `mon/`, ring icons, dice faces |
| `source/` | Records kept verbatim (Norikage's sheets, the old `npcs.js`), the stylesheet sources (`css/`), and the conversion scripts and their checks |

## The map

`site/map.js` defines each clan territory as a polygon (percentage coordinates) over the
master map, plus the detailed region image it opens. Six Great Clans are charted
(Dragon, Crane, Crab, Lion, Phoenix, Unicorn); the Scorpion lands and the Shadowlands
are marked *not yet charted*. The Dragon region carries location pins linked to the Atlas tab
(`#map/dragon` opens it there).

## The character sheet

Norikage plays on the VTT's own sheet (`/gm/play.html` for the player, the GM's table at `/gm/`),
built from `dsl/portents-norikage.actor` — his live sheet and his two archived ones (*Session Five*,
*Session Three*), converted from the old sheet's records, which are kept byte for byte in
`source/norikage-sheets/` and checked field by field by `source/check_norikage.py`. The old `play/`
page is retired (PLAN.md M5); its saved trackers and roll log are imported once by
`site/import-old-sheet.js`.

## Local preview

```bash
python3 -m http.server 8733 --directory .
```

Then open <http://localhost:8733/>. (A `portents` entry is also registered in the Claude
Code launch config on port 8733.)

## Sources & credits

- Character, rules, and setting facts derive from the L5R5e corpus (`titterpig-dsl-l5r5e`)
  and the Foundry actor export. Rules text is verbatim from those sources.
- Clan *mon*, ring, and dice-face icons: the community
  [teaml5r/l5r5e](https://gitlab.com/teaml5r/l5r5e) Foundry system assets.
- Maps and character art supplied by the campaign owner.
- The `ingest/` folder (source PDFs, audio, exports) is git-ignored.

*Legend of the Five Rings is © Fantasy Flight Games / Edge Studio. This is a personal,
non-commercial fan campaign archive.*
