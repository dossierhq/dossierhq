import { Card2, DateDisplay, Text, toSpacingClassName } from '@dossierhq/design-ssr';
import type { Metadata } from 'next';
import Link from 'next/link.js';
import { CloudinaryImage } from '../../components/CloudinaryImage/CloudinaryImage';
import { BrowserUrls } from '../../utils/BrowserUrls';
import type { PublishedAuthor, PublishedBlogPost } from '../../utils/SchemaTypes';
import { assertIsPublishedAuthor, assertIsPublishedBlogPost } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'The latest news and updates from the Dossier team.',
};

export default async function Page() {
  const publishedClient = (await getPublishedClientForServerComponent()).toExceptionClient();
  const connection = await publishedClient.searchEntities({ entityTypes: ['BlogPost'] });

  const blogPosts =
    connection?.edges.map((edge) => {
      const node = edge.node.valueOrThrow();
      assertIsPublishedBlogPost(node);
      return node;
    }) ?? [];
  blogPosts.sort((a, b) => b.fields.publishedDate.localeCompare(a.fields.publishedDate));

  const authorIds = new Set<string>();
  blogPosts.forEach((post) => post.fields.authors?.forEach((author) => authorIds.add(author.id)));
  const authorResults = await publishedClient.getEntities([...authorIds].map((id) => ({ id })));

  const authors: Record<string, PublishedAuthor> = {};
  authorResults.forEach((result) => {
    const author = result.valueOrThrow();
    assertIsPublishedAuthor(author);
    authors[author.id] = author;
  });

  return (
    <>
      <Text as="h1" textStyle="headline3" marginBottom={3}>
        Latest news and updates about Dossier
      </Text>
      {blogPosts.map((item) => {
        const blogPostAuthors =
          item.fields.authors?.map((reference) => authors[reference.id]) ?? [];
        return <BlogCard key={item.id} blogPost={item} authors={blogPostAuthors} />;
      })}
    </>
  );
}

function BlogCard({
  blogPost,
  authors,
}: {
  blogPost: PublishedBlogPost;
  authors: PublishedAuthor[];
}) {
  return (
    <Link href={BrowserUrls.blogPost(blogPost.fields.slug)}>
      <Card2 className={toSpacingClassName({ marginBottom: 5 })}>
        <Card2.Media>
          <CloudinaryImage image={blogPost.fields.hero} aspectRatio="16/9" />
        </Card2.Media>
        <Card2.Content>
          <Text as="h2" textStyle="headline4">
            {blogPost.fields.title}
          </Text>
          <DateDisplay date={new Date(blogPost.fields.publishedDate)} />
          {authors.length > 0 ? (
            <Text textStyle="subtitle1">By {authors.map((it) => it.fields.name).join(', ')}</Text>
          ) : null}
        </Card2.Content>
      </Card2>
    </Link>
  );
}
