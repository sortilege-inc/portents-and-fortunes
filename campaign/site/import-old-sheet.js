/* The player's live trackers, imported ONCE from the old sheet's own storage (campaign/PLAN.md decision 8;
   M5). The old page (campaign/play/, retired) kept Norikage's state in this browser's localStorage under
   pf-sheet-norikage and his roll log under pf-log-norikage; this page is the same origin, so it can read
   them. When a party member built from #PFpcTogashiNorikage has not taken them yet, they become its live
   values and log, and the member is marked `importedFrom` — nothing is read twice, and the old keys are
   left as they are. Loaded at the gm and play stages (engine/config.js). */
(function () {
  var SOURCE = '#PFpcTogashiNorikage', KEY = 'pf-sheet-norikage', LOGKEY = 'pf-log-norikage';
  var cap = function (s) { return String(s || '').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  // the old sheet's state, in the VTT's live terms
  function liveOf(st) {
    var p = {};
    if (st.strife != null) p.Strife = st.strife;
    if (st.fatigue != null) p.Fatigue = st.fatigue;
    if (st['void'] != null) p.voidPoints = st['void'];
    if (st.stance) p.stance = cap(st.stance);
    if (st.honor != null) p.Honor = st.honor;
    if (st.glory != null) p.Glory = st.glory;
    if (st.status != null) p.Status = st.status;
    if (st.xpEarned != null) p.xpEarned = st.xpEarned;
    if (st.xpSpent != null) p.xpSpent = st.xpSpent;
    if (Array.isArray(st.conditions)) p.conditions = st.conditions.slice();
    if (st.inConflict && st.conflictType) p.conflict = { type: cap(String(st.conflictType).replace(/[-_]/g, ' ')), initiative: null, engaged: [] };
    var eq = {};
    if (st.equipWeapon) { eq.weapons = {}; eq.weapons[st.equipWeapon] = { state: 'readied' }; }
    if (st.equipArmor) eq.armor = st.equipArmor;
    if (eq.weapons || eq.armor) p.equip = eq;
    return p;
  }
  // an old log entry as one line of the new log (its dice are not the VTT's record, its outcome is)
  function lineOf(e) {
    if (e.kind && e.text) return e.text.replace(/<[^>]+>/g, '');
    var bits = [e.skillLabel || null, e.ring ? '(' + cap(e.ring) + (e.ringN != null ? ' ' + e.ringN : '') + ')' : null, e.tn != null ? 'TN ' + e.tn : null].filter(Boolean).join(' ');
    var res = e.su != null ? e.su + ' success' + (e.su === 1 ? '' : 'es') + (e.op ? ' · ' + e.op + ' opportunity' : '') + (e.strifeApplied ? ' · ' + e.strifeApplied + ' strife' : '') + (e.pass != null ? ' — ' + (e.pass ? 'succeeds' : 'fails') : '') : '';
    return [bits, res, e.source ? 'via ' + e.source : null, e.note ? '“' + e.note + '”' : null].filter(Boolean).join(' · ');
  }
  function run() {
    var State = window.VttState, S = State && State.state;
    if (!S || !Array.isArray(S.party)) return;
    var st = read(KEY);
    if (!st) return;
    var me = window.VttSession && window.VttSession.current && window.VttSession.current();
    var myId = me && me.info && me.info.memberId;
    if (me && me.info && me.info.role === 'player' && !myId) return;   // a player imports only once they have claimed
    S.party.forEach(function (m) {
      var src = (m.source && m.source.id) || ((m.character || {})._source || {}).id;
      if (src !== SOURCE || (m.live || {}).importedFrom) return;
      if (myId && m.id !== myId) return;           // a player takes only their own
      var p = liveOf(st);
      p.importedFrom = { key: KEY, at: new Date().toISOString() };
      State.commit('setPartyLive', [m.id, p]);
      var log = read(LOGKEY) || [];
      var t0 = Date.now();
      log.slice().reverse().forEach(function (e, i) {   // the old log is newest first
        State.commit('appendLog', [{ at: new Date(t0 + i).toISOString(), kind: 'event', who: m.name, memberId: m.id, text: lineOf(e), why: 'the old sheet' + (e.when ? ', ' + e.when : '') }]);
      });
      State.commit('appendLog', [{ at: new Date(t0 + log.length).toISOString(), kind: 'event', who: m.name, memberId: m.id,
        text: 'Imported from the old sheet: ' + Object.keys(p).filter(function (k) { return k !== 'importedFrom'; }).join(', ') + (log.length ? '; ' + log.length + ' log entries' : ''), why: 'import' }]);
    });
  }
  window.addEventListener('load', function () {
    setTimeout(run, 400);
    if (window.VttBus) window.VttBus.on('state:remote', function () { setTimeout(run, 0); });
  });
})();
