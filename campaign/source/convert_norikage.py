#!/usr/bin/env python3
"""
convert_norikage.py — one-way conversion of Norikage's sheet (the old site's play/index.html) into
the campaign's DSL layer, as an instance of the corpus's ACTOR "Samurai".

    python3 campaign/source/convert_norikage.py

1. The three sheet blocks — the live one and the two archived versions — are copied BYTE FOR BYTE
   into campaign/source/norikage-sheets/ (sheet-data.json, sheet-s5.json, sheet-s3.json). They are
   the record every later check runs against.
2. campaign/dsl/portents-norikage.actor carries the CURRENT sheet in every field the Samurai ACTOR
   declares, in the corpus's pregen conventions (l5r5e-0.5-*-pregens.actor): skills as "Name N"
   strings, techniques, advantages and disadvantages as references to the corpus's own entities
   (by hash where the corpus hashes them, by name where it does not — the layer's names gate
   checks them). What the ACTOR does not declare — the stance, the trackers' live values, the XP
   ledger, the archived versions — is the sheet's to carry (campaign/PLAN.md, M4 and M5).
"""
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAMURAI = '#L5R003xY4zA6bC8dE0fG2hI ^"Samurai"'
TECH, ADV, DIS = '#L5R350fG9hI1jK3lM5nO7p ^"Technique"', '#L5R263hI5jK7lM9nO1pQ3r ^"Advantage"', '#L5R264sT6uV8wX0yZ2aB4c ^"Disadvantage"'
# the corpus's own name for each of his, and its hash where the corpus gives one
TECHNIQUES = {"Earth Needs No Eyes": "#wipC0ms8dqRk9zuBoXaerX", "Breaking Blow": "#lAQIjKFkZekzmFES1nowZn",
              "Lord Togashi’s Insight": ("#HPyhRH2w9P002W4dTymcYl", "Lord Togashi's Insight")}
SKILL_NAME = {"unarmed": "Martial Arts [Unarmed]"}
ADVANTAGE_TAGS = {"Distinction", "Passion"}
DISADVANTAGE_TAGS = {"Adversity", "Anxiety"}


def q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def main():
    page = open(os.path.join(HERE, "campaign/play/index.html"), encoding="utf-8").read()
    out_dir = os.path.join(HERE, "campaign/source/norikage-sheets")
    os.makedirs(out_dir, exist_ok=True)
    blocks = {}
    for sid, body in re.findall(r'<script id="(sheet-[a-z0-9-]+)" type="application/json">\n?(.*?)</script>', page, re.S):
        with open(os.path.join(out_dir, sid + ".json"), "w", encoding="utf-8") as fh:
            fh.write(body)
        blocks[sid] = body
    s = json.loads(blocks["sheet-data"])

    techs = []
    for t in s["techniques"]:
        if t.get("kind") == "school":
            continue                      # the school ability comes with the School
        ref = TECHNIQUES[t["name"]]
        h, nm = (ref if isinstance(ref, tuple) else (ref, t["name"]))
        techs.append('%s ^"%s"' % (h, nm))
    adv = ['^"%s"' % p["name"] for p in s["peculiarities"] if p["tag"] in ADVANTAGE_TAGS]
    dis = ['^"%s"' % p["name"] for p in s["peculiarities"] if p["tag"] in DISADVANTAGE_TAGS]
    left = [p["name"] for p in s["peculiarities"] if p["tag"] not in ADVANTAGE_TAGS | DISADVANTAGE_TAGS]
    if left:
        raise SystemExit("a peculiarity of no known kind: %s" % left)
    skills = ["%s %d" % (SKILL_NAME.get(k, k.title()), v) for k, v in s["skills"].items()]
    equipment = [g["name"] for g in s["gear"]] + [s["money"]]
    r, d, so = s["rings"], s["derived"], s["social"]
    P = [
        '^"Name" STRING %s FIXED' % q(s["name"]),
        '^"Clan" STRING %s FIXED' % q(s["clan"]),
        '^"Family" STRING %s FIXED' % q(s["family"]),
        '^"School" STRING %s' % q(s["school"]),
        '^"School Rank" INTEGER %d' % s["rank"],
        '^"Roles" LIST OF STRING [%s]' % q(s["role"]),
        '^"Rings" DEF { ' + " ".join('^"%s" INTEGER %d' % (k.title(), r[k]) for k in ("air", "earth", "fire", "water", "void")) + " }",
        '^"Honor" INTEGER %d' % so["honor"], '^"Glory" INTEGER %d' % so["glory"], '^"Status" INTEGER %d' % so["status"],
        '^"Endurance" INTEGER %d' % d["endurance"], '^"Composure" INTEGER %d' % d["composure"],
        '^"Focus" INTEGER %d' % d["focus"], '^"Vigilance" INTEGER %d' % d["vigilance"],
        '^"Void Points" INTEGER %d' % s["trackers"]["void"]["max"],
        '^"Ninjō" STRING %s' % q(s["ninjo"]),
        '^"Giri" STRING %s' % q(s["giri"]),
        '^"Skills" LIST OF STRING [%s]' % ", ".join(q(x) for x in skills),
        '^"Techniques" LIST OF %s [%s]' % (TECH, ", ".join(techs)),
        '^"Advantages" LIST OF %s [%s]' % (ADV, ", ".join(adv)),
        '^"Disadvantages" LIST OF %s [%s]' % (DIS, ", ".join(dis)),
        '^"Equipment" LIST OF STRING [%s]' % ", ".join(q(x) for x in equipment),
        '^"Bushido" DEF { ^"Paramount Tenet" STRING %s ^"Less Significant Tenet" STRING %s }' % (q(s["bushido"]["paramount"]), q(s["bushido"]["less"])),
        '^"Experience" INTEGER %d' % s["xp"]["earned"],
    ]
    text = """EXTENSION "Portents_Characters" {
    NAME "Portents & Fortunes — the player character"
    VERSION "0.1.0"
    SPEC_VERSION "0.5"
    RELEASE_DATE "2026-09-23"
    DEPENDS_ON "L5R5e_Core_Core"

    # Togashi Norikage, an instance of the Samurai ACTOR in the corpus's pregen conventions.
    # Converted once from the old site's sheet by campaign/source/convert_norikage.py; the three
    # original sheets are kept byte for byte in campaign/source/norikage-sheets/. This file holds
    # the fields the ACTOR declares; the stance, live tracks, XP ledger and archived versions are
    # the sheet's (campaign/PLAN.md, M4 and M5).

    #PFpcTogashiNorikage ^"Togashi Norikage" DEF {
        EXTENDS %s
        PROPERTIES {
%s
        }
    }
}
""" % (SAMURAI, "\n".join("            " + p for p in P))
    with open(os.path.join(HERE, "campaign/dsl/portents-norikage.actor"), "w", encoding="utf-8") as fh:
        fh.write(text)
    print("kept %d sheet blocks byte for byte in campaign/source/norikage-sheets/ (%s)" % (len(blocks), ", ".join(sorted(blocks))))
    print("wrote campaign/dsl/portents-norikage.actor: %d fields" % len(P))


if __name__ == "__main__":
    main()
