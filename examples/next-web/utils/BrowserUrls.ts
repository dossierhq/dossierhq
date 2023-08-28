export const BrowserUrls = {
  home: '/',
  adminEntities: '/dossier/admin-entities',
  changelog: '/dossier/changelog',
  editPage: (ids: string[]): string => `/dossier/admin-entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string =>
    `/dossier/admin-entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/dossier/admin-entities/edit'),
  publishedEntities: '/dossier/published-entities',
  publishedEntityDisplay: (ids: string[]): string =>
    `/dossier/published-entities/display?id=${ids.join('&id=')}`,
  schemaEditor: '/dossier/schema',
  graphiql: '/dossier/graphiql',
  voyager: '/dossier/voyager',
};
