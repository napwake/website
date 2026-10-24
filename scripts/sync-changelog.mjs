// Copies the product's CHANGELOG.md into the site as it is, and the list of published releases, for /changelog/.
//   node scripts/sync-changelog.mjs                 from the product repo's origin/main (read-only: git show)
//   node scripts/sync-changelog.mjs --url=<raw URL>  from GitHub, such as
//     https://raw.githubusercontent.com/napwake/napwake/main/CHANGELOG.md
// Commit src/content/CHANGELOG.md and src/content/releases.json; the build only reads them.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv.find((a) => a.startsWith('--url='))?.slice(6);
// the product's local checkout, which keeps its old folder name
const repo = process.env.NAPWAKE_PRODUCT || join(homedir(), 'Workspace/experiments/hybernate');

const source = url
  ? await (await fetch(url)).text()
  : execFileSync('git', ['-C', repo, 'show', 'origin/main:CHANGELOG.md'], { encoding: 'utf8' });
const commit = url ? url : execFileSync('git', ['-C', repo, 'rev-parse', '--short', 'origin/main'], { encoding: 'utf8' }).trim();

// No names are changed. The product's CHANGELOG says Napwake from 0.2.0 on. The old names left in it are
// history: 0.2.0's Renamed table and the 0.1.x entries. Renaming those would print names that never
// existed, such as ghcr.io/napwake/hybernate. An old name anywhere else in 0.2.0 or later is reported here,
// to fix in the product.
const OLD = /hybernate|okedeji/i;
let version = null, section = null;
const stray = [];
source.split('\n').forEach((line, i) => {
  const h2 = line.match(/^## \[([^\]]+)\]/);
  if (h2) { version = h2[1]; section = null; return; }
  const h3 = line.match(/^### (.+)/);
  if (h3) { section = h3[1].trim(); return; }
  const [major = 0, minor = 0] = (version || '').split('.').map(Number);
  const current = version === 'Unreleased' || major > 0 || minor >= 2;
  if (version && current && section !== 'Renamed' && OLD.test(line)) stray.push(`  line ${i + 1}: ${line.slice(0, 100)}`);
});
if (stray.length) console.warn(`old names outside 0.2.0's Renamed section, to fix in the product's CHANGELOG:\n${stray.join('\n')}`);

// Published releases and release candidates, from GitHub's releases (what's really out); a tag that exists
// only locally isn't one. Falls back to the local tags, with their dates, if the API can't be read.
const [owner, name] = (process.env.NAPWAKE_GITHUB || 'napwake/napwake').split('/');
let releases;
try {
  const headers = { 'User-Agent': 'napwake.dev build', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${owner}/${name}/releases?per_page=100`, { headers, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`GitHub API ${r.status}`);
  releases = (await r.json()).filter((x) => !x.draft).map((x) => ({ tag: x.tag_name, date: x.published_at.slice(0, 10), prerelease: x.prerelease, url: x.html_url }));
} catch (e) {
  console.warn(`releases from local tags: ${e.message}`);
  const lines = execFileSync('git', ['-C', repo, 'for-each-ref', '--sort=-creatordate', '--format=%(refname:short) %(creatordate:short)', 'refs/tags'], { encoding: 'utf8' }).trim().split('\n');
  releases = lines.map((l) => { const [tag, date] = l.split(' '); return { tag, date, prerelease: tag.includes('-'), url: `https://github.com/${owner}/${name}/releases/tag/${tag}` }; });
}
await writeFile(join(site, 'src/content/releases.json'), JSON.stringify({ source: `github.com/${owner}/${name}`, releases }, null, 2) + '\n');
console.log(`src/content/releases.json: ${releases.map((r) => r.tag).join(', ')}`);

const out = join(site, 'src/content/CHANGELOG.md');
await writeFile(out, `<!-- Synced from the product's CHANGELOG.md (${commit}) by scripts/sync-changelog.mjs. Don't edit here. -->\n${source}`);
console.log(`src/content/CHANGELOG.md from ${commit}`);
