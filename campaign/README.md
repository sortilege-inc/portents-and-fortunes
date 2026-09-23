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
| `play/` | **Interactive L5R5e character sheet** — rings, skills, stances, techniques, honor/glory/status, live strife·fatigue·void trackers, and a Roll & Keep dice roller. Character data is the JSON in `play/index.html`; renderer + roller in `play/sheet.js`. |
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

`play/index.html` contains a `window.SHEET` JSON blob (derived from the Foundry VTT actor
export). Rules text — techniques, distinctions/adversities/passions/anxieties, gear — is
reproduced **verbatim**. The roller uses the official Ring (d6) and Skill (d12) faces;
trackers persist in `localStorage`. Void stance correctly suppresses strife from kept dice.

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
