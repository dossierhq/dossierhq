export const urls = {
  home: '/',
  adminEntities: '/admin-entities',
  editPage: (ids: string[]): string => `/admin-entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/admin-entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/admin-entities/edit'),
  graphiql: '/graphiql',
  publishedEntities: '/published-entities',
  publishedEntityDisplay: (ids: string[]): string =>
    `/published-entities/display?id=${ids.join('&id=')}`,
  schemaEditor: '/schema',
  voyager: '/voyager',
};
