// The facts every surface says in the same words: the brand guidelines' headline and plain line, and
// the product docs (origin/main 4f35500, 2026-10-22). Pages, llms.txt, the JSON-LD and the social
// cards all read them from here, so the website, the README and the docs agree.
import { SITE, DOCS, doc } from './links.mjs';

// The announcement bar: its id is what a visitor's dismissal remembers, so a new announcement shows again.
// It must stay true: 0.2.0 is in release candidates until it ships.
export const ANNOUNCEMENT = { id: 'v0.2.0-rc', text: 'Napwake 0.2.0 is in release candidates', link: { href: '/changelog/', label: 'Read the changelog' } };

// Cloudflare Web Analytics' beacon, on every page when PUBLIC_CF_BEACON_TOKEN is set at build time (the deploy
// workflow sets it), and off otherwise (Base.astro). The token is public by design. /privacy/ says what it
// collects only when it's on.
export const CF_BEACON = (globalThis.process?.env?.PUBLIC_CF_BEACON_TOKEN || '').trim() || null;

export const NAME = 'Napwake';
export const HEADLINE = 'Non-prod environments that sleep when nobody’s using them, and wake when someone does.';
export const PLAIN = 'Pauses idle Kubernetes workloads in staging, preview and dev, and wakes them on the first request.';
export const NEVER = 'It never deletes a workload or its data.';
export const WHAT = 'Napwake is open source (Apache 2.0): an operator, a kubectl napwake plugin and a Helm chart.';
export const FOR = 'For platform and infrastructure engineers who run staging, preview and dev environments on their own Kubernetes clusters.';
// private or public: the same product, wake on request on or off (company decision 0014)
export const REACH = 'Private ones, behind a VPN, single sign-on or an allowlist, wake on the first request. Public ones can ask first, with `napwake.dev/wake: ask`. Then a browser gets a Wake it button, and crawlers, scanners and API calls wake nothing. Tooling and the forecast can still wake them.';
export const WONT = [
  'Delete anything: its one action is to pause, scaling a workload to zero replicas.',
  'Pause on a timetable. It pauses a workload after `idleAfter` with no sign of use, an hour by default.',
  'Pause anything but Deployments and StatefulSets.',
  'Replace your autoscaler. While a workload runs, its HPA or KEDA decides how many replicas it needs. Napwake only decides whether it should run at all.',
  'Guess who’s a person. Napwake can’t tell. On an environment anyone can reach, set it to ask. Then requests wake nothing, and a browser gets a Wake it button.',
];
export const STATUS = 'Version 0.2.0 is in release candidates.';

// the website's pages: title, description (also each page's meta description), and its social card
export const PAGES = [
  { path: '/', title: 'Home', card: 'home', description: `${PLAIN} ${NEVER}`, line: 'What Napwake is, `kubectl napwake scan`, the four states, and how a wake works.' },
  { path: '/how-it-works/', title: 'How it works', card: 'how-it-works', description: 'How Napwake pauses idle Kubernetes workloads, holds the first request while they wake, can wake the team’s environments 15 minutes early, and never deletes anything.', line: 'The activity clock, the doorman that holds the first request, the forecast’s autoResume, and what a pause changes.' },
  { path: '/compare/', title: 'How it compares', card: 'compare', description: 'Napwake pauses idle staging on use and wakes it on the first request. Here it is beside a timetable and a scale-to-zero proxy, the same rooms through one evening and morning.', line: 'Napwake, a timetable and a scale-to-zero proxy, through one evening and the next morning, and side by side.' },
  { path: '/faq/', title: 'FAQ', card: 'faq', description: 'Short answers to what people ask about Napwake: scaling staging to zero at night, the first request, Argo CD and Flux, GKE and EKS, production, cost.', line: 'Short answers, each complete on its own, with its source.' },
  { path: '/changelog/', title: 'Changelog', card: 'changelog', description: 'What’s new in each Napwake release, newest first: a summary in plain words, then everything added, changed and fixed. 0.2.0 is in release candidates.', line: 'What’s new in each release from 0.2.0, newest first; 0.2.0 is in release candidates.' },
  { path: '/blog/', title: 'Blog', card: 'blog', description: 'Release announcements from Napwake, and how it’s built.', line: 'Release announcements, and how Napwake is built.' },
  { path: '/brand/', title: 'Brand and trademarks', card: 'brand', description: 'The Napwake logo, the doorman and the doors: where to get them, how to credit the illustrations, and how you may use the name and logo.', line: 'The logo, the doorman illustrations (CC BY 4.0), and the trademark rules.' },
  CF_BEACON
    ? { path: '/privacy/', title: 'Privacy', card: 'home', description: 'What a visit to napwake.dev sends, and where. No cookies. GitHub hosts the site, and Cloudflare Web Analytics counts visits.', line: 'No cookies, what Cloudflare Web Analytics counts, and what GitHub sees when you visit.' }
    : { path: '/privacy/', title: 'Privacy', card: 'home', description: 'What a visit to napwake.dev sends, and where. No cookies and no analytics. GitHub hosts the site.', line: 'No cookies, no analytics, and what GitHub sees when you visit.' },
];
export const page = (path) => PAGES.find((p) => p.path === path);

