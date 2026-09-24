#!/usr/bin/env python3
"""
check_norikage.py — the conversion's proof for Norikage: each of his three sheets, read back from the
BUILT layer (campaign/data/campaign.js), field by field against the old site's own record
(campaign/source/norikage-sheets/: sheet-data.json, sheet-s5.json, sheet-s3.json, and the archives'
labels, dates and state in sheet-history.js).

    python3 campaign/source/check_norikage.py

Every field the old sheet holds is compared or named as not carried, with the reason. Exit 1 on any
difference.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(HERE, "campaign/source"))
from convert_norikage import SHEETS, CURRENT_ID, SKILL_NAME, ADVANTAGE_TAGS, DISADVANTAGE_TAGS, history  # noqa: E402

# what the VTT reads elsewhere, not from these fields — named so nothing is skipped silently
NOT_CARRIED = {
    "id": "the old page's key; the entity's id is #PFpcTogashiNorikage",
    "portrait": "presentation — campaign/site/portraits.js (checked below for the live sheet)",
    "gear": "each item's name is in Equipment (checked); its stats are the corpus's (Bō: Polearms, 6/2, 2-hand)",
    "deficiency": "derived from his Elemental Deficiency adversity (checked)",
    "trackers": "their maxima are derived: composure, endurance, the Void ring (checked)",
}


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
        vk = p.get("vk")
        if vk in ("scalar", "enum"):
            out[p["name"]] = p.get("value", p.get("default"))
        elif vk == "list":
            out[p["name"]] = [arg(x) for x in p.get("items", [])]
        elif vk == "def":
            out[p["name"]] = {f["name"]: f.get("value") for f in p.get("fields", [])}
        elif vk == "ref":
            out[p["name"]] = (p.get("ref") or {}).get("hash")
    return out


def compare(label, s, P, state=None, hv=None):
    rows = []
    def eq(field, old, new):
        rows.append((field, old, new, old == new))
    eq("name", s["name"], P.get("Name"))
    eq("clan", s["clan"], P.get("Clan"))
    eq("family", s["family"], P.get("Family"))
    eq("school", s["school"], P.get("School"))
    eq("rank", s["rank"], P.get("School Rank"))
    eq("role", [s["role"]], P.get("Roles"))
    for r in ("air", "earth", "fire", "water", "void"):
        eq("rings." + r, s["rings"][r], (P.get("Rings") or {}).get(r.title()))
    for k in ("endurance", "composure", "focus", "vigilance"):
        eq("derived." + k, s["derived"][k], P.get(k.title()))
    eq("trackers.strife.max = composure", s["trackers"]["strife"]["max"], P.get("Composure"))
    eq("trackers.fatigue.max = endurance", s["trackers"]["fatigue"]["max"], P.get("Endurance"))
    eq("trackers.void.max = Void ring", s["trackers"]["void"]["max"], (P.get("Rings") or {}).get("Void"))
    eq("stance", (state["stance"] if state else s["stance"]).title(), P.get("Stance"))
    for k in ("honor", "glory", "status"):
        eq("social." + k, s["social"][k], P.get(k.title()))
    eq("xp.earned", s["xp"]["earned"], P.get("Experience"))
    eq("xp.spent", s["xp"]["spent"], P.get("Experience Spent"))
    led = [" · ".join(str(x) for x in [e["cost"], e["what"], e.get("note") or "", e.get("when") or ""]) for e in s["xp"].get("spentOn", [])]
    eq("xp.spentOn", led, P.get("Experience Ledger", []))
    eq("skills", sorted("%s %d" % (SKILL_NAME.get(k, k.title()), v) for k, v in s["skills"].items()), sorted(P.get("Skills") or []))
    eq("bushido.paramount", s["bushido"]["paramount"], (P.get("Bushido") or {}).get("Paramount Tenet"))
    eq("bushido.less", s["bushido"]["less"], (P.get("Bushido") or {}).get("Less Significant Tenet"))
    eq("ninjo", s["ninjo"], P.get("Ninjō"))
    eq("giri", s["giri"], P.get("Giri"))
    eq("money (in Equipment)", True, s["money"] in (P.get("Equipment") or []))
    eq("gear names (in Equipment)", [g["name"] for g in s["gear"]], [x for x in (P.get("Equipment") or []) if x != s["money"]])
    tech = [t["name"].replace("’", "'") for t in s["techniques"] if t.get("kind") != "school"]
    eq("techniques", tech, P.get("Techniques"))
    school = [t for t in s["techniques"] if t.get("kind") == "school"]
    eq("Blood of the Kami tattoo", {t["motif"].title(): t["linkedKiho"] for t in school if t.get("motif")}, P.get("Mystical Tattoos") or {})
    eq("advantages", [p["name"] for p in s["peculiarities"] if p["tag"] in ADVANTAGE_TAGS], P.get("Advantages"))
    eq("disadvantages", [p["name"] for p in s["peculiarities"] if p["tag"] in DISADVANTAGE_TAGS], P.get("Disadvantages"))
    eq("deficiency → Elemental Deficiency", True, "Elemental Deficiency (%s)" % s["deficiency"].title() in (P.get("Disadvantages") or []))
    if state:
        eq("state.strife", state["strife"], P.get("Strife"))
        eq("state.fatigue", state["fatigue"], P.get("Fatigue"))
        eq("state.void", state["void"], P.get("Void Points"))
        eq("version label", hv["label"], P.get("Version Label"))
        eq("version date", hv["date"], P.get("Version Date"))
        eq("version of", CURRENT_ID, P.get("Version Of"))
    else:
        portraits = open(os.path.join(HERE, "campaign/site/portraits.js"), encoding="utf-8").read()
        eq("portrait (portraits.js)", True, ("'%s': '%s'" % (CURRENT_ID, s["portrait"].replace("../", "campaign/"))) in portraits)
    bad = [r for r in rows if not r[3]]
    print("== %s: %d fields, %d differ" % (label, len(rows), len(bad)))
    for f, o, n, ok in rows:
        if not ok:
            print("   DIFFERS  %-34s old=%r  built=%r" % (f, o, n))
    return len(rows), len(bad)


def main():
    E = built()
    by_id = {h: e for h, e in E.items()}
    total = bad = 0
    s = json.load(open(os.path.join(SHEETS, "sheet-data.json"), encoding="utf-8"))
    extra = sorted(set(s) - {"name", "clan", "family", "school", "rank", "role", "rings", "derived", "stance", "social", "xp", "skills", "bushido", "ninjo", "giri", "money", "techniques", "peculiarities"} - set(NOT_CARRIED))
    if extra:
        print("fields of the old sheet this check does not know: %s" % extra); sys.exit(1)
    n, b = compare("Current (sheet-data.json)", s, props(by_id[CURRENT_ID]))
    total += n; bad += b
    for hv in history():
        s = json.load(open(os.path.join(SHEETS, "sheet-%s.json" % hv["id"]), encoding="utf-8"))
        n, b = compare("%s (sheet-%s.json)" % (hv["label"], hv["id"]), s, props(by_id[CURRENT_ID + hv["id"].upper()]), hv["state"], hv)
        total += n; bad += b
    for k, why in NOT_CARRIED.items():
        print("   not a field of the sheet: %-10s %s" % (k, why))
    print("check_norikage: %s — %d fields compared across 3 sheets, %d differ" % ("OK" if not bad else "FAILED", total, bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
