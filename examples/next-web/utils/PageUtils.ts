export const urls = {
  editPage: (ids: string[]): string => `/entities/edit?id=${ids.join('&id=')}`,
  editPageNew: (entityType: string, id: string): string => `/entities/edit?new=${entityType}:${id}`,
  isEditPage: (url: string): boolean => url.startsWith('/entities/edit'),
  publishedEntityDisplay: (ids: string[]): string =>
    `/published-entities/display?id=${ids.join('&id=')}`,
};
