// The example cluster's scan, read from the example report the product's own code rendered
// (public/examples/scan-report/, from scripts/render-scan-example.sh, on made-up data). The share card's words
// come from its #card-data, as the report's card reads them. The building's rooms are counted as the report's
// script counts them: each workload row by its state, plus the ones it couldn't judge. One source, so the hero,
// the report and the terminal on the home page agree, and change together when the example is rendered again.
import { plan } from './rig/scene.mjs';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", middot: '·', nbsp: ' ' };
const decode = (s) => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);

export function readScan(html) {
  const cardTag = html.match(/<div hidden id="card-data"([^>]*)>/);
  if (!cardTag) throw new Error('scan-example: the example report has no #card-data');
  const card = (name) => decode(cardTag[1].match(new RegExp(`\\bdata-${name}="([^"]*)"`))?.[1] ?? '');

  // the workloads table, row by row: its state, and whether Napwake won't pause it (data-stays)
  const start = html.indexOf('id="workloads"');
  const table = html.slice(start, html.indexOf('</table>', start));
  const counts = { idle: 0, active: 0, paused: 0, unjudged: 0 };
  let stays = 0;
  for (const [, attrs, state] of table.matchAll(/<tr id="wl-\d+"([^>]*)>[\s\S]*?class="state (\w+)/g)) {
    if (state in counts) counts[state]++;
    if (state === 'idle' && /\bdata-stays\b/.test(attrs)) stays++;
  }
  counts.unjudged = Number(html.match(/data-bldg="scan"[^>]*data-unjudged="(\d+)"/)?.[1] || 0);
  const total = counts.idle + counts.active + counts.paused + counts.unjudged;

  // the building, placed as the report places it (its plan(), seed 11), in the rig's room kinds
  const kinds = [
    { k: 'idle', n: counts.idle, stays },
    { k: 'active', n: counts.active },
    { k: 'asleep', n: counts.paused },
    { k: 'other', n: counts.unjudged },
  ];
  const fmt = (n) => n.toLocaleString('en-US');
  return {
    eyebrow: card('eyebrow'),
    // the report's statement, as its script writes it
    statement: `${fmt(counts.idle)} of ${fmt(total)} ${total === 1 ? 'workload' : 'workloads'} ${counts.idle === 1 ? 'is' : 'are'} running with no sign of use.`,
    value: card('value'),
    label: card('label'),
    // the card's source line: the count, then the report's own words
    source: `${fmt(total)} ${total === 1 ? 'workload' : 'workloads'} · ${card('source')}`,
    counts, stays, total, kinds,
    goers: counts.idle - stays,
    plan: plan(kinds, 11),
  };
}
