/* campaign/site/personae.js — the Dramatis Personae tab (M7), drawn from the campaign's DSL layer
   (campaign/dsl/portents-npcs.ttrpg, built into campaign/data/) and its presentation file
   (campaign/site/npc-meta.js: portrait, authored reveals, how each was built).

   Discovery, as the old page had it: a fact is concealed until it is met. A fact is shown when the
   GM switch is on, when the campaign has revealed it (npc-meta.js `reveal`), or when this browser
   uncovered it by clicking the blur. The switch and this browser's reveals keep the old page's
   keys (pf-dp-gm, pf-dp-revealed) and its fact ids (<old npc id>:<field>), so what a player had
   uncovered there is still uncovered here — except an ability, now keyed by its name
   (<id>:abil:<name>) rather than its place in the old list.

   The old page's scene tools (the table bar, the roster, the roller, the conflict turn, the
   trackers and the scene log) are the VTT's GM table now, and are not here. */
(function () {
  var D = window.L5RData, E = window.L5REntity;
  var META = window.PF_NPC_META || {};
  var GMKEY = 'pf-dp-gm', REVKEY = 'pf-dp-revealed';
  var RINGS = ['air', 'earth', 'fire', 'water', 'void'];
  var GROUPS = ['artisan', 'martial', 'scholar', 'social', 'trade'];

  function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window */ } }
  var gm = load(GMKEY, 0) === 1;
  var revealed = load(REVKEY, {}) || {};

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  // ── the cast, from the layer ────────────────────────────────────────
  function listProp(e, name) { var v = D.val(e, name); return Array.isArray(v) ? v : []; }
  function npcOf(e) {
    var m = META[e.id] || {};
    var rings = {};
    (D.defFields(D.prop(e, 'Rings')).fields && Object.keys(D.defFields(D.prop(e, 'Rings')).fields) || []).forEach(function (k) { rings[k.toLowerCase()] = D.defFields(D.prop(e, 'Rings')).fields[k]; });
    var skills = {};
    listProp(e, 'Skills').forEach(function (s) { var mm = /^(.*?)\s+(\d+)$/.exec(s); if (mm) skills[mm[1].toLowerCase()] = +mm[2]; });
    var abilities = (e.rules || []).map(function (r) {
      var t = E.ruleText(r.text) || '';
      var mm = /^([^:]{1,80}):\s*([\s\S]*)$/.exec(t);
      return mm ? { name: mm[1], text: mm[2] } : { name: '', text: t };
    });
    var tech = D.prop(e, 'Techniques');
    ((tech && tech.items) || []).forEach(function (it) { abilities.push({ name: it.c, ref: it.h || null }); });
    return {
      id: e.id, fid: m.was || e.id, name: e.name, reveal: m.reveal || [], portrait: m.portrait || null, statNote: m.statNote || null,
      epithet: D.text(e, 'Epithet'), affil: D.text(e, 'Affiliation'), status: D.text(e, 'Campaign Status'), bio: listProp(e, 'Biography'),
      stat: D.num(e, 'Endurance') == null ? null : {
        kind: D.text(e, 'Type') || 'NPC', combatRank: D.num(e, 'Combat Conflict Rank'), intrigueRank: D.num(e, 'Intrigue Conflict Rank'),
        description: D.text(e, 'Description'), rings: rings,
        honor: D.num(e, 'Honor'), glory: D.num(e, 'Glory'), status: D.num(e, 'Status'),
        endurance: D.num(e, 'Endurance'), composure: D.num(e, 'Composure'), focus: D.num(e, 'Focus'), vigilance: D.num(e, 'Vigilance'), silhouette: D.num(e, 'Silhouette'),
        demeanor: D.text(e, 'Demeanor'), tnMods: D.text(e, 'Social Skill Check TN Modifiers'), skills: skills,
        advantages: listProp(e, 'Advantages'), disadvantages: listProp(e, 'Disadvantages'),
        weapons: listProp(e, 'Favored Weapons'), gear: listProp(e, 'Gear'), gearOther: listProp(e, 'Gear (Other)'), abilities: abilities,
      },
    };
  }
  function cast() {
    return D.npcs().filter(function (r) { return r.book === 'campaign'; }).map(function (r) { return D.entity(r.id); }).filter(Boolean).map(npcOf);
  }

  // ── a fact that may be concealed ────────────────────────────────────
  var CAST = [];
  function authored(fid) {
    var i = fid.indexOf(':'), n = CAST.find(function (x) { return x.fid === fid.slice(0, i); });
    var f = fid.slice(i + 1);
    return !!n && (n.reveal.indexOf(f) >= 0 || n.reveal.indexOf(f.split(':')[0]) >= 0);
  }
  function fz(fid, inner, extra) {
    var open = authored(fid);
    var span = el('span', 'fz ' + (extra || '') + (gm || open || revealed[fid] ? ' revealed' : ' fuzzed'));
    span.setAttribute('data-fid', fid);
    if (typeof inner === 'string') span.innerHTML = inner; else span.appendChild(inner);
    if (!gm && !open) {
      span.setAttribute('role', 'button'); span.setAttribute('tabindex', '0');
      var sync = function () { span.title = revealed[fid] ? 'Discovered — click to conceal again' : 'Click to reveal (discovered)'; };
      var flip = function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        if (revealed[fid]) delete revealed[fid]; else revealed[fid] = 1;
        store(REVKEY, revealed);
        span.classList.toggle('fuzzed', !revealed[fid]); span.classList.toggle('revealed', !!revealed[fid]); sync();
      };
      sync();
      span.addEventListener('click', flip);
      span.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') flip(ev); });
    }
    return span;
  }
  function rich(text) { return E.span(text, 'campaign'); }    // the VTT's own dice symbols and references

  // ── the page ────────────────────────────────────────────────────────
  function modeBar(redraw) {
    var bar = el('div', 'dp-modebar');
    bar.innerHTML = "<div class='mb-left'><span class='mb-eye'>&#9673;</span><div class='mb-copy'><span class='mb-mode'>" + (gm ? 'Game Master' : 'Player — discovery') + "</span><span class='mb-note'>" + (gm ? 'Every fact shown.' : 'Facts are concealed until met. Click any blur to reveal it — reveals persist.') + '</span></div></div>';
    var sw = el('button', 'gm-switch' + (gm ? ' on' : ''));
    sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', gm ? 'true' : 'false');
    sw.innerHTML = "<span class='gs-label'>GM</span><span class='gs-track'><span class='gs-knob'></span></span>";
    sw.addEventListener('click', function () { gm = !gm; store(GMKEY, gm ? 1 : 0); redraw(); });
    bar.appendChild(sw);
    return bar;
  }
  function emblem(kind) { return kind === 'Minion' ? '▲' : kind === 'Adversary' ? '❁' : '❖'; }
  function tarot(n, selected) {
    var card = el('a', 'tarot' + (selected ? ' active' : '') + (n.stat ? '' : ' nostat'));
    card.href = '#personae/' + encodeURIComponent(n.fid);
    card.id = 'card-' + n.fid;
    var inner = el('div', 'tr-inner');
    if (n.portrait) { var pf = el('div', 'tr-portrait'); pf.appendChild(fz(n.fid + ':portrait', "<img src='" + esc(n.portrait) + "' alt='' loading='lazy'>", 'fz-portrait')); inner.appendChild(pf); }
    else inner.appendChild(el('div', 'tr-emblem', emblem(n.stat && n.stat.kind)));
    var nm = el('div', 'tr-name'); nm.appendChild(fz(n.fid + ':name', esc(n.name), 'fz-name')); inner.appendChild(nm);
    if (n.epithet) { var ep = el('div', 'tr-ep'); ep.appendChild(fz(n.fid + ':epithet', esc(n.epithet), 'fz-block')); inner.appendChild(ep); }
    inner.appendChild(el('div', 'tr-kind', esc(n.stat ? n.stat.kind : 'Bio')));
    if (n.bio[0]) { var sn = el('p', 'tr-snip'); sn.appendChild(fz(n.fid + ':bio0', esc(n.bio[0]), 'fz-block')); inner.appendChild(sn); }
    card.appendChild(inner);
    return card;
  }
  function carousel(sel) {
    var wrap = el('div', 'dp-carousel-wrap');
    var prev = el('button', 'car-nav prev', '&#8249;'), next = el('button', 'car-nav next', '&#8250;');
    prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
    var track = el('div', 'dp-carousel');
    CAST.forEach(function (n) { track.appendChild(tarot(n, sel && n.fid === sel.fid)); });
    var step = function () { var c = track.querySelector('.tarot'); return c ? c.offsetWidth + 18 : 300; };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    wrap.appendChild(prev); wrap.appendChild(track); wrap.appendChild(next);
    return wrap;
  }
  function bio(n) {
    var wrap = el('div', 'dp-bio');
    n.bio.forEach(function (p, i) { var para = el('p', 'dp-bp'); para.appendChild(fz(n.fid + ':bio' + i, esc(p), 'fz-block')); wrap.appendChild(para); });
    if (n.statNote) { var s = el('p', 'dp-statnote'); s.appendChild(fz(n.fid + ':statNote', '&#9873; ' + esc(n.statNote), 'fz-block')); wrap.appendChild(s); }
    if (n.status) { var st = el('p', 'dp-meta'); st.appendChild(fz(n.fid + ':status', esc(n.status), 'fz-block')); wrap.appendChild(st); }
    if (!n.stat) wrap.appendChild(el('p', 'dp-meta dp-nostat', 'No statblock yet — bio only.'));
    return wrap;
  }
  function statCol(label, rows) {
    var col = el('div', 'stat-col'); col.appendChild(el('div', 'sc-lab', label));
    rows.forEach(function (r) { if (r[1] == null) return; var line = el('div', 'sc-row'); line.innerHTML = "<span class='sc-nm'>" + r[0] + '</span>'; line.appendChild(fz(r[2], "<span class='sc-v'>" + r[1] + '</span>')); col.appendChild(line); });
    return col;
  }
  function adColumn(label, items, base) {
    var col = el('div', 'ad-col'); col.appendChild(el('div', 'ad-lab', label));
    items.forEach(function (it, i) {
      var m = /^(.*?):\s*(.*)$/.exec(it), line = el('div', 'ad-item'), inner = el('span');
      inner.appendChild(el('b', null, esc(m ? m[1] : it) + (m ? ':' : ''))); if (m) { inner.appendChild(document.createTextNode(' ')); inner.appendChild(rich(m[2])); }
      line.appendChild(fz(base + i, inner, 'fz-block')); col.appendChild(line);
    });
    if (!items.length) col.appendChild(el('div', 'ad-none', '—'));
    return col;
  }
  function statblock(n) {
    var s = n.stat, id = n.fid, wrap = el('div', 'dp-play');
    var top = el('div', 'dp-typebar'); top.innerHTML = "<span class='dp-type'>" + esc(s.kind) + '</span>';
    var ranks = el('span', 'dp-ranks'); ranks.innerHTML = "<span class='rk-lab'>Conflict Rank</span>";
    ranks.appendChild(fz(id + ':combatRank', "<span class='rk combat' title='Combat'>&#9876; " + (s.combatRank == null ? '—' : s.combatRank) + '</span>'));
    ranks.appendChild(fz(id + ':intrigueRank', "<span class='rk intrigue' title='Intrigue'>&#10057; " + (s.intrigueRank == null ? '—' : s.intrigueRank) + '</span>'));
    top.appendChild(ranks); wrap.appendChild(top);
    if (s.description) { var d = el('p', 'dp-desc'); d.appendChild(fz(id + ':desc', esc(s.description), 'fz-block')); wrap.appendChild(d); }
    var rr = el('div', 'dp-ringrow');
    RINGS.forEach(function (r) { var c = el('div', 'rr-cell ring-' + r); c.innerHTML = "<img class='rr-ico' src='campaign/assets/rings/" + r + ".svg' alt=''><span class='rr-nm'>" + cap(r) + '</span>'; c.appendChild(fz(id + ':ring:' + r, "<span class='rr-v'>" + (s.rings[r] == null ? '—' : s.rings[r]) + '</span>')); rr.appendChild(c); });
    wrap.appendChild(rr);
    var stats = el('div', 'dp-stats');
    stats.appendChild(statCol('Societal', [['Honor', s.honor, id + ':honor'], ['Glory', s.glory, id + ':glory'], ['Status', s.status, id + ':status']]));
    stats.appendChild(statCol('Personal', [['Endurance', s.endurance, id + ':endurance'], ['Composure', s.composure, id + ':composure'], ['Focus', s.focus, id + ':focus'], ['Vigilance', s.vigilance, id + ':vigilance'], ['Silhouette', s.silhouette, id + ':silhouette']]));
    wrap.appendChild(stats);
    if (s.demeanor || s.tnMods) {
      var dm = el('div', 'dp-demeanor');
      if (s.demeanor) { dm.innerHTML = "<span class='dm-lab'>Demeanor</span>"; dm.appendChild(fz(id + ':demeanor', esc(s.demeanor))); }
      if (s.tnMods) { var tn = el('span', 'dp-tnmods'); tn.innerHTML = "<span class='dm-lab'>Social TN</span>"; tn.appendChild(fz(id + ':tnmods', esc(s.tnMods))); dm.appendChild(tn); }
      wrap.appendChild(dm);
    }
    var sk = el('div', 'dp-skills');
    GROUPS.forEach(function (g) { var v = s.skills[g] || 0, chip = el('span', 'sk-chip' + (v > 0 ? ' ranked' : '')); chip.innerHTML = "<span class='sk-nm'>" + cap(g) + '</span>'; chip.appendChild(fz(id + ':skill:' + g, "<span class='sk-v'>" + v + '</span>')); sk.appendChild(chip); });
    wrap.appendChild(sk);
    if (s.advantages.length || s.disadvantages.length) { var ad = el('div', 'dp-adv'); ad.appendChild(adColumn('Advantages', s.advantages, id + ':adv')); ad.appendChild(adColumn('Disadvantages', s.disadvantages, id + ':dis')); wrap.appendChild(ad); }
    var wg = el('div', 'dp-gear'); wg.appendChild(el('div', 'dp-h', 'Favored Weapons &amp; Gear'));
    s.weapons.forEach(function (w, i) { var p = el('p', 'dp-weap'); p.appendChild(fz(id + ':weap' + i, rich(w), 'fz-block')); wg.appendChild(p); });
    [['Gear (equipped):', s.gear, ':gear'], ['Gear (other):', s.gearOther, ':gearo']].forEach(function (g) {
      if (!g[1].length) return;
      var line = el('p', 'dp-gearline'); line.innerHTML = "<span class='gl-lab'>" + g[0] + '</span> ';
      g[1].forEach(function (x, i) { if (i) line.appendChild(document.createTextNode(', ')); line.appendChild(fz(id + g[2] + i, rich(x))); });
      wg.appendChild(line);
    });
    wrap.appendChild(wg);
    if (s.abilities.length) {
      var ab = el('div', 'dp-abils'); ab.appendChild(el('div', 'dp-h', 'Abilities'));
      s.abilities.forEach(function (a) {
        var fid = id + ':abil:' + a.name, e = el('div', 'dp-abil'), head = el('div', 'ab-head');
        var nm = a.ref ? el('a', 'ab-nm ref', esc(a.name)) : el('span', 'ab-nm', esc(a.name));
        if (a.ref) { nm.href = '#'; nm.addEventListener('click', function (ev) { ev.preventDefault(); if (window.L5ROpenEntity) window.L5ROpenEntity(a.ref); }); }
        head.appendChild(fz(fid + ':name', nm, 'fz-inline')); e.appendChild(head);
        if (a.text) { var body = el('p', 'ab-text'); body.appendChild(fz(fid + ':text', rich(a.text), 'fz-block')); e.appendChild(body); }
        else if (a.ref) e.appendChild(el('p', 'ab-text dp-meta', 'A technique — open it for its text.'));
        ab.appendChild(e);
      });
      wrap.appendChild(ab);
    }
    return wrap;
  }
  function sheet(n) {
    var host = el('div', 'scene-sheet');
    var head = el('div', 'sh-head2');
    if (n.portrait) { var hp = el('div', 'sh2-portrait'); hp.appendChild(fz(n.fid + ':portrait', "<img src='" + esc(n.portrait) + "' alt='' loading='lazy'>", 'fz-portrait')); head.appendChild(hp); }
    var idbox = el('div', 'sh2-id');
    idbox.appendChild(fz(n.fid + ':name', "<span class='sh2-nm'>" + esc(n.name) + '</span>', 'fz-name'));
    if (n.epithet) idbox.appendChild(fz(n.fid + ':epithet', "<span class='sh2-ep'>" + esc(n.epithet) + '</span>', 'fz-block'));
    head.appendChild(idbox);
    host.appendChild(head);
    var body = el('div', 'sh2-body');
    body.appendChild(bio(n));
    if (n.stat) body.appendChild(statblock(n));
    host.appendChild(body);
    return host;
  }

  window.PF = window.PF || {};
  // `root` is the page's #dp (campaign/docs/personae.html, drawn by campaign/site/site.js)
  PF.personae = function (root, path) {
    root.innerHTML = '<p class="dp-meta">Reading the cast…</p>';
    D.ensure(['campaign']).then(function () {
      if (!root.isConnected) return;
      CAST = cast();
      var draw = function () {
        var sel = CAST.find(function (n) { return n.fid === path[0] || n.id === path[0]; }) || null;
        root.innerHTML = '';
        root.appendChild(modeBar(draw));
        root.appendChild(carousel(sel));
        var dp = el('div', 'dp-scene');
        if (sel) dp.appendChild(sheet(sel)); else dp.appendChild(el('p', 'scene-empty', 'Choose a card to read what is known.'));
        root.appendChild(dp);
        if (sel) { var c = document.getElementById('card-' + sel.fid); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      };
      draw();
    });
  };
})();
