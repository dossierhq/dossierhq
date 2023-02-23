import { DateDisplay, Text, toSpacingClassName } from '@dossierhq/design-ssr';
import type { Metadata } from 'next';
import { CloudinaryImage } from '../../../components/CloudinaryImage/CloudinaryImage';
import { assertIsPublishedBlogPost } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';
import { getBlogPost } from './getBlogPost';

export async function generateMetadata({
  params,
}: {
  params: { blogSlug: string };
}): Promise<Metadata> {
  const publishedClient = await getPublishedClientForServerComponent();
  const { blogPost } = await getBlogPost(publishedClient, params.blogSlug);

  return { title: blogPost.fields.title };
}

export default async function Page({ params }: { params: { blogSlug: string } }) {
  const publishedClient = await getPublishedClientForServerComponent();
  const { blogPost, authors } = await getBlogPost(publishedClient, params.blogSlug);

  return (
    <>
      <Text as="h1" textStyle="headline2" marginHorizontal={2}>
        {blogPost.fields.title}
      </Text>
      <CloudinaryImage image={blogPost.fields.hero} aspectRatio="16/9" />
      <div className={toSpacingClassName({ marginHorizontal: 2, marginTop: 2, marginBottom: 5 })}>
        {authors.length > 0 ? (
          <Text textStyle="subtitle1">By {authors.map((it) => it.fields.name).join(', ')}</Text>
        ) : null}
        <DateDisplay date={new Date(blogPost.fields.publishedDate)} />
      </div>
      <section className={toSpacingClassName({ marginHorizontal: 2 })}>
        <ServerRichTextRenderer richText={blogPost.fields.body} publishedClient={publishedClient} />
      </section>
    </>
  );
}

export async function generateStaticParams() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['BlogPost'] })
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
    assertIsPublishedBlogPost(entity);
    return { blogSlug: entity.fields.slug };
  });
}
