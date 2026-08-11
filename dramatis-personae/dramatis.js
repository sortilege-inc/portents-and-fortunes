/* ============================================================
   dramatis.js — Dramatis Personae: a tarot carousel of NPCs with
   a "table" below where the focused NPC plays.

   - GM switch (top): OFF = player discovery (facts incl. names
     fuzzed; click to reveal, reveals persist). ON = all revealed
     and the roller / log / conflict become live.
   - Carousel of tall tarot cards; ◀ ▶ scroll. Star an NPC to mark
     it Active; active NPCs become quick-switch tabs above the table.
   - The focused NPC opens a full panel: Bio · Statblock · (GM) Roll
     / Conflict / Log — a compact port of the player sheet's engine,
     adapted to NPC data (ring + skill group; no void pool/techniques).
   Persisted: pf-dp-gm, pf-dp-revealed, pf-dp-active, pf-dp-focus,
   pf-dp-eng-<id> (stance/conflict/strife…), pf-dp-log-<id>.
   ============================================================ */
(function () {
  "use strict";
  var NPCS = window.NPCS || [];
  var root = document.getElementById("dp");
  if (!root) return;
  var L5RD = window.L5R || { stances:{}, conflicts:{}, opportunities:{}, oppTables:[] };

  // ---------------- persisted mode / discovery / selection ----------------
  var GMKEY = "pf-dp-gm", REVKEY = "pf-dp-revealed", ACTKEY = "pf-dp-active", FOCKEY = "pf-dp-focus";
  var gm = false; try { gm = localStorage.getItem(GMKEY) === "1"; } catch (e) {}
  var revealed = {}; try { revealed = JSON.parse(localStorage.getItem(REVKEY)) || {}; } catch (e) {}
  var active = {}; try { active = JSON.parse(localStorage.getItem(ACTKEY)) || {}; } catch (e) {}
  var focusId = null; try { focusId = localStorage.getItem(FOCKEY) || null; } catch (e) {}
  function saveRevealed() { try { localStorage.setItem(REVKEY, JSON.stringify(revealed)); } catch (e) {} }
  function saveActive() { try { localStorage.setItem(ACTKEY, JSON.stringify(active)); } catch (e) {} }
  function setGM(on) { gm = on; try { localStorage.setItem(GMKEY, on ? "1" : "0"); } catch (e) {} }
  function setFocus(id) { focusId = id; try { localStorage.setItem(FOCKEY, id); } catch (e) {} }
  if (!focusId || !byId(focusId)) focusId = NPCS.length ? NPCS[0].id : null;

  // per-NPC engine state + log
  function engKey(id) { return "pf-dp-eng-" + id; }
  function logKey(id) { return "pf-dp-log-" + id; }
  function getEng(id) {
    var d = { stance:"void", ring:"earth", group:"martial", inConflict:false, conflictType:"skirmish", conflictName:"", oppTable:"conflict", strife:0, fatigue:0 };
    try { var s = JSON.parse(localStorage.getItem(engKey(id))); if (s) Object.assign(d, s); } catch (e) {}
    return d;
  }
  function saveEng(id, e) { try { localStorage.setItem(engKey(id), JSON.stringify(e)); } catch (er) {} }
  function getLog(id) { try { return JSON.parse(localStorage.getItem(logKey(id))) || []; } catch (e) { return []; } }
  function saveLog(id, l) { try { localStorage.setItem(logKey(id), JSON.stringify(l)); } catch (e) {} }

  // ---------------- dice ----------------
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
  function rollFace(type) { var f = (type === "ring" ? RING_FACES : SKILL_FACES); var d = f[Math.floor(Math.random() * f.length)]; return { type:type, key:d.key, su:d.su||0, ex:d.ex||0, op:d.op||0, st:d.st||0, kept:false, bonus:false, explodedDone:false, markedReroll:false }; }
  function faceTitle(d){ var p=[]; if(d.ex)p.push(d.ex+"× explosive success"); if(d.su)p.push(d.su+"× success"); if(d.op)p.push(d.op+"× opportunity"); if(d.st)p.push(d.st+"× strife"); return p.length?p.join(", "):"blank"; }

  // ---------------- helpers ----------------
  function byId(id) { for (var i=0;i<NPCS.length;i++) if (NPCS[i].id===id) return NPCS[i]; return null; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ringIcon(r) { return "<img class='ring-ico' src='../assets/rings/" + r + ".svg' alt='" + cap(r) + "' title='" + cap(r) + "'>"; }
  function syms(t) {
    if (t == null) return "";
    return esc(t)
      .replace(/\(op\)/g,"<span class='sym op'>◈</span>").replace(/\(su\)/g,"<span class='sym su'>❁</span>")
      .replace(/\(ex\)/g,"<span class='sym ex'>❉</span>").replace(/\(st\)/g,"<span class='sym st'>▲</span>")
      .replace(/\(ring\)/g,"<span class='sym ring'>⬢</span>")
      .replace(/\((air|earth|fire|water|void)\)/gi, function (m,r) { return ringIcon(r.toLowerCase()); });
  }
  var ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

  // ---- fuzzable fact ----
  function fz(fid, inner, extraCls) {
    var isRev = gm || revealed[fid];
    var span = el("span", "fz " + (extraCls || "") + (isRev ? " revealed" : " fuzzed"));
    span.setAttribute("data-fid", fid); span.innerHTML = inner;
    if (!gm) {
      span.setAttribute("role","button"); span.setAttribute("tabindex","0");
      span.title = revealed[fid] ? "Discovered — click to conceal again" : "Click to reveal (discovered)";
      span.addEventListener("click", function (ev) { ev.stopPropagation(); toggleReveal(fid, span); });
      span.addEventListener("keydown", function (ev) { if (ev.key==="Enter"||ev.key===" ") { ev.preventDefault(); ev.stopPropagation(); toggleReveal(fid, span); } });
    }
    return span;
  }
  function toggleReveal(fid, span) {
    if (gm) return;
    if (revealed[fid]) { delete revealed[fid]; span.classList.add("fuzzed"); span.classList.remove("revealed"); span.title="Click to reveal (discovered)"; }
    else { revealed[fid]=1; span.classList.remove("fuzzed"); span.classList.add("revealed"); span.title="Discovered — click to conceal again"; }
    saveRevealed();
  }

  // ============================ page ============================
  function render() {
    document.body.classList.toggle("gm-on", gm);
    root.innerHTML = "";
    root.appendChild(buildModeBar());
    root.appendChild(buildCarousel());
    root.appendChild(buildActiveBar());
    var focusHost = el("div", "dp-focus"); focusHost.id = "dpFocus";
    root.appendChild(focusHost);
    renderFocus();
    setTimeout(centerFocusCard, 30);
  }

  function buildModeBar() {
    var bar = el("div", "dp-modebar");
    bar.innerHTML =
      "<div class='mb-left'><span class='mb-eye'>&#9673;</span>"
      + "<div class='mb-copy'><span class='mb-mode'>" + (gm ? "Game Master" : "Player — discovery") + "</span>"
      + "<span class='mb-note'>" + (gm ? "Every fact shown · roller, log &amp; conflict are live." : "Facts are concealed until met. Click any blur to reveal it — reveals persist.") + "</span></div></div>";
    var sw = el("button", "gm-switch" + (gm ? " on" : ""));
    sw.setAttribute("role","switch"); sw.setAttribute("aria-checked", gm ? "true" : "false");
    sw.innerHTML = "<span class='gs-label'>GM</span><span class='gs-track'><span class='gs-knob'></span></span>";
    sw.addEventListener("click", function () { setGM(!gm); render(); });
    bar.appendChild(sw);
    return bar;
  }

  // ---------------- carousel of tarot cards ----------------
  function buildCarousel() {
    var wrap = el("div", "dp-carousel-wrap");
    var prev = el("button", "car-nav prev", "&#8249;"); prev.setAttribute("aria-label","Previous");
    var next = el("button", "car-nav next", "&#8250;"); next.setAttribute("aria-label","Next");
    var track = el("div", "dp-carousel"); track.id = "dpCarousel";
    NPCS.forEach(function (npc) { track.appendChild(tarotCard(npc)); });
    prev.addEventListener("click", function () { track.scrollBy({ left: -cardStep(track), behavior:"smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left:  cardStep(track), behavior:"smooth" }); });
    wrap.appendChild(prev); wrap.appendChild(track); wrap.appendChild(next);
    return wrap;
  }
  function cardStep(track) { var c = track.querySelector(".tarot"); return c ? (c.offsetWidth + 18) : 300; }
  function centerFocusCard() {
    var track = document.getElementById("dpCarousel"); if (!track) return;
    var card = track.querySelector('.tarot[data-id="' + focusId + '"]'); if (!card) return;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  }

  function tarotCard(npc) {
    var id = npc.id, i = NPCS.indexOf(npc);
    var card = el("article", "tarot" + (focusId === id ? " focused" : "") + (active[id] ? " active" : "") + (npc.stat ? "" : " nostat"));
    card.setAttribute("data-id", id);
    var kind = npc.stat ? npc.stat.kind : "Bio";
    var emblem = kindEmblem(kind);
    // star (active)
    var star = el("button", "tr-star" + (active[id] ? " on" : ""), active[id] ? "★" : "☆");
    star.title = active[id] ? "Active in the scene — click to set aside" : "Mark active in the scene";
    star.addEventListener("click", function (ev) { ev.stopPropagation(); toggleActive(id); });
    card.appendChild(star);
    card.appendChild(el("span", "tr-num", ROMAN[i + 1] || (i + 1)));
    var inner = el("div", "tr-inner");
    inner.appendChild(el("div", "tr-emblem", emblem));
    var nm = el("div", "tr-name");
    nm.appendChild(fz(id + ":name", esc(npc.name), "fz-name"));
    inner.appendChild(nm);
    if (npc.epithet) { var ep = el("div", "tr-ep"); ep.appendChild(fz(id + ":epithet", esc(npc.epithet), "fz-block")); inner.appendChild(ep); }
    inner.appendChild(el("div", "tr-kind", esc(kind)));
    var snip = (npc.bio && npc.bio[0]) ? npc.bio[0] : "";
    if (snip) { var sn = el("p", "tr-snip"); sn.appendChild(fz(id + ":bio0", esc(snip), "fz-block")); inner.appendChild(sn); }
    card.appendChild(inner);
    card.appendChild(el("div", "tr-open", focusId === id ? "On the table" : "Bring to the table"));
    card.addEventListener("click", function () { setFocus(id); render(); });
    return card;
  }
  function kindEmblem(kind) { return kind === "Minion" ? "▲" : kind === "Adversary" ? "❁" : "❖"; }

  function toggleActive(id) {
    if (active[id]) delete active[id]; else active[id] = 1;
    saveActive();
    if (active[id]) { setFocus(id); }
    render();
  }

  // ---------------- active NPC tabs ----------------
  function buildActiveBar() {
    var ids = NPCS.filter(function (n) { return active[n.id]; }).map(function (n) { return n.id; });
    var bar = el("div", "dp-activebar");
    if (!ids.length) { bar.classList.add("empty"); bar.innerHTML = "<span class='ab-hint'>★ a card to keep it on the table — active NPCs appear here for quick switching.</span>"; return bar; }
    bar.appendChild(el("span", "ab-lab", "Active"));
    ids.forEach(function (id) {
      var npc = byId(id);
      var t = el("button", "ab-tab" + (focusId === id ? " sel" : ""));
      t.appendChild(fz(id + ":name", esc(npc.name), "fz-inline"));
      t.addEventListener("click", function () { setFocus(id); render(); });
      bar.appendChild(t);
    });
    return bar;
  }

  // ============================ focus panel ============================
  var VIEW = {};        // per-npc bio|play memory
  var TAB = {};         // per-npc roll|conflict|log memory (gm)
  function renderFocus() {
    var host = document.getElementById("dpFocus"); if (!host) return;
    host.innerHTML = "";
    var npc = byId(focusId); if (!npc) { host.appendChild(el("p","dp-meta","Select a card to bring it to the table.")); return; }
    var id = npc.id;
    var view = npc.stat ? (VIEW[id] || "play") : "bio";

    // header
    var head = el("div", "fc-head");
    var idbox = el("div", "fc-id");
    idbox.appendChild(fz(id + ":name", "<span class='fc-nm'>" + esc(npc.name) + "</span>", "fz-name"));
    if (npc.epithet) idbox.appendChild(fz(id + ":epithet", "<span class='fc-ep'>" + esc(npc.epithet) + "</span>", "fz-block"));
    head.appendChild(idbox);
    var tools = el("div", "fc-tools");
    var star = el("button", "fc-star" + (active[id] ? " on" : ""), (active[id] ? "★ Active" : "☆ Set active"));
    star.addEventListener("click", function () { toggleActive(id); });
    tools.appendChild(star);
    if (npc.stat) {
      var seg = el("div", "dp-seg");
      ["bio","play"].forEach(function (v) {
        var b = el("button", "seg-btn" + (view === v ? " sel" : ""), v === "bio" ? "Bio" : "Play");
        b.addEventListener("click", function () { VIEW[id] = v; renderFocus(); });
        seg.appendChild(b);
      });
      tools.appendChild(seg);
    }
    head.appendChild(tools);
    head.appendChild(fz(id + ":affil", esc(npc.affil || ""), "fc-affil fz-block"));
    host.appendChild(head);

    var body = el("div", "fc-body");
    host.appendChild(body);
    if (view === "bio" || !npc.stat) body.appendChild(buildBio(npc));
    else buildPlayArea(npc, body);
  }

  function buildBio(npc) {
    var wrap = el("div", "dp-bio");
    (npc.bio || []).forEach(function (p, i) { var para = el("p", "dp-bp"); para.appendChild(fz(npc.id + ":bio" + i, esc(p), "fz-block")); wrap.appendChild(para); });
    if (npc.statNote) wrap.appendChild(el("p", "dp-statnote", "&#9873; " + esc(npc.statNote)));
    if (npc.status) wrap.appendChild(el("p", "dp-meta", esc(npc.status)));
    if (!npc.stat) wrap.appendChild(el("p", "dp-meta dp-nostat", "No statblock yet — bio only."));
    return wrap;
  }

  // ---- play area: statblock + (gm) tabbed roll/conflict/log ----
  function buildPlayArea(npc, body) {
    body.appendChild(buildStatblock(npc));
    if (!gm) { body.appendChild(el("p", "dp-meta gm-hint", "Turn on GM (top) to roll, run a conflict, and keep a log for this NPC.")); return; }
    var id = npc.id, tab = TAB[id] || "roll";
    var tabs = el("div", "fc-tabs");
    [["roll","Roll"],["conflict","Conflict"],["log","Log"]].forEach(function (t) {
      var b = el("button", "fc-tab" + (tab === t[0] ? " sel" : ""), t[1] + (t[0] === "log" ? " <span class='lc'>" + logCount(id) + "</span>" : ""));
      b.addEventListener("click", function () { TAB[id] = t[0]; renderFocus(); });
      tabs.appendChild(b);
    });
    body.appendChild(tabs);
    var pane = el("div", "fc-pane");
    body.appendChild(pane);
    if (tab === "roll") buildRoller(npc, pane);
    else if (tab === "conflict") buildConflict(npc, pane);
    else buildLogPane(npc, pane);
  }
  function logCount(id) { var n = getLog(id).length; return n ? "(" + n + ")" : ""; }

  // ---------------- statblock ----------------
  function buildStatblock(npc) {
    var s = npc.stat, id = npc.id;
    var wrap = el("div", "dp-play");
    var top = el("div", "dp-typebar");
    top.innerHTML = "<span class='dp-type'>" + esc(s.kind) + "</span>";
    var ranks = el("span", "dp-ranks");
    ranks.innerHTML = "<span class='rk-lab'>Conflict Rank</span>";
    ranks.appendChild(fz(id + ":combatRank", "<span class='rk combat' title='Combat'>&#9876; " + s.combatRank + "</span>"));
    ranks.appendChild(fz(id + ":intrigueRank", "<span class='rk intrigue' title='Intrigue'>&#10057; " + s.intrigueRank + "</span>"));
    top.appendChild(ranks);
    wrap.appendChild(top);

    var desc = el("p", "dp-desc"); desc.appendChild(fz(id + ":desc", esc(s.description), "fz-block")); wrap.appendChild(desc);

    // horizontal ring row
    var rr = el("div", "dp-ringrow");
    RINGS.forEach(function (r) {
      var cell = el("div", "rr-cell ring-" + r);
      cell.innerHTML = "<img class='rr-ico' src='../assets/rings/" + r + ".svg' alt=''><span class='rr-nm'>" + cap(r) + "</span>";
      cell.appendChild(fz(id + ":ring:" + r, "<span class='rr-v'>" + s.rings[r] + "</span>"));
      rr.appendChild(cell);
    });
    wrap.appendChild(rr);

    var stats = el("div", "dp-stats");
    stats.appendChild(statCol("Societal", [["Honor",s.honor,id+":honor"],["Glory",s.glory,id+":glory"],["Status",s.status,id+":status"]]));
    stats.appendChild(statCol("Personal", [["Endurance",s.endurance,id+":endurance"],["Composure",s.composure,id+":composure"],["Focus",s.focus,id+":focus"],["Vigilance",s.vigilance,id+":vigilance"]]));
    wrap.appendChild(stats);

    var dm = el("div", "dp-demeanor");
    dm.innerHTML = "<span class='dm-lab'>Demeanor</span>"; dm.appendChild(fz(id + ":demeanor", esc(s.demeanor)));
    if (s.tnMods) { var tn = el("span", "dp-tnmods"); tn.innerHTML = "<span class='dm-lab'>Social TN</span>"; tn.appendChild(fz(id + ":tnmods", esc(s.tnMods))); dm.appendChild(tn); }
    wrap.appendChild(dm);

    var sk = el("div", "dp-skills");
    GROUPS.forEach(function (g) {
      var v = s.skills[g] || 0;
      var chip = el("span", "sk-chip" + (v > 0 ? " ranked" : ""));
      chip.innerHTML = "<span class='sk-nm'>" + cap(g) + "</span>";
      chip.appendChild(fz(id + ":skill:" + g, "<span class='sk-v'>" + v + "</span>"));
      sk.appendChild(chip);
    });
    wrap.appendChild(sk);

    if ((s.advantages && s.advantages.length) || (s.disadvantages && s.disadvantages.length)) {
      var ad = el("div", "dp-adv");
      ad.appendChild(adColumn("Advantages", s.advantages, id + ":adv"));
      ad.appendChild(adColumn("Disadvantages", s.disadvantages, id + ":dis"));
      wrap.appendChild(ad);
    }

    var wg = el("div", "dp-gear");
    wg.appendChild(el("div", "dp-h", "Favored Weapons &amp; Gear"));
    (s.weapons || []).forEach(function (w, i) { var r = el("p", "dp-weap"); r.appendChild(fz(id + ":weap" + i, syms(w), "fz-block")); wg.appendChild(r); });
    if (s.gear && s.gear.length) { var gl = el("p", "dp-gearline"); gl.innerHTML = "<span class='gl-lab'>Gear (equipped):</span> "; s.gear.forEach(function (g,i) { if (i) gl.appendChild(document.createTextNode(", ")); gl.appendChild(fz(id + ":gear" + i, syms(g))); }); wg.appendChild(gl); }
    if (s.gearOther && s.gearOther.length) { var gl2 = el("p", "dp-gearline"); gl2.innerHTML = "<span class='gl-lab'>Gear (other):</span> "; s.gearOther.forEach(function (g,i) { if (i) gl2.appendChild(document.createTextNode(", ")); gl2.appendChild(fz(id + ":gearo" + i, syms(g))); }); wg.appendChild(gl2); }
    wrap.appendChild(wg);

    if (s.abilities && s.abilities.length) {
      var ab = el("div", "dp-abils"); ab.appendChild(el("div", "dp-h", "Abilities"));
      s.abilities.forEach(function (a, i) { ab.appendChild(abilityEntry(npc, a, id + ":abil" + i)); });
      wrap.appendChild(ab);
    }

    if (gm) wrap.appendChild(buildTrackers(npc));
    return wrap;
  }
  function statCol(label, rows) {
    var col = el("div", "stat-col"); col.appendChild(el("div", "sc-lab", label));
    rows.forEach(function (r) { var line = el("div", "sc-row"); line.innerHTML = "<span class='sc-nm'>" + r[0] + "</span>"; line.appendChild(fz(r[2], "<span class='sc-v'>" + r[1] + "</span>")); col.appendChild(line); });
    return col;
  }
  function adColumn(label, items, fidbase) {
    var col = el("div", "ad-col"); col.appendChild(el("div", "ad-lab", label));
    (items || []).forEach(function (it, i) { var m = it.match(/^(.*?):\s*(.*)$/); var nm = m ? m[1] : it, rest = m ? m[2] : ""; var line = el("div", "ad-item"); line.appendChild(fz(fidbase + i, "<b>" + esc(nm) + ":</b> " + syms(rest), "fz-block")); col.appendChild(line); });
    if (!items || !items.length) col.appendChild(el("div", "ad-none", "—"));
    return col;
  }
  function abilityEntry(npc, a, fid) {
    var e = el("div", "dp-abil");
    var head = el("div", "ab-head");
    head.appendChild(fz(fid + ":name", "<span class='ab-nm'>" + esc(a.name) + "</span>" + (a.tag ? " <span class='ab-tag'>" + esc(a.tag) + "</span>" : ""), "fz-inline"));
    if (gm && a.check) { var b = el("button", "ab-roll", "&#9860; TN " + a.check.tn); b.title = "Roll " + a.check.label; b.addEventListener("click", function () { var e2 = getEng(npc.id); e2.ring = a.check.ring; e2.group = a.check.group; saveEng(npc.id, e2); TAB[npc.id] = "roll"; renderFocus(); setTimeout(function(){ var tn = document.getElementById("nrTN"); if (tn) tn.value = a.check.tn; }, 0); }); head.appendChild(b); }
    e.appendChild(head);
    var body = el("p", "ab-text"); body.appendChild(fz(fid + ":text", syms(a.text), "fz-block")); e.appendChild(body);
    return e;
  }

  // ---- strife / fatigue trackers (GM) ----
  function buildTrackers(npc) {
    var s = npc.stat, e = getEng(npc.id);
    var wrap = el("div", "dp-trk");
    wrap.appendChild(trk(npc, "strife", "Strife", s.composure, "Compromised at half Composure (" + Math.ceil(s.composure/2) + ")"));
    wrap.appendChild(trk(npc, "fatigue", "Fatigue", s.endurance, "Incapacitated at Endurance (" + s.endurance + ")"));
    return wrap;
  }
  function trk(npc, key, label, max, note) {
    var e = getEng(npc.id);
    var box = el("div", "trkline");
    box.innerHTML = "<span class='trk-nm'>" + label + "</span>";
    var minus = el("button", "trk-b", "−"), plus = el("button", "trk-b", "+");
    var val = el("span", "trk-v", (e[key] || 0) + " / " + max);
    minus.addEventListener("click", function () { var en = getEng(npc.id); en[key] = Math.max(0, (en[key]||0) - 1); saveEng(npc.id, en); val.textContent = en[key] + " / " + max; logEvent(npc.id, key, label + " → " + en[key]); });
    plus.addEventListener("click", function () { var en = getEng(npc.id); en[key] = (en[key]||0) + 1; saveEng(npc.id, en); val.textContent = en[key] + " / " + max; logEvent(npc.id, key, label + " → " + en[key]); });
    box.appendChild(minus); box.appendChild(val); box.appendChild(plus);
    box.appendChild(el("span", "trk-note", note));
    return box;
  }

  // ============================ roller (per focused NPC) ============================
  var pool = [], curKeep = 0, rollMeta = null, rrMode = null, rollLogged = false;
  var cfg = { assistSkill:0, assistRing:0 };
  function resetRollState() { pool = []; curKeep = 0; rollMeta = null; rrMode = null; rollLogged = false; cfg = { assistSkill:0, assistRing:0 }; }

  function buildRoller(npc, pane) {
    var e = getEng(npc.id);
    var wrap = el("div", "nr");
    wrap.innerHTML =
      "<div class='nr-controls'>"
      + "<div class='nr-field'><label>Ring</label><span class='nr-chips' id='nrRings'></span></div>"
      + "<div class='nr-field'><label>Skill group</label><span class='nr-chips' id='nrGroups'></span></div>"
      + "<div class='nr-field nr-tn'><label>TN</label><input id='nrTN' type='number' min='0' value='2'></div>"
      + "<div class='nr-field'><label>Assist — skilled</label><span class='stepper' data-cfg='assistSkill'></span></div>"
      + "<div class='nr-field'><label>Assist — unskilled</label><span class='stepper' data-cfg='assistRing'></span></div>"
      + "</div>"
      + "<div class='nr-noterow'><label>Concerning</label><input type='text' id='nrNote' placeholder='What is this roll about? (optional — saved to the log)' maxlength='140'></div>"
      + "<div class='nr-actions'><button class='roll-btn' id='nrRoll'>Assemble &amp; Roll</button><button class='roll-btn ghost' id='nrClear'>Clear</button><span class='nr-summary' id='nrSummary'></span></div>"
      + "<p class='nr-hint'><b>Click dice to keep</b> — nothing is kept for you. <b>&#8635;</b> marks a die to reroll. A kept <b>explosive</b> (&#10057;) die shows an explode button.</p>"
      + "<div class='dice-row' id='nrDice'></div><div class='reroll-bar' id='nrRR'></div><div class='nr-result' id='nrResult'></div>"
      + "<div class='opp-panel' id='nrOpp'></div>";
    pane.appendChild(wrap);
    // ring chips
    var rc = wrap.querySelector("#nrRings");
    RINGS.forEach(function (r) { var b = el("button", "nr-chip" + (e.ring === r ? " sel" : ""), cap(r) + " " + npc.stat.rings[r]); b.addEventListener("click", function () { var en = getEng(npc.id); en.ring = r; saveEng(npc.id, en); rc.querySelectorAll(".nr-chip").forEach(function(x){x.classList.remove("sel");}); b.classList.add("sel"); syncSummary(npc); renderOpp(npc); }); rc.appendChild(b); });
    var gc = wrap.querySelector("#nrGroups");
    GROUPS.forEach(function (g) { var b = el("button", "nr-chip" + (e.group === g ? " sel" : ""), cap(g) + " " + (npc.stat.skills[g]||0)); b.addEventListener("click", function () { var en = getEng(npc.id); en.group = g; saveEng(npc.id, en); gc.querySelectorAll(".nr-chip").forEach(function(x){x.classList.remove("sel");}); b.classList.add("sel"); syncSummary(npc); }); gc.appendChild(b); });
    buildStepper(wrap.querySelector("[data-cfg='assistSkill']"), "assistSkill", npc);
    buildStepper(wrap.querySelector("[data-cfg='assistRing']"), "assistRing", npc);
    wrap.querySelector("#nrRoll").addEventListener("click", function () { doRoll(npc); });
    wrap.querySelector("#nrClear").addEventListener("click", function () { pool = []; renderDice(npc); document.getElementById("nrResult").classList.remove("show"); });
    wrap.querySelector("#nrTN").addEventListener("input", function () { if (pool.length) tally(npc); });
    resetRollState();
    syncSummary(npc); renderOpp(npc);
  }
  function ringN(npc) { return npc.stat.rings[getEng(npc.id).ring] || 0; }
  function skillN(npc) { return npc.stat.skills[getEng(npc.id).group] || 0; }
  function syncSummary(npc) { var s = document.getElementById("nrSummary"); if (s) s.innerHTML = "Base pool <b>" + (ringN(npc) + skillN(npc)) + "</b> · keep <b>" + ringN(npc) + "</b>"; }
  function buildStepper(host, key, npc) {
    host.innerHTML = "<button class='st-btn' data-d='-1'>−</button><span class='st-val'>0</span><button class='st-btn' data-d='1'>+</button>";
    var val = host.querySelector(".st-val");
    host.querySelectorAll(".st-btn").forEach(function (b) { b.addEventListener("click", function () { cfg[key] = Math.max(0, Math.min(6, (cfg[key]||0) + parseInt(b.getAttribute("data-d"),10))); val.textContent = cfg[key]; }); });
  }
  function doRoll(npc) {
    rollLogged = false; rrMode = null;
    var extraRing = cfg.assistRing, extraSkill = cfg.assistSkill, i;
    pool = [];
    for (i=0;i<ringN(npc)+extraRing;i++) pool.push(rollFace("ring"));
    for (i=0;i<skillN(npc)+extraSkill;i++) pool.push(rollFace("skill"));
    curKeep = ringN(npc) + cfg.assistRing + cfg.assistSkill;
    var e = getEng(npc.id);
    rollMeta = { ring:e.ring, ringN:ringN(npc), group:e.group, skillN:skillN(npc), assistSkill:cfg.assistSkill, assistRing:cfg.assistRing, keepLimit:curKeep,
      initial: pool.map(function (d) { return { type:d.type, key:d.key }; }), events: [],
      inConflict: !!e.inConflict, stance: e.inConflict ? e.stance : null, conflictType: e.inConflict ? e.conflictType : null, conflictName: e.inConflict ? (e.conflictName||null) : null };
    renderDice(npc); tally(npc);
  }
  function keptBase() { return pool.filter(function (d) { return d.kept && !d.bonus; }).length; }
  function renderDice(npc) {
    var row = document.getElementById("nrDice"); if (!row) return; row.innerHTML = "";
    if (!pool.length) { var r = document.getElementById("nrResult"); if (r) r.classList.remove("show"); renderRR(npc); return; }
    ["ring","skill"].forEach(function (type) {
      var group = pool.filter(function (d) { return d.type === type; }); if (!group.length) return;
      row.appendChild(el("div", "dice-group-label", type === "ring" ? "Ring Dice (d6)" : "Skill Dice (d12)"));
      group.forEach(function (d) { row.appendChild(makeDie(npc, d)); });
    });
    renderRR(npc);
  }
  function makeDie(npc, d) {
    var die = el("div", "die " + d.type + (d.kept ? " kept" : "") + (d.bonus ? " bonus" : "") + (d.markedReroll ? " marked" : ""));
    die.title = faceTitle(d);
    var canExplode = d.kept && d.ex > 0 && !d.explodedDone;
    die.innerHTML = "<img class='face' src='../assets/dice/" + d.key + ".svg' alt=''><span class='dtype'>" + (d.type === "ring" ? "d6" : "d12") + "</span>"
      + "<button class='die-op reroll" + (d.markedReroll ? " active" : "") + "' title='Mark for reroll'>&#8635;</button>"
      + (canExplode ? "<button class='die-op explode' title='Explode'>&#10057;</button>" : "");
    die.addEventListener("click", function () { toggleKeep(npc, d); });
    die.querySelector(".reroll").addEventListener("click", function (ev) { ev.stopPropagation(); toggleRRMark(npc, d); });
    var ex = die.querySelector(".explode"); if (ex) ex.addEventListener("click", function (ev) { ev.stopPropagation(); explode(npc, d); });
    return die;
  }
  function toggleKeep(npc, d) { if (!d.kept && !d.bonus && keptBase() >= curKeep) return; d.kept = !d.kept; renderDice(npc); tally(npc); }
  function successDie(d) { return ((d.su||0) + (d.ex||0)) > 0; }
  function markedDice() { return pool.filter(function (d) { return d.markedReroll; }); }
  function setRR(m) { rrMode = m; pool.forEach(function (d) { d.markedReroll = false; }); }
  function toggleRRMark(npc, d) {
    if (!rrMode) return;
    if (d.markedReroll) { d.markedReroll = false; renderDice(npc); return; }
    var max = rrMode.free ? Infinity : (rrMode.max || 2);
    if (markedDice().length >= max) return;
    d.markedReroll = true; renderDice(npc);
  }
  function execReroll(npc) {
    var marked = markedDice(); if (!marked.length) return;
    marked.forEach(function (d) { var from = d.key, f = rollFace(d.type); d.key = f.key; d.su = f.su; d.ex = f.ex; d.op = f.op; d.st = f.st; d.explodedDone = false; d.markedReroll = false; if (rollMeta) rollMeta.events.push({ kind:"reroll", type:d.type, from:from, to:f.key, via:(rrMode?rrMode.label:"Reroll") }); });
    rrMode = null; renderDice(npc); tally(npc);
  }
  function renderRR(npc) {
    var bar = document.getElementById("nrRR"); if (!bar) return; bar.innerHTML = "";
    if (!pool.length) return;
    var free = { id:"free", label:"Free Reroll", free:true };
    var fb = el("button", "rr-mode free" + (rrMode && rrMode.id === "free" ? " sel" : ""), "Free Reroll");
    fb.title = "Reroll any number of dice"; fb.addEventListener("click", function () { setRR(rrMode && rrMode.id === "free" ? null : free); renderDice(npc); });
    bar.appendChild(fb);
    if (rrMode) {
      var marks = markedDice().length;
      bar.appendChild(el("span", "rr-hint", "Click the ↻ on dice to mark, then reroll."));
      if (marks >= 1) { var go = el("button", "roll-btn rr-go", "Reroll " + marks + " " + (marks === 1 ? "die" : "dice")); go.addEventListener("click", function () { execReroll(npc); }); bar.appendChild(go); }
    }
  }
  function explode(npc, d) { d.explodedDone = true; var nd = rollFace(d.type); nd.bonus = true; nd.kept = true; pool.splice(pool.indexOf(d) + 1, 0, nd); if (rollMeta) rollMeta.events.push({ kind:"explode", type:d.type, source:d.key, result:nd.key }); renderDice(npc); tally(npc); }

  function tally(npc) {
    var kept = pool.filter(function (d) { return d.kept; });
    var su = 0, op = 0, stf = 0, bonusKept = 0;
    kept.forEach(function (d) { su += d.su + d.ex; op += d.op; stf += d.st; if (d.bonus) bonusKept++; });
    var tn = parseInt(document.getElementById("nrTN").value || "0", 10);
    var e = getEng(npc.id);
    var voidStance = e.inConflict && e.stance === "void";
    var strifeApplied = voidStance ? 0 : stf;
    var res = document.getElementById("nrResult"); res.className = "nr-result show";
    var pass = su >= tn;
    var applyBar;
    if (rollLogged) applyBar = "<div class='applybar'><span class='kept-tag'>✓ Results kept &amp; logged</span></div>";
    else applyBar = "<div class='applybar'><label class='strife-sel'>Keep strife <input type='number' id='nrStrife' min='0' max='" + stf + "' value='" + strifeApplied + "'></label><span class='of-max'>of " + stf + " rolled</span><button class='roll-btn' id='nrKeep'>Keep Results</button>" + (voidStance && stf > 0 ? "<span class='nr-summary'>Void stance: ▲ give no strife</span>" : "") + "</div>";
    res.innerHTML = "<div class='verdict " + (pass ? "pass" : "fail") + "'>" + (pass ? "Success" : "Failure") + " — " + su + " vs TN " + tn + "</div>"
      + "<div class='tallies'><span>Kept <b>" + keptBase() + "/" + curKeep + "</b>" + (bonusKept ? " <em>+" + bonusKept + " bonus</em>" : "") + "</span><span>Successes <b class='sym su'>" + su + "</b></span><span>Opportunity <b class='sym op'>" + op + "</b></span><span>Strife <b class='sym st'>" + stf + "</b></span></div>" + applyBar;
    if (!rollLogged) document.getElementById("nrKeep").addEventListener("click", function () { var amt = Math.max(0, Math.min(stf, parseInt(document.getElementById("nrStrife").value || "0", 10))); keepResults(npc, amt, su, op, stf, tn, pass); });
  }
  function keepResults(npc, strifeAmt, su, op, stfRolled, tn, pass) {
    var e = getEng(npc.id); e.strife = (e.strife || 0) + strifeAmt; saveEng(npc.id, e);
    var kept = pool.filter(function (d) { return d.kept; });
    var noteEl = document.getElementById("nrNote"); var note = noteEl && noteEl.value ? noteEl.value.trim() : "";
    var m = rollMeta || {};
    var log = getLog(npc.id);
    log.unshift({ n: log.length + 1, note: note, ring: m.ring, ringN: m.ringN, group: m.group, skillN: m.skillN, assistSkill: m.assistSkill||0, assistRing: m.assistRing||0,
      keepLimit: (m.keepLimit != null ? m.keepLimit : curKeep), keptBaseCount: kept.filter(function(d){return !d.bonus;}).length, bonusKept: kept.filter(function(d){return d.bonus;}).length,
      initial: m.initial || [], events: m.events || [], tn: tn, su: su, op: op, strifeRolled: stfRolled, strifeApplied: strifeAmt, pass: pass,
      inConflict: !!m.inConflict, stance: m.stance || null, conflictType: m.conflictType || null, conflictName: m.conflictName || null,
      kept: kept.map(function (d) { return { type:d.type, key:d.key, bonus:!!d.bonus }; }), when: nowStr() });
    saveLog(npc.id, log);
    rollLogged = true; tally(npc);
    var lc = document.querySelector(".fc-tab .lc"); // refresh count if visible
    if (lc) lc.textContent = "(" + log.length + ")";
  }

  // opportunity panel (reuse core opportunity tables)
  function renderOpp(npc) {
    var host = document.getElementById("nrOpp"); if (!host) return;
    var tables = L5RD.oppTables || []; if (!tables.length) { host.innerHTML = ""; return; }
    var e = getEng(npc.id); e.oppTable = e.oppTable || "conflict";
    host.innerHTML = "<div class='opp-h'>Opportunity spends (◈)</div>";
    var chips = el("div", "opp-chips");
    tables.forEach(function (t) { var b = el("button", "opp-chip" + (e.oppTable === t[0] ? " sel" : ""), t[1]); b.addEventListener("click", function () { var en = getEng(npc.id); en.oppTable = t[0]; saveEng(npc.id, en); renderOpp(npc); }); chips.appendChild(b); });
    host.appendChild(chips);
    host.appendChild(el("div", "opp-ringnote", "Spends for the <b>" + cap(e.ring) + "</b> approach."));
    var table = (L5RD.opportunities || {})[e.oppTable] || {};
    var list = el("div", "opp-list");
    if (table.any) list.appendChild(oppGroup("Any approach", table.any));
    if (table[e.ring]) list.appendChild(oppGroup(cap(e.ring) + " approach", table[e.ring]));
    else if (!table.any) list.appendChild(el("div", "opp-empty", "No " + cap(e.ring) + " opportunities listed here."));
    host.appendChild(list);
  }
  function oppGroup(label, items) { var g = el("div", "opp-group"); g.appendChild(el("div", "opp-gl", label)); items.forEach(function (s) { var e = el("div", "opp-item"); e.innerHTML = syms(s); g.appendChild(e); }); return g; }

  // ============================ conflict (per NPC) ============================
  function buildConflict(npc, pane) {
    var e = getEng(npc.id);
    if (!e.inConflict) {
      var enter = el("button", "roll-btn", "⚔ Enter Conflict");
      enter.addEventListener("click", function () { var en = getEng(npc.id); en.inConflict = true; en.conflictType = en.conflictType || "skirmish"; saveEng(npc.id, en); renderFocus(); });
      pane.appendChild(enter);
      pane.appendChild(el("p", "nr-hint", "Conflict type, stances, initiative, and actions appear once a conflict begins."));
      return;
    }
    var nameIn = el("input", "conf-name-in"); nameIn.type = "text"; nameIn.placeholder = "Name this conflict (optional)"; nameIn.value = e.conflictName || "";
    nameIn.addEventListener("input", function () { var en = getEng(npc.id); en.conflictName = nameIn.value; saveEng(npc.id, en); });
    pane.appendChild(confRow("Name", nameIn));

    var typeWrap = el("div", "conf-choices");
    Object.keys(L5RD.conflicts).forEach(function (k) { var b = el("button", "conf-choice" + (e.conflictType === k ? " sel" : ""), L5RD.conflicts[k].name); b.addEventListener("click", function () { var en = getEng(npc.id); en.conflictType = k; saveEng(npc.id, en); renderFocus(); }); typeWrap.appendChild(b); });
    pane.appendChild(confRow("Type", typeWrap));
    var conf = L5RD.conflicts[e.conflictType] || { actions:[], initSkill:"—" };

    var stWrap = el("div", "stances");
    RINGS.forEach(function (r) { var b = el("button", "stbtn" + (e.stance === r ? " sel" : ""), cap(r)); b.addEventListener("click", function () { var en = getEng(npc.id); en.stance = r; en.ring = r; saveEng(npc.id, en); renderFocus(); }); stWrap.appendChild(b); });
    pane.appendChild(confRow("Stance", stWrap));
    if (e.stance && L5RD.stances[e.stance]) pane.appendChild(el("div", "stance-detail", "<b>" + L5RD.stances[e.stance].name + ".</b> " + syms(L5RD.stances[e.stance].text)));

    var initWrap = el("div", "conf-init");
    var initBtn = el("button", "roll-btn ghost", "Roll Initiative");
    initBtn.addEventListener("click", function () { teeInitiative(npc, conf); });
    initWrap.appendChild(initBtn);
    initWrap.appendChild(el("span", "conf-note", "TN 1 · " + conf.initSkill + " · any ring — order by bonus successes"));
    pane.appendChild(confRow("Initiative", initWrap));

    var actWrap = el("div", "conf-choices actions");
    var actDetail = el("div", "conf-action-detail"); actDetail.hidden = true;
    (conf.actions || []).forEach(function (a) {
      var hint = a.check ? ((a.check.tn != null ? "TN " + a.check.tn : "check") + (a.check.skill ? " · " + cap(a.check.skill) : "")) : "";
      var b = el("button", "conf-action-btn");
      b.innerHTML = "<span class='ca-name'>" + a.name + "</span><span class='ca-cats'>" + a.cats + "</span>" + (hint ? "<span class='ca-hint'>⚄ " + hint + "</span>" : "") + "<span class='ca-info' title='Show rules text'>ⓘ</span>";
      b.addEventListener("click", function () { declareAction(npc, conf, a); });
      b.querySelector(".ca-info").addEventListener("click", function (ev) { ev.stopPropagation(); toggleActionDetail(actDetail, a); });
      actWrap.appendChild(b);
    });
    pane.appendChild(confRow("Actions", actWrap));
    pane.appendChild(actDetail);

    var end = el("button", "roll-btn ghost conf-end", "End Conflict");
    end.addEventListener("click", function () { var en = getEng(npc.id); en.inConflict = false; saveEng(npc.id, en); logEvent(npc.id, "conflict", "Ended conflict" + (en.conflictName ? " “" + en.conflictName + "”" : "")); renderFocus(); });
    pane.appendChild(end);
  }
  function confRow(label, node) { var r = el("div", "conf-row"); r.appendChild(el("div", "conf-label", label)); r.appendChild(node); return r; }
  function toggleActionDetail(host, a) {
    if (host.getAttribute("data-for") === a.name && !host.hidden) { host.hidden = true; host.removeAttribute("data-for"); return; }
    host.setAttribute("data-for", a.name);
    host.innerHTML = "<div class='cad-head'>" + a.name + " <span class='cad-cats'>" + a.cats + "</span></div><p class='cad-desc'>" + syms(a.desc) + "</p><p><b>Activation:</b> " + syms(a.activation) + "</p><p><b>Effects:</b> " + syms(a.effects) + "</p>" + (a.newOpp ? "<p><b>New Opportunities:</b> " + syms(a.newOpp) + "</p>" : "");
    host.hidden = false;
  }
  function declareAction(npc, conf, a) {
    var e = getEng(npc.id);
    var teed = "";
    if (a.check) {
      var parts = []; if (a.check.tn != null) parts.push("TN " + a.check.tn); if (a.check.skill) parts.push(cap(a.check.skill));
      teed = " — teed up check" + (parts.length ? " (" + parts.join(", ") + ")" : "");
      // switch to roll tab, pre-fill TN and (if the action names a group-mappable skill) the group
      if (a.check.skill && GROUPS.indexOf(a.check.skill) >= 0) { e.group = a.check.skill; saveEng(npc.id, e); }
      TAB[npc.id] = "roll"; renderFocus();
      var tn = a.check.tn; setTimeout(function () { var t = document.getElementById("nrTN"); if (t && tn != null) t.value = tn; var n = document.getElementById("nrNote"); if (n && !n.value) n.value = a.name; }, 0);
    }
    logEvent(npc.id, "action", a.name + " (" + a.cats + ")" + teed, { stance: e.stance });
  }
  function teeInitiative(npc, conf) {
    TAB[npc.id] = "roll"; renderFocus();
    setTimeout(function () { var t = document.getElementById("nrTN"); if (t) t.value = 1; var n = document.getElementById("nrNote"); if (n && !n.value) n.value = "Initiative — " + conf.initSkill; }, 0);
    logEvent(npc.id, "action", "Rolled Initiative (" + conf.initSkill + ", TN 1)");
  }

  // ============================ log ============================
  function nowStr() { try { return new Date().toLocaleString(); } catch (e) { return ""; } }
  function logEvent(id, cat, desc, extra) {
    var log = getLog(id);
    log.unshift(Object.assign({ kind:"event", cat:cat, desc:desc, when:nowStr() }, extra || {}));
    saveLog(id, log);
    var lc = document.querySelector(".fc-tab .lc"); if (lc) lc.textContent = "(" + log.length + ")";
    if (TAB[id] === "log" && focusId === id) renderFocus();
  }
  function logDie(k) { return "<img class='logdie " + k.type + (k.bonus ? " bonus" : "") + "' src='../assets/dice/" + k.key + ".svg' alt=''>"; }
  function diceRow(list) { return (list || []).map(function (k) { return logDie(k); }).join(""); }
  function buildLogPane(npc, pane) {
    var log = getLog(npc.id);
    if (!log.length) { pane.appendChild(el("p", "nr-hint", "No rolls or events yet. Roll, then <b>Keep Results</b> — or run a conflict.")); return; }
    var head = el("div", "log-actions"); head.innerHTML = "<span class='nr-summary'>" + log.length + " recorded</span>";
    var clr = el("button", "link-btn", "Clear log"); clr.addEventListener("click", function () { saveLog(npc.id, []); renderFocus(); }); head.appendChild(clr);
    pane.appendChild(head);
    var EVICON = { action:"⚔", conflict:"⚑", strife:"▲", fatigue:"✦" };
    log.forEach(function (e) {
      if (e.kind === "event") { var ev = el("div", "log-event"); ev.innerHTML = "<span class='le-cat'>" + (EVICON[e.cat] || "·") + " " + cap(e.cat || "event") + "</span><span class='le-desc'>" + esc(e.desc || "") + "</span>" + (e.when ? "<span class='log-when'>" + e.when + "</span>" : ""); pane.appendChild(ev); return; }
      var d = el("div", "log-entry " + (e.pass ? "pass" : "fail"));
      var chips = [];
      if (e.keepLimit != null) { var kc = "Kept " + (e.keptBaseCount != null ? e.keptBaseCount : 0) + " of " + e.keepLimit; if (e.bonusKept) kc += " +" + e.bonusKept + " bonus"; chips.push("<span class='logchip'>" + kc + "</span>"); }
      if (e.assistSkill) chips.push("<span class='logchip'>Assist +" + e.assistSkill + " skilled</span>");
      if (e.assistRing) chips.push("<span class='logchip'>Assist +" + e.assistRing + " unskilled</span>");
      if (e.conflictType) chips.push("<span class='logchip'>" + cap(e.conflictType) + "</span>");
      var evRows = "";
      (e.events || []).forEach(function (ev) {
        if (ev.kind === "reroll") evRows += "<div class='log-ev'><span class='ev-tag'>↻ reroll</span>" + logDie({ type:ev.type, key:ev.from }) + "<span class='ev-arrow'>→</span>" + logDie({ type:ev.type, key:ev.to }) + "</div>";
        else if (ev.kind === "explode") evRows += "<div class='log-ev'><span class='ev-tag'>✦ explode</span>" + logDie({ type:ev.type, key:ev.source }) + "<span class='ev-arrow'>→</span>" + logDie({ type:ev.type, key:ev.result, bonus:true }) + "</div>";
      });
      d.innerHTML = "<div class='log-head'><span class='log-verdict'>" + (e.pass ? "Success" : "Failure") + "</span><span class='log-approach'>" + cap(e.ring) + " " + e.ringN + (e.group ? " · " + cap(e.group) + (e.skillN != null ? " " + e.skillN : "") : "") + (e.stance ? " · " + cap(e.stance) + " stance" : "") + (e.conflictName ? " · “" + esc(e.conflictName) + "”" : "") + "</span>" + (e.when ? "<span class='log-when'>" + e.when + "</span>" : "") + "</div>"
        + (e.note ? "<div class='log-note'>" + esc(e.note) + "</div>" : "")
        + (chips.length ? "<div class='log-chips'>" + chips.join("") + "</div>" : "")
        + (e.initial && e.initial.length ? "<div class='log-line'><span class='log-lbl'>Rolled</span><span class='log-dice'>" + diceRow(e.initial) + "</span></div>" : "")
        + (evRows ? "<div class='log-events'>" + evRows + "</div>" : "")
        + "<div class='log-line'><span class='log-lbl'>Kept</span><span class='log-dice'>" + diceRow(e.kept) + "</span></div>"
        + "<div class='log-tally'>" + e.su + " vs TN " + e.tn + "  ·  <span class='sym op'>◈</span> " + e.op + "  ·  <span class='sym st'>▲</span> " + e.strifeApplied + " applied" + (e.strifeRolled !== e.strifeApplied ? " (of " + e.strifeRolled + " rolled)" : "") + "</div>";
      pane.appendChild(d);
    });
  }

  render();
})();
