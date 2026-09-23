// system/l5r5e/table.js — what Legend of the Five Rings tells the table (engine/vtt.js) and the
// player's page (engine/play.js): which scenes are in play, what can stand on the table, what a
// token's state reads as, and how a character file becomes a party member. The engine never
// asks the corpus directly.
//
// The module in play is one of the corpus's sixteen .arc adventures, picked in the Adventure
// panel (campaign.modules[0]); its scenes are read by L5RData.module. Its book loads on demand:
// when the adventure's book is not yet in memory this loads it and asks the page to redraw.
// The cast of a scene is the GM's own (system op `setSceneCast`), beside the NPCs the arc names.
// One map ships: the map of Rokugan from the owner's art, offered as an image.
window.VttSystem = (function () {
  const D = window.L5RData;
  const State = window.VttState;
  const Bus = window.VttBus;
  const S = () => State.state;
  const Sheet = () => window.L5RSheet;

  const moduleId = () => ((S().campaign || {}).modules || [])[0] || null;
  let asked = {};
  function module() {
    const mid = moduleId();
    if (!mid) return null;
    const m = D.module(mid);
    if (m) return m;
    const ref = D.moduleList().find((x) => x.id === mid);
    if (ref && !asked[ref.book]) {
      asked[ref.book] = true;
      D.ensure(['core', ref.book]).then(() => Bus.emit('state:remote', { loaded: true }, { local: true }));
    }
    return null;
  }

  // the GM's arrangement wins where there is one (order.scenes, the engine's op); else the arc's
  function scenes() {
    const m = module();
    if (!m) return [];
    return m.scenes.map((s) => ({ id: s.id, name: s.name, phase: s.part ? s.part.name : null, moduleId: m.id }));
  }
  const scene = (id) => {
    const m = module();
    return m ? m.scenes.find((s) => s.id === id) || null : null;
  };
  function currentSceneId() {
    const mid = moduleId();
    const cur = mid ? (S().current || {})[mid] : null;
    const all = scenes();
    return (all.find((s) => s.id === cur) || all[0] || {}).id || null;
  }

  // who is in a scene: the GM's own list (entity or record ids — a record's book loads when opened)
  const castIds = (sceneId) => ((S().cast || {})[sceneId] || []).slice();
  const byId = (id) => D.entity(id) || D.records().find((r) => r.id === id) || null;
  const cast = (sceneId) => castIds(sceneId).map(byId).filter(Boolean);

  // the arc's own named cast: KEY_NPCS / CAST lists and its locations' NPCS, as names resolved
  // to the NPCs the corpus prints (the adventure's book first)
  function namedCast() {
    const m = module();
    if (!m) return [];
    const names = [];
    const visit = (list) => (list || []).forEach((b) => {
      if (!b || typeof b !== 'object') return;
      if (b.kw && /NPCS|CAST|ANTAGONISTS|ALLIES|NEUTRAL|MEMBERS/.test(b.kw)) (b.args || []).forEach((a) => (a.l || [a]).forEach((x) => x.c && names.push(x.c)));
      if (b.body) visit(b.body);
      if (b.ent) {
        const e = D.entity(b.ent);
        if (e) visit(e.blocks);
      }
    });
    visit(m.blocks);
    const seen = new Set();
    const out = [];
    names.forEach((n) => {
      if (seen.has(n)) return;
      seen.add(n);
      const e = D.all([m.book]).find((x) => x.name === n && x.type === 'NPC') || D.records().find((r) => r.name === n && r.type === 'NPC');
      if (e) out.push(e);
    });
    return out;
  }

  const maps = () => [];
  const mapDef = () => null;
  const defaultMapId = (sceneId) => sceneId;
  const legend = () => null;
  const mapAssets = () => [{ label: 'Rokugan', image: 'assets/art/rokugan-map.webp' }];

  // ── tokens: the party, and the current scene's cast ────────────────
  function tokenSources() {
    const groups = [];
    const party = (S().party || []).map((m) => ({ id: 'tk-' + m.id, label: m.name, kind: 'party', owner: m.id, ref: m.id }));
    if (party.length) groups.push({ label: 'The party', items: party });
    const sid = currentSceneId();
    const sc = scene(sid);
    const here = sc ? cast(sid).map((e) => ({ label: e.name, kind: 'cast', ref: e.id })) : [];
    if (here.length) groups.push({ label: sc.name, items: here });
    const named = namedCast().filter((e) => !here.some((h) => h.ref === e.id)).map((e) => ({ label: e.name, kind: 'cast', ref: e.id }));
    if (named.length) groups.push({ label: 'The adventure’s cast', items: named });
    return groups;
  }

  const COLORS = { party: '#b62432', cast: '#2a2016', marker: '#9a7b3f' };
  const tokenColor = (t) => COLORS[t.kind] || COLORS.marker;
  // a token's word: a samurai's strife and fatigue; an NPC's conflict ranks
  function tokenStatus(t) {
    if (t.kind === 'party') {
      const m = (S().party || []).find((x) => x.id === t.owner);
      return m && Sheet() ? { text: Sheet().tokenText(m), pips: [] } : null;
    }
    const e = t.kind === 'cast' && t.ref ? byId(t.ref) : null;
    if (!e) return null;
    const f = e.fields || {};
    const cr = e.props ? D.num(e, 'Combat Conflict Rank') : f['Combat Conflict Rank'];
    const ir = e.props ? D.num(e, 'Intrigue Conflict Rank') : f['Intrigue Conflict Rank'];
    return { text: [cr != null ? 'Combat ' + cr : null, ir != null ? 'Intrigue ' + ir : null].filter(Boolean).join(' · '), pips: [] };
  }

  function selectToken(t) {
    if (t.kind === 'party') Bus.emit('select', { kind: 'party', id: t.owner });
    else if (t.kind === 'cast' && t.ref) Bus.emit('select', { kind: 'entity', id: t.ref });
  }
  const tokenMenu = () => null;

  // ── the character: the sheet derived from ACTOR "Samurai" (system/l5r5e/sheet.js) ──
  const readCharacter = (obj, fileName) => Sheet().readMember(obj, fileName);
  const downloadCharacter = (m) => Sheet().downloadMember(m);
  const liveSheet = (m, opts) => Sheet().live(m, opts);
  const memberSubtitle = (m) => Sheet().sentence(m.character || {});

  return {
    moduleId, module, scenes, scene, currentSceneId, cast, castIds, namedCast, byId, maps, mapDef, defaultMapId, legend, mapAssets,
    tokenSources, tokenColor, tokenStatus, selectToken, tokenMenu,
    liveSheet, readCharacter, downloadCharacter, memberSubtitle,
  };
})();
