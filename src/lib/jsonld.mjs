// Structured data (schema.org JSON-LD), from the same facts as the pages: src/lib/site.mjs and faq.mjs.
import { NAME, PLAIN, SITE, abs, cardUrl } from './site.mjs';
import { REPO, GITHUB } from './links.mjs';
import { FAQ, answerText } from './faq.mjs';

const LICENSE = 'https://spdx.org/licenses/Apache-2.0.html';

// The home's graph: the organization, its logo the 512-pixel icon (scripts/icons.mjs), and the software.
export const software = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: NAME,
      url: `${SITE}/`,
      logo: abs('/icon-512.png'),
      sameAs: [`https://github.com/${GITHUB.owner}`, REPO],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: NAME,
      description: PLAIN,
      url: `${SITE}/`,
      image: cardUrl('home'),
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Kubernetes',
      softwareRequirements: 'Kubernetes 1.30 or later, metrics-server',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      license: LICENSE,
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${SITE}/#source`,
      name: NAME,
      description: PLAIN,
      codeRepository: REPO,
      programmingLanguage: 'Go',
      runtimePlatform: 'Kubernetes',
      license: LICENSE,
      targetProduct: { '@id': `${SITE}/#software` },
    },
  ],
});

export const faqPage = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${abs('/faq/')}#faq`,
  url: abs('/faq/'),
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    url: abs(`/faq/#${f.id}`),
    acceptedAnswer: { '@type': 'Answer', text: answerText(f) },
  })),
});
