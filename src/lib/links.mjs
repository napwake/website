// Every outbound link in one place: the repo, its releases and the docs. With LIVE off, links to what
// doesn't exist yet would go to '#'.
export const LIVE = true;

export const SITE = 'https://napwake.dev';
// The docs site, set at build time: NAPWAKE_DOCS_URL=http://localhost:4400 for a local preview against
// the docs' own local build. Paths are the root ones the product's binaries print, which the docs keep
// working whatever version scheme they publish with.
const DOCS_ROOT = (globalThis.process?.env?.NAPWAKE_DOCS_URL || 'https://docs.napwake.dev').replace(/\/$/, '');
export const DOCS = DOCS_ROOT;
export const REPO = 'https://github.com/napwake/napwake';
// the repository, for the GitHub button and its star count
export const GITHUB = { owner: 'napwake', repo: 'napwake' };
export const REPO_NOW = `https://github.com/${GITHUB.owner}/${GITHUB.repo}`;

const later = (real) => ({ href: LIVE ? real : '#', placeholder: !LIVE, real });
const now = (real) => ({ href: real, placeholder: false, real });
export { later, now };

export const doc = (path) => later(`${DOCS}/${path.replace(/^\/|\/$/g, '')}/`);

export const links = {
  docs: later(`${DOCS}/`),
  install: doc('getting-started/installation'),
  quickstart: doc('getting-started/quickstart'),
  plugin: doc('getting-started/kubectl-plugin'),
  repo: now(REPO_NOW),
  releases: now(`${REPO_NOW}/releases`),
  changelogFile: now(`${REPO_NOW}/blob/main/CHANGELOG.md`),
  llmsFull: later(`${DOCS}/llms-full.txt`),
  concept: (page) => doc(`concepts/${page}`),
  guide: (page) => doc(`guides/${page}`),
  brand: now('https://github.com/napwake/brand'),
  trademarks: now('https://github.com/napwake/brand/blob/main/TRADEMARKS.md'),
  ccby: now('https://creativecommons.org/licenses/by/4.0/'),
  apache: now('https://www.apache.org/licenses/LICENSE-2.0'),
};
