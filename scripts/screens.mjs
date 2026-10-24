// Renders every page with headless Chrome: desktop and phone, light and dark, full length.
// Uses only Node's built-ins and Chrome's DevTools protocol. Build first: npm run build && npm run screens
//   node scripts/screens.mjs [page ...] [--only=desktop-light,phone-dark] [--motion=reduce] [--out=screens]
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const i = a.indexOf('='); return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)]; }));
const PAGES = { home: '/', how: '/how-it-works/', compare: '/compare/', brand: '/brand/', faq: '/faq/', changelog: '/changelog/', blog: '/blog/', post: '/blog/introducing-napwake/', 'scan-report': '/examples/scan-report/', '404': '/no-such-room/' };
const pages = args.filter((a) => !a.startsWith('--'));
const want = pages.length ? pages : Object.keys(PAGES);
const VARIANTS = {
  'desktop-light': { width: 1440, height: 900, scale: 1, mobile: false, scheme: 'light' },
  'desktop-dark': { width: 1440, height: 900, scale: 1, mobile: false, scheme: 'dark' },
  'tablet-light': { width: 834, height: 1112, scale: 1, mobile: true, scheme: 'light' },
  'tablet-dark': { width: 834, height: 1112, scale: 1, mobile: true, scheme: 'dark' },
  'phone-light': { width: 390, height: 844, scale: Number(process.env.PHONE_SCALE || 1), mobile: true, scheme: 'light' },
  'phone-dark': { width: 390, height: 844, scale: Number(process.env.PHONE_SCALE || 1), mobile: true, scheme: 'dark' },
};
const variants = opt.only ? opt.only.split(',') : Object.keys(VARIANTS).filter((v) => !v.startsWith('tablet'));
const out = resolve(root, opt.out || 'screens');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.txt': 'text/plain' };

// a static server for dist/, with the site's 404 page for unknown paths, as GitHub Pages does
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, p);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = null; }
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { try { res.writeHead(404, { 'content-type': 'text/html' }); res.end(await readFile(join(dist, '404.html'))); } catch { res.writeHead(404); res.end('not found'); } }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'napwake-screens-' + port)}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 50 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
if (!version) throw new Error('Chrome did not start');

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0; const wait = new Map(); const listeners = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const { ok, no } = wait.get(d.id); wait.delete(d.id); d.error ? no(new Error(d.error.message)) : ok(d.result); } else listeners.forEach((l) => l(d)); };
  const ready = new Promise((r) => (ws.onopen = r));
  return {
    ready,
    send: (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; wait.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); }),
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  };
}
const c = cdp(version.webSocketDebuggerUrl);
await c.ready;
await mkdir(out, { recursive: true });

for (const page of want) {
  for (const v of variants) {
    const V = VARIANTS[v];
    const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => c.send(m, p, sessionId);
    await s('Page.enable'); await s('Runtime.enable');
    await s('Emulation.setDeviceMetricsOverride', { width: V.width, height: V.height, deviceScaleFactor: V.scale, mobile: V.mobile });
    const features = [{ name: 'prefers-color-scheme', value: V.scheme }, { name: 'prefers-reduced-motion', value: opt.motion === 'reduce' ? 'reduce' : 'no-preference' }];
    await s('Emulation.setEmulatedMedia', { features });
    const loaded = new Promise((r) => c.on((d) => d.sessionId === sessionId && d.method === 'Page.loadEventFired' && r()));
    await s('Page.navigate', { url: base + PAGES[page] + (opt.query || '') });
    await loaded;
    await s('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
    await sleep(Number(opt.wait || 900));
    const { result } = await s('Runtime.evaluate', { expression: 'Math.ceil(document.documentElement.scrollHeight)', returnByValue: true });
    // --clip=N keeps the top N px (the header, say); otherwise the whole page
    const h = opt.clip ? Number(opt.clip) : Math.min(result.value, 16000);
    await s('Emulation.setDeviceMetricsOverride', { width: V.width, height: h, deviceScaleFactor: V.scale, mobile: V.mobile });
    // --settle=ms waits after the page is laid out at full height, for what plays when it comes into view
    await sleep(Number(opt.settle || 300));
    // --format=webp writes WebP (the site's own preview images); PNG otherwise
    const format = opt.format === 'webp' ? 'webp' : 'png';
    const shot = await s('Page.captureScreenshot', { format, quality: format === 'webp' ? 82 : undefined, captureBeyondViewport: true, clip: { x: 0, y: 0, width: V.width, height: h, scale: 1 } });
    const name = `${opt.prefix || ''}${page}-${v}${opt.motion === 'reduce' ? '-still' : ''}.${format}`;
    await writeFile(join(out, name), Buffer.from(shot.data, 'base64'));
    console.log(`${name}  ${V.width}x${h}`);
    // --slices=DIR also writes the page in screen-sized pieces, to look at closely
    if (opt.slices) {
      await mkdir(opt.slices, { recursive: true });
      const step = V.mobile ? 1400 : 1000;
      for (let y = 0, n = 0; y < h; y += step, n++) {
        const piece = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: V.width, height: Math.min(step, h - y), scale: V.mobile && V.scale > 1 ? 1 / V.scale : 1 } });
        await writeFile(join(opt.slices, `${page}-${v}-${n}.png`), Buffer.from(piece.data, 'base64'));
      }
    }
    await c.send('Target.closeTarget', { targetId });
  }
}
c.close(); chrome.kill(); server.close();
