#!/usr/bin/env python3
"""M7: the old Portents pages → campaign/docs/ fragments the VTT's site tabs and Notes pane render.

Each page's content is taken as it stands — the page chrome goes (the top nav, the breadcrumb, the
footer, the scripts, the Behind the Veil gate, which the Notes pane now draws) and every link is
rewritten from the old page paths to the tabs (`#chronicle`, `#atlas/reisui-ji`, `gm/`), every
asset path to `campaign/assets/`. Nothing else changes.

    python3 campaign/source/migrate_docs.py          # write campaign/docs/, then prove it
    python3 campaign/source/migrate_docs.py --check  # prove only (once the old pages are gone: the links)

The proof, per document: its text (every text node, in order) equals the old page's content
region's text; every href and src resolves — a tab route to a tab this instance registers and, with
an anchor, to an id in that tab's document (or an NPC the Dramatis Personae knows), an asset to a
file on disk. Exits 1 on any difference.
"""
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
CAMPAIGN = os.path.dirname(HERE)
ROOT = os.path.dirname(CAMPAIGN)
DOCS = os.path.join(CAMPAIGN, "docs")

# old page (relative to campaign/) → (doc name, tab route, how its content region opens)
PAGES = {
    "index.html": ("home", "pf", '<div class="wrap">'),
    "chronicle/index.html": ("chronicle", "chronicle", '<div class="wrap">'),
    "atlas/index.html": ("atlas", "atlas", '<div class="wrap">'),
    "map/index.html": ("map", "map", '<div class="wrap">'),
    "lore/index.html": ("lore", "rokugan", '<div class="wrap">'),
    "character/index.html": ("characters", "norikage", '<div class="wrap">'),
    "character/norikage.html": ("norikage", "norikage/dossier", '<div class="wrap">'),
    "gm/index.html": ("state", "gm/", '<div class="wrap veiled" id="veilContent">'),
    # the masthead, and the #dp the cast is drawn into (campaign/site/personae.js)
    "dramatis-personae/index.html": ("personae", "personae", '<div class="wrap">'),
}
# pages whose content is not a document: the route a link to them takes
OTHER = {}
TABS = {"pf", "chronicle", "atlas", "map", "rokugan", "norikage", "personae"}
# links the old site had broken, repaired to what their own text names (and nothing else)
LINK_FIXES = {
    # norikage.html: "His abbot, <a …#the-abbot>Togashi Oharu</a>" — no NPC was ever `the-abbot`
    "#personae/the-abbot": "#personae/togashi-oharu",
}


def route_for(page):
    if page in PAGES:
        return PAGES[page][1]
    return OTHER.get(page)


def rewrite_url(url, page):
    """An old href/src, as written in `page`, → where it points now."""
    if re.match(r"^(https?:|mailto:|data:)", url):
        return url
    if url.startswith("#"):                          # an anchor on the same page
        r = route_for(page)
        return "#" + r + "/" + url[1:] if not r.endswith("/") else r
    path, _, frag = url.partition("#")
    base = os.path.dirname(page)
    target = os.path.normpath(os.path.join(base, path)) if path else page
    if target.startswith("../gm/") or target.startswith(".." + os.sep + "gm"):
        return target[3:]                            # the VTT's own pages (gm/play.html)
    if target.startswith("assets/"):
        return "campaign/" + target
    r = route_for(target)
    if r is None:
        raise SystemExit("%s: no route for %r (→ %s)" % (page, url, target))
    if r.endswith("/"):                              # the GM's page: no anchors into it
        return r
    return "#" + r + ("/" + frag if frag else "")


def region(page):
    """The page's content region, chrome removed."""
    src = open(os.path.join(CAMPAIGN, page), encoding="utf-8").read()
    opener = PAGES[page][2]
    i = src.index(opener) + len(opener)
    j = src.rindex("<footer")
    body = src[i:j]
    body = body[: body.rindex("</div>")]             # the wrap's own close
    body = re.sub(r'\s*<p class="crumb">.*?</p>', "", body, count=1, flags=re.S)
    return body.strip("\n") + "\n"


def convert(page):
    body = region(page)
    def one(m):
        u = rewrite_url(html.unescape(m.group(2)), page)
        return '%s="%s"' % (m.group(1), LINK_FIXES.get(u, u).replace("&", "&amp;"))
    return re.sub(r'\b(href|src)="([^"]*)"', one, body)


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.urls, self.ids = [], [], set()

    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ("href", "src") and v is not None:
                self.urls.append(v)
            if k == "id":
                self.ids.add(v)

    def handle_data(self, d):
        self.out.append(d)


def parse(s):
    p = Text()
    p.feed(s)
    return p


def npc_anchors():
    """The Dramatis Personae's anchors: the old page's NPC ids, each one an NPC of the layer."""
    meta = open(os.path.join(CAMPAIGN, "site", "npc-meta.js"), encoding="utf-8").read()
    meta = json.loads(meta[meta.index("{"): meta.rindex("}") + 1])
    return {m["was"] for m in meta.values() if m.get("was")}


def prove(docs):
    bad = 0
    ids = {name: parse(text).ids for name, text in docs.items()}
    by_route = {PAGES[p][1]: PAGES[p][0] for p in PAGES}
    npcs = npc_anchors()
    for page, (name, _, _) in PAGES.items():
        new = parse(docs[name])
        b = "".join(new.out)
        # once the old pages are retired (M7), their text was proven at the commit that removed them
        a = "".join(parse(region(page)).out) if os.path.exists(os.path.join(CAMPAIGN, page)) else b
        if a != b:
            bad += 1
            k = next(i for i in range(min(len(a), len(b))) if a[i] != b[i]) if a[:len(b)] != b[:len(a)] else min(len(a), len(b))
            print("TEXT DIFFERS %s at %d: %r | %r" % (name, k, a[k - 40:k + 40], b[k - 40:k + 40]))
        n_ok = 0
        for u in new.urls:
            ok = True
            if re.match(r"^https?:", u):
                pass
            elif u.startswith("#"):
                parts = u[1:].split("/")
                tab, rest = parts[0], parts[1:]
                if tab not in TABS:
                    ok = False
                elif tab == "personae":
                    ok = not rest or rest[0] in npcs
                elif tab == "map":
                    ok = not rest or rest[0] in ("dragon", "unicorn", "phoenix", "lion", "crane", "crab")
                elif tab == "norikage":
                    ok = not rest or rest == ["dossier"]
                elif rest:
                    ok = rest[0] in ids[by_route[tab]]
            else:
                ok = os.path.exists(os.path.join(ROOT, u.split("#")[0]))
            if not ok:
                bad += 1
                print("UNRESOLVED %s: %s" % (name, u))
            else:
                n_ok += 1
        print("%-11s %6d chars of text, identical: %s; %d links, every one resolves: %s" % (name, len(b), a == b, len(new.urls), n_ok == len(new.urls)))
    return bad


def main():
    check = "--check" in sys.argv
    docs = {}
    for page, (name, _, _) in PAGES.items():
        if check:
            docs[name] = open(os.path.join(DOCS, name + ".html"), encoding="utf-8").read()
        else:
            docs[name] = convert(page)
    if not check:
        os.makedirs(DOCS, exist_ok=True)
        for name, text in docs.items():
            with open(os.path.join(DOCS, name + ".html"), "w", encoding="utf-8") as fh:
                fh.write(text)
    bad = prove(docs)
    print("migrate_docs: %s" % ("OK" if not bad else "%d problem(s)" % bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
