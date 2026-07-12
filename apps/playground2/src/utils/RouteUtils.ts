import {
  addContentDisplayParamsToURLSearchParams,
  addContentEditorParamsToURLSearchParams,
} from '@dossierhq/react-components2';

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
  login: {
    route: 'login/:userId',
    url: (serverName: string, userId: string) => `/${serverName}/login/${userId}`,
  },
  publishedContentList: {
    route: 'published-content',
    url: (serverName: string) => `/${serverName}/published-content`,
  },
  publishedContentDisplay: {
    route: 'published-content/display',
    url: (serverName: string, entityIds: string[]) => {
      const p = new URLSearchParams();
      addContentDisplayParamsToURLSearchParams(p, { entityIds });
      return `/${serverName}/published-content/display?${p.toString()}`;
    },
  },
  schemaEditor: {
    route: 'schema',
    url: (serverName: string) => `/${serverName}/schema`,
  },
  changelog: {
    route: 'changelog',
    url: (serverName: string) => `/${serverName}/changelog`,
  },
  contentEditor: {
    route: 'content/edit',
    url: (
      serverName: string,
      options: Parameters<typeof addContentEditorParamsToURLSearchParams>[1],
      listSearchParams: URLSearchParams,
    ) => {
      const p = new URLSearchParams(listSearchParams);
      addContentEditorParamsToURLSearchParams(p, options);
      return `/${serverName}/content/edit?${p.toString()}`;
    },
  },
};
