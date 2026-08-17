/* intrigue.js — Session Three intrigue tracker.
   TN = target's vigilance, modified by demeanor and by the skill/status
   discount, floored at 1. Objective difficulty is a separate number and
   demeanor never touches it. */
(function () {
  var KEY = "pf-intrigue-s3";
  var RINGS = ["air", "earth", "fire", "water", "void"];

  var DEMEANOR = {
    Ambitious: { fire: 2, water: -2 },
    Assertive: { earth: 2, air: -2 },
    Detached: { earth: 1, fire: 1, "void": -2 },
    Gruff: { water: 2, earth: -2 },
    Shrewd: { air: 2, fire: -2 }
  };
  var UNMASK = {
    Ambitious: "Bend Principles", Assertive: "Rage", Detached: "Expose an Opening",
    Gruff: "Inappropriate Outburst", Shrewd: "Panicked Retreat"
  };

  var CAST = [
    { id: "norikage", name: "Togashi Norikage", vig: 1, dem: null, enne: true,
      note: "PC · Vigilance 1; Earth Needs No Eyes raises it by his Earth Ring" },
    { id: "fusae",   name: "Seiya Fusae",    vig: 3, dem: "Assertive", status: 39 },
    { id: "sadao",   name: "Kitsuki Sadao",  vig: 5, dem: "Gruff",     status: 47 },
    { id: "ume",     name: "Ume",            vig: 2, dem: "Assertive", status: 9 },
    { id: "heisuke", name: "Heisuke",        vig: 3, dem: "Shrewd",    status: 9 },
    { id: "genzo",   name: "Genzō",          vig: 2, dem: "Shrewd",    status: 9 },
    { id: "kiyo",    name: "Kiyo",           vig: 2, dem: "Assertive", status: 9 },
    { id: "rokuro",  name: "Rokurō",         vig: 2, dem: "Detached",  status: 9 }
  ];

  var OBJECTIVES = [
    { id: "norikage", who: "Togashi Norikage", kind: "Appeal to a Person or Group",
      target: "Seiya Fusae", diff: 10,
      aim: "That they are in good standing, and <b>not</b> aligned with the Perfect Land Sect.",
      foot: "Track set to 10 to leave room while the player settles on an objective. Fusae's Focus is <b>5</b>, which is the RAW difficulty if this is the one they pick." },
    { id: "arrivals", who: "Arriving three + Fusae", kind: "Appeal to a Person or Group — pooled",
      target: "Kitsuki Sadao", diff: 7,
      aim: "Full acceptance of the arriving households as <b>equals</b> to the villagers already there, on the authority that set the terms.",
      foot: "Genzō, Kiyo and Rokurō share one pool with Fusae, whose objective runs the same way. Difficulty is Sadao's Focus." },
    { id: "converts", who: "Ume + Heisuke", kind: "Discern Someone's Qualities",
      target: "the arriving three", diff: 2, per: true,
      aim: "Who among the arrivals is already a convert, or ripe for conversion.",
      foot: "Difficulty is each target's Vigilance, so <b>2 per person</b> — three separate tracks. GM-authorised: religious disposition surfaces in place of an advantage or disadvantage, which the RAW list does not otherwise cover." },
    { id: "sadao", who: "Kitsuki Sadao", kind: "Appeal to a Person or Group",
      target: "Seiya Fusae", diff: 5,
      aim: "Against any full long-term commitment being made in the moment.",
      foot: "Difficulty is Fusae's Focus. Runs alongside Norikage's appeal to her without contesting it — different questions to the same person." }
  ];

  // ---- state ----
  var st = load();
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (!o.dem) o.dem = {};
      if (!o.disc) o.disc = {};
      if (!o.mo) o.mo = {};
      if (typeof o.enne !== "boolean") o.enne = false;
      return o;
    } catch (e) { return { dem: {}, disc: {}, mo: {}, enne: false }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function demOn(id) { return st.dem[id] !== false; }          // demeanors on by default
  function discOn(id) { return st.disc[id] === true; }
  function mo(id) { return st.mo[id] || 0; }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ---- TN maths ----
  function tnFor(c, ring) {
    var base = (c.id === "norikage" && st.enne) ? 4 : c.vig;
    var m = (c.dem && demOn(c.id)) ? (DEMEANOR[c.dem][ring] || 0) : 0;
    var d = discOn(c.id) ? -1 : 0;
    return Math.max(1, base + m + d);
  }

  // ---- render ----
  function renderTN() {
    var host = document.getElementById("tnTable");
    host.innerHTML = "";
    var t = el("table", "tn");
    var thead = el("thead"), hr = el("tr");
    hr.appendChild(el("th", "who", "Target"));
    hr.appendChild(el("th", null, "Demeanor"));
    RINGS.forEach(function (r) { hr.appendChild(el("th", null, r.charAt(0).toUpperCase() + r.slice(1))); });
    hr.appendChild(el("th", null, "−1 skill"));
    thead.appendChild(hr); t.appendChild(thead);

    var tb = el("tbody");
    CAST.forEach(function (c) {
      var tr = el("tr", c.id === "norikage" ? "pc" : null);
      var td = el("td", "who");
      var b = el("b", null, c.name); td.appendChild(b);
      if (c.note) { td.appendChild(document.createElement("br")); td.appendChild(el("span", "mods", c.note)); }
      tr.appendChild(td);

      var dtd = el("td");
      if (c.dem) {
        var btn = el("button", "demtog" + (demOn(c.id) ? " on" : ""), c.dem);
        btn.title = "Social TN: " + modText(c.dem) + " · unmasks as " + UNMASK[c.dem];
        btn.addEventListener("click", function () {
          st.dem[c.id] = !demOn(c.id); save(); renderTN();
        });
        dtd.appendChild(btn);
        dtd.appendChild(document.createElement("br"));
        dtd.appendChild(el("span", "mods", modText(c.dem)));
      } else if (c.enne) {
        var eb = el("button", "demtog enne" + (st.enne ? " on" : ""), st.enne ? "ENNE active" : "ENNE off");
        eb.title = "Earth Needs No Eyes — Support action, TN 1 Meditation (Earth). Vigilance 1 → 4.";
        eb.addEventListener("click", function () { st.enne = !st.enne; save(); renderTN(); });
        dtd.appendChild(eb);
      }
      tr.appendChild(dtd);

      RINGS.forEach(function (r) {
        var v = tnFor(c, r);
        var cell = el("td");
        var span = el("span", "tnval" + (v <= 2 ? " easy" : v >= 6 ? " hard" : ""), String(v));
        cell.appendChild(span); tr.appendChild(cell);
      });

      var std = el("td");
      var sb = el("button", "demtog" + (discOn(c.id) ? " on" : ""), discOn(c.id) ? "−1" : "off");
      sb.title = "Skill/status discount: Courtesy when every target outranks you, Command when every target is lower, other skills when equal.";
      sb.addEventListener("click", function () { st.disc[c.id] = !discOn(c.id); save(); renderTN(); });
      std.appendChild(sb); tr.appendChild(std);

      tb.appendChild(tr);
    });
    t.appendChild(tb);
    host.appendChild(t);
  }

  function modText(d) {
    var m = DEMEANOR[d], out = [];
    RINGS.forEach(function (r) {
      if (m[r]) out.push(r.charAt(0).toUpperCase() + r.slice(1) + " " + (m[r] > 0 ? "+" : "") + m[r]);
    });
    return out.join(", ");
  }

  function renderObjectives() {
    var host = document.getElementById("objList");
    host.innerHTML = "";
    OBJECTIVES.forEach(function (o) {
      if (o.per) { ["Genzō", "Kiyo", "Rokurō"].forEach(function (n, i) { host.appendChild(objCard(o, o.id + "-" + i, n)); }); }
      else host.appendChild(objCard(o, o.id, null));
    });
  }

  function objCard(o, key, sub) {
    var cur = mo(key), met = cur >= o.diff;
    var box = el("div", "obj" + (met ? " met" : ""));
    box.appendChild(el("div", "kind", o.kind + " · target: " + (sub ? sub : o.target) + " · difficulty " + o.diff));
    box.appendChild(el("h4", null, o.who + (sub ? " → " + sub : "")));
    var aim = el("p", "aim"); aim.innerHTML = o.aim; box.appendChild(aim);

    var pips = el("div", "pips");
    for (var i = 1; i <= o.diff; i++) {
      (function (n) {
        var p = el("button", "pip" + (n <= cur ? " on" : "") + (n > o.diff ? " past" : ""), String(n));
        p.addEventListener("click", function () {
          st.mo[key] = (mo(key) === n) ? n - 1 : n; save(); renderObjectives();
        });
        pips.appendChild(p);
      })(i);
    }
    var tally = el("span", "tally");
    tally.innerHTML = "<b>" + cur + "</b> / " + o.diff + (met ? " — achieved" : "");
    pips.appendChild(tally);
    box.appendChild(pips);

    if (o.foot) { var f = el("p", "aim"); f.style.marginBottom = "0"; f.style.fontSize = "0.86rem";
      f.style.color = "var(--ink-soft)"; f.innerHTML = o.foot; box.appendChild(f); }
    return box;
  }

  function renderDemRef() {
    var host = document.getElementById("demRef");
    var t = el("table", "dem");
    var hr = el("tr");
    ["Demeanor", "Social skill check TN modifiers", "Common way of unmasking"].forEach(function (h) {
      hr.appendChild(el("th", null, h));
    });
    t.appendChild(hr);
    Object.keys(DEMEANOR).forEach(function (d) {
      var tr = el("tr");
      tr.appendChild(el("td", null, d));
      var td = el("td"); td.innerHTML = "<code>" + modText(d) + "</code>"; tr.appendChild(td);
      tr.appendChild(el("td", null, UNMASK[d]));
      t.appendChild(tr);
    });
    host.appendChild(t);
  }

  document.getElementById("resetAll").addEventListener("click", function () {
    if (!confirm("Reset all momentum, demeanor toggles and discounts for this intrigue?")) return;
    st = { dem: {}, disc: {}, mo: {}, enne: false }; save(); renderTN(); renderObjectives();
  });
  document.getElementById("clearMo").addEventListener("click", function () {
    if (!confirm("Clear momentum only? Demeanor toggles stay as they are.")) return;
    st.mo = {}; save(); renderObjectives();
  });

  renderTN(); renderObjectives(); renderDemRef();
})();
