// /site.webmanifest: the name, the icons (scripts/icons.mjs), and two colours from the brand's tokens,
// Coat for the theme and Paper for the ground.
import tokens from '../styles/tokens.css?raw';
import { NAME } from '../lib/site.mjs';

const token = (name) => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'));
  if (!m) throw new Error(`[napwake] no --${name} colour in src/styles/tokens.css`);
  return m[1];
};

export function GET() {
  const manifest = {
    name: NAME,
    short_name: NAME,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: token('coat'),
    background_color: token('paper'),
  };
  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, { headers: { 'Content-Type': 'application/manifest+json' } });
}
