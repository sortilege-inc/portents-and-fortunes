// system/l5r5e/sheet.js — the character sheet, derived from the corpus's ACTOR "Samurai" at
// runtime (PLAYBOOK §1b): the declared fields of Entity and Samurai, in declared order, each
// drawn by its declared type — Rings a DEF of five INTEGER 1–5 as the five tiles, a `LIST OF
// ^"Skill"` the core's skills by SKILL_GROUP with their ranks, a `LIST OF ^"Technique"` names
// from the books, an INTEGER MIN 0 MAX 100 a number, a STRING a line.
//
// The derived attributes are the corpus's own FORMULA strings, evaluated ("(Earth + Fire) × 2",
// "(Air + Water) / 2 (rounded down)"); the conditions are the ACTOR's own RULES
// (`WHEN [^"Strife" > ^"Composure"] THEN ^"Samurai" IS compromised`); Void points start at
// the STARTING_VALUE the corpus prints and cap at its MAXIMUM. Nothing is hand-listed.
//
// Also here: the live sheet for play — current Fatigue, Strife and Void points, the stance,
// and checks through the Roll & Keep roller (system/l5r5e/dice.js) that add the kept (st) to
// Strife and spend the Void point Seize the Moment costs.
window.L5RSheet = (function () {
  const { el, button } = window.VttRender;
  const D = window.L5RData;
  const E = window.L5REntity;
  const Dice = window.L5RDice;
  const State = () => window.VttState;

  const ACTOR = 'Samurai';
  const FILE_KIND = 'sortilege-vtt-character';
  const RINGS = ['Air', 'Earth', 'Fire', 'Water', 'Void'];

  // ── the declaration, read at runtime ──
  const declared = () => D.declared(ACTOR);
  const actor = () => declared().chain.slice(-1)[0] || null;

  // One entry per declared field: { name, kind, of, min, max, fields }
  function spec() {
    return declared().props.map((p) => {
      const s = { name: p.name, required: !!p.required, min: p.min, max: p.max };
      if (p.vk === 'def') {
        s.kind = p.name === 'Rings' ? 'rings' : 'group';
        s.fields = (p.fields || []).map((f) => ({ name: f.name, min: f.min, max: f.max, def: f.default, dtype: f.dtype }));
      } else if (p.vk === 'list' && p.of && !p.ofWord) { s.kind = p.of === 'Skill' ? 'skills' : 'names'; s.of = p.of; }
      else if (p.vk === 'list') s.kind = 'lines';
      else if (p.dtype === 'INTEGER') { s.kind = 'number'; s.def = p.default; }
      else s.kind = 'text';
      return s;
    });
  }

  // ── the corpus behind the fields ──
  // skills: the core's, each with its SKILL_GROUP, in printed order
  function skills() {
    return D.all(['core']).filter((e) => e.file.endsWith('core-traits.ttrpg') && D.block(e, 'SKILL_GROUP')).map((e) => ({ name: e.name, group: D.kwArg(e, 'SKILL_GROUP'), id: e.id }));
  }
  function skillGroups() {
    const g = [];
    skills().forEach((s) => {
      let row = g.find((x) => x.name === s.group);
      if (!row) g.push((row = { name: s.group, skills: [] }));
      row.skills.push(s);
    });
    return g;
  }
  // a derived attribute's FORMULA, evaluated over the rings — the corpus's arithmetic, read
  function formula(name) {
    const e = D.all(['core']).find((x) => x.name === name && x.file.endsWith('core-traits.ttrpg'));
    return e ? D.kwArg(e, 'FORMULA') : null;
  }
  function evaluate(text, rings) {
    if (!text) return null;
    let t = String(text);
    const down = /\(rounded down\)/.test(t);
    const up = /\(rounded up\)/.test(t);
    t = t.replace(/\(rounded (down|up)\)/, '').replace(/ ring value/g, '').replace(/×/g, '*');
    t = t.replace(/\b(Air|Earth|Fire|Water|Void)\b/g, (m) => String(rings[m] || 0));
    if (!/^[\d\s+\-*/().]+$/.test(t)) return null;
    // eslint-disable-next-line no-new-func
    const v = Function('return (' + t + ')')();
    return down ? Math.floor(v) : up ? Math.ceil(v) : v;
  }
  const DERIVED = ['Endurance', 'Composure', 'Focus', 'Vigilance'];
  function derived(v) {
    const out = {};
    DERIVED.forEach((k) => (out[k] = evaluate(formula(k), v.Rings || {})));
    const vp = D.named('Void Points', 'core');
    out.voidMax = evaluate(vp && D.kwArg(vp, 'MAXIMUM'), v.Rings || {});
    out.voidStart = evaluate(vp && D.kwArg(vp, 'STARTING_VALUE'), v.Rings || {});
    return out;
  }
  // the ACTOR's RULES: `WHEN [^"A" > ^"B"] THEN ^"Samurai" IS state`
  function conditionRules() {
    const a = actor();
    return ((a && a.rules) || []).map((r) => /WHEN \[\^"([^"]+)" > \^"([^"]+)"\] THEN \^"[^"]+" IS (\w+)/.exec(r.text)).filter(Boolean).map((m) => ({ over: m[1], limit: m[2], state: m[3] }));
  }

  // ── a character's values ──
  function blank() {
    const v = {};
    spec().forEach((s) => {
      if (s.kind === 'rings') { v.Rings = {}; s.fields.forEach((f) => (v.Rings[f.name] = f.def != null ? f.def : 1)); }
      else if (s.kind === 'group') { v[s.name] = {}; s.fields.forEach((f) => (v[s.name][f.name] = '')); }
      else if (s.kind === 'skills') v[s.name] = {};
      else if (s.kind === 'names' || s.kind === 'lines') v[s.name] = [];
      else if (s.kind === 'number') v[s.name] = s.def != null ? s.def : null;
      else v[s.name] = '';
    });
    return v;
  }
  function complete(v) {
    const out = blank();
    Object.keys(v || {}).forEach((k) => {
      if (v[k] == null) return;
      if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && typeof v[k] === 'object' && !Array.isArray(v[k])) out[k] = Object.assign({}, out[k], v[k]);
      else out[k] = v[k];
    });
    return out;
  }
  // the declared value, or what its FORMULA gives when the sheet leaves it empty
  function value(v, name) {
    if (v[name] != null && v[name] !== '') return v[name];
    const d = derived(v);
    return d[name] != null ? d[name] : null;
  }

  // ── a pregen: the corpus's own instance of Samurai, read into the same values ──
  // Its declared fields map by name; a skill printed "Fitness 1" is a rank; a field the ACTOR
  // does not declare (Region, Upbringing, Past, Relationships…) travels along as it is.
  function fromEntity(e) {
    const v = blank();
    const S = spec();
    (e.props || []).forEach((p) => {
      const s = S.find((x) => x.name === p.name);
      const pv = D.pval(p);
      if (s && s.kind === 'rings') v.Rings = Object.assign({}, v.Rings, D.defFields(p).fields);
      else if (s && s.kind === 'skills') {
        const m = {};
        (pv || []).forEach((x) => { const r = /^(.*\S)\s+(\d+)$/.exec(String(x)); if (r) m[r[1]] = parseInt(r[2], 10); });
        v[p.name] = m;
      } else if (s && s.kind === 'group') v[p.name] = Object.assign({}, v[p.name], D.defFields(p).fields);
      else v[p.name] = pv;
    });
    v.Description = v.Description || e.desc || '';
    // its abilities as the book prints them (Gift of Inner Power, Sixth Sense…), by id
    const kids = D.children(e.id);
    if (kids.length) v._abilities = kids.map((k) => ({ id: k.id, name: k.name }));
    v._source = { id: e.id, book: e.book, name: e.name };
    return v;
  }

  // A one-line description of who this is, from the sheet's own fields.
  function sentence(v) {
    return [v.Name || 'An unnamed samurai', [v.Clan && v.Clan + (/Clan$/.test(v.Clan) ? '' : ' Clan'), v.Family].filter(Boolean).join(', '), v.School ? v.School + (v['School Rank'] ? ' ' + v['School Rank'] : '') : null].filter(Boolean).join(' · ');
  }

  // ── the sheet, drawn from the declaration ──
  function ringTiles(v, onChange, o) {
    const ro = !onChange;
    return el('div', { class: 'rings-row' }, RINGS.map((r) => el('div', { class: 'ring-tile' + (o && o.stance === r ? ' stance' : ''), title: r }, [
      Dice.ringIcon(r),
      ro ? el('div', { class: 'v' }, [String((v.Rings || {})[r] == null ? '—' : v.Rings[r])])
        : el('input', { class: 'text num small', type: 'number', min: 1, max: 5, value: (v.Rings || {})[r] || 1, oninput: (ev) => onChange('Rings', Object.assign({}, v.Rings, { [r]: parseInt(ev.target.value || '1', 10) })) }),
      el('div', { class: 'k' }, [r]),
    ])));
  }
  function skillsBlock(s, v, onChange, onRoll) {
    const ro = !onChange;
    const have = v[s.name] || {};
    const known = new Set(skills().map((x) => x.name));
    const extra = Object.keys(have).filter((k) => !known.has(k));
    return el('div', { class: 'skill-groups' }, [
      skillGroups().map((g) => el('div', { class: 'skill-group' }, [
        el('div', { class: 'prop-k' }, [g.name]),
        g.skills.map((k) => el('div', { class: 'skill-row' }, [
          onRoll ? el('button', { type: 'button', title: 'Roll ' + k.name, onclick: () => onRoll(k.name, have[k.name] || 0) }, [k.name]) : E.link({ hash: k.id, name: k.name }, 'core'),
          ro ? el('span', { class: 'pips' }, ['●'.repeat(have[k.name] || 0) + '○'.repeat(Math.max(0, 5 - (have[k.name] || 0)))])
            : el('input', { class: 'text num small', type: 'number', min: 0, max: 5, value: have[k.name] || 0, oninput: (ev) => onChange(s.name, Object.assign({}, have, { [k.name]: parseInt(ev.target.value || '0', 10) })) }),
        ])),
      ])),
      extra.length ? el('div', { class: 'skill-group' }, [el('div', { class: 'prop-k' }, ['As printed on the sheet']), extra.map((k) => el('div', { class: 'skill-row' }, [onRoll ? el('button', { type: 'button', onclick: () => onRoll(k, have[k]) }, [k]) : el('span', {}, [k]), el('span', { class: 'pips' }, [String(have[k])])]))]) : null,
    ]);
  }
  function namesBlock(s, v, onChange) {
    const list = v[s.name] || [];
    const ro = !onChange;
    const input = ro ? null : el('input', { class: 'text small', type: 'text', placeholder: 'add a ' + s.of.toLowerCase() + '…', list: 'dl-' + s.of.replace(/\W/g, '') });
    return el('div', {}, [
      el('ul', { class: 'items' }, list.map((n, i) => el('li', {}, [E.link({ name: String(n).replace(/\s+\((?:[^()]*)\)$|\s+—.*$/, '') }, 'core'), String(n).match(/\s+\((?:[^()]*)\)$|\s+—.*$/) ? el('span', { class: 'muted small' }, [String(n).match(/\s+\((?:[^()]*)\)$|\s+—.*$/)[0]]) : null, ro ? null : button('×', () => onChange(s.name, list.filter((_, j) => j !== i)), 'ghost tiny')]))),
      ro ? null : el('div', { class: 'chiprow tight' }, [input, button('Add', () => { if (input.value.trim()) onChange(s.name, list.concat([input.value.trim()])); }, 'ghost tiny')]),
    ]);
  }
  function linesBlock(s, v, onChange) {
    const list = v[s.name] || [];
    if (!onChange) return list.length ? el('ul', { class: 'items' }, list.map((x) => el('li', {}, [E.span(String(x), 'core')]))) : el('span', { class: 'muted small' }, ['—']);
    return el('textarea', { class: 'text', rows: Math.max(2, list.length + 1), oninput: (ev) => onChange(s.name, ev.target.value.split('\n').map((x) => x.trim()).filter(Boolean)) }, [list.join('\n')]);
  }
  function scalar(s, v, onChange) {
    const val = s.kind === 'number' ? value(v, s.name) : v[s.name];
    if (!onChange) return val == null || val === '' ? el('span', { class: 'muted small' }, ['—']) : (typeof val === 'number' ? el('span', { class: 'num' }, [String(val)]) : E.span(String(val), 'core'));
    if (s.kind === 'number') return el('input', { class: 'text num', type: 'number', min: s.min != null ? s.min : null, max: s.max != null ? s.max : null, value: v[s.name] == null ? '' : v[s.name], placeholder: val != null ? String(val) : '', oninput: (ev) => onChange(s.name, ev.target.value === '' ? null : parseInt(ev.target.value, 10)) });
    const long = s.name === 'Description' || s.name === 'Ninjō' || s.name === 'Giri';
    return long ? el('textarea', { class: 'text', rows: 2, oninput: (ev) => onChange(s.name, ev.target.value) }, [v[s.name] || '']) : el('input', { class: 'text', type: 'text', value: v[s.name] || '', oninput: (ev) => onChange(s.name, ev.target.value) });
  }
  function groupBlock(s, v, onChange) {
    const g = v[s.name] || {};
    return el('div', { class: 'fields' }, s.fields.map((f) => el('div', { class: 'prop' }, [el('div', { class: 'prop-k' }, [f.name]), el('div', { class: 'prop-v' }, [
      onChange ? el('input', { class: 'text', type: 'text', value: g[f.name] || '', oninput: (ev) => onChange(s.name, Object.assign({}, g, { [f.name]: ev.target.value })) }) : (g[f.name] ? E.span(String(g[f.name]), 'core') : el('span', { class: 'muted small' }, ['—'])),
    ])])));
  }

  // The layout names where each declared field goes; anything it does not name lands in
  // "Also on the sheet" — and so does anything the character carries that is not declared.
  const LAYOUT = {
    head: ['Name', 'Clan', 'Family', 'School', 'School Rank', 'Roles'],
    social: ['Honor', 'Glory', 'Status'],
    derived: DERIVED.concat(['Void Points']),
    heart: ['Ninjō', 'Giri', 'Bushido', 'Demeanor'],
    lists: ['Techniques', 'Advantages', 'Disadvantages', 'Titles', 'Bonds', 'Equipment'],
  };
  function render(v, onChange, opts) {
    const o = opts || {};
    const S = spec();
    const byName = {};
    S.forEach((s) => (byName[s.name] = s));
    const used = new Set(['Rings', 'Skills', 'Description', 'Fatigue', 'Strife', 'Experience']);
    const field = (name) => {
      const s = byName[name];
      if (!s) return null;
      used.add(name);
      const c = s.kind === 'names' ? namesBlock(s, v, onChange) : s.kind === 'lines' ? linesBlock(s, v, onChange) : s.kind === 'group' ? groupBlock(s, v, onChange) : scalar(s, v, onChange);
      return el('div', { class: 'prop' }, [el('div', { class: 'prop-k' }, [s.name]), el('div', { class: 'prop-v' }, [c])]);
    };
    const d = derived(v);
    const sheet = el('div', { class: 'sheet' }, [
      el('div', { class: 'two-up' }, [el('div', {}, LAYOUT.head.map(field)), el('div', {}, [ringTiles(v, onChange, o), el('div', { class: 'fields' }, LAYOUT.social.map(field))])]),
      el('div', { class: 'sheet-sec' }, [el('h4', {}, ['Derived', el('span', { class: 'muted small' }, [' · from the corpus’s formulas: ' + DERIVED.map((k) => k + ' ' + (formula(k) || '?')).join('; ')])]), el('div', { class: 'fields' }, LAYOUT.derived.map(field)),
        el('div', { class: 'muted small' }, ['Void points: start ' + (d.voidStart == null ? '—' : d.voidStart) + ', at most ' + (d.voidMax == null ? '—' : d.voidMax)])]),
      byName.Skills ? el('div', { class: 'sheet-sec' }, [el('h4', {}, ['Skills']), skillsBlock(byName.Skills, v, onChange, o.onRoll)]) : null,
      el('div', { class: 'sheet-sec' }, [el('h4', {}, ['Heart']), LAYOUT.heart.map(field)]),
      el('div', { class: 'sheet-sec' }, [el('h4', {}, ['Techniques, advantages, gear']), LAYOUT.lists.map(field)]),
      byName.Experience ? el('div', { class: 'sheet-sec' }, [field('Experience'), field('Description')]) : null,
    ]);
    const rest = S.filter((s) => !used.has(s.name));
    const undeclared = Object.keys(v).filter((k) => !byName[k] && k.charAt(0) !== '_');
    if (rest.length || undeclared.length) {
      sheet.appendChild(el('div', { class: 'sheet-sec' }, [el('h4', {}, ['Also on the sheet']),
        rest.map((s) => field(s.name)),
        undeclared.map((k) => el('div', { class: 'prop' }, [el('div', { class: 'prop-k' }, [k]), el('div', { class: 'prop-v' }, [Array.isArray(v[k]) ? el('ul', { class: 'items' }, v[k].map((x) => el('li', {}, [E.span(String(x), 'core')]))) : E.span(String(v[k]), 'core')])])),
      ]));
    }
    if (v._abilities && v._abilities.length) sheet.appendChild(el('div', { class: 'sheet-sec' }, [el('h4', {}, ['As the book prints them']), v._abilities.map((a) => { const e = D.entity(a.id); return e ? E.render(e, { depth: 1 }) : null; })]));
    return sheet;
  }

  // the published character, read-only, with its checks — the site's Characters page
  function fromEntityView(e) {
    const v = fromEntity(e);
    const wrap = el('div', {}, [el('h2', {}, [v.Name || e.name]), el('div', { class: 'muted' }, [sentence(v) + ' · ' + D.label(e.book)])]);
    const roller = Dice.roller({ preset: { ring: 'Air', ringValue: v.Rings.Air, skill: null, skillRank: 0 }, ringsOf: (r) => v.Rings[r], onResolve: () => {} });
    wrap.appendChild(render(v, null, { onRoll: (skill, rank) => { roller.set({ skill, skillRank: rank }); roller.scrollIntoView({ block: 'center' }); } }));
    wrap.appendChild(el('h4', {}, ['A check']));
    wrap.appendChild(roller);
    wrap.appendChild(el('div', { class: 'chiprow' }, [button('Download as a character file', () => download(v)), el('span', { class: 'muted small' }, ['the GM’s table and the player’s page take it back'])]));
    return wrap;
  }

  // ── the character file ──
  function readFile(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Not a character file.');
    return complete(obj.kind === FILE_KIND && obj.character ? obj.character : obj);
  }
  function fileOf(v, live) {
    return { kind: FILE_KIND, version: 1, system: 'l5r5e', templateId: (actor() || {}).id || null, exported: new Date().toISOString(), name: v.Name || '', character: v, live: live || undefined };
  }
  function download(v, live) {
    const blob = new Blob([JSON.stringify(fileOf(v, live), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (v.Name || 'samurai').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.l5r5e-character.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  function memberFrom(v, source, live) {
    return { id: State().genId('pc'), templateId: (actor() || {}).id || 'l5r5e-samurai', name: v.Name || 'Unnamed', source: source || { kind: 'file' }, character: v, live: live || {}, notes: '', playerNotes: '' };
  }
  const readMember = (obj, fileName) => memberFrom(readFile(obj), { kind: 'file', name: fileName || null }, obj && obj.live);
  const downloadMember = (m) => download(m.character || blank(), m.live || {});
  const memberFromEntity = (e) => memberFrom(fromEntity(e), { kind: 'pregen', id: e.id, book: e.book });

  // ── play: the live values, the conditions, the checks ──
  // live = { Fatigue, Strife, voidPoints, stance, conditions: [] }
  function current(m, key) {
    const lv = m.live || {};
    const v = complete(m.character || {});
    if (key === 'Void Points') return lv.voidPoints != null ? lv.voidPoints : (v['Void Points'] != null ? v['Void Points'] : derived(v).voidStart);
    if (lv[key] != null) return lv[key];
    return v[key] != null && v[key] !== '' ? v[key] : 0;
  }
  function conditions(m) {
    const v = complete(m.character || {});
    return conditionRules().filter((r) => current(m, r.over) > value(v, r.limit)).map((r) => r.state);
  }
  const tokenText = (m) => ['Strife ' + current(m, 'Strife'), 'Fatigue ' + current(m, 'Fatigue')].concat(conditions(m)).join(' · ');
  const patch = (m, p) => State().commit('setPartyLive', [m.id, p]);

  function track(label, cur, max, onSet) {
    const n = Math.max(max || 0, cur || 0);
    return el('div', { class: 'track' }, [
      el('span', { class: 'track-name' }, [label]),
      el('span', { class: 'boxes' }, Array.from({ length: n }, (_, i) => el('span', { class: 'box' + (i < cur ? (i >= max ? ' on over' : ' on') : ''), title: String(i + 1), onclick: onSet ? () => onSet(i + 1 === cur ? i : i + 1) : null }))),
      el('span', { class: 'muted small' }, [cur + ' / ' + (max == null ? '—' : max)]),
      onSet ? button('−', () => onSet(Math.max(0, cur - 1)), 'ghost tiny') : null,
      onSet ? button('+', () => onSet(cur + 1), 'ghost tiny') : null,
    ]);
  }

  // one roller per member, kept across redraws: a roll's own log entry redraws the panel
  const rollers = {};
  function rollerFor(m, v) {
    if (rollers[m.id]) return rollers[m.id];
    const r = Dice.roller({
      preset: { ring: (m.live || {}).stance || 'Air', ringValue: v.Rings[(m.live || {}).stance || 'Air'], skill: null, skillRank: 0 },
      ringsOf: (ring) => complete(((State().state.party || []).find((x) => x.id === m.id) || m).character || {}).Rings[ring],
      onResolve: (roll) => {
        const mm = (State().state.party || []).find((x) => x.id === m.id) || m;
        const t = roll.resolved;
        const p = {};
        // "Strife (st) … tracks toward Compromised condition" — the kept (st) are received as strife
        if (t.strife) p.Strife = current(mm, 'Strife') + t.strife;
        // Seize the Moment: "spend 1 Void point"
        if (roll.opts.void) p.voidPoints = Math.max(0, current(mm, 'Void Points') - Dice.SEIZE_THE_MOMENT.cost);
        p.stance = roll.opts.ring;
        State().commit('appendLog', [Object.assign(Dice.logEntry(roll, mm.name), { memberId: mm.id })]);
        if (Object.keys(p).length) patch(mm, p);
      },
    });
    rollers[m.id] = r;
    return r;
  }

  function live(m, opts) {
    const o = opts || {};
    const v = complete(m.character || {});
    const d = derived(v);
    const lv = m.live || {};
    const box = el('div', { class: 'sheet live' });
    const roller = rollerFor(m, v);
    box.appendChild(el('div', { class: 'sheet-head' }, [el('h2', {}, [m.name]), el('div', { class: 'muted small' }, [sentence(v)])]));
    const conds = conditions(m);
    box.appendChild(el('div', { class: 'chiprow tight' }, [ringTiles(v, null, { stance: lv.stance }), conds.map((c) => el('span', { class: 'cond', title: 'the Samurai type’s own rule' }, [c]))]));
    box.appendChild(track('Fatigue', current(m, 'Fatigue'), value(v, 'Endurance'), (n) => patch(m, { Fatigue: n })));
    box.appendChild(track('Strife', current(m, 'Strife'), value(v, 'Composure'), (n) => patch(m, { Strife: n })));
    box.appendChild(track('Void points', current(m, 'Void Points'), d.voidMax, (n) => patch(m, { voidPoints: Math.min(n, d.voidMax || n) })));
    box.appendChild(el('div', { class: 'muted small' }, ['Focus ' + value(v, 'Focus') + ' · Vigilance ' + value(v, 'Vigilance') + ' · Honor ' + (v.Honor == null ? '—' : v.Honor) + ' · Glory ' + (v.Glory == null ? '—' : v.Glory) + ' · Status ' + (v.Status == null ? '—' : v.Status)]));
    box.appendChild(el('h4', {}, ['A check', el('span', { class: 'muted small' }, [' · pick a skill below, a ring, the TN'])]));
    box.appendChild(roller);
    const onRoll = (skill, rank) => roller.set({ skill, skillRank: rank });
    box.appendChild(render(v, null, { onRoll, stance: lv.stance }));
    const rollLog = el('div', { class: 'roll-log' });
    (((State().state || {}).log) || []).filter((x) => x.kind === 'roll' && x.memberId === m.id).slice(-6).reverse().forEach((x) => rollLog.appendChild(Dice.logLine(x)));
    box.appendChild(rollLog);
    return box;
  }

  return {
    ACTOR, FILE_KIND, spec, skills, skillGroups, formula, evaluate, derived, conditionRules, blank, complete, value,
    fromEntity, fromEntityView, sentence, render, readFile, fileOf, download, memberFrom, readMember, downloadMember,
    memberFromEntity, current, conditions, tokenText, live, rollerFor,
  };
})();
