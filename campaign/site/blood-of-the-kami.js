/* Blood of the Kami — Norikage's customization of his checks (campaign/PLAN.md decision 28), through
   upstream's check-hook point (window.L5RCheckHooks, system/l5r5e/sheet.js). The school ability, as
   the core prints it (Togashi Tattooed Order): "When you make a check to activate a kihō linked to one
   of your mystical tattoos, if you succeed, add additional bonus successes equal to your school rank."
   Which kihō is linked is his record: the actor's ^"Mystical Tattoos" (motif → kihō). Automatic, not
   a prompt (owner). */
(window.L5RCheckHooks = window.L5RCheckHooks || []).push(function (ctx) {
  var tattoos = ctx.character['Mystical Tattoos'];
  var o = ctx.roll.opts || {};
  if (!tattoos || typeof tattoos !== 'object' || !o.source || o.sourceType !== 'Kihō') return null;
  var motif = Object.keys(tattoos).find(function (k) { return tattoos[k] === o.source; });
  if (!motif || ctx.tally.success !== true) return null;
  var rank = ctx.character['School Rank'] || 1;
  return { successes: rank, label: 'Blood of the Kami (the ' + motif.toLowerCase() + ' tattoo)' };
});
