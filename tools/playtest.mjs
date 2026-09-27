// tools/playtest.mjs — headless autoplay of every episode.
//
//   npm install          (dev only: playwright + a local copy of Phaser)
//   npm run playtest     (all episodes)   ·   npm run playtest -- 3 4   (some)
//
// Serves the repo, loads the game in headless Chromium (the Phaser CDN request
// is answered from node_modules), then walks each episode rightward: jumping
// at walls, reading every verse, cranking the Sampo, answering the singing
// contest, playing the kantele. A few precise-timing stretches (the fire vents,
// the item ledges) are skipped with a nudge; everything else is played.
// Fails if an episode doesn't reach its finale or the page logs an error.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHASER = path.join(ROOT, 'node_modules/phaser/dist/phaser.min.js');
const PORT = +(process.env.PORT || 8765);
const episodes = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [1, 2, 3, 4, 5];

const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.webmanifest': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

// Per-episode nudges, run in the page each tick. Return true to skip walking.
const NUDGE = {
  4: () => {
    const sc = RunoGame.scene.getScene('Episode4Scene');
    const k = sc._kantele;
    if (k && k.phase === 'play') { sc._pluck(Math.floor(Math.random() * 5)); k.lastAt -= 400; return true; }
    if (k) return true;
    const p = PlayerController.sprite;
    if (p.x > 4200 && p.x < 4600 && !sc._parts.teeth) p.setPosition(4435, 280);
    if (p.x > 4700 && p.x < 5000 && !sc._parts.hair) p.setPosition(4905, 240);
    return false;
  },
  5: () => {
    const p = PlayerController.sprite;
    if (p.x > 1750 && p.x < 2990) { p.setPosition(3000, 350); PlayerController.setCheckpoint(3000, 350); }
    const sc = RunoGame.scene.getScene('Episode5Scene');
    const oak = sc._runes.find(r => r.config.id === 'r3');
    if (p.x > 3500 && p.x < 3950 && !oak.triggered) p.setPosition(sc.OAK_X, 70);
    if (oak.triggered && p.x < 3950 && p.y < 120) { p.setPosition(4000, 120); }
    return false;
  }
};

async function play(page, ep) {
  await page.evaluate(n => RunoGame.scene.getScene('TitleScene').scene.start('Episode' + n + 'Scene'), ep);
  await page.waitForTimeout(800);
  let lastX = 0, stuck = 0, right = false;
  for (let t = 0; t < 900; t++) {
    const s = await page.evaluate(n => {
      const sc = RunoGame.scene.getScene('Episode' + n + 'Scene');
      const d = sc._duel;
      return {
        x: PlayerController.sprite.x, swim: PlayerController.isSwimming, frozen: PlayerController.frozen,
        panel: StoryPanel.isActive(), ready: StoryPanel._ready, fin: sc._finaleTriggered,
        lit: sc._runes.filter(r => r.triggered).length, total: sc._runes.length,
        duel: d ? { phase: d.phase, seq: d.seq, pos: d.pos } : null,
        // Is there ground just ahead at about our height? If not, jump the gap.
        edge: PlayerController.isGrounded && !PlayerController.isSwimming && !sc._groundGroup.getChildren().some(b => {
          const bb = b.body, ax = PlayerController.sprite.x + 34, foot = PlayerController.sprite.body.bottom;
          return ax >= bb.left && ax <= bb.right && bb.top >= foot - 70 && bb.top <= foot + 60;
        }),
        crank: sc._sampoActive && !sc._sampoComplete && Math.abs(PlayerController.sprite.x - sc._forgeX) < 200
      };
    }, ep);
    if (s.fin) return { ok: true, lit: s.lit, total: s.total };
    if (s.panel) {
      if (right) { await page.keyboard.up('ArrowRight'); right = false; }
      if (s.ready) await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      continue;
    }
    if (s.duel) {
      if (s.duel.phase === 'answer') {
        const keys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
        for (let k = s.duel.pos; k < s.duel.seq.length; k++) { await page.keyboard.press(keys[s.duel.seq[k]]); await page.waitForTimeout(100); }
      }
      await page.waitForTimeout(250);
      continue;
    }
    if (s.crank) { await page.keyboard.down('Space'); await page.waitForTimeout(400); await page.keyboard.up('Space'); continue; }
    if (NUDGE[ep] && await page.evaluate(NUDGE[ep])) { await page.waitForTimeout(250); continue; }
    if (!right) { await page.keyboard.down('ArrowRight'); right = true; }
    stuck = (Math.abs(s.x - lastX) < 4 && !s.frozen) ? stuck + 1 : 0;
    if (stuck >= 1 || s.edge || (s.swim && t % 3 === 0)) {
      await page.keyboard.down('Space');
      await page.waitForTimeout(stuck > 3 || s.edge ? 450 : 250);
      await page.keyboard.up('Space');
    }
    lastX = s.x;
    await page.waitForTimeout(200);
  }
  const end = await page.evaluate(n => { const sc = RunoGame.scene.getScene('Episode' + n + 'Scene');
    return { lit: sc._runes.filter(r => r.triggered).length, x: PlayerController.sprite.x | 0 }; }, ep);
  return { ok: false, lit: end.lit, x: end.x };
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = false;
for (const ep of episodes) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ path: PHASER, contentType: 'application/javascript' }));
  await page.goto(`http://localhost:${PORT}/?unlock=all`);
  await page.waitForFunction(() => window.RunoGame && RunoGame.scene.isActive('TitleScene'), null, { timeout: 20000 });
  const r = await play(page, ep);
  const ok = r.ok && !errors.length;
  failed = failed || !ok;
  console.log(`Episode ${ep}: ${ok ? 'PASS' : 'FAIL'}  runes lit ${r.lit}${r.total ? '/' + r.total : ''}${r.x ? '  stopped at x=' + r.x : ''}` +
    (errors.length ? `\n  errors:\n  ${errors.join('\n  ')}` : ''));
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
