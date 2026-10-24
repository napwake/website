// The blog's posts, from src/content/blog/*.md, newest first. A post with `draft: true` is built only by
// `astro dev`, with a "Draft" marker. A production build leaves drafts out: no page, no index entry, no
// marker, and nothing in the sitemap or the RSS feed.
const files = import.meta.glob('../content/blog/*.md', { eager: true });

// front matter dates arrive as a Date or an ISO string, depending on the YAML; keep the day
const isoDay = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10); };
const wordsIn = (s) => (s || '').replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

export const POSTS = Object.entries(files)
  .filter(([path]) => !path.endsWith('/README.md'))
  .map(([path, m]) => {
    const fm = m.frontmatter || {};
    const words = wordsIn(m.rawContent?.() ?? '');
    return {
      slug: path.split('/').pop().replace(/\.md$/, ''),
      title: fm.title, description: fm.description, date: isoDay(fm.date), author: fm.author || 'Tobi Okedeji',
      draft: !!fm.draft, words, minutes: Math.max(1, Math.round(words / 230)),
      Content: m.Content, html: m.compiledContent?.() ?? '',
    };
  })
  .filter((p) => import.meta.env.DEV || !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

export const PUBLISHED = POSTS.filter((p) => !p.draft);
// The blog is built only once it has a post: until then there's no /blog/, no feed, and no Blog link.
export const BLOG = POSTS.length > 0;
export const fmtDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
