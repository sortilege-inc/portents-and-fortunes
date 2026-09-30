#!/usr/bin/env python3
"""New prep into the seed: campaign/prep/<date>.json's entries join campaign/pack/seed.json by id — arc
scenes after the last scene, threads and gm lists at their ends. An id already in the seed is left
as it is. The GM's campaign takes them on its next load (engine/state.js seed fills new ids); an entry
the GM has since removed is not re-added. Check the quotes first:

    python3 campaign/source/check_quotes.py campaign/prep/2026-09-30.json
    python3 campaign/source/add_prep.py campaign/prep/2026-09-30.json
"""
import json, sys
from pathlib import Path
SEED = Path(__file__).resolve().parents[2] / 'campaign/pack/seed.json'
seed, prep = json.loads(SEED.read_text()), json.loads(Path(sys.argv[1]).read_text())
added = []
def join(into, items):
    have = {x['id'] for x in into}
    for x in items:
        if x['id'] not in have:
            into.append(x); added.append(x['id'])
join(seed.setdefault('arc', []), prep.get('arc', []))
join(seed.setdefault('threads', []), prep.get('threads', []))
for k, v in (prep.get('gm') or {}).items():
    join(seed.setdefault('gm', {}).setdefault(k, []), v)
SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=1) + '\n')
print('added %d: %s' % (len(added), ', '.join(added) or '-'))
