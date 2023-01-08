import { Text } from '@jonasb/datadata-design-server';
import { ArticleLexicalTheme } from '../../../style/ArticleLexicalTheme';
import { assertIsPublishedArticle } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';
import { getArticle } from './getArticle';

export default async function Page({ params }: { params: { articleSlug: string } }) {
  const publishedClient = await getPublishedClientForServerComponent();
  const article = await getArticle(publishedClient, params.articleSlug);
  return (
    <>
      <Text as="h1" textStyle="headline3">
        {article.fields.title}
      </Text>
      <ServerRichTextRenderer
        richText={article.fields.body}
        publishedClient={publishedClient}
        theme={ArticleLexicalTheme}
      />
    </>
  );
}

export async function generateStaticParams() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['Article'], order: 'name' })
  ).valueOrThrow();

  if (connection?.pageInfo.hasNextPage) {
    // TODO add support for pagination
    throw new Error('Pagination not supported');
  }

  if (!connection) {
    return [];
  }

  return connection.edges.map((edge) => {
    const entity = edge.node.valueOrThrow();
    assertIsPublishedArticle(entity);
    const slug = entity.fields.slug === 'overview' ? [] : [entity.fields.slug];
    return { articleSlug: slug };
  });
}
