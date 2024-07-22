import blogUrl from 'playground-example-generator/dist/blog.sqlite?url';
import catalogUrl from 'playground-example-generator/dist/catalog.sqlite?url';
import reviewsUrl from 'playground-example-generator/dist/reviews.sqlite?url';
import starwarsUrl from 'playground-example-generator/dist/starwars.sqlite?url';

export const ExampleConfigs: { name: string; url: string }[] = [
  { name: 'dossier-docs', url: `${import.meta.env.BASE_URL}dossier-docs.sqlite` },
  { name: 'blog', url: blogUrl },
  { name: 'catalog', url: catalogUrl },
  { name: 'reviews', url: reviewsUrl },
  { name: 'starwars', url: starwarsUrl },
];
