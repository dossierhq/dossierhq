export const BrowserUrls = {
  home: '/',
  contentList: '/dossier/content',
  changelogList: '/dossier/changelog',
  contentEditor: (ids: string[]): string => `/dossier/content/edit?id=${ids.join('&id=')}`,
  contentEditorNew: (entityType: string, id: string): string =>
    `/dossier/content/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/dossier/content/edit'),
  publishedContentList: '/dossier/published-content',
  publishedContentDisplay: (ids: string[]): string =>
    `/dossier/published-content/display?id=${ids.join('&id=')}`,
  schemaEditor: '/dossier/schema',
  graphiql: '/dossier/graphiql',
  voyager: '/dossier/voyager',
};
