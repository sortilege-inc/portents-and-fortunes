#!/usr/bin/env python3
"""
convert_house_rules.py — one-way conversion of the house rules established in play (the state
document's §10, campaign/docs/state.html) into campaign/dsl/portents-house-rules.ttrpg: one MODIFY
per rule and target, carrying the rule as a GUIDANCE entry, so the VTT shows it beside the rule it
changes, the way it shows errata. Kept for provenance; once run, the DSL is the source.
**Do not re-run it:** the DSL has been edited since (H1's hashes, M4's `Off-Approach Reroll Dice`), and
this script would write the first version back over them.

    python3 campaign/source/convert_house_rules.py

The text of each rule is extracted from §10 as written (tags and entities resolved, markup
dropped), never retyped. A target the corpus hashes is given by hash; one it leaves unhashed, by
name (the layer's names gate checks that name).
"""
import html, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# (the rule's opening words in §10, slug, [targets]) — a target is 'hash ^"Name"' or '^"Name"'
RULES = [
    ("Off-approach distinctions.", "off-approach-distinctions", ['^"Portentous Birth"', '^"Affect of Harmlessness"']),
    ("“Pick a door.”", "pick-a-door", ['#t7945706680f94a9e75d70 ^"Check"']),
    ("A session boundary clears strife", "session-boundary-strife", ['#t2bd057b321169907586e9 ^"Strife"']),
    ("Elemental Deficiency (Fire) fires at the GM", "elemental-deficiency-at-the-gms-call", ['^"Elemental Deficiency (Fire)"']),
    ("A duel may be run informally", "the-informal-duel", ['#tafe52b4a03561134d1004 ^"Duel"']),
    ("Decisive rules information is handed over", "decisive-rules-information", ['#EJSWW92HPvejHQLZakLnjP ^"Compromised"']),
    ("Work beneath a samurai", "work-beneath-station", ['#t39e9b468a87e875d0926c ^"Honor"']),
]


def q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def section10():
    src = open(os.path.join(HERE, "campaign/docs/state.html"), encoding="utf-8").read()
    body = src.split("10 &middot; House rules established in play", 1)[1].split("<h3>11 &middot;", 1)[0]
    out = []
    for p in re.findall(r"<p>(.*?)</p>", body, re.S):
        m = re.match(r"\s*<span class='tag tag-set'>SET(?: ([^<]+))?</span>\s*(.*)", p, re.S)
        if m:
            text = html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
            out.append((m.group(1), re.sub(r"\s+", " ", text)))
    return out


def main():
    rules = section10()
    if len(rules) != len(RULES):
        raise SystemExit("§10 holds %d rules, this converter knows %d — update RULES" % (len(rules), len(RULES)))
    blocks, n = [], 0
    for opening, slug, targets in RULES:
        hit = [(d, t) for d, t in rules if t.startswith(opening)]
        if len(hit) != 1:
            raise SystemExit("no single rule in §10 opens with %r" % opening)
        dated, text = hit[0]
        topics = ['"house rule"'] + (['"established %s 2026"' % dated.strip()] if dated else [])
        for target in targets:
            n += 1
            blocks.append("\n".join([
                "    MODIFY %s {" % target,
                "        GUIDANCE {",
                "            ENTRY ^\"house-rule-%s\" #PFhouseRule%02d {" % (slug, n),
                "                CONCERNS [ %s ]" % target,
                "                TOPICS [ %s ]" % ", ".join(topics),
                "                TEXT %s" % q(text),
                "            }",
                "        }",
                "    }",
            ]))
    head = """EXTENSION "Portents_House_Rules" EXTENDS "L5R5e_Core_Systems" {
    NAME "Portents & Fortunes — house rules established in play"
    VERSION "0.1.0"
    SPEC_VERSION "0.5"
    RELEASE_DATE "2026-09-23"

    # The rules the table has settled that the books do not say, each shown beside the rule it
    # changes (a MODIFY carrying a GUIDANCE entry, as the errata are). Converted once from the
    # state document's §10 by campaign/source/convert_house_rules.py; this file is now the source.
    # A target the corpus hashes is given by hash; one it leaves unhashed, by name.

"""
    with open(os.path.join(HERE, "campaign/dsl/portents-house-rules.ttrpg"), "w", encoding="utf-8") as fh:
        fh.write(head + "\n\n".join(blocks) + "\n}\n")
    print("wrote campaign/dsl/portents-house-rules.ttrpg: %d rules as %d MODIFYs" % (len(RULES), n))


if __name__ == "__main__":
    main()
