// /blog/rss.xml: the blog's RSS 2.0 feed, built only once the blog has a post. Drafts aren't in it.
import { PUBLISHED, BLOG } from '../../lib/blog.mjs';
import { SITE } from '../../lib/links.mjs';

export function getStaticPaths() {
  return BLOG ? [{ params: { feed: 'rss' } }] : [];
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc822 = (d) => new Date(`${d}T09:00:00Z`).toUTCString();

export async function GET() {
  // a post's HTML comes as a promise (compiledContent is async)
  const items = (await Promise.all(PUBLISHED.map(async (p) => {
    const url = `${SITE}/blog/${p.slug}/`;
    const html = String((await p.html) ?? '');
    return `    <item>\n      <title>${esc(p.title)}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${rfc822(p.date)}</pubDate>\n      <dc:creator>${esc(p.author)}</dc:creator>\n      <description>${esc(p.description)}</description>\n      <content:encoded><![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>\n    </item>`;
  }))).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Napwake blog</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Release announcements from Napwake, and how it’s built.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
