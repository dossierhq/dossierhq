export const ROUTE = {
  index: {
    url: '/',
  },
  server: {
    url: (serverName: string) => `/${serverName}`,
  },
  adminEntities: {
    route: 'admin-entities',
    url: (serverName: string) => `/${serverName}/admin-entities`,
  },
  graphiql: {
    route: 'graphiql',
    url: (serverName: string) => `/${serverName}/graphiql`,
  },
  login: {
    route: 'login/:userId',
    url: (serverName: string, userId: string) => `/${serverName}/login/${userId}`,
  },
  editEntities: {
    route: 'edit-entities',
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
    route: 'published-entities',
    url: (serverName: string) => `/${serverName}/published-entities`,
  },
  publishedEntityDisplay: {
    route: 'published-entities/display',
    url: (serverName: string, entityId: string) =>
      `/${serverName}/published-entities/display?id=${entityId}`,
  },
  schema: {
    route: 'schema',
    url: (serverName: string) => `/${serverName}/schema`,
  },
};
