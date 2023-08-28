import type { AppPublishedClient, PublishedAuthor } from '../../../utils/SchemaTypes';
import { assertIsPublishedAuthor, assertIsPublishedBlogPost } from '../../../utils/SchemaTypes';

export async function getBlogPost(publishedClient: AppPublishedClient, slug: string) {
  const blogPost = (
    await publishedClient.getEntity({ index: 'blogSlug', value: slug })
  ).valueOrThrow();
  assertIsPublishedBlogPost(blogPost);

  let authors: PublishedAuthor[] = [];
  if (blogPost.fields.authors && blogPost.fields.authors.length > 0) {
    const authorsResult = (
      await publishedClient.getEntityList(blogPost.fields.authors)
    ).valueOrThrow();
    authors = authorsResult.map((authorResult) => {
      const author = authorResult.valueOrThrow();
      assertIsPublishedAuthor(author);
      return author;
    });
  }
  return { blogPost, authors };
}
