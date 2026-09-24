#!/usr/bin/env python3
"""Behind the Veil into the GM tabs (decision 67): the one-time move of campaign/docs/state.html into
the campaign pack's GM material — gm.{overview, places, people, pc, rules, threadsNote, questions},
threads and the arc — written into campaign/pack/seed.json, which fills the GM's campaign once
(engine/state.js seed). After the move the pack is the source; this script is kept as the record of
how the text was carried, and is run only against the state.html in git history:

    git show 540d3fa:campaign/docs/state.html > /tmp/state.html
    python3 campaign/source/absorb_state.py /tmp/state.html
    git show 1865759^:campaign/docs/state.html > /tmp/state-s6.html     # Session Seven's own prep
    python3 campaign/source/absorb_state.py --s7 /tmp/state-s6.html      # → campaign/source/seed-s7.json

Deterministic: the HTML's own markup becomes the GM Markdown (system/l5r5e/gm-text.js) — a tag
span → [SET 23 Sep], <strong> → **…**, <em> → *…*, <code> → `…`, <a> → [text](href), <li> → "- ",
<blockquote> → "> ". No word is changed but the document's references to its own numbered
sections ("§5"), which point at their new tabs instead (XREF); campaign/source/check_absorb.py
proves it, block by block.
§10 (house rules established in play) is not carried: every paragraph of it is already, verbatim,
in campaign/dsl/portents-house-rules.ttrpg, which the sheet reads; the check proves that too.
"""
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / 'campaign/pack/seed.json'

ELDERS = ['#PFnpcKitsukiSadao', '#PFnpcUme', '#PFnpcHeisuke', '#PFnpcNui', '#PFnpcGenzo', '#PFnpcKiyo', '#PFnpcRokuro']
JURI = ['#PFnpcKaitoJuri']
NORIKAGE = ['Togashi Norikage']
# where each h3 goes: (destination, id, about)
HOMES = {
    'The premise': ('overview', 'pf-premise', None),
    'The posting': ('overview', 'pf-posting', None),
    'Seiya Fusae': ('people', 'pf-seiya-fusae', ['#PFnpcSeiyaFusae']),
    'The disturbance': ('overview', 'pf-disturbance', None),
    'White Flower Village': ('places', 'pf-white-flower', None),
    'The country': ('places', 'pf-country', None),
    'The elders': ('people', 'pf-elders', ELDERS),
    'What Norikage believes': ('pc', 'pf-norikage-believes', NORIKAGE),
    'Where Norikage stands': ('pc', 'pf-norikage-stands', NORIKAGE),
    'House rules established in play': ('dsl', None, None),
    'How he plays': ('overview', 'pf-how-he-plays', None),
    'Threads in reserve': ('threads', None, None),
    'Reisui-ji': ('places', 'pf-reisui-ji', None),
    'Uncleanliness and purification': ('rules', 'pf-purification', None),
    'Session Eight — White Flower at nightfall': ('arc', 'scene-s8-white-flower', None),
    'Kaito Juri': ('people', 'pf-kaito-juri', JURI),
    'What Juri can teach': ('people', 'pf-juri-teaches', JURI),
    'Still to decide': ('thread', 'pf-still-to-decide', None),
    'Questions still in the bank': ('questions', None, None),
}


# the document's own cross-references, to sections that now live in tabs: "§N" → "Tab › Section"
# (the only words the move changes; check_absorb.py allows exactly these)
XREF = {
    '4': 'Portents & Fortunes › The disturbance', '5': 'Places › White Flower Village', '6': 'Places › The country',
    '7': 'Cast › The elders', '12': 'Threads', '14': 'Rules › Uncleanliness and purification',
}


def xref(text):
    def sub(m):
        if m.group(1) not in XREF:
            sys.exit('a reference to §' + m.group(1) + ' has no new home')
        return XREF[m.group(1)]
    return re.sub(r'§\s?(\d+)', sub, text)


def slug(t):
    t = html.unescape(t).lower()
    t = re.sub(r'[ōŌ]', 'o', t)
    t = re.sub(r'[ūŪ]', 'u', t)
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


