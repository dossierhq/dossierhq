import { Text } from '@dossierhq/design-ssr';
import type { Metadata } from 'next';
import { Article } from 'schema-dts';
import { JsonLd } from '../../../components/JsonLd/JsonLd';
import { ArticleLexicalTheme } from '../../../style/ArticleLexicalTheme';
import { BrowserUrls, canonicalUrl } from '../../../utils/BrowserUrls';
import { assertIsPublishedArticle } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';
import { getArticle } from './getArticle';

export async function generateMetadata({
  params,
}: {
  params: { articleSlug: string };
}): Promise<Metadata> {
  const publishedClient = await getPublishedClientForServerComponent();
  const article = await getArticle(publishedClient, params.articleSlug);

  return {
    title: article.fields.title,
    description: article.fields.description,
    openGraph: {
      type: 'article',
      siteName: 'Dossier',
      url: canonicalUrl(BrowserUrls.article(article.fields.slug)),
      title: article.fields.title,
      description: article.fields.description,
      images: canonicalUrl('/og-dossier.png'),
    },
  };
}

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
        headingOffset={1}
      />
      <JsonLd<Article>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.fields.title,
          description: article.fields.description,
        }}
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
