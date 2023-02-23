import { Text } from '@dossierhq/design-ssr';
import type { Metadata } from 'next';
import { Fragment } from 'react';
import { assertIsPublishedGlossaryTerm } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';

export const metadata: Metadata = {
  title: 'Glossary',
};

export default async function Page() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['GlossaryTerm'], order: 'name' })
  ).valueOrThrow();

  return (
    <>
      <Text as="h1" textStyle="headline3">
        Glossary of Dossier specific terms
      </Text>
      {connection?.edges.map((edge) => {
        const entity = edge.node.valueOrThrow();
        assertIsPublishedGlossaryTerm(entity);
        return (
          <Fragment key={entity.id}>
            <Text id={entity.fields.slug} as="h2" textStyle="headline4">
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
    </>
  );
}
