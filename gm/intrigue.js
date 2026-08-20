/* intrigue.js — a tracker for running any intrigue conflict.
   The cast is read live from dramatis-personae/npcs.js and the character
   sheet, so a card edited there is correct here. TN of a Persuade check is
   the target's vigilance, moved by demeanor and by the skill/status
   discount, floored at 1. Objective difficulty is a separate number and
   demeanor never touches it. */
(function () {
  var KEY = "pf-intrigue";
  var RINGS = ["air", "earth", "fire", "water", "void"];

  var UNMASK = {
    Ambitious: "Bend Principles", Assertive: "Rage", Detached: "Expose an Opening",
    Gruff: "Inappropriate Outburst", Shrewd: "Panicked Retreat"
  };

  // The four RAW social objectives, with the attribute each one's difficulty is read from.
  var KINDS = [
    { id: "appeal",  name: "Appeal to a Person or Group", from: "focus",
      rule: "Accumulate momentum equal to or exceeding the difficulty on successful Social skill checks against the target. The target's <b>focus</b> is a good starting value, adjustable for stubbornness. At the end of any round with sufficient momentum the target is persuaded — but if another character has more momentum at that time, their perspective wins instead, ties broken by highest status." },
    { id: "discern", name: "Discern Someone's Qualities", from: "vig",
      rule: "Difficulty from the target's <b>vigilance</b>, adjustable for wariness. On completion, learn up to three of: social objective, ninjō, giri, composure, endurance, one advantage, one disadvantage." },
    { id: "discredit", name: "Discredit Someone", from: null,
      rule: "No momentum threshold — the objective completes when the target becomes <b>Compromised</b>. When they unmask they forfeit glory equal to their glory rank unless they retire from the intrigue. Expect a demand for a duel." },
    { id: "rumor",   name: "Spread a Rumor", from: "highestStatusVigilance",
      rule: "Difficulty from the <b>vigilance of the highest-status character present</b>. No two checks may target the same character. Two consecutive failures and the rumor cannot take root this scene." }
  ];

  var CAST = [];          // [{id,name,vig,focus,composure,status,dem,mods,rank,pc}]
  var st = load();

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "{}");
      o.dem = o.dem || {}; o.disc = o.disc || {}; o.cast = o.cast || [];
      o.objs = o.objs || []; o.scene = o.scene || "";
      if (typeof o.enne !== "boolean") o.enne = false;
      return o;
    } catch (e) { return { dem: {}, disc: {}, cast: [], objs: [], scene: "", enne: false }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function byId(id) { for (var i = 0; i < CAST.length; i++) if (CAST[i].id === id) return CAST[i]; return null; }
  function demOn(id) { return st.dem[id] !== false; }
  function discOn(id) { return st.disc[id] === true; }
  function inScene(id) { return st.cast.indexOf(id) >= 0; }

  // "Water +2, Earth -2" -> {water:2, earth:-2}
  function parseMods(s) {
    var out = {};
    (s || "").split(",").forEach(function (part) {
      var m = /\s*([A-Za-z]+)\s*([+\-−]\s*\d+)/.exec(part);
      if (m) out[m[1].toLowerCase()] = parseInt(m[2].replace(/[−\s]/g, function (c) { return c === "−" ? "-" : ""; }), 10);
    });
    return out;
  }

  // ---- roster ----
  function loadCast() {
    return fetch("../dramatis-personae/npcs.js").then(function (r) { return r.text(); })
      .then(function (src) {
        var w = {}; new Function("window", src)(w);
        (w.NPCS || []).forEach(function (n) {
          if (!n.stat) return;
          CAST.push({
            id: n.id, name: n.name, vig: n.stat.vigilance, focus: n.stat.focus,
            composure: n.stat.composure, status: n.stat.status || 0,
            dem: n.stat.demeanor || null, mods: parseMods(n.stat.tnMods),
            rank: n.stat.intrigueRank
          });
        });
        return fetch("../play/index.html");
      })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var m = /<script id="sheet-data" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
        if (m) {
          try {
            var S = JSON.parse(m[1]);
            CAST.unshift({ id: "pc-" + S.id, name: S.name, vig: S.derived.vigilance,
              focus: S.derived.focus, composure: S.derived.composure,
              status: (S.social && S.social.status) || 0, dem: null, mods: {}, pc: true });
          } catch (e) {}
        }
      })
      .catch(function () {});
  }

  // ---- TN maths ----
  function baseVig(c) { return (c.pc && st.enne) ? 4 : c.vig; }
  function tnFor(c, ring) {
    var m = (c.dem && demOn(c.id)) ? (c.mods[ring] || 0) : 0;
    return Math.max(1, baseVig(c) + m + (discOn(c.id) ? -1 : 0));
  }

  // ---- who is present ----
  function renderCast() {
    var host = document.getElementById("castPick"); host.innerHTML = "";
    CAST.forEach(function (c) {
      var b = el("button", "cast-chip" + (inScene(c.id) ? " on" : ""), c.name);
      b.title = (c.dem ? c.dem + " · " : "") + "vigilance " + c.vig + " · focus " + c.focus
              + (c.rank ? " · intrigue rank " + c.rank : "");
      b.addEventListener("click", function () {
        var i = st.cast.indexOf(c.id);
        if (i >= 0) st.cast.splice(i, 1); else st.cast.push(c.id);
        save(); renderCast(); renderTN(); fillTargets();
      });
      host.appendChild(b);
    });
    if (!CAST.length) host.appendChild(el("p", "aim", "Roster could not be read."));
  }

  // ---- TN table ----
  function renderTN() {
    var host = document.getElementById("tnTable"); host.innerHTML = "";
    var present = st.cast.map(byId).filter(Boolean);
    if (!present.length) { host.appendChild(el("p", "aim", "Choose who is present and their numbers appear here.")); return; }
    var t = el("table", "tn"), hr = el("tr");
    hr.appendChild(el("th", "who", "Target"));
    hr.appendChild(el("th", null, "Demeanor"));
    RINGS.forEach(function (r) { hr.appendChild(el("th", null, r[0].toUpperCase() + r.slice(1))); });
    hr.appendChild(el("th", null, "−1 skill"));
    t.appendChild(hr);

    present.forEach(function (c) {
      var tr = el("tr", c.pc ? "pc" : null);
      var td = el("td", "who"); td.appendChild(el("b", null, c.name));
      td.appendChild(document.createElement("br"));
      td.appendChild(el("span", "mods", "vig " + c.vig + " · focus " + c.focus + " · comp " + c.composure
        + (c.status ? " · status " + c.status : "")));
      tr.appendChild(td);

      var dtd = el("td");
      if (c.dem) {
        var btn = el("button", "demtog" + (demOn(c.id) ? " on" : ""), c.dem);
        btn.title = modText(c.mods) + (UNMASK[c.dem] ? " · unmasks as " + UNMASK[c.dem] : "");
        btn.addEventListener("click", function () { st.dem[c.id] = !demOn(c.id); save(); renderTN(); });
        dtd.appendChild(btn);
        dtd.appendChild(document.createElement("br"));
        dtd.appendChild(el("span", "mods", modText(c.mods)));
      } else if (c.pc) {
        var eb = el("button", "demtog enne" + (st.enne ? " on" : ""), st.enne ? "ENNE active" : "ENNE off");
        eb.title = "Earth Needs No Eyes — Support action, TN 1 Meditation (Earth). Vigilance rises by his Earth Ring.";
        eb.addEventListener("click", function () { st.enne = !st.enne; save(); renderTN(); });
        dtd.appendChild(eb);
      }
      tr.appendChild(dtd);

      RINGS.forEach(function (r) {
        var v = tnFor(c, r), cell = el("td");
        cell.appendChild(el("span", "tnval" + (v <= 2 ? " easy" : v >= 6 ? " hard" : ""), String(v)));
        tr.appendChild(cell);
      });

      var std = el("td");
      var sb = el("button", "demtog" + (discOn(c.id) ? " on" : ""), discOn(c.id) ? "−1" : "off");
      sb.addEventListener("click", function () { st.disc[c.id] = !discOn(c.id); save(); renderTN(); });
      std.appendChild(sb); tr.appendChild(std);
      t.appendChild(tr);
    });
    host.appendChild(t);
  }
  function modText(m) {
    var out = [];
    RINGS.forEach(function (r) { if (m[r]) out.push(r[0].toUpperCase() + r.slice(1) + " " + (m[r] > 0 ? "+" : "") + m[r]); });
    return out.join(", ") || "—";
  }

  // ---- objectives ----
  function suggestDiff() {
    var k = document.getElementById("oKind").value;
    var tid = document.getElementById("oTarget").value;
    var kind = KINDS.filter(function (x) { return x.id === k; })[0];
    if (!kind) return;
    if (!kind.from) { document.getElementById("oDiff").value = 0; return; }
    var v;
    if (kind.from === "highestStatusVigilance") {
      var top = null;
      st.cast.map(byId).filter(Boolean).forEach(function (c) { if (!top || c.status > top.status) top = c; });
      v = top ? top.vig : null;
    } else {
      var c = byId(tid); v = c ? c[kind.from] : null;
    }
    if (v != null) document.getElementById("oDiff").value = v;
  }
  function fillTargets() {
    var sel = document.getElementById("oTarget"), cur = sel.value;
    sel.innerHTML = "";
    st.cast.map(byId).filter(Boolean).forEach(function (c) {
      var o = el("option", null, c.name); o.value = c.id; sel.appendChild(o);
    });
    var o = el("option", null, "— other —"); o.value = ""; sel.appendChild(o);
    if (cur) sel.value = cur;
    suggestDiff();
  }
  function renderObjectives() {
    var host = document.getElementById("objList"); host.innerHTML = "";
    if (!st.objs.length) { host.appendChild(el("p", "aim", "No objectives yet.")); return; }
    st.objs.forEach(function (o, idx) {
      var met = (o.diff > 0) && (o.mo || 0) >= o.diff;
      var box = el("div", "obj" + (met ? " met" : ""));
      var kind = KINDS.filter(function (x) { return x.id === o.kind; })[0];
      var tgt = byId(o.target);
      box.appendChild(el("div", "kind", (kind ? kind.name : o.kind)
        + " · target: " + (tgt ? tgt.name : (o.targetName || "—"))
        + (o.diff > 0 ? " · difficulty " + o.diff : " · no threshold")));
      var h = el("h4", null, o.who);
      var x = el("button", "obj-x", "×"); x.title = "Remove this objective";
      x.addEventListener("click", function () { st.objs.splice(idx, 1); save(); renderObjectives(); });
      h.appendChild(x); box.appendChild(h);
      if (o.aim) box.appendChild(el("p", "aim", o.aim));

      if (o.diff > 0) {
        var pips = el("div", "pips");
        for (var i = 1; i <= o.diff; i++) (function (n) {
          var p = el("button", "pip" + (n <= (o.mo || 0) ? " on" : ""), String(n));
          p.addEventListener("click", function () {
            o.mo = ((o.mo || 0) === n) ? n - 1 : n; save(); renderObjectives();
          });
          pips.appendChild(p);
        })(i);
        var tally = el("span", "tally");
        tally.innerHTML = "<b>" + (o.mo || 0) + "</b> / " + o.diff + (met ? " — achieved" : "");
        pips.appendChild(tally); box.appendChild(pips);
      } else {
        box.appendChild(el("p", "aim", "Completes when the target becomes Compromised."));
      }
      host.appendChild(box);
    });
  }

  function renderRefs() {
    var t = el("table", "dem");
    var hr = el("tr"); ["Objective", "Difficulty", "How it works"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
    t.appendChild(hr);
    KINDS.forEach(function (k) {
      var tr = el("tr");
      tr.appendChild(el("td", null, k.name));
      tr.appendChild(el("td", null, k.from === "focus" ? "target's focus"
        : k.from === "vigilance" ? "target's vigilance"
        : k.from === "highestStatusVigilance" ? "highest-status vigilance" : "none"));
      var td = el("td"); td.innerHTML = k.rule; tr.appendChild(td);
      t.appendChild(tr);
    });
    document.getElementById("objRef").appendChild(t);

    var d = el("table", "dem");
    var hr2 = el("tr"); ["Present", "Demeanor", "Social TN modifiers", "Unmasks as"].forEach(function (h) { hr2.appendChild(el("th", null, h)); });
    d.appendChild(hr2);
    var present = st.cast.map(byId).filter(Boolean).filter(function (c) { return c.dem; });
    (present.length ? present : CAST.filter(function (c) { return c.dem; })).forEach(function (c) {
      var tr = el("tr");
      tr.appendChild(el("td", null, c.name));
      tr.appendChild(el("td", null, c.dem));
      var td = el("td"); td.innerHTML = "<code>" + modText(c.mods) + "</code>"; tr.appendChild(td);
      tr.appendChild(el("td", null, UNMASK[c.dem] || "—"));
      d.appendChild(tr);
    });
    var host = document.getElementById("demRef"); host.innerHTML = ""; host.appendChild(d);
  }

  // ---- wiring ----
  function init() {
    var ks = document.getElementById("oKind");
    KINDS.forEach(function (k) { var o = el("option", null, k.name); o.value = k.id; ks.appendChild(o); });
    ks.addEventListener("change", suggestDiff);
    document.getElementById("oTarget").addEventListener("change", suggestDiff);

    var sn = document.getElementById("sceneName");
    sn.value = st.scene;
    sn.addEventListener("input", function () { st.scene = sn.value; save(); });

    document.getElementById("oAdd").addEventListener("click", function () {
      var who = document.getElementById("oWho").value.trim();
      if (!who) { document.getElementById("oWho").focus(); return; }
      var tid = document.getElementById("oTarget").value;
      st.objs.push({ who: who, kind: document.getElementById("oKind").value,
        target: tid, targetName: tid ? "" : "—",
        diff: parseInt(document.getElementById("oDiff").value, 10) || 0,
        aim: document.getElementById("oAim").value.trim(), mo: 0 });
      document.getElementById("oWho").value = ""; document.getElementById("oAim").value = "";
      save(); renderObjectives(); renderRefs();
    });
    document.getElementById("clearMo").addEventListener("click", function () {
      if (!confirm("Clear momentum on every objective? Everything else stays.")) return;
      st.objs.forEach(function (o) { o.mo = 0; }); save(); renderObjectives();
    });
    document.getElementById("resetAll").addEventListener("click", function () {
      if (!confirm("Start a new scene? This clears the cast, the objectives and every toggle.")) return;
      st = { dem: {}, disc: {}, cast: [], objs: [], scene: "", enne: false };
      save(); sn.value = ""; renderCast(); renderTN(); renderObjectives(); fillTargets(); renderRefs();
    });

    renderCast(); renderTN(); renderObjectives(); fillTargets(); renderRefs();
  }

  loadCast().then(init);
})();
