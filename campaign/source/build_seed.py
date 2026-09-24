#!/usr/bin/env python3
"""M7: the seed pack — the arc and the ambush from the Session Seven prep → campaign/pack/seed.json.

engine/state.js seeds the campaign from it once, filling only what the campaign has never had
(`defaultCampaign.seed` in engine/config.js). Nothing here is written by hand: each scene is one of
the prep's scene headings in the state document (campaign/docs/state.html, Behind the Veil), its text
the paragraphs under that heading before its first sub-heading, as the document prints them, then
its sub-headings as the beats. The encounter is the one the prep builds for the ambush: three
Desperate Bandits and one Experienced Bandit (core pp. 315–316), by their corpus ids.

    python3 campaign/source/build_seed.py
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CAMPAIGN = os.path.dirname(HERE)
STATE = os.path.join(CAMPAIGN, "docs", "state.html")
OUT = os.path.join(CAMPAIGN, "pack", "seed.json")

SCENES = [   # the prep's scene headings, as printed (Behind the Veil › NEXT SESSION — PREP)
    ("scene-s7-coming-down", "Session Seven — coming down"),
    ("scene-s7-ambush", "Later in Session Seven — the ambush on the track"),
]
ENCOUNTER = {
    "id": "enc-s7-ambush", "name": "The ambush on the track", "kind": "combat",
    "npcs": [{"id": "#L5RNeBf6FulQvXet32tLKy", "count": 3},     # Desperate Bandit (Minion, combat 1)
             {"id": "#L5RN1GQqE5DWdCgWDuBB2C", "count": 1}],    # Experienced Bandit (Adversary, combat 3)
}


def text(frag):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", frag))).strip()


def main():
    doc = open(STATE, encoding="utf-8").read()
    prep = doc[doc.index("<h2>NEXT SESSION — PREP</h2>"):]
    h3s = [(m.start(), text(m.group(1))) for m in re.finditer(r"<h3>(.*?)</h3>", prep, re.S)]
    arc = []
    for sid, title in SCENES:
        at = [i for i, (pos, t) in enumerate(h3s) if t == title]
        if len(at) != 1:
            raise SystemExit("scene heading not found once in the prep: %r" % title)
        start = h3s[at[0]][0]
        end = h3s[at[0] + 1][0] if at[0] + 1 < len(h3s) else len(prep)
        body = prep[start:end]
        first_h4 = body.find("<h4>")
        lead = [text(p) for p in re.findall(r"<p>(.*?)</p>", body[: first_h4 if first_h4 >= 0 else len(body)], re.S)]
        beats = [text(h) for h in re.findall(r"<h4>(.*?)</h4>", body, re.S)]
        arc.append({"id": sid, "title": title, "played": False,
                    "text": "\n".join(lead + ["— " + b for b in beats] + ["(Behind the Veil › Next session — prep)"])})
    pack = {"kind": "sortilege-vtt-campaign", "version": 1, "arc": arc, "encounters": [ENCOUNTER]}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(pack, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    # proof: every lead line and beat is a text of the document
    flat = text(prep)
    for s in arc:
        for ln in s["text"].split("\n")[:-1]:
            if ln.lstrip("— ") not in flat:
                raise SystemExit("not in the document: %r" % ln)
    print("build_seed: %d scenes (%s), %d encounter (%s); every line is the document's own → %s"
          % (len(arc), " · ".join("%d lines" % len(s["text"].split("\n")) for s in arc), 1, ENCOUNTER["name"], os.path.relpath(OUT)))


if __name__ == "__main__":
    main()
