// The repository's star count, read from GitHub's API once, at build time: no client-side calls and no
// third-party badge. Set GITHUB_TOKEN in CI to avoid the unauthenticated rate limit. If the API fails,
// the count is null and the button says "GitHub" alone.
import { GITHUB } from './links.mjs';

async function read(repo) {
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'napwake.dev build' };
    const token = globalThis.process?.env?.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, { headers, signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    const n = (await r.json()).stargazers_count;
    return Number.isInteger(n) ? n : null;
  } catch (e) {
    console.warn(`[napwake] star count for ${repo.owner}/${repo.repo} unavailable: ${e.message}`);
    return null;
  }
}

// NAPWAKE_STARS=off skips the read. Off or unread, the button says "GitHub".
const off = globalThis.process?.env?.NAPWAKE_STARS === 'off';
export const STARS = off ? null : await read(GITHUB);
if (!off && STARS == null) console.warn('[napwake] no star count: the button says "GitHub"');
export const starLabel = (n) => (n == null ? null : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
