/* ============================================================
   dramatis.js — renders window.NPCS as bio/play cards.

   Two page modes, toggled by the GM switch at the top:
   - GM ON  : everything revealed; skills/abilities roll dice.
   - GM OFF : every discrete fact is fuzzed (blurred). Clicking a
              fuzzed fact reveals it — and the reveal PERSISTS, so
              a table's discoveries about an NPC accrue over play.
   Reveal state (pf-dp-revealed) and GM mode (pf-dp-gm) live in
   localStorage. GM ON is a view override; it never marks facts as
   discovered, so turning GM back off restores the discovery view.
   ============================================================ */
(function () {
  "use strict";
  var NPCS = window.NPCS || [];
  var root = document.getElementById("dp");
  if (!root) return;

  // ---- persisted mode + discovery state ----
  var GMKEY = "pf-dp-gm", REVKEY = "pf-dp-revealed";
  var gm = false; try { gm = localStorage.getItem(GMKEY) === "1"; } catch (e) {}
  var revealed = {}; try { revealed = JSON.parse(localStorage.getItem(REVKEY)) || {}; } catch (e) {}
  function saveRevealed() { try { localStorage.setItem(REVKEY, JSON.stringify(revealed)); } catch (e) {} }
  function setGM(on) { gm = on; try { localStorage.setItem(GMKEY, on ? "1" : "0"); } catch (e) {} }

  // ---- dice faces (official Ring d6 / Skill d12) ----
  var RING_FACES = [
    {key:"ring_blank"}, {key:"ring_ot",op:1,st:1}, {key:"ring_o",op:1},
    {key:"ring_st",su:1,st:1}, {key:"ring_s",su:1}, {key:"ring_et",ex:1,st:1}
  ];
  var SKILL_FACES = [
    {key:"skill_blank"}, {key:"skill_blank"}, {key:"skill_o",op:1}, {key:"skill_o",op:1}, {key:"skill_o",op:1},
    {key:"skill_st",su:1,st:1}, {key:"skill_st",su:1,st:1}, {key:"skill_s",su:1}, {key:"skill_s",su:1},
    {key:"skill_so",su:1,op:1}, {key:"skill_et",ex:1,st:1}, {key:"skill_e",ex:1}
  ];
  var RINGS = ["air","earth","fire","water","void"];
  var GROUPS = ["artisan","martial","scholar","social","trade"];

  // ---- helpers ----
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ringIcon(r) { return "<img class='ring-ico' src='../assets/rings/" + r + ".svg' alt='" + cap(r) + "' title='" + cap(r) + "'>"; }
  // Render corpus dice/ring tokens as glyphs.
  function syms(t) {
    if (t == null) return "";
    return esc(t)
      .replace(/\(op\)/g, "<span class='sym op'>◈</span>")
      .replace(/\(su\)/g, "<span class='sym su'>❁</span>")
      .replace(/\(ex\)/g, "<span class='sym ex'>❉</span>")
      .replace(/\(st\)/g, "<span class='sym st'>▲</span>")
      .replace(/\(ring\)/g, "<span class='sym ring'>⬢</span>")
      .replace(/\((air|earth|fire|water|void)\)/gi, function (m, r) { return ringIcon(r.toLowerCase()); });
  }

  // A fuzzable fact. `fid` is stable (npc.id + ":" + key) so a reveal
  // sticks across reloads. Labels stay visible; only values fuzz.
  function fz(fid, inner, extraCls) {
    var isRev = gm || revealed[fid];
    var span = el("span", "fz " + (extraCls || "") + (isRev ? " revealed" : " fuzzed"));
    span.setAttribute("data-fid", fid);
    span.innerHTML = inner;
    if (!gm) {
      span.setAttribute("role", "button");
      span.setAttribute("tabindex", "0");
      span.title = revealed[fid] ? "Discovered — click to conceal again" : "Click to reveal (discovered)";
      span.addEventListener("click", function (ev) { ev.stopPropagation(); toggleReveal(fid, span); });
      span.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggleReveal(fid, span); } });
    }
    return span;
  }
  function toggleReveal(fid, span) {
    if (gm) return;
    if (revealed[fid]) { delete revealed[fid]; span.classList.add("fuzzed"); span.classList.remove("revealed"); span.title = "Click to reveal (discovered)"; }
    else { revealed[fid] = 1; span.classList.remove("fuzzed"); span.classList.add("revealed"); span.title = "Discovered — click to conceal again"; }
    saveRevealed();
  }

  // ============================ page frame ============================
  function render() {
    document.body.classList.toggle("gm-on", gm);
    root.innerHTML = "";
    root.appendChild(buildModeBar());
    NPCS.forEach(function (npc) { root.appendChild(buildCard(npc)); });
  }

  function buildModeBar() {
    var bar = el("div", "dp-modebar");
    bar.innerHTML =
      "<div class='mb-left'><span class='mb-eye'>&#9673;</span>"
      + "<div class='mb-copy'><span class='mb-mode'>" + (gm ? "Game Master" : "Player — discovery") + "</span>"
      + "<span class='mb-note'>" + (gm ? "Every fact shown · skills &amp; abilities roll dice." : "Facts are concealed until met. Click any blur to reveal it — reveals persist.") + "</span></div></div>";
    var sw = el("button", "gm-switch" + (gm ? " on" : ""));
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", gm ? "true" : "false");
    sw.innerHTML = "<span class='gs-label'>GM</span><span class='gs-track'><span class='gs-knob'></span></span>";
    sw.addEventListener("click", function () { setGM(!gm); render(); });
    bar.appendChild(sw);
    return bar;
  }

  // ============================ one NPC ============================
  function buildCard(npc) {
    var id = npc.id;
    var hasStat = !!npc.stat;
    var view = hasStat ? (viewOf(id) || "bio") : "bio";

    var card = el("article", "dp-card");
    // header
    var head = el("div", "dp-head");
    var nameWrap = el("div", "dp-name");
    nameWrap.appendChild(fz(id + ":name", "<span class='dp-nm'>" + esc(npc.name) + "</span>", "fz-name"));
    if (npc.epithet) nameWrap.appendChild(fz(id + ":epithet", "<span class='dp-ep'>" + esc(npc.epithet) + "</span>", "fz-block"));
    head.appendChild(nameWrap);
    if (hasStat) head.appendChild(buildToggle(npc, card, view));
    card.appendChild(head);

    if (npc.affil) card.appendChild(fz(id + ":affil", esc(npc.affil), "dp-affil fz-block"));

    var body = el("div", "dp-body");
    card.appendChild(body);
    renderView(npc, body, view);
    return card;
  }

  // per-card bio/play memory (session only — not a discovery fact)
  var VIEWS = {};
  function viewOf(id) { return VIEWS[id]; }
  function buildToggle(npc, card, view) {
    var seg = el("div", "dp-seg");
    ["bio", "play"].forEach(function (v) {
      var b = el("button", "seg-btn" + (view === v ? " sel" : ""), v === "bio" ? "Bio" : "Play");
      b.addEventListener("click", function () {
        VIEWS[npc.id] = v;
        seg.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.toggle("sel", x === b); });
        renderView(npc, card.querySelector(".dp-body"), v);
      });
      seg.appendChild(b);
    });
    return seg;
  }
  function renderView(npc, body, view) {
    body.innerHTML = "";
    if (view === "play" && npc.stat) body.appendChild(buildPlay(npc));
    else body.appendChild(buildBio(npc));
  }

  // ---------------------------- BIO ----------------------------
  function buildBio(npc) {
    var wrap = el("div", "dp-bio");
    (npc.bio || []).forEach(function (p, i) {
      var para = el("p", "dp-bp");
      para.appendChild(fz(npc.id + ":bio" + i, esc(p), "fz-block"));
      wrap.appendChild(para);
    });
    if (npc.statNote) wrap.appendChild(el("p", "dp-statnote", "&#9873; " + esc(npc.statNote)));
    if (npc.status) wrap.appendChild(el("p", "dp-meta", esc(npc.status)));
    if (!npc.stat) wrap.appendChild(el("p", "dp-meta dp-nostat", "No statblock yet — bio only."));
    return wrap;
  }

  // ---------------------------- PLAY (statblock) ----------------------------
  function buildPlay(npc) {
    var s = npc.stat, id = npc.id;
    var wrap = el("div", "dp-play");

    // type + conflict ranks
    var top = el("div", "dp-typebar");
    top.innerHTML = "<span class='dp-type'>" + esc(s.kind) + "</span>";
    var ranks = el("span", "dp-ranks");
    ranks.innerHTML = "<span class='rk-lab'>Conflict Rank</span>";
    ranks.appendChild(fz(id + ":combatRank", "<span class='rk combat' title='Combat'>&#9876; " + s.combatRank + "</span>"));
    ranks.appendChild(fz(id + ":intrigueRank", "<span class='rk intrigue' title='Intrigue'>&#10057; " + s.intrigueRank + "</span>"));
    top.appendChild(ranks);
    wrap.appendChild(top);

    // description
    var desc = el("p", "dp-desc");
    desc.appendChild(fz(id + ":desc", esc(s.description), "fz-block"));
    wrap.appendChild(desc);

    // societal / personal grid
    var stats = el("div", "dp-stats");
    stats.appendChild(statCol("Societal", [
      ["Honor", s.honor, id + ":honor"], ["Glory", s.glory, id + ":glory"], ["Status", s.status, id + ":status"]
    ]));
    stats.appendChild(ringCluster(npc));
    stats.appendChild(statCol("Personal", [
      ["Endurance", s.endurance, id + ":endurance"], ["Composure", s.composure, id + ":composure"],
      ["Focus", s.focus, id + ":focus"], ["Vigilance", s.vigilance, id + ":vigilance"]
    ]));
    wrap.appendChild(stats);

    // demeanor + tn mods
    var dm = el("div", "dp-demeanor");
    dm.innerHTML = "<span class='dm-lab'>Demeanor</span>";
    dm.appendChild(fz(id + ":demeanor", esc(s.demeanor)));
    if (s.tnMods) {
      var tn = el("span", "dp-tnmods");
      tn.innerHTML = "<span class='dm-lab'>Social TN</span>";
      tn.appendChild(fz(id + ":tnmods", esc(s.tnMods)));
      dm.appendChild(tn);
    }
    wrap.appendChild(dm);

    // skill groups
    var sk = el("div", "dp-skills");
    GROUPS.forEach(function (g) {
      var v = s.skills[g] || 0;
      var chip = el("span", "sk-chip" + (v > 0 ? " ranked" : ""));
      chip.innerHTML = "<span class='sk-nm'>" + cap(g) + "</span>";
      chip.appendChild(fz(id + ":skill:" + g, "<span class='sk-v'>" + v + "</span>"));
      if (gm) { chip.classList.add("rollable"); chip.title = "Roll " + cap(g) + " " + v + " (choose a ring)"; chip.addEventListener("click", function () { pickAndRoll(npc, g); }); }
      sk.appendChild(chip);
    });
    wrap.appendChild(sk);

    // advantages / disadvantages
    if ((s.advantages && s.advantages.length) || (s.disadvantages && s.disadvantages.length)) {
      var ad = el("div", "dp-adv");
      ad.appendChild(adColumn("Advantages", s.advantages, id + ":adv"));
      ad.appendChild(adColumn("Disadvantages", s.disadvantages, id + ":dis"));
      wrap.appendChild(ad);
    }

    // weapons & gear
    var wg = el("div", "dp-gear");
    wg.appendChild(el("div", "dp-h", "Favored Weapons &amp; Gear"));
    (s.weapons || []).forEach(function (w, i) { var r = el("p", "dp-weap"); r.appendChild(fz(id + ":weap" + i, syms(w), "fz-block")); wg.appendChild(r); });
    var gearParts = [];
    (s.gear || []).forEach(function (g, i) { gearParts.push({ t: g, k: id + ":gear" + i }); });
    if (gearParts.length) {
      var gline = el("p", "dp-gearline");
      gline.innerHTML = "<span class='gl-lab'>Gear (equipped):</span> ";
      gearParts.forEach(function (p, i) { if (i) gline.appendChild(document.createTextNode(", ")); gline.appendChild(fz(p.k, syms(p.t))); });
      wg.appendChild(gline);
    }
    if (s.gearOther && s.gearOther.length) {
      var gl2 = el("p", "dp-gearline");
      gl2.innerHTML = "<span class='gl-lab'>Gear (other):</span> ";
      s.gearOther.forEach(function (g, i) { if (i) gl2.appendChild(document.createTextNode(", ")); gl2.appendChild(fz(id + ":gearo" + i, syms(g))); });
      wg.appendChild(gl2);
    }
    wrap.appendChild(wg);

    // abilities
    if (s.abilities && s.abilities.length) {
      var ab = el("div", "dp-abils");
      ab.appendChild(el("div", "dp-h", "Abilities"));
      s.abilities.forEach(function (a, i) { ab.appendChild(abilityEntry(npc, a, id + ":abil" + i)); });
      wrap.appendChild(ab);
    }

    // roll output (GM only)
    if (gm) { var out = el("div", "dp-roll"); out.id = "roll-" + id; wrap.appendChild(out); }
    return wrap;
  }

  function statCol(label, rows) {
    var col = el("div", "stat-col");
    col.appendChild(el("div", "sc-lab", label));
    rows.forEach(function (r) {
      var line = el("div", "sc-row");
      line.innerHTML = "<span class='sc-nm'>" + r[0] + "</span>";
      line.appendChild(fz(r[2], "<span class='sc-v'>" + r[1] + "</span>"));
      col.appendChild(line);
    });
    return col;
  }
  function ringCluster(npc) {
    var s = npc.stat, id = npc.id;
    var col = el("div", "ring-cluster");
    RINGS.forEach(function (r) {
      var cell = el("div", "rc-cell ring-" + r);
      if (gm) { cell.classList.add("rollable"); cell.title = "Roll " + cap(r) + " " + s.rings[r] + " (choose a skill group)"; cell.addEventListener("click", function () { pickAndRollRing(npc, r); }); }
      cell.innerHTML = "<img class='rc-ico' src='../assets/rings/" + r + ".svg' alt=''><span class='rc-nm'>" + cap(r) + "</span>";
      cell.appendChild(fz(id + ":ring:" + r, "<span class='rc-v'>" + s.rings[r] + "</span>"));
      col.appendChild(cell);
    });
    return col;
  }
  function adColumn(label, items, fidbase) {
    var col = el("div", "ad-col");
    col.appendChild(el("div", "ad-lab", label));
    (items || []).forEach(function (it, i) {
      var m = it.match(/^(.*?):\s*(.*)$/);
      var nm = m ? m[1] : it, rest = m ? m[2] : "";
      var line = el("div", "ad-item");
      line.appendChild(fz(fidbase + i, "<b>" + esc(nm) + ":</b> " + syms(rest), "fz-block"));
      col.appendChild(line);
    });
    if (!items || !items.length) col.appendChild(el("div", "ad-none", "—"));
    return col;
  }
  function abilityEntry(npc, a, fid) {
    var e = el("div", "dp-abil");
    var head = el("div", "ab-head");
    head.appendChild(fz(fid + ":name", "<span class='ab-nm'>" + esc(a.name) + "</span>" + (a.tag ? " <span class='ab-tag'>" + esc(a.tag) + "</span>" : ""), "fz-inline"));
    if (gm && a.check) {
      var b = el("button", "ab-roll", "&#9860; TN " + a.check.tn);
      b.title = "Roll " + a.check.label;
      b.addEventListener("click", function () { rollCheck(npc, a.check.ring, a.check.group, a.check.tn, a.name + " — " + a.check.label); });
      head.appendChild(b);
    }
    e.appendChild(head);
    var body = el("p", "ab-text");
    body.appendChild(fz(fid + ":text", syms(a.text), "fz-block"));
    e.appendChild(body);
    return e;
  }

  // ============================ GM roller ============================
  // NPC quick-roll: roll (ring) Ring dice + (skill) Skill dice, then
  // keep the best (ring) dice by successes (then opportunity). This is
  // a GM convenience, not the player's keep ceremony.
  function rollFace(type) {
    var faces = type === "ring" ? RING_FACES : SKILL_FACES;
    var f = faces[Math.floor(Math.random() * faces.length)];
    return { type: type, key: f.key, su: f.su || 0, ex: f.ex || 0, op: f.op || 0, st: f.st || 0 };
  }
  function dieScore(d) { return (d.su + d.ex) * 10 + d.op * 2 + d.st * 0; }
  function rollCheck(npc, ring, group, tn, label) {
    var rN = npc.stat.rings[ring] || 0, sN = npc.stat.skills[group] || 0;
    var pool = [], i;
    for (i = 0; i < rN; i++) pool.push(rollFace("ring"));
    for (i = 0; i < sN; i++) pool.push(rollFace("skill"));
    var keepN = rN; // NPCs keep dice equal to the ring value
    var byScore = pool.slice().sort(function (a, b) { return dieScore(b) - dieScore(a); });
    var kept = byScore.slice(0, keepN);
    var keptSet = new Set(kept);
    var su = 0, op = 0, st = 0;
    kept.forEach(function (d) { su += d.su + d.ex; op += d.op; st += d.st; });
    var pass = su >= tn;
    showRoll(npc, {
      label: label, ring: ring, rN: rN, group: group, sN: sN, tn: tn,
      pass: pass, su: su, op: op, st: st, keepN: keepN,
      pool: pool.map(function (d) { return { key: d.key, type: d.type, kept: keptSet.has(d) }; })
    });
  }
  function pickAndRoll(npc, group) { promptRing(npc, function (ring) { rollCheck(npc, ring, group, 2, cap(group) + " (" + cap(ring) + ")"); }); }
  function pickAndRollRing(npc, ring) { promptGroup(npc, function (group) { rollCheck(npc, ring, group, 2, cap(group) + " (" + cap(ring) + ")"); }); }

  function promptRing(npc, cb) { pickChips(npc, "Choose a ring", RINGS.map(function (r) { return [r, cap(r) + " " + (npc.stat.rings[r] || 0)]; }), cb); }
  function promptGroup(npc, cb) { pickChips(npc, "Choose a skill group", GROUPS.map(function (g) { return [g, cap(g) + " " + (npc.stat.skills[g] || 0)]; }), cb); }
  function pickChips(npc, title, opts, cb) {
    var host = document.getElementById("roll-" + npc.id); if (!host) return;
    host.innerHTML = "";
    var box = el("div", "rp-pick");
    box.appendChild(el("span", "rp-title", title));
    opts.forEach(function (o) {
      var b = el("button", "rp-chip", o[1]);
      b.addEventListener("click", function () { cb(o[0]); });
      box.appendChild(b);
    });
    host.appendChild(box);
  }
  function showRoll(npc, r) {
    var host = document.getElementById("roll-" + npc.id); if (!host) return;
    var dice = r.pool.map(function (d) {
      return "<img class='rd " + d.type + (d.kept ? " kept" : " drop") + "' src='../assets/dice/" + d.key + ".svg' alt='' title='" + (d.kept ? "kept" : "dropped") + "'>";
    }).join("");
    host.innerHTML =
      "<div class='rp-out " + (r.pass ? "pass" : "fail") + "'>"
      + "<div class='rp-head'><span class='rp-verdict'>" + (r.pass ? "Success" : "Failure") + "</span>"
      + "<span class='rp-what'>" + esc(r.label) + " · TN " + r.tn + "</span></div>"
      + "<div class='rp-dice'>" + dice + "</div>"
      + "<div class='rp-tally'>Kept <b>" + r.keepN + "</b> · Successes <b class='sym su'>" + r.su + "</b> · <span class='sym op'>◈</span> " + r.op + " · <span class='sym st'>▲</span> " + r.st + "</div>"
      + "<div class='rp-fine'>" + cap(r.ring) + " " + r.rN + " + " + cap(r.group) + " " + r.sN + " · kept best " + r.keepN + " by successes</div>"
      + "</div>";
  }

  render();
})();
