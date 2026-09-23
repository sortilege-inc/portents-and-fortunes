// system/l5r5e/creator.js — making a character: the core's Game of Twenty Questions, walked one
// question at a time.
//
// The steps are the corpus's: each question is a DEF in `^"Game of Twenty Questions"` (its
// Question number and Question Text), grouped by the Part it sits in; beside it, the one-line
// summary `^"Twenty Questions"` prints for it ("(Either +5 glory, or +1 rank in a skill at
// rank 0)") and the book's own walkthrough for it (the GUIDANCE entry `q07-…`), verbatim.
// What a question DOES is bound to the rule ids the corpus gives it — `q1_applies_clan_ring_
// bonus`, `q4_choose_any_ring_plus_one`, `q9_grants_one_distinction` — and every number is
// read from the corpus: a clan's Clan Ring Bonus and Clan Status, a family's Ring Increase
// CHOOSE and Glory, a school's Starting Skills CHOOSE and STARTING_TECHNIQUES, "+5 glory" out
// of the summary row, "+10 honor" and Q8's six skills out of its walkthrough, the Samurai
// Heritage Table rolled as printed. The limits are Starting Values' own rule ids
// (`ring_maximum_during_creation_is_three`).
//
// The answers are kept (one draft per character in this browser's roster) and the sheet is
// recomputed from them from the Starting Values up, so changing an early answer re-flows the
// rest. What leaves is a character file (system/l5r5e/sheet.js) the table imports.
window.L5RCreator = (function () {
  const { el, button, debounce } = window.VttRender;
  const D = window.L5RData;
  const E = window.L5REntity;
  const Sheet = window.L5RSheet;
  const Dice = window.L5RDice;
  const Roster = window.L5RRoster;
  const Site = () => window.VttSite;
  const RINGS = ['Air', 'Earth', 'Fire', 'Water', 'Void'];

  // ── the corpus's questions ──
  const game = () => D.all(['core']).find((e) => e.name === 'Game of Twenty Questions' && e.file.endsWith('core-chargen.ttrpg'));
  const summaryEntity = () => D.all(['core']).find((e) => e.name === 'Twenty Questions' && e.file.endsWith('core-character.ttrpg'));
  function questions() {
    const g = game();
    if (!g) return [];
    return D.all(['core']).filter((e) => D.ancestors(e.id).some((a) => a.id === g.id) && D.prop(e, 'Question')).map((e) => ({
      n: D.val(e, 'Question'), text: D.val(e, 'Question Text'), id: e.id, part: (D.entity(e.parent) || {}).name,
      rules: (e.rules || []).map((r) => r.text),
    })).sort((a, b) => a.n - b.n);
  }
  function summaryRow(n) {
    const s = summaryEntity();
    let out = null;
    const walk = (list) => (list || []).forEach((b) => {
      if (b && b.num === n && b.args[0]) out = b.args[0].s;
      if (b && b.body) walk(b.body);
      if (b && b.ent) walk((D.entity(b.ent) || {}).blocks);
    });
    if (s) walk(s.blocks);
    return out;
  }
  function walkthrough(n) {
    const s = summaryEntity();
    const key = 'q' + (n < 10 ? '0' : '') + n + '-';
    return (s ? D.guidanceFor(s.id) : []).find((g) => g.name && g.name.indexOf(key) === 0) || null;
  }
  const has = (q, id) => q.rules.some((r) => r === id);
  // "ring_maximum_during_creation_is_three" → 3
  const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  function limit(kind) {
    const sv = D.all(['core']).find((e) => e.name === 'Starting Values');
    const r = ((sv && sv.rules) || []).map((x) => new RegExp('^' + kind + '_maximum_during_creation_is_(\\w+)$').exec(x.text)).find(Boolean);
    return r ? WORDS[r[1]] || null : null;
  }
  const startValue = (name) => { const sv = D.all(['core']).find((e) => e.name === 'Starting Values'); return sv ? D.val(sv, name) : null; };

  // ── the options the corpus offers ──
  const clans = () => D.all().filter((e) => e.type === 'Clan').sort((a, b) => (a.book === 'core' ? 0 : 1) - (b.book === 'core' ? 0 : 1) || a.name.localeCompare(b.name));
  const clanName = (c) => D.text(c, 'Clan Name') || c.name.replace(/ (Minor )?Clan$/, '');
  function familiesOf(c) {
    const names = [];
    D.blocks(c, 'FAMILIES').forEach((b) => (b.body || []).forEach((x) => x.name && names.push(x.name)));
    const fams = D.all().filter((e) => e.type === 'Family');
    return names.map((n) => fams.find((f) => f.name === n)).filter(Boolean);
  }
  const schools = () => D.all().filter((e) => e.type === 'School');
  const byType = (t) => D.all().filter((e) => e.type === t).sort((a, b) => a.name.localeCompare(b.name));
  function tenets() {
    const b = D.all(['core']).find((e) => e.name === 'Bushido' && e.file.endsWith('core-character.ttrpg'));
    const t = b && D.block(b, 'TENETS');
    return t ? (t.body || []).filter((p) => p.name).map((p) => ({ name: p.name, text: p.value })) : [];
  }
  const skillNames = () => Sheet.skills().map((s) => s.name);
  // "+5 glory" in a question's summary row; "+10 honor" and the list of skills in its walkthrough
  function amount(text, what) {
    const m = new RegExp('\\+(\\d+) ' + what, 'i').exec(text || '');
    return m ? parseInt(m[1], 10) : null;
  }
  function listedSkills(text) {
    const m = /following skills[^:]*:\s*([^.]+)\./.exec(text || '');
    if (!m) return null;
    return m[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map((s) => s.trim()).filter((s) => skillNames().indexOf(s) !== -1);
  }
  function heritage() {
    const h = D.all(['core']).find((e) => e.name === 'Samurai Heritage Table');
    const t = h && D.block(h, 'HERITAGE_TABLE');
    return t ? (t.body || []).filter((r) => r.def).map((r) => {
      const body = r.body || [];
      const mods = {};
      ((body.find((b) => b.kw === 'MODIFIERS') || {}).body || []).forEach((p) => (mods[p.name] = parseInt(String(p.value), 10)));
      const eff = ((body.find((b) => b.kw === 'EFFECT') || {}).body || []).map((x) => x.s).filter(Boolean);
      const st = body.find((b) => b.kw === 'SUB_TABLE');
      // a SUB_TABLE row is two strings in turn, `"1-3" "A weapon"`: its range, then its result
      const strs = st ? (st.body || []).filter((x) => 's' in x).map((x) => x.s) : [];
      const sub = [];
      for (let i = 0; i + 1 < strs.length; i += 2) sub.push({ range: strs[i], text: strs[i + 1] });
      return { num: r.num, name: r.args[0] ? r.args[0].c : '', mods, effect: eff, die: st && st.args[0] ? st.args[0].s : null, sub };
    }) : [];
  }
  const inRange = (range, n) => { const m = /^(\d+)(?:-(\d+))?$/.exec(range); return m && n >= +m[1] && n <= +(m[2] || m[1]); };

  // ── a DEF-valued property's ring or skill changes: fixed fields and CHOOSE picks ──
  function grants(p, picks) {
    const f = D.defFields(p);
    const out = {};
    Object.keys(f.fields).forEach((k) => (out[k] = (out[k] || 0) + (typeof f.fields[k] === 'number' ? f.fields[k] : 1)));
    f.choose.forEach((ch, i) => ((picks || [])[i] || []).slice(0, ch.choose).forEach((k) => (out[k] = (out[k] || 0) + (ch.value || 1))));
    return out;
  }
  // a school's STARTING_TECHNIQUES: `KATA ^"X"` fixed; `KATA` then `CHOOSE 1 [ … ]` a pick
  function startingTechniques(s) {
    const b = D.block(s, 'STARTING_TECHNIQUES');
    const out = [];
    const body = (b && b.body) || [];
    for (let i = 0; i < body.length; i++) {
      const x = body[i];
      if (x.kw === 'CHOOSE') continue;
      const named = (x.args || []).filter((a) => 'c' in a).map((a) => a.c);
      if (named.length) named.forEach((n) => out.push({ kind: x.kw, fixed: n }));
      else if (body[i + 1] && body[i + 1].kw === 'CHOOSE') {
        const ch = body[i + 1];
        out.push({ kind: x.kw, choose: ((ch.args.find((a) => 'i' in a) || {}).i) || 1, of: ((ch.args.find((a) => 'l' in a) || {}).l || []).map((a) => a.c || a.s) });
      }
    }
    return out;
  }

  // ── the sheet, recomputed from the answers ──
  function compute(c) {
    const v = Sheet.blank();
    const warn = [];
    RINGS.forEach((r) => (v.Rings[r] = startValue('All Rings') != null ? startValue('All Rings') : 1));
    v.Skills = {};
    const addRings = (g) => Object.keys(g).forEach((k) => { if (k in v.Rings) v.Rings[k] += g[k]; });
    const addSkills = (g) => Object.keys(g).forEach((k) => (v.Skills[k] = (v.Skills[k] || 0) + g[k]));
    const q = c.q || {};
    const clan = q[1] && D.entity(q[1].clan);
    if (clan) {
      v.Clan = clanName(clan);
      addRings(grants(D.prop(clan, 'Clan Ring Bonus')));
      addSkills(grants(D.prop(clan, 'Clan Skill Bonus')));
      if (D.val(clan, 'Clan Status') != null) v.Status = D.val(clan, 'Clan Status');
    }
    const fam = q[2] && D.entity(q[2].family);
    if (fam) {
      v.Family = D.text(fam, 'Family Name') || fam.name;
      addRings(grants(D.prop(fam, 'Ring Increase'), [[q[2].ring].filter(Boolean)]));
      addSkills(grants(D.prop(fam, 'Skill Increases')));
      if (D.val(fam, 'Glory') != null) v.Glory = D.val(fam, 'Glory');
      const w = D.defFields(D.prop(fam, 'Wealth')).fields;
      if (w.Count != null) v.Wealth = w.Count + ' ' + (w.Type || '');
    }
    const sch = q[3] && D.entity(q[3].school);
    if (sch) {
      v.School = D.text(sch, 'School Name') || sch.name;
      v['School Rank'] = 1;
      v.Roles = [].concat(D.val(sch, 'Roles') || []);
      addRings(grants(D.prop(sch, 'Ring Increase'), q[3].rings || []));
      addSkills(grants(D.prop(sch, 'Starting Skills'), [q[3].skills || []]));
      if (D.val(sch, 'Starting Honor') != null) v.Honor = D.val(sch, 'Starting Honor');
      v.Techniques = startingTechniques(sch).map((t, i) => t.fixed || ((q[3].techniques || {})[i]) || null).filter(Boolean);
      const out = D.val(sch, 'STARTING_OUTFIT');
      const ob = D.block(sch, 'STARTING_OUTFIT');
      v.Equipment = ob && ob.args[0] && ob.args[0].l ? ob.args[0].l.map((a) => a.s) : [].concat(out || []);
      const ab = D.block(sch, 'SCHOOL_ABILITY');
      if (ab) v['School Ability'] = D.arg(ab.args[0]);
    }
    if (q[4] && q[4].ring) v.Rings[q[4].ring] += 1;
    if (q[5]) v.Giri = q[5].text || '';
    if (q[6]) v['Ninjō'] = q[6].text || '';
    if (q[7] && q[7].opt === 'glory') v.Glory = (v.Glory || 0) + (amount(summaryRow(7), 'glory') || 0);
    if (q[7] && q[7].opt === 'skill' && q[7].skill) addSkills({ [q[7].skill]: 1 });
    if (q[8]) {
      v.Bushido = { 'Paramount Tenet': q[8].paramount || '', 'Less Significant Tenet': q[8].less || '' };
      const wt = (walkthrough(8) || {}).text;
      if (q[8].opt === 'honor') v.Honor = (v.Honor || 0) + (amount(wt, 'honor') || 0);
      if (q[8].opt === 'skill' && q[8].skill) addSkills({ [q[8].skill]: 1 });
    }
    const adv = [];
    const dis = [];
    [[9, adv], [10, dis], [11, adv], [12, dis]].forEach(([n, list]) => { const e = q[n] && D.entity(q[n].pick); if (e) list.push(e.name); });
    if (q[13] && q[13].pick) {
      const e = D.entity(q[13].pick);
      if (e) (q[13].opt === 'dis' ? dis : adv).push(e.name);
      if (q[13].opt === 'dis' && q[13].skill) addSkills({ [q[13].skill]: 1 });
    }
    v.Advantages = adv;
    v.Disadvantages = dis;
    if (q[14] && q[14].item) v.Equipment = (v.Equipment || []).concat([q[14].item]);
    if (q[16] && q[16].item) v.Equipment = (v.Equipment || []).concat([q[16].item]);
    if (q[17] && q[17].skill) addSkills({ [q[17].skill]: 1 });
    if (q[18] && q[18].pick != null) {
      const row = heritage().find((r) => r.num === q[18].pick);
      if (row) {
        ['Honor', 'Glory', 'Status'].forEach((k) => { if (row.mods[k]) v[k] = (v[k] || 0) + row.mods[k]; });
        const sub = row.sub.find((s) => q[18].sub != null && inRange(s.range, q[18].sub));
        v.Heritage = row.name + (sub ? ' — ' + sub.text.replace(/\^"([^"]+)"/g, '$1') : '');
        const sk = sub && /^Gain \+1 \^"([^"]+)"$/.exec(sub.text);
        if (sk) addSkills({ [sk[1]]: 1 });
      }
    }
    if (q[19] && q[19].name) v.Name = [v.Family, q[19].name].filter(Boolean).join(' ');
    // the narrative answers travel as fields named by their questions
    questions().forEach((qq) => { if (q[qq.n] && q[qq.n].note) v[qq.text] = q[qq.n].note; });
    // the creation limits
    const rl = limit('ring');
    const sl = limit('skill');
    if (rl) RINGS.forEach((r) => { if (v.Rings[r] > rl) warn.push(r + ' is ' + v.Rings[r] + ' — above ' + rl + ' during creation'); });
    if (sl) Object.keys(v.Skills).forEach((k) => { if (v.Skills[k] > sl) warn.push(k + ' is ' + v.Skills[k] + ' — above ' + sl + ' during creation'); });
    return { v, warn };
  }

  // ── the draft ──
  function draft() {
    const cur = Roster.current();
    if (cur && cur.character && cur.character._cc) return cur;
    const id = Roster.add(Object.assign(Sheet.blank(), { _cc: { q: {} } }));
    return Roster.get(id);
  }
  function answer(d, n, patch) {
    const c = d.character._cc || { q: {} };
    c.q[n] = Object.assign({}, c.q[n] || {}, patch);
    const out = compute(c).v;
    out._cc = c;
    d.character = out;
    Roster.save(d.id, out);
  }

  // ── the controls ──
  const pickList = (items, isOn, onPick, sub) => el('div', { class: 'pickgrid' }, items.map((e) => el('button', { class: 'pick' + (isOn(e) ? ' on' : ''), type: 'button', onclick: () => onPick(e) }, [e.name, sub ? el('span', { class: 'muted' }, [sub(e)]) : null])));
  const ringPick = (cur, onPick, only) => el('div', { class: 'ring-pick' }, (only || RINGS).map((r) => el('button', { class: 'ring-btn' + (cur === r ? ' on' : ''), type: 'button', onclick: () => onPick(r) }, [Dice.ringIcon(r), el('span', {}, [r])])));
  const skillSelect = (cur, onPick, only, v) => {
    const sel = el('select', { class: 'scope' }, [el('option', { value: '' }, ['— a skill —'])].concat((only || skillNames()).map((s) => el('option', { value: s, selected: s === cur || null }, [s + (v && v.Skills[s] ? ' (' + v.Skills[s] + ')' : '')]))));
    sel.addEventListener('change', () => onPick(sel.value));
    return sel;
  };
  const note = (d, n, placeholder) => el('textarea', { class: 'text', rows: 3, placeholder, oninput: debounce((ev) => answer(d, n, { note: ev.target.value }), 300) }, [((d.character._cc.q[n] || {}).note) || '']);
  const text = (d, n, key, placeholder) => el('input', { class: 'text wide', type: 'text', placeholder, value: ((d.character._cc.q[n] || {})[key]) || '', oninput: debounce((ev) => answer(d, n, { [key]: ev.target.value }), 300) });

  function controls(q, d, redraw) {
    const a = d.character._cc.q[q.n] || {};
    const v = d.character;
    const set = (patch) => { answer(d, q.n, patch); redraw(); };
    const box = el('div', { class: 'creator-step' });
    const effects = [];
    if (has(q, 'q1_sets_clan')) {
      box.appendChild(pickList(clans(), (e) => e.id === a.clan, (e) => set({ clan: e.id }), (e) => D.label(e.book)));
      const c = a.clan && D.entity(a.clan);
      if (c) effects.push('Clan ' + clanName(c) + ': rings ' + JSON.stringify(grants(D.prop(c, 'Clan Ring Bonus'))).replace(/[{}"]/g, '') + ' · skills ' + JSON.stringify(grants(D.prop(c, 'Clan Skill Bonus'))).replace(/[{}"]/g, '') + ' · Status ' + D.val(c, 'Clan Status'));
    }
    if (has(q, 'q2_sets_family')) {
      const clan = v._cc.q[1] && D.entity(v._cc.q[1].clan);
      const fams = clan ? familiesOf(clan) : [];
      if (!clan) box.appendChild(el('div', { class: 'muted' }, ['Answer question 1 first: the family is of your clan.']));
      box.appendChild(pickList(fams, (e) => e.id === a.family, (e) => set({ family: e.id, ring: null })));
      const f = a.family && D.entity(a.family);
      if (f) {
        const ch = D.defFields(D.prop(f, 'Ring Increase')).choose[0];
        if (ch) box.appendChild(el('div', {}, [el('div', { class: 'prop-k' }, ['Ring Increase — choose ' + ch.choose]), ringPick(a.ring, (r) => set({ ring: r }), ch.of)]));
        effects.push('Family ' + (D.text(f, 'Family Name') || f.name) + ': skills ' + JSON.stringify(grants(D.prop(f, 'Skill Increases'))).replace(/[{}"]/g, '') + ' · Glory ' + D.val(f, 'Glory') + (v.Wealth ? ' · ' + v.Wealth : ''));
      }
    }
    if (has(q, 'q3_sets_school')) {
      const clan = v.Clan;
      const all = schools();
      const mine = all.filter((s) => D.text(s, 'Clan') === clan);
      const other = all.filter((s) => D.text(s, 'Clan') !== clan);
      box.appendChild(el('div', { class: 'prop-k' }, [clan ? clan + ' schools' : 'Schools']));
      box.appendChild(pickList(mine, (e) => e.id === a.school, (e) => set({ school: e.id, rings: [], skills: [], techniques: {} }), (e) => [].concat(D.val(e, 'Roles') || []).join(', ')));
      box.appendChild(el('details', {}, [el('summary', { class: 'muted small' }, ['another clan’s school, or none’s (q3_other_clan_school_requires_gm_approval)']),
        pickList(other, (e) => e.id === a.school, (e) => set({ school: e.id, rings: [], skills: [], techniques: {} }), (e) => [D.text(e, 'Clan'), D.label(e.book)].filter(Boolean).join(' · '))]));
      const s = a.school && D.entity(a.school);
      if (s) {
        D.defFields(D.prop(s, 'Ring Increase')).choose.forEach((ch, i) => box.appendChild(el('div', {}, [el('div', { class: 'prop-k' }, ['Ring Increase — choose ' + ch.choose]), ringPick(((a.rings || [])[i] || [])[0], (r) => { const rs = (a.rings || []).slice(); rs[i] = [r]; set({ rings: rs }); }, ch.of)])));
        const sk = D.defFields(D.prop(s, 'Starting Skills')).choose[0];
        if (sk) {
          const chosen = a.skills || [];
          box.appendChild(el('div', {}, [el('div', { class: 'prop-k' }, ['Starting Skills — choose ' + sk.choose + ' (' + chosen.length + ' chosen)']),
            el('div', { class: 'chiprow tight' }, sk.of.map((n) => el('label', { class: 'pick' + (chosen.indexOf(n) !== -1 ? ' on' : '') }, [el('input', { type: 'checkbox', checked: chosen.indexOf(n) !== -1 || null, onchange: (ev) => {
              const next = ev.target.checked ? chosen.concat([n]).slice(-sk.choose) : chosen.filter((x) => x !== n);
              set({ skills: next });
            } }), ' ' + n])))]));
        }
        startingTechniques(s).forEach((t, i) => {
          if (t.fixed) return;
          const sel = el('select', { class: 'scope' }, [el('option', { value: '' }, ['— choose ' + t.choose + ' —'])].concat(t.of.map((n) => el('option', { value: n, selected: (a.techniques || {})[i] === n || null }, [n]))));
          sel.addEventListener('change', () => set({ techniques: Object.assign({}, a.techniques || {}, { [i]: sel.value }) }));
          box.appendChild(el('div', {}, [el('div', { class: 'prop-k' }, ['Starting technique (' + t.kind.toLowerCase() + ')']), sel]));
        });
        effects.push('School ' + v.School + ': Honor ' + v.Honor + ' · techniques ' + (v.Techniques || []).join(', ') + ' · outfit ' + (v.Equipment || []).length + ' items');
      }
    }
    if (has(q, 'q4_choose_any_ring_plus_one')) box.appendChild(ringPick(a.ring, (r) => set({ ring: r })));
    if (has(q, 'q5_sets_giri')) box.appendChild(text(d, 5, 'text', 'Your lord, and your duty to them (your giri)'));
    if (has(q, 'q6_sets_ninjo')) box.appendChild(text(d, 6, 'text', 'What you long for (your ninjō)'));
    if (has(q, 'q7_choose_glory_or_skill')) {
      const g = amount(summaryRow(7), 'glory');
      box.appendChild(el('div', { class: 'chiprow' }, [
        el('button', { class: 'pick' + (a.opt === 'glory' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'glory' }) }, ['+' + g + ' glory']),
        el('button', { class: 'pick' + (a.opt === 'skill' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'skill' }) }, ['+1 rank in a skill at rank 0']),
        a.opt === 'skill' ? skillSelect(a.skill, (s) => set({ skill: s }), skillNames().filter((s) => !(v.Skills[s]) || s === a.skill), v) : null,
      ]));
    }
    if (has(q, 'q8_sets_paramount_tenet')) {
      const ts = tenets();
      const tsel = (key, label) => { const sel = el('select', { class: 'scope' }, [el('option', { value: '' }, ['— ' + label + ' —'])].concat(ts.map((t) => el('option', { value: t.name, selected: a[key] === t.name || null, title: t.text }, [t.name])))); sel.addEventListener('change', () => set({ [key]: sel.value })); return sel; };
      box.appendChild(el('div', { class: 'chiprow' }, [tsel('paramount', 'paramount tenet'), tsel('less', 'less significant tenet')]));
      const wt = (walkthrough(8) || {}).text;
      const hon = amount(wt, 'honor');
      const listed = listedSkills(wt);
      box.appendChild(el('div', { class: 'chiprow' }, [
        el('button', { class: 'pick' + (a.opt === 'honor' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'honor' }) }, ['+' + hon + ' honor']),
        el('button', { class: 'pick' + (a.opt === 'skill' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'skill' }) }, ['1 rank in one of ' + (listed || []).join(', ')]),
        a.opt === 'skill' ? skillSelect(a.skill, (s) => set({ skill: s }), listed, v) : null,
      ]));
    }
    const typed = { q9_grants_one_distinction: 'Distinction', q10_grants_one_adversity: 'Adversity', q11_grants_one_passion: 'Passion', q12_grants_one_anxiety: 'Anxiety' };
    Object.keys(typed).forEach((rid) => {
      if (!has(q, rid)) return;
      const filt = el('input', { type: 'search', class: 'search', placeholder: 'Find a ' + typed[rid].toLowerCase() + '…' });
      const grid = el('div');
      const drawGrid = () => { grid.innerHTML = ''; const t = filt.value.trim().toLowerCase(); grid.appendChild(pickList(byType(typed[rid]).filter((e) => !t || e.name.toLowerCase().indexOf(t) !== -1), (e) => e.id === a.pick, (e) => set({ pick: e.id }), (e) => D.label(e.book))); };
      filt.addEventListener('input', debounce(drawGrid, 150));
      box.appendChild(filt);
      box.appendChild(grid);
      drawGrid();
      const e = a.pick && D.entity(a.pick);
      if (e) box.appendChild(el('div', { class: 'paper' }, [E.render(e)]));
    });
    if (has(q, 'q13_advantage_or_disadvantage_plus_skill')) {
      box.appendChild(el('div', { class: 'chiprow' }, [
        el('button', { class: 'pick' + (a.opt === 'adv' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'adv', pick: null }) }, ['An advantage']),
        el('button', { class: 'pick' + (a.opt === 'dis' ? ' on' : ''), type: 'button', onclick: () => set({ opt: 'dis', pick: null }) }, ['A disadvantage, and 1 rank in a skill']),
      ]));
      if (a.opt) {
        const list = a.opt === 'adv' ? byType('Distinction').concat(byType('Passion')) : byType('Adversity').concat(byType('Anxiety'));
        const sel = el('select', { class: 'scope' }, [el('option', { value: '' }, ['— choose —'])].concat(list.map((e) => el('option', { value: e.id, selected: e.id === a.pick || null }, [e.name + ' · ' + e.type]))));
        sel.addEventListener('change', () => set({ pick: sel.value }));
        box.appendChild(el('div', { class: 'chiprow' }, [sel, a.opt === 'dis' ? skillSelect(a.skill, (s) => set({ skill: s }), null, v) : null]));
      }
    }
    if (has(q, 'q14_grants_aesthetic_item')) box.appendChild(text(d, 14, 'item', 'Your aesthetic accoutrement (it joins your equipment)'));
    if (has(q, 'q16_grants_item_rarity_seven_or_lower')) box.appendChild(text(d, 16, 'item', 'One item of rarity 7 or lower (it joins your equipment)'));
    if (has(q, 'q17_grants_skill_at_rank_zero')) box.appendChild(skillSelect(a.skill, (s) => set({ skill: s }), skillNames().filter((s) => !(v.Skills[s]) || s === a.skill), v));
    if (has(q, 'q18_roll_heritage_twice_choose_one')) {
      const rows = heritage();
      box.appendChild(el('div', { class: 'chiprow' }, [button('Roll 1d10 twice', () => set({ rolls: [1 + Math.floor(Math.random() * 10), 1 + Math.floor(Math.random() * 10)], pick: null, sub: null })), a.rolls ? el('span', { class: 'muted' }, ['→ ' + a.rolls.join(' and ')]) : null]));
      (a.rolls || []).forEach((n) => {
        const r = rows.find((x) => x.num === n);
        if (!r) return;
        box.appendChild(el('div', { class: 'pick' + (a.pick === n ? ' on' : ''), role: 'button', onclick: () => set({ pick: n, sub: null }) }, [
          el('b', {}, [n + '. ' + r.name]), el('span', { class: 'muted' }, [' ' + Object.keys(r.mods).map((k) => k + ' ' + (r.mods[k] > 0 ? '+' : '') + r.mods[k]).join(', ')]),
          r.effect.map((t) => E.prose(t, 'prose', 'core')),
        ]));
      });
      const chosen = a.pick != null && rows.find((x) => x.num === a.pick);
      if (chosen && chosen.sub.length) box.appendChild(el('div', { class: 'chiprow' }, [button('Roll ' + (chosen.die || '1d10') + ' on its table', () => set({ sub: 1 + Math.floor(Math.random() * 10) })),
        a.sub != null ? el('span', {}, ['→ ' + a.sub + ': ', E.span((chosen.sub.find((s) => inRange(s.range, a.sub)) || {}).text || '', 'core')]) : null]));
    }
    if (has(q, 'q19_narrative_only') && /Name/.test(q.text)) box.appendChild(text(d, 19, 'name', 'Your personal name — it follows your family name'));
    // every question may carry the player's own answer, in words
    box.appendChild(el('div', { class: 'prop-k' }, ['Your answer, in your words']));
    box.appendChild(note(d, q.n, 'Written on the sheet under this question'));
    if (effects.length) box.appendChild(el('div', { class: 'effects' }, effects.map((t) => el('div', {}, [t]))));
    return box;
  }

  // ── the page ──
  function render(container, path, ctx) {
    const page = el('div', { class: 'page' });
    container.appendChild(page);
    const note0 = el('div', { class: 'muted loading' }, ['Opening the books the questions draw on…']);
    page.appendChild(note0);
    // every book: clans, families, schools and advantages come from all of them
    D.ensureAll().then(() => { note0.remove(); draw(page, path, ctx); });
  }
  function draw(page, path, ctx) {
    const d = draft();
    const Q = questions();
    const ids = Q.map((q) => 'q' + q.n).concat(['sheet']);
    const stepId = ids.indexOf(path[0]) !== -1 ? path[0] : ids[0];
    const redraw = () => { page.innerHTML = ''; draw(page, path, ctx); };
    const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      f.text().then((t) => { Roster.add(Sheet.readFile(JSON.parse(t))); Site().go('create', ['sheet']); }).catch((e) => alert(e.message)).finally(() => (file.value = ''));
    });
    const v = d.character;
    const computed = v._cc ? compute(v._cc) : { v, warn: [] };
    page.appendChild(el('div', { class: 'creator-head' }, [
      el('div', {}, [el('h1', {}, ['Making a character']), el('div', { class: 'muted small' }, ['The Game of Twenty Questions, one at a time; the sheet is the corpus’s own ', el('code', {}, ['Samurai']), ' type.'])]),
      el('div', { class: 'chiprow tight' }, [
        el('select', { class: 'scope', onchange: (ev) => { Roster.open(ev.target.value); redraw(); } }, Roster.list().map((r) => el('option', { value: r.id, selected: r.id === d.id || null }, [(r.character.Name || 'unnamed') + (r.character.School ? ' · ' + r.character.School : '')]))),
        button('New', () => { Roster.add(Object.assign(Sheet.blank(), { _cc: { q: {} } })); Site().go('create', ['q1']); }, 'ghost tiny'),
        button('Duplicate', () => { Roster.duplicate(d.id); redraw(); }, 'ghost tiny'),
        button('Remove', () => { if (confirm('Remove ' + (v.Name || 'this character') + ' from this browser?')) { Roster.remove(d.id); redraw(); } }, 'ghost tiny'),
        button('Load a file…', () => file.click(), 'ghost tiny'), file,
        button('Download the file', () => Sheet.download(v), 'tiny'),
      ]),
    ]));
    let part = null;
    const nav = el('ol', { class: 'creator-steps' });
    Q.forEach((q) => {
      if (q.part !== part) { part = q.part; nav.appendChild(el('li', { class: 'toc-phase' }, [part])); }
      const done = !!(v._cc && v._cc.q[q.n]);
      nav.appendChild(el('li', { class: (stepId === 'q' + q.n ? 'current' : '') + (done ? ' done' : '') }, [el('a', { href: ctx.href('create', ['q' + q.n]) }, [el('span', { class: 'step-s' }, [q.n + '. ' + q.text])])]));
    });
    nav.appendChild(el('li', { class: stepId === 'sheet' ? 'current' : '' }, [el('a', { href: ctx.href('create', ['sheet']) }, [el('span', { class: 'step-s' }, ['The sheet'])])]));
    const main = el('div', { class: 'creator-main' });
    const book = el('details', { class: 'creator-book', open: true }, [el('summary', {}, ['What the book says'])]);
    if (stepId === 'sheet') {
      main.appendChild(el('h2', {}, [v.Name || 'An unnamed samurai']));
      main.appendChild(el('div', { class: 'muted' }, [Sheet.sentence(v)]));
      if (computed.warn.length) main.appendChild(el('div', { class: 'correction' }, [el('div', { class: 'guidance-k' }, ['Above the creation limits']), computed.warn.map((w) => el('div', {}, [w]))]));
      main.appendChild(Sheet.render(v, null));
      main.appendChild(el('div', { class: 'chiprow' }, [button('Download the character file', () => Sheet.download(v)), el('span', { class: 'muted small' }, ['the GM imports it at the table; you can load it on the player’s page'])]));
      const sv = D.all(['core']).find((e) => e.name === 'Starting Values');
      if (sv) book.appendChild(E.render(sv));
    } else {
      const q = Q.find((x) => 'q' + x.n === stepId);
      main.appendChild(el('div', { class: 'muted small' }, [q.part]));
      main.appendChild(el('h2', {}, [q.n + '. ' + q.text]));
      const sr = summaryRow(q.n);
      if (sr) main.appendChild(E.prose(sr, 'prose summary', 'core'));
      main.appendChild(controls(q, d, redraw));
      main.appendChild(el('div', { class: 'muted small mono' }, ['the corpus’s rule ids: ' + q.rules.join(' · ')]));
      const wt = walkthrough(q.n);
      if (wt) book.appendChild(E.prose(wt.text, 'prose', 'core'));
      const a = (v._cc && v._cc.q[q.n]) || {};
      const shown = (q.n === 1 && a.clan) || (q.n === 2 && a.family) || (q.n === 3 && a.school);
      if (shown && D.entity(shown)) book.appendChild(E.render(D.entity(shown)));
    }
    const i = ids.indexOf(stepId);
    main.appendChild(el('div', { class: 'creator-nav chiprow' }, [
      i > 0 ? el('a', { class: 'btn ghost', href: ctx.href('create', [ids[i - 1]]) }, ['← back']) : null,
      i < ids.length - 1 ? el('a', { class: 'btn', href: ctx.href('create', [ids[i + 1]]) }, ['next →']) : null,
    ]));
    page.appendChild(el('div', { class: 'creator-body' }, [nav, main, book]));
  }

  return { render, questions, compute, heritage, summaryRow, walkthrough, startingTechniques, limit };
})();
