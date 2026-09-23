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
| The instance, at the root | `engine/config.js`, `worker/wrangler.jsonc`, `README.md`, `CNAME`, `.gitignore`, `.claude/launch.json`, `.gitattributes` | Per-origin and per-deployment. Marked `merge=ours` in `.gitattributes`, so an upstream pull never overwrites them. |
| The instance | `campaign/`, `.claude/skills/` | Everything the campaign authors. |

`merge=ours` needs a driver git does not store in the repo. Run once per clone:

```bash
git config merge.ours.driver true
```

Without it the attribute does nothing and an upstream change to `engine/config.js` conflicts
(proven, Portents M1). The driver runs only when both sides changed a file; every
instance-owned file differs from upstream's copy by design, so it always engages on them.

`.gitignore` joins the list: upstream ignores `.claude/*`, so the instance adds
`!.claude/skills/` to keep its project skills tracked.

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
2. **Fork**, in three commits on a branch — pushing it publishes `data/`, so the branch stays
   local until the visibility decision says otherwise:
   1. **Move** every existing campaign file under `campaign/` with `git mv`, nothing else.
      Prove it: `git show --name-status` lists only `R100` entries, and the stat reads zero
      insertions and zero deletions.
   2. **Merge**: add the VTT as `upstream`, then
      `git merge --allow-unrelated-histories upstream/main`. After the move the only
      collision left should be `.gitignore` — resolve it as the union (step 3's list).
   3. **Boundary**: set the instance-owned root files, write `.gitattributes`, run
      `git config merge.ours.driver true`.

   **Prove the boundary by making it fail first**, in a throwaway clone: commit a fake
   upstream change to `engine/config.js` and to an upstream-owned file on a branch from
   upstream's head, then merge it — without the driver it must conflict on `config.js`; with
   it, `config.js` keeps the instance's copy and the upstream-owned file takes the change.
   Then a real `git pull upstream main` must merge clean. Check every link statically too:
   moving a site by one prefix keeps relative links, but only if none is root-absolute.

   **In the browser, distrust the first load of `/`.** The old home is cached at the same URL,
   and a local server sends no cache headers: force it with `fetch(url, {cache:'reload'})`
   before reading anything, or you will be proving the old site. Its asset requests are also
   what puts old root paths in the server log as 404s — check a 404's timestamp before chasing
   it. The live site has the same hazard for a player on the day of the switch.
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
