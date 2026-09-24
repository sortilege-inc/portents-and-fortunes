// engine/config.js — where things are. The one file a deployment edits.
// INSTANCE-OWNED: Portents & Fortunes (merge=ours; see campaign/INSTANCE-PLAYBOOK.md).
window.VttConfig = {
  system: 'l5r5e',
  title: 'Portents & Fortunes',
  channel: 'portents-vtt',               // BroadcastChannel name (same-machine windows)
  storagePrefix: 'portents-vtt',         // localStorage key prefix (the old site's keys are pf-*)
  dataGlobal: 'L5R5E',                   // the global data/*.js registers into
  // The pages, relative to the site root; the gm/ pages carry <base href="../"> so every
  // path stays root-relative.
  pages: { site: './', gm: 'gm/', table: 'gm/vtt.html', play: 'gm/play.html' },
  // what a fresh browser opens on until a campaign is created or restored: no adventure is
  // picked (the Adventure panel offers the sixteen), no book beyond what a view asks for
  // the seed (engine/state.js seed): the arc and the ambush from the Session Seven prep, filled into
  // this campaign once, where it has none — nothing the GM has made is overwritten
  defaultCampaign: { name: 'Portents & Fortunes', modules: [], books: [], seed: 'campaign/pack/seed.json' },
  // the Notes pane's document (system/l5r5e/gm-panes.js): the state document, behind the gate the old
  // Behind the Veil page stood behind (decision 9)
  notes: {
    src: 'campaign/docs/state.html', title: 'Behind the Veil', class: 'pf-doc',
    gate: {
      title: 'Behind the Veil',
      text: 'Beyond lie the Master\'s papers \u2014 the premise, the subplots, the shape of the prophecy. To read them is to know what Norikage does not. Bow to enter, or retreat and keep the mystery.',
      enter: 'Bow & Enter',
    },
  },
  // the three panels the GM page opens on (engine/app.js)
  defaultSlots: ['notes', 'scenes', 'threads'],   // O8: the GM's table opens on the three panes
  // The Worker that holds player sessions. Served from localhost the app talks to
  // `wrangler dev`; deployed, to the URL below. Empty = sessions disabled until the owner
  // deploys (PLAN.md D3).
  // What this instance adds to the upstream pages (engine/instance.js). The campaign's DSL layer —
  // its NPCs, Norikage, the house rules — is built by build/build_layer.sh into campaign/data/.
  instance: {
    // the old site's fonts, and its stylesheets scoped to .pf-doc (campaign/source/scope_css.py)
    styles: [
      'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap',
      'campaign/site/campaign.css', 'campaign/site/pf.css',
    ],
    stages: {
      data: ['campaign/data/index.js', 'campaign/site/portraits.js', 'campaign/site/blood-of-the-kami.js'],
      // the campaign's tabs (M7): the documents in campaign/docs/, the map, the cast
      site: ['campaign/site/npc-meta.js', 'campaign/site/rail.js', 'campaign/site/map.js', 'campaign/site/personae.js', 'campaign/site/site.js'],
      gm: ['campaign/site/import-old-sheet.js'],
      play: ['campaign/site/import-old-sheet.js'],
    },
  },
  worker: {
    deployed: 'https://portents-vtt.sortilege.workers.dev',
    local: 'http://localhost:8794',
  },
};
window.VttConfig.workerUrl = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? window.VttConfig.worker.local : window.VttConfig.worker.deployed;
