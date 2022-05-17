export const ROUTE = {
  index: {
    route: '/',
    url: '/',
  },
  adminEntities: {
    route: 'admin-entities',
    url: '/admin-entities',
  },
  editEntities: {
    route: 'edit-entities',
    url: (selectors: ({ type: string } | { id: string })[]) => {
      const p = new URLSearchParams();
      for (const selector of selectors) {
        if ('type' in selector) {
          p.set('type', selector.type);
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
