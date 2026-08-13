export const BrowserUrls = {
  home: '/',
  content: '/dossier/content',
  article: (slug: string) => (slug === 'overview' ? '/docs' : `/docs/${slug}`),
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  changelog: '/dossier/changelog',
  contentEditor: '/dossier/content/edit',
  docs: '/docs',
  glossary: '/docs/glossary',
  glossaryTerm: (slug: string) => `/docs/glossary#${slug}`,
  github: 'https://github.com/dossierhq/dossierhq#readme',
  limitations: '/docs/limitations',
  playground: () => ensureEnvVar(process.env.NEXT_PUBLIC_PLAYGROUND_URL),
  publishedContent: '/dossier/published-content',
  publishedContentDisplay: '/dossier/published-content/display',
  schemaEditor: '/dossier/schema',
};

export function canonicalUrl(url: string) {
  if (!url.startsWith('/')) throw new Error(`URL must start with / (got '${url}'))`);
  if (url === '/') url = '';
  return 'https://www.dossierhq.dev' + url;
}

function ensureEnvVar(value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable`);
  }
  return value;
}
