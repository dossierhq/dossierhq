export const BrowserUrls = {
  home: '/',
  adminEntities: '/admin/admin-entities',
  article: (slug: string) => (slug === 'overview' ? '/docs' : `/docs/${slug}`),
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  docs: '/docs',
  editPage: (ids: string[]): string => `/admin/admin-entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/admin/admin-entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/admin/admin-entities/edit'),
  glossary: '/docs/glossary',
  glossaryTerm: (slug: string) => `/docs/glossary#${slug}`,
  github: 'https://github.com/dossierhq/dossierhq#readme',
  limitations: '/docs/limitations',
  playground: () => ensureEnvVar(process.env.NEXT_PUBLIC_PLAYGROUND_URL),
  publishedEntities: '/admin/published-entities',
  publishedEntityDisplay: (ids: string[]): string =>
    `/admin/published-entities/display?id=${ids.join('&id=')}`,
  schemaEditor: '/admin/schema',
};

export function canonicalUrl(url: string) {
  if (!url.startsWith('/')) throw new Error(`URL must start with / (got '${url}'))`);
  return 'https://www.dossierhq.dev' + url;
}

function ensureEnvVar(value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable`);
  }
  return value;
}
