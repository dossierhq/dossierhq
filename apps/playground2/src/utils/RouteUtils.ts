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
  login: {
    route: 'login/:userId',
    url: (serverName: string, userId: string) => `/${serverName}/login/${userId}`,
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
