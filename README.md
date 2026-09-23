# Portents & Fortunes

A solo **Legend of the Five Rings, 5th Edition** campaign — Togashi Norikage, of the Togashi
Tattooed Order — served as an **instance** of
[sortilege-vtt-l5r5e](https://github.com/sortilege-inc/sortilege-vtt-l5r5e).

The VTT owns the root: the site at `/`, the GM's table at `/gm/`, the engine, the L5R5e system
module, and the books generated from the Titterpig corpus. The campaign owns `campaign/`.

- `campaign/PLAN.md` — the migration into this shape: decisions, milestones, their proof.
- `campaign/INSTANCE-PLAYBOOK.md` — the process, for the next campaign.

## The fork

`upstream` is the VTT. Engine and system updates arrive by

```bash
git pull upstream main
```

Upstream-owned files are never edited here — anything every L5R campaign would want is built
upstream and pulled. The instance's own root files (`engine/config.js`, `worker/wrangler.jsonc`,
`README.md`, `CNAME`, `.gitignore`, `.claude/launch.json`, `.gitattributes`) are marked
`merge=ours`, so a pull keeps this repo's copy. That needs a driver git does not store; run once
per clone:

```bash
git config merge.ours.driver true
```

## Local

Launch entries `portents` (site, 8733) and `portents-worker` (sessions, 8794).
