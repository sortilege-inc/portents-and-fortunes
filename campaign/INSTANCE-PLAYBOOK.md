# Instance playbook — moved upstream (M9)

The process this file recorded while Portents & Fortunes became the first instance of a Sortilege
VTT is now the family's general guide:

- **`INSTANCES.md`** in `~/Sortilege/VTT/` (beside the VTT repos, in none of them) — the boundary,
  pulling upstream, where each kind of thing goes, standing an instance up, deploying it, the hook.
- **`PLAYBOOK.md` §4**, beside it — the model in one paragraph.

What stays here is what is Portents' own:

- **The plan and decision log** — `PLAN.md` beside this file: owner decisions O1–O9, milestones
  M0–M9, every call made along the way (decisions 1–60+), each with its proof.
- **Upstream** is `sortilege-vtt-l5r5e` (private), remote `upstream`; its `PLAN.md` § *Instances*
  (I1–I16) records the generic work Portents drove: the hook, the layer build, the GM's three
  panes, the seed and gated Notes, the player's page on a phone, the Conflict tab, advancement.
- **The instance's own scripts** — `campaign/source/`: `convert_*.py` (one-way conversions, kept for
  provenance; `convert_house_rules.py` must not be re-run), `check_npcs.py`, `check_norikage.py`,
  `migrate_docs.py`, `scope_css.py`; `absorb_state.py` and `check_absorb.py` (the one-time move of
  Behind the Veil into the GM tabs, and its every-word gate).
- **Deploy** — Pages from `main` at portents.sortilege.online (HTTPS enforced); the Worker
  `portents-vtt`, redeployed after any upstream op change (`cd worker && npx wrangler deploy`).
