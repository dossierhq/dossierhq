import { addContentEditorParamsToURLSearchParams } from '@dossierhq/react-components2';

export const ROUTE = {
  index: {
    url: '/',
  },
  server: {
    url: (serverName: string) => `/${serverName}`,
  },
  contentList: {
    route: 'content',
    url: (serverName: string) => `/${serverName}/content`,
  },
  contentList2: {
    route: 'content2',
    url: (serverName: string) => `/${serverName}/content2`,
  },
  changelogList: {
    route: 'changelog',
    url: (serverName: string) => `/${serverName}/changelog`,
  },
  graphiql: {
    route: 'graphiql',
    url: (serverName: string) => `/${serverName}/graphiql`,
  },
  login: {
    route: 'login/:userId',
    url: (serverName: string, userId: string) => `/${serverName}/login/${userId}`,
  },
  contentEditor: {
    route: 'content/edit',
    url: (serverName: string, selectors: ({ newType: string; id: string } | { id: string })[]) => {
      const p = new URLSearchParams();
      for (const selector of selectors) {
        if ('newType' in selector) {
          p.set('new', `${selector.newType}:${selector.id}`);
        } else {
          p.set('id', selector.id);
        }
      }
      return `/${serverName}/content/edit?${p.toString()}`;
    },
  },
  contentEditor2: {
    route: 'content2/edit',
    url: (
      serverName: string,
      options: Parameters<typeof addContentEditorParamsToURLSearchParams>[1],
      listSearchParams: URLSearchParams,
    ) => {
      const p = new URLSearchParams(listSearchParams);
      addContentEditorParamsToURLSearchParams(p, options);
      return `/${serverName}/content2/edit?${p.toString()}`;
    },
  },
  publishedContentList: {
    route: 'published-content',
    url: (serverName: string) => `/${serverName}/published-content`,
  },
  publishedContentDisplay: {
    route: 'published-content/display',
    url: (serverName: string, entityId: string) =>
      `/${serverName}/published-content/display?id=${entityId}`,
  },
  schemaEditor: {
    route: 'schema',
    url: (serverName: string) => `/${serverName}/schema`,
  },
};
