// Upstream I20 (decision 80): the GM Inspector's party sheet with no duplicated block. Portents is
// served from disk; Norikage is added as the GM page adds a pregen. Every line printed is a
// measurement; a FAIL exits 1. OVER="system/l5r5e/sheet.js …" lays those files from the upstream
// checkout over Portents' own, to test an upstream change before it is merged.
//   NODE_PATH=~/App/ray-so/scripts/node_modules node campaign/source/check_inspector.js [shot.png]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const PF = path.resolve(__dirname, '../..');
const UP = path.join(process.env.HOME, 'Sortilege/VTT/sortilege-vtt-l5r5e');
const OVER = (process.env.OVER || '').split(' ').filter(Boolean);
const ORIGIN = 'http://localhost:8761';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const errors = [], fails = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function expect(label, got, want) {
  const ok = typeof want === 'function' ? want(got) : JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  ok   ' : '  FAIL ') + label + ' → ' + JSON.stringify(got) + (ok || typeof want === 'function' ? '' : '  (want ' + JSON.stringify(want) + ')'));
  if (!ok) fails.push(label);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1500, height: +(process.env.H || 1000) } });
  await ctx.route(ORIGIN + '/**', (route) => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    const f = path.join(OVER.includes(p) ? UP : PF, p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'no' });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await ctx.route(/^https?:\/\/(?!localhost:8761)/, (r) => (/fonts\.(googleapis|gstatic)/.test(r.request().url()) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { try { sessionStorage.setItem('portents-vtt:gm-gate', '1'); } catch (e) { /* */ } });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await p.goto(ORIGIN + '/gm/');
  await p.waitForFunction(() => window.VttState && VttState.state && /PARTY/i.test(document.body.innerText), null, { timeout: 30000 });
  await wait(1500);
  const party = await p.evaluate(() => (VttState.state.party || []).map((m) => m.name));
  console.log('  party: ' + JSON.stringify(party));
  // Norikage as the GM page adds a pregen: from his campaign entity, with its printed versions
  const raw = await p.evaluate(async () => {
    const e = L5RData.entity('#PFpcTogashiNorikage') || (await L5RData.ensure('campaign').then(() => L5RData.entity('#PFpcTogashiNorikage')));
    const m = L5RSheet.memberFromEntity(e);
    VttState.commit('addPartyMember', [m]);
    const pm = VttState.state.party.find((x) => /Norikage/.test(x.name));
    return { party: VttState.state.party.length, rawVersions: (pm.versions || []).map((v) => v.label + ' · ' + v.date) };
  });
  console.log('  added: ' + JSON.stringify(raw));
  // through the real controls: the Party pane, his card, the Inspector
  await p.locator('button, a', { hasText: /^Party$/i }).first().click(); await wait(500);
  await p.locator('button.card', { hasText: 'Togashi Norikage' }).first().click(); await wait(1200);
  const insp = p.locator('.sheet.live').first();
  const m = await insp.evaluate((box) => {
    const host = box.parentElement;
    const q = (s) => box.querySelectorAll(s).length;
    const txt = (s) => [...box.querySelectorAll(s)].map((x) => x.innerText.trim());
    return {
      ringSets: q('.ring-tile, .ac-ring') ? { tiles: q('.ring-tile'), acRings: q('.ac-rings') } : null,
      typebar: q('.ac-typebar'), acHead: q('.ac-head'), acStats: q('.ac-stats'), acTechs: q('.ac-techs'), sheetHead: q('.sheet-head'),
      skillChips: q('.ac-skills .ac-chip'), adv: txt('.ac-adv .ac-lab').map((x) => x.toLowerCase()),
      gear: txt('.ac-gearline'), fold: q('details.ac-fold'), foldOpen: q('details.ac-fold[open]'),
      honorEtc: (box.innerText.match(/\bHonor\b/g) || []).length,
      techniqueNames: [...box.children].filter((x) => !/XP earned|Experience/i.test(x.innerText)).map((x) => x.innerText).join('\n').match(/Way of the Earthquake/gi).length,
      gmNotes: [...host.querySelectorAll('.prop-k')].filter((x) => /^GM notes/i.test(x.innerText.trim())).length,
      versions: [...box.querySelector('.sheet-head select.scope').options].map((o) => o.textContent),
    };
  });
  for (const [k, v] of Object.entries(m)) console.log('  ' + k + ': ' + JSON.stringify(v));
  expect('one set of rings (the live tiles), none from the printed sheet', m.ringSets && m.ringSets.acRings, 0);
  expect('no second header / type line / societal-personal block / technique list', [m.acHead, m.typebar, m.acStats, m.acTechs], [0, 0, 0, 0]);
  expect('one sheet header', m.sheetHead, 1);
  expect('Way of the Earthquake named once outside the XP record', m.techniqueNames, 1);
  expect('skills to click', m.skillChips, (n) => n >= 7);
  expect('advantages and disadvantages', m.adv, ['advantages', 'disadvantages']);
  expect('gear line without what the gear block lists', m.gear.join(' | '), (g) => !/\bBō\b|Common Clothes/.test(g) && /Traveling Pack/.test(g));
  expect('biography folded', [m.fold, m.foldOpen], [1, 0]);
  expect('one GM notes heading', m.gmNotes, 1);
  expect('versions oldest first', m.versions.slice(1).map((x) => x.split(' · ')[0]), ['Session Three', 'Session Five', 'Session Seven']);
  // a skill clicked sets the roller
  await insp.locator('.ac-skills .ac-chip', { hasText: 'Theology' }).first().click(); await wait(300);
  expect('Theology clicked → the roller', await insp.evaluate((b) => /Theology/.test(b.querySelector('.roller, .dice-roller, [class*=roll]') ? b.innerText : '')), true);
  // the fold opens
  if (!m.fold) throw new Error('no fold: the old code — stopping here');
  await insp.locator('details.ac-fold > summary').click(); await wait(200);
  expect('the fold opens on the biography', await insp.locator('details.ac-fold[open]').innerText().then((t) => /Ninjō|Giri|Bushid/i.test(t)), true);
  // an archived version reads the same way
  await insp.locator('.sheet-head select.scope').first().selectOption({ label: /Session Three/.test('') ? '' : (m.versions.find((x) => /Session Three/.test(x))) });
  await wait(800);
  const a = await p.locator('.sheet.live.archived').first().evaluate((box) => ({ acRings: box.querySelectorAll('.ac-rings').length, acHead: box.querySelectorAll('.ac-head').length, banner: !!box.querySelector('.archive-banner'), skills: box.querySelectorAll('.ac-skills .ac-chip').length }));
  expect('archived: banner, no second rings/header, skills shown', a, (x) => x.banner && x.acRings === 0 && x.acHead === 0 && x.skills >= 5);
  await p.locator('.sheet.live .sheet-head select.scope').first().selectOption(''); await wait(600);
  if (process.argv[2]) {
    await p.locator('.sheet.live').first().screenshot({ path: process.argv[2] });
    console.log('  shot: ' + process.argv[2]);
  }
  expect('console and page errors', errors, []);
  console.log(fails.length ? '\nFAIL ' + fails.length + ': ' + fails.join('; ') : '\nPASS');
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
