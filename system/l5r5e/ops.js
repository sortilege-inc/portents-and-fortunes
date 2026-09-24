// system/l5r5e/ops.js — the ops Legend of the Five Rings adds to the engine's, registered with
// the same call and shared the same way (engine/ops.js). Loaded by the browser after
// engine/ops.js, and imported by the Worker beside it, so the room applies the very same
// functions.
//
//   cast   { [sceneId]: [entityIds] }   who the GM has put in a scene of an adventure, beyond
//                                       the NPCs its .arc names there — drawn from any book's
//                                       NPCs (the Cast panel)
//   party[].versions                    archived copies of a character (archivePartyVersion)
//   npcConditions { [entityId]: [names] } an NPC's conditions, the GM's (setNpcConditions)
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('../../engine/ops.js'));
  else factory(root.VttOps);
})(typeof self !== 'undefined' ? self : this, function (Ops) {
  Ops.shared(['cast']);

  Ops.register('setSceneCast', (s, sceneId, ids) => {
    if (!s.cast) s.cast = {};
    s.cast[sceneId] = (ids || []).slice();
  });

  // A party member's archived versions (the sheet's version history): a copy of the character
  // and its trackers, appended, never edited. A player may archive their own character.
  Ops.register('archivePartyVersion', (s, id, version) => {
    const m = (s.party || []).find((x) => x.id === id);
    if (!m || !version || !version.id) return;
    if (!m.versions) m.versions = [];
    if (!m.versions.some((x) => x.id === version.id)) m.versions.push(version);
  }, (s, me, a) => a[0] === me);

  // An NPC's conditions, as the GM marks them (the Inspector): { [entityId]: [names] }. Shared, so a
  // player engaged with the NPC sees them with their rules text (Portents O7).
  Ops.shared(['npcConditions']);
  Ops.register('setNpcConditions', (s, id, list) => {
    if (!s.npcConditions) s.npcConditions = {};
    s.npcConditions[id] = (list || []).slice();
  });

  return Ops;
});
