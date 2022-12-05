export const urls = {
  home: '/',
  adminEntities: '/admin/admin-entities',
  article: (slug: string) => (slug === 'overview' ? '/docs' : `/docs/${slug}`),
  docs: '/docs',
  editPage: (ids: string[]): string => `/admin/admin-entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/admin/admin-entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/admin/admin-entities/edit'),
  glossary: '/docs/glossary',
  glossaryTerm: (slug: string) => `/docs/glossary#${slug}`,
  graphiql: '/admin/graphiql',
  playground: ensureEnvVar(process.env.NEXT_PUBLIC_PLAYGROUND_URL),
  publishedEntities: '/admin/published-entities',
  publishedEntityDisplay: (ids: string[]): string =>
    `/admin/published-entities/display?id=${ids.join('&id=')}`,
  schemaEditor: '/admin/schema',
  voyager: '/admin/voyager',
};

function ensureEnvVar(value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable`);
  }
  return value;
}
