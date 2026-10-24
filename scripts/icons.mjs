// The site's icons, from the brand's own logo files (public/media/logo, synced by scripts/sync-brand.mjs),
// rendered with headless Chrome:
//   favicon.ico            16 px from favicon-16.svg, the 16-pixel cut; 32 and 48 px from favicon-32.svg
//   apple-touch-icon.png   180 px, the avatar (avatar-500.svg, on Lamp): iOS fills a clear corner in black
//   icon-192.png, icon-512.png   the avatar, for site.webmanifest and the Organization logo
// favicon.svg, the one browsers use first, is the brand's own file, as it is.
//   node scripts/icons.mjs   (commit the files; the build only copies them)
import { writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logo = (f) => join(root, 'public/media/logo', f);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// headless Chrome over its DevTools protocol, as scripts/cards.mjs does
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'napwake-icons-' + port)}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 50 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0; const wait = new Map(); const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(d.error.message)) : w.ok(d.result); } else events.forEach((f) => f(d)); };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; wait.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

// one SVG at size x size CSS pixels, one device pixel each, on a clear ground
async function png(svg, size) {
  const file = join(tmpdir(), `napwake-icon-${size}.html`);
  await writeFile(file, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style></head><body><img src="${pathToFileURL(logo(svg)).href}" alt=""></body></html>`);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: Math.max(size, 64), height: Math.max(size, 64), deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId);
  const loaded = new Promise((r) => events.push((d) => d.sessionId === sessionId && d.method === 'Page.loadEventFired' && r()));
  await send('Page.navigate', { url: pathToFileURL(file).href }, sessionId);
  await loaded;
  await sleep(150);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } }, sessionId);
  await send('Target.closeTarget', { targetId });
  return Buffer.from(shot.data, 'base64');
}

// An ICO of PNG images, which every current browser reads: a 6-byte header, a 16-byte entry per image.
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e); head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(data.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((im) => im.data)]);
}

const out = (f, data) => writeFile(join(root, 'public', f), data).then(() => console.log(`public/${f}`));
const icons = [{ size: 16, data: await png('favicon-16.svg', 16) }, { size: 32, data: await png('favicon-32.svg', 32) }, { size: 48, data: await png('favicon-32.svg', 48) }];
await out('favicon.ico', ico(icons));
await out('apple-touch-icon.png', await png('avatar-500.svg', 180));
await out('icon-192.png', await png('avatar-500.svg', 192));
await out('icon-512.png', await png('avatar-500.svg', 512));
ws.close(); chrome.kill();
