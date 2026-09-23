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
  defaultCampaign: { name: 'Portents & Fortunes', modules: [], books: [] },
  // the three panels the GM page opens on (engine/app.js)
  defaultSlots: ['adventure', 'party', 'inspector'],
  // The Worker that holds player sessions. Served from localhost the app talks to
  // `wrangler dev`; deployed, to the URL below. Empty = sessions disabled until the owner
  // deploys (PLAN.md D3).
  // What this instance adds to the upstream pages (engine/instance.js). The campaign's DSL layer —
  // its NPCs, Norikage, the house rules — is built by build/build_layer.sh into campaign/data/.
  instance: {
    styles: [],
    stages: {
      data: ['campaign/data/index.js', 'campaign/site/portraits.js'],
    },
  },
  worker: {
    deployed: '',
    local: 'http://localhost:8794',
  },
};
window.VttConfig.workerUrl = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? window.VttConfig.worker.local : window.VttConfig.worker.deployed;
