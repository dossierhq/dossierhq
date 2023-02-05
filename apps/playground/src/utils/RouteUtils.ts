export const ROUTE = {
  index: {
    route: '/',
    url: '/',
  },
  server: {
    route: '/:serverName',
    url: (serverName: string) => `/${serverName}`,
  },
  adminEntities: {
    route: '/:serverName/admin-entities',
    url: (serverName: string) => `/${serverName}/admin-entities`,
  },
  graphiql: {
    route: '/:serverName/graphiql',
    url: (serverName: string) => `/${serverName}/graphiql`,
  },
  login: {
    route: '/:serverName/login/:userId',
    url: (serverName: string, userId: string) => `/${serverName}/login/${userId}`,
  },
  editEntities: {
    route: '/:serverName/edit-entities',
    url: (serverName: string, selectors: ({ newType: string; id: string } | { id: string })[]) => {
      const p = new URLSearchParams();
      for (const selector of selectors) {
        if ('newType' in selector) {
          p.set('new', `${selector.newType}:${selector.id}`);
        } else {
          p.set('id', selector.id);
        }
      }
      return `/${serverName}/edit-entities?${p.toString()}`;
    },
  },
  publishedEntities: {
    route: '/:serverName/published-entities',
    url: (serverName: string) => `/${serverName}/published-entities`,
  },
  publishedEntityDisplay: {
    route: '/:serverName/published-entities/display',
    url: (serverName: string, entityId: string) =>
      `/${serverName}/published-entities/display?id=${entityId}`,
  },
  schema: {
    route: '/:serverName/schema',
    url: (serverName: string) => `/${serverName}/schema`,
  },
};
