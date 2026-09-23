# Instance playbook — a campaign site as an instance of a Sortilege VTT

**Status: DRAFT.** Written before the first migration (Portents & Fortunes into
`sortilege-vtt-l5r5e`, `PLAN.md` beside this file). Each section is confirmed or corrected as
its milestone lands; once the instance works, the general parts move upstream into the VTT's
own `PLAYBOOK.md` (M9).

## What an instance is

A campaign repo that **is a fork of its system's VTT**. The VTT owns the root — the site at
`/`, the GM's table at `/gm/`, the engine, the system module, the generated books. The
campaign owns `campaign/` and a short list of root files. Campaign material is presented
*inside* the VTT's framing: as site tabs and GM panes the campaign registers, not as a second
site beside it.

This replaces the VTT PLAYBOOK §4 as first written ("a campaign is an instance, not part of the
repo", a pack in a separate repo). The pack still exists; it now lives in the campaign's own
repo, which is the instance.

## The boundary

| Owned by | Paths | Rule |
|---|---|---|
| Upstream | everything not listed below | **Never edited in the instance.** A change every campaign of this system would want is built upstream and pulled. |
| The instance, at the root | `engine/config.js`, `worker/wrangler.jsonc`, `README.md`, `CNAME`, `.claude/launch.json` | Per-origin and per-deployment. Marked `merge=ours` in `.gitattributes`, so an upstream pull never overwrites them. |
| The instance | `campaign/`, `.claude/skills/` | Everything the campaign authors. |

`merge=ours` needs a driver git does not store in the repo. Run once per clone:

```bash
git config merge.ours.driver true
```

## Where a thing goes

| It is… | It goes in… | Because |
|---|---|---|
| Game data that must be right — an NPC's statblock, a PC, a house rule | `campaign/dsl/`, in the Titterpig DSL | The VTT's build parses it into `data/campaign.js` through the same two-way gate as the books. A house rule is a `MODIFY`, shown beside the rule it changes the way errata are. |
| State that changes during play — the arc and its scenes, open threads, live notes, the party's tracks | the pack, `campaign/pack/campaign.json` + dated `snapshots/` | Edited in the tool; saved from the live room; archive first, then change. |
| Authored prose — the GM's state document, the chronicle, the gazetteer | `campaign/docs/` | Written and reviewed as files; the VTT renders them in its tabs and panes. |
| Presentation only — what a player has revealed, portraits, notes on how an NPC was built | `campaign/site/`, keyed by entity id | Not game data; kept out of the gate. |
| Code | upstream if generic; `campaign/site/` through the extension hook if not | A feature one campaign needs today, every campaign of the system needs tomorrow. |
| Art | `campaign/assets/` | The campaign's own; upstream's `assets/` stays upstream's. |

## Standing up an instance

The order the first migration is taking; each step is proven before the next.

1. **Decide visibility.** A public instance publishes the VTT's `data/` — the books, verbatim.
   The first push carrying it is the point of publication.
2. **Fork.** Add the VTT as `upstream`; `git merge upstream/main --allow-unrelated-histories`
   at the root; move the campaign's existing files under `campaign/` unchanged in the same
   merge. Set the instance-owned root files, `.gitattributes`, and the merge driver. Prove a
   second pull merges clean.
3. **Homebrew into the DSL.** NPCs, PCs and house rules under `campaign/dsl/`; the gate green.
4. **Characters onto the VTT sheet.** Keep each original record verbatim in `campaign/source/`
   and check every version against it field by field.
5. **Integrate.** Register the campaign's tabs and panes from `campaign/site/`; render
   `campaign/docs/`; seed the pack.
6. **Deploy.** Pages for the site; the Worker for sessions, with this origin in its
   `ALLOWED_ORIGIN`; a player joins from a second origin.

## Open, to be settled by the first migration

- The exact shape of the extension hook (M2).
- How a pack-authored arc sits beside the published arcs in the Adventure panel (M6).
- Whether the encounter builder can band Group Rank against Encounter Rank: the corpus's
  comparison table did not survive conversion in 0.4; to be rechecked in 0.5 (M6) and reported
  to the corpus TODO if still missing.
