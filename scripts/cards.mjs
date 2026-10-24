// The social cards (og:image), 1200 x 630, in the launch card's style: Lamp ground, the wordmark, the
// page's headline in Big Shoulders, its line in the mono, and the doorman in the page's pose, drawn
// by the brand's rig with token colours. Rendered with headless Chrome into public/og/<card>.png.
//   node scripts/cards.mjs        (commit the PNGs; the build only copies them)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { figure, POSES, handFilter, poseProps } from '../src/lib/rig/doorman.mjs';
import { DOORMAN, tokenize } from '../src/lib/art.mjs';
import { HEADLINE, PLAIN, PAGES } from '../src/lib/site.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/og');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CARDS = {
  home: { pose: 'door', title: HEADLINE, line: PLAIN, size: 64 },
  'how-it-works': { pose: 'lights', title: 'It pauses workloads. Here’s when, and how they wake.', line: 'The activity clock, the doorman that holds the first request, and the forecast that wakes rooms 15 minutes early.' },
  compare: { pose: 'watch', title: 'Three ways to stop paying for idle staging.', line: 'A timetable, a scale-to-zero proxy and Napwake, through one evening and the next morning.' },
  faq: { pose: 'point', title: 'Questions people ask about Napwake.', line: 'Short answers, each complete on its own, with where it comes from.' },
  changelog: { pose: 'tip', title: 'What’s new in Napwake.', line: 'Each release in plain words, then every change. 0.2.0 is in release candidates.' },
  blog: { pose: 'duty', title: 'From the front desk.', line: 'Release announcements from Napwake, and how it’s built.' },
  brand: { pose: 'tip', title: 'The doorman, and how to use him.', line: 'The logo, the doorman illustrations under CC BY 4.0, and the trademark rules.' },
};
for (const p of PAGES) if (!CARDS[p.card]) throw new Error(`no card for ${p.card}`);

function art(poseName) {
  const p = { ...POSES[poseName], ground: false };
  if (['door', 'lights', 'list', 'watch', 'rounds'].includes(poseName)) p.props = poseProps(poseName, DOORMAN);
  const fy = 592, k = 2.45, cx = poseName === 'point' ? 210 : poseName === 'door' ? 230 : 270;
  const wedge = poseName === 'door' ? `<path d="M${cx + 94 * k} ${fy} H${cx + 140 * k} L${cx + 260 * k} 630 H${cx + 70 * k} Z" fill="var(--launch-wedge)" opacity=".7"/>` : '';
  const shadow = `<ellipse cx="${cx - 10}" cy="${fy + 4}" rx="${50 * k}" ry="${7 * k}" fill="var(--night)" opacity=".16"/>`;
  return tokenize(`<defs>${handFilter('fin', 2.2, 0.14)}</defs><rect y="${fy}" width="560" height="${630 - fy}" fill="var(--launch-floor)"/>${wedge}${shadow}<g filter="url(#fin)"><g transform="translate(${cx} ${fy}) scale(${k})">${figure(p, DOORMAN)}</g></g>`);
}

async function html(card) {
  const c = CARDS[card];
  const tokens = await readFile(join(root, 'src/styles/tokens.css'), 'utf8');
  const font = (f) => pathToFileURL(join(root, 'public/fonts', f)).href;
  const mark = pathToFileURL(join(root, 'public/media/logo/wordmark.svg')).href;
  return `<!doctype html><html data-theme="light"><head><meta charset="utf-8"><style>
${tokens}
@font-face{font-family:"Big Shoulders Display";font-weight:800;src:url(${font('BigShouldersDisplay-800.woff2')})}
@font-face{font-family:"Atkinson Hyperlegible Mono";font-weight:400;src:url(${font('AtkinsonHyperlegibleMono-400.woff2')})}
html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:var(--lamp);color:var(--night)}
.mark{position:absolute;left:72px;top:72px;height:62px;width:auto}
h1{position:absolute;left:72px;top:176px;width:${c.size ? 620 : 600}px;margin:0;font:800 ${c.size || 76}px/1 var(--font-display);letter-spacing:0}
p{position:absolute;left:72px;bottom:74px;width:540px;margin:0;font:400 21px/1.5 var(--font-mono)}
svg{position:absolute;right:0;top:0;width:560px;height:630px}
.floor{position:absolute;left:0;right:0;bottom:0;height:38px;background:var(--launch-floor)}
</style></head><body>
<div class="floor"></div>
<img class="mark" src="${mark}" alt="">
<h1>${c.title}</h1>
<p>${c.line}</p>
<svg viewBox="0 0 560 630">${art(c.pose)}</svg>
</body></html>`;
}

// headless Chrome over its DevTools protocol, as scripts/screens.mjs does
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'napwake-cards-' + port)}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 50 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0; const wait = new Map(); const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(d.error.message)) : w.ok(d.result); } else events.forEach((f) => f(d)); };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; wait.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

await mkdir(out, { recursive: true });
const only = process.argv.slice(2);
for (const card of Object.keys(CARDS).filter((c) => !only.length || only.includes(c))) {
  const file = join(tmpdir(), `napwake-card-${card}.html`);
  await writeFile(file, await html(card));
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false }, sessionId);
  const loaded = new Promise((r) => events.push((d) => d.sessionId === sessionId && d.method === 'Page.loadEventFired' && r()));
  await send('Page.navigate', { url: pathToFileURL(file).href }, sessionId);
  await loaded;
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true }, sessionId);
  await sleep(300);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } }, sessionId);
  await writeFile(join(out, `${card}.png`), Buffer.from(shot.data, 'base64'));
  console.log(`public/og/${card}.png`);
  await send('Target.closeTarget', { targetId });
}
ws.close(); chrome.kill();
