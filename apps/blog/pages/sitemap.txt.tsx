import { getAllPagesForConnection } from '@dossierhq/core';
import type { GetServerSideProps } from 'next';
import { BrowserUrls } from '../utils/BrowserUrls';
import { setHeaderCacheControlPublic, setHeaderContentType } from '../utils/HandlerUtils';
import type { AppPublishedClient } from '../utils/SchemaTypes';
import { assertIsPublishedArticle } from '../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../utils/ServerComponentUtils';

export default function SitemapPage() {}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const publishedClient = await getPublishedClientForServerComponent();

  const hostname = 'https://www.dossierhq.dev';

  const urls: string[] = [];
  urls.push(hostname);

  urls.push(`${hostname}${BrowserUrls.docs}`);
  urls.push(...(await articleUrls(hostname, publishedClient)));
  urls.push(`${hostname}${BrowserUrls.glossary}`);

  urls.sort();

  setHeaderContentType(res, 'text/plain');
  setHeaderCacheControlPublic(res, 'hour');
  res.write(urls.join('\n') + '\n');
  res.end();

  return { props: {} };
};

async function articleUrls(hostname: string, publishedClient: AppPublishedClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.searchEntities({ entityTypes: ['Article'] }, paging)
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedArticle(node);
          result.push(`${hostname}${BrowserUrls.article(node.fields.slug)}`);
        }
      }
    }
  }
  return result;
}
