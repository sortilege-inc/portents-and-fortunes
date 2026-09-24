// system/l5r5e/gm-panes.js — the GM's three panes (Portents M6, O8): Notes, Scenes, Threads ·
// Encounters · NPCs. Everything here is the GM's own pack state (system/l5r5e/ops.js: gmNotes, arc,
// threads, encounters) — saved with the pack, never sent to a player. The one rules text shown, the
// book's Group Rank / Encounter Rank and its Gauging an Encounter comparison, is the corpus's own
// (the GUIDANCE entry building-encounters, core p. 310).
(function () {
  const { el, button, debounce } = window.VttRender;
  const D = window.L5RData;
  const E = window.L5REntity;
  const Sheet = window.L5RSheet;
  const State = window.VttState;
  const Panels = window.VttPanels;
  const Sys = () => window.VttSystem;
  const S = () => State.state;
  const CFG = window.VttConfig || {};
  const editing = (c) => document.activeElement && /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName) && c.contains(document.activeElement);
  const newId = (p) => State.genId(p);

  // ── Notes: an authored document (the instance names it: VttConfig.notes = { src, title }) rendered,
  // and the GM's free notes below it ──────────────────────────────────
  let docCache = null;
  function renderNotes(container, ctx) {
    const draw = () => {
      container.innerHTML = '';
      const n = CFG.notes || null;
      if (n && n.src) {
        const box = el('div', { class: 'paper notes-doc' }, [el('div', { class: 'muted loading' }, ['Reading ' + (n.title || n.src) + '…'])]);
        container.appendChild(el('h4', {}, [n.title || 'Notes']));
        container.appendChild(box);
        const show = (text) => { box.innerHTML = ''; box.appendChild(E.markdown(text, 'core')); };
        if (docCache != null) show(docCache);
        else fetch(n.src).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))).then((t) => { docCache = t; show(t); })
          .catch((e) => { box.innerHTML = ''; box.appendChild(el('div', { class: 'empty' }, ['Could not read ' + n.src + ' (' + e.message + ').'])); });
      }
      container.appendChild(el('h4', {}, ['Free notes', el('span', { class: 'muted small' }, [' · saved with the pack, never sent to players'])]));
      container.appendChild(el('textarea', { class: 'text notes-free', rows: 10, placeholder: 'Jot as you play…', oninput: debounce((ev) => State.commit('setGmNotes', [ev.target.value]), 400) }, [S().gmNotes || '']));
    };
    ctx.on('state:remote', () => { if (!editing(container)) draw(); });
    draw();
  }

  // ── Scenes: the campaign's arc — loose and editable ───────────────────
  // arc = [{ id, title, text, played }]
  const arc = () => (S().arc || []).map((x) => Object.assign({}, x));
  const setArc = (list) => State.commit('setArc', [list]);
  function renderScenes(container, ctx) {
    const draw = () => {
      container.innerHTML = '';
      const list = arc();
      const played = list.filter((x) => x.played).length;
      container.appendChild(el('h4', {}, ['The arc', el('span', { class: 'muted small' }, [' · ' + list.length + ' scenes, ' + played + ' played'])]));
      list.forEach((x, i) => {
        const upd = (patch) => { const l = arc(); l[i] = Object.assign({}, l[i], patch); setArc(l); };
        const move = (d) => { const l = arc(); const j = i + d; if (j < 0 || j >= l.length) return; const t = l[i]; l[i] = l[j]; l[j] = t; setArc(l); };
        container.appendChild(el('div', { class: 'arc-scene' + (x.played ? ' played' : '') }, [
          el('div', { class: 'chiprow tight' }, [
            el('input', { type: 'checkbox', checked: x.played || null, title: 'Played', onchange: (ev) => upd({ played: ev.target.checked }) }),
            el('input', { class: 'text arc-title', type: 'text', value: x.title || '', placeholder: 'A scene', oninput: debounce((ev) => upd({ title: ev.target.value }), 400) }),
            button('↑', () => move(-1), 'ghost tiny'), button('↓', () => move(1), 'ghost tiny'),
            button('×', () => { if (confirm('Remove “' + (x.title || 'this scene') + '” from the arc?')) setArc(arc().filter((_, j) => j !== i)); }, 'ghost tiny'),
          ]),
          el('textarea', { class: 'text arc-text', rows: 3, placeholder: 'What it is for, who is in it, what might happen…', oninput: debounce((ev) => upd({ text: ev.target.value }), 400) }, [x.text || '']),
        ]));
      });
      const title = el('input', { class: 'text', type: 'text', placeholder: 'Add a scene…' });
      container.appendChild(el('div', { class: 'chiprow tight' }, [title, button('Add', () => { if (!title.value.trim()) return; setArc(arc().concat([{ id: newId('arc'), title: title.value.trim(), text: '', played: false }])); }, 'tiny')]));
    };
    ctx.on('state:changed', () => { if (!editing(container)) draw(); });
    ctx.on('state:remote', () => { if (!editing(container)) draw(); });
    draw();
  }

  // ── Threads · Encounters · NPCs ───────────────────────────────────────
  const threads = () => (S().threads || []).map((x) => Object.assign({}, x));
  const setThreads = (l) => State.commit('setThreads', [l]);
  const encounters = () => JSON.parse(JSON.stringify(S().encounters || []));
  const setEncounters = (l) => State.commit('setEncounters', [l]);

  // the book's own words for the ranks and the comparison (GUIDANCE building-encounters)
  function encounterRules() {
    const g = D.guidanceFor('#t53e040a67ec04e3085911').find((x) => x.id === '#u4U0YsCgQY4K0GgMcsyokm' || x.name === 'building-encounters');
    const paras = g ? String(g.text).split(/\n\n/) : [];
    const pick = (re) => paras.find((p) => re.test(p)) || null;
    return {
      group: pick(/^To estimate the Group Rank/), encounter: pick(/^To estimate the Encounter Rank/),
      even: pick(/^If the group rank is roughly equal/), edge: pick(/^If the group rank is 1\.5 to 2 times/), outmatched: pick(/^If the group rank is 0\.5 times/),
    };
  }
  // "take the sum of the group's school ranks"
  const groupRank = () => (S().party || []).reduce((a, m) => a + (Sheet.value(Sheet.complete(m.character || {}), 'School Rank') || 0), 0);
  const npcRank = (r, kind) => {
    const f = (r && r.fields) || {};
    const v = kind === 'intrigue' ? f['Intrigue Conflict Rank'] : f['Combat Conflict Rank'];
    return typeof v === 'number' ? v : null;
  };
  let draft = { name: '', kind: 'combat', npcs: [] };   // the encounter being built: npcs [{ id, count }]
  function renderThreads(container, ctx) {
    let q = '';
    const draw = () => {
      container.innerHTML = '';
      // threads
      const ts = threads();
      container.appendChild(el('h4', {}, ['Threads', el('span', { class: 'muted small' }, [' · ' + ts.filter((x) => x.open !== false).length + ' open'])]));
      ts.forEach((x, i) => {
        const upd = (patch) => { const l = threads(); l[i] = Object.assign({}, l[i], patch); setThreads(l); };
        container.appendChild(el('div', { class: 'thread' + (x.open === false ? ' closed' : '') }, [
          el('div', { class: 'chiprow tight' }, [
            el('input', { class: 'text', type: 'text', value: x.title || '', oninput: debounce((ev) => upd({ title: ev.target.value }), 400) }),
            button(x.open === false ? 'reopen' : 'close', () => upd({ open: x.open === false }), 'ghost tiny'),
            button('×', () => { if (confirm('Remove this thread?')) setThreads(threads().filter((_, j) => j !== i)); }, 'ghost tiny'),
          ]),
          x.open === false ? null : el('textarea', { class: 'text', rows: 2, placeholder: 'Where it stands…', oninput: debounce((ev) => upd({ text: ev.target.value }), 400) }, [x.text || '']),
        ]));
      });
      const tt = el('input', { class: 'text', type: 'text', placeholder: 'Open a thread…' });
      container.appendChild(el('div', { class: 'chiprow tight' }, [tt, button('Add', () => { if (!tt.value.trim()) return; setThreads(threads().concat([{ id: newId('th'), title: tt.value.trim(), text: '', open: true }])); }, 'tiny')]));

      // the encounter builder
      const rules = encounterRules();
      const recs = D.npcs();
      const byId = (id) => recs.find((r) => r.id === id);
      const gr = groupRank();
      const er = draft.npcs.reduce((a, n) => a + (npcRank(byId(n.id), draft.kind) || 0) * n.count, 0);
      const unranked = draft.npcs.filter((n) => npcRank(byId(n.id), draft.kind) == null).map((n) => (byId(n.id) || {}).name);
      container.appendChild(el('h4', {}, ['Encounter']));
      const kind = el('select', { class: 'scope tiny' }, [el('option', { value: 'combat', selected: draft.kind === 'combat' || null }, ['combat — a battle']), el('option', { value: 'intrigue', selected: draft.kind === 'intrigue' || null }, ['intrigue — a social scene'])]);
      kind.addEventListener('change', () => { draft.kind = kind.value; draw(); });
      const name = el('input', { class: 'text', type: 'text', value: draft.name, placeholder: 'name it to save it', oninput: (ev) => { draft.name = ev.target.value; } });
      container.appendChild(el('div', { class: 'chiprow tight' }, [kind, name]));
      draft.npcs.forEach((n, i) => {
        const r = byId(n.id);
        const rk = npcRank(r, draft.kind);
        container.appendChild(el('div', { class: 'chiprow tight enc-row' }, [
          el('button', { class: 'ref', type: 'button', onclick: () => window.L5ROpenEntity(n.id) }, [r ? r.name : n.id]),
          el('span', { class: 'muted small' }, [(rk == null ? 'no ' + draft.kind + ' rank' : draft.kind + ' ' + rk) + ' ×']),
          button('−', () => { n.count = Math.max(0, n.count - 1); if (!n.count) draft.npcs.splice(i, 1); draw(); }, 'ghost tiny'),
          el('b', { class: 'num' }, [String(n.count)]),
          button('+', () => { n.count++; draw(); }, 'ghost tiny'),
        ]));
      });
      const search = el('input', { type: 'search', class: 'search', placeholder: 'Add an NPC from any book…', value: q });
      const hits = el('div');
      const drawHits = () => {
        hits.innerHTML = '';
        if (q.length < 2) return;
        recs.filter((r) => r.name.toLowerCase().indexOf(q) !== -1).slice(0, 12).forEach((r) => hits.appendChild(el('div', { class: 'small' }, [
          button('+ ' + r.name, () => { const f = draft.npcs.find((x) => x.id === r.id); if (f) f.count++; else draft.npcs.push({ id: r.id, count: 1 }); q = ''; draw(); }, 'ghost tiny'),
          el('span', { class: 'muted' }, [' ' + [npcRank(r, 'combat') != null ? 'combat ' + npcRank(r, 'combat') : null, npcRank(r, 'intrigue') != null ? 'intrigue ' + npcRank(r, 'intrigue') : null, D.label(r.book)].filter(Boolean).join(' · ')]),
        ])));
      };
      search.addEventListener('input', debounce(() => { q = search.value.trim().toLowerCase(); drawHits(); }, 150));
      container.appendChild(search);
      container.appendChild(hits);
      drawHits();
      // the comparison, in the book's words
      const ratio = er ? gr / er : null;
      const band = ratio == null ? null : ratio <= 0.5 ? 'outmatched' : ratio >= 1.5 ? 'edge' : 'even';
      container.appendChild(el('div', { class: 'enc-sum' }, [
        el('div', {}, [el('b', {}, ['Group rank ' + gr]), el('span', { class: 'muted small' }, [' (' + (S().party || []).length + ' in the party)']), ' · ', el('b', {}, ['Encounter rank ' + er]), ratio != null ? el('span', { class: 'muted small' }, [' · ' + gr + ' : ' + er + ' = ' + (Math.round(ratio * 100) / 100)]) : null]),
        unranked.length ? el('div', { class: 'muted small' }, ['Not counted — no ' + draft.kind + ' conflict rank printed: ' + unranked.join(', ')]) : null,
        [['even', rules.even], ['edge', rules.edge], ['outmatched', rules.outmatched]].filter((x) => x[1]).map((x) => el('div', { class: 'small enc-band' + (band === x[0] ? ' on' : '') }, [E.span(x[1], 'core')])),
        band === 'edge' && ratio > 2 ? el('div', { class: 'muted small' }, ['The book’s band is 1.5 to 2 times; this is more.']) : null,
        band === 'even' && (ratio < 0.8 || ratio > 1.25) ? el('div', { class: 'muted small' }, ['Between the book’s bands; “roughly equal” is the nearest.']) : null,
      ]));
      const sc = Sys().scene && Sys().scene(Sys().currentSceneId());
      container.appendChild(el('div', { class: 'chiprow tight' }, [
        button('Save encounter', () => { if (!draft.npcs.length) return; const l = encounters(); const nm = draft.name.trim() || ('Encounter ' + (l.length + 1)); l.push({ id: newId('enc'), name: nm, kind: draft.kind, npcs: draft.npcs.map((n) => ({ id: n.id, count: n.count })) }); setEncounters(l); }, 'tiny'),
        sc && draft.npcs.length ? button('Put in ' + sc.name, () => { const cur = Sys().castIds(sc.id); State.commit('setSceneCast', [sc.id, cur.concat(draft.npcs.map((n) => n.id).filter((id) => cur.indexOf(id) === -1))]); }, 'ghost tiny') : null,
        draft.npcs.length ? button('Clear', () => { draft = { name: '', kind: draft.kind, npcs: [] }; draw(); }, 'ghost tiny') : null,
      ]));
      const saved = encounters();
      if (saved.length) container.appendChild(el('ul', { class: 'items' }, saved.map((x, i) => el('li', {}, [
        el('button', { class: 'ref', type: 'button', onclick: () => { draft = { name: x.name, kind: x.kind, npcs: x.npcs.map((n) => Object.assign({}, n)) }; draw(); } }, [x.name]),
        el('span', { class: 'muted small' }, [' · ' + x.kind + ' · ' + x.npcs.reduce((a, n) => a + n.count, 0) + ' NPCs']),
        button('×', () => setEncounters(encounters().filter((_, j) => j !== i)), 'ghost tiny'),
      ]))));
      if (rules.group || rules.encounter) container.appendChild(el('details', { class: 'small' }, [el('summary', { class: 'muted' }, ['The book: group rank and encounter rank']), rules.group ? E.span(rules.group, 'core') : null, el('br'), rules.encounter ? E.span(rules.encounter, 'core') : null]));

      // NPCs: the scene's cast
      container.appendChild(el('h4', {}, ['In this scene', el('span', { class: 'muted small' }, [sc ? ' · ' + sc.name : ' · no scene'])]));
      const here = sc ? Sys().cast(sc.id) : [];
      container.appendChild(here.length ? el('ul', { class: 'items' }, here.map((e) => el('li', {}, [
        el('button', { class: 'ref', type: 'button', onclick: () => window.L5ROpenEntity(e.id) }, [e.name]),
        el('span', { class: 'muted small' }, [' ' + [npcRank(D.records().find((r) => r.id === e.id), 'combat') != null ? 'combat ' + npcRank(D.records().find((r) => r.id === e.id), 'combat') : null, ((S().npcConditions || {})[e.id] || []).join(', ') || null].filter(Boolean).join(' · ')]),
      ]))) : el('div', { class: 'muted small' }, ['No one yet — the Cast panel, or an encounter’s “Put in”, adds NPCs.']));
    };
    ctx.on('state:changed', () => { if (!editing(container)) draw(); });
    ctx.on('state:remote', () => { if (!editing(container)) draw(); });
    ctx.on('scene:changed', draw);
    draw();
  }

  Panels.register('notes', { label: 'Notes', render: renderNotes });
  Panels.register('scenes', { label: 'Scenes', render: renderScenes });
  Panels.register('threads', { label: 'Threads · Encounters · NPCs', render: renderThreads });
})();
