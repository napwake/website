// napwake.dev: a static site, built for GitHub Pages, with a sitemap for search engines and assistants.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CF_BEACON } from './src/lib/site.mjs';

// A production build has no drafts (src/lib/blog.mjs), so the sitemap lists every page but the 404 and
// the /docs/ redirect, which Astro builds as a noindex page that refreshes to the docs.

// The content security policy, as a meta tag, since GitHub Pages can't send headers. Base.astro leaves a
// placeholder, and once the build is done this fills it in on each page: the site's own files, the hashes of
// that page's inline scripts, GitHub's API for the star count, and Cloudflare's beacon when it's on.
// Styles may be inline, for the style attributes the scenes are positioned with.
const CSP_PLACEHOLDER = '__NAPWAKE_CSP__';
const csp = {
  name: 'napwake-csp',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      for (const f of (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'))) {
        const html = await readFile(join(root, f), 'utf8');
        if (!html.includes(CSP_PLACEHOLDER)) continue;
        const hashes = new Set();
        for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
          const type = attrs.match(/\btype="([^"]*)"/)?.[1];
          if (/\bsrc=/.test(attrs) || (type && !['module', 'text/javascript'].includes(type))) continue;
          hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
        }
        const policy = [
          "default-src 'self'",
          ['script-src', "'self'", CF_BEACON && 'https://static.cloudflareinsights.com', ...hashes].filter(Boolean).join(' '),
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self'",
          "font-src 'self'",
          ['connect-src', "'self'", 'https://api.github.com', CF_BEACON && 'https://cloudflareinsights.com'].filter(Boolean).join(' '),
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');
        await writeFile(join(root, f), html.replace(CSP_PLACEHOLDER, policy));
      }
    },
  },
};

export default defineConfig({
  site: 'https://napwake.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // the first address people guess for the docs
  redirects: { '/docs': 'https://docs.napwake.dev/' },
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) }), csp],
});
