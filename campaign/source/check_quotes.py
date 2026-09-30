#!/usr/bin/env python3
"""Every *quote* after a [SOURCE] tag in a prep file must appear verbatim in the source it names: a
corpus file (`name.lore`, in titterpig-dsl-l5r5e/0.5) or "Celestial Realms p. N" (the PDF's page N+1,
for the book's pages not yet in the corpus). Quote style and line breaks are not content (folded); a name of eight words or fewer may differ
in case, since headings are printed in capitals.

    python3 campaign/source/check_quotes.py campaign/prep/2026-09-30.json      # exit 0 = all found
"""
import json, re, subprocess, sys
from pathlib import Path
CORPUS = Path.home() / 'Sortilege/Titterpig/DSL/titterpig-dsl-l5r5e/0.5'
PDFS = {'Celestial Realms': (Path.home() / 'Sortilege/Titterpig/Utilities/titterpig-doublecheck/input/celestial-realms/celestial-realms.pdf', 1)}
fold = lambda t: re.sub(r'\s+', ' ', re.sub(r'-\s*\n\s*', '', t).replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('\\"', '"')).strip()

def texts(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'text' and isinstance(v, str): yield v
            else: yield from texts(v)
    elif isinstance(obj, list):
        for v in obj: yield from texts(v)

bad = n = 0
for para in (p for t in texts(json.load(open(sys.argv[1]))) for p in t.split('\n\n')):
    m = re.match(r'\[SOURCE\] (?:`([^`]+)`|(Celestial Realms) p\. (\d+))', para)
    if not m: continue
    if m.group(1):
        f = next(CORPUS.glob('l5r5e-0.5-' + m.group(1)), None)
        if not f:
            bad += 1
            print('NO SUCH CORPUS FILE: %s' % m.group(1))
            continue
        src = fold(f.read_text())
    else:
        pdf, off = PDFS[m.group(2)]
        src = fold(subprocess.run(['pdftotext', '-f', str(int(m.group(3)) + off), '-l', str(int(m.group(3)) + off), str(pdf), '-'], capture_output=True, text=True).stdout)
    for q in re.findall(r'(?<![*\w])\*([^*]+)\*(?![*\w])', para):
        n += 1
        # a heading-length quote (a name) may differ in case only: headings are printed in capitals
        if fold(q) not in src and not (len(q.split()) <= 8 and fold(q).lower() in src.lower()):
            bad += 1
            print('NOT FOUND in %s: %s' % (m.group(1) or m.group(2) + ' p. ' + m.group(3), q[:90]))
print('%s: %d quotes, %d not found' % ('PASS' if not bad else 'FAIL', n, bad))
sys.exit(1 if bad else 0)
