// Napwake's releases for /changelog/, from the product's CHANGELOG.md (Keep a Changelog) and its published
// GitHub releases, both synced by scripts/sync-changelog.mjs. Versions from 0.2.0 on: the 0.1.x releases
// were early experiments, under the old name, and 0.2.0 is the relaunch. A version shows once it's released,
// or, before that, while it has published release candidates, labelled as such. A release's date is the one
// GitHub published it on, where it did.
import raw from '../content/CHANGELOG.md?raw';
import published from '../content/releases.json';
import { REPO_NOW } from './links.mjs';
import { NOTES } from './release-notes.mjs';

export const FIRST = '0.2.0';
const ORDER = ['Security', 'Added', 'Changed', 'Deprecated', 'Removed', 'Fixed'];
const ABOUT = {
  Security: 'What closes a way in, or narrows what something may do.',
  Added: 'New in this release.',
  Changed: 'Behaviour that’s different now.',
  Deprecated: 'Still here, going later.',
  Removed: 'Gone in this release.',
  Fixed: 'What used to go wrong.',
  Renamed: 'Each old name, and the new one.',
};

const num = (v) => v.split(/[.-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : x));
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const link = (_, text, href) => `<a href="${href}">${text}</a>`;
export const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, link)
  .replace(/\(#(\d+)\)/g, `(<a href="${REPO_NOW}/issues/$1">#$1</a>)`);
const plain = (s) => s.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
// a Markdown table's row, as cells
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));

