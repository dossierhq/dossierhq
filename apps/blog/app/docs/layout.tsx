import { assertIsDefined } from '@dossierhq/core';
import { FullscreenContainer, Menu } from '@dossierhq/design-ssr';
import { MenuLinkItem } from '../../components/MenuLinkItem/MenuLinkItem';
import { NavBar } from '../../components/NavBar/NavBar';
import { BrowserUrls } from '../../utils/BrowserUrls';
import type {
  AppPublishedExceptionClient,
  PublishedArticleTocItem,
  PublishedTocItem,
} from '../../utils/SchemaTypes';
import {
  assertIsPublishedArticle,
  assertIsPublishedChapter,
  isPublishedArticleTocItem,
} from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const publishedClient = (await getPublishedClientForServerComponent()).toExceptionClient();
  const connection = await publishedClient.searchEntities({ entityTypes: ['Chapter'] });

  //TODO for now we only support one chapter
  const chapter = connection?.edges[0].node.valueOrThrow() ?? null;
  assertIsDefined(chapter);
  if (connection?.edges.length !== 1) throw new Error('Expected exactly one chapter');
  assertIsPublishedChapter(chapter);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="docs" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="2/12" padding={2}>
          <Menu>
            <Menu.List>
              {chapter.fields.items.map((item, index) => {
                if (isPublishedArticleTocItem(item)) {
                  return (
                    // @ts-ignore TODO Typescript async components are not supported yet
                    <ArticleItem
                      key={item.article.id}
                      item={item}
                      publishedClient={publishedClient}
                    />
                  );
                } else {
                  return <ChapterItem key={index} item={item} publishedClient={publishedClient} />;
                }
              })}
              <Menu.Label>Reference</Menu.Label>
              <MenuLinkItem href={BrowserUrls.glossary} activeSegments={['glossary']}>
                Glossary
              </MenuLinkItem>
            </Menu.List>
          </Menu>
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn paddingBottom={5} paddingHorizontal={3}>
          {children}
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.Column width="2/12" />
      </FullscreenContainer.Columns>
    </FullscreenContainer>
  );
}

function ChapterItem({
  item,
  publishedClient,
}: {
  item: PublishedTocItem;
  publishedClient: AppPublishedExceptionClient;
}) {
  return (
    <>
      <Menu.Label>{item.title}</Menu.Label>
      {item.items.map((item, index) => {
        if (isPublishedArticleTocItem(item)) {
          return (
            // @ts-ignore TODO Typescript async components are not supported yet
            <ArticleItem key={item.article.id} item={item} publishedClient={publishedClient} />
          );
        } else {
          return <ChapterItem key={index} item={item} publishedClient={publishedClient} />;
        }
      })}
    </>
  );
}

async function ArticleItem({
  item,
  publishedClient,
}: {
  item: PublishedArticleTocItem;
  publishedClient: AppPublishedExceptionClient;
}) {
  const entity = await publishedClient.getEntity(item.article);
  assertIsPublishedArticle(entity);
  const isOverview = entity.fields.slug === 'overview';

  return (
    <MenuLinkItem
      key={entity.id}
      href={BrowserUrls.article(entity.fields.slug)}
      activeSegments={isOverview ? [] : [entity.fields.slug]}
    >
      {item.title}
    </MenuLinkItem>
  );
}
