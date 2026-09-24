# Portents & Fortunes

A solo **Legend of the Five Rings (5th Edition)** campaign site — the chronicle of
**Togashi Norikage**, a Dragon Clan monk of the Togashi Tattooed Order, born the winter
the *Wrath of the Kami* fell silent.

Styled after [legendofthefiverings.com](https://www.legendofthefiverings.com): parchment
ground, Imperial crimson (`#B62432`), a high-contrast display serif (Cormorant) with
condensed-sans furniture (Barlow Condensed), and clan *mon*.

## Structure

No build step — hand-authored static HTML, meant for GitHub Pages.

| Path | What it is |
|------|------------|
| `index.html` | Home — masthead + section grid |
| `map/` | **Interactive map** — the Rokugan overview; click a clan's territory to descend into its own detailed regional map (pan/zoom). `map.js` holds the territory polygons + region config. |
| `character/` | Togashi Norikage's narrative dossier |
| `chronicle/` | Session-by-session record (scaffolded — play has not begun) |
| `dramatis-personae/` | The cast known so far |
| `atlas/` | Gazetteer of the Dragon lands (map-pin targets live here as `#anchors`) |
| `lore/` | The Emerald Empire — Dragon Clan, the Togashi Order, the elemental imbalance, Bushidō |
| `gm/` | **Behind the Veil** — the GM's campaign-state document, spoiler-gated |
| `assets/` | Optimized maps, portrait, location art, clan `mon/`, ring icons, and dice-face SVGs (`dice/`) |

## The map

`map/map.js` defines each clan territory as a polygon (percentage coordinates) over the
master map, plus the detailed region image it opens. Six Great Clans are charted
(Dragon, Crane, Crab, Lion, Phoenix, Unicorn); the Scorpion lands and the Shadowlands
are marked *not yet charted*. The Dragon region carries location pins linked to the Atlas.

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
