#!/usr/bin/env python3
"""
convert_npcs.py — one-way conversion of the old site's Dramatis Personae (npcs.js) into the
campaign's DSL layer (campaign/dsl/portents-npcs.ttrpg) and its presentation metadata
(campaign/site/npc-meta.js). Kept for provenance; once run, the DSL is the source of truth.

    python3 campaign/source/convert_npcs.py [--only <npc id>]

Each NPC becomes a hashed DEF on the corpus's NPC chassis, in the corpus's own field names
(l5r5e-0.5-core-npcs.ttrpg). What is game data goes into the DSL, through the layer's gate:
the statblock, the NPC's campaign description, epithet, affiliation, standing and biography.
What is presentation goes into the metadata: portrait, what a player has revealed, and the
note on how the NPC was built.

Abilities:
  * a one-line ability is a RULES line. Its text is looked up in the 0.5 corpus by name; when
    the corpus prints it, the corpus's line is used as printed and any difference from the old
    site's copy (which came from the 0.4 corpus) is reported. When it does not, the old
    site's "Name: text" is used and reported as not found.
  * a technique the corpus defines (npcs.js copied its Activation / Effects paragraphs) is a
    reference in ^"Techniques", by hash where the corpus has one and by name where it does not.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORPUS = os.path.expanduser("~/Sortilege/Titterpig/DSL/titterpig-dsl-l5r5e/0.5")
NPC_TYPE = '#t4540de6f35155c46f41f0 ^"NPC"'
TECH_TYPE = '#L5R350fG9hI1jK3lM5nO7p ^"Technique"'
# the seven techniques npcs.js copied whole; the corpus's own entity is referenced instead
TECHNIQUES = {
    "By the Light of the Lord Moon": "#92FDBSLYNzoMbnc4ueKtnX",
    "Summon Fog": "#BvozMnAavOlJGFN8CUZHo9",
    "Tempest of Air": "#mQA8bcf9pDPdbetjIcw9Dr",
    "Vapor of Nightmares": "#BNwrARfqANunt8AvWaaUZR",
    "Divination": "#bNxt2ZFUbgSKhc6XxSTMUh",
    "Truth Burns through Lies": "#CUVTW0xoeEbzJYrll6mbV7",
    "One within the Void": None,          # unhashed in the corpus: referenced by name
}


def q(s):
    """A DSL string literal: escapes only."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def camel(npc_id):
    return "".join(p[:1].upper() + p[1:] for p in re.split(r"[^A-Za-z0-9]+", npc_id) if p)


def slug(s):
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s.lower())).strip("_")


