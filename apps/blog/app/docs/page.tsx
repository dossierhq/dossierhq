import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import Link from 'next/link.js';
import { Fragment } from 'react';
import { NavBar } from '../../components/NavBar/NavBar';
import { urls } from '../../utils/PageUtils';
import { assertIsPublishedArticle } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export default async function Page() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['Article'], order: 'name' })
  ).valueOrThrow();

  return (
    <>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.ScrollableRow>
          <FullscreenContainer.Row>
            {connection?.edges.map((edge) => {
              const entity = edge.node.valueOrThrow();
              assertIsPublishedArticle(entity);
              return (
                <Fragment key={entity.id}>
                  <Text as="h4" textStyle="headline4">
                    <Link href={urls.article(entity.fields.slug)}>{entity.fields.title}</Link>
                  </Text>
                </Fragment>
              );
            })}
            <Link href={urls.glossary}>Glossary</Link>
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      </FullscreenContainer>
    </>
  );
}
