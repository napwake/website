// Every outbound link in one place: the repo, its releases and the docs. With LIVE off, links to what
// doesn't exist yet would go to '#'.
import GITHUB_DOCS from '../content/docs-github.json' with { type: 'json' };

export const LIVE = true;

export const SITE = 'https://napwake.dev';
const env = globalThis.process?.env || {};
// The docs site, set at build time: NAPWAKE_DOCS_URL=http://localhost:4400 for a local preview against
// the docs' own local build. Paths are the root ones the product's binaries print, which the docs keep
// working whatever version scheme they publish with.
const DOCS_SITE = 'https://docs.napwake.dev';
const DOCS_ROOT = (env.NAPWAKE_DOCS_URL || DOCS_SITE).replace(/\/$/, '');
export const DOCS = DOCS_ROOT;
// NAPWAKE_DOCS_MODE=github, set in the deploy workflow: until docs.napwake.dev serves the renamed docs (the
// product's next release), docs links go to each page's Markdown on GitHub, napwake/napwake's main. The
// pages and their headings' anchors there are in src/content/docs-github.json (scripts/sync-docs-map.mjs).
// Unset, they go to the docs site.
export const DOCS_MODE = env.NAPWAKE_DOCS_MODE === 'github' ? 'github' : 'site';
export const REPO = 'https://github.com/napwake/napwake';
// the repository, for the GitHub button and its star count
export const GITHUB = { owner: 'napwake', repo: 'napwake' };
export const REPO_NOW = `https://github.com/${GITHUB.owner}/${GITHUB.repo}`;

const later = (real) => ({ href: LIVE ? real : '#', placeholder: !LIVE, real });
const now = (real) => ({ href: real, placeholder: false, real });
export { later, now };

// Whether a docs page is on GitHub's main, for the pages only the next docs will have.
export const hasDoc = (path) => DOCS_MODE !== 'github' || path.replace(/^\/|\/$/g, '') in GITHUB_DOCS.pages;

// A docs page by its path on the docs site, with a heading's anchor if it has one:
// doc('concepts/forecasting#when-it-acts'). On GitHub the anchor is the one GitHub gives the same heading.
// A heading GitHub doesn't have loses its anchor, and the link goes to the top of the page.
export const doc = (target) => {
  const [p, hash = ''] = target.split('#');
  const path = p.replace(/^\/|\/$/g, '');
  if (DOCS_MODE !== 'github') return { ...later(`${DOCS}/${path ? `${path}/` : ''}${hash ? `#${hash}` : ''}`), doc: true };
  const page = GITHUB_DOCS.pages[path];
  if (!page) throw new Error(`[napwake] a docs link to /${path}/, a page that isn't in docs/ on ${GITHUB_DOCS.source}. Link a page that is, or run scripts/sync-docs-map.mjs.`);
  const anchor = hash && page.anchors[hash];
  if (hash && !anchor) console.warn(`[napwake] docs link /${path}/#${hash}: ${page.file} has no such heading, so the link goes to the top of the page`);
  return { ...later(`${GITHUB_DOCS.base}${page.file}${anchor ? `#${anchor}` : ''}`), doc: true };
};

// A docs link written as a URL, such as the CHANGELOG's or the example scan report's: on GitHub like
// doc(), anything else as it is.
export const isDocsUrl = (href) => { try { return new URL(href).host === new URL(DOCS_SITE).host; } catch { return false; } };
export const docsHref = (href) => {
  if (DOCS_MODE !== 'github' || !isDocsUrl(href)) return href;
  const u = new URL(href);
  return doc(u.pathname + u.hash).href;
};

export const links = {
  docs: doc(''),
  install: doc('getting-started/installation'),
  quickstart: doc('getting-started/quickstart'),
  plugin: doc('getting-started/kubectl-plugin'),
  repo: now(REPO_NOW),
  releases: now(`${REPO_NOW}/releases`),
  changelogFile: now(`${REPO_NOW}/blob/main/CHANGELOG.md`),
  // one file of every docs page, which only the next docs will have
  llmsFull: DOCS_MODE === 'github' ? null : later(`${DOCS}/llms-full.txt`),
  concept: (page) => doc(`concepts/${page}`),
  guide: (page) => doc(`guides/${page}`),
  brand: now('https://github.com/napwake/brand'),
  trademarks: now('https://github.com/napwake/brand/blob/main/TRADEMARKS.md'),
  ccby: now('https://creativecommons.org/licenses/by/4.0/'),
  apache: now('https://www.apache.org/licenses/LICENSE-2.0'),
};
