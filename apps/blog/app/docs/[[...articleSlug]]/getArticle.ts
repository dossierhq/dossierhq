import {
  assertIsPublishedArticle,
  type AppPublishedDossierClient,
} from '../../../utils/SchemaTypes';

export async function getArticle(
  publishedClient: AppPublishedDossierClient,
  slug: string[] | undefined,
) {
  const articleSlug = slug && slug.length > 0 ? slug[0] : 'overview';
  const entity = (
    await publishedClient.getEntity({ index: 'articleSlug', value: articleSlug })
  ).valueOrThrow();
  assertIsPublishedArticle(entity);
  return entity;
}