// An entry's lead, so a long list scans: the words before its first colon (outside code), or its first
// sentence when that's short; the rest is the entry's full text, shown when it's opened.
function split(text) {
  let tick = false;
  for (let i = 0; i < Math.min(text.length, 110); i++) {
    if (text[i] === '`') tick = !tick;
    if (!tick && text[i] === ':' && text[i + 1] === ' ' && i > 2) return { lead: text.slice(0, i), sep: ':', rest: text.slice(i + 2) };
  }
  const dot = text.search(/\. [A-Z`]/);
  if (dot > 20 && dot < 150) return { lead: text.slice(0, dot + 1), sep: '', rest: text.slice(dot + 2) };
  return { lead: null, sep: '', rest: text };
}
const words = (s) => plain(s).split(/\s+/).length;
const preview = (s, n = 150) => { const p = plain(s); return p.length > n ? `${p.slice(0, p.lastIndexOf(' ', n))}…` : p; };

function entry(text, version, section, i) {
  const { lead, sep, rest } = split(text);
  return {
    id: `v${version.replace(/\./g, '-')}-${section.toLowerCase()}-${i + 1}`,
    raw: text,
    lead: lead && inline(lead) + sep,
    leadOnly: lead && inline(lead),
    rest: inline(rest),
    preview: preview(rest),
    long: words(text) > 40,
    search: plain(text).toLowerCase(),
    children: [],
  };
}

function parse(text) {
  const out = [];
  let rel = null, sec = null, last = null;
  for (const line of text.split('\n')) {
    const h2 = line.match(/^## \[([^\]]+)\](?:\s*-\s*(.+))?/);
    if (h2) {
      const [, version, when = ''] = h2;
      rel = /^\d+\.\d+\.\d+$/.test(version) ? { version, date: /^\d{4}-\d{2}-\d{2}$/.test(when.trim()) ? when.trim() : null, intro: [], sections: [] } : null;
      if (rel) out.push(rel);
      sec = null; last = null; continue;
    }
    if (!rel) continue;
    const h3 = line.match(/^### (.+)/);
    if (h3) { sec = { name: h3[1].trim(), items: [], blocks: [] }; rel.sections.push(sec); last = null; continue; }
    const top = line.match(/^- (.+)/), sub = line.match(/^\s{2,}- (.+)/);
    if (sec && top) { last = entry(top[1], rel.version, sec.name, sec.items.length); sec.items.push(last); continue; }
    if (sec && sub && last) { last.children.push(inline(sub[1])); last.search += ' ' + plain(sub[1]).toLowerCase(); last.long = true; continue; }
    // a section's own words and tables, such as 0.2.0's Renamed: a paragraph runs to the next blank line
    if (sec && !sec.items.length) {
      const b = sec.blocks.at(-1);
      if (!line.trim()) { if (b) b.open = false; continue; }
      if (line.trim().startsWith('|')) {
        if (/^\|[\s|:-]+\|$/.test(line.trim())) continue;
        if (b?.type === 'table' && b.open) b.rows.push(cells(line)); else sec.blocks.push({ type: 'table', head: cells(line), rows: [], open: true });
        continue;
      }
      if (b?.type === 'p' && b.open) b.html += ' ' + inline(line.trim()); else sec.blocks.push({ type: 'p', html: inline(line.trim()), open: true });
      continue;
    }
    if (!sec && line.trim() && !line.startsWith('<!--')) rel.intro.push(inline(line.trim()));
  }
  return out;
}

const tags = published.releases;
// the date GitHub published a release on, else the CHANGELOG's
const publishedOn = (version, date) => (date && tags.find((t) => t.tag === `v${version}`)?.date) || date;
const all = parse(raw).map((r) => ({ ...r, date: publishedOn(r.version, r.date) }));
const rcsOf = (v) => tags.filter((t) => t.tag.startsWith(`v${v}-rc.`)).map((t) => ({ ...t, url: `${REPO_NOW}/releases/tag/${t.tag}` })).sort((a, b) => num(b.tag.slice(1)).at(-1) - num(a.tag.slice(1)).at(-1));

export const RELEASES = all
  .filter((r) => cmp(r.version, FIRST) >= 0)
  .map((r) => {
    const rcs = rcsOf(r.version);
    const notes = NOTES[r.version] || {};
    // an entry held off the page until its fix ships (release-notes.mjs)
    const held = (it) => (notes.held || []).some((h) => it.raw.startsWith(h));
    // sections of words, not entries, such as Renamed: shown before the changes, in the CHANGELOG's order
    const prose = r.sections.filter((s) => !s.items.length && s.blocks.length).map((s) => ({ ...s, about: ABOUT[s.name] || '', key: s.name.toLowerCase() }));
    const sections = r.sections
      .map((s) => ({ ...s, items: s.items.filter((it) => !held(it)) }))
      .filter((s) => s.items.length)
      .sort((a, b) => (ORDER.indexOf(a.name) + 99) % 99 - (ORDER.indexOf(b.name) + 99) % 99)
      .map((s) => ({ ...s, about: ABOUT[s.name] || '', key: s.name.toLowerCase() }));
    const items = sections.flatMap((s) => s.items);
    const highlights = (notes.highlights || []).map((h) => ({ ...h, to: items.find((it) => it.raw.startsWith(h.entry))?.id }));
    return {
      ...r,
      prose,
      sections,
      count: items.length,
      status: r.date ? 'released' : rcs.length ? 'rc' : 'unreleased',
      rc: rcs[0] || null,
      rcs,
      summary: (notes.summary || []).map(inline),
      highlights,
      id: `v${r.version.replace(/\./g, '-')}`,
    };
  })
  .filter((r) => r.status !== 'unreleased')
  .sort((a, b) => cmp(b.version, a.version));

// the 0.1.x releases, for one line at the bottom of the page
const early = all.filter((r) => cmp(r.version, FIRST) < 0 && r.date).sort((a, b) => cmp(a.version, b.version));
export const EARLY = early.length ? { first: early[0], last: early.at(-1) } : null;

// the newest published tag, for the header's version pill
export const LATEST_TAG = tags.length ? [...tags].sort((a, b) => b.date.localeCompare(a.date) || b.tag.localeCompare(a.tag, 'en', { numeric: true }))[0] : null;
export const SOURCE = published.source;
