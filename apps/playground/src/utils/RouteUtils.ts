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
    route: 'admin-entities/edit',
    url: (ids: string[], type?: string) => {
      const search = new URLSearchParams();
      if (ids.length > 0) search.set('ids', ids.join(','));
      if (type) search.set('type', type);
      return `/admin-entities/edit?${search.toString()}`;
    },
  },
};
