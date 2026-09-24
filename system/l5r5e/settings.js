// system/l5r5e/settings.js — the GM's Settings pane: one section per feature that needs this
// browser's own configuration (the AI suggestions' key, the lore server's address and token). A feature
// adds its section with L5RSettings.section({ id, render(container, redraw) }); everything a
// section saves is its own, in this browser's localStorage, and never enters the pack or a session.
window.L5RSettings = (function () {
  const sections = [];
  const section = (s) => { if (!sections.some((x) => x.id === s.id)) sections.push(s); };
  function renderPane(container) {
    const { el } = window.VttRender;
    const draw = () => {
      container.innerHTML = '';
      container.appendChild(el('h4', {}, ['Settings']));
      container.appendChild(el('p', { class: 'muted small' }, ['Saved in this browser only — not in the pack, not shared with the table.']));
      sections.forEach((s) => { const box = el('div', { class: 'paper settings-section' }); container.appendChild(box); s.render(box, draw); });
    };
    draw();
  }
  if (window.VttPanels) window.VttPanels.register('settings', { label: 'Settings', render: renderPane });
  return { section };
})();
