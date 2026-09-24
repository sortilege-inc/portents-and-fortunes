/* ============================================================
   rail.js — the sticky table of contents used on long documents.

   Built from the headings themselves, so no anchor is hand-authored and the
   rail cannot drift out of sync when a section is cut or renamed.

   PF.rail({
     panel:   ".gm-panel",     // container whose headings are indexed
     strata:  "h2",            // optional: a bare label that groups what follows
     group:   "h3",            // collapsible entry, always listed
     entry:   "h4",            // shown only under the group being read
     title:   "Sections",      // rail heading
     toggle:  "Sections",      // label on the narrow-window toggle
     label:   fn(heading) -> string   // optional: rail text for a heading
     href:    fn(id) -> string        // optional: a link to a heading (default "#" + id)
     mount:   element                 // optional: where the rail goes (default document.body)
   });

   Styling lives in rokugan.css (.rail, .rail-title, .rail-strat, .r-grp,
   .r-h3, .rail-toggle). Below 1240px the rail becomes a slide-in overlay.
   ============================================================ */
(function () {
  "use strict";
  var PF = (window.PF = window.PF || {});

  function slug(s) {
    return s.toLowerCase().replace(/[‘’“”]/g, "")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  PF.rail = function (opt) {
    var panel = document.querySelector(opt.panel);
    if (!panel) return null;
    var levels = [opt.strata, opt.group, opt.entry].filter(Boolean);
    var heads = [].slice.call(panel.querySelectorAll(levels.join(",")));
    if (!heads.length) return null;

    var matches = function (h, sel) { return sel && h.matches(sel); };
    var text = opt.label || function (h) { return h.textContent; };

    var used = {};
    heads.forEach(function (h) {
      var id = slug(h.textContent) || "s";
      if (used[id]) id = id + "-" + (++used[id]); else used[id] = 1;
      h.id = id;
      h.style.scrollMarginTop = "5rem";
    });

    var rail = document.createElement("nav");
    rail.className = "rail"; rail.id = "rail";
    rail.setAttribute("aria-label", opt.title || "Sections");
    rail.innerHTML = '<div class="rail-title"></div>';
    rail.firstChild.textContent = opt.title || "Sections";
    var list = document.createElement("ul"); rail.appendChild(list);

    function link(h, kind) {
      var a = document.createElement("a");
      a.href = opt.href ? opt.href(h.id) : "#" + h.id; a.dataset.for = h.id; a.dataset.kind = kind;
      a.textContent = text(h).replace(/\s+/g, " ").trim();
      a.addEventListener("click", function () { rail.classList.remove("open"); });
      return a;
    }

    var grp = null, subs = null;
    heads.forEach(function (h) {
      if (matches(h, opt.strata)) {
        var d = document.createElement("li");
        d.className = "rail-strat";
        d.textContent = text(h).split("—")[0].trim();
        list.appendChild(d);
        grp = null; subs = null;
      } else if (matches(h, opt.group)) {
        grp = document.createElement("li"); grp.className = "r-grp";
        grp.appendChild(link(h, "group"));
        subs = document.createElement("ul"); grp.appendChild(subs);
        list.appendChild(grp);
      } else if (subs) {
        var li = document.createElement("li"); li.className = "r-h3";
        li.appendChild(link(h, "entry")); subs.appendChild(li);
      }
    });

    var btn = document.createElement("button");
    btn.className = "rail-toggle"; btn.type = "button";
    btn.innerHTML = '<span aria-hidden="true">&#9776;</span> ' + (opt.toggle || "Sections");
    btn.addEventListener("click", function () { rail.classList.toggle("open"); });

    (opt.mount || document.body).appendChild(rail);
    (opt.mount || document.body).appendChild(btn);
    /* Strata are labels, not links, so the spy tracks only what it can mark. */
    spy(rail, heads.filter(function (h) { return !matches(h, opt.strata); }));
    return rail;
  };

  /* Scroll-spy: mark the heading nearest the top of the viewport, open its
     group, and keep the marked entry scrolled into view within the rail. */
  function spy(rail, heads) {
    var links = {};
    [].forEach.call(rail.querySelectorAll("a"), function (a) { links[a.dataset.for] = a; });
    var current = null, ticking = false;
    function update() {
      ticking = false;
      var best = heads[0], line = 110;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= line) best = heads[i]; else break;
      }
      if (best.id === current) return;
      current = best.id;
      [].forEach.call(rail.querySelectorAll("a.on"), function (a) { a.classList.remove("on"); });
      [].forEach.call(rail.querySelectorAll(".r-grp.open"), function (g) { g.classList.remove("open"); });
      var a = links[best.id]; if (!a) return;
      a.classList.add("on");
      var g = a.closest(".r-grp"); if (g) g.classList.add("open");
      if (a.dataset.kind === "entry" && g) { g.querySelector("a").classList.add("on"); }
      var r = a.getBoundingClientRect(), rr = rail.getBoundingClientRect();
      if (r.top < rr.top + 8 || r.bottom > rr.bottom - 8) a.scrollIntoView({ block: "nearest" });
    }
    function onScroll() {
      if (!rail.isConnected) { removeEventListener("scroll", onScroll); return; }   // its tab was left
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    addEventListener("scroll", onScroll, { passive: true });
    update();
  }
})();
