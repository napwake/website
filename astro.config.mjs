// napwake.dev: a static site, built for GitHub Pages, with a sitemap for search engines and assistants.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A production build has no drafts (src/lib/blog.mjs), so the sitemap lists every page but the 404.

export default defineConfig({
  site: 'https://napwake.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
});