class Blocks(HTMLParser):
    """The document as a flat list of blocks: ('h2'|'h3'|'h4', text) and ('p'|'li'|'quote', markdown)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.buf = None        # markdown being collected for the current block
        self.kind = None
        self.skip = 0          # inside the masthead / banner
        self.quote = 0
        self.href = []
        self.tag = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class') or ''
        if tag == 'header' or 'gm-banner' in cls:
            self.skip += 1
            return
        if self.skip:
            if tag in ('header', 'div'):
                self.skip += 1
            return
        if tag == 'blockquote':
            self.quote += 1
        elif tag in ('h2', 'h3', 'h4', 'p', 'li'):
            self.kind = 'quote' if (tag == 'p' and self.quote) else tag
            self.buf = []
        elif self.buf is None:
            return
        elif tag == 'span' and 'tag' in cls.split():
            self.buf.append('[')
            self.tag = True
        elif tag == 'strong' or tag == 'b':
            self.buf.append('**')
        elif tag == 'em' or tag == 'i':
            self.buf.append('*')
        elif tag == 'code':
            self.buf.append('`')
        elif tag == 'a':
            self.buf.append('[')
            self.href.append(a.get('href', ''))
        elif tag == 'br':
            self.buf.append('\n')

    def handle_endtag(self, tag):
        if self.skip:
            if tag in ('header', 'div'):
                self.skip -= 1
            return
        if tag == 'blockquote':
            self.quote -= 1
        elif tag in ('h2', 'h3', 'h4', 'p', 'li') and self.buf is not None:
            text = ''.join(self.buf)
            text = re.sub(r'[ \t]*\n[ \t]*', '\n', re.sub(r'[ \t\r]+', ' ', text)).strip()
            self.out.append((self.kind, text))
            self.buf = None
        elif self.buf is None:
            return
        elif tag == 'span' and self.tag:
            self.buf.append(']')
            self.tag = False
        elif tag in ('strong', 'b'):
            self.buf.append('**')
        elif tag in ('em', 'i'):
            self.buf.append('*')
        elif tag == 'code':
            self.buf.append('`')
        elif tag == 'a':
            self.buf.append('](' + self.href.pop() + ')')

    def handle_data(self, data):
        if not self.skip and self.buf is not None:
            self.buf.append(data)


def join(blocks):
    """Paragraphs as blocks; a run of list items as one list; a run of quote paragraphs as one quote."""
    out = []
    for kind, text in blocks:
        if kind == 'li':
            line = '- ' + text.replace('\n', ' ')
            if out and out[-1][0] == 'li':
                out[-1] = ('li', out[-1][1] + '\n' + line)
            else:
                out.append(('li', line))
        elif kind == 'quote':
            q = '\n'.join('> ' + l for l in text.split('\n'))
            if out and out[-1][0] == 'quote':
                out[-1] = ('quote', out[-1][1] + '\n>\n' + q)
            else:
                out.append(('quote', q))
        else:
            out.append((kind, text))
    return xref('\n\n'.join(t for _, t in out))


def tree(blocks):
    """h3 sections with their h4 subsections; the prep h2's first paragraph kept apart."""
    secs, cur, sub, prep_intro, h2 = [], None, None, None, None
    for kind, text in blocks:
        if kind == 'h2':
            h2 = text
            cur = sub = None
            continue
        if kind == 'h3':
            cur = {'title': re.sub(r'^\d+ · ', '', text), 'h2': h2, 'body': [], 'subs': []}
            sub = None
            secs.append(cur)
            continue
        if kind == 'h4':
            sub = {'title': text, 'body': []}
            cur['subs'].append(sub)
            continue
        if cur is None:
            if h2 and 'PREP' in h2 and kind == 'p':
                prep_intro = text
            continue          # the as-of line under the first h2
        (sub or cur)['body'].append((kind, text))
    return secs, prep_intro


