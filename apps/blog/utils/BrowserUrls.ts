export const BrowserUrls = {
  home: '/',
  content: '/dossier/content',
  article: (slug: string) => (slug === 'overview' ? '/docs' : `/docs/${slug}`),
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  changelog: '/dossier/changelog',
  docs: '/docs',
  editPage: (ids: string[]): string => `/dossier/content/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/dossier/content/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/dossier/content/edit'),
  glossary: '/docs/glossary',
  glossaryTerm: (slug: string) => `/docs/glossary#${slug}`,
  github: 'https://github.com/dossierhq/dossierhq#readme',
  limitations: '/docs/limitations',
  playground: () => ensureEnvVar(process.env.NEXT_PUBLIC_PLAYGROUND_URL),
  publishedContent: '/dossier/published-content',
  publishedEntityDisplay: (ids: string[]): string =>
    `/dossier/published-content/display?id=${ids.join('&id=')}`,
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
