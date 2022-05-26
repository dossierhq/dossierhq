export const ROUTE = {
  index: {
    route: '/',
    url: '/',
  },
  adminEntities: {
    route: 'admin-entities',
    url: '/admin-entities',
  },
  graphiql: {
    route: 'graphiql',
    url: '/graphiql',
  },
  login: {
    route: '/login/:userId',
    url: (userId: string) => `/login/${userId}`,
  },
  editEntities: {
    route: 'edit-entities',
    url: (selectors: ({ newType: string; id: string } | { id: string })[]) => {
      const p = new URLSearchParams();
      for (const selector of selectors) {
        if ('newType' in selector) {
          p.set('new', `${selector.newType}:${selector.id}`);
        } else {
          p.set('id', selector.id);
        }
      }
      return `/edit-entities?${p.toString()}`;
    },
  },
  publishedEntities: {
    route: 'published-entities',
    url: '/published-entities',
  },
  publishedEntityDetails: {
    route: 'published-entities/:entityId',
    url: (entityId: string) => `/published-entities/${entityId}`,
  },
  schema: {
    route: 'schema',
    url: '/schema',
  },
};
