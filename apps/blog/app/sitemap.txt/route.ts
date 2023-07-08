import { getAllPagesForConnection } from '@dossierhq/core';
import { BrowserUrls, canonicalUrl } from '../../utils/BrowserUrls';
import type { AppPublishedClient } from '../../utils/SchemaTypes';
import { assertIsPublishedArticle, assertIsPublishedBlogPost } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export async function GET(_request: Request) {
  const publishedClient = await getPublishedClientForServerComponent();

  const urls = await collectUrls(publishedClient);
  return new Response(urls.join('\n'), {
    status: 200,
  });
}

async function collectUrls(publishedClient: AppPublishedClient) {
  const urls: string[] = [];
  urls.push(canonicalUrl(BrowserUrls.home));

  urls.push(...(await articleUrls(publishedClient)));
  urls.push(canonicalUrl(BrowserUrls.glossary));
  urls.push(canonicalUrl(BrowserUrls.blog));
  urls.push(...(await blogUrls(publishedClient)));

  urls.sort();

  return urls;
}

async function articleUrls(publishedClient: AppPublishedClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.searchEntities({ entityTypes: ['Article'] }, paging),
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedArticle(node);
          result.push(canonicalUrl(BrowserUrls.article(node.fields.slug)));
        }
      }
    }
  }
  return result;
}

async function blogUrls(publishedClient: AppPublishedClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.searchEntities({ entityTypes: ['BlogPost'] }, paging),
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedBlogPost(node);
          result.push(canonicalUrl(BrowserUrls.blogPost(node.fields.slug)));
        }
      }
    }
  }
  return result;
}
