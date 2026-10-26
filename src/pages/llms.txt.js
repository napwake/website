// /llms.txt (llmstxt.org): what Napwake is, who it's for, what it won't do, and every page with one line,
// for assistants and agents. Built from src/lib/site.mjs and faq.mjs, the same words as the pages.
import { NAME, HEADLINE, PLAIN, NEVER, WHAT, FOR, REACH, WONT, STATUS, PAGES, DOC_PAGES, abs } from '../lib/site.mjs';
import { FAQ } from '../lib/faq.mjs';
import { REPO, links } from '../lib/links.mjs';
import { BLOG } from '../lib/blog.mjs';

const straight = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

export function GET() {
  const out = [
    `# ${NAME}`,
    '',
    `> ${PLAIN}`,
    '',
    `${HEADLINE} ${NEVER} ${WHAT}`,
    '',
    `- For: ${FOR.replace(/^For /, '')}`,
    `- Where: non-production environments, private or public. ${REACH}`,
    `- Not for: production. It pauses and resumes. Scaling under load stays with your HPA or KEDA.`,
    `- Status: ${STATUS}`,
    '',
    'What it won\'t do:',
    ...WONT.map((w) => `- ${w}`),
    '',
    '## Website',
    '',
    ...PAGES.filter((p) => BLOG || p.path !== '/blog/').map((p) => `- [${p.title}](${abs(p.path)}): ${p.line}`),
    '',
    '## Docs',
    '',
    `- [The docs' llms.txt](${links.llmsIndex.real}): their own index for assistants, with the key pages as Markdown.`,
    `- [Every docs page as Markdown, in one file](${links.llmsFull.real})`,
    ...DOC_PAGES.map((d) => `- [${d.title}](${d.link.real}): ${d.line}`),
    '',
    '## FAQ',
    '',
    ...FAQ.map((f) => `- [${f.q}](${abs(`/faq/#${f.id}`)}): ${f.short}`),
    '',
    '## Optional',
    '',
    `- [Source code](${REPO}): the operator, the kubectl plugin and the Helm chart, Apache 2.0.`,
    `- [Brand](${links.brand.href}): the logo, the doorman illustrations (CC BY 4.0) and TRADEMARKS.md.`,
    '',
  ];
  return new Response(straight(out.join('\n')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
