import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import { Fragment } from 'react';
import { NavBar } from '../../components/NavBar/NavBar';
import { assertIsPublishedGlossaryTerm } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../ServerRichTextRenderer';

export default async function Page() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['GlossaryTerm'], order: 'name' })
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
              assertIsPublishedGlossaryTerm(entity);
              return (
                <Fragment key={entity.id}>
                  <Text id={entity.fields.slug} as="h4" textStyle="headline4">
                    {entity.fields.title}
                  </Text>
                  <ServerRichTextRenderer
                    richText={entity.fields.description}
                    publishedClient={publishedClient}
                    isGlossaryPage
                  />
                </Fragment>
              );
            })}
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      </FullscreenContainer>
    </>
  );
}
