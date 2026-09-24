#!/usr/bin/env python3
"""The gate for decision 67: every word of Behind the Veil (campaign/docs/state.html as it stood at the
move) is in the GM tabs' seed (campaign/pack/seed.json) exactly once, in its block, in order — or in
the house-rules DSL, for §10. Independent of absorb_state.py: it reads the HTML with regular
expressions, not that script's parser, and the seed's Markdown by stripping its marks.

    git show 540d3fa:campaign/docs/state.html > /tmp/state.html
    python3 campaign/source/check_absorb.py /tmp/state.html      # exit 0 = every block matches

Allowed differences, and only these: the masthead and its tag legend, the two h2 headings, the
as-of line and the prep's first sentence (all four describe the document, not the campaign); the
"N · " before an h3; and "§N" written as the tab it now points to (absorb_state.XREF).
"""
import glob
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'campaign/source'))
from absorb_state import XREF  # noqa: E402  (the one table the two share: what "§N" became)

words = lambda t: re.sub(r'\s+', ' ', t).strip()


def doc_blocks(src):
    s = Path(src).read_text()
    s = re.sub(r'<header.*?</header>', '', s, flags=re.S)
    s = re.sub(r'<div class="gm-banner">.*?</div></div>', '', s, flags=re.S)
    parts = re.split(r'(<h[234]>.*?</h[234]>)', s, flags=re.S)
    blocks, key, h3 = {}, None, None
    order = []
    for p in parts:
        m = re.match(r'<h([234])>(.*?)</h[234]>', p, re.S)
        if m:
            t = html.unescape(re.sub('<[^>]+>', '', m.group(2))).strip()
            if m.group(1) == '2':
                key = ('h2', t)
            elif m.group(1) == '3':
                h3 = re.sub(r'^\d+ · ', '', t)
                key = (h3, None)
            else:
                key = (h3, t)
            order.append(key)
            blocks[key] = []
            continue
        if key is None:
            continue
        for q in re.findall(r'<(p|li)(?: [^>]*)?>(.*?)</\1>', p, re.S):
            blocks[key].append(words(html.unescape(re.sub('<[^>]+>', '', q[1]))))
    return blocks, order


def plain(md):
    t = re.sub(r'`([^`]+)`', r'\1', md or '')
    t = re.sub(r'\[([^\]]+)\]\([^)\s]+\)', r'\1', t)
    t = re.sub(r'\[((?:SET|AGREED|SOURCE|YOURS|OPEN|MINE|NOTE)[^\]]*)\]', r'\1', t)
    t = t.replace('**', '').replace('*', '')
    t = re.sub(r'^(- |> ?)', '', t, flags=re.M)
    for n, dest in sorted(XREF.items(), key=lambda x: -len(x[1])):
        t = t.replace(dest, '§' + n)
    return [words(x) for x in re.split(r'\n\s*\n|\n(?=\S)', t) if words(x)]


def main(src):
    doc, order = doc_blocks(src)
    seed = json.loads((ROOT / 'campaign/pack/seed.json').read_text())
    gm = seed['gm']
    got = {}

    def put(key, md):
        if key in got:
            sys.exit('the seed has two blocks for %r' % (key,))
        got[key] = plain(md)

    for where in ('overview', 'places', 'people', 'pc', 'rules'):
        for x in gm[where]:
            put((x['title'], None), x['text'])
            for y in x.get('sections') or []:
                put((x['title'], y['title']), y['text'])
    put(('Threads in reserve', None), gm['threadsNote'])
    for x in seed['threads']:
        if x['id'] == 'pf-still-to-decide':
            put(('Still to decide', None), x['text'])
            for y in x.get('sections') or []:
                put(('Still to decide', y['title']), y['text'])
        else:
            put(('Threads in reserve', x['title']), x['text'])
    q = gm['questions']
    put(('Questions still in the bank', None), q['note'] + '\n\n' + '\n\n'.join(i['text'] for i in q['items']))
    s8 = next(a for a in seed['arc'] if a['id'] == 'scene-s8-white-flower')
    t8 = s8['session'] + ' — ' + s8['title']
    put((t8, None), s8['text'])
    for y in s8['sections']:
        put((t8, y['title']), y['text'])

    # the prep's lead: its first sentence described the prep; the rest is the scene's line
    prep = doc[('h2', 'NEXT SESSION — PREP')]
    lead = prep[0].split('. ', 1)
    bad = 0
    if plain(s8['summary']) != [lead[1]]:
        print('FAIL prep lead: %r' % s8['summary']); bad += 1

    dsl = words(html.unescape(' '.join(Path(f).read_text() for f in glob.glob(str(ROOT / 'campaign/dsl/*'))).replace('\\"', '"')))
    n_words = 0
    for key in order:
        if key[0] == 'h2':
            continue
        want = doc[key]
        n_words += sum(len(x.split()) for x in want)
        if key[0] == 'House rules established in play':
            for para in want:
                body = re.sub(r'^(SET|NOTE|OPEN)( \d+ \w+)? ', '', para)
                if body not in dsl:
                    print('FAIL §10 paragraph not in the DSL: ' + para[:80]); bad += 1
            continue
        have = got.pop(key, None)
        if have is None:
            print('FAIL missing from the seed: %r' % (key,)); bad += 1
        elif have != want:
            bad += 1
            print('FAIL %r' % (key,))
            for i, (a, b) in enumerate(zip(want, have)):
                if a != b:
                    print('   doc : ' + a[:200]); print('   seed: ' + b[:200]); break
            if len(want) != len(have):
                print('   %d paragraphs in the document, %d in the seed' % (len(want), len(have)))
    for key in got:
        print('FAIL in the seed but not the document: %r' % (key,)); bad += 1
    blocks = len([k for k in order if k[0] != 'h2'])
    print('%s: %d blocks, %d words — %d failures' % ('PASS' if not bad else 'FAIL', blocks, n_words, bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'campaign/docs/state.html')
