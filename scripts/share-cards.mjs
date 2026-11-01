// The share links' preview cards (src/lib/share.mjs), 1200 x 630, one per page: /og/s/<P>.png for a scan's,
// /og/s/less-<P>.png for a status page's, and /og/s/index.png for /s/. Drawn as the product draws its share card
// (cmd/kubectl-napwake/report.html, "the share card, drawn here", at origin/main bb703d29): the same canvas
// code, sizes and colours, on Night, the full lockup top left, the eyebrow on its baseline, the lead figure, its
// line, and how to get your own on the floor. A link carries no workloads, so where the report's card draws the
// cluster's building, this one draws the building close up at its street door (src/lib/share-art.mjs), with
// none of its rooms. Light and dark don't apply: a chat shows the one picture on any background.
//
// Drawn with headless Chrome over its DevTools protocol, as scripts/cards.mjs is, then saved with a 256-colour
// palette by sharp, since WhatsApp shows no picture over about 300 KB. The build runs it once it's done
// (astro.config.mjs), into dist/og/s/, so nothing is committed. GitHub's ubuntu-24.04 runners have Chrome.
//   node scripts/share-cards.mjs [--out=dir] [74 less-76 index ...]   (draws them on their own, to look at)
//   NAPWAKE_SHARE_CARDS=off npm run build                             (a build without them)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { WORDS, LOW, HIGH, SITE_NAME, cardName } from '../src/lib/share.mjs';
import { lobbyArt, ART, nightVars } from '../src/lib/share-art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

// Every card the site needs: the two kinds for each percentage, and /s/ itself.
export function allCards() {
  const cards = [{ kind: 'empty', pct: null }];
  for (let p = LOW; p <= HIGH; p++) cards.push({ kind: 'scan', pct: p }, { kind: 'status', pct: p });
  return cards.map((c) => ({ ...c, name: cardName(c.kind, c.pct) }));
}

// What each card says: the product's #card-data fields, for a link that carries only its percentage.
function spec({ kind, pct }) {
  const t = WORDS[kind];
  const hook = { hook: WORDS.scanCmd, hookLabel: WORDS.hookLabel.toUpperCase(), hookNote: WORDS.hookNote, site: SITE_NAME };
  if (kind === 'empty') return { eyebrow: t.eyebrow, statement: t.statement, value: '', label: t.label.replace(/\.$/, ''), ...hook };
  return { eyebrow: t.eyebrow, statement: '', value: `${pct}% less`, label: t.alone.replace(/\.$/, ''), ...hook };
}

