// system/l5r5e/dice.js — Roll & Keep, read from the corpus.
//
// The dice are the corpus's: `^"Ring Die"` and `^"Skill Die"` print their FACES (6 and 12
// numbered rows, each face a run of symbols — "(op) (st)"), `^"Dice Symbols"` prints the four
// symbols and the RESOLUTION_ORDER, `^"Check"` prints the seven STEPS, `^"Target Number"` the
// DIFFICULTY_SCALE. Nothing about a face is typed here; the numbers the rules state only in
// prose are named constants below, each citing its sentence.
//
// A roll is a state the player acts on, as at the table: roll the pool (step 3), choose kept
// dice up to the limit (step 5), roll a bonus die for each kept (ex), then resolve (step 6).
// The art is the owner's (assets/art/dice), one face per symbol run: ring_ot is a Ring die
// showing (op) (st).
window.L5RDice = (function () {
  const D = window.L5RData;
  const { el, esc } = window.VttRender;

  // ── the prose-only numbers, each citing its sentence ──
  // "Choose Kept Dice: Select up to ring value dice to keep" — Check, STEPS 5
  const KEEP_LIMIT_IS_RING = true;
  // "a character may spend 1 Void point to roll one additional Ring die (ring) and subsequently
  //  keep one additional die during Step 5: Choose Kept Dice." — Void Points, USES: Seize the Moment
  const SEIZE_THE_MOMENT = { extraRingDice: 1, extraKept: 1, cost: 1 };
  // "Counts as (su) and allows rolling 1 additional die of same type. New die may be kept or
  //  dropped." — Dice Symbols, SYMBOL_DEFINITIONS: Explosive Success (ex)
  const EXPLOSION = { sameType: true, keptApart: true };
  // "gm_sets_target_number" / "default_tn_is_two" — Target Number, RULES
  const DEFAULT_TN = 2;

  const SYMBOLS = ['ex', 'su', 'op', 'st'];
  const TYPES = { ring: 'Ring Die', skill: 'Skill Die' };

  // ── the faces, read from the corpus ──
  let faceCache = null;
  function faces() {
    if (faceCache) return faceCache;
    const out = {};
    Object.keys(TYPES).forEach((t) => {
      const e = D.named(TYPES[t], 'core');
      const fb = e && D.block(e, 'FACES');
      out[t] = (fb ? fb.body || [] : []).filter((r) => 'num' in r).map((r) => {
        const txt = r.args[0] ? r.args[0].s : '';
        const sym = { ex: 0, su: 0, op: 0, st: 0 };
        (txt.match(/\((ex|su|op|st)\)/g) || []).forEach((m) => sym[m.slice(1, 3)]++);
        const code = SYMBOLS.filter((k) => sym[k]).map((k) => ({ ex: 'e', su: 's', op: 'o', st: 't' }[k])).join('');
        return { num: r.num, text: txt, sym, key: t + '_' + (code || 'blank') };
      });
    });
    if (out.ring.length && out.skill.length) faceCache = out;
    return out;
  }
  // the symbols the corpus names, and their definitions, verbatim
  function symbolDefs() {
    const e = D.named('Dice Symbols', 'core');
    const b = e && D.block(e, 'SYMBOL_DEFINITIONS');
    return b ? (b.body || []).filter((p) => p.name).map((p) => ({ name: p.name, text: p.value })) : [];
  }
  function resolutionOrder() {
    const e = D.named('Dice Symbols', 'core');
    const b = e && D.block(e, 'RESOLUTION_ORDER');
    return b && b.args[0] && b.args[0].l ? b.args[0].l.map((a) => a.s) : [];
  }
  function checkSteps() {
    const e = D.named('Check', 'core');
    const b = e && D.block(e, 'STEPS');
    return b ? (b.body || []).filter((r) => 'num' in r).map((r) => ({ n: r.num, text: r.args[0] ? r.args[0].s : '' })) : [];
  }
  function difficulty() {
    const e = D.named('Target Number', 'core');
    const b = e && D.block(e, 'DIFFICULTY_SCALE');
    return b ? (b.body || []).filter((r) => 'num' in r).map((r) => ({ tn: r.num, text: r.args[0] ? r.args[0].s : '' })) : [];
  }

  const rand = (n) => Math.floor(Math.random() * n);
  function rollDie(type, bonus) {
    const f = faces()[type];
    const face = f[rand(f.length)];
    return { id: Math.random().toString(36).slice(2, 9), type, face: face.num, key: face.key, sym: Object.assign({}, face.sym), text: face.text, kept: false, bonus: !!bonus, exploded: false };
  }

  // ── a roll ──
  // opts: { ring (name), ringValue, skill (name|null), skillRank, tn, void, label, who }
  function roll(opts) {
    const o = Object.assign({ ringValue: 1, skillRank: 0, tn: DEFAULT_TN, void: false }, opts || {});
    const ringDice = o.ringValue + (o.void ? SEIZE_THE_MOMENT.extraRingDice : 0);
    const dice = [];
    for (let i = 0; i < ringDice; i++) dice.push(rollDie('ring'));
    for (let i = 0; i < o.skillRank; i++) dice.push(rollDie('skill'));
    return { opts: o, dice, limit: keepLimit(o), resolved: null, at: new Date().toISOString() };
  }
  const keepLimit = (o) => (KEEP_LIMIT_IS_RING ? o.ringValue : 0) + (o.void ? SEIZE_THE_MOMENT.extraKept : 0);
  const keptBase = (r) => r.dice.filter((d) => d.kept && !d.bonus).length;
  function toggleKeep(r, id) {
    const d = r.dice.find((x) => x.id === id);
    if (!d || r.resolved) return false;
    if (d.kept) {
      if (d.exploded) return false;              // its bonus die is already rolled
      d.kept = false;
      return true;
    }
    if (!d.bonus && keptBase(r) >= r.limit) return false;
    d.kept = true;
    return true;
  }
  // a kept (ex) rolls one more die of its type, which may itself be kept or dropped
  function explode(r, id) {
    const d = r.dice.find((x) => x.id === id);
    if (!d || !d.kept || !d.sym.ex || d.exploded || r.resolved) return null;
    d.exploded = true;
    const nd = rollDie(d.type, true);
    nd.from = d.id;
    r.dice.splice(r.dice.indexOf(d) + 1 + r.dice.filter((x) => x.from === d.id).length, 0, nd);
    return nd;
  }
  // "Keep the best": the most successes, then opportunity, then least strife — a helper, the
  // choice is the player's
  function keepBest(r) {
    if (r.resolved) return;
    r.dice.forEach((d) => { if (!d.bonus && !d.exploded) d.kept = false; });
    const score = (d) => (d.sym.ex + d.sym.su) * 100 + d.sym.op * 10 - d.sym.st;
    r.dice.filter((d) => !d.bonus && !d.exploded).sort((a, b) => score(b) - score(a)).slice(0, Math.max(0, r.limit - keptBase(r))).forEach((d) => (d.kept = true));
  }
  // Step 6: the kept dice's symbols, in the corpus's order
  function tally(r) {
    const t = { ex: 0, su: 0, op: 0, st: 0 };
    r.dice.filter((d) => d.kept).forEach((d) => SYMBOLS.forEach((k) => (t[k] += d.sym[k])));
    const successes = t.su + t.ex;                // "(ex) Counts as (su)"
    const tn = r.opts.tn;
    return { symbols: t, successes, opportunity: t.op, strife: t.st, tn, success: tn == null ? null : successes >= tn, bonus: tn == null ? null : Math.max(0, successes - tn), unexploded: r.dice.filter((d) => d.kept && d.sym.ex && !d.exploded).length };
  }
  function resolve(r) {
    r.resolved = tally(r);
    return r.resolved;
  }

  // ── the look ──
  const artBase = () => (document.querySelector('base') ? '' : '') + 'assets/art/';
  function faceImg(d, cls) {
    return el('img', { class: 'face ' + (cls || ''), src: artBase() + 'dice/' + d.key + '.svg', alt: d.text || 'blank', title: (d.type === 'ring' ? 'Ring die: ' : 'Skill die: ') + (d.text || 'Blank') });
  }
  // (op) (su) (ex) (st) (ring) (skill), a lowercase ring (air)…(void), a technique mark (kata)
  const GLYPH = { op: '◈', su: '❁', ex: '❉', st: '▲' };
  const RINGS = ['air', 'earth', 'fire', 'water', 'void'];
  function symbolsHtml(escaped) {
    return escaped
      .replace(/\((op|su|ex|st)\)/g, (m, k) => '<span class="sym ' + k + '" title="' + m + '">' + GLYPH[k] + '</span>')
      .replace(/\((air|earth|fire|water|void)\)/g, (m, r) => '<img class="ring-ico" src="' + artBase() + 'rings/' + r + '.svg" alt="' + m + '" title="' + m + '">')
      .replace(/\((ring|skill)\)/g, (m, k) => '<span class="sym die-' + k + '" title="' + m + '">' + (k === 'ring' ? '⬢' : '⬟') + '</span>')
      .replace(/\((kata|kiho|kihō|shuji|shūji|invocation|ritual|maho|mahō|ninjutsu|mantra)\)/g, (m, k) => '<span class="sym tech" title="' + m + '">' + k + '</span>');
  }
  const ringIcon = (ring, cls) => el('img', { class: 'ring-ico ' + (cls || ''), src: artBase() + 'rings/' + String(ring).toLowerCase() + '.svg', alt: ring, title: ring });

  function summary(t) {
    const bits = [];
    bits.push(t.successes + (t.successes === 1 ? ' success' : ' successes'));
    if (t.opportunity) bits.push(t.opportunity + ' opportunity');
    if (t.strife) bits.push(t.strife + ' strife');
    let verdict = '';
    if (t.success === true) verdict = 'succeeds' + (t.bonus ? ' with ' + t.bonus + ' bonus success' + (t.bonus === 1 ? '' : 'es') : '');
    else if (t.success === false) verdict = 'fails by ' + (t.tn - t.successes);
    return { text: bits.join(' · '), verdict };
  }

  // A roller: the controls, the tray, the result. `opts.onResolve(roll)` logs it; `opts.preset`
  // fills ring / values / skill (a sheet's or an NPC's); `opts.fixed` hides the value inputs.
  function roller(opts) {
    const o = opts || {};
    const p = Object.assign({ ring: 'Air', ringValue: 2, skill: null, skillRank: 1, tn: DEFAULT_TN, void: false }, o.preset || {});
    let current = null;
    const box = el('div', { class: 'roller' });
    const tray = el('div', { class: 'tray' });
    const result = el('div', { class: 'roll-result' });
    const ringPick = el('div', { class: 'ring-pick' });
    const ringValue = el('input', { class: 'text num small', type: 'number', min: 1, max: 5, value: p.ringValue, title: 'Ring value' });
    const skillRank = el('input', { class: 'text num small', type: 'number', min: 0, max: 5, value: p.skillRank, title: 'Skill ranks' });
    const tn = el('select', { class: 'scope tiny', title: 'Target number' });
    tn.appendChild(el('option', { value: '' }, ['TN ?']));
    difficulty().forEach((d) => tn.appendChild(el('option', { value: d.tn, title: d.text, selected: d.tn === p.tn || null }, ['TN ' + d.tn])));
    const voidBox = el('input', { type: 'checkbox', checked: p.void || null });
    function drawRings() {
      ringPick.innerHTML = '';
      ['Air', 'Earth', 'Fire', 'Water', 'Void'].forEach((r) => {
        ringPick.appendChild(el('button', { class: 'ring-btn' + (p.ring === r ? ' on' : ''), type: 'button', title: r, onclick: () => {
          p.ring = r;
          if (o.ringsOf) ringValue.value = o.ringsOf(r);
          drawRings();
        } }, [ringIcon(r), el('span', {}, [r])]));
      });
    }
    function values() {
      return { ring: p.ring, ringValue: Math.max(1, parseInt(ringValue.value || '1', 10)), skill: p.skill, skillRank: Math.max(0, parseInt(skillRank.value || '0', 10)), tn: tn.value === '' ? null : parseInt(tn.value, 10), void: voidBox.checked, label: o.label || null };
    }
    function drawTray() {
      tray.innerHTML = '';
      result.innerHTML = '';
      if (!current) return;
      const r = current;
      ['ring', 'skill'].forEach((type) => {
        const group = r.dice.filter((d) => d.type === type);
        if (!group.length) return;
        tray.appendChild(el('div', { class: 'tray-row' }, [
          el('span', { class: 'tray-k' }, [type === 'ring' ? 'Ring dice' : 'Skill dice']),
          group.map((d) => {
            const node = el('button', { class: 'die ' + d.type + (d.kept ? ' kept' : '') + (d.bonus ? ' bonus' : ''), type: 'button', title: (d.text || 'Blank') + (d.bonus ? ' — the bonus die of an (ex)' : ''), onclick: () => { if (toggleKeep(r, d.id)) drawTray(); } }, [faceImg(d)]);
            if (d.kept && d.sym.ex && !d.exploded && !r.resolved) node.appendChild(el('span', { class: 'explode', title: 'Roll the bonus die this (ex) gives', onclick: (ev) => { ev.stopPropagation(); explode(r, d.id); drawTray(); } }, ['❉ +1']));
            return node;
          }),
        ]));
      });
      const t = tally(r);
      const s = summary(t);
      result.appendChild(el('div', { class: 'tally' }, [
        el('span', { class: 'muted small' }, ['kept ' + keptBase(r) + ' of ' + r.limit + (r.dice.some((d) => d.bonus) ? ' (+ bonus dice)' : '') + ' · ']),
        el('b', {}, [s.text]),
        s.verdict ? el('span', { class: 'verdict ' + (t.success ? 'ok' : 'fail') }, [' — ' + s.verdict]) : null,
        t.unexploded ? el('span', { class: 'muted small' }, [' · ' + t.unexploded + ' kept (ex) not yet rolled']) : null,
      ]));
      if (!r.resolved) {
        result.appendChild(el('div', { class: 'chiprow tight' }, [
          el('button', { class: 'btn ghost tiny', type: 'button', onclick: () => { keepBest(r); drawTray(); } }, ['Keep the best']),
          el('button', { class: 'btn tiny', type: 'button', onclick: () => { resolve(r); drawTray(); if (o.onResolve) o.onResolve(r); } }, ['Resolve']),
        ]));
      } else result.appendChild(el('div', { class: 'muted small' }, ['resolved' + (o.onResolve ? ' and logged' : '')]));
    }
    drawRings();
    const rollBtn = el('button', { class: 'btn', type: 'button', onclick: () => { current = roll(values()); drawTray(); } }, ['Roll']);
    box.appendChild(el('div', { class: 'roller-controls' }, [
      ringPick,
      el('label', { class: 'small', hidden: o.fixed || null }, ['Ring ', ringValue]),
      el('label', { class: 'small', hidden: o.fixed || null }, [(p.skill ? p.skill + ' ' : 'Skill ') , skillRank]),
      tn,
      el('label', { class: 'small', title: 'Seize the Moment: spend 1 Void point to roll one additional Ring die and keep one additional die' }, [voidBox, ' Void point']),
      rollBtn,
    ]));
    box.appendChild(tray);
    box.appendChild(result);
    box.set = (patch) => {
      Object.assign(p, patch || {});
      if (patch && patch.ringValue != null) ringValue.value = patch.ringValue;
      if (patch && patch.skillRank != null) skillRank.value = patch.skillRank;
      if (patch && patch.tn !== undefined) tn.value = patch.tn == null ? '' : patch.tn;
      drawRings();
      const lab = skillRank.parentNode;
      if (lab && lab.firstChild) lab.firstChild.textContent = (p.skill ? p.skill + ' ' : 'Skill ');
    };
    box.current = () => current;
    return box;
  }

  // one log line for a resolved roll
  function logLine(entry) {
    const t = entry.tally || {};
    const s = summary(t);
    return el('div', { class: 'roll-line' + (t.success === true ? ' ok' : t.success === false ? ' fail' : '') }, [
      el('span', { class: 'roll-who' }, [[entry.who, entry.what].filter(Boolean).join(' · ')]),
      el('span', { class: 'roll-dice' }, (entry.kept || []).map((k) => el('img', { class: 'logdie', src: artBase() + 'dice/' + k + '.svg', alt: k }))),
      el('span', { class: 'roll-sum' }, [s.text + (s.verdict ? ' — ' + s.verdict : '')]),
      entry.note ? el('span', { class: 'muted small' }, [entry.note]) : null,
    ]);
  }
  // what a resolved roll leaves in the log
  function logEntry(r, who) {
    const o = r.opts;
    return {
      at: new Date().toISOString(), kind: 'roll', mode: 'check', who: who || null,
      what: [o.skill, o.ring ? '(' + o.ring + ' ' + o.ringValue + ')' : null, o.tn != null ? 'TN ' + o.tn : null, o.void ? 'Void point' : null].filter(Boolean).join(' ') || (o.label || 'check'),
      kept: r.dice.filter((d) => d.kept).map((d) => d.key), tally: r.resolved || tally(r),
    };
  }

  return {
    DEFAULT_TN, SEIZE_THE_MOMENT, EXPLOSION, faces, symbolDefs, resolutionOrder, checkSteps, difficulty,
    roll, toggleKeep, explode, keepBest, tally, resolve, summary, keepLimit,
    roller, faceImg, ringIcon, symbolsHtml, logLine, logEntry, esc,
  };
})();