// the docs' pages an assistant or an agent most needs, one line each, from each page's own opening. With the
// docs on GitHub (links.mjs), a page only the next docs will have, such as reference/cli, stays out.
export const DOC_PAGES = [
  ['getting-started/installation', 'Installation', 'The Helm chart, or the Kustomize manifests as install.yaml; needs Kubernetes 1.30+ and metrics-server.'],
  ['getting-started/quickstart', 'Quickstart', 'One workload from idle to paused while idle, measured in dry-run first.'],
  ['getting-started/kubectl-plugin', 'kubectl plugin', 'scan (with nothing installed), status, forecast, nodes, pause, wake and enable.'],
  ['concepts/idle-detection', 'Idle detection', 'The activity clock and `idleAfter`. CPU, deploys, annotations and Prometheus queries count, and so does a request that wakes a paused workload.'],
  ['concepts/wake-on-request', 'Wake on request', 'The doorman holds the first connection while a paused workload starts; any TCP protocol.'],
  ['concepts/forecasting', 'Forecasting', 'A Holt-Winters model of each workload’s week; autoResume wakes it 15 minutes ahead.'],
  ['concepts/lifecycle', 'Lifecycle', 'Running, Idle, Pausing, Paused, Resuming, and the conditions each workload reports.'],
  ['concepts/dependencies', 'Dependencies', 'Databases and workers woken and held with the workloads that use them.'],
  ['concepts/cost-tracking', 'Cost tracking', 'What each pause frees, and what of it came off the bill once nodes went.'],
  ['guides/opt-in', 'Opting in', 'A label on a workload or a namespace; settings as annotations; protected namespaces.'],
  ['guides/dry-run', 'Dry run', 'Measure what Napwake would pause and free, without it pausing anything.'],
  ['guides/pause', 'Pause and resume', 'What a pause changes and records; it never deletes a workload or its storage.'],
  ['guides/gitops', 'GitOps tools', 'The one-time setting for Argo CD, Flux, Fleet, kapp and Kluctl to leave replicas alone.'],
  ['guides/autoscalers', 'HPA and KEDA', 'Working alongside an autoscaler: it pauses to zero and resumes within its range.'],
  ['guides/node-pools', 'Node pools for real savings', 'Giving non-prod its own nodes, so pausing empties whole nodes.'],
  ['reference/compatibility', 'Compatibility', 'Service proxies, ingress controllers, cloud load balancers and meshes, as checked.'],
  ['reference/cli', 'kubectl plugin reference', 'Every flag, JSON field, exit status and permission of the plugin’s commands.'],
  ['reference/conditions-and-events', 'Conditions and events', 'Every status condition, with its reasons, and every event.'],
  ['operations/troubleshooting', 'Troubleshooting', 'When an idle workload isn’t paused, requests fail instead of waking it, or it keeps cycling.'],
].map(([path, title, line]) => ({ path, title, line, link: doc(path) }));

export const abs = (path) => new URL(path, SITE).href;
export const cardUrl = (card) => abs(`/og/${card}.png`);
export { SITE, DOCS };
