#!/usr/bin/env python3
"""
convert_norikage.py — one-way conversion of Norikage's sheets into the campaign's DSL layer, as
instances of the corpus's ACTOR "Samurai".

    python3 campaign/source/convert_norikage.py

The record is campaign/source/norikage-sheets/: the old site's three sheet blocks, copied BYTE FOR
BYTE from its play/index.html (sheet-data.json — the live sheet; sheet-s5.json, sheet-s3.json — the
archived ones) and its SHEET_HISTORY block (sheet-history.js — each archive's label, date and tracker
state). play/ is retired (campaign/PLAN.md M5); these copies are what every check runs against.

campaign/dsl/portents-norikage.actor carries each sheet in every field the Samurai ACTOR declares, in
the corpus's pregen conventions (skills as "Name N" strings, techniques, advantages and disadvantages
as references to the corpus's own entities — by hash where the corpus hashes them, by name where it
does not, which the layer's names gate checks), and what the sheet adds: the stance, XP spent and its
ledger, and the mystical tattoo Blood of the Kami links (decision 28). The two archives are their own
DEFs, each ^"Version Of" the current one, with the label and date the old picker showed.
"""
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAMURAI = '#L5R003xY4zA6bC8dE0fG2hI ^"Samurai"'
TECH, ADV, DIS = '#L5R350fG9hI1jK3lM5nO7p ^"Technique"', '#L5R263hI5jK7lM9nO1pQ3r ^"Advantage"', '#L5R264sT6uV8wX0yZ2aB4c ^"Disadvantage"'
# the corpus's own name for each of his, and its hash where the corpus gives one
TECHNIQUES = {"Earth Needs No Eyes": "#wipC0ms8dqRk9zuBoXaerX", "Breaking Blow": "#lAQIjKFkZekzmFES1nowZn",
              "Lord Togashi’s Insight": ("#HPyhRH2w9P002W4dTymcYl", "Lord Togashi's Insight")}
SKILL_NAME = {"unarmed": "Martial Arts [Unarmed]"}
# his advantages and disadvantages by the corpus's hash (H1 hashed every entity). Brushwork names two
# corpus entities; his sheet tags it a Passion, and the core's is the Passion (the other is a local DEF
# on a Children of the Five Winds pregen).
PECULIARITIES = {"Portentous Birth": "#VtGG4mA3gym8wzlhbPWde8", "Affect of Harmlessness": "#d4joKnGux2q36R0L7nv0dE",
                 "Brushwork": "#wG9SV1FU94iO9j2HugJf3x", "Elemental Deficiency (Fire)": "#ocx9KUG0GPag26Fk6SduZL",
                 "Tip of the Tongue": "#ap1yY0Fuo1k4JYA1bEG1hA"}
ADVANTAGE_TAGS = {"Distinction", "Passion"}
DISADVANTAGE_TAGS = {"Adversity", "Anxiety"}


def q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


SHEETS = os.path.join(HERE, "campaign/source/norikage-sheets")
CURRENT_ID, CURRENT_NAME = "#PFpcTogashiNorikage", "Togashi Norikage"


def history():
    """Each archive's id, label, date and state, from the SHEET_HISTORY block as the old page printed it."""
    src = open(os.path.join(SHEETS, "sheet-history.js"), encoding="utf-8").read()
    out = []
    for m in re.finditer(r'\{ id:"(\w+)", label:"([^"]*)", date:"([^"]*)",.*?state:\{ strife:(\d+), fatigue:(\d+), "void":(\d+), stance:"(\w+)" \}', src, re.S):
        out.append({"id": m.group(1), "label": m.group(2).encode().decode("unicode_escape"), "date": m.group(3),
                    "state": {"strife": int(m.group(4)), "fatigue": int(m.group(5)), "void": int(m.group(6)), "stance": m.group(7)}})
    return out