def load_npcs():
    js = os.path.join(HERE, "campaign/source/npcs.js")
    out = subprocess.run(["node", "-e", "global.window={};require(%s);process.stdout.write(JSON.stringify(window.NPCS))" % json.dumps(js)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def corpus_rule_lines():
    """Every RULES line text in the 0.5 corpus: (file, text), text as printed inside its quotes."""
    rx = re.compile(r'^\s*#[^\s:]+:\s*[a-z0-9_]+\s+"(.*)"\s*$')
    lines = []
    for fn in sorted(os.listdir(CORPUS)):
        if not fn.endswith(".ttrpg"):
            continue
        for ln in open(os.path.join(CORPUS, fn), encoding="utf-8"):
            m = rx.match(ln)
            if m:
                lines.append((fn, m.group(1).replace('\\"', '"')))
    return lines


def find_line(lines, name):
    """The corpus lines that print this ability: 'Name: …' or 'Name (Tag): …'."""
    return [(f, t) for f, t in lines if t.startswith(name + ":") or t.startswith(name + " (")]


def norm(t):
    """For MATCHING only: the old site set its copies with curly quotes where the corpus has
    straight ones. What is written is always the corpus's own string."""
    return t.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')


STR_RX = re.compile(r'"((?:[^"\\]|\\.)*)"')


def corpus_strings():
    """Every quoted string in the 0.5 corpus's .ttrpg files, unescaped: (file, text)."""
    out = []
    for fn in sorted(os.listdir(CORPUS)):
        if fn.endswith(".ttrpg"):
            for m in STR_RX.finditer(open(os.path.join(CORPUS, fn), encoding="utf-8").read()):
                out.append((fn, m.group(1).replace('\\"', '"').replace("\\\\", "\\")))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    npcs = load_npcs()
    if a.only:
        npcs = [n for n in npcs if n["id"] == a.only]
    lines = corpus_rule_lines()
    strs = corpus_strings()
    report = []
    body, meta = [], {}
    for n in npcs:
        s = n["stat"]
        h = "#PFnpc" + camel(n["id"])
        P = []
        P.append('^"Type" STRING %s FIXED' % q(s["kind"]))
        P.append('^"Combat Conflict Rank" INTEGER %d' % s["combatRank"])
        P.append('^"Intrigue Conflict Rank" INTEGER %d' % s["intrigueRank"])
        if s.get("description"):
            P.append('^"Description" STRING %s' % q(s["description"]))
        r = s["rings"]
        P.append('^"Rings" DEF {\n' + "".join('                ^"%s" INTEGER %d\n' % (k.title(), r[k]) for k in ("air", "earth", "fire", "water", "void")) + "            }")
        for k, f in (("endurance", "Endurance"), ("composure", "Composure"), ("focus", "Focus"), ("vigilance", "Vigilance")):
            P.append('^"%s" INTEGER %d' % (f, s[k]))
        if s.get("silhouette") is not None:
            P.append('^"Silhouette" INTEGER %d' % s["silhouette"])
        for k, f in (("honor", "Honor"), ("glory", "Glory"), ("status", "Status")):
            P.append('^"%s" INTEGER %d' % (f, s[k]))
        P.append('^"Demeanor" STRING %s' % q(s["demeanor"]))
        P.append('^"Social Skill Check TN Modifiers" STRING %s' % q(s["tnMods"]))
        sk = s["skills"]
        P.append('^"Skills" LIST OF STRING [%s]' % ", ".join(q("%s %d" % (g.title(), sk[g])) for g in ("artisan", "martial", "scholar", "social", "trade")))
        for k, f in (("advantages", "Advantages"), ("disadvantages", "Disadvantages"), ("weapons", "Favored Weapons"), ("gear", "Gear"), ("gearOther", "Gear (Other)")):
            if s.get(k):
                P.append('^"%s" LIST OF STRING [%s]' % (f, ", ".join(q(x) for x in s[k])))
        # the campaign's own record of who they are
        for k, f in (("epithet", "Epithet"), ("affil", "Affiliation"), ("status", "Campaign Status")):
            if n.get(k):
                P.append('^"%s" STRING %s' % (f, q(n[k])))
        if n.get("bio"):
            P.append('^"Biography" LIST OF STRING [\n' + ",\n".join("                " + q(x) for x in n["bio"]) + "\n            ]")
        if n.get("template"):
            P.append('^"Template" BOOLEAN true')
        techs, rules = [], []
        for i, ab in enumerate(s.get("abilities", [])):
            if ab["name"] in TECHNIQUES:
                hh = TECHNIQUES[ab["name"]]
                techs.append(("%s " % hh if hh else "") + '^"%s"' % ab["name"])
                report.append((n["id"], ab["name"], "technique → corpus reference" + ("" if hh else " (by name: unhashed in the corpus)")))
                continue
            hits = find_line(lines, ab["name"])
            old = "%s: %s" % (ab["name"], ab["text"])
            body_hit = [(f, t) for f, t in strs if norm(t) == norm(ab["text"])]
            if hits:
                texts = sorted(set(t for _, t in hits))
                same = [t for t in texts if norm(t) == norm(old) or norm(t.split(": ", 1)[-1]) == norm(ab["text"])]
                line = same[0] if same else texts[0]
                if same:
                    typo = "" if line == old else " (the old copy's quotes were typographic)"
                    report.append((n["id"], ab["name"], "verbatim in 0.5, %s%s" % (hits[0][0], typo)))
                else:
                    report.append((n["id"], ab["name"], "DIFFERS from 0.5 (%s) — 0.5 used\n        old: %s\n        0.5: %s" % (hits[0][0], old[:170], line[:170])))
            elif body_hit:
                line = "%s: %s" % (ab["name"], body_hit[0][1])
                typo = "" if body_hit[0][1] == ab["text"] else " (the old copy's quotes were typographic)"
                report.append((n["id"], ab["name"], "verbatim in 0.5 as printed elsewhere (a school or title ability), %s%s" % (body_hit[0][0], typo)))
            else:
                line = old
                report.append((n["id"], ab["name"], "NOT FOUND in 0.5 — the old site's text used"))
            rules.append('            %sr%d: %s %s' % (h, i + 1, slug(n["id"] + " " + ab["name"]), q(line)))
        if techs:
            P.append('^"Techniques" LIST OF %s [%s]' % (TECH_TYPE, ", ".join(techs)))
        block = ['    %s ^"%s" DEF {' % (h, n["name"]), "        EXTENDS %s" % NPC_TYPE, "", "        PROPERTIES {"]
        block += ["            " + p for p in P]
        block.append("        }")
        if rules:
            block += ["        RULES {"] + rules + ["        }"]
        block.append("    }")
        body.append("\n".join(block))
        meta[h] = {k: n[k] for k in ("portrait", "reveal", "statNote") if n.get(k)}
        meta[h]["was"] = n["id"]
        tags = {ab["name"]: ab["tag"] for ab in s.get("abilities", []) if ab.get("tag")}
        if tags:
            meta[h]["tags"] = tags          # the old cards' labels on abilities (Niten, Perfect Land, Abbot…)
    return body, meta, report


HEADER = """EXTENSION "Portents_NPCs" EXTENDS "L5R5e_Core_NPCs" {
    NAME "Portents & Fortunes — the Dramatis Personae"
    VERSION "0.1.0"
    SPEC_VERSION "0.5"
    RELEASE_DATE "2026-09-23"

    # The campaign's NPCs, each a DEF on the corpus's NPC chassis in the corpus's own field names
    # (l5r5e-0.5-core-npcs.ttrpg). Converted once from the old site's npcs.js by
    # campaign/source/convert_npcs.py; this file is now the source. A statblock built on a corpus
    # profile keeps that profile's values; a one-line ability is the 0.5 corpus's line where the
    # corpus prints it; a technique is a reference to the corpus's own entity. Epithet,
    # Affiliation, Campaign Status and Biography are the campaign's own record of the person.

"""


def write(body, meta):
    os.makedirs(os.path.join(HERE, "campaign/dsl"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "campaign/site"), exist_ok=True)
    with open(os.path.join(HERE, "campaign/dsl/portents-npcs.ttrpg"), "w", encoding="utf-8") as fh:
        fh.write(HEADER + "\n\n".join(body) + "\n}\n")
    for h, m in meta.items():
        if m.get("portrait", "").startswith("../assets/"):
            m["portrait"] = "campaign/assets/" + m["portrait"][len("../assets/"):]
    with open(os.path.join(HERE, "campaign/site/npc-meta.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Presentation for the campaign's NPCs (campaign/dsl/portents-npcs.ttrpg), keyed by entity id:\n"
                 "   the portrait, what a player has revealed (the old site's field ids: name, epithet, portrait,\n"
                 "   desc, bio0…), and the note on how each was built. Not game data, so not in the gate. */\n")
        fh.write("window.PF_NPC_META = " + json.dumps(meta, ensure_ascii=False, indent=1, sort_keys=True) + ";\n")


if __name__ == "__main__":
    body, meta, report = main()
    if "--write" in sys.argv:
        write(body, meta)
        print("wrote campaign/dsl/portents-npcs.ttrpg (%d NPCs) and campaign/site/npc-meta.js" % len(body))
    else:
        print("\n\n".join(body))
    for npc, ab, what in report:
        print("# %-20s %-32s %s" % (npc, ab, what), file=sys.stderr)
