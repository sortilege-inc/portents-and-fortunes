/* ============================================================
   dramatis.js — Dramatis Personae.

   A carousel of tarot cards (browse the cast) feeds a SCENE below:
   - Tap a card's bottom bar to bring the NPC "to the table".
     Template NPCs (e.g. Trained Ashigaru) have a + to add extra
     instances; each instance is tracked separately.
   - The scene panel: scene-wide settings on top (Enter Conflict /
     type, Scene Reset, and the scene log with export/import), a
     roster of NPC names down the left, and the selected NPC's page
     on the right — statblock plus a collapsible Roll & Keep.

   GM switch: OFF = player discovery (facts incl. names fuzzed; click
   to reveal, persists). ON = scene tools (roller/conflict/log) live.
   Persisted: pf-dp-gm, pf-dp-revealed, pf-dp-scene, pf-dp-scene-log,
   pf-dp-eng-<memberId>.
   ============================================================ */
(function () {
  "use strict";
  var NPCS = window.NPCS || [];
  var root = document.getElementById("dp");
  if (!root) return;
  var L5RD = window.L5R || { stances:{}, conflicts:{}, opportunities:{}, oppTables:[] };

  // Player characters live in the Play section; we read their sheet data from
  // those pages so the cards never drift. Add a page here to add a PC.
  var PC_PAGES = ["index.html", "setsuna.html"];
  var CAST = NPCS.slice();   // PCs get prepended once loaded
  var SKILLLBL = function (k) { var m = { unarmed:"Martial Arts [Unarmed]", melee:"Martial Arts [Melee]", ranged:"Martial Arts [Ranged]" }; return m[k] || (k ? cap(k) : "(ring only)"); };

  // ---------------- persisted mode / discovery ----------------
  var GMKEY = "pf-dp-gm", REVKEY = "pf-dp-revealed", SCENEKEY = "pf-dp-scene", SLOGKEY = "pf-dp-scene-log";
  var gm = false; try { gm = localStorage.getItem(GMKEY) === "1"; } catch (e) {}
  var revealed = {}; try { revealed = JSON.parse(localStorage.getItem(REVKEY)) || {}; } catch (e) {}
  function saveRevealed() { try { localStorage.setItem(REVKEY, JSON.stringify(revealed)); } catch (e) {} }
  function setGM(on) { gm = on; try { localStorage.setItem(GMKEY, on ? "1" : "0"); } catch (e) {} }

  var scene = { members:[], selected:null, inConflict:false, conflictType:"skirmish", conflictName:"", counters:{} };
  try { var sv = JSON.parse(localStorage.getItem(SCENEKEY)); if (sv) Object.assign(scene, sv); } catch (e) {}
  function saveScene() { try { localStorage.setItem(SCENEKEY, JSON.stringify(scene)); } catch (e) {} }

  function engKey(mid) { return "pf-dp-eng-" + mid; }
  function getEng(mid) { var d = { stance:"void", ring:"earth", group:"martial", oppTable:"conflict", strife:0, fatigue:0 }; try { var s = JSON.parse(localStorage.getItem(engKey(mid))); if (s) Object.assign(d, s); } catch (e) {} return d; }
  function saveEng(mid, e) { try { localStorage.setItem(engKey(mid), JSON.stringify(e)); } catch (er) {} }

  // scene log (one log for the whole scene, tagged by member)
  function getLog() { try { return JSON.parse(localStorage.getItem(SLOGKEY)) || []; } catch (e) { return []; } }
  function saveLog(l) { try { localStorage.setItem(SLOGKEY, JSON.stringify(l)); } catch (e) {} }

  // ---------------- members ----------------
  function byId(id) { for (var i=0;i<CAST.length;i++) if (CAST[i].id===id) return CAST[i]; return null; }
  function baseIdOf(mid) { return String(mid).split("#")[0]; }
  function instNumOf(mid) { var p = String(mid).split("#"); return p.length > 1 ? parseInt(p[1], 10) : 0; }
  function memberNpc(mid) { return byId(baseIdOf(mid)); }
  function memberName(mid) { var npc = memberNpc(mid); if (!npc) return mid; var n = instNumOf(mid); return n ? (npc.name + " " + n) : npc.name; }
  function inScene(id) { return scene.members.indexOf(id) >= 0; }
  function instanceCount(baseId) { var c = 0; scene.members.forEach(function (m) { if (baseIdOf(m) === baseId) c++; }); return c; }

  // ---------------- dice ----------------
  var RING_FACES = [ {key:"ring_blank"}, {key:"ring_ot",op:1,st:1}, {key:"ring_o",op:1}, {key:"ring_st",su:1,st:1}, {key:"ring_s",su:1}, {key:"ring_et",ex:1,st:1} ];
  var SKILL_FACES = [ {key:"skill_blank"}, {key:"skill_blank"}, {key:"skill_o",op:1}, {key:"skill_o",op:1}, {key:"skill_o",op:1}, {key:"skill_st",su:1,st:1}, {key:"skill_st",su:1,st:1}, {key:"skill_s",su:1}, {key:"skill_s",su:1}, {key:"skill_so",su:1,op:1}, {key:"skill_et",ex:1,st:1}, {key:"skill_e",ex:1} ];
  var RINGS = ["air","earth","fire","water","void"];
  var GROUPS = ["artisan","martial","scholar","social","trade"];
  function rollFace(type) { var f = (type === "ring" ? RING_FACES : SKILL_FACES); var d = f[Math.floor(Math.random() * f.length)]; return { type:type, key:d.key, su:d.su||0, ex:d.ex||0, op:d.op||0, st:d.st||0, kept:false, bonus:false, explodedDone:false, markedReroll:false }; }
  function faceTitle(d){ var p=[]; if(d.ex)p.push(d.ex+"× explosive success"); if(d.su)p.push(d.su+"× success"); if(d.op)p.push(d.op+"× opportunity"); if(d.st)p.push(d.st+"× strife"); return p.length?p.join(", "):"blank"; }

  // ---------------- helpers ----------------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ringIcon(r) { return "<img class='ring-ico' src='../assets/rings/" + r + ".svg' alt='" + cap(r) + "' title='" + cap(r) + "'>"; }
  function syms(t) {
    if (t == null) return "";
    return esc(t).replace(/\(op\)/g,"<span class='sym op'>◈</span>").replace(/\(su\)/g,"<span class='sym su'>❁</span>")
      .replace(/\(ex\)/g,"<span class='sym ex'>❉</span>").replace(/\(st\)/g,"<span class='sym st'>▲</span>")
      .replace(/\(ring\)/g,"<span class='sym ring'>⬢</span>").replace(/\((air|earth|fire|water|void)\)/gi, function (m,r) { return ringIcon(r.toLowerCase()); });
  }
  function nowStr() { try { return new Date().toLocaleString(); } catch (e) { return ""; } }

  // ---- fuzzable fact ----
  function fz(fid, inner, extraCls) {
    var isRev = gm || revealed[fid] || /^pc-/.test(fid);   // players know their own PCs — never fuzz them
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
    // prune stale selection
    if (scene.selected && scene.members.indexOf(scene.selected) < 0) scene.selected = scene.members[0] || null;
    if (!scene.selected && scene.members.length) scene.selected = scene.members[0];
    root.innerHTML = "";
    root.appendChild(buildModeBar());
    root.appendChild(buildCarousel());
    var sc = el("div", "dp-scene"); sc.id = "dpScene"; root.appendChild(sc);
    renderScene();
  }

  function buildModeBar() {
    var bar = el("div", "dp-modebar");
    bar.innerHTML = "<div class='mb-left'><span class='mb-eye'>&#9673;</span><div class='mb-copy'><span class='mb-mode'>" + (gm ? "Game Master" : "Player — discovery") + "</span><span class='mb-note'>" + (gm ? "Every fact shown · scene tools are live." : "Facts are concealed until met. Click any blur to reveal it — reveals persist.") + "</span></div></div>";
    var sw = el("button", "gm-switch" + (gm ? " on" : "")); sw.setAttribute("role","switch"); sw.setAttribute("aria-checked", gm ? "true" : "false");
    sw.innerHTML = "<span class='gs-label'>GM</span><span class='gs-track'><span class='gs-knob'></span></span>";
    sw.addEventListener("click", function () { setGM(!gm); render(); });
    bar.appendChild(sw); return bar;
  }

  // ---------------- carousel of tarot cards ----------------
  function buildCarousel() {
    var wrap = el("div", "dp-carousel-wrap");
    var prev = el("button", "car-nav prev", "&#8249;"); prev.setAttribute("aria-label","Previous");
    var next = el("button", "car-nav next", "&#8250;"); next.setAttribute("aria-label","Next");
    var track = el("div", "dp-carousel"); track.id = "dpCarousel";
    CAST.forEach(function (npc) { track.appendChild(tarotCard(npc)); });
    prev.addEventListener("click", function () { track.scrollBy({ left:-cardStep(track), behavior:"smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: cardStep(track), behavior:"smooth" }); });
    wrap.appendChild(prev); wrap.appendChild(track); wrap.appendChild(next);
    return wrap;
  }
  function cardStep(track) { var c = track.querySelector(".tarot"); return c ? (c.offsetWidth + 18) : 300; }

  function tarotCard(npc) {
    var id = npc.id;
    var isTpl = !!npc.template;
    var count = instanceCount(id);
    var onTable = isTpl ? count > 0 : inScene(id);
    var card = el("article", "tarot" + (onTable ? " active" : "") + (npc.stat ? "" : " nostat") + (npc.pc ? " pc" : ""));
    card.setAttribute("data-id", id);
    var kind = npc.stat ? npc.stat.kind : "Bio";
    var inner = el("div", "tr-inner");
    if (npc.portrait) {
      var pf = el("div", "tr-portrait");
      pf.appendChild(fz(id + ":portrait", "<img src='" + npc.portrait + "' alt='' loading='lazy'>", "fz-portrait"));
      inner.appendChild(pf);
    } else {
      inner.appendChild(el("div", "tr-emblem", kindEmblem(kind)));
    }
    var nm = el("div", "tr-name"); nm.appendChild(fz(id + ":name", esc(npc.name), "fz-name")); inner.appendChild(nm);
    if (npc.epithet) { var ep = el("div", "tr-ep"); ep.appendChild(fz(id + ":epithet", esc(npc.epithet), "fz-block")); inner.appendChild(ep); }
    inner.appendChild(el("div", "tr-kind", esc(kind) + (isTpl ? " · template" : "")));
    var snip = (npc.bio && npc.bio[0]) ? npc.bio[0] : "";
    if (snip) { var sn = el("p", "tr-snip"); sn.appendChild(fz(id + ":bio0", esc(snip), "fz-block")); inner.appendChild(sn); }
    card.appendChild(inner);

    // bottom "table" bar acts as the add/toggle control
    var barLabel = isTpl ? (count > 0 ? "On the table ×" + count : "Add to the table") : (onTable ? "On the table ✓" : "Bring to the table");
    var bar = el("div", "tr-table" + (onTable ? " on" : ""), barLabel);
    card.appendChild(bar);
    // + to add another instance (templates only)
    if (isTpl) { var plus = el("button", "tr-plus", "+"); plus.title = "Add another " + npc.name + " to the scene"; plus.addEventListener("click", function (ev) { ev.stopPropagation(); addInstance(id); }); card.appendChild(plus); }

    card.addEventListener("click", function () { primaryAdd(npc); });
    return card;
  }
  function kindEmblem(kind) { return kind === "Player Character" ? "◈" : kind === "Minion" ? "▲" : kind === "Adversary" ? "❁" : "❖"; }

  function primaryAdd(npc) {
    if (npc.template) { addInstance(npc.id); return; }
    if (inScene(npc.id)) { removeMember(npc.id); } else { scene.members.push(npc.id); scene.selected = npc.id; saveScene(); render(); }
  }
  function addInstance(baseId) {
    var n = (scene.counters[baseId] || 0) + 1; scene.counters[baseId] = n;
    var mid = baseId + "#" + n; scene.members.push(mid); scene.selected = mid; saveScene(); render();
  }
  function removeMember(mid) {
    scene.members = scene.members.filter(function (m) { return m !== mid; });
    if (scene.selected === mid) scene.selected = scene.members[0] || null;
    saveScene(); render();
  }

  // ============================ scene panel ============================
  var rollOpen = false, pendingTee = null;
  function renderScene() {
    var host = document.getElementById("dpScene"); if (!host) return;
    host.innerHTML = "";
    if (gm) host.appendChild(buildSceneSettings());
    if (!scene.members.length) { host.appendChild(el("p", "scene-empty", "No one on the table yet. Tap a card's bottom bar above to bring an NPC (or a PC) into the scene" + (CAST.some(function(n){return n.template;}) ? " — use + on a template to add several." : "."))); return; }
    var main = el("div", "scene-main");
    main.appendChild(buildRoster());
    var sheet = el("div", "scene-sheet"); sheet.id = "sceneSheet"; main.appendChild(sheet);
    host.appendChild(main);
    renderSheet();
  }
  function selectMember(mid) { scene.selected = mid; saveScene(); rollOpen = false; renderScene(); }

  function buildRoster() {
    var box = el("div", "scene-roster");
    box.appendChild(el("div", "sr-lab", "In the scene"));
    var list = el("div", "sr-list");
    scene.members.forEach(function (mid) {
      var npc = memberNpc(mid); if (!npc) return;
      var row = el("div", "sr-item" + (scene.selected === mid ? " sel" : ""));
      var nm = el("button", "sr-name");
      nm.appendChild(fz(baseIdOf(mid) + ":name", esc(memberName(mid)), "fz-inline"));
      nm.addEventListener("click", function () { selectMember(mid); });
      row.appendChild(nm);
      var rm = el("button", "sr-rm", "×"); rm.title = "Remove from scene"; rm.addEventListener("click", function (ev) { ev.stopPropagation(); removeMember(mid); });
      row.appendChild(rm);
      list.appendChild(row);
    });
    box.appendChild(list);
    return box;
  }

  // ---------------- scene-wide settings ----------------
  function buildSceneSettings() {
    var box = el("div", "scene-settings");
    // conflict controls
    var cf = el("div", "ss-block");
    if (!scene.inConflict) {
      var enter = el("button", "roll-btn", "⚔ Enter Conflict");
      enter.addEventListener("click", function () { scene.inConflict = true; scene.conflictType = scene.conflictType || "skirmish"; saveScene(); logEvent(null, "conflict", "Conflict began" + (scene.conflictName ? " “" + scene.conflictName + "”" : "")); renderScene(); });
      cf.appendChild(enter);
    } else {
      var line = el("div", "ss-conflict");
      var types = el("div", "conf-choices");
      Object.keys(L5RD.conflicts).forEach(function (k) { var b = el("button", "conf-choice" + (scene.conflictType === k ? " sel" : ""), L5RD.conflicts[k].name); b.addEventListener("click", function () { scene.conflictType = k; saveScene(); renderScene(); }); types.appendChild(b); });
      var nameIn = el("input", "conf-name-in"); nameIn.type = "text"; nameIn.placeholder = "Name this conflict (optional)"; nameIn.value = scene.conflictName || "";
      nameIn.addEventListener("input", function () { scene.conflictName = nameIn.value; saveScene(); });
      var end = el("button", "roll-btn ghost", "End Conflict");
      end.addEventListener("click", function () { scene.inConflict = false; saveScene(); logEvent(null, "conflict", "Conflict ended" + (scene.conflictName ? " “" + scene.conflictName + "”" : "")); renderScene(); });
      line.appendChild(el("span", "ss-lab", "⚔ Conflict")); line.appendChild(types); line.appendChild(nameIn); line.appendChild(end);
      cf.appendChild(line);
      cf.appendChild(el("p", "conf-note", (L5RD.conflicts[scene.conflictType] || {}).name + " · initiative: " + ((L5RD.conflicts[scene.conflictType] || {}).initSkill || "—") + " · each NPC picks a stance on its page."));
    }
    box.appendChild(cf);

    // scene reset + log tools
    var tools = el("div", "ss-tools");
    var reset = el("button", "roll-btn ghost", "⟳ Scene Reset");
    reset.title = "End the conflict and reduce every NPC's strife & fatigue to half.";
    reset.addEventListener("click", sceneReset);
    tools.appendChild(reset);
    var clear = el("button", "roll-btn ghost", "✕ Clear Table");
    clear.title = "Empty the scene: remove everyone, discard their trackers, and reset numbering so the next copy of a template is “1”. The scene log is kept.";
    clear.addEventListener("click", clearTable);
    tools.appendChild(clear);
    var logBtn = el("button", "roll-btn ghost", "Log " + (getLog().length ? "(" + getLog().length + ")" : ""));
    logBtn.addEventListener("click", function () { var p = document.getElementById("sceneLogPane"); if (p) { p.hidden = !p.hidden; } });
    tools.appendChild(logBtn);
    var ex = el("button", "roll-btn ghost", "▼ Export"); ex.title = "Download the scene log"; ex.addEventListener("click", exportLog); tools.appendChild(ex);
    var imBtn = el("button", "roll-btn ghost", "▲ Import"); imBtn.title = "Load a scene log"; var file = el("input"); file.type = "file"; file.accept = "application/json,.json"; file.style.display = "none";
    imBtn.addEventListener("click", function () { file.click(); }); file.addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (f) importLog(f); e.target.value = ""; });
    tools.appendChild(imBtn); tools.appendChild(file);
    box.appendChild(tools);

    var logPane = el("div", "scene-logpane"); logPane.id = "sceneLogPane"; logPane.hidden = true;
    box.appendChild(logPane);
    renderLog(logPane);
    return box;
  }
  function sceneReset() {
    scene.members.forEach(function (mid) {
      var npc = memberNpc(mid); if (!npc || !npc.stat) return;
      var e = getEng(mid);
      e.strife = Math.min(e.strife || 0, Math.floor(npc.stat.composure / 2));
      e.fatigue = Math.min(e.fatigue || 0, Math.floor(npc.stat.endurance / 2));
      e.stance = "void"; saveEng(mid, e);
    });
    scene.inConflict = false; saveScene();
    logEvent(null, "scene", "Scene reset — conflict ended, strife & fatigue reduced to half.");
    renderScene();
  }
  // Empties the table. Distinct from sceneReset(), which is the rules-side rest
  // between scenes: this one takes everybody off, drops their trackers with them,
  // and zeroes the instance counters so templates number from 1 again. The scene
  // log is deliberately kept — it is the record of what happened, not scene state.
  function clearTable() {
    var n = scene.members.length;
    if (n && !confirm("Clear the table?\n\nThis removes all " + n + " participant" + (n === 1 ? "" : "s")
      + " from the scene, discards their trackers (strife, fatigue, stance, conditions), and resets"
      + " numbering so the next copy of a template is “1”.\n\nThe scene log is kept — export it first"
      + " if you want a copy.")) return;
    purgeEngagements();
    scene.members = []; scene.selected = null; scene.counters = {};
    scene.inConflict = false; scene.conflictName = "";
    saveScene();
    VIEW = {}; rollOpen = false; pendingTee = null;
    if (n) logEvent(null, "scene", "Table cleared — " + n + " participant" + (n === 1 ? "" : "s")
      + " removed, instance numbering reset.");
    renderScene();
  }
  // Engagement state outlives its member — removeMember() leaves the key behind so
  // an NPC put back on the table returns as they left it. Clearing has to sweep the
  // whole namespace rather than just the current roster, or a fresh "Name 1" would
  // inherit the strife of the last one.
  function purgeEngagements() {
    try {
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("pf-dp-eng-") === 0) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  // ============================ selected NPC page ============================
  var VIEW = {};
  function renderSheet() {
    var host = document.getElementById("sceneSheet"); if (!host) return;
    host.innerHTML = "";
    var mid = scene.selected; if (!mid) { host.appendChild(el("p", "dp-meta", "Select a name at left.")); return; }
    var npc = memberNpc(mid); if (!npc) return;
    var view = npc.stat ? (VIEW[mid] || "play") : "bio";

    var head = el("div", "sh-head2");
    if (npc.portrait) {
      var hp = el("div", "sh2-portrait");
      hp.appendChild(fz(baseIdOf(mid) + ":portrait", "<img src='" + npc.portrait + "' alt='' loading='lazy'>", "fz-portrait"));
      head.appendChild(hp);
    }
    var idbox = el("div", "sh2-id");
    idbox.appendChild(fz(baseIdOf(mid) + ":name", "<span class='sh2-nm'>" + esc(memberName(mid)) + "</span>", "fz-name"));
    if (npc.epithet) idbox.appendChild(fz(baseIdOf(mid) + ":epithet", "<span class='sh2-ep'>" + esc(npc.epithet) + "</span>", "fz-block"));
    head.appendChild(idbox);
    if (npc.stat) {
      var seg = el("div", "dp-seg");
      ["bio","play"].forEach(function (v) { var b = el("button", "seg-btn" + (view === v ? " sel" : ""), v === "bio" ? "Bio" : "Play"); b.addEventListener("click", function () { VIEW[mid] = v; renderSheet(); }); seg.appendChild(b); });
      head.appendChild(seg);
    }
    host.appendChild(head);

    var body = el("div", "sh2-body");
    host.appendChild(body);
    if (view === "bio" || !npc.stat) { body.appendChild(buildBio(npc)); return; }

    // GM: collapsible Roll & Keep at TOP, then conflict-turn (if scene in conflict), then statblock
    if (gm) {
      body.appendChild(buildRollSection(mid, npc));
      if (scene.inConflict) body.appendChild(buildConflictTurn(mid, npc));
    }
    body.appendChild(buildStatblock(mid, npc));
    if (!gm) body.appendChild(el("p", "dp-meta gm-hint", "Turn on GM (top) to roll and run the conflict for this NPC."));
    // apply a pending tee-up now that the roll section exists
    if (pendingTee) { var t = document.getElementById("nrTN"); if (t && pendingTee.tn != null) t.value = pendingTee.tn; var n = document.getElementById("nrNote"); if (n && pendingTee.note && !n.value) n.value = pendingTee.note; pendingTee = null; }
  }

  function buildBio(npc) {
    var wrap = el("div", "dp-bio");
    (npc.bio || []).forEach(function (p, i) { var para = el("p", "dp-bp"); para.appendChild(fz(npc.id + ":bio" + i, esc(p), "fz-block")); wrap.appendChild(para); });
    if (npc.statNote) wrap.appendChild(el("p", "dp-statnote", "&#9873; " + esc(npc.statNote)));
    if (npc.status) wrap.appendChild(el("p", "dp-meta", esc(npc.status)));
    if (!npc.stat) wrap.appendChild(el("p", "dp-meta dp-nostat", "No statblock yet — bio only."));
    return wrap;
  }

  // ============================ roller (collapsible) ============================
  var pool = [], curKeep = 0, rollMeta = null, rrMode = null, rollLogged = false, cfg = { assistSkill:0, assistRing:0 };
  function resetRollState() { pool = []; curKeep = 0; rollMeta = null; rrMode = null; rollLogged = false; cfg = { assistSkill:0, assistRing:0 }; }
  function ringN(npc, mid) { return npc.stat.rings[getEng(mid).ring] || 0; }
  function skillN(npc, mid) { var e = getEng(mid); if (npc.stat.pc) return e.group ? (npc.stat.skillsIndividual[e.group] || 0) : 0; return npc.stat.skills[e.group] || 0; }
  // NPCs choose a skill group; PCs choose one of their individual skills (or ring-only).
  function skillOptions(npc) {
    if (npc.stat.pc) {
      var out = [{ key:"", label:"— ring only —" }], sm = npc.stat.skillsIndividual || {};
      Object.keys(sm).forEach(function (k) { if (sm[k]) out.push({ key:k, label:SKILLLBL(k) + " " + sm[k] }); });
      return out;
    }
    return GROUPS.map(function (g) { return { key:g, label:cap(g) + " " + (npc.stat.skills[g]||0) }; });
  }

  function buildRollSection(mid, npc) {
    resetRollState();
    var e = getEng(mid);
    var sec = el("div", "roll-sec" + (rollOpen ? "" : " collapsed"));
    var head = el("button", "roll-toggle");
    head.innerHTML = "<span class='rt-title'>&#9860; Roll &amp; Keep</span><span class='rt-cur' id='nrCur'></span><span class='rt-chev'>&#9656;</span>";
    head.addEventListener("click", function () { rollOpen = !rollOpen; sec.classList.toggle("collapsed", !rollOpen); });
    sec.appendChild(head);
    var bodyWrap = el("div", "roll-secbody");
    var wrap = el("div", "nr");
    wrap.innerHTML =
      "<div class='nr-controls'>"
      + "<div class='nr-field'><label>Ring</label><span class='nr-chips' id='nrRings'></span></div>"
      + "<div class='nr-field'><label>Skill</label><span class='nr-chips' id='nrGroups'></span></div>"
      + "<div class='nr-field nr-tn'><label>TN</label><input id='nrTN' type='number' min='0' value='2'></div>"
      + "<div class='nr-field'><label>Assist — skilled</label><span class='stepper' data-cfg='assistSkill'></span></div>"
      + "<div class='nr-field'><label>Assist — unskilled</label><span class='stepper' data-cfg='assistRing'></span></div>"
      + "</div>"
      + "<div class='nr-noterow'><label>Concerning</label><input type='text' id='nrNote' placeholder='What is this roll about? (optional — saved to the log)' maxlength='140'></div>"
      + "<div class='nr-actions'><button class='roll-btn' id='nrRoll'>Assemble &amp; Roll</button><button class='roll-btn ghost' id='nrClear'>Clear</button><span class='nr-summary' id='nrSummary'></span></div>"
      + "<p class='nr-hint'><b>Click dice to keep</b> — nothing is kept for you. <b>&#8635;</b> marks a die to reroll. A kept <b>explosive</b> (&#10057;) die shows an explode button.</p>"
      + "<div class='dice-row' id='nrDice'></div><div class='reroll-bar' id='nrRR'></div><div class='nr-result' id='nrResult'></div><div class='opp-panel' id='nrOpp'></div>";
    bodyWrap.appendChild(wrap); sec.appendChild(bodyWrap);
    wireRoller(mid, npc, wrap);
    return sec;
  }
  function wireRoller(mid, npc, wrap) {
    var e = getEng(mid);
    var rc = wrap.querySelector("#nrRings");
    RINGS.forEach(function (r) { var b = el("button", "nr-chip" + (e.ring === r ? " sel" : ""), cap(r) + " " + npc.stat.rings[r]); b.addEventListener("click", function () { var en = getEng(mid); en.ring = r; saveEng(mid, en); rc.querySelectorAll(".nr-chip").forEach(function(x){x.classList.remove("sel");}); b.classList.add("sel"); syncSummary(mid, npc); renderOpp(mid, npc); }); rc.appendChild(b); });
    var gc = wrap.querySelector("#nrGroups");
    skillOptions(npc).forEach(function (o) { var b = el("button", "nr-chip" + (e.group === o.key ? " sel" : ""), o.label); b.addEventListener("click", function () { var en = getEng(mid); en.group = o.key; saveEng(mid, en); gc.querySelectorAll(".nr-chip").forEach(function(x){x.classList.remove("sel");}); b.classList.add("sel"); syncSummary(mid, npc); }); gc.appendChild(b); });
    buildStepper(wrap.querySelector("[data-cfg='assistSkill']"), "assistSkill");
    buildStepper(wrap.querySelector("[data-cfg='assistRing']"), "assistRing");
    wrap.querySelector("#nrRoll").addEventListener("click", function () { doRoll(mid, npc); });
    wrap.querySelector("#nrClear").addEventListener("click", function () { pool = []; renderDice(mid, npc); document.getElementById("nrResult").classList.remove("show"); });
    wrap.querySelector("#nrTN").addEventListener("input", function () { if (pool.length) tally(mid, npc); });
    syncSummary(mid, npc); renderOpp(mid, npc);
  }
  function syncSummary(mid, npc) {
    var s = document.getElementById("nrSummary"); if (s) s.innerHTML = "Base pool <b>" + (ringN(npc, mid) + skillN(npc, mid)) + "</b> · keep <b>" + ringN(npc, mid) + "</b>";
    var cur = document.getElementById("nrCur"); if (cur) { var e = getEng(mid); cur.textContent = cap(e.ring) + " " + (npc.stat.rings[e.ring]||0) + " · " + (npc.stat.pc ? SKILLLBL(e.group) : cap(e.group)) + " " + skillN(npc, mid); }
  }
  function buildStepper(host, key) {
    host.innerHTML = "<button class='st-btn' data-d='-1'>−</button><span class='st-val'>0</span><button class='st-btn' data-d='1'>+</button>";
    var val = host.querySelector(".st-val");
    host.querySelectorAll(".st-btn").forEach(function (b) { b.addEventListener("click", function () { cfg[key] = Math.max(0, Math.min(6, (cfg[key]||0) + parseInt(b.getAttribute("data-d"),10))); val.textContent = cfg[key]; }); });
  }
  function doRoll(mid, npc) {
    rollLogged = false; rrMode = null;
    var i; pool = [];
    for (i=0;i<ringN(npc,mid)+cfg.assistRing;i++) pool.push(rollFace("ring"));
    for (i=0;i<skillN(npc,mid)+cfg.assistSkill;i++) pool.push(rollFace("skill"));
    curKeep = ringN(npc,mid) + cfg.assistRing + cfg.assistSkill;
    var e = getEng(mid);
    rollMeta = { ring:e.ring, ringN:ringN(npc,mid), group:e.group, skillN:skillN(npc,mid), assistSkill:cfg.assistSkill, assistRing:cfg.assistRing, keepLimit:curKeep,
      initial: pool.map(function (d) { return { type:d.type, key:d.key }; }), events: [],
      inConflict: !!scene.inConflict, stance: scene.inConflict ? e.stance : null, conflictType: scene.inConflict ? scene.conflictType : null, conflictName: scene.inConflict ? (scene.conflictName||null) : null };
    renderDice(mid, npc); tally(mid, npc);
  }
  function keptBase() { return pool.filter(function (d) { return d.kept && !d.bonus; }).length; }
  function renderDice(mid, npc) {
    var row = document.getElementById("nrDice"); if (!row) return; row.innerHTML = "";
    if (!pool.length) { var r = document.getElementById("nrResult"); if (r) r.classList.remove("show"); renderRR(mid, npc); return; }
    ["ring","skill"].forEach(function (type) { var group = pool.filter(function (d) { return d.type === type; }); if (!group.length) return; row.appendChild(el("div", "dice-group-label", type === "ring" ? "Ring Dice (d6)" : "Skill Dice (d12)")); group.forEach(function (d) { row.appendChild(makeDie(mid, npc, d)); }); });
    renderRR(mid, npc);
  }
  function makeDie(mid, npc, d) {
    var die = el("div", "die " + d.type + (d.kept ? " kept" : "") + (d.bonus ? " bonus" : "") + (d.markedReroll ? " marked" : ""));
    die.title = faceTitle(d);
    var canExplode = d.kept && d.ex > 0 && !d.explodedDone;
    die.innerHTML = "<img class='face' src='../assets/dice/" + d.key + ".svg' alt=''><span class='dtype'>" + (d.type === "ring" ? "d6" : "d12") + "</span><button class='die-op reroll" + (d.markedReroll ? " active" : "") + "' title='Mark for reroll'>&#8635;</button>" + (canExplode ? "<button class='die-op explode' title='Explode'>&#10057;</button>" : "");
    die.addEventListener("click", function () { toggleKeep(mid, npc, d); });
    die.querySelector(".reroll").addEventListener("click", function (ev) { ev.stopPropagation(); toggleRRMark(mid, npc, d); });
    var ex = die.querySelector(".explode"); if (ex) ex.addEventListener("click", function (ev) { ev.stopPropagation(); explode(mid, npc, d); });
    return die;
  }
  function toggleKeep(mid, npc, d) { if (!d.kept && !d.bonus && keptBase() >= curKeep) return; d.kept = !d.kept; renderDice(mid, npc); tally(mid, npc); }
  function markedDice() { return pool.filter(function (d) { return d.markedReroll; }); }
  function setRR(m) { rrMode = m; pool.forEach(function (d) { d.markedReroll = false; }); }
  function toggleRRMark(mid, npc, d) { if (!rrMode) return; if (d.markedReroll) { d.markedReroll = false; renderDice(mid, npc); return; } var max = rrMode.free ? Infinity : (rrMode.max || 2); if (markedDice().length >= max) return; d.markedReroll = true; renderDice(mid, npc); }
  function execReroll(mid, npc) { var marked = markedDice(); if (!marked.length) return; marked.forEach(function (d) { var from = d.key, f = rollFace(d.type); d.key = f.key; d.su = f.su; d.ex = f.ex; d.op = f.op; d.st = f.st; d.explodedDone = false; d.markedReroll = false; if (rollMeta) rollMeta.events.push({ kind:"reroll", type:d.type, from:from, to:f.key }); }); rrMode = null; renderDice(mid, npc); tally(mid, npc); }
  function renderRR(mid, npc) {
    var bar = document.getElementById("nrRR"); if (!bar) return; bar.innerHTML = ""; if (!pool.length) return;
    var free = { id:"free", label:"Free Reroll", free:true };
    var fb = el("button", "rr-mode free" + (rrMode && rrMode.id === "free" ? " sel" : ""), "Free Reroll"); fb.addEventListener("click", function () { setRR(rrMode && rrMode.id === "free" ? null : free); renderDice(mid, npc); }); bar.appendChild(fb);
    if (rrMode) { var marks = markedDice().length; bar.appendChild(el("span", "rr-hint", "Click the ↻ on dice to mark, then reroll.")); if (marks >= 1) { var go = el("button", "roll-btn rr-go", "Reroll " + marks + " " + (marks === 1 ? "die" : "dice")); go.addEventListener("click", function () { execReroll(mid, npc); }); bar.appendChild(go); } }
  }
  function explode(mid, npc, d) { d.explodedDone = true; var nd = rollFace(d.type); nd.bonus = true; nd.kept = true; pool.splice(pool.indexOf(d) + 1, 0, nd); if (rollMeta) rollMeta.events.push({ kind:"explode", type:d.type, source:d.key, result:nd.key }); renderDice(mid, npc); tally(mid, npc); }
  function tally(mid, npc) {
    var kept = pool.filter(function (d) { return d.kept; });
    var su = 0, op = 0, stf = 0, bonusKept = 0;
    kept.forEach(function (d) { su += d.su + d.ex; op += d.op; stf += d.st; if (d.bonus) bonusKept++; });
    var tn = parseInt(document.getElementById("nrTN").value || "0", 10);
    var e = getEng(mid), voidStance = scene.inConflict && e.stance === "void", strifeApplied = voidStance ? 0 : stf;
    var res = document.getElementById("nrResult"); res.className = "nr-result show";
    var pass = su >= tn, applyBar;
    if (rollLogged) applyBar = "<div class='applybar'><span class='kept-tag'>✓ Results kept &amp; logged</span></div>";
    else applyBar = "<div class='applybar'><label class='strife-sel'>Keep strife <input type='number' id='nrStrife' min='0' max='" + stf + "' value='" + strifeApplied + "'></label><span class='of-max'>of " + stf + " rolled</span><button class='roll-btn' id='nrKeep'>Keep Results</button>" + (voidStance && stf > 0 ? "<span class='nr-summary'>Void stance: ▲ give no strife</span>" : "") + "</div>";
    res.innerHTML = "<div class='verdict " + (pass ? "pass" : "fail") + "'>" + (pass ? "Success" : "Failure") + " — " + su + " vs TN " + tn + "</div><div class='tallies'><span>Kept <b>" + keptBase() + "/" + curKeep + "</b>" + (bonusKept ? " <em>+" + bonusKept + " bonus</em>" : "") + "</span><span>Successes <b class='sym su'>" + su + "</b></span><span>Opportunity <b class='sym op'>" + op + "</b></span><span>Strife <b class='sym st'>" + stf + "</b></span></div>" + applyBar;
    if (!rollLogged) document.getElementById("nrKeep").addEventListener("click", function () { var amt = Math.max(0, Math.min(stf, parseInt(document.getElementById("nrStrife").value || "0", 10))); keepResults(mid, npc, amt, su, op, stf, tn, pass); });
  }
  function keepResults(mid, npc, strifeAmt, su, op, stfRolled, tn, pass) {
    var e = getEng(mid); e.strife = (e.strife || 0) + strifeAmt; saveEng(mid, e);
    var kept = pool.filter(function (d) { return d.kept; });
    var noteEl = document.getElementById("nrNote"); var note = noteEl && noteEl.value ? noteEl.value.trim() : "";
    var m = rollMeta || {};
    var log = getLog();
    log.unshift({ who: memberName(mid), note: note, ring: m.ring, ringN: m.ringN, group: m.group, skillN: m.skillN, assistSkill: m.assistSkill||0, assistRing: m.assistRing||0,
      keepLimit: (m.keepLimit != null ? m.keepLimit : curKeep), keptBaseCount: kept.filter(function(d){return !d.bonus;}).length, bonusKept: kept.filter(function(d){return d.bonus;}).length,
      initial: m.initial || [], events: m.events || [], tn: tn, su: su, op: op, strifeRolled: stfRolled, strifeApplied: strifeAmt, pass: pass,
      inConflict: !!m.inConflict, stance: m.stance || null, conflictType: m.conflictType || null, conflictName: m.conflictName || null,
      kept: kept.map(function (d) { return { type:d.type, key:d.key, bonus:!!d.bonus }; }), when: nowStr() });
    saveLog(log); rollLogged = true; tally(mid, npc); refreshLogUI();
    // reflect strife tracker if visible
    var tv = document.querySelector('.trkline[data-key="strife"] .trk-v'); if (tv) tv.textContent = e.strife + " / " + npc.stat.composure;
  }
  function renderOpp(mid, npc) {
    var host = document.getElementById("nrOpp"); if (!host) return;
    var tables = L5RD.oppTables || []; if (!tables.length) { host.innerHTML = ""; return; }
    var e = getEng(mid); e.oppTable = e.oppTable || "conflict";
    host.innerHTML = "<div class='opp-h'>Opportunity spends (◈)</div>";
    var chips = el("div", "opp-chips");
    tables.forEach(function (t) { var b = el("button", "opp-chip" + (e.oppTable === t[0] ? " sel" : ""), t[1]); b.addEventListener("click", function () { var en = getEng(mid); en.oppTable = t[0]; saveEng(mid, en); renderOpp(mid, npc); }); chips.appendChild(b); });
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

  // ============================ conflict turn (per NPC) ============================
  function buildConflictTurn(mid, npc) {
    var conf = L5RD.conflicts[scene.conflictType] || { actions:[], initSkill:"—" };
    var e = getEng(mid);
    var box = el("div", "conf-turn");
    box.appendChild(el("div", "dp-h", "Conflict — " + conf.name + (scene.conflictName ? " · “" + esc(scene.conflictName) + "”" : "")));
    // stance
    var stWrap = el("div", "stances");
    RINGS.forEach(function (r) { var b = el("button", "stbtn" + (e.stance === r ? " sel" : ""), cap(r)); b.addEventListener("click", function () { var en = getEng(mid); en.stance = r; en.ring = r; saveEng(mid, en); renderSheet(); }); stWrap.appendChild(b); });
    box.appendChild(confRow("Stance", stWrap));
    if (e.stance && L5RD.stances[e.stance]) box.appendChild(el("div", "stance-detail", "<b>" + L5RD.stances[e.stance].name + ".</b> " + syms(L5RD.stances[e.stance].text)));
    // initiative
    var initWrap = el("div", "conf-init");
    var initBtn = el("button", "roll-btn ghost", "Roll Initiative"); initBtn.addEventListener("click", function () { teeInitiative(mid, conf); });
    initWrap.appendChild(initBtn); initWrap.appendChild(el("span", "conf-note", "TN 1 · " + conf.initSkill + " · any ring"));
    box.appendChild(confRow("Initiative", initWrap));
    // actions
    var actWrap = el("div", "conf-choices actions");
    var actDetail = el("div", "conf-action-detail"); actDetail.hidden = true;
    (conf.actions || []).forEach(function (a) {
      var hint = a.check ? ((a.check.tn != null ? "TN " + a.check.tn : "check") + (a.check.skill ? " · " + cap(a.check.skill) : "")) : "";
      var b = el("button", "conf-action-btn");
      b.innerHTML = "<span class='ca-name'>" + a.name + "</span><span class='ca-cats'>" + a.cats + "</span>" + (hint ? "<span class='ca-hint'>⚄ " + hint + "</span>" : "") + "<span class='ca-info' title='Show rules text'>ⓘ</span>";
      b.addEventListener("click", function () { declareAction(mid, a); });
      b.querySelector(".ca-info").addEventListener("click", function (ev) { ev.stopPropagation(); toggleActionDetail(actDetail, a); });
      actWrap.appendChild(b);
    });
    box.appendChild(confRow("Actions", actWrap));
    box.appendChild(actDetail);
    return box;
  }
  function confRow(label, node) { var r = el("div", "conf-row"); r.appendChild(el("div", "conf-label", label)); r.appendChild(node); return r; }
  function toggleActionDetail(host, a) {
    if (host.getAttribute("data-for") === a.name && !host.hidden) { host.hidden = true; host.removeAttribute("data-for"); return; }
    host.setAttribute("data-for", a.name);
    host.innerHTML = "<div class='cad-head'>" + a.name + " <span class='cad-cats'>" + a.cats + "</span></div><p class='cad-desc'>" + syms(a.desc) + "</p><p><b>Activation:</b> " + syms(a.activation) + "</p><p><b>Effects:</b> " + syms(a.effects) + "</p>" + (a.newOpp ? "<p><b>New Opportunities:</b> " + syms(a.newOpp) + "</p>" : "");
    host.hidden = false;
  }
  function declareAction(mid, a) {
    var e = getEng(mid), teed = "";
    if (a.check) {
      var parts = []; if (a.check.tn != null) parts.push("TN " + a.check.tn); if (a.check.skill) parts.push(cap(a.check.skill));
      teed = " — teed up check" + (parts.length ? " (" + parts.join(", ") + ")" : "");
      if (a.check.skill && GROUPS.indexOf(a.check.skill) >= 0) { e.group = a.check.skill; saveEng(mid, e); }
      rollOpen = true; pendingTee = { tn: a.check.tn, note: a.name };
      logEvent(mid, "action", a.name + " (" + a.cats + ")" + teed, { stance: e.stance });
      renderSheet();
      return;
    }
    logEvent(mid, "action", a.name + " (" + a.cats + ")", { stance: e.stance });
    refreshLogUI();
  }
  function teeInitiative(mid, conf) {
    rollOpen = true; pendingTee = { tn: 1, note: "Initiative — " + conf.initSkill };
    logEvent(mid, "action", "Rolled Initiative (" + conf.initSkill + ", TN 1)");
    renderSheet();
  }

  // ============================ statblock ============================
  function buildStatblock(mid, npc) {
    var s = npc.stat, id = npc.id;
    var wrap = el("div", "dp-play");
    var top = el("div", "dp-typebar");
    top.innerHTML = "<span class='dp-type'>" + esc(s.kind) + "</span>";
    var ranks = el("span", "dp-ranks");
    if (s.pc) { ranks.innerHTML = "<span class='rk-lab'>School Rank</span><span class='rk'>" + s.schoolRank + "</span>"; }
    else {
      ranks.innerHTML = "<span class='rk-lab'>Conflict Rank</span>";
      ranks.appendChild(fz(id + ":combatRank", "<span class='rk combat' title='Combat'>&#9876; " + s.combatRank + "</span>"));
      ranks.appendChild(fz(id + ":intrigueRank", "<span class='rk intrigue' title='Intrigue'>&#10057; " + s.intrigueRank + "</span>"));
    }
    top.appendChild(ranks); wrap.appendChild(top);
    if (s.pc && npc.sheetFile) { var lk = el("a", "pc-sheetlink", "Open full interactive sheet &rsaquo;"); lk.href = "../play/" + npc.sheetFile; wrap.appendChild(lk); }
    var desc = el("p", "dp-desc"); desc.appendChild(fz(id + ":desc", esc(s.description), "fz-block")); wrap.appendChild(desc);
    var rr = el("div", "dp-ringrow");
    RINGS.forEach(function (r) { var cell = el("div", "rr-cell ring-" + r); cell.innerHTML = "<img class='rr-ico' src='../assets/rings/" + r + ".svg' alt=''><span class='rr-nm'>" + cap(r) + "</span>"; cell.appendChild(fz(id + ":ring:" + r, "<span class='rr-v'>" + s.rings[r] + "</span>")); rr.appendChild(cell); });
    wrap.appendChild(rr);
    var stats = el("div", "dp-stats");
    stats.appendChild(statCol("Societal", [["Honor",s.honor,id+":honor"],["Glory",s.glory,id+":glory"],["Status",s.status,id+":status"]]));
    stats.appendChild(statCol("Personal", [["Endurance",s.endurance,id+":endurance"],["Composure",s.composure,id+":composure"],["Focus",s.focus,id+":focus"],["Vigilance",s.vigilance,id+":vigilance"]]));
    wrap.appendChild(stats);
    if (s.demeanor || s.tnMods) {
      var dm = el("div", "dp-demeanor");
      if (s.demeanor) { dm.innerHTML = "<span class='dm-lab'>Demeanor</span>"; dm.appendChild(fz(id + ":demeanor", esc(s.demeanor))); }
      if (s.tnMods) { var tn = el("span", "dp-tnmods"); tn.innerHTML = "<span class='dm-lab'>Social TN</span>"; tn.appendChild(fz(id + ":tnmods", esc(s.tnMods))); dm.appendChild(tn); }
      wrap.appendChild(dm);
    }
    var sk = el("div", "dp-skills");
    if (s.pc) {
      var sm = s.skillsIndividual || {}, keys = Object.keys(sm).filter(function (k) { return sm[k]; });
      keys.forEach(function (k) { var chip = el("span", "sk-chip ranked"); chip.innerHTML = "<span class='sk-nm'>" + esc(SKILLLBL(k)) + "</span><span class='sk-v'>" + sm[k] + "</span>"; sk.appendChild(chip); });
      if (!keys.length) sk.appendChild(el("span", "ad-none", "no ranked skills"));
    } else {
      GROUPS.forEach(function (g) { var v = s.skills[g] || 0; var chip = el("span", "sk-chip" + (v > 0 ? " ranked" : "")); chip.innerHTML = "<span class='sk-nm'>" + cap(g) + "</span>"; chip.appendChild(fz(id + ":skill:" + g, "<span class='sk-v'>" + v + "</span>")); sk.appendChild(chip); });
    }
    wrap.appendChild(sk);
    if ((s.advantages && s.advantages.length) || (s.disadvantages && s.disadvantages.length)) { var ad = el("div", "dp-adv"); ad.appendChild(adColumn("Advantages", s.advantages, id + ":adv")); ad.appendChild(adColumn("Disadvantages", s.disadvantages, id + ":dis")); wrap.appendChild(ad); }
    var wg = el("div", "dp-gear"); wg.appendChild(el("div", "dp-h", "Favored Weapons &amp; Gear"));
    (s.weapons || []).forEach(function (w, i) { var r = el("p", "dp-weap"); r.appendChild(fz(id + ":weap" + i, syms(w), "fz-block")); wg.appendChild(r); });
    if (s.gear && s.gear.length) { var gl = el("p", "dp-gearline"); gl.innerHTML = "<span class='gl-lab'>Gear (equipped):</span> "; s.gear.forEach(function (g,i) { if (i) gl.appendChild(document.createTextNode(", ")); gl.appendChild(fz(id + ":gear" + i, syms(g))); }); wg.appendChild(gl); }
    if (s.gearOther && s.gearOther.length) { var gl2 = el("p", "dp-gearline"); gl2.innerHTML = "<span class='gl-lab'>Gear (other):</span> "; s.gearOther.forEach(function (g,i) { if (i) gl2.appendChild(document.createTextNode(", ")); gl2.appendChild(fz(id + ":gearo" + i, syms(g))); }); wg.appendChild(gl2); }
    wrap.appendChild(wg);
    if (s.abilities && s.abilities.length) { var ab = el("div", "dp-abils"); ab.appendChild(el("div", "dp-h", s.pc ? "Techniques" : "Abilities")); s.abilities.forEach(function (a, i) { ab.appendChild(abilityEntry(mid, npc, a, id + ":abil" + i)); }); wrap.appendChild(ab); }
    if (gm && !s.pc) wrap.appendChild(buildTrackers(mid, npc));
    if (gm && s.pc) wrap.appendChild(el("p", "dp-meta gm-hint", "Quick rolls here don't spend Void or apply strife to the sheet — the full interactive sheet stays authoritative for this PC."));
    return wrap;
  }
  function statCol(label, rows) { var col = el("div", "stat-col"); col.appendChild(el("div", "sc-lab", label)); rows.forEach(function (r) { var line = el("div", "sc-row"); line.innerHTML = "<span class='sc-nm'>" + r[0] + "</span>"; line.appendChild(fz(r[2], "<span class='sc-v'>" + r[1] + "</span>")); col.appendChild(line); }); return col; }
  function adColumn(label, items, fidbase) { var col = el("div", "ad-col"); col.appendChild(el("div", "ad-lab", label)); (items || []).forEach(function (it, i) { var m = it.match(/^(.*?):\s*(.*)$/); var nm = m ? m[1] : it, rest = m ? m[2] : ""; var line = el("div", "ad-item"); line.appendChild(fz(fidbase + i, "<b>" + esc(nm) + ":</b> " + syms(rest), "fz-block")); col.appendChild(line); }); if (!items || !items.length) col.appendChild(el("div", "ad-none", "—")); return col; }
  function abilityEntry(mid, npc, a, fid) {
    var e = el("div", "dp-abil");
    var head = el("div", "ab-head");
    head.appendChild(fz(fid + ":name", "<span class='ab-nm'>" + esc(a.name) + "</span>" + (a.tag ? " <span class='ab-tag'>" + esc(a.tag) + "</span>" : ""), "fz-inline"));
    if (gm && a.check) { var b = el("button", "ab-roll", "&#9860; TN " + a.check.tn); b.title = "Roll " + a.check.label; b.addEventListener("click", function () { var en = getEng(mid); en.ring = a.check.ring; en.group = a.check.group; saveEng(mid, en); rollOpen = true; pendingTee = { tn: a.check.tn, note: a.name }; renderSheet(); }); head.appendChild(b); }
    e.appendChild(head);
    var body = el("p", "ab-text"); body.appendChild(fz(fid + ":text", syms(a.text), "fz-block")); e.appendChild(body);
    return e;
  }
  function buildTrackers(mid, npc) {
    var s = npc.stat, wrap = el("div", "dp-trk");
    wrap.appendChild(trk(mid, "strife", "Strife", s.composure, "Compromised at half Composure (" + Math.ceil(s.composure/2) + ")"));
    wrap.appendChild(trk(mid, "fatigue", "Fatigue", s.endurance, "Incapacitated at Endurance (" + s.endurance + ")"));
    return wrap;
  }
  function trk(mid, key, label, max, note) {
    var e = getEng(mid);
    var box = el("div", "trkline"); box.setAttribute("data-key", key);
    box.innerHTML = "<span class='trk-nm'>" + label + "</span>";
    var minus = el("button", "trk-b", "−"), plus = el("button", "trk-b", "+"), val = el("span", "trk-v", (e[key] || 0) + " / " + max);
    minus.addEventListener("click", function () { var en = getEng(mid); en[key] = Math.max(0, (en[key]||0) - 1); saveEng(mid, en); val.textContent = en[key] + " / " + max; logEvent(mid, key, label + " → " + en[key]); refreshLogUI(); });
    plus.addEventListener("click", function () { var en = getEng(mid); en[key] = (en[key]||0) + 1; saveEng(mid, en); val.textContent = en[key] + " / " + max; logEvent(mid, key, label + " → " + en[key]); refreshLogUI(); });
    box.appendChild(minus); box.appendChild(val); box.appendChild(plus); box.appendChild(el("span", "trk-note", note));
    return box;
  }

  // ============================ scene log ============================
  function logEvent(mid, cat, desc, extra) {
    var log = getLog();
    log.unshift(Object.assign({ kind:"event", who: mid ? memberName(mid) : "Scene", cat:cat, desc:desc, when:nowStr() }, extra || {}));
    saveLog(log); refreshLogUI();
  }
  function refreshLogUI() {
    // update the Log button count + re-render the pane if open
    var settings = document.querySelector(".scene-settings"); if (!settings) return;
    var btn = [].slice.call(settings.querySelectorAll(".ss-tools .roll-btn")).find(function (b) { return /^Log/.test(b.textContent); });
    if (btn) btn.textContent = "Log " + (getLog().length ? "(" + getLog().length + ")" : "");
    var pane = document.getElementById("sceneLogPane"); if (pane && !pane.hidden) renderLog();
  }
  function logDie(k) { return "<img class='logdie " + k.type + (k.bonus ? " bonus" : "") + "' src='../assets/dice/" + k.key + ".svg' alt=''>"; }
  function diceRow(list) { return (list || []).map(function (k) { return logDie(k); }).join(""); }
  function renderLog(host) {
    host = host || document.getElementById("sceneLogPane"); if (!host) return;
    var log = getLog();
    if (!log.length) { host.innerHTML = "<p class='nr-hint'>No rolls or events yet. Roll and Keep Results, or run a conflict.</p>"; return; }
    host.innerHTML = "";
    var act = el("div", "log-actions"); act.innerHTML = "<span class='nr-summary'>" + log.length + " recorded</span>";
    var clr = el("button", "link-btn", "Clear log"); clr.addEventListener("click", function () { saveLog([]); refreshLogUI(); renderLog(); }); act.appendChild(clr);
    host.appendChild(act);
    var EVICON = { action:"⚔", conflict:"⚑", scene:"⟳", strife:"▲", fatigue:"✦" };
    log.forEach(function (e) {
      if (e.kind === "event") { var ev = el("div", "log-event"); ev.innerHTML = "<span class='le-cat'>" + (EVICON[e.cat] || "·") + " " + esc(e.who || "Scene") + "</span><span class='le-desc'>" + esc(e.desc || "") + "</span>" + (e.when ? "<span class='log-when'>" + e.when + "</span>" : ""); host.appendChild(ev); return; }
      var d = el("div", "log-entry " + (e.pass ? "pass" : "fail"));
      var chips = [];
      if (e.keepLimit != null) { var kc = "Kept " + (e.keptBaseCount != null ? e.keptBaseCount : 0) + " of " + e.keepLimit; if (e.bonusKept) kc += " +" + e.bonusKept + " bonus"; chips.push("<span class='logchip'>" + kc + "</span>"); }
      if (e.assistSkill) chips.push("<span class='logchip'>Assist +" + e.assistSkill + " skilled</span>");
      if (e.assistRing) chips.push("<span class='logchip'>Assist +" + e.assistRing + " unskilled</span>");
      if (e.conflictType) chips.push("<span class='logchip'>" + cap(e.conflictType) + "</span>");
      var evRows = "";
      (e.events || []).forEach(function (ev) { if (ev.kind === "reroll") evRows += "<div class='log-ev'><span class='ev-tag'>↻ reroll</span>" + logDie({ type:ev.type, key:ev.from }) + "<span class='ev-arrow'>→</span>" + logDie({ type:ev.type, key:ev.to }) + "</div>"; else if (ev.kind === "explode") evRows += "<div class='log-ev'><span class='ev-tag'>✦ explode</span>" + logDie({ type:ev.type, key:ev.source }) + "<span class='ev-arrow'>→</span>" + logDie({ type:ev.type, key:ev.result, bonus:true }) + "</div>"; });
      d.innerHTML = "<div class='log-head'><span class='log-verdict'>" + esc(e.who || "") + " — " + (e.pass ? "Success" : "Failure") + "</span><span class='log-approach'>" + cap(e.ring) + " " + e.ringN + (e.group ? " · " + cap(e.group) + (e.skillN != null ? " " + e.skillN : "") : "") + (e.stance ? " · " + cap(e.stance) + " stance" : "") + (e.conflictName ? " · “" + esc(e.conflictName) + "”" : "") + "</span>" + (e.when ? "<span class='log-when'>" + e.when + "</span>" : "") + "</div>"
        + (e.note ? "<div class='log-note'>" + esc(e.note) + "</div>" : "")
        + (chips.length ? "<div class='log-chips'>" + chips.join("") + "</div>" : "")
        + (e.initial && e.initial.length ? "<div class='log-line'><span class='log-lbl'>Rolled</span><span class='log-dice'>" + diceRow(e.initial) + "</span></div>" : "")
        + (evRows ? "<div class='log-events'>" + evRows + "</div>" : "")
        + "<div class='log-line'><span class='log-lbl'>Kept</span><span class='log-dice'>" + diceRow(e.kept) + "</span></div>"
        + "<div class='log-tally'>" + e.su + " vs TN " + e.tn + "  ·  <span class='sym op'>◈</span> " + e.op + "  ·  <span class='sym st'>▲</span> " + e.strifeApplied + " applied" + (e.strifeRolled !== e.strifeApplied ? " (of " + e.strifeRolled + " rolled)" : "") + "</div>";
      host.appendChild(d);
    });
  }
  function exportLog() {
    var data = { app: "portents-dramatis", exportedAt: new Date().toISOString(), scene: { members: scene.members, inConflict: scene.inConflict, conflictType: scene.conflictType, conflictName: scene.conflictName }, log: getLog() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "dramatis-scene-log-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function importLog(file) {
    var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); if (Array.isArray(d.log)) { saveLog(d.log); } else if (Array.isArray(d)) { saveLog(d); } refreshLogUI(); var pane = document.getElementById("sceneLogPane"); if (pane) { pane.hidden = false; renderLog(); } } catch (err) { alert("Could not read that log file: " + err.message); } };
    r.readAsText(file);
  }

  // ============================ PC adapter + loader ============================
  // Read each PC's live sheet JSON from its Play page and shape it like a card.
  function adaptPC(sheet, file) {
    var g = sheet.gear || [];
    var weapons = g.filter(function (x) { return /weapon/i.test(x.kind || ""); }).map(function (w) {
      return w.name + ": Range " + (w.range||"—") + ", Damage " + (w.damage!=null?w.damage:"—") + ", Deadliness " + (w.deadliness!=null?w.deadliness:"—") + (w.qualities && w.qualities.length ? ", " + w.qualities.join(", ") : "");
    });
    var gear = g.filter(function (x) { return !/weapon/i.test(x.kind || ""); }).map(function (it) {
      var extra = []; if (it.physical != null) extra.push("Physical " + it.physical); if (it.supernatural) extra.push("Supernatural " + it.supernatural);
      return it.name + (extra.length ? " (" + extra.join(", ") + ")" : "");
    });
    var abilities = (sheet.techniques || []).map(function (t) {
      var a = { name: t.name, tag: t.tag, text: t.text };
      if (t.activation) a.check = { tn: t.activation.tn, ring: t.activation.ring, group: t.activation.skill, label: SKILLLBL(t.activation.skill) + " (" + cap(t.activation.ring) + ")" };
      return a;
    });
    var adv = [], dis = [];
    (sheet.peculiarities || []).forEach(function (p) { var line = p.name + ": (" + (p.ring || "void") + ") " + (p.tag || ""); if (/Adversity|Anxiety/i.test(p.tag || "")) dis.push(line); else adv.push(line); });
    var bio = [];
    if (sheet.ninjo) bio.push("Ninjō — " + sheet.ninjo);
    if (sheet.giri) bio.push("Giri — " + sheet.giri);
    bio.push("A player character. The full interactive sheet in the Play section — Void points, technique activations, strife/fatigue trackers, session history — is authoritative; this card is for quick rolls and reference at the table.");
    return {
      id: "pc-" + sheet.id, pc: true, name: sheet.name, portrait: sheet.portrait || null,
      epithet: sheet.clan + " · " + sheet.school,
      affil: "Player character · " + sheet.family + " family · " + sheet.role + " · Rank " + sheet.rank,
      sheetFile: file, status: "Player character", bio: bio,
      stat: {
        kind: "Player Character", pc: true, schoolRank: sheet.rank,
        description: sheet.clan + " " + sheet.role + " of the " + sheet.school + ", rank " + sheet.rank + ".",
        rings: sheet.rings,
        endurance: (sheet.derived||{}).endurance, composure: (sheet.derived||{}).composure, focus: (sheet.derived||{}).focus, vigilance: (sheet.derived||{}).vigilance,
        honor: (sheet.social||{}).honor, glory: (sheet.social||{}).glory, status: (sheet.social||{}).status,
        demeanor: null, tnMods: null, skillsIndividual: sheet.skills || {},
        weapons: weapons, gear: gear, advantages: adv, disadvantages: dis, abilities: abilities
      }
    };
  }
  function loadPCs() {
    if (typeof fetch !== "function") return Promise.resolve([]);
    return Promise.all(PC_PAGES.map(function (f) {
      return fetch("../play/" + f).then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
        if (!html) return null;
        try { var doc = new DOMParser().parseFromString(html, "text/html"); var node = doc.getElementById("sheet-data"); return node ? adaptPC(JSON.parse(node.textContent), f) : null; }
        catch (e) { return null; }
      }).catch(function () { return null; });
    })).then(function (arr) { return arr.filter(Boolean); });
  }

  render();   // NPCs immediately; PC members (if any) fill in once their sheets load
  loadPCs().then(function (pcs) { if (pcs.length) { CAST = pcs.concat(NPCS); render(); } });
})();
