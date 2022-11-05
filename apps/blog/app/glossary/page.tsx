import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import { Fragment } from 'react';
import { NavBar } from '../../components/NavBar/NavBar';
import { RichTextRenderer } from '../../components/RichTextRenderer/RichTextRenderer';
import { assertIsPublishedGlossaryTerm } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

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
        <FullscreenContainer.Row>
          {connection?.edges.map((edge) => {
            const entity = edge.node.valueOrThrow();
            assertIsPublishedGlossaryTerm(entity);
            return (
              <Fragment key={entity.id}>
                <a id={entity.fields.slug} />
                <Text as="h4" textStyle="headline4">
                  {entity.fields.title}
                </Text>
                <RichTextRenderer richText={entity.fields.description} />
              </Fragment>
            );
          })}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