async function page() {
  const tokens = await readFile(join(root, 'src/styles/tokens.css'), 'utf8');
  const font = (f) => pathToFileURL(join(root, 'public/fonts', f)).href;
  // the logo as a data: URL, so the canvas stays readable (a file:// image would taint it)
  const logo = `data:image/svg+xml;base64,${(await readFile(join(root, 'public/media/logo/lockup-horizontal-dark.svg'))).toString('base64')}`;
  const art = Object.fromEntries(['rounds', 'duty'].map((pose) => [pose, lobbyArt(pose, { id: `c-${pose}` })]));
  const poses = { scan: WORDS.scan.pose, status: WORDS.status.pose, empty: WORDS.empty.pose };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${tokens}
@font-face{font-family:"Big Shoulders Display";font-weight:800;src:url(${font('BigShouldersDisplay-800.woff2')})}
@font-face{font-family:"Atkinson Hyperlegible Next";font-weight:200 800;src:url(${font('AtkinsonHyperlegibleNext-400.woff2')})}
@font-face{font-family:"Atkinson Hyperlegible Mono";font-weight:400;src:url(${font('AtkinsonHyperlegibleMono-400.woff2')})}
@font-face{font-family:"Atkinson Hyperlegible Mono";font-weight:700;src:url(${font('AtkinsonHyperlegibleMono-700.woff2')})}
html,body{margin:0;background:#000}
</style></head><body>
<div id="night" style="${nightVars(tokens)}"></div>
<canvas id="card" width="1200" height="630"></canvas>
<script>
const ART = ${JSON.stringify(art)}, POSE = ${JSON.stringify(poses)}, FRAME = ${JSON.stringify(ART)}, LOGO = ${JSON.stringify(logo)};
const night = getComputedStyle(document.getElementById('night'));
const tok = (n) => night.getPropertyValue('--' + n).trim();
// the dark scene's tokens, as the product's card writes them in (its C), read from tokens.css
const C = { ground: tok('surface'), night: tok('night'), paper: tok('paper'), text: tok('text'), muted: tok('muted'), line: tok('line'), lamp: tok('lamp') };
const DISPLAY = '"Big Shoulders Display", "Arial Narrow", sans-serif', SANS = '"Atkinson Hyperlegible Next", -apple-system, "Segoe UI", sans-serif', MONO = '"Atkinson Hyperlegible Mono", ui-monospace, Menlo, monospace';
// the drawing uses the scene's tokens; an image of it needs their values written in
const resolve = (svg) => svg.replace(/var\\(--([\\w-]+)\\)/g, (m, name) => tok(name) || C.night);
const fonts = Promise.all(['800 100px "Big Shoulders Display"', '700 30px "Atkinson Hyperlegible Next"', '400 30px "Atkinson Hyperlegible Next"', '700 20px "Atkinson Hyperlegible Mono"', '400 20px "Atkinson Hyperlegible Mono"'].map((f) => document.fonts.load(f)));
const image = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const logo = image(LOGO);
function wrapText(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  words.forEach((w) => { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; });
  if (line) lines.push(line);
  return lines;
}
function fitLines(ctx, text, weight, family, start, min, maxW, max) {
  for (let fs = start; fs >= min; fs--) {
    ctx.font = weight + ' ' + fs + 'px ' + family;
    const lines = wrapText(ctx, text, maxW);
    if (lines.length <= max && lines.every((l) => ctx.measureText(l).width <= maxW)) return { fs, lines };
  }
  ctx.font = weight + ' ' + min + 'px ' + family;
  return { fs: min, lines: wrapText(ctx, text, maxW) };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// The report's card, wide, at 1x: the same sizes and steps as its draw() and words().
window.draw = async (sp, kind) => {
  await fonts;
  const W = 1200, H = 630, pad = 60, canvas = document.getElementById('card'), ctx = canvas.getContext('2d');
  // the building at its street door, where the report's card stands the building: on the right, its street on
  // the bottom edge and running under the words
  const k = 1.5, aw = FRAME.w * k, ax = W - 6 - aw, ay = H - FRAME.h * k;
  const colW = ax - pad + 30;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><rect width="' + W + '" height="' + H + '" fill="' + C.ground + '"/>' +
    '<g transform="translate(' + (ax - FRAME.x * k).toFixed(1) + ' ' + (ay - FRAME.y * k).toFixed(1) + ') scale(' + k + ')">' + resolve(ART[POSE[kind]]) + '</g></svg>';
  ctx.drawImage(await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)), 0, 0);
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const ls = (px) => { ctx.letterSpacing = px; };
  // the full lockup, the design system's dark horizontal file, where the report's card sets its symbol and
  // wordmark, at .74 where the report's is .5636: 302 px wide, so it's still 100 px, the lockup's smallest
  // (1-logo.md), when a chat shows the card 400 px wide. The eyebrow on the wordmark's baseline, at the column's end.
  const ws = .74, wTop = 50;
  ctx.drawImage(await logo, pad - 12 * ws, wTop + 22 * ws - 32 * ws, 430.5 * ws, 124 * ws);
  let y = wTop + 82 * ws;
  const eb = sp.eyebrow.toUpperCase();
  ctx.font = '700 16px ' + MONO; ls('1px'); ctx.fillStyle = C.muted;
  ctx.fillText(eb, pad + colW - ctx.measureText(eb).width, y); ls('0px');
  if (sp.statement) {
    // /s/ itself: its words in the figure's place, on two lines at most
    const st = fitLines(ctx, sp.statement, '800', DISPLAY, 112, 60, colW, 2);
    ctx.font = '800 ' + st.fs + 'px ' + DISPLAY;
    const asc = ctx.measureText(st.lines[0]).actualBoundingBoxAscent || st.fs * .8;
    y += 40 + asc; ctx.fillStyle = C.paper;
    st.lines.forEach((l, i) => ctx.fillText(l, pad - st.fs * .02, y + i * st.fs * .9));
    y += (st.lines.length - 1) * st.fs * .9 + st.fs * .14;
  } else {
    const big = fitLines(ctx, sp.value, '800', DISPLAY, 168, 60, colW, 1);
    ctx.font = '800 ' + big.fs + 'px ' + DISPLAY;
    const asc = ctx.measureText(big.lines[0]).actualBoundingBoxAscent || big.fs * .8;
    y += 56 + asc; ctx.fillStyle = C.paper;
    big.lines.forEach((l, i) => ctx.fillText(l, pad - big.fs * .02, y + i * big.fs * .86));
  }
  const lf = fitLines(ctx, sp.label, '700', SANS, 28, 18, colW - 40, 2);
  y += lf.fs * 1.8;
  lf.lines.forEach((l, i) => { ctx.font = '700 ' + lf.fs + 'px ' + SANS; ctx.fillStyle = C.paper; ctx.fillText(l, pad, y + i * lf.fs * 1.2); });
  // how to get your own, and where, on the floor of the card
  // the command a size up from the report's 22 px, and its note and address from 16, so they read at a chat's size
  const foot = H - 56 - 14;
  ctx.font = '700 24px ' + MONO;
  const cmd = '$ ' + sp.hook, boxW = ctx.measureText(cmd).width + 32, ph = 50, px = pad;
  const nPx = 17, sPx = 17, dot = ' · ';
  ctx.font = '400 ' + nPx + 'px ' + SANS;
  const nw = ctx.measureText(sp.hookNote + dot).width;
  const py = foot - ph + 8;
  ctx.font = '700 24px ' + MONO;
  ctx.fillStyle = C.night; roundRect(ctx, px, py, boxW, ph, 6); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; roundRect(ctx, px, py, boxW, ph, 6); ctx.stroke();
  ctx.fillStyle = C.paper; ctx.fillText(cmd, px + 16, py + ph * .66);
  ctx.font = '700 15px ' + MONO; ls('1px'); ctx.fillStyle = C.lamp;
  ctx.fillText(sp.hookLabel, px, py - 12); ls('0px');
  let nx = px + boxW + 16; const ny = py + ph * .64;
  ctx.font = '400 ' + nPx + 'px ' + SANS; ctx.fillStyle = C.muted; ctx.fillText(sp.hookNote + dot, nx, ny);
  nx += nw; ctx.font = '700 ' + sPx + 'px ' + MONO; ctx.fillStyle = C.lamp; ctx.fillText(sp.site, nx, ny);
  ctx.restore();
  return canvas.toDataURL('image/png');
};
</script></body></html>`;
}

function findChrome() {
  const at = CANDIDATES.find((c) => existsSync(c));
  if (!at) throw new Error(`share cards: no Chrome at ${CANDIDATES.join(', ')}. Set CHROME, or NAPWAKE_SHARE_CARDS=off to build without them`);
  return at;
}

// Draws the cards into `out`. Returns how many, and how many bytes in all.
export async function drawShareCards(out, { only = [], log = console.log } = {}) {
  const cards = allCards().filter((c) => !only.length || only.includes(c.name));
  const file = join(tmpdir(), `napwake-share-card-${process.pid}.html`);
  await writeFile(file, await page());
  await mkdir(out, { recursive: true });
  const port = 9700 + Math.floor(Math.random() * 200);
  // On CI, without Chrome's sandbox: a runner may not allow the user namespaces it needs, and the page is our own
  // file, with nothing from the network.
  const flags = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'napwake-share-cards-' + port)}`];
  if (process.env.CI) flags.push('--no-sandbox');
  const chrome = spawn(findChrome(), [...flags, 'about:blank'], { stdio: 'ignore' });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    let version;
    for (let i = 0; i < 75 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
    if (!version) throw new Error('share cards: Chrome did not start');
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    let id = 0; const wait = new Map(); const events = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(d.error.message)) : w.ok(d.result); } else events.forEach((f) => f(d)); };
    await new Promise((r) => (ws.onopen = r));
    const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; wait.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    const loaded = new Promise((r) => events.push((d) => d.sessionId === sessionId && d.method === 'Page.loadEventFired' && r()));
    await send('Page.navigate', { url: pathToFileURL(file).href }, sessionId);
    await loaded;
    let bytes = 0, biggest = 0;
    const saving = [];
    for (const c of cards) {
      const r = await send('Runtime.evaluate', { expression: `draw(${JSON.stringify(spec(c))}, ${JSON.stringify(c.kind)})`, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) throw new Error(`share cards: ${c.name}: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
      const raw = Buffer.from(r.result.value.split(',')[1], 'base64');
      saving.push(sharp(raw).png({ palette: true, quality: 100, compressionLevel: 9, effort: 7 }).toBuffer().then(async (png) => {
        if (png.length > 300_000) throw new Error(`share cards: ${c.name}.png is ${png.length} bytes, over WhatsApp's 300 KB`);
        bytes += png.length; biggest = Math.max(biggest, png.length);
        await writeFile(join(out, `${c.name}.png`), png);
      }));
      if (saving.length >= 8) await Promise.all(saving.splice(0));
    }
    await Promise.all(saving);
    ws.close();
    log(`share cards: ${cards.length} in ${out}, ${Math.round(bytes / 1024)} KB, the largest ${Math.round(biggest / 1024)} KB`);
    return { count: cards.length, bytes };
  } finally {
    chrome.kill();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const out = resolve(root, (args.find((a) => a.startsWith('--out=')) || '--out=dist/og/s').slice(6));
  await drawShareCards(out, { only: args.filter((a) => !a.startsWith('--')) });
}
