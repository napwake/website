// napwake.dev: a static site, built for GitHub Pages, with a sitemap for search engines and assistants.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCS_MODE, docsHref } from './src/lib/links.mjs';

// A production build has no drafts (src/lib/blog.mjs), so the sitemap lists every page but the 404.

// Files in public/ are copied as they are. With the docs on GitHub (src/lib/links.mjs), their links to
// docs.napwake.dev, such as the example scan report's, go there too.
const docsLinks = {
  name: 'napwake-docs-links',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      if (DOCS_MODE !== 'github') return;
      const root = fileURLToPath(dir);
      for (const f of (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'))) {
        const html = await readFile(join(root, f), 'utf8');
        const out = html.replace(/href="(https:\/\/docs\.napwake\.dev[^"]*)"/g, (_, href) => `href="${docsHref(href)}"`);
        if (out !== html) await writeFile(join(root, f), out);
      }
    },
  },
};

export default defineConfig({
  site: 'https://napwake.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) }), docsLinks],
});
