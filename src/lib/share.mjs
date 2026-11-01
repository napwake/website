// The share link (the loop, step 2, 2026-10-31). The report on the engineer's laptop writes the numbers its share
// card shows into a link, and napwake.dev draws the page from them in the reader's browser. Nothing else is in it,
// never a name, and nothing is sent anywhere but the page request itself.
//   scan:   /s/<P>/?v=1&with=<W>&without=<WO>&src=<H>       P is .Could.Percent, W and WO .Could.With and .Without in
//           dollars a month, H the days of Prometheus history or 0 for a snapshot
//   status: /s/less-<P>/?v=1&bill=<B>&without=<WO>&days=<D>&saved=<S>  P is .Month.SavedPercent, B, WO and S
//           .Month.Bill, .Without and .Saved, D the days counted. saved is optional: without it, a settled month
//           has no line under the amounts
// Each percentage has its own page, built with the site, so each has its own preview card. The page shows the
// percentage alone when the rest is missing, unreadable or doesn't agree with it, and /s/ when there's no page.
// Plain module, no imports: the pages, the browser and scripts/share-cards.mjs all read it.

export const VERSION = '1';
export const LOW = 1;
export const HIGH = 100;
export const SITE_NAME = 'napwake.dev';
// The docs' Scan your cluster page goes live with 0.2.0's docs, Thu 5 Nov. Until then, the plugin page's section
// on scanning, which is live. Then 'getting-started/scan'.
export const SCAN_DOC = 'getting-started/kubectl-plugin#scan-a-cluster';

// Every word the pages and cards show, in one place. The scan's and the status page's own words are the product's
// (cmd/kubectl-napwake/report.html and statuspage.html at origin/main bb703d29: #card-data, .pace-fig, .pace-early).
export const WORDS = {
  scan: {
    eyebrow: 'Workload scan',
    title: (p) => `These workloads could cost ${p}% less, paused when idle`,
    // under the percentage when there are no amounts, read on from it: "76% less a month, for these workloads ..."
    alone: 'a month, for these workloads paused when idle.',
    label: (w, wo) => `Paused when idle, these workloads could cost about ${w} a month instead of ${wo}.`,
    // under the result. "Read-only." is the commands' line beside it, so the screen says it once (brief B2)
    private: 'Only these numbers left the laptop that scanned.',
    same: 'kubectl napwake scan',
    sameText: 'shows the full report, by workload.',
    pose: 'rounds',
  },
  status: {
    eyebrow: 'Status',
    title: (p) => `These workloads cost ${p}% less with Napwake, at this month’s pace`,
    alone: 'a month for the workloads Napwake manages, at this month’s pace.',
    label: (b, wo) => `${b} a month instead of ${wo}, at this month’s pace.`,
    early: (d) => `${d} ${d === 1 ? 'day' : 'days'} counted. It settles after a week.`,
    settled: (s) => `Nodes scaling down take at least ${s} a month off the bill.`,
    private: 'Only these numbers left the laptop that read the cluster.',
    same: 'kubectl napwake status',
    sameText: 'shows the full status, by workload.',
    pose: 'duty',
  },
  empty: {
    eyebrow: 'Workload scan',
    title: () => 'See what’s idle in your cluster',
    statement: 'See what’s idle in your cluster',
    // the card's line under it, from the docs' scan section
    label: 'What’s idle, what it costs, and what pausing it could free.',
    none: 'There’s no result at this address. A share link carries one cluster’s numbers, and this one has none.',
    pose: 'rounds',
  },
  // the percentage alone: what the link held, never more
  privateAlone: 'A share link carries only numbers, never a name.',
  broken: 'The rest of this link didn’t read, so it shows the percentage alone.',
  // what the card and the page lead to
  install: 'brew install napwake/tap/kubectl-napwake',
  scanCmd: 'kubectl napwake scan',
  // Beside the result, what Napwake is and how to see your own: the home page's hero, word for word (branch
  // design/loop-hero: src/lib/site.mjs HEADLINE and TRY, index.astro's read-only and Homebrew lines, Tobi
  // 2026-10-31). The eyebrow is the hero's "Open source" with the product's name, since the headline doesn't say it.
  eyebrow: 'Napwake · Open source',
  headline: 'Pause idle Kubernetes workloads in staging, preview and dev. Wake them on the first request.',
  try: 'Try it before you install anything. One scan shows what your idle workloads cost.',
  steps: ['Install the kubectl plugin', 'Scan your cluster'],
  bar: 'Install the plugin, then scan',
  readOnly: 'Nothing runs on your cluster.',
  brew: 'Homebrew, on macOS and Linux',
  same: 'Same cluster?',
  other: 'Other ways',
  // the card's floor, as the product's scan card says it (#card-data's data-hook-note, and the card's own label)
  hookLabel: 'See your own',
  hookNote: 'nothing to install in the cluster',
  scanButton: 'Scan your cluster',
};

// The description each page gives search engines and chats. Words from the docs' scan section
// (getting-started/kubectl-plugin.mdx, "Find what's idle, what it costs, and what pausing it could free").
export const DESCRIPTION = {
  scan: 'One cluster’s workload scan, shared as numbers only. See yours with kubectl napwake scan. It’s read-only, with nothing to install in the cluster.',
  status: 'One cluster’s Napwake status, shared as numbers only. See yours with kubectl napwake scan. It’s read-only, with nothing to install in the cluster.',
  empty: 'kubectl napwake scan shows what’s idle in your cluster, what it costs, and what pausing it could free. It’s read-only, with nothing to install in the cluster.',
};

