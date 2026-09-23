#!/usr/bin/env python3
"""
check_npcs.py — the conversion's proof: every NPC in the old site's npcs.js, read back from the
BUILT layer (campaign/data/campaign.js), field by field.

    python3 campaign/source/check_npcs.py [--only <npc id>]

A field matches when the built value equals the old one. Two differences are expected and are
reported as such, not as failures: a one-line ability whose text is now the 0.5 corpus's own line
(typographic quotes in the old copy, or 0.4 → 0.5 drift — convert_npcs.py reports which), and a
technique now referenced rather than copied. Exit 1 on any unexpected difference or missing NPC.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(HERE, "campaign/source"))
from convert_npcs import TECHNIQUES, camel, load_npcs, norm  # noqa: E402


def built():
    src = open(os.path.join(HERE, "campaign/data/campaign.js"), encoding="utf-8").read()
    return json.loads(re.search(r"var d=(\{.*\});var T=window\.L5R5E", src, re.S).group(1))["entities"]


def arg(a):
    for k in ("s", "c", "i", "b", "w"):
        if k in a:
            return a[k]
    if "l" in a:
        return [arg(x) for x in a["l"]]
    return a.get("h")


def props(e):
    out = {}
    for p in e.get("props", []):
        if p.get("vk") in ("scalar", "enum"):
            out[p["name"]] = p.get("value", p.get("default"))
        elif p.get("vk") == "list":
            out[p["name"]] = [arg(x) for x in p.get("items", [])]
        elif p.get("vk") == "def":
            out[p["name"]] = {f["name"]: f.get("value", f.get("default")) for f in p.get("fields", [])}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    a = ap.parse_args()
    ents = built()
    npcs = load_npcs()
    if a.only:
        npcs = [n for n in npcs if n["id"] == a.only]
    bad = 0
    for n in npcs:
        h = "#PFnpc" + camel(n["id"])
        e = ents.get(h)
        if not e:
            print("MISSING %s (%s)" % (n["id"], h))
            bad += 1
            continue
        s, P = n["stat"], props(e)
        want = {
            "name": (e["name"], n["name"]),
            "Type": (P.get("Type"), s["kind"]),
            "Combat Conflict Rank": (P.get("Combat Conflict Rank"), s["combatRank"]),
            "Intrigue Conflict Rank": (P.get("Intrigue Conflict Rank"), s["intrigueRank"]),
            "Description": (P.get("Description"), s.get("description")),
            "Rings": (P.get("Rings"), {k.title(): v for k, v in s["rings"].items()}),
            "Endurance": (P.get("Endurance"), s["endurance"]), "Composure": (P.get("Composure"), s["composure"]),
            "Focus": (P.get("Focus"), s["focus"]), "Vigilance": (P.get("Vigilance"), s["vigilance"]),
            "Silhouette": (P.get("Silhouette"), s.get("silhouette")),
            "Honor": (P.get("Honor"), s["honor"]), "Glory": (P.get("Glory"), s["glory"]), "Status": (P.get("Status"), s["status"]),
            "Demeanor": (P.get("Demeanor"), s["demeanor"]),
            "Social Skill Check TN Modifiers": (P.get("Social Skill Check TN Modifiers"), s["tnMods"]),
            "Skills": (P.get("Skills"), ["%s %d" % (g.title(), s["skills"][g]) for g in ("artisan", "martial", "scholar", "social", "trade")]),
            "Advantages": (P.get("Advantages"), s.get("advantages") or None),
            "Disadvantages": (P.get("Disadvantages"), s.get("disadvantages") or None),
            "Favored Weapons": (P.get("Favored Weapons"), s.get("weapons") or None),
            "Gear": (P.get("Gear"), s.get("gear") or None),
            "Gear (Other)": (P.get("Gear (Other)"), s.get("gearOther") or None),
            "Epithet": (P.get("Epithet"), n.get("epithet")),
            "Affiliation": (P.get("Affiliation"), n.get("affil")),
            "Campaign Status": (P.get("Campaign Status"), n.get("status")),
            "Biography": (P.get("Biography"), n.get("bio") or None),
            "Template": (P.get("Template"), True if n.get("template") else None),
        }
        diffs = [k for k, (got, exp) in want.items() if got != exp]
        # abilities: RULES lines (by name) and the Techniques references
        rules = {}
        for r in e.get("rules", []):
            # a RULES line is kept verbatim as `slug "Name: text"` (build_data.py), as the corpus's are
            m = re.match(r'^[a-z0-9_]+\s+"(.*)"$', r.get("text") or "", re.S)
            t = m.group(1).replace('\\"', '"') if m else (r.get("text") or "")
            rules[t.split(":", 1)[0].split(" (", 1)[0]] = t
        techs = P.get("Techniques") or []
        ab_notes = []
        for ab in s.get("abilities", []):
            if ab["name"] in TECHNIQUES:
                if ab["name"] not in techs:
                    diffs.append("technique " + ab["name"])
                else:
                    ab_notes.append("%s → reference" % ab["name"])
                continue
            got = rules.get(ab["name"])
            if got is None:
                diffs.append("ability " + ab["name"])
                continue
            old_line = "%s: %s" % (ab["name"], ab["text"])
            head, _, body = got.partition(": ")
            if got == old_line:
                pass
            elif norm(body) != norm(ab["text"]):
                ab_notes.append("%s → the 0.5 line (TEXT DRIFT)" % ab["name"])
            elif head != ab["name"]:
                ab_notes.append("%s → the 0.5 line (its tag printed in the name%s)" % (ab["name"], ", and straight quotes" if body != ab["text"] else ""))
            else:
                ab_notes.append("%s → the 0.5 line (straight quotes)" % ab["name"])
        n_fields = len(want) + len(s.get("abilities", []))
        if diffs:
            bad += 1
            print("DIFFERS %-20s %s" % (n["id"], "; ".join(diffs)))
            for k in diffs:
                if k in want:
                    print("          %s: built %r / old %r" % (k, want[k][0], want[k][1]))
        else:
            print("ok      %-20s %d fields and %d abilities match%s" % (n["id"], len(want), len(s.get("abilities", [])),
                  ("  [" + "; ".join(ab_notes) + "]") if ab_notes else ""))
    print("check_npcs: %s — %d of %d NPCs" % ("OK" if not bad else "FAILED", len(npcs) - bad, len(npcs)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
