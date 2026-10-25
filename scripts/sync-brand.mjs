// Copies the brand's files into the site, so the site builds on its own.
//   tokens and logo: from the brand repository (github.com/napwake/brand), a sibling folder
//   fonts and the rig that draws the doorman and the doors: from the design system (napwake/design-system), a sibling folder
// Run it again whenever the brand changes: npm run sync-brand
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = process.env.NAPWAKE_BRAND || join(site, '..', 'brand');
const system = process.env.NAPWAKE_DESIGN_SYSTEM || join(site, '..', 'design-system');

const copy = (from, to) => { mkdirSync(dirname(to), { recursive: true }); cpSync(from, to); console.log(`${from} -> ${to.replace(site + '/', '')}`); };
const copyDir = (from, to, keep = () => true) => { for (const f of readdirSync(from)) if (keep(f)) copy(join(from, f), join(to, f)); };

copy(join(brand, 'tokens/tokens.css'), join(site, 'src/styles/tokens.css'));
copyDir(join(brand, 'logo'), join(site, 'public/media/logo'), (f) => f.endsWith('.svg'));
copy(join(brand, 'logo/favicon.svg'), join(site, 'public/favicon.svg'));
copyDir(join(system, 'project/fonts'), join(site, 'public/fonts'));
copy(join(system, 'project/licenses/OFL-1.1.txt'), join(site, 'public/fonts/OFL-1.1.txt'));
for (const f of ['doorman.mjs', 'scene.mjs']) copy(join(system, 'character/src', f), join(site, 'src/lib/rig', f));
