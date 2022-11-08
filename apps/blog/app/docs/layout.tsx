import { FullscreenContainer, Menu } from '@jonasb/datadata-design';
import { MenuLinkItem } from '../../components/MenuLinkItem/MenuLinkItem';
import { NavBar } from '../../components/NavBar/NavBar';
import { urls } from '../../utils/PageUtils';
import { assertIsPublishedArticle } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['Article'], order: 'name' })
  ).valueOrThrow();

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="docs" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="2/12" padding={2}>
          <Menu>
            <Menu.List>
              {connection?.edges.map((edge) => {
                const entity = edge.node.valueOrThrow();
                assertIsPublishedArticle(entity);
                const isOverview = entity.fields.slug === 'overview';
                return (
                  <MenuLinkItem
                    key={entity.id}
                    href={urls.article(entity.fields.slug)}
                    activeSegments={isOverview ? [] : [entity.fields.slug]}
                  >
                    {entity.fields.title}
                  </MenuLinkItem>
                );
              })}
              <MenuLinkItem href={urls.glossary} activeSegments={['glossary']}>
                Glossary
              </MenuLinkItem>
            </Menu.List>
          </Menu>
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn width="4/12">
          {children}
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
    </FullscreenContainer>
  );
}