// The path for a percentage, and the card's file name under /og/s/.
export const path = (kind, p) => (kind === 'empty' ? '/s/' : `/s/${kind === 'status' ? 'less-' : ''}${p}/`);
export const cardName = (kind, p) => (kind === 'empty' ? 'index' : `${kind === 'status' ? 'less-' : ''}${p}`);

// Money as the product writes it. The status page's month, money(): to the cent under $100, whole dollars with
// thousands separated from $100, <$0.01 above zero but under a cent, and $0 only for none. The scan's before and
// after, dollars() (couldFor() in report.go): whole dollars with thousands separated, <$1 above zero but under
// half a dollar, and $0 only for none. One number for one thing: the page writes each as its card does.
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export function money(amount) {
  if (amount > 0 && amount < 0.01) return '<$0.01';
  const cents = Math.round(amount * 100);
  if (cents === 0) return '$0';
  if (cents < 100 * 100) return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  return `$${thousands(Math.round(amount))}`;
}
export function dollars(amount) {
  if (amount > 0 && amount < 0.5) return '<$1';
  return `$${thousands(Math.round(amount))}`;
}

// How much history, as the product says it (discovery.spelled() and replayedOver()): minutes under an hour, hours
// under two days, then days, "the last 7 days", "the last hour". Zero is a snapshot.
const plural = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`;
export function history(days) {
  if (!(days > 0)) return 'a snapshot, without history';
  const hours = days * 24, minutes = Math.round(hours * 60);
  const span = minutes < 60 ? plural(Math.max(minutes, 1), 'minute') : Math.round(hours) < 48 ? plural(Math.round(hours), 'hour') : plural(Math.round(hours / 24), 'day');
  return `the last ${span.replace(/^1 /, '')} of Prometheus history`;
}

// A number in the link: digits only, as the report writes them, and how precisely it's written, so a percentage
// worked out from rounded amounts can be checked with their rounding.
const AMOUNT = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;   // dollars, up to $99,999,999.99
const SPAN = /^(0|[1-9]\d{0,3})(\.\d{1,4})?$/;     // days of history: four places under an hour, so a minute reads
const COUNT = /^(0|[1-9]\d?)$/;                     // whole days counted this month
function read1(q, key, re) {
  const all = q.getAll(key);
  if (all.length !== 1 || !re.test(all[0])) return null;
  const places = (all[0].split('.')[1] || '').length;
  return { n: Number(all[0]), e: 0.5 * 10 ** -places };
}

// Whether `after` a month instead of `before` can be p% less, with each amount anywhere it rounds from, and p
// rounded half up as the product rounds it (freeableShare(), math.Round). An edited amount that no longer agrees
// with the page's percentage falls back to the percentage alone, so a page never shows two figures that disagree.
export function agrees(p, after, before) {
  const lo = before.n - before.e, hi = before.n + before.e;
  if (lo <= 0 || after.n > before.n) return false;
  const least = 1 - (after.n + after.e) / lo, most = 1 - Math.max(0, after.n - after.e) / hi;
  return most * 100 >= p - 0.5 - 1e-9 && least * 100 < p + 0.5 + 1e-9;
}

const OURS = ['v', 'with', 'without', 'src', 'bill', 'days', 'saved'];

// What a page shows for its query. state: 'alone' (no numbers: the percentage alone), 'broken' (numbers that
// didn't read: the percentage alone, and a note), or 'full'. Keys that aren't ours, such as a chat's tracking
// tags, are left alone.
export function readLink(kind, p, search) {
  const q = new URLSearchParams(search || '');
  if (!OURS.some((k) => q.has(k))) return { state: 'alone' };
  const broken = { state: 'broken' };
  if (q.getAll('v').length !== 1 || q.get('v') !== VERSION) return broken;
  if (kind === 'scan') {
    const w = read1(q, 'with', AMOUNT), wo = read1(q, 'without', AMOUNT), h = read1(q, 'src', SPAN);
    if (!w || !wo || !h || h.n > 3650 || !agrees(p, w, wo)) return broken;
    const t = WORDS.scan;
    return { state: 'full', label: t.label(dollars(w.n), dollars(wo.n)), source: history(h.n), detail: null };
  }
  const b = read1(q, 'bill', AMOUNT), wo = read1(q, 'without', AMOUNT), d = read1(q, 'days', COUNT);
  if (!b || !wo || !d || d.n > 31 || !agrees(p, b, wo)) return broken;
  // saved is optional, but once there it must read, and can't be more than the month without Napwake
  const hasSaved = q.has('saved'), s = hasSaved ? read1(q, 'saved', AMOUNT) : null;
  if (hasSaved && (!s || s.n > wo.n)) return broken;
  const t = WORDS.status;
  // the card's line under the amounts (statuspage.html #card-data data-detail): Early for the first week, then
  // what nodes scaling down take off the bill, when the link says
  const detail = d.n < 7 ? { lead: 'Early:', text: t.early(d.n) } : s ? { lead: '', text: t.settled(money(s.n)) } : null;
  return { state: 'full', label: t.label(money(b.n), money(wo.n)), source: null, detail };
}
