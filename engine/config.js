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
  // the seed (engine/state.js seed): the GM's material — Behind the Veil, moved into the GM tabs
  // (decision 67, campaign/source/absorb_state.py) — and the arc and encounters. It fills what the
  // campaign has never had, entry by entry; the pack is the source from then on, edited in the tabs.
  defaultCampaign: { name: 'Portents & Fortunes', modules: [], books: [], seed: 'campaign/pack/seed.json' },
  // the campaign is its own adventure: its arc is what the table, the cast and the current scene
  // follow, and the published-adventure picker and the Notes document are left out (decision 67)
  ownAdventure: { title: 'Portents & Fortunes' },
  hidePanes: ['adventure', 'notes'],
  paneOrder: ['overview', 'scenes', 'threads', 'encounters', 'cast', 'places', 'party', 'inspector', 'dice', 'rules', 'log', 'lore', 'campaign', 'settings'],
  // the veil the old Behind the Veil page stood behind (decision 9), now in front of the whole GM page
  gmGate: {
    title: 'Behind the Veil',
    text: 'Beyond lie the Master\'s papers \u2014 the premise, the subplots, the shape of the prophecy. To read them is to know what Norikage does not. Bow to enter, or retreat and keep the mystery.',
    enter: 'Bow & Enter',
    leave: 'Retreat',
  },
  // the public site shows the campaign's tabs and the dice; the books' tabs are the GM's to turn on,
  // per browser, in Settings (the family standard, PLAYBOOK.md)
  siteBooks: false,
  // the three panels the GM page opens on (engine/app.js)
  defaultSlots: ['overview', 'scenes', 'threads'],
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