def main(src):
    p = Blocks()
    p.feed(Path(src).read_text())
    secs, prep_intro = tree(p.out)
    gm = {'overview': [], 'places': [], 'people': [], 'pc': [], 'rules': []}
    threads, arc, questions, note = [], [], None, None
    seen = set()
    for s in secs:
        home = HOMES.get(s['title'])
        if not home:
            sys.exit('no home for §' + s['title'])
        seen.add(s['title'])
        dest, sid, about = home
        subs = [{'id': (sid or 'pf') + '-' + slug(x['title']), 'title': x['title'], 'text': join(x['body'])} for x in s['subs']]
        sec = {'id': sid, 'title': s['title'], 'text': join(s['body'])}
        if subs:
            sec['sections'] = subs
        if about:
            sec['about'] = about
        if dest in gm:
            gm[dest].append(sec)
        elif dest == 'threads':
            note = join(s['body'])
            for x in s['subs']:
                threads.append({'id': 'pf-thread-' + slug(x['title']), 'title': x['title'], 'text': join(x['body']), 'open': True})
        elif dest == 'thread':
            sec['open'] = True
            threads.append(sec)
        elif dest == 'arc':
            # "Session Eight — White Flower at nightfall": the session groups it, the rest is its name;
            # the prep's lead paragraph, after its first sentence (which described the prep), is its line
            session, title = s['title'].split(' — ', 1)
            lead = re.sub(r'^\*|\*$', '', prep_intro or '')
            summary = lead.split('. ', 1)[1] if '. ' in lead else None
            arc.append({'id': sid, 'title': title, 'session': session, 'summary': summary, 'text': sec['text'], 'sections': subs, 'played': False})
        elif dest == 'questions':
            items = [t for k, t in s['body'] if k == 'li']
            lead = [t for k, t in s['body'] if k != 'li']
            questions = {'note': '\n\n'.join(lead), 'items': [{'id': 'pf-q-%02d' % (i + 1), 'text': t, 'asked': False} for i, t in enumerate(items)]}
    missing = set(HOMES) - seen
    if missing:
        sys.exit('not found in the document: ' + ', '.join(sorted(missing)))
    gm['threadsNote'] = note
    gm['questions'] = questions

    seed = json.loads(SEED.read_text())
    # Session Seven's two scenes, played: their prep as the document had it before the Session Seven
    # roll-forward (campaign/source/seed-s7.json, written by `--s7`)
    s7 = json.loads((ROOT / 'campaign/source/seed-s7.json').read_text())
    seed['arc'] = s7 + arc
    seed['threads'] = threads
    seed['gm'] = gm
    SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=1) + '\n')
    n = lambda l: sum(1 + len(x.get('sections') or []) for x in l)
    print('seed: overview %d, places %d, people %d, pc %d, rules %d (sections+subsections), threads %d, arc %d, questions %d'
          % (n(gm['overview']), n(gm['places']), n(gm['people']), n(gm['pc']), n(gm['rules']), len(threads), len(seed['arc']), len(questions['items'])))


S7 = {'Session Seven — coming down': ('scene-s7-coming-down', 'Coming down'),
      'Later in Session Seven — the ambush on the track': ('scene-s7-ambush', 'The ambush on the track')}


def session_seven(src):
    """Session Seven's two prep scenes, from the document as it stood before they were played
    (git show 1865759^:campaign/docs/state.html) → campaign/source/seed-s7.json. The prep's lead
    paragraph, after its first sentence, is the first scene's line, as for Session Eight."""
    p = Blocks()
    p.feed(Path(src).read_text())
    secs, lead = tree(p.out)
    out = []
    for s in secs:
        if s['title'] not in S7:
            continue
        sid, title = S7[s['title']]
        x = {'id': sid, 'title': title, 'session': 'Session Seven'}
        if not out and lead:
            x['summary'] = re.sub(r'^\*|\*$', '', lead).split('. ', 1)[1]
        x['text'] = join(s['body'])
        x['sections'] = [{'id': sid + '-' + slug(y['title']), 'title': y['title'], 'text': join(y['body'])} for y in s['subs']]
        x['played'] = True
        out.append(x)
    assert len(out) == 2, [s['title'] for s in secs]
    (ROOT / 'campaign/source/seed-s7.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print('seed-s7: %s' % ', '.join('%s (%d beats)' % (x['title'], len(x['sections'])) for x in out))


if __name__ == '__main__':
    if sys.argv[1:2] == ['--s7']:
        session_seven(sys.argv[2])
    else:
        main(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'campaign/docs/state.html')
