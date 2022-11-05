export const urls = {
  home: '/',
  adminEntities: '/admin/admin-entities',
  editPage: (ids: string[]): string => `/admin/admin-entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/admin/admin-entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/admin/admin-entities/edit'),
  glossaryTerm: (slug: string) => `/glossary#${slug}`,
  graphiql: '/admin/graphiql',
  publishedEntities: '/admin/published-entities',
  publishedEntityDisplay: (ids: string[]): string =>
    `/admin/published-entities/display?id=${ids.join('&id=')}`,
  schemaEditor: '/admin/schema',
  voyager: '/admin/voyager',
};