def fields(s, state=None):
    techs = []
    tattoos = []
    for t in s["techniques"]:
        if t.get("kind") == "school":      # the school ability comes with the School; its tattoo is his
            if t.get("motif") and t.get("linkedKiho"):
                tattoos.append((t["motif"].title(), t["linkedKiho"]))
            continue
        ref = TECHNIQUES[t["name"]]
        h, nm = (ref if isinstance(ref, tuple) else (ref, t["name"]))
        techs.append('%s ^"%s"' % (h, nm))
    adv = ['%s ^"%s"' % (PECULIARITIES[p["name"]], p["name"]) for p in s["peculiarities"] if p["tag"] in ADVANTAGE_TAGS]
    dis = ['%s ^"%s"' % (PECULIARITIES[p["name"]], p["name"]) for p in s["peculiarities"] if p["tag"] in DISADVANTAGE_TAGS]
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
        '^"Void Points" INTEGER %d' % (state["void"] if state else s["trackers"]["void"]["max"]),
        '^"Ninjō" STRING %s' % q(s["ninjo"]),
        '^"Giri" STRING %s' % q(s["giri"]),
        '^"Skills" LIST OF STRING [%s]' % ", ".join(q(x) for x in skills),
        '^"Techniques" LIST OF %s [%s]' % (TECH, ", ".join(techs)),
        '^"Advantages" LIST OF %s [%s]' % (ADV, ", ".join(adv)),
        '^"Disadvantages" LIST OF %s [%s]' % (DIS, ", ".join(dis)),
        '^"Equipment" LIST OF STRING [%s]' % ", ".join(q(x) for x in equipment),
        '^"Bushido" DEF { ^"Paramount Tenet" STRING %s ^"Less Significant Tenet" STRING %s }' % (q(s["bushido"]["paramount"]), q(s["bushido"]["less"])),
        '^"Experience" INTEGER %d' % s["xp"]["earned"],
        # what the sheet adds to the ACTOR's fields
        '^"Experience Spent" INTEGER %d' % s["xp"]["spent"],
    ]
    if s["xp"].get("spentOn"):
        # a ledger line: cost · what · note · when, as the old sheet printed its columns
        P.append('^"Experience Ledger" LIST OF STRING [%s]' % ", ".join(q(" · ".join(str(x) for x in [e["cost"], e["what"], e.get("note") or "", e.get("when") or ""])) for e in s["xp"]["spentOn"]))
    P.append('^"Stance" STRING %s' % q((state["stance"] if state else s["stance"]).title()))
    if state:
        P += ['^"Strife" INTEGER %d' % state["strife"], '^"Fatigue" INTEGER %d' % state["fatigue"]]
    if tattoos:
        P.append('^"Mystical Tattoos" DEF { ' + " ".join('^"%s" STRING %s' % (m, q(k)) for m, k in tattoos) + " }")
    return P


def block(h, name, P, comment=None):
    return ("    # %s\n" % comment if comment else "") + """    %s ^"%s" DEF {
        EXTENDS %s
        PROPERTIES {
%s
        }
    }
""" % (h, name, SAMURAI, "\n".join("            " + p for p in P))


def main():
    cur = json.load(open(os.path.join(SHEETS, "sheet-data.json"), encoding="utf-8"))
    blocks = [block(CURRENT_ID, CURRENT_NAME, fields(cur), "The live sheet (sheet-data.json). Blood of the Kami's tattoo is read by campaign/site/blood-of-the-kami.js.")]
    for hv in history():
        s = json.load(open(os.path.join(SHEETS, "sheet-%s.json" % hv["id"]), encoding="utf-8"))
        P = ['^"Version Of" %s ^"%s"' % (CURRENT_ID, CURRENT_NAME), '^"Version Label" STRING %s' % q(hv["label"]), '^"Version Date" STRING %s' % q(hv["date"])] + fields(s, hv["state"])
        blocks.append(block(CURRENT_ID + hv["id"].upper(), "%s (%s)" % (CURRENT_NAME, hv["label"].split(" · ")[0]), P,
                            "Archived: sheet-%s.json, with the label, date and between-sessions state SHEET_HISTORY gave it." % hv["id"]))
    text = """EXTENSION "Portents_Characters" {
    NAME "Portents & Fortunes — the player character"
    VERSION "0.2.1"
    SPEC_VERSION "0.5"
    RELEASE_DATE "2026-09-23"
    DEPENDS_ON "L5R5e_Core_Core"

    # Togashi Norikage, an instance of the Samurai ACTOR in the corpus's pregen conventions, with his
    # two archived sheets. Converted from campaign/source/norikage-sheets/ (the old site's sheets, byte
    # for byte) by campaign/source/convert_norikage.py; campaign/source/check_norikage.py reads the
    # built layer back against them field by field.

%s}
""" % "\n".join(blocks)
    with open(os.path.join(HERE, "campaign/dsl/portents-norikage.actor"), "w", encoding="utf-8") as fh:
        fh.write(text)
    print("wrote campaign/dsl/portents-norikage.actor: the live sheet and %d archived versions" % (len(blocks) - 1))


if __name__ == "__main__":
    main()
