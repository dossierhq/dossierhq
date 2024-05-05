import { getAllPagesForConnection } from '@dossierhq/core';
import { BrowserUrls, canonicalUrl } from '../../utils/BrowserUrls';
import {
  assertIsPublishedArticle,
  assertIsPublishedBlogPost,
  type AppPublishedDossierClient,
} from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export async function GET(_request: Request) {
  const publishedClient = await getPublishedClientForServerComponent();

  const urls = await collectUrls(publishedClient);
  return new Response(urls.join('\n'), {
    status: 200,
  });
}

async function collectUrls(publishedClient: AppPublishedDossierClient) {
  const urls: string[] = [];
  urls.push(canonicalUrl(BrowserUrls.home));

  urls.push(...(await articleUrls(publishedClient)));
  urls.push(canonicalUrl(BrowserUrls.glossary));
  urls.push(canonicalUrl(BrowserUrls.blog));
  urls.push(...(await blogUrls(publishedClient)));

  urls.sort((a, b) => a.localeCompare(b));

  return urls;
}

async function articleUrls(publishedClient: AppPublishedDossierClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.getEntities({ entityTypes: ['Article'] }, paging),
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

async function blogUrls(publishedClient: AppPublishedDossierClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.getEntities({ entityTypes: ['BlogPost'] }, paging),
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
