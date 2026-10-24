// The docs' pages on GitHub, for docs links while docs.napwake.dev waits for the product's next release
// (NAPWAKE_DOCS_MODE=github, src/lib/links.mjs). Reads every page under docs/ on the product's origin/main
// (read-only: git show), and gives each heading two anchors: the docs site's, by MkDocs' rules (attr_list's
// { #id } included), and GitHub's, by GitHub's rules. A link to a docs page and heading then finds the same
// heading on GitHub, or no anchor at all.
//   node scripts/sync-docs-map.mjs            writes src/content/docs-github.json
//   node scripts/sync-docs-map.mjs --verify   then checks every anchor against GitHub's own rendering
// Commit src/content/docs-github.json; the build only reads it.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
// the product's local checkout, which keeps its old folder name
const repo = process.env.NAPWAKE_PRODUCT || join(homedir(), 'Workspace/experiments/hybernate');
const [owner, name] = (process.env.NAPWAKE_GITHUB || 'napwake/napwake').split('/');
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

const commit = git('rev-parse', 'origin/main').trim();
const files = git('ls-tree', '-r', '--name-only', 'origin/main', 'docs/').split('\n').filter((f) => f.endsWith('.md'));

// A heading's words as both sites read them: code spans' text, link text, no emphasis, tags or escapes.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function words(md) {
  const code = [];
  return md
    .replace(/(`+)\s?(.+?)\s?\1/g, (_, __, c) => `\u0000${code.push(c) - 1}\u0000`)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|\W)[*_](.+?)[*_](?=\W|$)/g, '$1$2')
    .replace(/\\([!-/:-@[-`{-~])/g, '$1')
    .replace(/&(\w+);/g, (m, e) => ENTITIES[e] ?? m)
    .replace(/\u0000(\d+)\u0000/g, (_, i) => code[i]);
}

// MkDocs: Python-Markdown's toc slugify (ASCII only, punctuation dropped, runs of spaces and hyphens as one
// hyphen), and _1, _2 for repeats
const mkdocsSlug = (s) => s.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[-\s]+/g, '-');
// GitHub: lowercased, everything but letters, marks, numbers, underscores, hyphens and spaces dropped, each
// space a hyphen, and -1, -2 for repeats
const githubSlug = (s) => s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-');

function headings(text) {
  const out = [];
  let fence = null;
  for (const line of text.split('\n')) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length && !line.trim().slice(f[1].length).trim()) fence = null;
      continue;
    }
    if (fence) continue;
    const h = line.match(/^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/);
    if (h) out.push(h[1]);
  }
  return out;
}

function anchors(text) {
  const md = new Set(), gh = new Map(), map = {};
  const parsed = headings(text).map((raw) => {
    const attr = raw.match(/\s*\{:?\s*([^}]*)\}\s*$/);
    const id = attr?.[1].match(/(?:^|\s)#([\w-]+)/)?.[1];
    return { raw, id, plain: words(attr ? raw.slice(0, attr.index) : raw) };
  });
  // Python-Markdown keeps the ids written by hand, and numbers its own around them
  for (const p of parsed) if (p.id) md.add(p.id);
  for (const p of parsed) {
    let m = p.id;
    if (!m) {
      m = mkdocsSlug(p.plain);
      while (md.has(m) || !m) { const n = m.match(/^(.*)_(\d+)$/); m = n ? `${n[1]}_${Number(n[2]) + 1}` : `${m}_1`; }
      md.add(m);
    }
    // GitHub doesn't read attr_list, so its anchor comes from the heading as written, braces and all
    const base = githubSlug(words(p.raw));
    let g = base;
    while (gh.has(g)) { gh.set(base, gh.get(base) + 1); g = `${base}-${gh.get(base)}`; }
    gh.set(g, 0);
    map[m] = g;
  }
  return map;
}

const pages = {};
for (const file of files) {
  const path = file.replace(/^docs\//, '').replace(/\.md$/, '').replace(/(^|\/)index$/, '');
  pages[path] = { file, anchors: anchors(git('show', `origin/main:${file}`)) };
}
const out = {
  source: `github.com/${owner}/${name}@${commit.slice(0, 7)}`,
  base: `https://github.com/${owner}/${name}/blob/main/`,
  pages,
};
await writeFile(join(site, 'src/content/docs-github.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`src/content/docs-github.json: ${files.length} pages from ${out.source}`);

// GitHub's own rendering of each page, at the same commit: every anchor here must be one of its headings'.
if (process.argv.includes('--verify')) {
  const headers = { Accept: 'application/vnd.github.html', 'User-Agent': 'napwake.dev build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let bad = 0;
  for (const [path, p] of Object.entries(pages)) {
    const r = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${p.file}?ref=${commit}`, { headers });
    if (!r.ok) { console.error(`${p.file}: GitHub API ${r.status}`); bad++; continue; }
    const html = await r.text();
    const ids = new Set([...html.matchAll(/id="user-content-([^"]+)"/g)].map((m) => decodeURIComponent(m[1])));
    const ours = new Set(Object.values(p.anchors));
    const missing = [...ours].filter((a) => !ids.has(a));
    const extra = [...ids].filter((a) => !ours.has(a));
    if (missing.length) { bad++; console.error(`${p.file}: not on GitHub: ${missing.join(', ')}`); }
    if (extra.length) console.warn(`${p.file}: on GitHub, not here (no docs-site heading): ${extra.join(', ')}`);
    if (!missing.length) console.log(`${p.file}: ${ours.size} anchors, all on GitHub`);
  }
  if (bad) process.exit(1);
}
