/* Read-only snapshots, newest first, shown in the sheet selector in the top bar.
   `state` is the between-sessions baseline — strife reset under the standing ruling,
   Void at the sheet's own start value — not a freeze-frame of a mid-scene tracker. */
window.SHEET_HISTORY = [
  { id:"s5", label:"Session Five \u00b7 9 XP spent", date:"9 Sep 2026",
    data: Object.assign(
      JSON.parse(document.getElementById("sheet-s5").textContent),
      { state:{ strife:0, fatigue:0, "void":3, stance:"void" } }) },
  { id:"s3", label:"Session Three \u00b7 0 XP", date:"18 Aug 2026",
    data: Object.assign(
      JSON.parse(document.getElementById("sheet-s3").textContent),
      { state:{ strife:0, fatigue:0, "void":3, stance:"void" } }) }
];
