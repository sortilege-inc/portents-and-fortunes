#!/usr/bin/env python3
"""Draws the Chronicle's roll boxes with the owner's art (decision 78): the ring's icon before each
check named as "Skill (Ring)", a die face before each counted symbol ("3 successes", "an
opportunity", "2 strife", "an exploding success", "two explosions"), and Success / Failure as a
badge. Run it after writing a session's roll boxes in plain words; it is idempotent (it strips its
own marks first) and changes markup only: it exits 1 if any roll box's text differs afterwards.

    python3 campaign/source/roll_icons.py            # rewrites campaign/docs/chronicle.html
    python3 campaign/source/roll_icons.py --check    # exit 1 if a run would change anything

The faces stand for the symbols, not for which die rolled them: a record gives a count, rarely the
die. The one exception is FACES, where the record names the faces and the sheet fixes the dice.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'campaign/docs/chronicle.html'
ART = 'campaign/assets/'

SKILLS = ('Aesthetics|Composition|Design|Smithing|Fitness|Martial Arts(?: \\[[^\\]]+\\])?|Meditation|Tactics|'
          'Culture|Government|Medicine|Sentiment|Theology|Command|Courtesy|Games|Performance|Commerce|'
          'Labor|Seafaring|Skulduggery|Survival')
RINGS = 'Air|Earth|Fire|Water|Void'
NUM = r'(?<![\w-])(?:\d+|[Aa]n?|[Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Ss]even|[Ee]ight|[Nn]ine|[Tt]en|[Ee]leven|[Tt]welve)'

# phrases whose faces the record states and the sheet fixes: Survival 0, so ring dice only
FACES = {
    'a blank, and an opportunity with strife': [('ring_blank', 'a blank'), ('ring_ot', 'an opportunity with strife')],
    'Three blank faces': [('ring_blank', 'Three blank faces')],
}

SYMBOLS = [  # (pattern, die face, title) — first match wins at each position
    (NUM + r' (?:exploding|exploded) (?:success(?:es)?|die)\b', 'dice/skill_e', 'explosive success'),
    (NUM + r' explosions?\b', 'dice/skill_e', 'explosive success'),
    (NUM + r' blank skill dice\b', 'dice/skill_blank', 'blank'),
    (NUM + r' (?:more )?success(?:es)?\b', 'dice/skill_s', 'success'),
    (NUM + r' opportunit(?:y|ies)\b', 'dice/skill_o', 'opportunity'),
    (NUM + r' (?:more )?strife\b', 'dice/strife', 'strife'),
    (r'\bStrife \d+', 'dice/strife', 'strife'),
]


def img(cls, src, title):
    return '<img class="%s" src="%s%s.svg" alt="" title="%s">' % (cls, ART, src, title)


def strip_marks(h):
    h = re.sub(r'<img class="rr-(?:die|ring)[^"]*"[^>]*>', '', h)
    h = re.sub(r'<span class="rr-out (?:ok|no)">([^<]*)</span>', r'<b>\1</b>', h)
    return re.sub(r'<(b|span) class="sym (?:su|op|st)">([^<]*)</\1>', r'\2', h)


def mark_text(t):
    """t is a run of rr-v content with no verbatim block in it."""
    for phrase, faces in FACES.items():
        if phrase in t:
            out = phrase
            for face, words in faces:
                out = out.replace(words, img('rr-die', 'dice/' + face, face.replace('_', ' ')) + words, 1)
            t = t.replace(phrase, '\0' + out.replace(' ', '\1') + '\0')  # shield from the passes below
    pat = re.compile('|'.join('(%s)' % p for p, _, _ in SYMBOLS))

    def sym(m):
        i = next(i for i, g in enumerate(m.groups()) if g is not None)
        _, face, title = SYMBOLS[i]
        return img('rr-die' + (' st' if face == 'dice/strife' else ''), face, title) + m.group(0)
    parts = re.split(r'(\0[^\0]*\0|<[^>]+>)', t)
    t = ''.join(p if p.startswith(('<', '\0')) else pat.sub(sym, p) for p in parts)
    t = t.replace('\0', '').replace('\1', ' ')
    t = re.sub(r'(<b>)?((?:%s) \((%s)\))' % (SKILLS, RINGS),
               lambda m: img('rr-ring', 'rings/' + m.group(3).lower(), m.group(3)) + (m.group(1) or '') + m.group(2), t)
    t = re.sub(r'<b>(Success|Failure|success|failure)</b>',
               lambda m: '<span class="rr-out %s">%s</span>' % ('ok' if m.group(1).lower() == 'success' else 'no', m.group(1)), t)
    return t


def mark_value(key, v):
    out = ''.join(p if p.startswith('<div class="verb">') else mark_text(p)
                  for p in re.split(r'(<div class="verb">.*?</div>)', v, flags=re.S))
    if key == 'Check' and 'rr-ring' not in out:  # "Check: Earth — …", a ring with no skill
        out = re.sub(r'^(<b>)?(%s)\b' % RINGS, lambda m: img('rr-ring', 'rings/' + m.group(2).lower(), m.group(2)) + m.group(0), out)
    return out


def words(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h)).strip()


def main():
    src = DOC.read_text()
    boxes = 0

    def box(m):
        nonlocal boxes
        boxes += 1
        b = strip_marks(m.group(0))
        return re.sub(r'(<span class="rr-k">([^<]*)</span><span class="rr-v">)(.*?)(</span></div>)',
                      lambda n: n.group(1) + mark_value(n.group(2), n.group(3)) + n.group(4), b, flags=re.S)
    out = re.sub(r'<div class="roll-rec">.*?\n</div>', box, src, flags=re.S)
    a = [words(x) for x in re.findall(r'<div class="roll-rec">.*?\n</div>', src, re.S)]
    z = [words(x) for x in re.findall(r'<div class="roll-rec">.*?\n</div>', out, re.S)]
    bad = [i for i, (x, y) in enumerate(zip(a, z)) if x != y]
    if len(a) != len(z) or bad or words(re.sub(r'<div class="roll-rec">.*?\n</div>', '', src, flags=re.S)) != words(re.sub(r'<div class="roll-rec">.*?\n</div>', '', out, flags=re.S)):
        sys.exit('FAIL: text changed in box(es) %s' % bad)
    n = lambda s, c: len(re.findall(c, s))
    print('%d boxes · %d ring icons · %d dice · %d badges · text unchanged' % (
        boxes, n(out, 'class="rr-ring'), n(out, 'class="rr-die'), n(out, 'class="rr-out')))
    if '--check' in sys.argv:
        sys.exit(0 if out == src else 1)
    DOC.write_text(out)


if __name__ == '__main__':
    main()
