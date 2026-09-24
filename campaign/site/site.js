/* campaign/site/site.js — the campaign's site tabs (M7), loaded at the `site` stage (engine/config.js),
   before engine/site.js first renders. Each tab draws one of campaign/docs/ — the old Portents pages'
   content, moved there by campaign/source/migrate_docs.py — into a `.pf-doc` container, the element
   campaign/site/campaign.css is scoped to; the Dramatis Personae is drawn from the DSL layer
   (campaign/site/personae.js). A tab's path is an anchor in its document: #atlas/reisui-ji. */
(function () {
  var TITLE = (window.VttConfig || {}).title || 'Portents & Fortunes';
  var cache = {};

  function fetchDoc(name) {
    if (!cache[name]) cache[name] = fetch('campaign/docs/' + name + '.html').then(function (r) {
      if (!r.ok) throw new Error('campaign/docs/' + name + '.html: ' + r.status);
      return r.text();
    });
    return cache[name];
  }

  // the document, in the paper it was written on; then scroll to the path's anchor, and let the
  // tab do what its page's script did
  function docTab(name, after) {
    return function (main, path) {
      var host = document.createElement('div');
      host.className = 'pf-doc pf-tab';
      var wrap = document.createElement('div');
      wrap.className = 'wrap';
      wrap.innerHTML = '<p class="muted">Reading…</p>';
      host.appendChild(wrap);
      main.appendChild(host);
      fetchDoc(name).then(function (html) {
        if (!host.isConnected) return;
        wrap.innerHTML = html;
        if (after) after(host, path || []);
        var id = (path || [])[0];
        var at = id && document.getElementById(id);
        if (at) at.scrollIntoView();
      }).catch(function (e) { wrap.innerHTML = ''; wrap.appendChild(document.createTextNode('Could not read ' + name + ' (' + e.message + ').')); });
    };
  }

  // the Chronicle's rail, as its page built it: sessions as groups, scenes as entries
  function chronicleRail(host) {
    window.PF.rail({
      panel: '.pf-tab .col', group: 'h2.sess-t', entry: 'h3.sec-h', mount: host,
      title: 'Sessions', toggle: 'Sessions',
      href: function (id) { return '#chronicle/' + id; },
      label: function (h) {
        if (!h.matches('h2.sess-t')) return h.textContent;
        var n = h.parentElement.querySelector('.sess-n');
        return (n ? n.textContent.replace(/^Session\s+/i, '') + ' · ' : '') + h.textContent;
      },
    });
  }

  // the Norikage tab: the characters page, and his dossier at #norikage/dossier
  function norikageTab(main, path) {
    return (path[0] === 'dossier' ? docTab('norikage') : docTab('characters'))(main, path.slice(1));
  }

  var tabs = [
    { id: 'pf', label: TITLE, render: docTab('home') },
    { id: 'norikage', label: 'Norikage', render: norikageTab },
    { id: 'chronicle', label: 'Chronicle', render: docTab('chronicle', chronicleRail) },
    { id: 'personae', label: 'Dramatis Personae', render: docTab('personae', function (host, path) { window.PF.personae(host.querySelector('#dp'), path); }) },
    { id: 'map', label: 'Map', render: docTab('map', function (host, path) { window.PF.map(path[0]); }) },
    { id: 'atlas', label: 'Atlas', render: docTab('atlas') },
    { id: 'rokugan', label: 'Lore of Rokugan', render: docTab('lore') },
  ];
  // the campaign's tabs first: the site opens on the campaign; on a phone its menu draws a line after them
  tabs.forEach(function (t) { t.group = 'campaign'; });
  window.VttSiteTabs = tabs.concat(window.VttSiteTabs || []);
})();
