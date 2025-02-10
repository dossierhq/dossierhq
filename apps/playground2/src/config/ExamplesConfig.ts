import blogUrl from '@dossierhq/test-data/dist/blog.sqlite?url';
import catalogUrl from '@dossierhq/test-data/dist/catalog.sqlite?url';
import reviewsUrl from '@dossierhq/test-data/dist/reviews.sqlite?url';
import starwarsUrl from '@dossierhq/test-data/dist/starwars.sqlite?url';

export const ExampleConfigs: { name: string; url: string }[] = [
  { name: 'dossier-docs', url: `${import.meta.env.BASE_URL}dossier-docs.sqlite` },
  { name: 'blog', url: blogUrl },
  { name: 'catalog', url: catalogUrl },
  { name: 'reviews', url: reviewsUrl },
  { name: 'starwars', url: starwarsUrl },
];
